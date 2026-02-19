import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { logger } from '@/components/logger';

/**
 * BootGate: Single source of truth for app state hydration.
 * Prevents flashing and onboarding loops with stable localStorage persistence.
 */

const STORAGE_KEYS = {
  LANGUAGE: 'i18nextLng',          // single source of truth for i18next
  ONBOARDING_COMPLETE: 'balancen_onboarding_complete'
};

export default function BootGate({ children }) {
  const [bootState, setBootState] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const resolveBoot = async () => {
      console.log('[BOOT] Starting hydration');

      try {
        // STEP 1: Hydrate from localStorage FIRST (synchronous, fast)
        const storedLanguage = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
        const storedOnboarding = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
        
        console.log('[BOOT] Hydrated:', { language: storedLanguage, onboardingComplete: storedOnboarding });

        // STEP 2: Check auth (with timeout)
        const authPromise = base44.auth.me();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 3000)
        );
        
        const user = await Promise.race([authPromise, timeoutPromise]);

        if (!isMounted) return;

        if (!user?.email) {
          console.log('[BOOT] Not authenticated');
          if (isMounted) {
            setBootState({ 
              type: 'AUTH_REQUIRED',
              isHydrated: true,
              language: storedLanguage || 'en',
              onboardingComplete: storedOnboarding === 'true'
            });
          }
          return;
        }

        // STEP 3: If we have cached completion, trust it (no profile fetch needed)
        if (storedOnboarding === 'true' && storedLanguage) {
          console.log('[BOOT] Using cached completion state');
          if (isMounted) {
            setBootState({
              type: 'HOME_READY',
              user,
              isHydrated: true,
              language: storedLanguage,
              onboardingComplete: true,
            });
          }
          return;
        }

        // STEP 4: No cache or incomplete - fetch profile
        console.log('[BOOT] Fetching profile for verification');
        const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
        const profile = profiles?.[0];

        if (!isMounted) return;

        if (!profile || !profile.onboarding_completed) {
          console.log('[BOOT] Onboarding required');
          // Clear stale cache
          localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
          
          if (isMounted) {
            setBootState({
              type: 'ONBOARDING_REQUIRED',
              user,
              profile,
              isHydrated: true,
              language: profile?.language || storedLanguage || 'en',
              onboardingComplete: false,
            });
          }
          return;
        }

        // STEP 5: Profile confirms completion - persist and proceed
        console.log('[BOOT] Profile confirmed complete');
        localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
        localStorage.setItem(STORAGE_KEYS.LANGUAGE, profile.language);
        
        if (isMounted) {
          setBootState({
            type: 'HOME_READY',
            user,
            profile,
            isHydrated: true,
            language: profile.language,
            onboardingComplete: true,
          });
        }
      } catch (err) {
        console.error('[BOOT] Error:', err);
        if (isMounted) {
          setBootState({ 
            type: 'AUTH_REQUIRED',
            isHydrated: true,
            language: localStorage.getItem(STORAGE_KEYS.LANGUAGE) || 'en',
            onboardingComplete: false
          });
        }
      }
    };

    resolveBoot();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Render NOTHING until hydrated
  if (!bootState || !bootState.isHydrated) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center" style={{ paddingTop: 'env(safe-area-inset-top, 0)', pointerEvents: 'none', zIndex: 9999 }}>
        <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center border-2 border-white shadow-2xl">
          <span className="text-5xl font-black text-white">B</span>
        </div>
      </div>
    );
  }

  return children({ bootState });
}