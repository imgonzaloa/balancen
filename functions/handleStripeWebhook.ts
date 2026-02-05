import { createClientFromRequest } from 'npm:@base44/sdk';
import Stripe from 'npm:stripe@17.5.0';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  
  try {
    const secrets = await base44.secrets.get(['STRIPE_SECRET_KEY', 'STRIPE_WEBHOOK_SECRET']);
    const stripe = new Stripe(secrets.STRIPE_SECRET_KEY, {
      apiVersion: '2023-10-16',
    });

    const signature = req.headers.get('stripe-signature');
    const body = await req.text();

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        secrets.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return Response.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const eventType = event.type;
    const data = event.data.object;

    console.log(`Processing webhook: ${eventType}`);

    switch (eventType) {
      case 'checkout.session.completed': {
        const customerEmail = data.customer_email || data.customer_details?.email;
        const subscriptionId = data.subscription;
        
        if (customerEmail) {
          const profiles = await base44.asServiceRole.entities.UserProfile.filter({ 
            created_by: customerEmail 
          });
          
          if (profiles.length > 0) {
            await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
              is_premium: true,
              premium_status: 'trialing',
              stripe_subscription_id: subscriptionId,
              stripe_customer_id: data.customer,
            });
            console.log(`Premium trial activated for ${customerEmail}`);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = data;
        const customerEmail = subscription.metadata?.user_email;
        
        if (customerEmail) {
          const profiles = await base44.asServiceRole.entities.UserProfile.filter({ 
            created_by: customerEmail 
          });
          
          if (profiles.length > 0) {
            const status = subscription.status;
            const isPremium = ['trialing', 'active'].includes(status);
            
            const updateData = {
              is_premium: isPremium,
              premium_status: status,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
            };

            if (subscription.cancel_at) {
              updateData.premium_expires = new Date(subscription.cancel_at * 1000).toISOString().split('T')[0];
            } else if (subscription.current_period_end) {
              updateData.premium_expires = new Date(subscription.current_period_end * 1000).toISOString().split('T')[0];
            }

            await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, updateData);
            console.log(`Premium status updated for ${customerEmail}: ${status}`);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = data;
        const customerEmail = subscription.metadata?.user_email;
        
        if (customerEmail) {
          const profiles = await base44.asServiceRole.entities.UserProfile.filter({ 
            created_by: customerEmail 
          });
          
          if (profiles.length > 0) {
            await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
              is_premium: false,
              premium_status: 'canceled',
              premium_expires: new Date().toISOString().split('T')[0],
            });
            console.log(`Premium canceled for ${customerEmail}`);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = data;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customerEmail = subscription.metadata?.user_email;
          
          if (customerEmail) {
            const profiles = await base44.asServiceRole.entities.UserProfile.filter({ 
              created_by: customerEmail 
            });
            
            if (profiles.length > 0) {
              await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
                is_premium: true,
                premium_status: 'active',
                premium_expires: new Date(subscription.current_period_end * 1000).toISOString().split('T')[0],
              });
              console.log(`Payment succeeded for ${customerEmail}`);
            }
          }
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = data;
        const subscriptionId = invoice.subscription;
        
        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const customerEmail = subscription.metadata?.user_email;
          
          if (customerEmail) {
            const profiles = await base44.asServiceRole.entities.UserProfile.filter({ 
              created_by: customerEmail 
            });
            
            if (profiles.length > 0) {
              await base44.asServiceRole.entities.UserProfile.update(profiles[0].id, {
                premium_status: 'past_due',
              });
              console.log(`Payment failed for ${customerEmail}`);
            }
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    return Response.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});