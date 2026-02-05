/**
 * Create Stripe Checkout Session with card-required trial
 * 
 * Usage: POST with { priceId: "price_xxx", planType: "monthly" | "yearly" }
 */

export default async function createCheckoutSession({ priceId, planType }, { user, secrets, base44 }) {
  if (!user) {
    throw new Error("Authentication required");
  }

  const stripe = require('stripe')(secrets.STRIPE_SECRET_KEY);
  
  // Get user profile
  const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
  const profile = profiles[0];

  try {
    const session = await stripe.checkout.sessions.create({
      customer_email: user.email,
      mode: 'subscription',
      payment_method_collection: 'always', // CARD REQUIRED BEFORE TRIAL
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: 7, // 7-day trial
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
      success_url: `${process.env.APP_URL || 'http://localhost:3000'}/Home?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL || 'http://localhost:3000'}/Premium`,
      allow_promotion_codes: true,
    });

    return {
      sessionId: session.id,
      url: session.url,
    };
  } catch (error) {
    console.error('Stripe checkout error:', error);
    throw new Error(`Failed to create checkout session: ${error.message}`);
  }
}