import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { ChevronLeft, Crown, Check, Sparkles, TrendingUp, Heart, Users, Zap, Flame, Target, Shield } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/components/TranslationProvider";

const featuresData = [
  { icon: Flame, key: "fire_system", label: "3 Fire Metrics System" },
  { icon: Sparkles, key: "advanced_ai", label: "AI Coaching" },
  { icon: TrendingUp, key: "progressive_overload", label: "Auto Goal Progression" },
  { icon: Users, key: "exclusive_challenges", label: "Unlimited Groups" },
  { icon: Target, key: "analytics", label: "Advanced Analytics" },
  { icon: Shield, key: "priority_sync", label: "Priority Device Sync" },
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

export default function Premium() {
  const { t } = useTranslation();
  const [user, setUser] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState("yearly");
  const [region] = useState(detectRegion());

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const plans = {
    EU: {
      monthly: { price: 6.99, currency: "€" },
      yearly: { price: 49.99, currency: "€" },
    },
    LATAM: {
      monthly: { price: 3.99, currency: "$" },
      yearly: { price: 29.99, currency: "$" },
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
        <motion.div
          className="flex gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {Object.entries(plans[region]).map(([key, plan]) => (
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
              <p className="text-3xl font-black text-white">{plan.currency}{plan.price}</p>
              <p className="text-white/60 text-xs mt-1">/ {t(key === "yearly" ? "year" : "month")}</p>
            </button>
          ))}
        </motion.div>

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
                <p className="text-white text-sm font-medium">{feature.label}</p>
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
            onClick={() => alert("Payment integration coming soon. This is a demo.")}
            className="w-full py-7 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-lg shadow-2xl shadow-amber-500/50"
          >
            <Crown size={24} className="mr-2" />
            {t("start_trial")}
          </Button>
          <p className="text-center text-white/60 text-xs mt-4">
            {t("cancel_anytime")}
          </p>
        </motion.div>
      </div>
    </div>
  );
}