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
  const [powerBilling, setPowerBilling] = useState("yearly");

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
        prices: { monthly: 8.99, yearly: 39.99, power_monthly: 12.99, power_yearly: 89.99 },
        priceIds: { monthly: null, yearly: null, power_monthly: null, power_yearly: null }
       }));
       } else {
       setPricing({ region: 'EUR', currency: '€', prices: { monthly: 8.99, yearly: 39.99, power_monthly: 12.99, power_yearly: 89.99 }, priceIds: {} });
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
       const planKey = selectedPlan;
       const priceId = pricing.priceIds[planKey];
       const response = await base44.functions.invoke('createCheckoutSession', { priceId, planType: selectedPlan, region: pricing?.region });
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
  const savingsPct = Math.round((1 - (39.99 / 12) / 8.99) * 100);

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
              <p className="text-white/60 text-base">
                {lang === 'es' ? 'Todo lo que necesitás para transformar tu alimentación' : lang === 'nl' ? 'Alles wat je nodig hebt voor betere voeding' : 'Everything you need to transform your nutrition'}
              </p>
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
                   : 'bg-white/5 border-white/15 opacity-80'
               }`}
             >
               {selectedPlan === 'yearly' && (
                 <div className="absolute top-3 right-3 text-teal-400">
                   <Check size={20} strokeWidth={3} />
                 </div>
               )}
               <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                 {t("best_value_label")}
               </div>
               <div className="flex items-baseline gap-2 mb-1">
                 <span className="text-3xl font-black text-white">{pricing.currency}{pricing.prices.yearly}</span>
                 <span className="text-white/50 text-sm">/ {t("year_label")}</span>
               </div>
               {trialDaysLeft !== null && trialDaysLeft <= 1 ? (
                 <p className="text-amber-400 text-sm font-bold">
                   {lang === 'es' ? '¡Última oportunidad! El trial termina hoy' : lang === 'nl' ? 'Laatste kans! Proefperiode eindigt vandaag' : 'Last chance! Trial ends today'}
                 </p>
               ) : (
                 <p className="text-teal-300 text-sm font-semibold">
                   {pricing.currency}{yearlyMonthly} / {t("month_label")} — {lang === 'es' ? 'Ahorrá un 63% vs mensual' : lang === 'nl' ? 'Bespaar 63% vs maandelijks' : 'Save 63% vs monthly'}
                 </p>
               )}
             </button>

             {/* Monthly */}
             <button
               onClick={() => setSelectedPlan("monthly")}
               className={`w-full relative rounded-2xl p-5 border-2 transition-all text-left mb-3 ${
                 selectedPlan === 'monthly'
                   ? 'bg-gradient-to-r from-teal-500/25 to-emerald-500/25 border-teal-400 shadow-lg shadow-teal-500/20'
                   : 'bg-white/5 border-white/15 opacity-80 hover:border-white/30'
               }`}
             >
               {selectedPlan === 'monthly' && (
                 <div className="absolute top-3 right-3 text-teal-400">
                   <Check size={20} strokeWidth={3} />
                 </div>
               )}
               <div className="flex items-baseline gap-2">
                 <span className="text-2xl font-black text-white">{pricing.currency}{pricing.prices.monthly}</span>
                 <span className="text-white/50 text-sm">/ {t("month_label")}</span>
               </div>
             </button>

             {/* Power — Unlimited */}
             <div className={`w-full relative rounded-2xl p-4 border-2 transition-all ${
                 selectedPlan === 'power_yearly' || selectedPlan === 'power_monthly'
                   ? 'bg-gradient-to-r from-amber-500/25 to-orange-500/25 border-amber-400 shadow-lg'
                   : 'bg-white/5 border-white/15'
               }`}>
               <div className="absolute top-3 right-3 bg-amber-500 text-white text-xs px-2.5 py-1 rounded-full font-bold">
                 ∞ scans
               </div>
               <div className="flex items-baseline gap-2 mb-3">
                 <span className="text-2xl font-black text-white">
                   {lang === 'es' ? 'Power — Ilimitado' : lang === 'nl' ? 'Power — Onbeperkt' : 'Power — Unlimited'}
                 </span>
               </div>

               {/* Monthly/Yearly Toggle */}
               <div className="flex gap-2 mb-3">
                 <button
                   onClick={() => {
                     setPowerBilling("monthly");
                     setSelectedPlan("power_monthly");
                   }}
                   className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                     powerBilling === "monthly"
                       ? 'bg-amber-500 text-white'
                       : 'bg-white/10 text-white/60 hover:bg-white/20'
                   }`}
                 >
                   {lang === 'es' ? 'Mensual' : lang === 'nl' ? 'Maandelijks' : 'Monthly'}
                 </button>
                 <button
                   onClick={() => {
                     setPowerBilling("yearly");
                     setSelectedPlan("power_yearly");
                   }}
                   className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all ${
                     powerBilling === "yearly"
                       ? 'bg-amber-500 text-white'
                       : 'bg-white/10 text-white/60 hover:bg-white/20'
                   }`}
                 >
                   {lang === 'es' ? 'Anual' : lang === 'nl' ? 'Jaarlijks' : 'Yearly'}
                 </button>
               </div>

               {/* Price */}
               <div className="flex items-baseline gap-2 mb-2">
                 <span className="text-xl font-black text-amber-300">
                   {pricing?.currency || '€'}{powerBilling === 'yearly' ? (pricing?.prices?.power_yearly || '89.99') : (pricing?.prices?.power_monthly || '12.99')}
                 </span>
                 <span className="text-white/50 text-sm">/ {powerBilling === 'yearly' ? (lang === 'es' ? 'año' : lang === 'nl' ? 'jaar' : 'year') : (lang === 'es' ? 'mes' : lang === 'nl' ? 'maand' : 'month')}</span>
               </div>

               {/* Savings note when yearly */}
               {powerBilling === 'yearly' && (
                 <p className="text-amber-300 text-xs">
                   {lang === 'es' ? 'Ahorrá €65/año' : lang === 'nl' ? 'Bespaar €65/jaar' : 'Save €65/year'}
                 </p>
               )}
             </div>
           </motion.div>
           )}

           {/* Plan Comparison - Dynamic */}
           {pricing && (
           <motion.div
            className={`border rounded-2xl overflow-hidden mb-6 ${
              selectedPlan === 'power_yearly' || selectedPlan === 'power_monthly'
                ? 'bg-amber-900/40 border-amber-500/30'
                : 'bg-teal-900/40 border-teal-500/30'
            }`}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.17 }}
           >
            {/* Header row */}
            <div className={`grid grid-cols-3 border-b ${
              selectedPlan === 'power_yearly' || selectedPlan === 'power_monthly'
                ? 'bg-amber-600/60 border-amber-500/30'
                : 'bg-teal-600/60 border-teal-500/30'
            }`}>
              <div className={`p-3 text-xs font-bold border-r ${
                selectedPlan === 'power_yearly' || selectedPlan === 'power_monthly'
                  ? 'text-white/60 border-amber-500/20'
                  : 'text-white/60 border-teal-500/20'
              }`} />
              <div className={`p-3 text-xs font-bold text-center ${
                selectedPlan === 'power_yearly' || selectedPlan === 'power_monthly'
                  ? 'text-white'
                  : 'text-teal-300'
              }`}>
                {selectedPlan === 'power_monthly' || selectedPlan === 'power_yearly'
                  ? lang === 'es' ? 'Premium (Alternativa)' : lang === 'nl' ? 'Premium (Alternatief)' : 'Premium (Alternative)'
                  : selectedPlan === 'monthly'
                  ? (lang === 'es' ? `Premium — €8.99/${lang === 'es' ? 'mes' : lang === 'nl' ? 'maand' : 'month'}` : lang === 'nl' ? `Premium — €8.99/maand` : `Premium — €8.99/month`)
                  : (lang === 'es' ? `Premium — €39.99/${lang === 'es' ? 'año' : lang === 'nl' ? 'jaar' : 'year'}` : lang === 'nl' ? `Premium — €39.99/jaar` : `Premium — €39.99/year`)
                }
              </div>
              <div className={`p-3 text-xs font-bold text-center ${
                selectedPlan === 'power_yearly' || selectedPlan === 'power_monthly'
                  ? 'text-amber-300'
                  : 'text-white'
              }`}>
                {selectedPlan === 'power_monthly'
                  ? (lang === 'es' ? `Power — €12.99/mes` : lang === 'nl' ? `Power — €12.99/maand` : `Power — €12.99/month`)
                  : selectedPlan === 'power_yearly'
                  ? (lang === 'es' ? `Power — €89.99/año` : lang === 'nl' ? `Power — €89.99/jaar` : `Power — €89.99/year`)
                  : (lang === 'es' ? 'Power (Premium+)' : lang === 'nl' ? 'Power (Premium+)' : 'Power (Premium+)')
                }
              </div>
            </div>

            {/* Rows */}
            {[
              {
                label: lang === 'es' ? '📸 Análisis IA' : lang === 'nl' ? '📸 AI-analyse' : '📸 AI Analysis',
                premium: selectedPlan === 'monthly' || selectedPlan === 'power_monthly' ? (lang === 'es' ? '300/mes' : lang === 'nl' ? '300/mnd' : '300/mo') : (lang === 'es' ? '300/mes' : lang === 'nl' ? '300/mnd' : '300/mo'),
                power: lang === 'es' ? '∞ Ilimitado' : lang === 'nl' ? '∞ Onbeperkt' : '∞ Unlimited'
              },
              {
                label: lang === 'es' ? '💰 Precio' : lang === 'nl' ? '💰 Prijs' : '💰 Price',
                premium: selectedPlan === 'monthly' 
                  ? (lang === 'es' ? '€8.99/mes' : lang === 'nl' ? '€8.99/maand' : '€8.99/month')
                  : selectedPlan === 'power_monthly'
                  ? (lang === 'es' ? '€8.99/mes' : lang === 'nl' ? '€8.99/maand' : '€8.99/month')
                  : selectedPlan === 'power_yearly'
                  ? (lang === 'es' ? '€39.99/año' : lang === 'nl' ? '€39.99/jaar' : '€39.99/year')
                  : (lang === 'es' ? '€39.99/año' : lang === 'nl' ? '€39.99/jaar' : '€39.99/year'),
                power: selectedPlan === 'power_monthly' 
                  ? (lang === 'es' ? '€12.99/mes' : lang === 'nl' ? '€12.99/maand' : '€12.99/month')
                  : (lang === 'es' ? '€89.99/año' : lang === 'nl' ? '€89.99/jaar' : '€89.99/year')
              },
              {
                label: lang === 'es' ? '💡 Ventaja' : lang === 'nl' ? '💡 Voordeel' : '💡 Advantage',
                premium: selectedPlan === 'monthly'
                  ? (lang === 'es' ? 'Ahorrá €4/mes' : lang === 'nl' ? 'Bespaar €4/maand' : 'Save €4/month')
                  : selectedPlan === 'power_monthly'
                  ? (lang === 'es' ? 'Ahorrá €4/mes' : lang === 'nl' ? 'Bespaar €4/maand' : 'Save €4/month')
                  : (lang === 'es' ? 'Mejor valor' : lang === 'nl' ? 'Beste waarde' : 'Best value'),
                power: selectedPlan === 'power_monthly' 
                  ? (lang === 'es' ? 'Análisis ilimitados' : lang === 'nl' ? 'Onbeperkte analyses' : 'Unlimited analyses')
                  : (lang === 'es' ? 'Análisis ilimitados' : lang === 'nl' ? 'Onbeperkte analyses' : 'Unlimited analyses')
              },
              {
                label: lang === 'es' ? '🔥 Streaks y retos' : lang === 'nl' ? '🔥 Streaks & uitdagingen' : '🔥 Streaks & challenges',
                premium: '✓',
                power: '✓'
              },
              {
                label: lang === 'es' ? '👥 Feed social' : lang === 'nl' ? '👥 Sociale feed' : '👥 Social feed',
                premium: '✓',
                power: '✓'
              },
              {
                label: lang === 'es' ? '🤖 Coach IA' : lang === 'nl' ? '🤖 AI Coach' : '🤖 AI Coach',
                premium: '✓',
                power: '✓'
              },
              {
                label: lang === 'es' ? '📷 Fotos de progreso' : lang === 'nl' ? '📷 Voortgangsfoto\'s' : '📷 Progress photos',
                premium: '✓',
                power: '✓'
              },
              {
                label: lang === 'es' ? '🏆 Para quién' : lang === 'nl' ? '🏆 Voor wie' : '🏆 Best for',
                premium: lang === 'es' ? 'Usuario regular' : lang === 'nl' ? 'Standaardgebruiker' : 'Regular user',
                power: lang === 'es' ? 'Usuario intensivo' : lang === 'nl' ? 'Intensieve gebruiker' : 'Power user'
              }
            ].map((row, i) => (
              <div key={i} className={`grid grid-cols-3 border-b last:border-b-0 ${
                selectedPlan === 'power_yearly' || selectedPlan === 'power_monthly'
                  ? 'border-amber-500/20'
                  : 'border-teal-500/20'
              }`}>
                <div className={`p-3 text-xs font-semibold border-r ${
                  selectedPlan === 'power_yearly' || selectedPlan === 'power_monthly'
                    ? 'text-white/70 border-amber-500/20'
                    : 'text-white/70 border-teal-500/20'
                }`}>
                  {row.label}
                </div>
                <div className={`p-3 text-xs text-center font-semibold ${
                  selectedPlan === 'power_yearly' || selectedPlan === 'power_monthly'
                    ? 'text-white'
                    : 'text-teal-300'
                }`}>{row.premium}</div>
                <div className={`p-3 text-xs font-semibold text-center ${
                  selectedPlan === 'power_yearly' || selectedPlan === 'power_monthly'
                    ? 'text-amber-300'
                    : 'text-white'
                }`}>{row.power}</div>
              </div>
            ))}
           </motion.div>
           )}

           {/* Features */}
           <motion.div
           className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 space-y-2.5"
           initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
           >
           {/* AI Scans feature at top — changes based on selected plan */}
           <div className="flex items-start gap-2.5 pb-2.5 border-b border-white/10">
            <Check size={15} className="text-teal-400 flex-shrink-0 mt-0.5" />
            <span className="text-white/80 text-sm">
              📸 {(selectedPlan === 'power_monthly' || selectedPlan === 'power_yearly')
                ? t("feature_power_scans")
                : t("feature_premium_scans")}
            </span>
           </div>

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
          <div>
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
                 <><Sparkles size={20} /> {(() => {
                   const baseText = lang === 'es' ? 'Probar gratis 3 días → ' : lang === 'nl' ? '3 dagen gratis proberen → ' : 'Try free 3 days → ';
                   if (selectedPlan === 'yearly') return baseText + '€39.99/año';
                   if (selectedPlan === 'monthly') return baseText + '€8.99/mes';
                   if (selectedPlan === 'power_yearly') return baseText + '€89.99/año';
                   if (selectedPlan === 'power_monthly') return baseText + '€12.99/mes';
                   return baseText;
                 })()}</>
               )}
             </button>
             {selectedPlan === 'monthly' && (
               <p className="text-center text-xs text-teal-300/80 font-semibold mt-2">
                 {lang === 'es' ? 'Sin compromiso anual — cancelá cuando quieras' : lang === 'nl' ? 'Geen jaarlijkse verplichting — annuleer wanneer je wilt' : 'No annual commitment — cancel anytime'}
               </p>
             )}
          </div>

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