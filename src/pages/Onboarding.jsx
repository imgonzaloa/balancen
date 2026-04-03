import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { Sparkles, Zap } from "lucide-react";
import Buddy from "@/components/buddy/Buddy";

function AIDemo() {
  const [cycle, setCycle] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setCycle(c => c + 1), 3700);
    return () => clearTimeout(timer);
  }, [cycle]);

  const lines = [
    { text: "Grilled chicken salad", className: "text-white font-bold text-sm", delay: 0.3 },
    { text: "320 kcal · 38g protein", className: "text-teal-300 text-xs font-semibold", delay: 0.8 },
    { text: "12g carbs · 8g fat", className: "text-white/50 text-xs", delay: 1.3 },
  ];

  return (
    <div className="bg-white/10 backdrop-blur border border-white/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-center gap-1.5">
        <Sparkles size={14} className="text-teal-300" />
        <span className="text-teal-300 text-xs font-bold uppercase tracking-wider">AI Analysis</span>
      </div>
      <div className="flex items-center gap-4">
        <div className="w-14 h-14 rounded-xl bg-white/10 flex items-center justify-center text-3xl flex-shrink-0">🥗</div>
        <div className="flex-1 space-y-1.5">
          {lines.map((line) => (
            <motion.p
              key={`${cycle}-${line.delay}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: line.delay, duration: 0.4, ease: "easeOut" }}
              className={line.className}
            >
              {line.text}
            </motion.p>
          ))}
        </div>
      </div>
    </div>
  );
}

// Mifflin-St Jeor formula → daily calorie goal
function calcCalories({ gender, weight_kg, height_cm, age, activity_level }) {
  const w = parseFloat(weight_kg) || 70;
  const h = parseFloat(height_cm) || 170;
  const a = parseFloat(age) || 30;
  const bmr = gender === 'female'
    ? 10 * w + 6.25 * h - 5 * a - 161
    : 10 * w + 6.25 * h - 5 * a + 5;
  const multipliers = { sedentary: 1.2, light: 1.375, active: 1.55, very_active: 1.725 };
  return Math.round(bmr * (multipliers[activity_level] || 1.375));
}

// Steps: 1=language, 2=goals, 3=gender, 4=body, 5=activity, 6=motivation, 7=follow, 8=trial
const TOTAL_STEPS = 8;

export default function Onboarding() {
  const navigate = useNavigate();
  const { t, lang, changeLanguage } = useTranslation();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    language: lang || 'es',
    primary_goal: "consistency",
    gender: null,
    height_cm: '',
    weight_kg: '',
    age: '',
    activity_level: null,
    calories_goal: null,
    motivation: null,
    social_mode: "with_team",
    follow_mode: "both",
    follow_preference: "both",
  });

  useEffect(() => {
    const init = async () => {
      const completed = localStorage.getItem('balancen_onboarding_complete') === 'true';
      if (completed) { navigate(createPageUrl('Home'), { replace: true }); return; }
      try {
        const u = await base44.auth.me();
        if (u?.email) setUser(u);
      } catch (_) {}
    };
    init();
  }, [navigate]);

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
        height_cm: formData.height_cm ? parseFloat(formData.height_cm) : undefined,
        weight_kg: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        weight: formData.weight_kg ? parseFloat(formData.weight_kg) : undefined,
        height: formData.height_cm ? parseFloat(formData.height_cm) : undefined,
        display_name: currentUser?.full_name || 'User',
        onboarding_completed: true,
        trial_start_date: now.toISOString(),
        trial_end_date: trialEndDate.toISOString(),
        subscription_status: "trial",
        is_premium: true,
      };

      if (existingProfile?.length > 0) {
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

  // Labels per lang
  const L = {
    es: {
      lang_title: "Elige tu idioma",
      goal_title: "¿Cuál es tu objetivo?",
      goal_sub: "Elige tu enfoque principal",
      gender_title: "¿Cuál es tu género?",
      gender_sub: "Para calcular tu metabolismo basal",
      male: "Hombre", female: "Mujer",
      body_title: "Tu cuerpo",
      body_sub: "Para personalizar tu plan calórico",
      height: "Altura (cm)", weight: "Peso (kg)", age: "Edad",
      activity_title: "¿Cuán activo/a eres?",
      activity_sub: "Calculamos tus calorías diarias ideales",
      sedentary: "Sedentario", light: "Poco activo", active: "Activo", very_active: "Muy activo (atleta)",
      motivation_title: "¿Qué te motiva más?",
      motivation_sub: "Personalizamos tu experiencia",
      lose_weight: "Perder peso", build_muscle: "Ganar músculo",
      eat_healthier: "Comer mejor", perform_better: "Rendir más",
      follow_title: "¿A quién seguirás?",
      follow_sub: "Tu feed se personaliza desde el día 1",
      next: "Continuar",
      trial_title: "Tu comunidad te espera",
      trial_sub: "7 días gratis. Sin tarjeta. Sin trampa.",
      enter: "Entrar a Balancen →",
      entering: "Activando…",
      after_trial: "Después del trial: €6.99/mes. Cancela cuando quieras.",
      features: ['✅ Análisis de comidas con IA', '✅ Feed social — ve qué comen tus amigos y atletas', '✅ Streaks y misiones diarias', '✅ Grupos, retos y leaderboard'],
    },
    en: {
      lang_title: "Choose your language",
      goal_title: "What's your primary goal?",
      goal_sub: "Select your main focus",
      gender_title: "What's your gender?",
      gender_sub: "Used to calculate your base metabolism",
      male: "Male", female: "Female",
      body_title: "About your body",
      body_sub: "To personalize your calorie plan",
      height: "Height (cm)", weight: "Weight (kg)", age: "Age",
      activity_title: "How active are you?",
      activity_sub: "We calculate your ideal daily calories",
      sedentary: "Sedentary", light: "Lightly active", active: "Active", very_active: "Very active (athlete)",
      motivation_title: "What motivates you most?",
      motivation_sub: "We personalize your experience",
      lose_weight: "Lose weight", build_muscle: "Build muscle",
      eat_healthier: "Eat healthier", perform_better: "Perform better",
      follow_title: "Who will you follow?",
      follow_sub: "Your feed will be personalized from day 1",
      next: "Continue",
      trial_title: "Your community is waiting",
      trial_sub: "7 days free. No card. No catch.",
      enter: "Enter Balancen →",
      entering: "Activating…",
      after_trial: "After trial: €6.99/month. Cancel anytime.",
      features: ['✅ AI-powered meal analysis', '✅ Social feed — see what friends & athletes eat', '✅ Daily streaks & missions', '✅ Groups, challenges & leaderboard'],
    },
    pt: {
      lang_title: "Escolha seu idioma",
      goal_title: "Qual é o seu objetivo?",
      goal_sub: "Escolha seu foco principal",
      gender_title: "Qual é o seu gênero?",
      gender_sub: "Para calcular seu metabolismo basal",
      male: "Masculino", female: "Feminino",
      body_title: "Sobre seu corpo",
      body_sub: "Para personalizar seu plano calórico",
      height: "Altura (cm)", weight: "Peso (kg)", age: "Idade",
      activity_title: "Quão ativo/a você é?",
      activity_sub: "Calculamos suas calorias diárias ideais",
      sedentary: "Sedentário", light: "Pouco ativo", active: "Ativo", very_active: "Muito ativo (atleta)",
      motivation_title: "O que te motiva mais?",
      motivation_sub: "Personalizamos sua experiência",
      lose_weight: "Perder peso", build_muscle: "Ganhar músculo",
      eat_healthier: "Comer melhor", perform_better: "Render mais",
      follow_title: "Quem você vai seguir?",
      follow_sub: "Seu feed será personalizado desde o dia 1",
      next: "Continuar",
      trial_title: "Sua comunidade está esperando",
      trial_sub: "7 dias grátis. Sem cartão. Sem pegadinha.",
      enter: "Entrar no Balancen →",
      entering: "Ativando…",
      after_trial: "Após o trial: €6,99/mês. Cancele quando quiser.",
      features: ['✅ Análise de refeições com IA', '✅ Feed social — veja o que amigos e atletas comem', '✅ Streaks e missões diárias', '✅ Grupos, desafios e leaderboard'],
    },
  };

  const currentLang = formData.language || lang || 'es';
  const l = L[currentLang] || L.es;

  const optionBtn = (selected, onClick, emoji, label, subtitle) => (
    <button
      key={label}
      onClick={onClick}
      className={`w-full p-4 rounded-2xl border-2 transition-all text-left flex items-center gap-3 ${
        selected ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20'
      }`}
    >
      <span className="text-3xl flex-shrink-0">{emoji}</span>
      <div>
        <span className="text-white font-semibold block">{label}</span>
        {subtitle && <span className="text-white/50 text-sm">{subtitle}</span>}
      </div>
    </button>
  );

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex flex-col items-center justify-center p-6"
      style={{ paddingTop: 'env(safe-area-inset-top, 24px)' }}
    >
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

          {/* Step 1: Language */}
          {step === 1 && (
            <motion.div key="language"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{l.lang_title}</h2>
              </div>
              <div className="space-y-3">
                {[
                  { flag: "🇪🇸", label: "Español", value: "es" },
                  { flag: "🇬🇧", label: "English", value: "en" },
                  { flag: "🇧🇷", label: "Português", value: "pt" },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    onClick={async () => {
                      setFormData(p => ({ ...p, language: opt.value }));
                      await changeLanguage(opt.value);
                      setStep(2);
                    }}
                    className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                      formData.language === opt.value
                        ? 'border-teal-400 bg-teal-500/20'
                        : 'border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20'
                    }`}
                  >
                    <span className="text-4xl">{opt.flag}</span>
                    <span className="text-white font-bold text-lg">{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Primary goal */}
          {step === 2 && (
            <motion.div key="goals"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{l.goal_title}</h2>
                <p className="text-white/60">{l.goal_sub}</p>
              </div>
              <div className="space-y-3">
                {goals.map((goal) => (
                  <button key={goal.value}
                    onClick={() => { setFormData(p => ({ ...p, primary_goal: goal.value })); setStep(3); }}
                    className="w-full p-4 rounded-2xl border-2 border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20 transition-all text-left flex items-center gap-3">
                    <span className="text-3xl">{goal.emoji}</span>
                    <span className="text-white font-semibold">{t(goal.value)}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Gender */}
          {step === 3 && (
            <motion.div key="gender"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{l.gender_title}</h2>
                <p className="text-white/60">{l.gender_sub}</p>
              </div>
              <div className="space-y-3">
                {[
                  { value: "male", emoji: "👨", label: l.male },
                  { value: "female", emoji: "👩", label: l.female },
                ].map((opt) => (
                  <button key={opt.value}
                    onClick={() => { setFormData(p => ({ ...p, gender: opt.value })); setStep(4); }}
                    className={`w-full p-5 rounded-2xl border-2 transition-all flex items-center gap-4 ${
                      formData.gender === opt.value ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20'
                    }`}>
                    <span className="text-4xl">{opt.emoji}</span>
                    <span className="text-white font-bold text-lg">{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: Height, weight, age */}
          {step === 4 && (
            <motion.div key="body"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{l.body_title}</h2>
                <p className="text-white/60">{l.body_sub}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-white/70 text-sm font-semibold">{l.height}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="170"
                    value={formData.height_cm}
                    onChange={e => setFormData(p => ({ ...p, height_cm: e.target.value }))}
                    className="w-full p-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white text-lg font-bold placeholder-white/30 focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white/70 text-sm font-semibold">{l.weight}</label>
                  <input
                    type="number"
                    inputMode="numeric"
                    placeholder="70"
                    value={formData.weight_kg}
                    onChange={e => setFormData(p => ({ ...p, weight_kg: e.target.value }))}
                    className="w-full p-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white text-lg font-bold placeholder-white/30 focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-semibold">{l.age}</label>
                <input
                  type="number"
                  inputMode="numeric"
                  placeholder="25"
                  value={formData.age}
                  onChange={e => setFormData(p => ({ ...p, age: e.target.value }))}
                  className="w-full p-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white text-lg font-bold placeholder-white/30 focus:border-teal-400 focus:outline-none"
                />
              </div>
              <button
                onClick={() => setStep(5)}
                disabled={!formData.height_cm || !formData.weight_kg || !formData.age}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed">
                {l.next}
              </button>
            </motion.div>
          )}

          {/* Step 5: Activity level */}
          {step === 5 && (
            <motion.div key="activity"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{l.activity_title}</h2>
                <p className="text-white/60">{l.activity_sub}</p>
              </div>
              <div className="space-y-3">
                {[
                  { value: "sedentary", emoji: "🛋️", label: l.sedentary },
                  { value: "light", emoji: "🚶", label: l.light },
                  { value: "active", emoji: "🏃", label: l.active },
                  { value: "very_active", emoji: "💪", label: l.very_active },
                ].map((opt) => (
                  <button key={opt.value}
                    onClick={() => {
                      const calories = calcCalories({ ...formData, activity_level: opt.value });
                      setFormData(p => ({ ...p, activity_level: opt.value, calories_goal: calories }));
                      setStep(6);
                    }}
                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                      formData.activity_level === opt.value ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20'
                    }`}>
                    <span className="text-3xl">{opt.emoji}</span>
                    <span className="text-white font-semibold">{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 6: Motivation */}
          {step === 6 && (
            <motion.div key="motivation"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{l.motivation_title}</h2>
                <p className="text-white/60">{l.motivation_sub}</p>
              </div>
              <div className="space-y-3">
                {[
                  { value: "lose_weight", emoji: "🎯", label: l.lose_weight },
                  { value: "build_muscle", emoji: "💪", label: l.build_muscle },
                  { value: "eat_healthier", emoji: "🥗", label: l.eat_healthier },
                  { value: "perform_better", emoji: "⚡", label: l.perform_better },
                ].map((opt) => (
                  <button key={opt.value}
                    onClick={() => { setFormData(p => ({ ...p, motivation: opt.value })); setStep(7); }}
                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                      formData.motivation === opt.value ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20'
                    }`}>
                    <span className="text-3xl">{opt.emoji}</span>
                    <span className="text-white font-semibold">{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 7: Who will you follow? */}
          {step === 7 && (
            <motion.div key="follow"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{l.follow_title}</h2>
                <p className="text-white/60">{l.follow_sub}</p>
              </div>
              <div className="space-y-3">
                {[
                  { emoji: "👥", title: currentLang === 'es' ? "Amigos y comunidad" : currentLang === 'pt' ? "Amigos e comunidade" : "Friends & community", subtitle: currentLang === 'es' ? "Ve qué comen tus amigos y compite en streaks" : currentLang === 'pt' ? "Veja o que seus amigos comem e compita em streaks" : "See what your friends eat and compete on streaks", value: "friends" },
                  { emoji: "⭐", title: currentLang === 'es' ? "Atletas de élite" : currentLang === 'pt' ? "Atletas de elite" : "Elite athletes", subtitle: currentLang === 'es' ? "Sigue atletas reales y ve su nutrición diaria" : currentLang === 'pt' ? "Siga atletas reais e veja sua nutrição diária" : "Follow real athletes and see their daily nutrition", value: "athletes" },
                  { emoji: "🏆", title: currentLang === 'es' ? "Ambos" : currentLang === 'pt' ? "Ambos" : "Both", subtitle: currentLang === 'es' ? "La experiencia completa de Balancen" : currentLang === 'pt' ? "A experiência completa do Balancen" : "The full Balancen experience", value: "both" },
                ].map((option) => (
                  <button key={option.value}
                    onClick={() => { setFormData(p => ({ ...p, follow_preference: option.value })); setStep(8); }}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                      (formData.follow_preference || "both") === option.value ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20'
                    }`}>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-2xl">{option.emoji}</span>
                      <span className="text-white font-semibold">{option.title}</span>
                    </div>
                    <p className="text-white/60 text-sm ml-10">{option.subtitle}</p>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 8: Trial Activation */}
          {step === 8 && (
            <motion.div key="trial"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="text-center space-y-8">
              <div className="flex justify-center">
                <Buddy pose="celebrating" size={100} />
              </div>
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

              <div className="space-y-3">
                <h1 className="text-3xl font-black text-white leading-tight">{l.trial_title}</h1>
                <p className="text-teal-300 text-xl font-semibold">{l.trial_sub}</p>
              </div>

              <AIDemo />

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-white/10" />
                <span className="text-white/40 text-xs uppercase tracking-wider">
                  {currentLang === 'es' ? 'Lo que desbloqueas con Premium:' : currentLang === 'pt' ? 'O que você desbloqueia com Premium:' : 'What you unlock with Premium:'}
                </span>
                <div className="flex-1 h-px bg-white/10" />
              </div>

              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 text-left space-y-3">
                {l.features.map((f, i) => (
                  <p key={i} className="text-white/80 text-sm">{f}</p>
                ))}
              </div>

              {formData.calories_goal && (
                <div className="bg-teal-500/20 border border-teal-400/30 rounded-2xl p-4 text-center">
                  <p className="text-teal-300 text-sm font-semibold">
                    {currentLang === 'es' ? '🎯 Tu objetivo calórico diario:' : currentLang === 'pt' ? '🎯 Sua meta calórica diária:' : '🎯 Your daily calorie goal:'}
                  </p>
                  <p className="text-white text-2xl font-black">{formData.calories_goal} kcal</p>
                </div>
              )}

              <button
                onClick={handleActivateTrial}
                disabled={saving}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black text-lg shadow-2xl shadow-teal-500/40 active:scale-95 transition-transform disabled:opacity-70">
                {saving ? l.entering : l.enter}
              </button>

              <p className="text-white/30 text-xs">{l.after_trial}</p>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}