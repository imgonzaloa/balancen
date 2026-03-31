import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { Sparkles, Zap } from "lucide-react";

function AIDemo({ lang }) {
  const lines = [
    lang === 'es' ? "Ensalada de pollo a la plancha" : "Grilled chicken salad",
    lang === 'es' ? "320 kcal · 38g proteína · 12g carbs · 8g grasa" : "320 kcal · 38g protein · 12g carbs · 8g fat",
  ];

  return (
    <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-4 space-y-3">
      {/* Label */}
      <div className="flex items-center gap-1.5">
        <Sparkles size={14} className="text-teal-300" />
        <span className="text-teal-300 text-xs font-semibold uppercase tracking-wide">AI Analysis</span>
      </div>

      {/* Meal photo mockup */}
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-3xl flex-shrink-0">
          🥗
        </div>
        <div className="flex-1 space-y-1.5">
          {lines.map((line, i) => (
            <motion.p
              key={i}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 + i * 0.7, duration: 0.5 }}
              className={i === 0 ? "text-white font-semibold text-sm" : "text-white/60 text-xs"}
            >
              {line}
            </motion.p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Steps: 1=goals, 2=who to follow, 3=trial activation
const TOTAL_STEPS = 3;

export default function Onboarding() {
  const navigate = useNavigate();
  const { t, lang, changeLanguage } = useTranslation();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    language: lang || 'es',
    primary_goal: "consistency",
    social_mode: "with_team",
    follow_mode: "both",
  });

  useEffect(() => {
    const init = async () => {
      const completed = localStorage.getItem('balancen_onboarding_complete') === 'true';
      if (completed) { navigate(createPageUrl('Home'), { replace: true }); return; }

      // Language is read exclusively through the TranslationProvider (lang from useTranslation)
      if (!lang) { navigate(createPageUrl('LanguageSelector'), { replace: true }); return; }

      setFormData(prev => ({ ...prev, language: lang }));

      try {
        const u = await base44.auth.me();
        if (u?.email) setUser(u);
      } catch (_) {}
    };
    init();
  }, [navigate]);

  // Called when user clicks "Start My 7-Day Free Trial"
  const handleActivateTrial = async () => {
    setSaving(true);
    try {
      let currentUser = user;
      if (!currentUser?.email) {
        try { currentUser = await base44.auth.me(); setUser(currentUser); } catch (_) {}
      }
      if (!currentUser?.email) {
        base44.auth.redirectToLogin(window.location.href);
        return;
      }

      const now = new Date();
      const trialEndDate = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      const existingProfile = await base44.entities.UserProfile.filter({ created_by: currentUser.email });

      const trialData = {
        ...formData,
        display_name: currentUser?.full_name || 'User',
        onboarding_completed: true,
        trial_start_date: now.toISOString(),
        trial_end_date: trialEndDate.toISOString(),
        subscription_status: "trial",
        is_premium: true,
      };

      if (existingProfile?.length > 0) {
        // Don't reset trial if already had one
        if (existingProfile[0].trial_start_date) {
          trialData.trial_start_date = existingProfile[0].trial_start_date;
          trialData.trial_end_date = existingProfile[0].trial_end_date;
        }
        await base44.entities.UserProfile.update(existingProfile[0].id, trialData);
      } else {
        await base44.entities.UserProfile.create(trialData);
      }

      const finalLang = formData.language || lang || 'en';
      localStorage.setItem('balancen_onboarding_complete', 'true');
      // changeLanguage handles both localStorage (single key) and DB sync
      await changeLanguage(finalLang);

      const pendingReferral = localStorage.getItem("pending_referral");
      if (pendingReferral) {
        try {
          await base44.functions.invoke("handleReferralSignup", { invite_code: pendingReferral });
          localStorage.removeItem("pending_referral");
        } catch (_) {}
      }

      navigate(createPageUrl("Home"), { replace: true });
    } catch (error) {
      toast.error(lang === "es" ? "Error al activar el trial" : "Error activating trial");
    } finally {
      setSaving(false);
    }
  };

  const goals = [
    { value: "consistency", emoji: "🎯" },
    { value: "weight_loss", emoji: "⚖️" },
    { value: "healthy_habits", emoji: "🥗" },
    { value: "stay_active", emoji: "🏃" },
  ];

  const progressPct = ((step - 1) / (TOTAL_STEPS - 1)) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex flex-col items-center justify-center p-6"
      style={{ paddingTop: 'env(safe-area-inset-top, 24px)' }}>

      {/* Progress bar — hidden on trial screen */}
      {step < TOTAL_STEPS && (
        <div className="w-full max-w-md mb-8">
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"
              animate={{ width: `${progressPct}%` }}
              transition={{ duration: 0.4 }}
            />
          </div>
          <p className="text-white/30 text-xs mt-2 text-right">{step}/{TOTAL_STEPS - 1}</p>
        </div>
      )}

      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">

          {/* Step 1: Goals */}
          {step === 1 && (
            <motion.div key="goals"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{t('whats_your_goal')}</h2>
                <p className="text-white/60">{t('select_primary_goal')}</p>
              </div>
              <div className="space-y-3">
                {goals.map((goal) => (
                  <button key={goal.value}
                    onClick={() => { setFormData(p => ({ ...p, primary_goal: goal.value })); setStep(2); }}
                    className="w-full p-4 rounded-2xl border-2 border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20 transition-all text-left flex items-center gap-3">
                    <span className="text-3xl">{goal.emoji}</span>
                    <span className="text-white font-semibold">{t(goal.value)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Who will you follow? */}
          {step === 2 && (
            <motion.div key="follow"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">Who will you follow?</h2>
                <p className="text-white/60">Your feed will be personalized from day 1</p>
              </div>
              <div className="space-y-3">
                {[
                  { emoji: "👥", title: "Friends & community", subtitle: "See what your friends eat and compete on streaks", value: "friends" },
                  { emoji: "⭐", title: "Elite athletes", subtitle: "Follow real athletes and see their daily nutrition", value: "athletes" },
                  { emoji: "🏆", title: "Both", subtitle: "The full Balancen experience", value: "both" },
                ].map((option) => {
                  const isSelected = (formData.follow_preference || "both") === option.value;
                  return (
                    <button key={option.value}
                      onClick={() => {
                        setFormData(p => ({ ...p, follow_preference: option.value }));
                        setStep(3);
                      }}
                      className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                        isSelected
                          ? 'border-teal-400 bg-teal-500/20'
                          : 'border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20'
                      }`}>
                      <div className="flex items-center gap-3 mb-1">
                        <span className="text-2xl">{option.emoji}</span>
                        <span className="text-white font-semibold">{option.title}</span>
                      </div>
                      <p className="text-white/60 text-sm ml-10">{option.subtitle}</p>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* Step 3: Trial Activation */}
          {step === 3 && (
            <motion.div key="trial"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center space-y-8">
              {/* Icon */}
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-2xl shadow-teal-500/40">
                    <Sparkles size={44} className="text-white" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-amber-400 flex items-center justify-center shadow-lg">
                    <Zap size={14} className="text-white" fill="white" />
                  </div>
                </div>
              </div>

              {/* Copy */}
              <div className="space-y-3">
                <h1 className="text-3xl font-black text-white leading-tight">
                  {lang === 'es' ? 'Tu comunidad te espera' : 'Your community is waiting'}
                </h1>
                <p className="text-teal-300 text-xl font-semibold">
                  {lang === 'es'
                    ? '7 días gratis. Sin tarjeta. Sin trampa.'
                    : '7 days free. No card. No catch.'}
                </p>
              </div>

              {/* AI Demo Card */}
              <AIDemo lang={lang} />

              {/* Features */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left space-y-3">
                {(lang === 'es' ? [
                  '✅ Análisis de fotos con IA',
                  '✅ Feed social — ve lo que comen amigos y atletas',
                  '✅ Rachas diarias y misiones',
                  '✅ Grupos, retos y leaderboard',
                ] : [
                  '✅ AI meal photo analysis',
                  '✅ Social feed — see what friends & athletes eat',
                  '✅ Daily streaks & missions',
                  '✅ Groups, challenges & leaderboard',
                ]).map((f, i) => (
                  <p key={i} className="text-white/80 text-sm">{f}</p>
                ))}
              </div>

              {/* CTA */}
              <button
                onClick={handleActivateTrial}
                disabled={saving}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black text-lg shadow-2xl shadow-teal-500/40 active:scale-95 transition-transform disabled:opacity-70">
                {saving
                  ? (lang === 'es' ? 'Activando…' : 'Activating…')
                  : (lang === 'es' ? 'Entrar a Balancen →' : 'Enter Balancen →')}
              </button>

              <p className="text-white/30 text-xs">
                {lang === 'es'
                  ? 'Después del trial: €6.99/mes. Cancela cuando quieras.'
                  : 'After trial: €6.99/month. Cancel anytime.'}
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}