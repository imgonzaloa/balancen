import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { X, Check, Sparkles, Crown, Loader2, LogOut, Flame, Utensils, Calendar, GraduationCap, Trophy, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { useAppState } from "@/components/AppStateContext";
import { useEntitlement } from "@/components/hooks/useEntitlement";
import { useIAP } from "@/components/hooks/useIAP";

function hardReset() {
  try { localStorage.clear(); sessionStorage.clear(); } catch (_) {}
  window.location.replace('/');
}

async function safeLogout() {
  try { await base44.auth.logout('/'); } catch (_) { hardReset(); }
}

export default function Paywall() {
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [loading, setLoading] = useState(false);
  const [purchaseError, setPurchaseError] = useState(null);
  const [pricing, setPricing] = useState(null);
  const [userStats, setUserStats] = useState(null);

  const { profile, user: appUser } = useAppState();
   const { isTrialExpired, trialDaysLeft, isPremium, isEntitled, isCampusAccess, isCampusReward, isAccessExpired, accessDaysLeft, campus_consistency_percent } = useEntitlement(profile);
   const { t, lang } = useTranslation();
  const { isNative, purchase, restore } = useIAP(appUser?.email);

  const isCampusExpired = isAccessExpired && (profile?.access_type === 'campus_access' || profile?.access_type === 'campus_reward' || profile?.access_type === 'expired');
  const showCampusStats = isCampusExpired || isCampusAccess || isCampusReward;

  useEffect(() => {
    // Only load Stripe pricing on web
     if (!isNative) {
       base44.functions.invoke('getStripePublishableKey', {})
         .then(res => setPricing(res.data))
         .catch(() => setPricing({
           region: 'EUR', currency: '€',
           prices: { monthly: 6.99, yearly: 49.99, power_monthly: 12.99, power_yearly: 89.99 },
           priceIds: { monthly: null, yearly: null, power_monthly: null, power_yearly: null }
         }));
     } else {
       // On native, show fallback prices (RevenueCat will use store prices)
       setPricing({ region: 'EUR', currency: '€', prices: { monthly: 6.99, yearly: 49.99, power_monthly: 12.99, power_yearly: 89.99 }, priceIds: {} });
     }

    if (appUser?.email) {
      Promise.all([
        base44.entities.MealLog.filter({ created_by: appUser.email }),
        base44.entities.DailyCheckIn.filter({ created_by: appUser.email }),
      ]).then(([meals, checkins]) => {
        setUserStats({
          mealsLogged: meals?.length || 0,
          daysTracked: checkins?.length || 0,
          streak: profile?.current_streak || 0,
          consistencyPercent: profile?.campus_consistency_percent ?? null,
        });
      }).catch(() => {
        setUserStats({ mealsLogged: 0, daysTracked: 0, streak: 0, consistencyPercent: null });
      });
    }
  }, [appUser?.email, profile?.current_streak, profile?.campus_consistency_percent, isNative]);

  const handleContinue = async () => {
    if (!appUser) { toast.error(t("please_login_continue")); return; }

    setLoading(true);
    setPurchaseError(null);

    // ── Native iOS/Android: RevenueCat IAP ──
    if (isNative) {
      const result = await purchase(selectedPlan);
      if (result.cancelled) { setLoading(false); return; }
      if (!result.success) {
        setPurchaseError(result.error || t("something_went_wrong"));
        setLoading(false);
        return;
      }
      // Verify server-side and grant premium
      try {
        await base44.functions.invoke('grantRevenueCatPremium', { planType: selectedPlan });
        toast.success(t("premium_activated"));
        window.location.href = createPageUrl('Home');
      } catch (err) {
        setPurchaseError(err?.message || t("something_went_wrong"));
      }
      setLoading(false);
      return;
    }

    // ── Web/PWA: Stripe Checkout ──
     if (!pricing) { toast.error(t("payment_not_configured")); setLoading(false); return; }
     try {
       // Map plan names: yearly, monthly, power → priceIds keys
       const planKey = selectedPlan.startsWith('power') ? selectedPlan : selectedPlan;
       const priceId = pricing.priceIds[planKey];
       const response = await base44.functions.invoke('createCheckoutSession', { priceId, planType: selectedPlan });
       if (!response?.data?.url) throw new Error('No checkout URL returned from server');
       window.location.href = response.data.url;
     } catch (error) {
       const msg = error?.response?.data?.error || error?.message || 'Unknown error';
       setPurchaseError(msg);
       setLoading(false);
     }
    };

  const handleRestore = async () => {
    if (!isNative) {
      toast.info(t("contact_support_restore"));
      return;
    }
    setLoading(true);
    const result = await restore();
    if (result.success) {
      try {
        await base44.functions.invoke('grantRevenueCatPremium', { planType: 'restored' });
        toast.success(t("purchase_restored"));
        window.location.href = createPageUrl('Home');
      } catch {
        toast.error(t("no_active_purchase"));
      }
    } else {
      toast.error(result.error || t("restore_failed"));
    }
    setLoading(false);
  };

  const handleClose = () => { window.location.href = createPageUrl('Home'); };

  const yearlyMonthly = pricing ? (pricing.prices.yearly / 12).toFixed(2) : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 relative overflow-hidden flex flex-col" style={{ pointerEvents: 'auto' }}>
      {/* Background glow */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-teal-500 rounded-full filter blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-emerald-500 rounded-full filter blur-3xl" />
      </div>

      <div className="max-w-lg mx-auto w-full px-5 pb-10 pt-12 relative z-10 flex flex-col" style={{ paddingTop: 'max(48px, env(safe-area-inset-top, 48px))' }}>

        {/* Close button — only if still entitled (trial user browsing paywall) */}
        {isEntitled && !isTrialExpired && (
          <div className="flex justify-end mb-4">
            <button onClick={handleClose}
              className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <X size={18} className="text-white" />
            </button>
          </div>
        )}

        {/* Header */}
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 mb-4 shadow-2xl shadow-teal-500/40">
            {showCampusStats ? <GraduationCap size={28} className="text-white" /> : <Crown size={28} className="text-white" />}
          </div>

          {isCampusExpired ? (
            <>
              <h1 className="text-3xl font-black text-white mb-2">{t("campus_access_ended")}</h1>
              <p className="text-white/60 text-base">{t("subscribe_continue_progress")}</p>
            </>
          ) : isTrialExpired ? (
            <>
              <h1 className="text-3xl font-black text-white mb-2">{t("your_trial_ended")}</h1>
              <p className="text-white/60 text-base">{t("subscribe_no_interruption")}</p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black text-white mb-2">{t("go_premium")}</h1>
              <p className="text-white/60 text-base">{t("full_access_no_limits")}</p>
            </>
          )}
        </motion.div>

        {/* Campus stats summary */}
        {showCampusStats && userStats && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            {userStats.consistencyPercent !== null && (
              <div className={`rounded-2xl p-4 mb-3 border text-center ${
                userStats.consistencyPercent >= 80
                  ? 'bg-emerald-500/15 border-emerald-500/40'
                  : 'bg-amber-500/15 border-amber-500/40'
              }`}>
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Trophy size={16} className={userStats.consistencyPercent >= 80 ? 'text-emerald-400' : 'text-amber-400'} />
                  <span className={`text-sm font-bold ${userStats.consistencyPercent >= 80 ? 'text-emerald-300' : 'text-amber-300'}`}>
                    {t("campus_consistency")}
                  </span>
                </div>
                <p className={`text-4xl font-black ${userStats.consistencyPercent >= 80 ? 'text-emerald-300' : 'text-amber-300'}`}>
                  {userStats.consistencyPercent}%
                </p>
                {userStats.consistencyPercent >= 80 ? (
                  <p className="text-emerald-400/80 text-xs mt-1">{t("great_work_keep_going")}</p>
                ) : (
                  <p className="text-amber-400/80 text-xs mt-1">{t("subscribe_improve_consistency")}</p>
                )}
              </div>
            )}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 grid grid-cols-3 gap-3">
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Calendar size={16} className="text-teal-400" />
                </div>
                <p className="text-2xl font-black text-white">{userStats.daysTracked}</p>
                <p className="text-white/50 text-xs">{t("days_tracked")}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Utensils size={16} className="text-emerald-400" />
                </div>
                <p className="text-2xl font-black text-white">{userStats.mealsLogged}</p>
                <p className="text-white/50 text-xs">{t("meals_logged_stat")}</p>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center mb-1">
                  <Flame size={16} className="text-orange-400" />
                </div>
                <p className="text-2xl font-black text-white">{userStats.streak}</p>
                <p className="text-white/50 text-xs">{t("streak_label")}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Trial stats (non-campus) */}
        {isTrialExpired && !showCampusStats && userStats && (
          <motion.div
            className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 grid grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Calendar size={16} className="text-teal-400" />
              </div>
              <p className="text-2xl font-black text-white">{userStats.daysTracked}</p>
              <p className="text-white/50 text-xs">{t("days_tracked")}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Utensils size={16} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white">{userStats.mealsLogged}</p>
              <p className="text-white/50 text-xs">{t("meals_logged_stat")}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Flame size={16} className="text-orange-400" />
              </div>
              <p className="text-2xl font-black text-white">{userStats.streak}</p>
              <p className="text-white/50 text-xs">{t("current_streak_label")}</p>
            </div>
          </motion.div>
        )}

        {/* Plan selector */}
         {pricing && (
           <motion.div className="mb-6" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
             {/* Annual — highlighted */}
             <button
               onClick={() => setSelectedPlan("yearly")}
               className={`w-full relative rounded-2xl p-5 mb-3 border-2 transition-all text-left ${
                 selectedPlan === 'yearly'
                   ? 'bg-gradient-to-r from-teal-500/25 to-emerald-500/25 border-teal-400 shadow-xl'
                   : 'bg-white/5 border-white/15 hover:border-white/30'
               }`}
             >
               <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                 {t("best_value_label")}
               </div>
               <div className="flex items-baseline gap-2 mb-1">
                 <span className="text-3xl font-black text-white">{pricing.currency}{pricing.prices.yearly}</span>
                 <span className="text-white/50 text-sm">/ {t("year_label")}</span>
               </div>
               <p className="text-teal-300 text-sm font-semibold">
                 {pricing.currency}{yearlyMonthly} / {t("month_label")} — {t("save_40")}
               </p>
             </button>

             {/* Monthly */}
             <button
               onClick={() => setSelectedPlan("monthly")}
               className={`w-full rounded-2xl p-4 border-2 transition-all text-left mb-3 ${
                 selectedPlan === 'monthly'
                   ? 'bg-white/10 border-white/40 shadow-lg'
                   : 'bg-white/5 border-white/15 hover:border-white/30'
               }`}
             >
               <div className="flex items-baseline gap-2">
                 <span className="text-2xl font-black text-white">{pricing.currency}{pricing.prices.monthly}</span>
                 <span className="text-white/50 text-sm">/ {t("month_label")}</span>
               </div>
             </button>

             {/* Power — Unlimited */}
             <button
               onClick={() => setSelectedPlan("power_yearly")}
               className={`w-full relative rounded-2xl p-4 border-2 transition-all text-left ${
                 selectedPlan === 'power_yearly' || selectedPlan === 'power_monthly'
                   ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 border-amber-400 shadow-lg'
                   : 'bg-white/5 border-white/15 hover:border-white/30'
               }`}
             >
               <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                 ∞ scans
               </div>
               <div className="flex items-baseline gap-2">
                 <span className="text-2xl font-black text-white">
                   {lang === 'es' ? 'Power — Ilimitado' : lang === 'nl' ? 'Power — Onbeperkt' : 'Power — Unlimited'}
                 </span>
               </div>
               <div className="flex items-baseline gap-2 mt-1">
                 <span className="text-xl font-black text-amber-300">{pricing?.currency || '€'}{pricing?.prices?.power_yearly || '89.99'}</span>
                 <span className="text-white/50 text-sm">/ {lang === 'es' ? 'año' : lang === 'nl' ? 'jaar' : 'year'}</span>
               </div>
             </button>
           </motion.div>
         )}

        {/* Features */}
        <motion.div
          className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 space-y-2.5"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          {[
            "feature_unlimited_ai",
            "feature_advanced_progress",
            "feature_groups_social",
            "feature_ai_recommendations",
            "feature_streak_metrics",
            "feature_history_export",
          ].map((key, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Check size={15} className="text-teal-400 flex-shrink-0" />
              <span className="text-white/80 text-sm">{t(key)}</span>
            </div>
          ))}
        </motion.div>

        {/* Error banner */}
        {purchaseError && (
          <div className="flex items-start gap-3 bg-red-500/20 border border-red-400/40 rounded-2xl p-4 mb-4">
            <p className="text-red-200 text-sm">{purchaseError}</p>
          </div>
        )}

        {/* CTA */}
        <motion.div className="space-y-3" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <button
            onClick={handleContinue}
            disabled={loading || !pricing}
            className="w-full py-5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-white font-black text-lg shadow-2xl shadow-teal-500/40 disabled:opacity-50 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            {loading ? (
              <><Loader2 size={20} className="animate-spin" /> {t("processing_ellipsis")}</>
            ) : isTrialExpired ? (
              <><Crown size={20} /> {t("unlock_premium")}</>
            ) : (
              <><Sparkles size={20} /> {t("try_for_free_cta")}</>
            )}
          </button>

          <p className="text-center text-xs text-white/40">
            {t("try_for_free_fine_print")}
          </p>

          <button
            onClick={handleRestore}
            className="w-full py-3 text-white/40 text-sm hover:text-white/70 transition-colors"
          >
            {t("restore_purchase")}
          </button>

          <button
            onClick={safeLogout}
            className="w-full py-3 text-white/30 text-xs hover:text-white/60 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={13} />
            {t("log_out")}
          </button>

          <button
            onClick={hardReset}
            className="w-full py-2 text-white/20 text-xs hover:text-white/50 transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={11} />
            {t("reset_session")}
          </button>
        </motion.div>
      </div>
    </div>
  );
}