import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { logger } from "@/components/logger";
import { useCollaboratorInviteCheck } from "@/components/CheckCollaboratorInvite";
import { withTimeout } from "@/components/utils/fetchWithTimeout";
import { debugLogger } from "@/components/DebugOverlay";

const AppStateContext = createContext(null);

export function AppStateProvider({ children }) {
  // ALL HOOKS AT TOP - ALWAYS CALLED UNCONDITIONALLY
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [friends, setFriends] = useState(null);
  const [groups, setGroups] = useState(null);
  const [todayMeals, setTodayMeals] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Check for collaborator invites
  useCollaboratorInviteCheck(user);

  // Simple auth fetch with timeout - NO redirects, NO boot logic (BootGate handles that)
  useEffect(() => {
    let isMounted = true;
    
    const fetchUser = async () => {
      try {
        const currentUser = await withTimeout(
          base44.auth.me(),
          3000,
          'AUTH_TIMEOUT'
        );
        
        if (isMounted && currentUser?.email) {
          setUser(currentUser);
          debugLogger.log('USER_LOADED', currentUser.email);
          
          // Auto-grant owner role to imgonzaloa@gmail.com
          if (currentUser.email.toLowerCase() === "imgonzaloa@gmail.com") {
            const profiles = await base44.entities.UserProfile.filter({ created_by: currentUser.email });
            if (profiles[0] && profiles[0].role !== "owner") {
              await base44.entities.UserProfile.update(profiles[0].id, {
                role: "owner",
                is_premium: true,
                premium_source: "owner"
              });
            }
          }
        } else if (isMounted) {
          debugLogger.log('USER_ANONYMOUS', 'No authenticated user');
        }
      } catch (err) {
        logger.error('USER_FETCH_ERROR', err);
        debugLogger.log('USER_FETCH_ERROR', err.message, { code: err.code || 'UNKNOWN' });
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    };

    fetchUser();
    
    return () => { isMounted = false; };
  }, []);

  // Data fetching with timeout - ONLY ONCE per user
  useEffect(() => {
    if (!user?.email || profile !== null) return;
    
    let isMounted = true;
    
    const fetchProfile = async () => {
      try {
        const profiles = await withTimeout(
          base44.entities.UserProfile.filter({ created_by: user.email }),
          3000,
          'PROFILE_TIMEOUT'
        );
        if (isMounted) {
          setProfile(profiles[0] || null);
          debugLogger.log('PROFILE_LOADED', profiles[0]?.display_name || 'none');
        }
      } catch (err) {
        debugLogger.log('PROFILE_FETCH_ERROR', err.message);
        if (isMounted) setProfile(null);
      }
    };

    fetchProfile();
    return () => { isMounted = false; };
  }, [user?.email, profile]);

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