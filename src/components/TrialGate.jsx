import React from "react";
import { useAppState } from "@/components/AppStateContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useEntitlement } from "@/components/hooks/useEntitlement";

/**
 * TrialGate: Hard paywall — only entitled users see content.
 *
 * Waits for BOTH isInitialized AND profile to finish loading before deciding.
 * This prevents entitled users from being flashed to Paywall during boot.
 */
export default function TrialGate({ children }) {
  const { user, profile, isInitialized, profileLoading } = useAppState();
  const navigate = useNavigate();
  const { isEntitled } = useEntitlement(profile);

  // Don't decide until auth + profile are both settled
  const isReady = isInitialized && !profileLoading;

  // Redirect only when we're sure the user is not entitled
  const shouldRedirect = isReady && (!user?.email || !isEntitled);

  React.useEffect(() => {
    if (shouldRedirect) {
      navigate(createPageUrl('Paywall'), { replace: true });
    }
  }, [shouldRedirect, navigate]);

  // Show nothing while loading, or while about to redirect
  if (!isReady || shouldRedirect) return null;

  return <>{children}</>;
}