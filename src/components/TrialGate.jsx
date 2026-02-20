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
 * TrialGate: Hard paywall — only entitled users see content.
 *
 * Waits for BOTH isInitialized AND profile to finish loading.
 * If entitlement cannot be determined (error/timeout), shows a safe fallback
 * with Retry / Logout / Reset — never hard-locks the user out.
 */
export default function TrialGate({ children }) {
  const { user, profile, isInitialized, profileLoading } = useAppState();
  const navigate = useNavigate();
  const { isEntitled } = useEntitlement(profile);

  // Don't decide until auth + profile are both settled
  const isReady = isInitialized && !profileLoading;

  // Profile failed to load (isInitialized but user exists yet profile is still null after timeout)
  // We treat this as uncertain — don't redirect, show fallback
  const profileLoadFailed = isReady && !!user?.email && profile === null;

  // Redirect only when we're sure the user is not entitled
  const shouldRedirect = isReady && (!user?.email || (!isEntitled && !profileLoadFailed));

  React.useEffect(() => {
    if (shouldRedirect) {
      navigate(createPageUrl('Paywall'), { replace: true });
    }
  }, [shouldRedirect, navigate]);

  // Show nothing while loading or about to redirect
  if (!isReady || shouldRedirect) return null;

  // If profile failed to load, show a non-blocking fallback instead of hard-locking
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