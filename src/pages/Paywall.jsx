import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { X, Check, Sparkles, Crown, Loader2, LogOut, Flame, Utensils, Calendar, GraduationCap, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { useAppState } from "@/components/AppStateContext";
import { useEntitlement } from "@/components/hooks/useEntitlement";

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
  const isEs = lang === 'es';

  const isCampusExpired = isAccessExpired && (profile?.access_type === 'campus_access' || profile?.access_type === 'campus_reward' || profile?.access_type === 'expired');
  const showCampusStats = isCampusExpired || isCampusAccess || isCampusReward;

  useEffect(() => {
    base44.functions.invoke('getStripePublishableKey', {})
      .then(res => setPricing(res.data))
      .catch(() => setPricing({
        region: 'EUR', currency: '€',
        prices: { monthly: 6.99, yearly: 49.99 },
        priceIds: { monthly: null, yearly: null }
      }));

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
  }, [appUser?.email, profile?.current_streak, profile?.campus_consistency_percent]);

  const handleContinue = async () => {
    if (!appUser) { toast.error(t("please_login_continue")); return; }
    if (!pricing) { toast.error(t("payment_not_configured")); return; }

    setLoading(true);
    setPurchaseError(null);
    try {
      const priceId = pricing.priceIds[selectedPlan];
      const response = await base44.functions.invoke('createCheckoutSession', {
        priceId,
        planType: selectedPlan,
      });
      if (!response?.data?.url) throw new Error('No checkout URL returned from server');
      window.location.href = response.data.url;
    } catch (error) {
      const msg = error?.response?.data?.error || error?.message || 'Unknown error';
      setPurchaseError(msg);
      setLoading(false);
    }
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
            <Crown size={28} className="text-white" />
          </div>

          {isTrialExpired ? (
            <>
              <h1 className="text-3xl font-black text-white mb-2">
                {isEs ? 'Tu Trial ha terminado' : 'Your Trial Has Ended'}
              </h1>
              <p className="text-white/60 text-base">
                {isEs
                  ? 'Suscríbete para seguir usando Balancen sin interrupciones.'
                  : 'Subscribe to keep using Balancen without interruption.'}
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black text-white mb-2">
                {isEs ? 'Hazte Premium' : 'Go Premium'}
              </h1>
              <p className="text-white/60 text-base">
                {isEs ? 'Acceso completo, sin límites.' : 'Full access, no limits.'}
              </p>
            </>
          )}
        </motion.div>

        {/* User stats — shown when trial expired to remind them of progress */}
        {isTrialExpired && userStats && (
          <motion.div
            className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 grid grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          >
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Calendar size={16} className="text-teal-400" />
              </div>
              <p className="text-2xl font-black text-white">{userStats.daysTracked}</p>
              <p className="text-white/50 text-xs">{isEs ? 'días rastreados' : 'days tracked'}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Utensils size={16} className="text-emerald-400" />
              </div>
              <p className="text-2xl font-black text-white">{userStats.mealsLogged}</p>
              <p className="text-white/50 text-xs">{isEs ? 'comidas registradas' : 'meals logged'}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center mb-1">
                <Flame size={16} className="text-orange-400" />
              </div>
              <p className="text-2xl font-black text-white">{userStats.streak}</p>
              <p className="text-white/50 text-xs">{isEs ? 'racha actual' : 'current streak'}</p>
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
                {isEs ? 'Mejor valor' : 'Best Value'}
              </div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-3xl font-black text-white">{pricing.currency}{pricing.prices.yearly}</span>
                <span className="text-white/50 text-sm">/ {isEs ? 'año' : 'year'}</span>
              </div>
              <p className="text-teal-300 text-sm font-semibold">
                {pricing.currency}{yearlyMonthly} / {isEs ? 'mes' : 'month'} — {isEs ? 'Ahorra un 40%' : 'Save 40%'}
              </p>
            </button>

            {/* Monthly */}
            <button
              onClick={() => setSelectedPlan("monthly")}
              className={`w-full rounded-2xl p-4 border-2 transition-all text-left ${
                selectedPlan === 'monthly'
                  ? 'bg-white/10 border-white/40 shadow-lg'
                  : 'bg-white/5 border-white/15 hover:border-white/30'
              }`}
            >
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white">{pricing.currency}{pricing.prices.monthly}</span>
                <span className="text-white/50 text-sm">/ {isEs ? 'mes' : 'month'}</span>
              </div>
            </button>
          </motion.div>
        )}

        {/* Features */}
        <motion.div
          className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6 space-y-2.5"
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        >
          {(isEs ? [
            'Análisis de comidas con IA ilimitado',
            'Seguimiento avanzado de progreso',
            'Grupos y leaderboard social',
            'Recomendaciones personalizadas de IA',
            'Racha y métricas de consistencia',
            'Exportación de historial completo',
          ] : [
            'Unlimited AI-powered meal analysis',
            'Advanced progress tracking',
            'Groups & social leaderboard',
            'Personalized AI recommendations',
            'Streak & consistency metrics',
            'Full history export & backup',
          ]).map((f, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <Check size={15} className="text-teal-400 flex-shrink-0" />
              <span className="text-white/80 text-sm">{f}</span>
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
              <><Loader2 size={20} className="animate-spin" /> {isEs ? 'Procesando…' : 'Processing…'}</>
            ) : (
              <><Sparkles size={20} /> {isEs ? 'Desbloquear Premium' : 'Unlock Premium'}</>
            )}
          </button>

          <p className="text-center text-xs text-white/40">
            {isEs ? 'Cancela en cualquier momento' : 'Cancel anytime'}
          </p>

          <button
            onClick={() => toast.info(isEs ? "Contacta con soporte para restaurar tu compra." : "Contact support to restore your purchase.")}
            className="w-full py-3 text-white/40 text-sm hover:text-white/70 transition-colors"
          >
            {isEs ? 'Restaurar compra' : 'Restore Purchase'}
          </button>

          <button
            onClick={safeLogout}
            className="w-full py-3 text-white/30 text-xs hover:text-white/60 transition-colors flex items-center justify-center gap-2"
          >
            <LogOut size={13} />
            {isEs ? 'Cerrar sesión' : 'Log out'}
          </button>

          <button
            onClick={hardReset}
            className="w-full py-2 text-white/20 text-xs hover:text-white/50 transition-colors flex items-center justify-center gap-1.5"
          >
            <RefreshCw size={11} />
            {isEs ? 'Restablecer sesión' : 'Reset Session'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}