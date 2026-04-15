import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { getLocalLanguage, setLocalLanguage, resolveLanguage } from '@/lib/language';

// Global error handler for iPad/Capacitor crashes — only log, never destroy DOM
if (typeof window !== 'undefined') {
  window.onerror = function(msg, src, line, col, err) {
    console.error('[BootGate] Caught error:', msg, 'at', src, ':', line);
    return false; // let browser handle normally, don't swallow
  };

  window.addEventListener('unhandledrejection', (event) => {
    console.error('[BootGate] Unhandled rejection:', event.reason);
    // Don't preventDefault or destroy DOM — just log
  });
}

// ─── Phrases ────────────────────────────────────────────────────────────────

const SPLASH_PHRASES = [
  'Win today, repeat tomorrow',
  'Keep your streak alive',
  'Your future self is watching',
  'One good choice leads to another',
  'Consistency beats motivation',
  "Don't negotiate with excuses",
  'Eat like you care about yourself',
  "You don't need perfect, you need done",
  'Stay on plan — results follow',
  "Show up even when it's boring",
];

const PHRASES_HISTORY_KEY = 'balancen_splash_phrases_used';

function getNextPhrase() {
  let used = [];
  try {
    used = JSON.parse(localStorage.getItem(PHRASES_HISTORY_KEY) || '[]');
  } catch (_) { used = []; }
  if (used.length >= SPLASH_PHRASES.length) used = [];
  const remaining = SPLASH_PHRASES.filter((_, i) => !used.includes(i));
  const idx = SPLASH_PHRASES.indexOf(remaining[Math.floor(Math.random() * remaining.length)]);
  used.push(idx);
  localStorage.setItem(PHRASES_HISTORY_KEY, JSON.stringify(used));
  return SPLASH_PHRASES[idx];
}

// ─── Splash Overlay ──────────────────────────────────────────────────────────

const SPLASH_BG = 'linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #065f46 100%)';
const MIN_SPLASH_MS = 1500;

function SplashOverlay({ visible }) {
  const [logoVisible, setLogoVisible] = useState(false);
  const [textVisible, setTextVisible] = useState(false);
  const [phrase] = useState(() => getNextPhrase());

  useEffect(() => {
    const t1 = setTimeout(() => setLogoVisible(true), 150);
    const t2 = setTimeout(() => setTextVisible(true), 350);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const iconSize = Math.round(Math.min(window.innerWidth, 430) * 0.42);

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: SPLASH_BG,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        paddingTop: 'env(safe-area-inset-top, 0)',
        transition: 'opacity 400ms ease',
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      {/* Logo */}
      <div style={{ transition: 'opacity 300ms ease', opacity: logoVisible ? 1 : 0 }}>
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

      {/* Dynamic phrase */}
      <p style={{
        transition: 'opacity 300ms ease',
        opacity: textVisible ? 0.85 : 0,
        color: '#ffffff',
        fontSize: '17px',
        fontWeight: 500,
        marginTop: '26px',
        letterSpacing: '0.01em',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        textAlign: 'center',
        padding: '0 24px',
      }}>
        {phrase}
      </p>
    </div>
  );
}

// ─── Boot Logic ──────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
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
    console.log('[BootGate] Auth check failed (treating as unauthenticated):', err.message);
    return null;
  }
}

function ErrorFallbackScreen({ onRetry }) {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    setTimeout(() => {
      window.location.reload();
    }, 300);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: SPLASH_BG,
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      paddingTop: 'env(safe-area-inset-top, 0)',
    }}>
      {/* Logo */}
      <svg
        width={120}
        height={120}
        viewBox="0 0 192 192"
        xmlns="http://www.w3.org/2000/svg"
        style={{ borderRadius: '32px', marginBottom: '24px' }}
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

      {/* Loading text */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '40px' }}>
        <p style={{
          color: '#ffffff',
          fontSize: '16px',
          fontWeight: 500,
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}>Cargando...</p>
        <div style={{
          width: '16px',
          height: '16px',
          border: '2px solid rgba(255,255,255,0.3)',
          borderTop: '2px solid #14b8a6',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite',
        }} />
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

export default function BootGate({ children }) {
  const [bootState, setBootState] = useState(null);
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashGone, setSplashGone] = useState(false);
  const [bootError, setBootError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const minTimeElapsed = useRef(false);
  const bootResolved = useRef(false);
  const bootStateRef = useRef(null);

  // Attempt to hide splash only when BOTH conditions are met
  const tryHideSplash = () => {
    if (minTimeElapsed.current && bootResolved.current) {
      setSplashVisible(false);
      setTimeout(() => setSplashGone(true), 420); // remove from DOM after fade
    }
  };

  useEffect(() => {
    // Minimum splash time
    const minTimer = setTimeout(() => {
      minTimeElapsed.current = true;
      tryHideSplash();
    }, MIN_SPLASH_MS);

    const resolveBoot = async () => {
      try {
        const storedLanguage = getLocalLanguage();
        const storedOnboarding = localStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE) === 'true';

        const user = await safeAuthCheck();

        if (!user) {
          // Not logged in — skip splash immediately
          clearTimeout(minTimer);
          minTimeElapsed.current = true;
          bootResolved.current = true;
          const state = {
            type: 'AUTH_REQUIRED',
            isHydrated: true,
            user: null,
            language: storedLanguage || 'en',
            onboardingComplete: storedOnboarding,
          };
          bootStateRef.current = state;
          setBootState(state);
          tryHideSplash();
          return;
        }

        let resolvedState;

        if (storedOnboarding && storedLanguage) {
          resolvedState = {
            type: 'HOME_READY',
            isHydrated: true,
            user,
            language: storedLanguage,
            onboardingComplete: true,
          };
        } else {
          let profile = null;
          try {
            const profiles = await Promise.race([
              base44.entities.UserProfile.filter({ created_by: user.email }),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Profile timeout')), 5000))
            ]);
            profile = profiles?.[0] || null;
          } catch (err) {
            console.warn('[BootGate] Profile fetch failed:', err.message);
          }

          if (!profile || !profile.onboarding_completed) {
            localStorage.removeItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
            const effectiveLang = resolveLanguage(profile?.language);
            resolvedState = {
              type: effectiveLang ? 'ONBOARDING_REQUIRED' : 'LANGUAGE_REQUIRED',
              isHydrated: true,
              user,
              profile,
              language: effectiveLang,
              onboardingComplete: false,
            };
          } else {
            const lang = resolveLanguage(profile?.language);
            setLocalLanguage(lang);
            localStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, 'true');
            resolvedState = {
              type: 'HOME_READY',
              isHydrated: true,
              user,
              profile,
              language: lang,
              onboardingComplete: true,
            };
          }
        }

        bootStateRef.current = resolvedState;
        bootResolved.current = true;
        setBootState(resolvedState);
        tryHideSplash();
        setBootError(false);
        setRetryCount(0);
      } catch (error) {
        console.error('[BootGate] Fatal boot error:', error);
        clearTimeout(minTimer);
        setBootError(true);
        // Auto-retry after 3 seconds, max 3 attempts
        if (retryCount < 2) {
          setTimeout(() => {
            setBootError(false);
            setRetryCount(c => c + 1);
            resolveBoot();
          }, 3000);
        }
      }
    };

    resolveBoot();
    return () => clearTimeout(minTimer);
  }, [retryCount]);

  // Show error fallback if boot fails
  if (bootError) {
    return <ErrorFallbackScreen onRetry={() => window.location.reload()} />;
  }

  // Always render children once bootState is known (Home loads behind splash)
  // Before bootState is known, render a blank blue screen (never white)
  return (
    <>
      {bootState
        ? children({ bootState })
        : (
          <div style={{
            position: 'fixed', inset: 0,
            background: SPLASH_BG,
          }} />
        )
      }
      {!splashGone && <SplashOverlay visible={splashVisible} />}
    </>
  );
}