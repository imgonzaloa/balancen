import React from "react";
import { useAppState } from "@/components/AppStateContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useEntitlement } from "@/components/hooks/useEntitlement";
import { base44 } from "@/api/base44Client";
import { RefreshCw, LogOut, RotateCcw } from "lucide-react";

function hardReset() {
  try { localStorage.clear(); sessionStorage.clear(); } catch (_) {}
  window.location.replace('/');
}

async function safeLogout() {
  try {
    await base44.auth.logout('/');
  } catch (_) { hardReset(); }
}

/**
 * TrialGate — enforces correct routing priority after auth:
 *
 * Priority order (checked in sequence):
 * 1. Still loading (auth or profile)       → render nothing (spinner)
 * 2. Not authenticated                     → redirect to Login (NEVER Paywall)
 * 3. Onboarding not complete               → redirect to LanguageSelector / Onboarding
 * 4. Profile server error (load failure)   → safe fallback UI (retry / logout)
 * 5. Not entitled (trial expired, no sub)  → redirect to Paywall
 * 6. All clear                             → render children
 *
 * CRITICAL: Steps 2 and 3 are checked BEFORE step 5.
 * - New users (null profile, no localStorage flag) → Onboarding, NEVER Paywall.
 * - Unauthenticated users → Login, NEVER Paywall.
 */
export default function TrialGate({ children }) {
  const { user, profile, isInitialized, profileLoading } = useAppState();
  const navigate = useNavigate();

  // isReady: auth check done AND profile fetch settled (or no user to fetch profile for)
  const isReady = isInitialized && !profileLoading;

  // Only evaluate entitlement once loading is complete — prevents false isEntitled=false flicker
  const { isEntitled, isTrialActive } = useEntitlement(isReady ? profile : undefined);

  const localOnboardingDone = localStorage.getItem('balancen_onboarding_complete') === 'true';
  const onboardingComplete = localOnboardingDone || profile?.onboarding_completed === true;

  // A "load failure" means: returning user (locally flagged as done) but profile couldn't be fetched.
  // A brand new user (no local flag + null profile) is NOT a failure — they need onboarding.
  const profileLoadFailed = isReady && !!user?.email && localOnboardingDone && profile === null;

  React.useEffect(() => {
    if (!isReady) return;

    // Step 2: Not authenticated → redirect to Login
    if (!user?.email) {
      console.log('[TrialGate] Not authenticated → Login');
      redirectToLogin();
      return;
    }

    // Don't redirect if profile couldn't load — show safe fallback UI instead
    if (profileLoadFailed) return;

    // Step 3: Onboarding not done → must go through onboarding first, always before entitlement check
    if (!onboardingComplete) {
      const hasLanguage = !!(
        profile?.language ||
        localStorage.getItem('i18nextLng') ||
        localStorage.getItem('balancen_lang')
      );
      const target = hasLanguage ? 'Onboarding' : 'LanguageSelector';
      console.log('[TrialGate] Onboarding required → ', target);
      navigate(createPageUrl(target), { replace: true });
      return;
    }

    // Step 5: Onboarded, authenticated, but not entitled → Paywall (subscription screen)
    // trial active = entitled; expired_trial or no sub = not entitled → Paywall
    if (!isEntitled) {
      console.log('[TrialGate] Not entitled → Paywall');
      navigate(createPageUrl('Paywall'), { replace: true });
    }
  }, [isReady, user?.email, onboardingComplete, isEntitled, profileLoadFailed, navigate, profile?.language]);

  // Step 1: Still loading — render nothing
  if (!isReady) return null;

  // Step 2: Not authenticated — redirect is firing, show nothing
  if (!user?.email) return null;

  // Step 4: Profile load error — safe fallback UI
  if (profileLoadFailed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex flex-col items-center justify-center p-6">
        <div className="max-w-sm w-full text-center space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center mx-auto">
            <RefreshCw size={28} className="text-amber-300" />
          </div>
          <div>
            <h2 className="text-white text-xl font-bold mb-2">Unable to load your account</h2>
            <p className="text-white/60 text-sm">Check your connection and try again.</p>
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

  // Step 3 / 5: Redirect in progress — render nothing while navigation fires
  if (!onboardingComplete) return null;
  if (!isEntitled) return null;

  // Step 6: All clear — render app content
  return <>{children}</>;
}

function redirectToLogin() {
  try {
    base44.auth.redirectToLogin(window.location.href);
  } catch (_) {
    window.location.href = '/login';
  }
}