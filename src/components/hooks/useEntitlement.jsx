import { useMemo, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

/**
 * Single source of truth for entitlement status.
 *
 * Access types (priority order):
 *  access_type = "campus_access"   → active campus period (30 days), is_premium = true
 *  access_type = "campus_reward"   → reward period after >=80% consistency (30 days), is_premium = true
 *  access_type = "premium_active"  → paid Stripe subscription
 *  access_type = "expired"         → expired, gate to subscription screen
 *
 * Legacy trial flow (no access_type):
  *  subscription_status = "trial"          → active 5-day trial
  *  subscription_status = "expired_trial"  → trial over
 *
 * Owner / collaborator role → always entitled
 */
export function useEntitlement(profile) {
   const result = useMemo(() => {
     if (!profile) {
       return {
         isPremium: false, isTrialActive: false, isEntitled: false, isPowerUser: false,
         trialDaysLeft: 0, trialDay: 0, trialEndsAt: null, isTrialExpired: false,
         accessType: null, isCampusAccess: false, isCampusReward: false,
         accessDaysLeft: 0, accessEndsAt: null, isAccessExpired: false,
       };
     }

     // Check Power tier
     const isPowerUser = profile?.plan_type === 'power' || profile?.subscription_plan === 'power';

     // Owner / collaborator always entitled
     if (profile.role === 'owner' || profile.role === 'collaborator') {
       return {
         isPremium: true, isTrialActive: false, isEntitled: true, isPowerUser,
         trialDaysLeft: 0, trialDay: 0, trialEndsAt: null, isTrialExpired: false,
         accessType: null, isCampusAccess: false, isCampusReward: false,
         accessDaysLeft: 0, accessEndsAt: null, isAccessExpired: false,
       };
     }

    const now = new Date();
    const accessType = profile.access_type || null;

    // ── New access_type system ──────────────────────────────────────────────
    if (accessType) {
      const accessEndsAt = profile.access_end_date ? new Date(profile.access_end_date) : null;
      const isCampusAccess = accessType === 'campus_access';
      const isCampusReward = accessType === 'campus_reward';
      const isPremiumActive = accessType === 'premium_active';
      const isExpired = accessType === 'expired';

      const isAccessExpired = isExpired || (accessEndsAt && now >= accessEndsAt && !isPremiumActive);
      const isActiveAccess = !isExpired && (!accessEndsAt || now < accessEndsAt);

      const accessDaysLeft = (accessEndsAt && isActiveAccess)
        ? Math.max(1, Math.ceil((accessEndsAt.getTime() - now.getTime()) / (24 * 60 * 60 * 1000)))
        : 0;

      const isEntitled = isActiveAccess && (isCampusAccess || isCampusReward || isPremiumActive);
       const isPremium = isPremiumActive;

       return {
         isPremium, isTrialActive: false, isEntitled, isPowerUser,
         trialDaysLeft: 0, trialDay: 0, trialEndsAt: null, isTrialExpired: false,
         accessType, isCampusAccess, isCampusReward,
         accessDaysLeft, accessEndsAt, isAccessExpired,
       };
      }

    // ── Legacy trial flow ───────────────────────────────────────────────────
    const subscriptionStatus = profile.subscription_status;

    let isTrialActive = false;
    let trialDaysLeft = 0;
    let trialDay = 0;
    let trialEndsAt = null;
    let isTrialExpired = false;

    if (profile.trial_start_date) {
      const trialStart = new Date(profile.trial_start_date);
      trialEndsAt = profile.trial_end_date
        ? new Date(profile.trial_end_date)
        : new Date(trialStart.getTime() + 3 * 24 * 60 * 60 * 1000);

      if (subscriptionStatus === 'trial' && now < trialEndsAt) {
        isTrialActive = true;
        const msLeft = trialEndsAt.getTime() - now.getTime();
        trialDaysLeft = Math.max(1, Math.ceil(msLeft / (24 * 60 * 60 * 1000)));
        const msElapsed = now.getTime() - trialStart.getTime();
        trialDay = Math.min(3, Math.max(1, Math.ceil(msElapsed / (24 * 60 * 60 * 1000))));
      } else if (
        subscriptionStatus === 'expired_trial' ||
        (subscriptionStatus === 'trial' && now >= trialEndsAt)
      ) {
        isTrialExpired = true;
      }
    }

    const paidStatuses = ['active', 'canceling'];
    const hasPaidSub = paidStatuses.includes(subscriptionStatus) && profile.is_premium === true;

    const isPremium = hasPaidSub;
    const isEntitled = isPremium || isTrialActive;

    return {
      isPremium, isTrialActive, isEntitled, isPowerUser,
      trialDaysLeft, trialDay, trialEndsAt, isTrialExpired,
      accessType: null, isCampusAccess: false, isCampusReward: false,
      accessDaysLeft: 0, accessEndsAt: null, isAccessExpired: false,
    };
    }, [
     profile?.is_premium,
     profile?.role,
     profile?.trial_start_date,
     profile?.trial_end_date,
     profile?.subscription_status,
     profile?.access_type,
     profile?.access_end_date,
     profile?.plan_type,
     profile?.subscription_plan,
    ]);

  // Side-effect: mark legacy trial as expired when time runs out
  useEffect(() => {
    if (!profile?.id) return;
    if (!result.isTrialExpired) return;
    if (profile?.subscription_status === 'expired_trial') return;

    base44.entities.UserProfile.update(profile.id, {
      subscription_status: 'expired_trial',
      is_premium: false,
    }).catch(() => {});
  }, [result.isTrialExpired, profile?.id, profile?.subscription_status]);

  // Side-effect: handle campus_access / campus_reward expiration
  useEffect(() => {
    if (!profile?.id) return;
    if (!result.isAccessExpired) return;
    if (profile?.access_type === 'expired') return; // already handled

    const handleExpiry = async () => {
      if (profile.access_type === 'campus_access') {
        // Calculate consistency for the campus group period
        let consistencyPercent = 0;
        if (profile.campus_group_id) {
          const groups = await base44.entities.Group.list().then(g => g.filter(x => x.id === profile.campus_group_id)).catch(() => []);
          const group = groups[0];
          if (group?.start_date && group?.end_date) {
            const start = new Date(group.start_date);
            const end = new Date(group.end_date);
            const totalDays = Math.ceil((end - start) / (24 * 60 * 60 * 1000));
            if (totalDays > 0) {
              const checkins = await base44.entities.DailyCheckIn.filter({ created_by: profile.created_by }).catch(() => []);
              const inRange = checkins.filter(c => {
                const d = new Date(c.date);
                return d >= start && d <= end;
              });
              consistencyPercent = Math.round((inRange.length / totalDays) * 100);
            }
          }
        }

        if (consistencyPercent >= 80) {
          // Grant campus reward: another 30 days
          await base44.entities.UserProfile.update(profile.id, {
            access_type: 'campus_reward',
            access_start_date: new Date().toISOString(),
            access_end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            campus_consistency_percent: consistencyPercent,
            is_premium: true,
          }).catch(() => {});
        } else {
          // No reward — expire
          await base44.entities.UserProfile.update(profile.id, {
            access_type: 'expired',
            is_premium: false,
            campus_consistency_percent: consistencyPercent,
          }).catch(() => {});
        }
      } else if (profile.access_type === 'campus_reward') {
        // Reward period ended → expired
        await base44.entities.UserProfile.update(profile.id, {
          access_type: 'expired',
          is_premium: false,
        }).catch(() => {});
      }
    };

    handleExpiry();
  }, [result.isAccessExpired, profile?.id, profile?.access_type, profile?.campus_group_id, profile?.created_by]);

  return result;
}