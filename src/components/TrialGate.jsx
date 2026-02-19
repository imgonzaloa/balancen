import React from "react";
import { useAppState } from "@/components/AppStateContext";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useEntitlement } from "@/components/hooks/useEntitlement";

/**
 * TrialGate: Hard paywall - only entitled users see content.
 * 
 * Entitlement = isPremium OR isTrialActive
 * If not entitled, redirect to Paywall immediately.
 */
export default function TrialGate({ children }) {
  const { user, profile, isInitialized } = useAppState();
  const navigate = useNavigate();
  const { isEntitled } = useEntitlement(profile);

  const shouldRedirect = isInitialized && (!user?.email || !isEntitled);

  React.useEffect(() => {
    if (shouldRedirect) {
      navigate(createPageUrl('Paywall'), { replace: true });
    }
  }, [shouldRedirect, navigate]);

  if (!isInitialized || shouldRedirect) return null;

  return <>{children}</>;
}