/**
 * grantRevenueCatPremium
 * Called from the client after a successful RevenueCat purchase.
 * Verifies the entitlement server-side via RevenueCat REST API,
 * then marks the user's profile as premium.
 */
import { createClientFromRequest } from "npm:@base44/sdk@0.8.23";

const RC_SECRET_KEY = Deno.env.get("REVENUECAT_SECRET_KEY");

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planType } = await req.json();

    // Verify entitlement with RevenueCat REST API
    let rcEntitled = false;
    if (RC_SECRET_KEY) {
      try {
        const rcRes = await fetch(
          `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(user.email)}`,
          {
            headers: {
              Authorization: `Bearer ${RC_SECRET_KEY}`,
              "Content-Type": "application/json",
            },
          }
        );
        if (rcRes.ok) {
          const rcData = await rcRes.json();
          const entitlements = rcData?.subscriber?.entitlements ?? {};
          const premiumEntitlement = entitlements["premium"];
          if (premiumEntitlement && premiumEntitlement.expires_date) {
            const expires = new Date(premiumEntitlement.expires_date);
            rcEntitled = expires > new Date();
          }
        }
      } catch (rcErr) {
        console.error("RevenueCat verification failed:", rcErr.message);
      }
    } else {
      // No secret key configured — trust client (development mode)
      console.warn("REVENUECAT_SECRET_KEY not set — trusting client IAP report");
      rcEntitled = true;
    }

    if (!rcEntitled) {
      return Response.json(
        { error: "No active RevenueCat entitlement found" },
        { status: 402 }
      );
    }

    // Grant premium on the user's profile
    const profiles = await base44.entities.UserProfile.filter({
      created_by: user.email,
    });
    const profile = profiles[0];

    if (!profile) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    const isPower = planType && planType.includes('power');
    await base44.entities.UserProfile.update(profile.id, {
      is_premium: true,
      premium_source: "subscription",
      subscription_status: "active",
      plan_type: isPower ? 'power' : 'premium',
    });

    return Response.json({
      success: true,
      message: "Premium granted via RevenueCat IAP",
      planType,
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});