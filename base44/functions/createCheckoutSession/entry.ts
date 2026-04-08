import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import Stripe from 'npm:stripe@17.5.0';

// VERSION 4 - FORCING FRESH DEPLOY
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  try {
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { priceId, planType } = body;

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    console.log('Stripe key prefix:', stripeKey ? stripeKey.substring(0, 7) : 'MISSING');
    
    if (!stripeKey || !stripeKey.startsWith('sk_')) {
      console.error('Invalid Stripe key - must start with sk_');
      return Response.json({ 
        error: 'Invalid Stripe key configuration',
        hint: 'Key must start with sk_live_ or sk_test_'
      }, { status: 500 });
    }

    const stripe = new Stripe(stripeKey, { apiVersion: '2023-10-16' });

    let envKey;
    if (planType === 'yearly') envKey = 'STRIPE_YEARLY_PRICE_ID_EUR';
    else if (planType === 'power_yearly') envKey = 'STRIPE_POWER_YEARLY_PRICE_ID_EUR';
    else if (planType === 'power_monthly') envKey = 'STRIPE_POWER_MONTHLY_PRICE_ID_EUR';
    else envKey = 'STRIPE_MONTHLY_PRICE_ID_EUR';

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
        trial_period_days: 5,
        metadata: {
          user_email: user.email,
          user_id: user.id,
          plan_type: planType || 'monthly',
        },
      },
      metadata: {
        user_email: user.email,
        user_id: user.id,
        plan_type: planType || 'monthly',
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