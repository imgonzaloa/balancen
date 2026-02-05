/**
 * Handle Stripe webhook events
 * Updates user subscription status in real-time
 * 
 * Events handled:
 * - checkout.session.completed: Trial started (card captured)
 * - customer.subscription.created: Subscription created
 * - customer.subscription.updated: Subscription status changed
 * - customer.subscription.deleted: Subscription canceled
 * - invoice.payment_succeeded: Payment successful
 * - invoice.payment_failed: Payment failed
 */

export default async function handleStripeWebhook(event, { secrets, base44 }) {
  const stripe = require('stripe')(secrets.STRIPE_SECRET_KEY);
  
  // Verify webhook signature
  const signature = event.headers['stripe-signature'];
  let stripeEvent;
  
  try {
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      secrets.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { error: 'Invalid signature' };
  }

  const eventType = stripeEvent.type;
  const data = stripeEvent.data.object;

  console.log(`Processing webhook: ${eventType}`);

  try {
    switch (eventType) {
      case 'checkout.session.completed': {
        // User completed checkout - trial started with card on file
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
        // Subscription status changed
        const subscription = data;
        const customerEmail = subscription.metadata?.user_email;
        
        if (customerEmail) {
          const profiles = await base44.asServiceRole.entities.UserProfile.filter({ 
            created_by: customerEmail 
          });
          
          if (profiles.length > 0) {
            const status = subscription.status; // trialing, active, past_due, canceled, unpaid
            const isPremium = ['trialing', 'active'].includes(status);
            
            const updateData = {
              is_premium: isPremium,
              premium_status: status,
              stripe_subscription_id: subscription.id,
              stripe_customer_id: subscription.customer,
            };

            // Set expiration date if canceled or past_due
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
        // Subscription canceled/expired
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
        // Payment successful - ensure premium active
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
        // Payment failed - mark as past_due
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

    return { received: true };
  } catch (error) {
    console.error('Webhook processing error:', error);
    return { error: error.message };
  }
}