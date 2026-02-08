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
      
      // Load persisted state immediately (no flashing)
      const savedOnboarding = localStorage.getItem('onboarding_completed');
      const savedLanguage = localStorage.getItem('app_language');
      
      const timeout = setTimeout(() => {
        logger.log('AUTH_CHECK_TIMEOUT');
        setUser(null);
        setIsInitialized(true);
      }, 5000);
      
      try {
        const currentUser = await base44.auth.me();
        clearTimeout(timeout);
        
        if (!currentUser) {
          // Not authenticated: stay on login
          setIsInitialized(true);
          return;
        }
        
        setUser(currentUser);
        logger.log('AUTH_CHECK_SUCCESS', { email: currentUser.email });
        
        // Quick path: cached onboarding flag means user is fully set up
        if (savedOnboarding === 'true') {
          logger.log('BOOT_ONBOARDING_CACHED');
          setIsInitialized(true);
          return;
        }
        
        // Fetch profile (authoritative state)
        const profiles = await base44.entities.UserProfile.filter({ created_by: currentUser.email });
        const profile = profiles?.[0];
        
        // New user: ZERO DB profile
        if (!profile) {
          logger.log('BOOT_NEW_USER_NEEDS_LANGUAGE');
          // Create minimal profile with default language
          try {
            const defaultLang = savedLanguage || 'en';
            await base44.entities.UserProfile.create({
              display_name: currentUser.full_name || 'User',
              language: defaultLang,
              onboarding_completed: false,
            });
            // Will redirect to Onboarding in next render
            window.location.href = '/Onboarding';
          } catch (createErr) {
            logger.error('PROFILE_CREATE_FAILED', createErr);
            window.location.href = '/Onboarding';
          }
          return;
        }
        
        // Profile exists: check onboarding
        if (!profile.onboarding_completed) {
          logger.log('BOOT_ONBOARDING_INCOMPLETE');
          localStorage.removeItem('onboarding_completed');
          window.location.href = '/Onboarding';
          return;
        }
        
        // Fully set up: go to Home
        localStorage.setItem('onboarding_completed', 'true');
        if (!savedLanguage && profile.language) {
          localStorage.setItem('app_language', profile.language);
        }
        logger.log('BOOT_FULLY_INITIALIZED');
        setIsInitialized(true);
      } catch (err) {
        clearTimeout(timeout);
        logger.error('AUTH_CHECK_ERROR', err);
        setUser(null);
        setIsInitialized(true);
      }
    };

    initUser();
  }, []);

  // Parallel data fetching when user loads with timeout
  useEffect(() => {
    if (!user?.email) return;
    
    let isMounted = true; // Prevent state updates after unmount
    
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
      ).then(profiles => {
        if (isMounted) setProfile(profiles[0] || null);
      }).catch((err) => {
        console.warn('[APP_STATE] Profile fetch failed', err);
        if (isMounted) setProfile(null);
      }),
      
      fetchWithTimeout(
        base44.entities.Friend.filter({ created_by: user.email })
      ).then(friendsList => {
        if (isMounted) setFriends(friendsList);
      }).catch((err) => {
        console.warn('[APP_STATE] Friends fetch failed', err);
        if (isMounted) setFriends([]);
      }),
      
      fetchWithTimeout(
        base44.entities.MealLog.filter(
          { created_by: user.email, date: new Date().toISOString().split("T")[0] },
          "-meal_time"
        )
      ).then(meals => {
        if (isMounted) setTodayMeals(meals);
      }).catch((err) => {
        console.warn('[APP_STATE] Meals fetch failed', err);
        if (isMounted) setTodayMeals([]);
      })
    ]);

    return () => {
      isMounted = false;
    };
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