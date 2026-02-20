import { useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Single source of truth for entitlement status.
 *
 * Entitlement = is_premium OR isTrialActive
 * Trial = 7 days from trial_start_date
 * If trial expired AND is_premium is still true (stale) → treat as expired (not entitled)
 */
export function useEntitlement(profile) {
  const result = useMemo(() => {
    // Owner / collaborator always entitled
    if (profile?.role === 'owner' || profile?.role === 'collaborator') {
      return { isPremium: true, isTrialActive: false, isEntitled: true, trialDaysLeft: 0, trialEndsAt: null, isTrialExpired: false };
    }

    // Trial window
    let isTrialActive = false;
    let trialDaysLeft = 0;
    let trialEndsAt = null;
    let isTrialExpired = false;

    if (profile?.trial_start_date) {
      const trialStart = new Date(profile.trial_start_date);
      trialEndsAt = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();
      isTrialActive = now < trialEndsAt;
      isTrialExpired = !isTrialActive;

      if (isTrialActive) {
        const msLeft = trialEndsAt.getTime() - now.getTime();
        trialDaysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
      }
    }

    // Paid subscription check (stripe active/canceling = still paid)
    const paidStatuses = ['active', 'canceling'];
    const hasPaidSub = paidStatuses.includes(profile?.premium_status) && profile?.is_premium === true;

    // is_premium = true during trial too — only count it if NOT in expired-trial state
    const isPremium = hasPaidSub;

    const isEntitled = isPremium || isTrialActive;

    return { isPremium, isTrialActive, isEntitled, trialDaysLeft, trialEndsAt, isTrialExpired };
  }, [profile?.is_premium, profile?.role, profile?.trial_start_date, profile?.premium_status]);

  // Side-effect: if trial expired and is_premium is still flagged true without a real subscription, clear it
  useEffect(() => {
    if (!profile?.id) return;
    if (!result.isTrialExpired) return;
    if (!profile?.is_premium) return;
    // Only clear if no paid subscription
    const paidStatuses = ['active', 'canceling'];
    if (paidStatuses.includes(profile?.premium_status)) return;

    // Trial expired, no real sub → mark is_premium=false silently
    base44.entities.UserProfile.update(profile.id, {
      is_premium: false,
      premium_status: 'canceled',
    }).catch(() => {});
  }, [result.isTrialExpired, profile?.id, profile?.is_premium, profile?.premium_status]);

  return result;
}