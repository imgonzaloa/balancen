import { createClientFromRequest } from 'npm:@base44/sdk';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    return Response.json({
      publishableKey: "pk_live_51TH2EOD56iwN3Uic40aSoP0HcuR6PL4JcUnYeH2dwOUzi2aWDJ2vlK5hEh2qMWd4q7kPbBiQ8FuEVBMYKcNCwYA600DEDsDrsX",
      region: 'EUR',
      currency: '€',
      prices: { monthly: 8.99, yearly: 52.99 },
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