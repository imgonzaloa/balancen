import React from "react";
import { useAppState } from "@/components/AppStateContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useEntitlement } from "@/components/hooks/useEntitlement";
import { base44 } from "@/api/base44Client";
import { RefreshCw, LogOut, RotateCcw } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

function hardReset() {
  window.location.reload();
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
 * 2. Not authenticated                     → redirect to Login
 * 3. Onboarding not complete               → redirect to LanguageSelector / Onboarding
 * 4. Profile server error (load failure)   → safe fallback UI (retry / logout)
 * 5. All clear (including non-entitled)    → render children
 *    (Paywall is shown only when user explicitly taps a premium action)
 *
 * IMPORTANT: We do NOT auto-redirect non-entitled users to /Paywall.
 * Core routes (Home, Social, Progress, Profile, Camera) are always accessible.
 * Paywall is triggered per-feature when needed.
 */
export default function TrialGate({ children }) {
  const { user, profile, isInitialized, profileLoading } = useAppState();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const didRedirectRef = React.useRef(false);

  // isReady: auth check done AND profile fetch settled (or no user to fetch profile for)
  const isReady = isInitialized && !profileLoading;

  const localOnboardingDone = localStorage.getItem('balancen_onboarding_complete') === 'true';
  const onboardingComplete = localOnboardingDone || profile?.onboarding_completed === true;

  // A "load failure" means: returning user (locally flagged as done) but profile couldn't be fetched.
  const profileLoadFailed = isReady && !!user?.email && localOnboardingDone && profile === null;

  React.useEffect(() => {
    if (!isReady) return;
    if (didRedirectRef.current) return; // prevent repeated redirects

    // Step 2: Not authenticated → redirect to Login
    if (!user?.email) {
      didRedirectRef.current = true;
      redirectToLogin();
      return;
    }

    // Don't redirect if profile couldn't load — show safe fallback UI instead
    if (profileLoadFailed) return;

    // Step 3: Onboarding not done → always go to Onboarding (handles language in step 1)
    if (!onboardingComplete) {
      didRedirectRef.current = true;
      navigate(createPageUrl('Onboarding'), { replace: true });
      return;
    }

    // Step 5: All onboarded users can access core routes.
    // Non-entitled users will be gated per-feature, not here.
  }, [isReady, user?.email, onboardingComplete, profileLoadFailed, navigate]);

  // Reset redirect ref when user/auth state changes (e.g. new login)
  React.useEffect(() => {
    didRedirectRef.current = false;
  }, [user?.email]);

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
            <h2 className="text-white text-xl font-bold mb-2">{t("unable_load_account")}</h2>
            <p className="text-white/60 text-sm">{t("check_connection_retry")}</p>
          </div>
          <div className="space-y-3">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-4 rounded-2xl bg-teal-500 hover:bg-teal-400 text-white font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <RefreshCw size={18} /> {t("retry_label")}
            </button>
            <button
              onClick={safeLogout}
              className="w-full py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white/80 font-medium transition-colors flex items-center justify-center gap-2"
            >
              <LogOut size={16} /> {t("log_out")}
            </button>
            <button
              onClick={hardReset}
              className="w-full py-3 text-white/30 text-xs font-medium hover:text-white/60 transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw size={12} /> {t("reset_session")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Onboarding redirect in progress — render nothing while navigation fires
  if (!onboardingComplete) return null;

  // Step 5: All clear — render app content (entitlement gated per-feature, not here)
  return <>{children}</>;
}

function redirectToLogin() {
  try {
    base44.auth.redirectToLogin(window.location.href);
  } catch (_) {
    window.location.href = '/login';
  }
}