import { createClientFromRequest } from 'npm:@base44/sdk';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId, planType } = body;

    const secrets = await base44.secrets.get(['STRIPE_SECRET_KEY']);
    const stripe = new Stripe(secrets.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    // Get user profile
    const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
    const profile = profiles[0];

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: 'subscription',
      payment_method_collection: 'always',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_email: user.email,
          user_id: user.id,
          plan_type: planType,
        },
      },
      metadata: {
        user_email: user.email,
        user_id: user.id,
        plan_type: planType,
      },
      success_url: `${req.headers.get('origin')}/Home?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.get('origin')}/Premium`,
      allow_promotion_codes: true,
    });

    return Response.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});