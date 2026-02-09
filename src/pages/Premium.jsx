import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft, Crown, Check, Sparkles, TrendingUp, Heart, Users, Zap, Flame, Target, Shield, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/TranslationProvider";
import { toast } from "sonner";

const featuresData = [
  { icon: Flame, key: "fire_system" },
  { icon: Sparkles, key: "advanced_ai" },
  { icon: Sparkles, key: "ai_meal_planner_feature" },
  { icon: Sparkles, key: "ai_workout_generator_feature" },
  { icon: Users, key: "social_feed_feature" },
  { icon: Heart, key: "enhanced_friends_feature" },
  { icon: TrendingUp, key: "progressive_overload" },
  { icon: Users, key: "exclusive_challenges" },
  { icon: Target, key: "analytics" },
  { icon: Shield, key: "priority_sync" },
];



export default function Premium() {
  const { t, lang } = useTranslation();
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [loading, setLoading] = useState(false);
  const [pricing, setPricing] = useState(null);

  useEffect(() => {
    console.log('Premium useEffect started');
    base44.auth.me().then(setUser);

    // Load regional pricing automatically
    base44.functions.invoke('getStripePublishableKey', {})
      .then(response => {
        console.log('getStripePublishableKey response:', response);
        console.log('response.data:', response.data);
        setPricing(response.data);
      })
      .catch(err => {
        console.error('Failed to load pricing:', err);
        toast.error(t('payment_system_unavailable'));
      });
  }, []);

  const handleStartTrial = async () => {
    if (!user) {
      toast.error(t("please_login_continue"));
      return;
    }

    // Check if user is owner or collaborator (already has Premium)
    try {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
      const profile = profiles[0];
      
      if (profile?.role === "owner" || profile?.role === "collaborator" || profile?.premium_source === "collaborator_invite" || profile?.is_premium) {
        toast.success(t('already_have_premium'));
        return;
      }
    } catch (err) {
      console.error("Failed to check profile:", err);
    }

    if (!pricing) {
      toast.error(t("payment_not_configured"));
      return;
    }

    setLoading(true);

    try {
      const priceId = pricing.priceIds[selectedPlan];
      console.log('Premium page - pricing data:', pricing);
      console.log('Premium page - selected plan:', selectedPlan);
      console.log('Premium page - priceId:', priceId);

      if (!priceId) {
        console.error('Price ID is undefined');
        toast.error(t("price_not_available"));
        setLoading(false);
        return;
      }

      const response = await base44.functions.invoke('createCheckoutSession', {
            priceId,
            planType: selectedPlan,
            selectedPlan: selectedPlan,
            region: pricing?.region || 'USD_US',
          });

      window.location.href = response.data.url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error(t("checkout_failed"));
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-pink-900 relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -right-4 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-amber-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            to={createPageUrl("Settings")}
            className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center"
          >
            <ChevronLeft size={20} className="text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-white">{t("upgrade_to_premium")}</h1>
        </div>

        {/* Hero */}
        <motion.div
          className="relative overflow-hidden rounded-3xl p-8 mb-8 bg-gradient-to-br from-amber-500 via-orange-500 to-pink-500 shadow-2xl"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", bounce: 0.4 }}
        >
          <div className="absolute -top-20 -right-20 w-48 h-48 bg-white/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-300/30 rounded-full blur-2xl" />
          
          <div className="relative z-10 text-center">
            <motion.div
              className="inline-block mb-4"
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            >
              <Crown size={64} className="text-white" />
            </motion.div>
            <h2 className="text-3xl font-black text-white mb-2">{t("premium_title")}</h2>
            <p className="text-white/90 text-lg">
              {t("build_consistency")}
            </p>
          </div>
        </motion.div>

        {/* Plan Selection */}
        {pricing && (
          <motion.div
            className="flex gap-4 mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            {['monthly', 'yearly'].map((key) => (
              <button
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={`flex-1 relative overflow-hidden rounded-2xl p-5 transition-all ${
                  selectedPlan === key
                    ? "bg-white/20 border-2 border-amber-400 shadow-lg shadow-amber-500/50"
                    : "bg-white/10 border-2 border-white/20"
                }`}
              >
                {key === "yearly" && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    {t("best_value")}
                  </div>
                )}
                <p className="text-white/80 text-sm mb-1">{t(key)}</p>
                <p className="text-3xl font-black text-white">{pricing.currency}{pricing.prices[key]}</p>
                <p className="text-white/60 text-xs mt-1">/ {t(key === "yearly" ? "year" : "month")}</p>
              </button>
            ))}
          </motion.div>
        )}

        {/* Features */}
        <motion.div
          className="space-y-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-white font-bold text-lg mb-4">{t("features_premium")}</h3>
          {featuresData.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={i}
                className="flex items-center gap-3 p-4 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.05 }}
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center flex-shrink-0">
                  <Icon size={20} className="text-white" />
                </div>
                <p className="text-white text-sm font-medium">{t(feature.key)}</p>
              </motion.div>
            );
          })}
        </motion.div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            onClick={handleStartTrial}
            disabled={loading || !pricing}
            className="w-full py-7 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg shadow-2xl shadow-amber-500/50 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={24} className="mr-2 animate-spin" />
                {t("processing")}
              </>
            ) : (
              <>
                <Crown size={24} className="mr-2" />
                {t("start_free_trial")}
              </>
            )}
          </Button>
          <p className="text-center text-emerald-200 text-xs font-semibold mt-3">
            💳 {t("card_required_billing")}
          </p>
          <p className="text-center text-white/60 text-xs mt-1">
            {t("cancel_anytime")}
          </p>
        </motion.div>
      </div>
    </div>
  );
}