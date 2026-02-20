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
 * Priority (evaluated in order):
 * 1. Not ready yet (loading)        → render nothing
 * 2. No user email                  → render nothing (BootGate/Login handles it)
 * 3. Onboarding not complete        → redirect to LanguageSelector or Onboarding
 * 4. Profile never fetched (error)  → show safe fallback (Retry / Logout / Reset)
 * 5. Not entitled                   → redirect to Paywall
 * 6. All good                       → render children
 *
 * Key rule: a null profile on a NEW user (no localStorage flag, profile was never created)
 * means onboarding is required, NOT a load failure.
 * A load failure is when the localStorage flag says "done" but profile came back null.
 */
export default function TrialGate({ children }) {
  const { user, profile, isInitialized, profileLoading } = useAppState();
  const navigate = useNavigate();
  const { isEntitled } = useEntitlement(profile);

  // Not ready until auth + profile fetch both settle
  const isReady = isInitialized && !profileLoading;

  // Onboarding is complete if localStorage OR profile flag says so
  const localOnboardingDone = localStorage.getItem('balancen_onboarding_complete') === 'true';
  const onboardingComplete = localOnboardingDone || profile?.onboarding_completed === true;

  // A load failure is: user exists, localStorage says onboarding is done,
  // but profile came back null (server/network error). New users never have the flag.
  const profileLoadFailed = isReady && !!user?.email && localOnboardingDone && profile === null;

  React.useEffect(() => {
    if (!isReady || !user?.email) return;

    // If we can't tell if they're entitled (server error), don't redirect to paywall
    if (profileLoadFailed) return;

    // Priority 3: onboarding not done → send to onboarding
    if (!onboardingComplete) {
      const hasLanguage = !!(
        profile?.language ||
        localStorage.getItem('i18nextLng') ||
        localStorage.getItem('balancen_lang')
      );
      console.log('[TrialGate] Onboarding required, hasLanguage:', hasLanguage);
      navigate(createPageUrl(hasLanguage ? 'Onboarding' : 'LanguageSelector'), { replace: true });
      return;
    }

    // Priority 5: onboarded but not entitled → paywall
    if (!isEntitled) {
      console.log('[TrialGate] Not entitled, redirecting to Paywall');
      navigate(createPageUrl('Paywall'), { replace: true });
    }
  }, [isReady, user?.email, onboardingComplete, isEntitled, profileLoadFailed, navigate, profile?.language]);

  // 1. Not ready
  if (!isReady) return null;

  // 2. Not authenticated
  if (!user?.email) return null;

  // 3. Onboarding redirect in progress
  if (!onboardingComplete && !profileLoadFailed) return null;

  // 4. Profile load failure — safe fallback, never a dead-end
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

  // 5. Paywall redirect in progress
  if (!isEntitled) return null;

  // 6. All clear
  return <>{children}</>;
}