import { createClientFromRequest } from 'npm:@base44/sdk';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const publishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY');
    const monthlyEUR = Deno.env.get('STRIPE_MONTHLY_PRICE_ID_EUR');
    const yearlyEUR = Deno.env.get('STRIPE_YEARLY_PRICE_ID_EUR');
    
    return Response.json({
      publishableKey,
      region: 'EUR',
      currency: '€',
      prices: { monthly: 6.99, yearly: 49.99 },
      priceIds: {
        monthly: monthlyEUR,
        yearly: yearlyEUR
      }
    });
  } catch (error) {
    console.error('Error getting Stripe config:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});