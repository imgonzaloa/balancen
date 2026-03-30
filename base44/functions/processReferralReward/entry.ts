import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

/**
 * Called when a referred user subscribes to Premium
 * Checks if referrer should get a free month (every 3 paying referrals)
 */
Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // This function should be called from Stripe webhook or internal subscription handler
    const { inviteeEmail, subscriptionStatus } = await req.json();
    
    if (!inviteeEmail || subscriptionStatus !== 'active') {
      return Response.json({ error: 'Invalid request' }, { status: 400 });
    }

    console.log('[REFERRAL_REWARD] Processing', { inviteeEmail, subscriptionStatus });

    // Find the invite record for this user
    const invites = await base44.asServiceRole.entities.Invite.filter({ 
      invitee_email: inviteeEmail,
      status: 'registered' // or any non-subscribed status
    });

    if (invites.length === 0) {
      console.log('[REFERRAL_REWARD] No pending invite found for', inviteeEmail);
      return Response.json({ success: false, reason: 'No invite found' });
    }

    const invite = invites[0];
    const inviterEmail = invite.inviter_email;

    // Update invite status to subscribed
    await base44.asServiceRole.entities.Invite.update(invite.id, {
      status: 'subscribed',
      subscribed_at: new Date().toISOString()
    });

    // Get or create referral progress for inviter
    let progressRecords = await base44.asServiceRole.entities.ReferralProgress.filter({ 
      user_email: inviterEmail 
    });

    let progress;
    if (progressRecords.length === 0) {
      // Create new progress record
      progress = await base44.asServiceRole.entities.ReferralProgress.create({
        user_email: inviterEmail,
        total_successful_referrals: 0,
        rewards_granted_months: 0,
        pending_referrals_count: 0,
        referred_user_emails: []
      });
    } else {
      progress = progressRecords[0];
    }

    // Check if this user already counted (prevent duplicate rewards)
    const referredEmails = progress.referred_user_emails || [];
    if (referredEmails.includes(inviteeEmail)) {
      console.log('[REFERRAL_REWARD] Already counted', inviteeEmail);
      return Response.json({ success: false, reason: 'Already counted' });
    }

    // Increment counters
    const newTotal = (progress.total_successful_referrals || 0) + 1;
    const newPending = (progress.pending_referrals_count || 0) + 1;
    const newReferredEmails = [...referredEmails, inviteeEmail];

    // Check if we hit reward threshold (every 3)
    const shouldGrantReward = newPending >= 3;
    
    let updateData = {
      total_successful_referrals: newTotal,
      pending_referrals_count: shouldGrantReward ? newPending - 3 : newPending,
      referred_user_emails: newReferredEmails
    };

    if (shouldGrantReward) {
      // Grant 1 month free Premium
      console.log('[REFERRAL_REWARD] Granting free month to', inviterEmail);
      
      const rewardsGranted = (progress.rewards_granted_months || 0) + 1;
      updateData.rewards_granted_months = rewardsGranted;
      updateData.last_reward_granted_at = new Date().toISOString();

      // Update inviter's profile to extend Premium
      const inviterProfiles = await base44.asServiceRole.entities.UserProfile.filter({ 
        created_by: inviterEmail 
      });
      
      if (inviterProfiles.length > 0) {
        const inviterProfile = inviterProfiles[0];
        const currentExpiry = inviterProfile.premium_expires ? new Date(inviterProfile.premium_expires) : new Date();
        const newExpiry = new Date(currentExpiry);
        newExpiry.setMonth(newExpiry.getMonth() + 1);

        await base44.asServiceRole.entities.UserProfile.update(inviterProfile.id, {
          is_premium: true,
          premium_status: 'active',
          premium_expires: newExpiry.toISOString()
        });

        console.log('[REFERRAL_REWARD] Premium extended to', newExpiry.toISOString());
      }
    }

    await base44.asServiceRole.entities.ReferralProgress.update(progress.id, updateData);

    console.log('[REFERRAL_REWARD] Success', { 
      inviterEmail, 
      newTotal, 
      newPending, 
      rewardGranted: shouldGrantReward 
    });

    return Response.json({ 
      success: true,
      rewardGranted: shouldGrantReward,
      totalReferrals: newTotal,
      pendingCount: shouldGrantReward ? newPending - 3 : newPending
    });

  } catch (error) {
    console.error('[REFERRAL_REWARD] Error:', error);
    return Response.json({ 
      error: error.message || 'Failed to process reward' 
    }, { status: 500 });
  }
});