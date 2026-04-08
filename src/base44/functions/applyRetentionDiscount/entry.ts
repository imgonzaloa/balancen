import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { userEmail, discountedPrice } = await req.json();

    // Verify the email matches authenticated user
    if (userEmail !== user.email) {
      return Response.json({ error: 'Email mismatch' }, { status: 400 });
    }

    // Find user profile
    const profiles = await base44.entities.UserProfile.filter({ created_by: userEmail });
    if (!profiles || profiles.length === 0) {
      return Response.json({ error: 'Profile not found' }, { status: 404 });
    }

    const profile = profiles[0];

    // Update profile with retention discount flag
    await base44.entities.UserProfile.update(profile.id, {
      retention_offer_accepted: true
    });

    // Log retention event for analytics
    console.log(`[RETENTION] User ${userEmail} applied discount. Price: €${discountedPrice}`);

    return Response.json({
      success: true,
      message: 'Retention discount applied',
      userEmail,
      discountedPrice
    });
  } catch (error) {
    console.error('Error applying retention discount:', error);
    return Response.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
});