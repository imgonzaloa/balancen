import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { Sparkles, Zap } from "lucide-react";

// Steps: 1=goals, 2=intensity, 3=social, 4=trial activation
const TOTAL_STEPS = 4;

export default function Onboarding() {
  const navigate = useNavigate();
  const { t, lang, changeLanguage } = useTranslation();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    language: lang || 'es',
    primary_goal: "consistency",
    intensity_level: "normal",
    social_mode: "just_me",
  });

  useEffect(() => {
    const init = async () => {
      const completed = localStorage.getItem('balancen_onboarding_complete') === 'true';
      if (completed) { navigate(createPageUrl('Home'), { replace: true }); return; }

      const storedLang = localStorage.getItem('i18nextLng') || localStorage.getItem('balancen_lang');
      if (!storedLang) { navigate(createPageUrl('LanguageSelector'), { replace: true }); return; }

      setFormData(prev => ({ ...prev, language: storedLang }));

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
        premium_expires: trialEndDate.toISOString().split('T')[0],
        premium_status: "trialing",
        is_premium: true,
      };

      if (existingProfile?.length > 0) {
        // Don't reset trial if already had one
        if (!existingProfile[0].trial_start_date) {
          trialData.trial_start_date = now.toISOString();
        } else {
          trialData.trial_start_date = existingProfile[0].trial_start_date;
        }
        await base44.entities.UserProfile.update(existingProfile[0].id, trialData);
      } else {
        await base44.entities.UserProfile.create(trialData);
      }

      const finalLang = formData.language || localStorage.getItem('i18nextLng') || 'en';
      localStorage.setItem('balancen_onboarding_complete', 'true');
      localStorage.setItem('i18nextLng', finalLang);
      localStorage.setItem('balancen_lang', finalLang);
      localStorage.setItem('balancen.lang', finalLang);
      localStorage.setItem('app_language', finalLang);
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

  const intensities = [
    { value: "easy" },
    { value: "normal" },
    { value: "challenging" },
  ];

  const socialModes = [
    { value: "just_me", emoji: "🧘" },
    { value: "with_friends", emoji: "👥" },
    { value: "with_team", emoji: "🏆" },
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

          {/* Step 2: Intensity */}
          {step === 2 && (
            <motion.div key="intensity"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{t('choose_pace')}</h2>
                <p className="text-white/60">{t('how_challenging')}</p>
              </div>
              <div className="space-y-3">
                {intensities.map((intensity) => (
                  <button key={intensity.value}
                    onClick={() => { setFormData(p => ({ ...p, intensity_level: intensity.value })); setStep(3); }}
                    className="w-full p-4 rounded-2xl border-2 border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20 transition-all text-left">
                    <p className="text-white font-semibold">{t(intensity.value)}</p>
                    <p className="text-white/60 text-sm">{t(intensity.value + '_desc')}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Social mode */}
          {step === 3 && (
            <motion.div key="social"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{t('how_use_app')}</h2>
                <p className="text-white/60">{t('can_change_later')}</p>
              </div>
              <div className="space-y-3">
                {socialModes.map((mode) => (
                  <button key={mode.value}
                    onClick={() => { setFormData(p => ({ ...p, social_mode: mode.value })); setStep(4); }}
                    className="w-full p-4 rounded-2xl border-2 border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20 transition-all text-left">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl">{mode.emoji}</span>
                      <span className="text-white font-semibold">{t(mode.value)}</span>
                    </div>
                    <p className="text-white/60 text-sm ml-11">{t(mode.value + '_desc')}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: Trial Activation */}
          {step === 4 && (
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
                  {lang === 'es' ? 'Bienvenido a Balancen' : 'Welcome to Balancen'}
                </h1>
                <p className="text-teal-300 text-xl font-semibold">
                  {lang === 'es'
                    ? 'Tienes 7 días de acceso Premium completo.'
                    : 'You have 7 days of full Premium access.'}
                </p>
                <p className="text-white/60 text-sm leading-relaxed">
                  {lang === 'es'
                    ? 'Sin pago hoy. Cancela cuando quieras.'
                    : 'No payment required today. Cancel anytime.'}
                </p>
              </div>

              {/* Features */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left space-y-3">
                {(lang === 'es' ? [
                  '✅ Análisis de comidas con IA',
                  '✅ Grupos y leaderboard',
                  '✅ Recomendaciones personalizadas',
                  '✅ Progreso avanzado y estadísticas',
                ] : [
                  '✅ AI-powered meal analysis',
                  '✅ Groups & leaderboard',
                  '✅ Personalized recommendations',
                  '✅ Advanced progress & analytics',
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
                  : (lang === 'es' ? 'Comenzar mi Trial de 7 Días' : 'Start My 7-Day Free Trial')}
              </button>

              <p className="text-white/30 text-xs">
                {lang === 'es'
                  ? 'Después del trial se te pedirá suscripción para continuar.'
                  : 'After the trial, a subscription is required to continue.'}
              </p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}