import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { logger } from "@/components/logger";

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
      logger.log('AUTH_CHECK_START');
      
      // Check localStorage first (instant, prevents loops)
      const savedOnboarding = localStorage.getItem('onboarding_completed');
      
      const timeout = setTimeout(() => {
        logger.log('AUTH_CHECK_TIMEOUT');
        setUser(null);
        setIsInitialized(true);
      }, 5000);
      
      try {
        const currentUser = await base44.auth.me();
        clearTimeout(timeout);
        setUser(currentUser);
        logger.log('AUTH_CHECK_SUCCESS', { email: currentUser?.email });
        
        if (currentUser?.email) {
          // Quick check: if localStorage says onboarding done, skip DB check
          if (savedOnboarding === 'true') {
            logger.log('ONBOARDING_COMPLETED_CACHED');
            setIsInitialized(true);
            return;
          }
          
          const profiles = await base44.entities.UserProfile.filter({ created_by: currentUser.email });
          const profile = profiles?.[0];
          
          // No profile = new user, go to language selector
          if (!profile) {
            logger.log('NEW_USER_REDIRECT_TO_LANGUAGE');
            window.location.href = '/LanguageSelector';
            return;
          }
          
          // Profile exists but onboarding NOT completed
          if (!profile.onboarding_completed) {
            logger.log('ONBOARDING_NOT_COMPLETED');
            localStorage.removeItem('onboarding_completed'); // Ensure flag is cleared
            window.location.href = '/Onboarding';
            return;
          }
          
          // Onboarding completed: set flag and proceed
          localStorage.setItem('onboarding_completed', 'true');
          logger.log('ONBOARDING_COMPLETED_PROCEED_HOME');
        }
      } catch (err) {
        clearTimeout(timeout);
        logger.error('AUTH_CHECK_ERROR', err);
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