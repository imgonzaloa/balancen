import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Crown, Zap, XCircle } from "lucide-react";
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
    upgrade_now: "Continuar a Premium",
    soft_message: "Aunque no utilizaste mucho Balancen durante el trial, te invitamos a experimentar con nuestro plan. ¡Te puede sorprender!",
    best_value: "Mejor valor",
    what_you_lose_title: "Lo que perdés si no continuás:",
    lose_scans: (count) => `Tus ${count} análisis guardados`,
    lose_streak: (count) => `Tu racha de ${count} día${count !== 1 ? 's' : ''}`,
    lose_social: "Acceso al feed social y retos",
    lose_photos: "Tus fotos de progreso",
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
    upgrade_now: "Continue to Premium",
    soft_message: "Although you didn't use Balancen much during the trial, we invite you to explore our plans. You might be surprised!",
    best_value: "Best value",
    what_you_lose_title: "What you'll lose when trial ends:",
    lose_scans: (count) => `Your ${count} saved analyses`,
    lose_streak: (count) => `Your ${count}-day streak`,
    lose_social: "Access to social feed and challenges",
    lose_photos: "Your progress photos",
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
    upgrade_now: "Doorgaan naar Premium",
    soft_message: "Hoewel je Balancen niet veel gebruikte tijdens de trial, nodigen we je uit om onze plannen te verkennen. Je kunt verrast zijn!",
    best_value: "Beste waarde",
    what_you_lose_title: "Wat je verliest wanneer de trial eindigt:",
    lose_scans: (count) => `Je ${count} opgeslagen analyses`,
    lose_streak: (count) => `Je reeks van ${count} dag${count !== 1 ? 'en' : ''}`,
    lose_social: "Toegang tot sociale feed en uitdagingen",
    lose_photos: "Je voortgangsfoto's",
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
    // Check role and entitlement conditions — hide if any true
    if (profile?.role === 'owner' || profile?.role === 'collaborator' || profile?.access_type === 'campus_access' || profile?.access_type === 'campus_reward' || (profile?.is_premium === true && profile?.subscription_status !== 'trial') || profile?.subscription_status === 'active') {
      setIsVisible(false);
      return;
    }
    if (isDismissed || trialDaysLeft === null || trialDaysLeft > 2) {
      setIsVisible(false);
      return;
    }

    // Fetch meal count
    const fetchMealCount = async () => {
      try {
        const user = await base44.auth.me();
        if (!user?.email) return;
        const meals = await base44.entities.MealLog.filter({ created_by: user.email }).catch(() => []);
        setMealCount(meals?.length || 0);
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

  if (!isVisible || trialDaysLeft === null || trialDaysLeft > 2 || profile?.role === 'owner' || profile?.role === 'collaborator' || profile?.access_type === 'campus_access' || profile?.access_type === 'campus_reward' || (profile?.is_premium === true && profile?.subscription_status !== 'trial') || profile?.subscription_status === 'active') {
    return null;
  }

  const t = translations[lang] || translations.en;
  const isSoftMessage = mealCount < 5;
  const recommendPower = scansUsed > 150;
  const displayName = profile?.display_name?.split(" ")[0] || "User";
  const currentStreak = profile?.current_streak || 0;

  const handleClose = () => {
    localStorage.setItem("balancen_upgrade_modal_dismissed", "true");
    setIsVisible(false);
  };

  const handleUpgrade = () => {
    handleClose();
    navigate(createPageUrl("Paywall"));
  };

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
            <div className="bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 rounded-3xl p-6 max-w-md w-full border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto">
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

              {/* What you'll lose section */}
              {!isSoftMessage && (
                <div className="mb-6 bg-red-500/10 border border-red-500/30 rounded-2xl p-4">
                  <p className="text-red-300 font-bold text-sm mb-3">
                    {t.what_you_lose_title}
                  </p>
                  <div className="space-y-2.5">
                    {scansUsed > 0 && (
                      <div className="flex items-center gap-2.5">
                        <XCircle size={16} className="text-red-400 flex-shrink-0" />
                        <span className="text-white/80 text-sm">
                          {t.lose_scans(scansUsed)}
                        </span>
                      </div>
                    )}
                    {currentStreak > 0 && (
                      <div className="flex items-center gap-2.5">
                        <XCircle size={16} className="text-red-400 flex-shrink-0" />
                        <span className="text-white/80 text-sm">
                          {t.lose_streak(currentStreak)}
                        </span>
                      </div>
                    )}
                    <div className="flex items-center gap-2.5">
                      <XCircle size={16} className="text-red-400 flex-shrink-0" />
                      <span className="text-white/80 text-sm">
                        {t.lose_social}
                      </span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <XCircle size={16} className="text-red-400 flex-shrink-0" />
                      <span className="text-white/80 text-sm">
                        {t.lose_photos}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {!isSoftMessage && (
                <>
                  {/* Recommendation header */}
                  <p className="text-white/60 text-sm font-semibold mb-4">
                    {t.recommendation}
                  </p>

                  {/* Plan cards */}
                  <div className="space-y-3 mb-6">
                    {recommendPower ? (
                      <>
                        {/* Power Plan - Recommended */}
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

                        {/* Premium Annual - Secondary */}
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
                              <p className="text-white font-black text-2xl">€39.99</p>
                              <p className="text-white/50 text-xs">{t.per_year}</p>
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Premium Annual - Recommended */}
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
                              <p className="text-white font-black text-2xl">€39.99</p>
                              <p className="text-white/50 text-xs">{t.per_year}</p>
                            </div>
                          </div>
                        </div>

                        {/* Power Plan - Secondary */}
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
                className="w-full font-bold py-4 rounded-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] shadow-lg text-white bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 hover:shadow-xl hover:shadow-teal-500/40"
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