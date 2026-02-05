import { createClientFromRequest } from 'npm:@base44/sdk';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const secrets = await base44.secrets.get(['STRIPE_SECRET_KEY']);
    const stripe = new Stripe(secrets.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    // Get user profile
    const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
    const profile = profiles[0];

    if (!profile?.stripe_subscription_id) {
      return Response.json({ error: 'No active subscription found' }, { status: 400 });
    }

    // Cancel at period end (user keeps access until then)
    const subscription = await stripe.subscriptions.update(
      profile.stripe_subscription_id,
      {
        cancel_at_period_end: true,
      }
    );

    // Update profile
    await base44.entities.UserProfile.update(profile.id, {
      premium_status: 'canceling',
      premium_expires: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
    });

    return Response.json({
      success: true,
      message: 'Subscription will cancel at period end',
      expiresAt: subscription.current_period_end,
    });
  } catch (error) {
    console.error('Subscription cancel error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});