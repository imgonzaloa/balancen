import React from "react";
import { useAppState } from "@/components/AppStateContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useEntitlement } from "@/components/hooks/useEntitlement";
import { RefreshCw, LogOut, RotateCcw } from "lucide-react";

function hardReset() {
  try { localStorage.clear(); sessionStorage.clear(); } catch (_) {}
  window.location.replace('/');
}

async function safeLogout() {
  try {
    const { base44 } = await import('@/api/base44Client');
    await base44.auth.logout('/');
  } catch (_) { hardReset(); }
}

/**
 * TrialGate — enforces correct routing priority after auth:
 *
 * 1. Still loading (auth or profile)  → render nothing
 * 2. Not authenticated                → redirect to Login (NEVER Paywall)
 * 3. Onboarding not complete          → redirect to LanguageSelector / Onboarding
 * 4. Profile server error             → safe fallback (retry / logout)
 * 5. Not entitled (trial expired)     → redirect to Paywall
 * 6. All clear                        → render children
 *
 * Key: steps 2 and 3 are checked BEFORE step 5.
 * New users (null profile, no localStorage flag) → onboarding, never Paywall.
 * Unauthenticated users → Login, never Paywall.
 */
export default function TrialGate({ children }) {
  const { user, profile, isInitialized, profileLoading } = useAppState();
  const navigate = useNavigate();

  // Wait until BOTH auth check has run AND profile fetch has settled.
  // If there's no user, profileLoading stays false (no profile to fetch), so isReady is true.
  const isReady = isInitialized && !profileLoading;

  // Only pass profile once loading is complete — prevents false isEntitled=false
  const { isEntitled } = useEntitlement(isReady ? profile : undefined);

  const localOnboardingDone = localStorage.getItem('balancen_onboarding_complete') === 'true';
  const onboardingComplete = localOnboardingDone || profile?.onboarding_completed === true;

  // A "load failure" is specifically: returning user (local flag = done) but profile is null.
  // A new user (no flag + null profile) is NOT a failure — they need onboarding.
  const profileLoadFailed = isReady && !!user?.email && localOnboardingDone && profile === null;

  React.useEffect(() => {
    if (!isReady) return;

    // Step 2: Not authenticated → redirect to Login (hard redirect so auth flow triggers)
    if (!user?.email) {
      console.log('[TrialGate] No user, redirecting to login');
      base44AuthRedirect();
      return;
    }

    // Don't redirect if profile failed to load — show safe fallback
    if (profileLoadFailed) return;

    // Step 3: Onboarding not done → onboarding first, always before entitlement
    if (!onboardingComplete) {
      const hasLanguage = !!(
        profile?.language ||
        localStorage.getItem('i18nextLng') ||
        localStorage.getItem('balancen_lang')
      );
      console.log('[TrialGate] → Onboarding required, hasLanguage:', hasLanguage);
      navigate(createPageUrl(hasLanguage ? 'Onboarding' : 'LanguageSelector'), { replace: true });
      return;
    }

    // Step 5: Onboarded but not entitled → paywall
    if (!isEntitled) {
      console.log('[TrialGate] → Not entitled, redirecting to Paywall');
      navigate(createPageUrl('Paywall'), { replace: true });
    }
  }, [isReady, user?.email, onboardingComplete, isEntitled, profileLoadFailed, navigate, profile?.language]);

  // Step 1: Still loading
  if (!isReady) return null;

  // Step 2: Not authenticated — render nothing while redirect fires
  if (!user?.email) return null;

  // Step 4: Profile load error — safe fallback
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
              Check your connection and try again.
            </p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> Retry
            </button>
            <button
              onClick={safeLogout}
              className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white/80 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> Log out
            </button>
            <button
              onClick={hardReset}
              className="w-full py-3 text-white/30 text-xs font-medium hover:text-white/60 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} /> Reset Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3 / 5: Redirect in progress — render nothing
  if (!onboardingComplete) return null;
  if (!isEntitled) return null;

  // Step 6: All clear
  return <>{children}</>;
}

// Triggers Base44 login redirect without crashing if SDK not ready
function base44AuthRedirect() {
  try {
    import('@/api/base44Client').then(({ base44 }) => {
      base44.auth.redirectToLogin(window.location.href);
    });
  } catch (_) {}
}