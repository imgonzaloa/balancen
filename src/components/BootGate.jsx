import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { logger } from '@/components/logger';

/**
 * BootGate: THE ONLY authoritative entry point.
 * Blocks ALL rendering until boot state is fully resolved.
 * No screen flashes, no loops, no intermediate mounts.
 */

export default function BootGate({ children }) {
  const [bootState, setBootState] = useState(null);
  const [bootReady, setBootReady] = useState(false);

  useEffect(() => {
    const resolveBoot = async () => {
      logger.log('BOOT_START');

      // Step 1: Check auth (with timeout)
      let user = null;
      try {
        const authPromise = base44.auth.me();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );
        user = await Promise.race([authPromise, timeoutPromise]);
      } catch (err) {
        logger.log('BOOT_NOT_AUTHENTICATED');
        setBootState({ type: 'AUTH_REQUIRED' });
        setBootReady(true);
        return;
      }

      if (!user?.email) {
        logger.log('BOOT_NO_USER');
        setBootState({ type: 'AUTH_REQUIRED' });
        setBootReady(true);
        return;
      }

      // Step 2: Load persisted flags (instant, no DB call)
      const cachedOnboarding = localStorage.getItem('onboarding_completed');
      const cachedLanguage = localStorage.getItem('app_language');

      // Quick path: if cache says onboarding done, go straight to Home
      if (cachedOnboarding === 'true' && cachedLanguage) {
        logger.log('BOOT_CACHED_READY', { language: cachedLanguage });
        setBootState({
          type: 'HOME_READY',
          user,
          language: cachedLanguage,
          onboardingComplete: true,
        });
        setBootReady(true);
        return;
      }

      // Step 3: Fetch profile (authoritative source of truth)
      let profile = null;
      try {
        const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
        profile = profiles?.[0];
      } catch (err) {
        logger.error('BOOT_PROFILE_FETCH_ERROR', err);
      }

      // Step 4: Determine boot state
      if (!profile) {
        // New user: goes directly to onboarding (language selection is step 0)
        logger.log('BOOT_NEW_USER_NEEDS_ONBOARDING');
        setBootState({ type: 'ONBOARDING_REQUIRED', user, language: cachedLanguage || 'en' });
        setBootReady(true);
        return;
      }



      if (!profile.onboarding_completed) {
        logger.log('BOOT_NEEDS_ONBOARDING');
        // Cache language but NOT onboarding
        localStorage.setItem('app_language', profile.language);
        localStorage.removeItem('onboarding_completed');
        setBootState({
          type: 'ONBOARDING_REQUIRED',
          user,
          profile,
          language: profile.language,
        });
        setBootReady(true);
        return;
      }

      // Fully set up: cache flags and go to Home
      localStorage.setItem('onboarding_completed', 'true');
      localStorage.setItem('app_language', profile.language);
      logger.log('BOOT_READY', { language: profile.language });
      setBootState({
        type: 'HOME_READY',
        user,
        profile,
        language: profile.language,
        onboardingComplete: true,
      });
      setBootReady(true);
    };

    resolveBoot();
  }, []);

  // Render NOTHING until boot is resolved
  if (!bootReady || !bootState) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center" style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}>
        <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center border-2 border-white shadow-2xl">
          <span className="text-5xl font-black text-white">B</span>
        </div>
      </div>
    );
  }

  // No debug bar in production
  return children({ bootState });
}