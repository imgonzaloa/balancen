import { createClientFromRequest } from 'npm:@base44/sdk';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const publishableKey = Deno.env.get('STRIPE_PUBLISHABLE_KEY');
    
    return Response.json({
      publishableKey,
      region: 'EUR',
      currency: '€',
      prices: { monthly: 6.99, yearly: 49.99 },
      priceIds: {
        monthly: "price_1TH2SnD56iwN3Uici60yeYWD",
        yearly: "price_1TH2TKD56iwN3UicoDA57a3s"
      }
    });
  } catch (error) {
    console.error('Error getting Stripe config:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});