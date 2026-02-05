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

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });

    // Get user profile
    const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
    const profile = profiles[0];

    // Create or get customer
    let customerId = profile?.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          user_id: user.id,
        },
      });
      customerId = customer.id;
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
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