import { createClientFromRequest } from 'npm:@base44/sdk';
import Stripe from 'npm:stripe@17.5.0';

// Force redeploy - refresh secrets
Deno.serve(async (req) => {
        console.log('=== Checkout function started ===');
        const base44 = createClientFromRequest(req);

        try {
          const user = await base44.auth.me();
          console.log('User authenticated:', user?.email);
          if (!user) {
            return Response.json({ error: 'Authentication required' }, { status: 401 });
          }

          const body = await req.json();
                  console.log('Request body:', body);
                  const { priceId, planType, selectedPlan, region } = body;

          console.log('Checkout request received:', { priceId, planType, selectedPlan, region });

            const secretKey = Deno.env.get('STRIPE_SECRET_KEY');
                      if (!secretKey) {
                        return Response.json({ error: 'Stripe secret key not configured' }, { status: 500 });
                      }

                      const stripe = new Stripe(secretKey, {
                        apiVersion: '2023-10-16',
                      });

                      // Get the correct price ID from environment variables
                      const finalRegion = region || 'USD_US';
                      const priceType = selectedPlan === 'yearly' ? 'YEARLY' : 'MONTHLY';
                      const envKey = `STRIPE_${priceType}_PRICE_ID_${finalRegion}`;
                      const finalPriceId = priceId || Deno.env.get(envKey);

                      if (!finalPriceId) {
                        console.error(`Price ID not found: ${envKey}`);
                        return Response.json({ error: 'Price configuration error' }, { status: 500 });
                      }

                      console.log('Using price ID:', finalPriceId);

                      const session = await stripe.checkout.sessions.create({
                        customer_email: user.email,
                        mode: 'subscription',
                        payment_method_collection: 'always',
                        line_items: [
                          {
                            price: finalPriceId,
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
        console.error('Full error:', JSON.stringify(error));
        return Response.json({ 
          error: error.message,
          details: error.toString(),
          stack: error.stack
        }, { status: 500 });
      }
});