/**
 * useIAP — RevenueCat In-App Purchase hook
 *
 * On iOS/Android (Capacitor): uses @revenuecat/purchases-capacitor
 * On Web/PWA: isNative=false, all methods are no-ops so callers fall back to Stripe
 *
 * RevenueCat product IDs (set in RevenueCat dashboard):
 *   balancen_monthly   → monthly subscription
 *   balancen_yearly    → yearly subscription
 */
import { useState, useEffect, useCallback } from "react";

const RC_API_KEY_IOS = "appl_YOUR_REVENUECAT_IOS_KEY"; // Replace with real key
const RC_API_KEY_ANDROID = "goog_YOUR_REVENUECAT_ANDROID_KEY"; // Replace with real key

// RevenueCat product identifiers — must match what's configured in RevenueCat dashboard
export const RC_PRODUCT_IDS = {
  monthly: "balancen_monthly",
  yearly: "balancen_yearly",
};

// Detect if running inside a Capacitor native shell
function isCapacitorNative() {
  return (
    typeof window !== "undefined" &&
    window.Capacitor?.isNativePlatform?.() === true
  );
}

function getCapacitorPlatform() {
  return window.Capacitor?.getPlatform?.() || "web";
}

export function useIAP(userEmail) {
  const [isNative] = useState(isCapacitorNative);
  const [platform] = useState(getCapacitorPlatform);
  const [offerings, setOfferings] = useState(null);
  const [rcReady, setRcReady] = useState(false);
  const [rcError, setRcError] = useState(null);

  useEffect(() => {
    if (!isNative || !userEmail) return;

    let cancelled = false;

    async function init() {
      try {
        // Dynamic require via window.Capacitor plugin — avoids Rollup resolution at build time
        // RevenueCat Capacitor SDK registers itself as a Capacitor plugin at runtime
        const Purchases = window.Purchases;
        if (!Purchases) throw new Error("RevenueCat Purchases plugin not available");

        const apiKey = platform === "android" ? RC_API_KEY_ANDROID : RC_API_KEY_IOS;

        await Purchases.configure({ apiKey });
        await Purchases.logIn({ appUserID: userEmail });

        const result = await Purchases.getOfferings();
        if (!cancelled) {
          setOfferings(result?.current ?? null);
          setRcReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("[useIAP] RevenueCat init failed:", err);
          setRcError(err?.message || "IAP unavailable");
        }
      }
    }

    init();
    return () => { cancelled = true; };
  }, [isNative, userEmail, platform]);

  /**
   * Purchase a product by plan key ("monthly" | "yearly")
   * Returns { success, customerInfo, error }
   */
  const purchase = useCallback(async (planKey) => {
    if (!isNative) return { success: false, error: "not_native" };

    try {
      const Purchases = window.Purchases;
      if (!Purchases) throw new Error("Purchases plugin not available");

      let pkg = null;
      if (offerings?.availablePackages?.length) {
        pkg = offerings.availablePackages.find(
          (p) =>
            p.product?.identifier === RC_PRODUCT_IDS[planKey] ||
            p.packageType === (planKey === "yearly" ? "ANNUAL" : "MONTHLY")
        );
      }

      if (!pkg) {
        const { customerInfo } = await Purchases.purchaseStoreProduct({
          product: { productIdentifier: RC_PRODUCT_IDS[planKey] },
        });
        return { success: true, customerInfo };
      }

      const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
      return { success: true, customerInfo };
    } catch (err) {
      if (err?.code === "PURCHASE_CANCELLED") {
        return { success: false, cancelled: true, error: "cancelled" };
      }
      return { success: false, error: err?.message || "Purchase failed" };
    }
  }, [isNative, offerings]);

  /**
   * Restore purchases (required by App Store guidelines)
   * Returns { success, customerInfo, error }
   */
  const restore = useCallback(async () => {
    if (!isNative) return { success: false, error: "not_native" };
    try {
      const Purchases = window.Purchases;
      if (!Purchases) throw new Error("Purchases plugin not available");
      const { customerInfo } = await Purchases.restorePurchases();
      return { success: true, customerInfo };
    } catch (err) {
      return { success: false, error: err?.message || "Restore failed" };
    }
  }, [isNative]);

  const checkEntitlement = useCallback(async () => {
    if (!isNative) return false;
    try {
      const Purchases = window.Purchases;
      if (!Purchases) return false;
      const { customerInfo } = await Purchases.getCustomerInfo();
      return !!customerInfo?.entitlements?.active?.["premium"];
    } catch {
      return false;
    }
  }, [isNative]);

  return {
    isNative,
    platform,
    rcReady,
    rcError,
    offerings,
    purchase,
    restore,
    checkEntitlement,
  };
}