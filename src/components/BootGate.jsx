import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

function SplashScreen() {
  const [logoVisible, setLogoVisible] = React.useState(false);
  const [textVisible, setTextVisible] = React.useState(false);

  React.useEffect(() => {
    const t1 = setTimeout(() => setLogoVisible(true), 200);
    const t2 = setTimeout(() => setTextVisible(true), 400);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  // Use the exact same icon SVG as the app icon — black square, white B, rounded corners
  const iconSize = Math.round(Math.min(window.innerWidth, 430) * 0.4);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgb(15 23 42)', // same as #root background in globals.css
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        paddingTop: 'env(safe-area-inset-top, 0)',
      }}
    >
      {/* Logo — exact app icon asset */}
      <div style={{
        transition: 'opacity 300ms ease',
        opacity: logoVisible ? 1 : 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        <svg
          width={iconSize}
          height={iconSize}
          viewBox="0 0 192 192"
          xmlns="http://www.w3.org/2000/svg"
          style={{ borderRadius: `${iconSize * 0.22}px`, display: 'block' }}
        >
          <rect width="192" height="192" fill="#0B0B0B" rx="32" />
          <text
            x="96"
            y="132"
            fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
            fontSize="126"
            fontWeight="800"
            fill="#FFFFFF"
            textAnchor="middle"
            dominantBaseline="auto"
          >B</text>
        </svg>
      </div>

      {/* Tagline */}
      <p style={{
        transition: 'opacity 300ms ease',
        opacity: textVisible ? 0.85 : 0,
        color: '#ffffff',
        fontSize: '17px',
        fontWeight: 500,
        marginTop: '20px',
        letterSpacing: '0.01em',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}>
        Stay consistent.
      </p>
    </div>
  );
}

/**
 * BootGate: hydrates auth state before rendering the app.
 *
 * RULES:
 * - NEVER throws on 401 / network / timeout — treats them as "unauthenticated"
 * - Reads localStorage for language + onboarding FIRST (sync, instant)
 * - Auth check has a 5-second timeout to avoid infinite spinner
 * - Does NOT call /User/me or any protected endpoint without a confirmed auth token
 * - Does NOT redirect to Paywall — that is TrialGate's job
 */

const STORAGE_KEYS = {
  LANGUAGE: 'i18nextLng',
  ONBOARDING_COMPLETE: 'balancen_onboarding_complete',
};

async function safeAuthCheck() {
  try {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Auth timeout')), 5000)
    );
    const user = await Promise.race([base44.auth.me(), timeout]);
    return user?.email ? user : null;
  } catch (err) {
    // 401, network error, timeout — treat as unauthenticated, do NOT throw
    console.log('[BootGate] Auth check failed (treating as unauthenticated):', err.message);
    return null;
  }
}

const SPLASH_DURATION = 2000; // ms — full splash for logged-in users

export default function BootGate({ children }) {
  const [bootState, setBootState] = useState(null);
  const [splashDone, setSplashDone] = useState(false);
  const pendingStateRef = React.useRef(null);

  useEffect(() => {
    let isMounted = true;

    // Start splash timer — for authenticated users we wait the full 2s
    const splashTimer = setTimeout(() => {
      if (!isMounted) return;
      setSplashDone(true);
      // If boot already resolved while splash was showing, apply it now
      if (pendingStateRef.current) {
        setBootState(pendingStateRef.current);
        pendingStateRef.current = null;
      }
    }, SPLASH_DURATION);

    const applyState = (state) => {
      if (!isMounted) return;
      if (state.type === 'AUTH_REQUIRED') {
        // Not logged in — skip splash, go straight to login
        clearTimeout(splashTimer);
        setSplashDone(true);
        setBootState(state);
      } else if (splashDone) {
        setBootState(state);
      } else {
        // Logged in but splash still showing — queue it
        pendingStateRef.current = state;
      }
    };

    const resolveBoot = async () => {
      // STEP 1: Sync reads from localStorage (instant)
      const storedLanguage = (
        localStorage.getItem(STORAGE_KEYS.LANGUAGE) ||
        localStorage.getItem('balancen_lang') ||
        localStorage.getItem('app_language') ||
        null
      );
      const storedOnboarding = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';

      // STEP 2: Check auth
      const user = await safeAuthCheck();
      if (!isMounted) return;

      if (!user) {
        applyState({
          type: 'AUTH_REQUIRED',
          isHydrated: true,
          user: null,
          language: storedLanguage || 'en',
          onboardingComplete: storedOnboarding,
        });
        return;
      }

      // STEP 3: Authenticated + locally cached as done
      if (storedOnboarding && storedLanguage) {
        applyState({
          type: 'HOME_READY',
          isHydrated: true,
          user,
          language: storedLanguage,
          onboardingComplete: true,
        });
        return;
      }

      // STEP 4: Fetch profile
      let profile = null;
      try {
        const profiles = await Promise.race([
          base44.entities.UserProfile.filter({ created_by: user.email }),
          new Promise((_, reject) => setTimeout(() => reject(new Error('Profile timeout')), 5000))
        ]);
        profile = profiles?.[0] || null;
      } catch (err) {
        console.warn('[BootGate] Profile fetch failed:', err.message);
        profile = null;
      }

      if (!isMounted) return;

      if (!profile || !profile.onboarding_completed) {
        localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
        const effectiveLang = profile?.language || storedLanguage;
        applyState({
          type: effectiveLang ? 'ONBOARDING_REQUIRED' : 'LANGUAGE_REQUIRED',
          isHydrated: true,
          user,
          profile,
          language: effectiveLang || 'en',
          onboardingComplete: false,
        });
        return;
      }

      const lang = profile.language || storedLanguage || 'en';
      localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
      localStorage.setItem('i18nextLng', lang);
      localStorage.setItem('balancen_lang', lang);
      localStorage.setItem('balancen.lang', lang);
      localStorage.setItem('app_language', lang);

      applyState({
        type: 'HOME_READY',
        isHydrated: true,
        user,
        profile,
        language: lang,
        onboardingComplete: true,
      });
    };

    resolveBoot();
    return () => {
      isMounted = false;
      clearTimeout(splashTimer);
    };
  }, []);

  if (!bootState?.isHydrated) {
    return <SplashScreen />;
  }

  return children({ bootState });
}