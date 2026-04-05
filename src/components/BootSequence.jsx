import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { SafeBootManager } from './SafeBootManager';
import { getLocalLanguage } from '@/lib/language';

/**
 * BootSequence: Single source of truth for app initialization
 * Prevents flashing, loops, and double-renders
 */

export function useBootSequence() {
  const [bootState, setBootState] = useState({
    stage: 'INIT', // INIT -> LOADING -> READY | ERROR
    isAuthenticated: false,
    hasProfile: false,
    onboardingCompleted: false,
    language: null,
    safeMode: SafeBootManager.isInSafeMode(),
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function boot() {
      try {
        setBootState(prev => ({ ...prev, stage: 'LOADING' }));

        // Step 1: Check authentication (with timeout)
        const authTimeout = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 5000)
        );
        
        let user = null;
        let isAuth = false;
        
        try {
          isAuth = await Promise.race([
            base44.auth.isAuthenticated(),
            authTimeout
          ]);
          
          if (isAuth) {
            user = await Promise.race([
              base44.auth.me(),
              authTimeout
            ]);
          }
        } catch (authError) {
          console.warn('[BOOT] Auth check failed:', authError);
          // Continue in unauthenticated mode
        }

        if (!isMounted) return;

        // Step 2: Load persisted state
        const persistedOnboarding = localStorage.getItem('balancen_onboarding_complete') === 'true';
        const persistedLanguage = getLocalLanguage() || null;

        // Step 3: If authenticated, check profile
        let hasProfile = false;
        let language = persistedLanguage;

        if (isAuth && user?.email) {
          try {
            const profileTimeout = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Profile timeout')), 5000)
            );
            
            const profiles = await Promise.race([
              base44.entities.UserProfile.filter({ created_by: user.email }),
              profileTimeout
            ]);
            
            if (profiles.length > 0) {
              hasProfile = true;
              // Use profile language if available
              if (profiles[0].language) {
                language = profiles[0].language;
              }
            }
          } catch (profileError) {
            console.warn('[BOOT] Profile check failed:', profileError);
            // Safe mode on API failure
            SafeBootManager.enterSafeMode('Profile API failed');
          }
        }

        if (!isMounted) return;

        // Step 4: Determine final boot state
        const finalState = {
          stage: 'READY',
          isAuthenticated: isAuth,
          hasProfile,
          onboardingCompleted: persistedOnboarding,
          language,
          safeMode: SafeBootManager.isInSafeMode(),
          error: null,
        };

        setBootState(finalState);

        // Clear crash log if boot succeeded
        if (!SafeBootManager.isInSafeMode()) {
          SafeBootManager.clearCrashLog();
        }

      } catch (error) {
        console.error('[BOOT] Critical error:', error);
        SafeBootManager.recordCrash();
        
        if (isMounted) {
          setBootState({
            stage: 'ERROR',
            isAuthenticated: false,
            hasProfile: false,
            onboardingCompleted: false,
            language: getLocalLanguage(),
            safeMode: true,
            error: error.message,
          });
        }
      }
    }

    boot();

    return () => {
      isMounted = false;
    };
  }, []);

  return bootState;
}