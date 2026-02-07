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
    const initUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (err) {
        console.error("Error initializing user:", err);
        setUser(null);
      } finally {
        setIsInitialized(true);
      }
    };

    initUser();
  }, []);

  // Parallel data fetching when user loads
  useEffect(() => {
    if (!user?.email) return;
    
    // Fetch all data in parallel for speed
    Promise.all([
      base44.entities.UserProfile.filter({ created_by: user.email })
        .then(profiles => setProfile(profiles[0] || null))
        .catch(() => setProfile(null)),
      
      base44.entities.Friend.filter({ created_by: user.email })
        .then(friendsList => setFriends(friendsList))
        .catch(() => setFriends([])),
      
      base44.entities.MealLog.filter(
        { created_by: user.email, date: new Date().toISOString().split("T")[0] },
        "-meal_time"
      ).then(setTodayMeals)
        .catch(() => setTodayMeals([]))
    ]);
  }, [user?.email]);

  const refreshProfile = async () => {
    if (!user?.email) return;
    try {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      setProfile(profiles[0] || null);
    } catch (err) {
      console.error("Error refreshing profile:", err);
    }
  };

  const refreshFriends = async () => {
    if (!user?.email) return;
    try {
      const friendsList = await base44.entities.Friend.filter({ created_by: user.email });
      setFriends(friendsList);
    } catch (err) {
      console.error("Error refreshing friends:", err);
    }
  };

  const refreshTodayMeals = async () => {
    if (!user?.email) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const meals = await base44.entities.MealLog.filter(
        { created_by: user.email, date: today },
        "-meal_time"
      );
      setTodayMeals(meals);
    } catch (err) {
      console.error("Error refreshing meals:", err);
      setTodayMeals([]);
    }
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