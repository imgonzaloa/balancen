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

  // Initialize user on mount with timeout
  useEffect(() => {
    const initUser = async () => {
      const timeout = setTimeout(() => {
        console.warn('[APP_STATE] Auth check timeout');
        setUser(null);
        setIsInitialized(true);
      }, 3000);
      
      try {
        const currentUser = await base44.auth.me();
        clearTimeout(timeout);
        setUser(currentUser);
      } catch (err) {
        clearTimeout(timeout);
        console.error("Error initializing user:", err);
        setUser(null);
      } finally {
        setIsInitialized(true);
      }
    };

    initUser();
  }, []);

  // Parallel data fetching when user loads with timeout
  useEffect(() => {
    if (!user?.email) return;
    
    const fetchWithTimeout = (promise, timeoutMs = 10000) => {
      return Promise.race([
        promise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), timeoutMs)
        )
      ]);
    };
    
    // Fetch all data in parallel for speed
    Promise.all([
      fetchWithTimeout(
        base44.entities.UserProfile.filter({ created_by: user.email })
      ).then(profiles => setProfile(profiles[0] || null))
        .catch((err) => {
          console.warn('[APP_STATE] Profile fetch failed', err);
          setProfile(null);
        }),
      
      fetchWithTimeout(
        base44.entities.Friend.filter({ created_by: user.email })
      ).then(friendsList => setFriends(friendsList))
        .catch((err) => {
          console.warn('[APP_STATE] Friends fetch failed', err);
          setFriends([]);
        }),
      
      fetchWithTimeout(
        base44.entities.MealLog.filter(
          { created_by: user.email, date: new Date().toISOString().split("T")[0] },
          "-meal_time"
        )
      ).then(setTodayMeals)
        .catch((err) => {
          console.warn('[APP_STATE] Meals fetch failed', err);
          setTodayMeals([]);
        })
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