import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { inviteCode } = await req.json();
    
    if (!inviteCode) {
      return Response.json({ error: 'Missing invite code' }, { status: 400 });
    }

    console.log('[REFERRAL] Tracking referral signup', { inviteCode, newUserEmail: user.email });

    // Find invite record
    const invites = await base44.asServiceRole.entities.Invite.filter({ invite_code: inviteCode });
    
    if (invites.length === 0) {
      console.log('[REFERRAL] Invite not found', { inviteCode });
      return Response.json({ error: 'Invalid invite code' }, { status: 404 });
    }

    const invite = invites[0];

    // Update invite with new user's email
    await base44.asServiceRole.entities.Invite.update(invite.id, {
      invitee_email: user.email,
      status: 'registered',
      registered_at: new Date().toISOString()
    });

    console.log('[REFERRAL] Invite updated', { inviteId: invite.id, inviterEmail: invite.inviter_email });

    return Response.json({ 
      success: true,
      inviter: invite.inviter_name || 'A friend'
    });

  } catch (error) {
    console.error('[REFERRAL] Error:', error);
    return Response.json({ 
      error: error.message || 'Failed to track referral' 
    }, { status: 500 });
  }
});