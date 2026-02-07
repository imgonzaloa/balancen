import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { invite_code } = await req.json();

    if (!invite_code) {
      return Response.json({ success: true, message: 'No referral code' });
    }

    // Find invite
    const invites = await base44.asServiceRole.entities.Invite.filter({ 
      invite_code: invite_code 
    });

    if (invites.length === 0) {
      return Response.json({ success: false, message: 'Invalid invite code' });
    }

    const invite = invites[0];

    // Check if expired
    if (new Date(invite.expires_at) < new Date()) {
      await base44.asServiceRole.entities.Invite.update(invite.id, { 
        status: 'expired' 
      });
      return Response.json({ success: false, message: 'Invite expired' });
    }

    // Update invite with new user
    await base44.asServiceRole.entities.Invite.update(invite.id, {
      invitee_email: user.email,
      status: 'registered',
      registered_at: new Date().toISOString(),
    });

    return Response.json({ 
      success: true, 
      inviter_email: invite.inviter_email 
    });
  } catch (error) {
    console.error('Referral signup error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});