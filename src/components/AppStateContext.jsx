import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { logger } from "@/components/logger";
import { useCollaboratorInviteCheck } from "@/components/CheckCollaboratorInvite";
import { withTimeout } from "@/components/utils/fetchWithTimeout";

const AppStateContext = createContext(null);

const AVATAR_CACHE_KEY = (email) => `balancen_avatar_${email}`;
const PHOTO_CACHE_KEY = (email) => `balancen_photo_${email}`;

// Read cached photo synchronously before any fetch
export function getCachedProfilePhoto(email) {
  if (!email) return null;
  return localStorage.getItem(PHOTO_CACHE_KEY(email)) || localStorage.getItem(AVATAR_CACHE_KEY(email)) || null;
}

export function AppStateProvider({ children }) {
  const [user, setUser] = useState(null);
  // Pre-seed profile with cached photo so UI never shows blank avatar on refresh
  const [profile, setProfile] = useState(undefined); // undefined = not yet loaded, null = no profile found
  const [friends, setFriends] = useState(null);
  const [groups, setGroups] = useState(null);
  const [todayMeals, setTodayMeals] = useState(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useCollaboratorInviteCheck(user);

  // Auth fetch - runs once. NEVER throws — 401 / network / timeout → user stays null.
  useEffect(() => {
    let isMounted = true;

    const fetchUser = async () => {
      try {
        const currentUser = await withTimeout(base44.auth.me(), 5000, 'AUTH_TIMEOUT');

        if (isMounted && currentUser?.email) {
          setUser(currentUser);
          // Immediately seed profile with cached photo so avatar shows before fetch
          const cachedPhoto = getCachedProfilePhoto(currentUser.email);
          if (cachedPhoto) {
            setProfile(prev => prev === undefined ? { profile_photo: cachedPhoto, avatar_url: cachedPhoto } : prev);
          }

          // Auto-grant owner role to app owner
          const normalizedEmail = currentUser.email.toLowerCase().trim();
          if (normalizedEmail === "imgonzaloa@gmail.com") {
            try {
              const profiles = await base44.entities.UserProfile.filter({ created_by: currentUser.email });
              if (profiles[0] && profiles[0].role !== "owner") {
                await base44.entities.UserProfile.update(profiles[0].id, {
                  role: "owner",
                  is_premium: true,
                  premium_source: "owner"
                });
              }
            } catch (_) {}
          }

          // Campus admin allowlist check
          try {
            const allowlist = await base44.entities.CampusAdminAllowlist.list();
            const isAdmin = allowlist.some(a => a.email === normalizedEmail && a.status === "active");
            if (isAdmin) {
              const profiles = await base44.entities.UserProfile.filter({ created_by: currentUser.email });
              const userProfile = profiles[0];
              if (userProfile && userProfile.role !== "owner" && userProfile.role !== "campus_admin") {
                await base44.entities.UserProfile.update(userProfile.id, {
                  role: "campus_admin",
                  is_premium: true,
                  premium_source: "collaborator_invite",
                });
              }
            }
          } catch (_) {}
        } else if (isMounted) {
          // No user returned (401 or null) — mark profile as settled immediately (no fetch needed)
          setProfile(null);
        }
      } catch (err) {
        // 401, timeout, network error — retry once after 2s before giving up
        logger.error('USER_FETCH_ERROR', err.message);
        await new Promise(resolve => setTimeout(resolve, 2000));
        if (!isMounted) return;
        try {
          const retryUser = await withTimeout(base44.auth.me(), 5000, 'AUTH_RETRY_TIMEOUT');
          if (isMounted && retryUser?.email) {
            setUser(retryUser);
          } else if (isMounted) {
            setProfile(null);
          }
        } catch (_) {
          if (isMounted) setProfile(null);
        }
      } finally {
        if (isMounted) setIsInitialized(true);
      }
    };

    fetchUser();
    return () => { isMounted = false; };
  }, []);

  // Profile fetch - runs ONCE when user email is first known
  useEffect(() => {
    if (!user?.email) return;

    let isMounted = true;

    const fetchProfile = async () => {
       try {
         const profiles = await withTimeout(
           base44.entities.UserProfile.filter({ created_by: user.email }),
           4000,
           'PROFILE_TIMEOUT'
         );
         if (isMounted) {
           const p = profiles[0] || null;
           setProfile(p);
           const photo = p?.profile_photo || p?.avatar_url;
           if (photo) {
             localStorage.setItem(AVATAR_CACHE_KEY(user.email), photo);
             localStorage.setItem(PHOTO_CACHE_KEY(user.email), photo);
           }
         }
       } catch (err) {
         console.error('[AppState] Profile fetch error:', err.message);
         if (isMounted) setProfile(prev => prev?.id ? prev : null);
       }
     };

    fetchProfile();
    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.email]); // ← only run when email changes, never re-run on profile updates

  const refreshProfile = useCallback(async () => {
     if (!user?.email) return;
     try {
       const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
       const p = profiles[0] || null;
       setProfile(p);
       const photo = p?.profile_photo || p?.avatar_url;
       if (photo) {
         localStorage.setItem(AVATAR_CACHE_KEY(user.email), photo);
         localStorage.setItem(PHOTO_CACHE_KEY(user.email), photo);
       }
     } catch (err) {
       console.error('[AppState] refreshProfile error:', err.message);
     }
   }, [user?.email]);

  const refreshFriends = useCallback(async () => {
     if (!user?.email) return;
     try {
       const friendsList = await base44.entities.Friend.filter({ created_by: user.email });
       setFriends(friendsList);
     } catch (err) {
       console.error('[AppState] refreshFriends error:', err.message);
     }
   }, [user?.email]);

  const refreshTodayMeals = useCallback(async () => {
    if (!user?.email) return;
    try {
      const today = new Date().toISOString().split("T")[0];
      const meals = await base44.entities.MealLog.list("-meal_time", 100);
      setTodayMeals(meals.filter(m => m.date === today && m.created_by === user.email));
    } catch (err) {
      setTodayMeals([]);
    }
  }, [user?.email]);

  // Expose getCachedAvatar for instant photo display
  const getCachedAvatar = useCallback((email) => {
    const key = email || user?.email;
    return localStorage.getItem(PHOTO_CACHE_KEY(key)) || localStorage.getItem(AVATAR_CACHE_KEY(key));
  }, [user?.email]);

  const value = {
    user,
    // undefined = still loading, null = loaded/not-found, object = loaded profile
    profile: profile === undefined ? null : profile,
    // profileLoading:
    //   - true if initialized (auth done) but profile still pending AND we have a user to fetch for
    //   - false immediately if no user (nothing to load)
    //   - false once profile settles (null or object)
    profileLoading: isInitialized ? (!!user?.email && profile === undefined) : false,
    friends,
    groups,
    todayMeals,
    isInitialized,
    setProfile,
    refreshProfile,
    refreshFriends,
    refreshTodayMeals,
    getCachedAvatar,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) throw new Error("useAppState must be used within AppStateProvider");
  return context;
}