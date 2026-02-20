import { useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Single source of truth for entitlement status.
 *
 * Trial flow:
 *  - subscription_status = "trial"        → active trial, is_premium = true
 *  - subscription_status = "expired_trial" → expired, is_premium = false
 *
 * Paid flow:
 *  - subscription_status = "active" | "canceling" → paid premium
 *
 * Owner / collaborator role → always entitled
 */
export function useEntitlement(profile) {
  const result = useMemo(() => {
    // Owner / collaborator always entitled
    if (profile?.role === 'owner' || profile?.role === 'collaborator') {
      return { isPremium: true, isTrialActive: false, isEntitled: true, trialDaysLeft: 0, trialDay: 0, trialEndsAt: null, isTrialExpired: false };
    }

    // Trial window — computed from trial_start_date + 7 days
    let isTrialActive = false;
    let trialDaysLeft = 0;
    let trialDay = 0;
    let trialEndsAt = null;
    let isTrialExpired = false;

    const subscriptionStatus = profile?.subscription_status;

    if (profile?.trial_start_date) {
      const trialStart = new Date(profile.trial_start_date);
      trialEndsAt = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();

      if (subscriptionStatus === 'trial' && now < trialEndsAt) {
        isTrialActive = true;
        const msLeft = trialEndsAt.getTime() - now.getTime();
        trialDaysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
        const msElapsed = now.getTime() - trialStart.getTime();
        trialDay = Math.min(7, Math.ceil(msElapsed / (24 * 60 * 60 * 1000)));
      } else if (subscriptionStatus === 'expired_trial' || (subscriptionStatus === 'trial' && now >= trialEndsAt)) {
        isTrialExpired = true;
      }
    }

    // Paid subscription
    const paidStatuses = ['active', 'canceling'];
    const hasPaidSub = paidStatuses.includes(subscriptionStatus) && profile?.is_premium === true;

    const isPremium = hasPaidSub;
    const isEntitled = isPremium || isTrialActive;

    return { isPremium, isTrialActive, isEntitled, trialDaysLeft, trialDay, trialEndsAt, isTrialExpired };
  }, [profile?.is_premium, profile?.role, profile?.trial_start_date, profile?.subscription_status]);

  // Side-effect: mark trial as expired when time runs out
  useEffect(() => {
    if (!profile?.id) return;
    if (!result.isTrialExpired) return;
    if (profile?.subscription_status === 'expired_trial') return; // already marked

    base44.entities.UserProfile.update(profile.id, {
      subscription_status: 'expired_trial',
      is_premium: false,
    }).catch(() => {});
  }, [result.isTrialExpired, profile?.id, profile?.subscription_status]);

  return result;
}