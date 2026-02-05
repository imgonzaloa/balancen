/**
 * Cancel Stripe subscription
 * User can cancel anytime - access continues until period ends
 */

export default async function cancelSubscription(input, { user, secrets, base44 }) {
  if (!user) {
    throw new Error("Authentication required");
  }

  const stripe = require('stripe')(secrets.STRIPE_SECRET_KEY);
  
  // Get user profile
  const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
  const profile = profiles[0];

  if (!profile?.stripe_subscription_id) {
    throw new Error("No active subscription found");
  }

  try {
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

    return {
      success: true,
      message: 'Subscription will cancel at period end',
      expiresAt: subscription.current_period_end,
    };
  } catch (error) {
    console.error('Subscription cancel error:', error);
    throw new Error(`Failed to cancel subscription: ${error.message}`);
  }
}