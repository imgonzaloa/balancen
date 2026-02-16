import React, { createContext, useContext, useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { logger } from "@/components/logger";
import { useCollaboratorInviteCheck } from "@/components/CheckCollaboratorInvite";

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

  // Simple auth fetch - NO redirects, NO boot logic (BootGate handles that)
  useEffect(() => {
    let isMounted = true;
    
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (isMounted && currentUser?.email) {
          setUser(currentUser);
          
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
        }
      } catch (err) {
        logger.error('USER_FETCH_ERROR', err);
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    };

    fetchUser();
    
    return () => { isMounted = false; };
  }, []);

  // Data fetching - ONLY ONCE per user with staggered loading
  useEffect(() => {
    if (!user?.email || profile !== null) return; // Skip if already loaded
    
    let isMounted = true;
    
    // Fetch profile ONLY - others load on demand per page
    base44.entities.UserProfile.filter({ created_by: user.email })
      .then(profiles => { 
        if (isMounted) {
          setProfile(profiles[0] || null);
        }
      })
      .catch(() => { if (isMounted) setProfile(null); });

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