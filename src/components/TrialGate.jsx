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
 * TrialGate — enforces routing priority:
 *
 * 1. Still loading  → render nothing (avoid premature redirects)
 * 2. No user        → render nothing (BootGate / Login handles it)
 * 3. No onboarding  → redirect to LanguageSelector or Onboarding  ← BEFORE entitlement
 * 4. Profile error  → safe fallback (never lock out)
 * 5. Not entitled   → redirect to Paywall
 * 6. All clear      → render children
 *
 * Critical distinction:
 * - New user (no localStorage flag, null profile) = needs onboarding  (priority 3)
 * - Returning user (localStorage flag = true, null profile) = server error (priority 4)
 * This prevents new users ever hitting the Paywall before onboarding.
 */
export default function TrialGate({ children }) {
  const { user, profile, isInitialized, profileLoading } = useAppState();
  const navigate = useNavigate();

  // CRITICAL: only pass profile to useEntitlement once loading is done.
  // While profileLoading=true, profile is null which would make isEntitled=false.
  const profileReady = isInitialized && !profileLoading;
  const { isEntitled } = useEntitlement(profileReady ? profile : undefined);

  const localOnboardingDone = localStorage.getItem('balancen_onboarding_complete') === 'true';
  const onboardingComplete = localOnboardingDone || profile?.onboarding_completed === true;

  // Load failure = returning user (local flag says done) but profile came back null
  // New user = no local flag + null profile → needs onboarding, NOT a load failure
  const profileLoadFailed = profileReady && !!user?.email && localOnboardingDone && profile === null;

  React.useEffect(() => {
    if (!profileReady || !user?.email) return;

    // Don't redirect if we can't determine state (server error)
    if (profileLoadFailed) return;

    // Priority 3: onboarding not done → force onboarding flow first
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

    // Priority 5: onboarded but not entitled → paywall
    if (!isEntitled) {
      console.log('[TrialGate] → Not entitled, redirecting to Paywall');
      navigate(createPageUrl('Paywall'), { replace: true });
    }
  }, [profileReady, user?.email, onboardingComplete, isEntitled, profileLoadFailed, navigate, profile?.language]);

  // 1. Loading
  if (!profileReady) return null;

  // 2. Not authenticated
  if (!user?.email) return null;

  // 4. Profile load error — show safe fallback
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

  // 3 & 5. Redirect in progress — render nothing
  if (!onboardingComplete) return null;
  if (!isEntitled) return null;

  // 6. All clear
  return <>{children}</>;
}