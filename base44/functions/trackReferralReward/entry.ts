import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { invitee_email } = await req.json();

    if (!invitee_email) {
      return Response.json({ error: 'Missing invitee_email' }, { status: 400 });
    }

    // Find the invite for this user
    const invites = await base44.asServiceRole.entities.Invite.filter({ 
      invitee_email: invitee_email,
      status: 'registered'
    });

    if (invites.length === 0) {
      return Response.json({ success: true, message: 'No referral' });
    }

    const invite = invites[0];

    // Check if invitee has Premium
    const inviteeProfiles = await base44.asServiceRole.entities.UserProfile.filter({
      created_by: invitee_email
    });

    if (inviteeProfiles.length === 0 || !inviteeProfiles[0].is_premium) {
      return Response.json({ success: true, message: 'Invitee not Premium yet' });
    }

    // Update invite status
    await base44.asServiceRole.entities.Invite.update(invite.id, {
      status: 'subscribed',
      subscribed_at: new Date().toISOString(),
    });

    // Get or create ReferralProgress
    let referralProgress = await base44.asServiceRole.entities.ReferralProgress.filter({
      user_email: invite.inviter_email
    });

    if (referralProgress.length === 0) {
      referralProgress = [await base44.asServiceRole.entities.ReferralProgress.create({
        user_email: invite.inviter_email,
        total_successful_referrals: 0,
        rewards_granted_months: 0,
        pending_referrals_count: 0,
        referred_user_emails: [],
      })];
    }

    const progress = referralProgress[0];

    // Check if already counted
    const referredEmails = progress.referred_user_emails || [];
    if (referredEmails.includes(invitee_email)) {
      return Response.json({ success: true, message: 'Already counted' });
    }

    // Update progress
    const newReferredEmails = [...referredEmails, invitee_email];
    const newTotal = progress.total_successful_referrals + 1;
    const newPending = (progress.pending_referrals_count + 1) % 3;

    let updateData = {
      total_successful_referrals: newTotal,
      pending_referrals_count: newPending,
      referred_user_emails: newReferredEmails,
    };

    // Grant reward every 3 referrals
    if (newPending === 0) {
      updateData.rewards_granted_months = progress.rewards_granted_months + 1;
      updateData.last_reward_granted_at = new Date().toISOString();

      // Extend Premium for inviter
      const inviterProfiles = await base44.asServiceRole.entities.UserProfile.filter({
        created_by: invite.inviter_email
      });

      if (inviterProfiles.length > 0) {
        const inviterProfile = inviterProfiles[0];
        const currentExpiry = inviterProfile.premium_expires 
          ? new Date(inviterProfile.premium_expires)
          : new Date();
        
        const newExpiry = new Date(Math.max(currentExpiry.getTime(), Date.now()));
        newExpiry.setMonth(newExpiry.getMonth() + 1);

        await base44.asServiceRole.entities.UserProfile.update(inviterProfile.id, {
          premium_expires: newExpiry.toISOString(),
          is_premium: true,
        });
      }
    }

    await base44.asServiceRole.entities.ReferralProgress.update(progress.id, updateData);

    return Response.json({ 
      success: true,
      reward_granted: newPending === 0,
      total_referrals: newTotal,
      pending: newPending,
    });
  } catch (error) {
    console.error('Track referral error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});