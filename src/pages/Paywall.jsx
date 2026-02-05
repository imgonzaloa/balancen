import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Flame, Users, TrendingUp, Award, X, Check, Sparkles, Trophy, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";

const freeFeatures = [
  "Daily check-ins",
  "Basic fire tracking",
  "Manual tracking",
  "1 group maximum",
  "Basic stats"
];

const freeLimitations = [
  "Streak capped at 3 days",
  "Limited fire system",
  "No automatic goals",
  "No AI coaching",
  "No advanced analytics",
  "No progressive challenges",
  "Limited social features"
];

const premiumFeatures = [
  "Unlimited streaks & fire 🔥",
  "3 fire metrics (Consistency + Steps + Calories)",
  "Automatic goal progression",
  "AI Coaching with personalized tips",
  "Advanced analytics & insights",
  "Unlimited groups",
  "Social leaderboards",
  "Priority device sync",
  "Full history & export",
  "Progressive challenges"
];

// Auto-detect region based on timezone
const detectRegion = () => {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const latinAmericaZones = [
    'America/Mexico_City', 'America/Buenos_Aires', 'America/Bogota', 
    'America/Lima', 'America/Santiago', 'America/Caracas', 'America/Sao_Paulo',
    'America/Montevideo', 'America/La_Paz', 'America/Asuncion', 'America/Quito',
    'America/Panama', 'America/Costa_Rica', 'America/Guatemala', 'America/Tegucigalpa',
    'America/Managua', 'America/San_Salvador', 'America/Havana', 'America/Santo_Domingo'
  ];
  
  return latinAmericaZones.some(zone => timezone.includes(zone)) ? "LATAM" : "EU";
};

export default function Paywall() {
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [region] = useState(detectRegion());
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [stripeConfig, setStripeConfig] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser);
    
    base44.functions.getStripePublishableKey({})
      .then(config => setStripeConfig(config))
      .catch(err => console.error('Failed to load Stripe config:', err));
  }, []);

  const plans = {
    EU: {
      monthly: { price: 6.99, label: "Monthly", period: "month", currency: "€", priceId: stripeConfig?.monthlyPriceId },
      yearly: { price: 49.99, label: "Yearly", period: "year", save: "Save over 40%", currency: "€", priceId: stripeConfig?.yearlyPriceId },
    },
    LATAM: {
      monthly: { price: 3.99, label: "Monthly", period: "month", currency: "$", priceId: stripeConfig?.monthlyPriceId },
      yearly: { price: 29.99, label: "Yearly", period: "year", save: "Save over 40%", currency: "$", priceId: stripeConfig?.yearlyPriceId },
    }
  };

  const handleSkip = () => {
    window.location.href = createPageUrl("Home");
  };

  const handleContinue = async () => {
    if (!user) {
      toast.error("Please log in to continue");
      return;
    }

    if (!stripeConfig) {
      toast.error("Payment system not configured");
      return;
    }

    setLoading(true);
    
    try {
      const selectedPlanData = plans[region][selectedPlan];
      
      const { url } = await base44.functions.createCheckoutSession({
        priceId: selectedPlanData.priceId,
        planType: selectedPlan,
      });

      window.location.href = url;
    } catch (error) {
      console.error('Checkout error:', error);
      toast.error("Failed to start checkout. Please try again.");
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
            Choose how far you want to go with Balancen
          </h1>
          <p className="text-lg text-teal-200">
            Free lets you try. Premium lets you stay consistent.
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
                <span className="text-white text-sm font-semibold">Free</span>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              <p className="text-white/80 text-sm font-semibold mb-2">Includes:</p>
              {freeFeatures.map((feature, i) => (
                <div key={i} className="flex items-start gap-2 text-white/70 text-sm">
                  <Check size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            <div className="space-y-2 mb-3">
              <p className="text-white/80 text-sm font-semibold mb-2">Not included:</p>
              {freeLimitations.map((limit, i) => (
                <div key={i} className="flex items-start gap-2 text-white/50 text-sm">
                  <X size={16} className="text-red-400/60 mt-0.5 flex-shrink-0" />
                  <span>{limit}</span>
                </div>
              ))}
            </div>

            <p className="text-white/40 text-xs italic">
              Free is designed to let you try Balancen, not to build long-term habits.
            </p>
          </div>

          {/* Premium Plan */}
          <div className="relative overflow-hidden bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl border-2 border-amber-400/50 rounded-3xl p-5">
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-full blur-2xl" />
            
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="px-3 py-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full">
                  <span className="text-white text-sm font-bold">Premium</span>
                </div>
                <Crown size={18} className="text-amber-300" />
              </div>

              <div className="space-y-2 mb-4">
                <p className="text-white text-sm font-semibold mb-2">Full Experience:</p>
                {premiumFeatures.map((feature, i) => (
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
                  <p className="text-white text-sm font-semibold">AI Coaching helps you:</p>
                </div>
                <ul className="space-y-1 text-white/90 text-xs">
                  <li>• Review your daily activity and goals</li>
                  <li>• Give simple recommendations</li>
                  <li>• Help you adjust habits over time</li>
                  <li>• Support long-term consistency</li>
                </ul>
              </div>

              <p className="text-emerald-200 text-sm font-medium italic">
                Premium is designed to help you stay consistent and improve over time.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Pricing */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h3 className="text-white font-semibold text-lg mb-3 text-center">Premium Pricing</h3>
          
          <div className="flex gap-4">
            {Object.entries(plans[region]).map(([key, plan]) => (
              <button
                key={key}
                onClick={() => setSelectedPlan(key)}
                className={`flex-1 relative overflow-hidden rounded-2xl p-5 transition-all ${
                  selectedPlan === key
                    ? "bg-gradient-to-br from-amber-500/30 to-orange-500/30 border-2 border-amber-400 shadow-xl scale-105"
                    : "bg-white/10 border-2 border-white/20"
                }`}
              >
                {plan.save && (
                  <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs px-2 py-1 rounded-full font-bold">
                    Best value
                  </div>
                )}
                <p className="text-white/80 text-sm mb-1 font-medium">{plan.label}</p>
                <p className="text-3xl font-black text-white">{plan.currency}{plan.price}</p>
                <p className="text-white/60 text-xs mt-1">/ {plan.period}</p>
              </button>
            ))}
          </div>
        </motion.div>

        {/* CTA */}
        <motion.div
          className="space-y-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={handleContinue}
            disabled={loading || !stripeConfig}
            className="w-full py-7 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg shadow-2xl shadow-amber-500/50 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Crown size={20} className="mr-2" />
                Start 7-Day Free Trial
              </>
            )}
          </Button>
          
          <p className="text-center text-xs text-emerald-200 font-semibold mt-3">
            💳 Card required • Billing starts after 7 days
          </p>
          <p className="text-center text-xs text-white/60 mt-1">
            Cancel anytime before trial ends
          </p>
          
          <button
            onClick={handleSkip}
            className="w-full py-4 text-white/50 hover:text-white/70 text-sm transition-colors mt-4"
          >
            Continue with Free (limited features)
          </button>
        </motion.div>
      </div>
    </div>
  );
}