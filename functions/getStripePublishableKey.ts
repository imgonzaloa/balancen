/**
 * Get Stripe publishable key for client-side
 */

export default async function getStripePublishableKey(input, { secrets }) {
  return {
    publishableKey: secrets.STRIPE_PUBLISHABLE_KEY,
    monthlyPriceId: secrets.STRIPE_MONTHLY_PRICE_ID,
    yearlyPriceId: secrets.STRIPE_YEARLY_PRICE_ID,
  };
}