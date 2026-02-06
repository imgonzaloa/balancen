import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId, selectedPlan, region } = body;

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey || !stripeKey.startsWith('sk_')) {
      return Response.json({ error: 'Invalid Stripe configuration' }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    const finalRegion = region || 'USD_US';
    const priceType = selectedPlan === 'yearly' ? 'YEARLY' : 'MONTHLY';
    const envKey = `STRIPE_${priceType}_PRICE_ID_${finalRegion}`;
    const finalPriceId = priceId || Deno.env.get(envKey);

    if (!finalPriceId) {
      return Response.json({ error: 'Price not configured' }, { status: 500 });
    }

    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: 'subscription',
      payment_method_collection: 'always',
      line_items: [{
        price: finalPriceId,
        quantity: 1,
      }],
      subscription_data: {
        trial_period_days: 7,
        metadata: {
          user_email: user.email,
          user_id: user.id,
        },
      },
      metadata: {
        user_email: user.email,
        user_id: user.id,
      },
      success_url: `https://${req.headers.get('host')}/Home?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `https://${req.headers.get('host')}/Premium`,
      allow_promotion_codes: true,
    });

    return Response.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return Response.json({ 
      error: error.message,
      details: error.toString()
    }, { status: 500 });
  }
});