import { useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Single source of truth for entitlement status.
 *
 * Trial flow:
 *  subscription_status = "trial"          → active trial, is_premium = true
 *  subscription_status = "expired_trial"  → trial over, gate to subscription screen
 *
 * Paid flow:
 *  subscription_status = "active" | "canceling" + is_premium = true → full access
 *
 * Owner / collaborator role → always entitled
 */
export function useEntitlement(profile) {
  const result = useMemo(() => {
    if (!profile) {
      return { isPremium: false, isTrialActive: false, isEntitled: false, trialDaysLeft: 0, trialDay: 0, trialEndsAt: null, isTrialExpired: false };
    }

    // Owner / collaborator always entitled
    if (profile.role === 'owner' || profile.role === 'collaborator') {
      return { isPremium: true, isTrialActive: false, isEntitled: true, trialDaysLeft: 0, trialDay: 0, trialEndsAt: null, isTrialExpired: false };
    }

    const subscriptionStatus = profile.subscription_status;
    const now = new Date();

    // Compute trial window
    let isTrialActive = false;
    let trialDaysLeft = 0;
    let trialDay = 0;
    let trialEndsAt = null;
    let isTrialExpired = false;

    if (profile.trial_start_date) {
      const trialStart = new Date(profile.trial_start_date);
      // Prefer explicit trial_end_date if stored, else compute
      trialEndsAt = profile.trial_end_date
        ? new Date(profile.trial_end_date)
        : new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);

      if (subscriptionStatus === 'trial' && now < trialEndsAt) {
        isTrialActive = true;
        const msLeft = trialEndsAt.getTime() - now.getTime();
        trialDaysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
        const msElapsed = now.getTime() - trialStart.getTime();
        trialDay = Math.min(7, Math.max(1, Math.ceil(msElapsed / (24 * 60 * 60 * 1000))));
      } else if (
        subscriptionStatus === 'expired_trial' ||
        (subscriptionStatus === 'trial' && now >= trialEndsAt)
      ) {
        isTrialExpired = true;
      }
    }

    // Paid subscription (Stripe active/canceling)
    const paidStatuses = ['active', 'canceling'];
    const hasPaidSub = paidStatuses.includes(subscriptionStatus) && profile.is_premium === true;

    const isPremium = hasPaidSub;
    const isEntitled = isPremium || isTrialActive;

    return { isPremium, isTrialActive, isEntitled, trialDaysLeft, trialDay, trialEndsAt, isTrialExpired };
  }, [
    profile?.is_premium,
    profile?.role,
    profile?.trial_start_date,
    profile?.trial_end_date,
    profile?.subscription_status,
  ]);

  // Side-effect: when trial time runs out, mark as expired_trial in DB
  useEffect(() => {
    if (!profile?.id) return;
    if (!result.isTrialExpired) return;
    if (profile?.subscription_status === 'expired_trial') return; // already done

    base44.entities.UserProfile.update(profile.id, {
      subscription_status: 'expired_trial',
      is_premium: false,
    }).catch(() => {});
  }, [result.isTrialExpired, profile?.id, profile?.subscription_status]);

  return result;
}