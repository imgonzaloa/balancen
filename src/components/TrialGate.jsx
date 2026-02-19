import React from "react";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

/**
 * TrialGate enforces trial-only access model:
 * - Active trial or premium: children rendered
 * - Trial expired + not premium: redirect to Paywall
 * - Anonymous: redirect to Paywall
 */
export default function TrialGate({ children }) {
  const { user, profile, isInitialized } = useAppState();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Calculate trial status
  const isTrialActive = React.useMemo(() => {
    if (!profile?.trial_start_date) return false;
    const trialStart = new Date(profile.trial_start_date);
    const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    return new Date() < trialEnd;
  }, [profile?.trial_start_date]);

  const isPremium = profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator';
  const hasAccess = isPremium || isTrialActive;

  // While loading, show nothing (prevent flashing)
  if (!isInitialized) return null;

  // No user = redirect to Paywall
  if (!user?.email) {
    React.useEffect(() => {
      navigate(createPageUrl('Paywall'), { replace: true });
    }, [navigate]);
    return null;
  }

  // Trial expired + not premium = locked
  if (!hasAccess) {
    React.useEffect(() => {
      navigate(createPageUrl('Paywall'), { replace: true });
    }, [navigate]);
    return null;
  }

  // Trial active or premium = allow access
  return <>{children}</>;
}