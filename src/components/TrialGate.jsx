import React from "react";
import { useAppState } from "@/components/AppStateContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useEntitlement } from "@/components/hooks/useEntitlement";
import { RefreshCw, LogOut, RotateCcw } from "lucide-react";

function hardReset() {
  try {
    localStorage.clear();
    sessionStorage.clear();
  } catch (_) {}
  window.location.replace('/');
}

async function safeLogout() {
  try {
    const { base44 } = await import('@/api/base44Client');
    await base44.auth.logout('/');
  } catch (_) {
    hardReset();
  }
}

/**
 * TrialGate: Route guard with correct priority order.
 *
 * Priority:
 * 1. Not authenticated → do nothing (BootGate handles Login redirect)
 * 2. Authenticated + onboarding NOT complete → redirect to Onboarding/LanguageSelector
 * 3. Authenticated + onboarded + entitled → allow access
 * 4. Authenticated + onboarded + NOT entitled → redirect to Paywall
 *
 * If profile fails to load, shows a safe fallback instead of hard-locking.
 */
export default function TrialGate({ children }) {
  const { user, profile, isInitialized, profileLoading } = useAppState();
  const navigate = useNavigate();
  const { isEntitled } = useEntitlement(profile);

  // Don't decide until auth + profile are both settled
  const isReady = isInitialized && !profileLoading;

  // Profile fetch finished but came back null (possible timeout/error)
  const profileLoadFailed = isReady && !!user?.email && profile === null;

  // Onboarding not yet done — check localStorage first (fast), then profile flag
  const onboardingComplete =
    localStorage.getItem('balancen_onboarding_complete') === 'true' ||
    profile?.onboarding_completed === true;

  React.useEffect(() => {
    if (!isReady || !user?.email) return;

    // If profile is null (possibly failed), don't redirect — show fallback
    if (profileLoadFailed) return;

    // Priority 2: onboarding not complete → force onboarding
    if (!onboardingComplete) {
      const hasLanguage = !!(
        profile?.language ||
        localStorage.getItem('i18nextLng') ||
        localStorage.getItem('balancen_lang')
      );
      navigate(createPageUrl(hasLanguage ? 'Onboarding' : 'LanguageSelector'), { replace: true });
      return;
    }

    // Priority 4: onboarded but not entitled → paywall
    if (!isEntitled) {
      navigate(createPageUrl('Paywall'), { replace: true });
    }
  }, [isReady, user?.email, onboardingComplete, isEntitled, profileLoadFailed, navigate, profile?.language]);

  // Show nothing while loading or about to redirect
  if (!isReady) return null;
  if (!user?.email) return null;

  // Redirect in progress
  if (profile !== null && !onboardingComplete) return null;
  if (profile !== null && onboardingComplete && !isEntitled) return null;

  // Profile failed to load — show safe fallback, never lock out
  if (profileLoadFailed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto">
            <RefreshCw size={28} className="text-amber-300" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold mb-2">Unable to load your account</h2>
            <p className="text-white/60 text-sm">
              We couldn't verify your subscription status. Check your connection and try again.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} />
              Retry
            </button>
            <button
              onClick={safeLogout}
              className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white/80 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={16} />
              Log out
            </button>
            <button
              onClick={hardReset}
              className="w-full py-3 text-white/30 text-xs font-medium hover:text-white/60 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} />
              Reset Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}