import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { X, Check, Sparkles, Crown, Loader2, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { useAppState } from "@/components/AppStateContext";
import { useEntitlement } from "@/components/hooks/useEntitlement";

export default function Paywall() {
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [pricing, setPricing] = useState(null);
  const { profile } = useAppState();
  const { isTrialExpired, trialDaysLeft, isPremium } = useEntitlement(profile);
  
  const { t, lang } = useTranslation();

  useEffect(() => {
    base44.auth.me().then(setUser);
    
    base44.functions.invoke('getStripePublishableKey', {})
      .then(response => setPricing(response.data))
      .catch(err => {
        console.error('Failed to load pricing:', err);
        setPricing({
          region: 'EU',
          currency: '€',
          prices: { monthly: 6.99, yearly: 49.99 },
          priceIds: { monthly: 'price_demo', yearly: 'price_demo' }
        });
      });
  }, []);

  const handleSignOut = async () => {
    await base44.auth.logout(createPageUrl('Paywall'));
  };

  const handleContinue = async () => {
    if (!user) {
      toast.error(t("please_login_continue"));
      return;
    }

    if (!pricing) {
      toast.error(t("payment_not_configured"));
      return;
    }

    setLoading(true);
    
    try {
      const priceId = pricing.priceIds[selectedPlan];
      
      const response = await base44.functions.invoke('createCheckoutSession', {
        priceId: priceId,
        planType: selectedPlan,
      });

      window.location.href = response.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(t("checkout_failed"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10">
        {/* Skip button */}
        <div className="flex justify-end mb-6">
          <button
            onClick={handleSkip}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors"
          >
            <X size={20} className="text-white" />
          </button>
        </div>

        {/* Hero */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-3xl font-black text-white mb-2">
            {t('choose_plan')}
          </h1>
          <p className="text-lg text-teal-200">
            {t('free_lets_start')}
          </p>
        </motion.div>

        {/* Plan Comparison */}
        <motion.div
          className="grid gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Free Plan */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-5">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 bg-slate-500/30 rounded-full">
                <span className="text-white text-sm font-semibold">{t('free_plan')}</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-white/80 text-sm font-semibold mb-2">{t('includes')}</p>
              {[
                t('daily_checkins'),
                t('basic_fire_tracking'),
                t('manual_tracking'),
                t('one_group_max'),
                t('basic_stats')
              ].map((feature, i) => (
                <div key={i} className="flex items-start gap-2 text-white/70 text-sm">
                  <Check size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-3">
              <p className="text-white/80 text-sm font-semibold mb-2">{t('not_included')}</p>
              {[
                t('streak_capped'),
                t('limited_fire_system'),
                t('no_auto_goals'),
                t('no_ai_coaching'),
                t('no_advanced_analytics'),
                t('no_progressive_challenges'),
                t('limited_social')
              ].map((limit, i) => (
                <div key={i} className="flex items-start gap-2 text-white/50 text-sm">
                  <X size={16} className="text-red-400/60 mt-0.5 flex-shrink-0" />
                  <span>{limit}</span>
                </div>
              ))}
            </div>

            <p className="text-white/40 text-xs italic">
              {t('free_for_trial')}
            </p>
          </div>

          {/* Premium Plan */}
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl border-2 border-amber-400/50 rounded-3xl p-5">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full">
                  <span className="text-white text-sm font-bold">{t('premium_plan')}</span>
                </div>
                <Crown size={18} className="text-amber-300" />
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-white text-sm font-semibold mb-2">{t('full_experience')}</p>
                {[
                  t('unlimited_streaks'),
                  t('three_fire_metrics'),
                  t('auto_goal_progression'),
                  t('ai_coaching_personalized'),
                  t('advanced_analytics'),
                  t('unlimited_groups'),
                  t('social_leaderboards'),
                  t('priority_sync'),
                  t('full_history_export'),
                  t('progressive_challenges')
                ].map((feature, i) => (
                  <div key={i} className="flex items-start gap-2 text-white text-sm">
                    <Check size={16} className="text-emerald-400 mt-0.5 flex-shrink-0" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              {/* AI Coaching Explanation */}
              <div className="bg-purple-500/20 border border-purple-400/30 rounded-xl p-4 mb-3">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={16} className="text-purple-300" />
                  <p className="text-white text-sm font-semibold">
                    {t('ai_coaching_helps')}
                  </p>
                </div>
                <ul className="space-y-1 text-white/90 text-xs">
                  <li>• {t('review_activity')}</li>
                  <li>• {t('give_recommendations')}</li>
                  <li>• {t('adjust_habits')}</li>
                  <li>• {t('support_consistency')}</li>
                </ul>
              </div>

              <p className="text-emerald-200 text-sm font-medium italic">
                {t('premium_for_lasting')}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Pricing */}
        {pricing && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-white font-semibold text-lg mb-3 text-center">
              {t('premium_pricing')}
            </h3>
            
            <div className="flex gap-4">
              {['monthly', 'yearly'].map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  className={`flex-1 relative overflow-hidden rounded-2xl p-5 transition-all ${
                    selectedPlan === key
                      ? "bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-2 border-amber-400 shadow-xl scale-105"
                      : "bg-white/10 border-2 border-white/20"
                  }`}
                >
                  {key === 'yearly' && (
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                      {t("best_value")}
                    </div>
                  )}
                  <p className="text-white/80 text-sm mb-1 font-medium">{t(key)}</p>
                  <p className="text-3xl font-black text-white">{pricing.currency}{pricing.prices[key]}</p>
                  <p className="text-white/60 text-xs mt-1">/ {t(key === 'monthly' ? 'month' : 'year')}</p>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* CTA */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleContinue}
            disabled={loading || !pricing}
            className="w-full py-7 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg shadow-2xl shadow-amber-500/50 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                {t("processing")}
              </>
            ) : (
              <>
                <Crown size={20} className="mr-2" />
                {t("start_free_trial")}
              </>
            )}
          </Button>
          
          <p className="text-center text-xs text-emerald-200 font-semibold mt-3">
            💳 {t("card_required_billing")}
          </p>
          <p className="text-center text-xs text-white/60 mt-1">
            {t("cancel_anytime")}
          </p>
          
          <button
            onClick={handleSkip}
            className="w-full py-4 text-white/50 hover:text-white/70 text-sm transition-colors mt-4"
          >
            {t('continue_free_limited')}
          </button>
        </motion.div>
      </div>
    </div>
  );
}