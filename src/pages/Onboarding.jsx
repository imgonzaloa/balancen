import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";

export default function Onboarding() {
  // ALL HOOKS AT TOP
  const navigate = useNavigate();
  const { t, lang, changeLanguage } = useTranslation();
  const [step, setStep] = useState(0);
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({
    language: lang || 'es',
    primary_goal: "consistency",
    intensity_level: "normal",
    social_mode: "just_me",
  });

  useEffect(() => {
    const init = async () => {
      try {
        const u = await base44.auth.me();
        setUser(u);

        // If already completed, go Home
        const completed = localStorage.getItem('balancen_onboarding_complete') === 'true';
        if (completed) {
          navigate(createPageUrl('Home'), { replace: true });
          return;
        }

        // If no language selected yet, go to LanguageSelector first
        const lang = localStorage.getItem('i18nextLng') || localStorage.getItem('balancen_lang');
        if (!lang) {
          navigate(createPageUrl('LanguageSelector'), { replace: true });
          return;
        }

        // Start at goals step (language already handled by LanguageSelector)
        setStep(1);
        setFormData(prev => ({ ...prev, language: lang }));
      } catch (err) {
        console.error('[ONBOARDING] Init error:', err);
      }
    };
    init();
  }, [navigate]);

  const handleComplete = async () => {
    try {
      const existingProfile = await base44.entities.UserProfile.filter({ created_by: user?.email });
      
      if (existingProfile?.length > 0) {
        await base44.entities.UserProfile.update(existingProfile[0].id, {
          ...formData,
          onboarding_completed: true,
          display_name: user?.full_name || existingProfile[0].display_name || 'User',
        });
      } else {
        await base44.entities.UserProfile.create({
          ...formData,
          display_name: user?.full_name || 'User',
          onboarding_completed: true,
        });
      }

      // CRITICAL: Persist completion and language - all keys in sync
      localStorage.setItem('balancen_onboarding_complete', 'true');
      localStorage.setItem('i18nextLng', formData.language);
      localStorage.setItem('balancen_lang', formData.language);
      localStorage.setItem('app_language', formData.language);
      await changeLanguage(formData.language);

      // Process referral if exists
      const pendingReferral = localStorage.getItem("pending_referral");
      if (pendingReferral) {
        try {
          await base44.functions.invoke("handleReferralSignup", { invite_code: pendingReferral });
          localStorage.removeItem("pending_referral");
        } catch (err) {
          console.error("Referral processing failed:", err);
        }
      }

      navigate(createPageUrl("Home"), { replace: true });
    } catch (error) {
      const msg = lang === "es" ? "Error al crear perfil" : "Error creating profile";
      toast.error(msg);
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <AnimatePresence mode="wait">
          {step === 0 && (
            <motion.div
              key="language"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 flex items-center justify-center mx-auto mb-4">
                  <span className="text-4xl font-black text-white">B</span>
                </div>
                <h1 className="text-3xl font-black text-white mb-2">Balancen</h1>
                <p className="text-white/60 text-sm">Choose your language / Elegí tu idioma</p>
              </div>

              <div className="space-y-3">
                {[
                  { code: 'en', name: '🇬🇧 English' },
                  { code: 'es', name: '🇪🇸 Español' }
                ].map((langOption) => (
                  <button
                    key={langOption.code}
                    onClick={async () => {
                      setFormData({ ...formData, language: langOption.code });
                      await changeLanguage(langOption.code);
                      setStep(1);
                    }}
                    className="w-full p-5 rounded-2xl border-2 border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20 transition-all"
                  >
                    <p className="text-white font-bold text-xl">{langOption.name}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 1 && (
            <motion.div
              key="goals"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{t('whats_your_goal')}</h2>
                <p className="text-white/60">{t('select_primary_goal')}</p>
              </div>

              <div className="space-y-3">
                {goals.map((goal) => (
                  <button
                    key={goal.value}
                    onClick={() => {
                      setFormData({ ...formData, primary_goal: goal.value });
                      setStep(2);
                    }}
                    className="w-full p-4 rounded-2xl border-2 border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{goal.emoji}</span>
                      <span className="text-white font-semibold">{t(goal.value)}</span>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              key="intensity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{t('choose_pace')}</h2>
                <p className="text-white/60">{t('how_challenging')}</p>
              </div>

              <div className="space-y-3">
                {intensities.map((intensity) => (
                  <button
                    key={intensity.value}
                    onClick={() => {
                      setFormData({ ...formData, intensity_level: intensity.value });
                      setStep(3);
                    }}
                    className="w-full p-4 rounded-2xl border-2 border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20 transition-all"
                  >
                    <p className="text-white font-semibold">{t(intensity.value)}</p>
                    <p className="text-white/60 text-sm">{t(intensity.value + '_desc')}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div
              key="social"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{t('how_use_app')}</h2>
                <p className="text-white/60">{t('can_change_later')}</p>
              </div>

              <div className="space-y-3">
                {socialModes.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => {
                      setFormData({ ...formData, social_mode: mode.value });
                      handleComplete();
                    }}
                    className="w-full p-4 rounded-2xl border-2 border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20 transition-all"
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl">{mode.emoji}</span>
                      <span className="text-white font-semibold">{t(mode.value)}</span>
                    </div>
                    <p className="text-white/60 text-sm text-left ml-11">{t(mode.value + '_desc')}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}