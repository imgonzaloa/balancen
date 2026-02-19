import { useMemo } from 'react';

/**
 * Single source of truth for entitlement status.
 * 
 * Entitlement = isPremium OR isTrialActive
 * 
 * @param {Object} profile - UserProfile entity
 * @returns {Object} { isPremium, isTrialActive, isEntitled, trialDaysLeft, trialEndsAt }
 */
export function useEntitlement(profile) {
  return useMemo(() => {
    // Premium check
    const isPremium = profile?.is_premium === true || 
                     profile?.role === 'owner' || 
                     profile?.role === 'collaborator';

    // Trial check: 7 days from creation
    let isTrialActive = false;
    let trialDaysLeft = 0;
    let trialEndsAt = null;

    if (profile?.trial_start_date) {
      const trialStart = new Date(profile.trial_start_date);
      trialEndsAt = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);
      const now = new Date();
      isTrialActive = now < trialEndsAt;
      
      if (isTrialActive) {
        const msLeft = trialEndsAt.getTime() - now.getTime();
        trialDaysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
      }
    }

    // Final entitlement
    const isEntitled = isPremium || isTrialActive;

    return {
      isPremium,
      isTrialActive,
      isEntitled,
      trialDaysLeft,
      trialEndsAt,
      isTrialExpired: profile?.trial_start_date && !isTrialActive && !isPremium
    };
  }, [profile?.is_premium, profile?.role, profile?.trial_start_date]);
}