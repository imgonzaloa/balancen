import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Zap, Crown } from "lucide-react";
import { createPageUrl } from "@/utils";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";

const translations = {
  es: {
    usage_headline: (name, meals, scans) => `${name}, en tu trial registraste ${meals} comida${meals !== 1 ? 's' : ''} y usaste ${scans} análisis de IA`,
    recommendation: "Basado en tu uso, te recomendamos:",
    power_plan: "Plan Power",
    premium_plan: "Plan Premium Anual",
    unlimited_scans: "∞ análisis ilimitados/mes",
    scans_per_month: "300 análisis/mes",
    per_month: "/mes",
    per_year: "/año",
    upgrade_now: "Upgradear ahora",
    soft_message: "Aunque no utilizaste mucho Balancen durante el trial, te invitamos a experimentar con nuestro plan. ¡Te puede sorprender!",
    best_value: "Mejor valor",
  },
  en: {
    usage_headline: (name, meals, scans) => `${name}, during your trial you logged ${meals} meal${meals !== 1 ? 's' : ''} and used ${scans} AI analyses`,
    recommendation: "Based on your usage, we recommend:",
    power_plan: "Power Plan",
    premium_plan: "Annual Premium Plan",
    unlimited_scans: "∞ unlimited analyses/month",
    scans_per_month: "300 analyses/month",
    per_month: "/month",
    per_year: "/year",
    upgrade_now: "Upgrade now",
    soft_message: "Although you didn't use Balancen much during the trial, we invite you to explore our plans. You might be surprised!",
    best_value: "Best value",
  },
  nl: {
    usage_headline: (name, meals, scans) => `${name}, tijdens je trial registreerde je ${meals} maaltijd${meals !== 1 ? 's' : ''} en gebruikte je ${scans} AI-analyses`,
    recommendation: "Op basis van je gebruik, raden we aan:",
    power_plan: "Power Plan",
    premium_plan: "Jaarlijks Premium Plan",
    unlimited_scans: "∞ onbeperkte analyses/maand",
    scans_per_month: "300 analyses/maand",
    per_month: "/maand",
    per_year: "/jaar",
    upgrade_now: "Nu upgraden",
    soft_message: "Hoewel je Balancen niet veel gebruikte tijdens de trial, nodigen we je uit om onze plannen te verkennen. Je kunt verrast zijn!",
    best_value: "Beste waarde",
  },
};

export default function SmartUpgradeModal({ trialDaysLeft, profile, lang = "en" }) {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [mealCount, setMealCount] = useState(0);
  const [scansUsed, setScansUsed] = useState(0);

  // Only show if trial <= 2 days left and not dismissed
  useEffect(() => {
    const isDismissed = localStorage.getItem("balancen_upgrade_modal_dismissed");
    if (isDismissed || trialDaysLeft === null || trialDaysLeft > 2) {
      setIsVisible(false);
      return;
    }

    // Fetch meal count
    const fetchMealCount = async () => {
      try {
        if (!profile?.created_by) return;
        const meals = await base44.entities.MealLog.filter({ created_by: profile.created_by });
        setMealCount(meals.length);
      } catch (_) {
        setMealCount(0);
      }
    };

    // Get scans from localStorage
    const now = new Date();
    const monthKey = `balancen_ai_scans_${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const scans = parseInt(localStorage.getItem(monthKey) || "0", 10);
    setScansUsed(scans);

    fetchMealCount();
    setIsVisible(true);
  }, [trialDaysLeft, profile]);

  if (!isVisible || trialDaysLeft === null || trialDaysLeft > 2) {
    return null;
  }

  const t = translations[lang] || translations.en;
  const isSoftMessage = mealCount < 5;
  const recommendPower = scansUsed > 150;

  const handleClose = () => {
    localStorage.setItem("balancen_upgrade_modal_dismissed", "true");
    setIsVisible(false);
  };

  const handleUpgrade = () => {
    handleClose();
    navigate(createPageUrl("Paywall"));
  };

  const displayName = profile?.display_name?.split(" ")[0] || "User";

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-[9000] bg-black/60 backdrop-blur-sm"
            style={{ pointerEvents: "auto" }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[9001] flex items-center justify-center px-4"
            style={{ pointerEvents: "auto" }}
          >
            <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-3xl p-6 max-w-md w-full border border-white/10 shadow-2xl">
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>

              {/* Usage headline */}
              <div className="mb-6 pt-2">
                <h2 className="text-white font-black text-lg leading-snug mb-4">
                  {t.usage_headline(displayName, mealCount, scansUsed)}
                </h2>

                {/* Soft message if low usage */}
                {isSoftMessage && (
                  <p className="text-white/70 text-sm italic leading-relaxed">
                    {t.soft_message}
                  </p>
                )}
              </div>

              {!isSoftMessage && (
                <>
                  {/* Recommendation header */}
                  <p className="text-white/60 text-sm font-semibold mb-4">
                    {t.recommendation}
                  </p>

                  {/* Plan cards */}
                  <div className="space-y-3 mb-6">
                    {/* Recommended plan */}
                    {recommendPower ? (
                      <>
                        {/* Power Plan */}
                        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-2xl p-4 border-2 border-purple-500/60 relative">
                          <div className="absolute -top-3 left-4">
                            <span className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                              {t.best_value}
                            </span>
                          </div>
                          <div className="flex items-start justify-between pt-1">
                            <div>
                              <h3 className="text-white font-black text-base flex items-center gap-2">
                                <Zap size={18} className="text-purple-400" />
                                {t.power_plan}
                              </h3>
                              <p className="text-white/60 text-sm mt-2">{t.unlimited_scans}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-black text-2xl">€12.99</p>
                              <p className="text-white/50 text-xs">{t.per_month}</p>
                            </div>
                          </div>
                        </div>

                        {/* Premium Annual (secondary) */}
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-white font-black text-base flex items-center gap-2">
                                <Crown size={18} className="text-amber-400" />
                                {t.premium_plan}
                              </h3>
                              <p className="text-white/60 text-sm mt-2">{t.scans_per_month}</p>
                            </div>
                            <div className="text-right">
                               <p className="text-white font-black text-2xl">€52.99</p>
                               <p className="text-white/50 text-xs">{t.per_year}</p>
                             </div>
                            </div>
                            </div>
                            </>
                            ) : (
                      <>
                        {/* Premium Annual (primary recommendation) */}
                        <div className="bg-gradient-to-br from-amber-500/20 to-yellow-500/20 rounded-2xl p-4 border-2 border-amber-500/60 relative">
                          <div className="absolute -top-3 left-4">
                            <span className="bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                              {t.best_value}
                            </span>
                          </div>
                          <div className="flex items-start justify-between pt-1">
                            <div>
                              <h3 className="text-white font-black text-base flex items-center gap-2">
                                <Crown size={18} className="text-amber-400" />
                                {t.premium_plan}
                              </h3>
                              <p className="text-white/60 text-sm mt-2">{t.scans_per_month}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-black text-2xl">€52.99</p>
                              <p className="text-white/50 text-xs">{t.per_year}</p>
                              </div>
                              </div>
                              </div>

                              {/* Power Plan (secondary) */}
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="text-white font-black text-base flex items-center gap-2">
                                <Zap size={18} className="text-purple-400" />
                                {t.power_plan}
                              </h3>
                              <p className="text-white/60 text-sm mt-2">{t.unlimited_scans}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-white font-black text-2xl">€12.99</p>
                              <p className="text-white/50 text-xs">{t.per_month}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </>
              )}

              {/* CTA Button */}
              <button
                onClick={handleUpgrade}
                className="w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 hover:shadow-xl hover:shadow-teal-500/40 text-white font-bold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                {t.upgrade_now}
              </button>

              {/* Dismiss link */}
              <button
                onClick={handleClose}
                className="w-full text-white/50 hover:text-white/70 text-xs font-semibold mt-3 transition-colors"
              >
                {lang === "es" ? "Descartar" : lang === "nl" ? "Sluiten" : "Close"}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}