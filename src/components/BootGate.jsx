import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * BootGate: hydrates auth state before rendering the app.
 *
 * - NEVER throws on 401 / network errors — treats them as "unauthenticated"
 * - Reads localStorage for language + onboarding FIRST (sync, instant)
 * - Auth check has a 4-second timeout to avoid infinite spinner
 */

const STORAGE_KEYS = {
  LANGUAGE: 'i18nextLng',
  ONBOARDING_COMPLETE: 'balancen_onboarding_complete',
};

async function safeAuthCheck() {
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 4000)
    );
    const user = await Promise.race([base44.auth.me(), timeout]);
    return user?.email ? user : null;
  } catch (_) {
    // 401, network error, timeout — treat as unauthenticated, do NOT throw
    return null;
  }
}

export default function BootGate({ children }) {
  const [bootState, setBootState] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const resolveBoot = async () => {
      // STEP 1: Sync reads from localStorage (instant)
      const storedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
      const storedOnboarding = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';

      // STEP 2: Check auth without throwing
      const user = await safeAuthCheck();

      if (!isMounted) return;

      if (!user) {
        // Not authenticated — show language selector or login
        setBootState({
          type: 'AUTH_REQUIRED',
          isHydrated: true,
          user: null,
          language: storedLanguage || 'en',
          onboardingComplete: storedOnboarding,
        });
        return;
      }

      // STEP 3: Authenticated + cached onboarding done → go straight to app
      if (storedOnboarding && storedLanguage) {
        setBootState({
          type: 'HOME_READY',
          isHydrated: true,
          user,
          language: storedLanguage,
          onboardingComplete: true,
        });
        return;
      }

      // STEP 4: Authenticated but no cache — fetch profile to determine state
      let profile = null;
      try {
        const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
        profile = profiles?.[0] || null;
      } catch (_) {
        // Profile fetch failed — treat as new user, don't crash
        profile = null;
      }

      if (!isMounted) return;

      if (!profile || !profile.onboarding_completed) {
        // New user or onboarding incomplete — clear stale flag
        localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
        const hasLanguage = !!(profile?.language || storedLanguage);

        setBootState({
          type: hasLanguage ? 'ONBOARDING_REQUIRED' : 'LANGUAGE_REQUIRED',
          isHydrated: true,
          user,
          profile,
          language: profile?.language || storedLanguage || 'en',
          onboardingComplete: false,
        });
        return;
      }

      // STEP 5: Profile confirmed complete — persist and proceed
      const lang = profile.language || storedLanguage || 'en';
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
      localStorage.setItem('i18nextLng', lang);
      localStorage.setItem('balancen_lang', lang);
      localStorage.setItem('app_language', lang);

      if (isMounted) {
        setBootState({
          type: 'HOME_READY',
          isHydrated: true,
          user,
          profile,
          language: lang,
          onboardingComplete: true,
        });
      }
    };

    resolveBoot();
    return () => { isMounted = false; };
  }, []);

  if (!bootState?.isHydrated) {
    return (
      <div
        className="fixed inset-0 bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center"
        style={{ paddingTop: 'env(safe-area-inset-top, 0)', zIndex: 9999 }}
      >
        <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center border-2 border-white shadow-2xl">
          <span className="text-5xl font-black text-white">B</span>
        </div>
      </div>
    );
  }

  return children({ bootState });
}