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

  const handleClose = () => {
    window.location.href = createPageUrl('Home');
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden flex flex-col" style={{ pointerEvents: 'auto' }}>
      <div className="absolute inset-0 opacity-30" style={{ pointerEvents: 'none' }}>
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10 flex-1 flex flex-col" style={{ pointerEvents: 'auto' }}>
        {/* Top actions */}
        <div className="flex justify-between items-center mb-6" style={{ pointerEvents: 'auto' }}>
          {isTrialExpired && (
            <div className="px-3 py-1 bg-red-500/20 border border-red-500/30 rounded-full">
              <span className="text-red-300 text-xs font-semibold">{t('trial_ended')}</span>
            </div>
          )}
          {trialDaysLeft > 0 && !isPremium && (
            <div className="px-3 py-1 bg-teal-500/20 border border-teal-500/30 rounded-full">
              <span className="text-teal-300 text-xs font-semibold">{t('trial')}: {trialDaysLeft} {t('days_left')}</span>
            </div>
          )}
          {isPremium && (
            <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center gap-1">
              <Crown size={12} className="text-emerald-300" />
              <span className="text-emerald-300 text-xs font-semibold">{t('premium_active')}</span>
            </div>
          )}
          <div className="flex-1" />
          <div className="flex gap-2" style={{ pointerEvents: 'auto' }}>
            {isPremium && (
              <button
                onClick={handleClose}
                className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors active:bg-white/30"
                style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                type="button"
              >
                <X size={20} className="text-white" />
              </button>
            )}
            <button
              onClick={handleSignOut}
              className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center hover:bg-white/20 transition-colors active:bg-white/30"
              style={{ pointerEvents: 'auto', cursor: 'pointer' }}
              type="button"
            >
              <LogOut size={20} className="text-white" />
            </button>
          </div>
        </div>

        {/* Hero */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {isTrialExpired ? (
            <>
              <h1 className="text-3xl font-black text-white mb-2">
                {t('trial_ended')}
              </h1>
              <p className="text-lg text-teal-200">
                To continue using Balancen, upgrade to Premium.
              </p>
            </>
          ) : trialDaysLeft > 0 ? (
            <>
              <h1 className="text-3xl font-black text-white mb-2">
                Trial Active — {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left
              </h1>
              <p className="text-lg text-teal-200">
                Upgrade now to avoid interruption.
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl font-black text-white mb-2">
                Get Premium
              </h1>
              <p className="text-lg text-teal-200">
                Full access to all features with a 7-day free trial.
              </p>
            </>
          )}
        </motion.div>

        {/* Premium Plan Card */}
        <motion.div
          className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl border-2 border-amber-400/50 rounded-3xl p-5 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-full blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full">
                <span className="text-white text-sm font-bold">Premium</span>
              </div>
              <Crown size={18} className="text-amber-300" />
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-white text-sm font-semibold mb-2">Everything you need:</p>
              {[
                'Unlimited streaks & consistency tracking',
                'Three fire metrics for motivation',
                'Auto-adjusting goals based on progress',
                'AI-powered coaching & personalized insights',
                'Advanced analytics & progress tracking',
                'Unlimited group creation & social features',
                'Leaderboards & social challenges',
                'Priority sync across devices',
                'Full history export & backup',
                'Progressive challenges & rewards'
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
                  AI Coaching helps you:
                </p>
              </div>
              <ul className="space-y-1 text-white/90 text-xs">
                <li>• Review your activity and patterns</li>
                <li>• Get personalized recommendations</li>
                <li>• Adjust habits that matter most</li>
                <li>• Stay consistent and motivated</li>
              </ul>
            </div>

            <p className="text-emerald-200 text-sm font-medium italic">
              Premium is designed for lasting results.
            </p>
          </div>
        </motion.div>

        {/* Pricing */}
        {pricing && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            style={{ pointerEvents: 'auto' }}
          >
            <h3 className="text-white font-semibold text-lg mb-3 text-center">
              {t('premium_pricing')}
            </h3>
            
            <div className="flex gap-4" style={{ pointerEvents: 'auto' }}>
              {['monthly', 'yearly'].map((key) => (
                <button
                  key={key}
                  onClick={() => setSelectedPlan(key)}
                  type="button"
                  style={{ pointerEvents: 'auto', cursor: 'pointer' }}
                  className={`flex-1 relative overflow-hidden rounded-2xl p-5 transition-all ${
                    selectedPlan === key
                      ? "bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-2 border-amber-400 shadow-xl scale-105"
                      : "bg-white/10 border-2 border-white/20 hover:border-white/30"
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
          style={{ pointerEvents: 'auto' }}
        >
          <Button
            onClick={handleContinue}
            disabled={loading || !pricing}
            type="button"
            style={{ pointerEvents: 'auto', cursor: loading || !pricing ? 'not-allowed' : 'pointer' }}
            className="w-full py-7 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg shadow-2xl shadow-amber-500/50 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                {t("processing")}
              </>
            ) : isTrialExpired ? (
              <>
                <Crown size={20} className="mr-2" />
                Continue with Premium
              </>
            ) : (
              <>
                <Crown size={20} className="mr-2" />
                Upgrade to Premium
              </>
            )}
          </Button>
          
          <p className="text-center text-xs text-emerald-200 font-semibold mt-3">
            💳 {t("card_required_billing")}
          </p>
          <p className="text-center text-xs text-white/60 mt-1">
            {t("cancel_anytime")}
          </p>
        </motion.div>
      </div>
    </div>
  );
}