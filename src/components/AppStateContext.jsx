import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState(null);
  const [groups, setGroups] = useState(null);
  const [todayMeals, setTodayMeals] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize user on mount
  useEffect(() => {
    base44.auth.me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setIsInitialized(true));
  }, []);

  // Fetch profile when user is available
  useEffect(() => {
    if (!user?.email || profile !== null) return;
    
    base44.entities.UserProfile.filter({ created_by: user.email })
      .then(profiles => setProfile(profiles[0] || null))
      .catch(() => setProfile(null));
  }, [user?.email]);

  // Fetch friends when user is available
  useEffect(() => {
    if (!user?.email || friends !== null) return;
    
    Promise.all([
      base44.entities.Friend.filter({ created_by: user.email }),
    ]).then(([friendsList]) => {
      setFriends(friendsList);
    }).catch(() => setFriends([]));
  }, [user?.email]);

  // Fetch today's meals when user is available
  useEffect(() => {
    if (!user?.email || todayMeals !== null) return;
    
    const today = new Date().toISOString().split("T")[0];
    base44.entities.MealLog.filter(
      { created_by: user.email, date: today },
      "-meal_time"
    ).then(setTodayMeals)
      .catch(() => setTodayMeals([]));
  }, [user?.email]);

  const refreshProfile = async () => {
    if (!user?.email) return;
    const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
    setProfile(profiles[0] || null);
  };

  const refreshFriends = async () => {
    if (!user?.email) return;
    const friendsList = await base44.entities.Friend.filter({ created_by: user.email });
    setFriends(friendsList);
  };

  const refreshTodayMeals = async () => {
    if (!user?.email) return;
    const today = new Date().toISOString().split("T")[0];
    const meals = await base44.entities.MealLog.filter(
      { created_by: user.email, date: today },
      "-meal_time"
    );
    setTodayMeals(meals);
  };

  const value = {
    user,
    profile,
    friends,
    groups,
    todayMeals,
    isInitialized,
    refreshProfile,
    refreshFriends,
    refreshTodayMeals,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within AppStateProvider");
  }
  return context;
}