import { createClientFromRequest } from 'npm:@base44/sdk';
import Stripe from 'npm:stripe@17.5.0';

// Redeploy to reload secrets
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await req.json();
            const { priceId, planType } = body;

            console.log('Checkout request received:', { priceId, planType });

            if (!priceId) {
              console.error('Missing priceId');
              return Response.json({ error: 'Missing price ID' }, { status: 400 });
            }

            const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!secretKey) {
      return Response.json({ error: 'Stripe secret key not configured' }, { status: 500 });
    }

    const stripe = new Stripe(secretKey, {
      apiVersion: '2023-10-16',
    });

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
      success_url: `https://${req.headers.get('host')}/Home?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://${req.headers.get('host')}/Premium`,
      allow_promotion_codes: true,
    });

    return Response.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    console.error('Error details:', error.toString());
    return Response.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
});