import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { Sparkles, Zap, ArrowLeft, Flame, Target, Calendar, Utensils } from "lucide-react";
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

const TOTAL_STEPS = 16;

const TESTIMONIALS = [
  { name: "Carlos M.", flag: "🇲🇽", quote: { es: "¡Bajé 4 kg en 6 semanas sin pasar hambre!", en: "Lost 4 kg in 6 weeks without feeling hungry!", nl: "In 6 weken 4 kg afgevallen zonder honger!" } },
  { name: "Sarah K.", flag: "🇺🇸", quote: { es: "Nunca había encontrado una app tan fácil de usar.", en: "I've never found an app this easy to stick with.", nl: "Ik heb nog nooit een app gevonden die zo gemakkelijk te gebruiken is." } },
  { name: "Emma V.", flag: "🇳🇱", quote: { es: "Finalmente entiendo qué como cada día.", en: "I finally understand what I eat every day.", nl: "Ik begrijp eindelijk wat ik elke dag eet." } },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { t, lang, changeLanguage } = useTranslation();
  const [step, setStep] = useState(1);
  const [user, setUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [ageError, setAgeError] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('annual');
  const [formData, setFormData] = useState({
    language: lang || 'es',
    primary_goal: "consistency",
    obstacle: null,
    gender: null,
    height_cm: '',
    weight_kg: '',
    age: '',
    activity_level: null,
    calories_goal: null,
    meals_per_day: null,
    dietary_restrictions: [],
    motivation: null,
    target_weight_kg: '',
    goal_weeks: 12,
    social_mode: "with_team",
    follow_mode: "both",
    follow_preference: "both",
    referral_source: null,
  });

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) localStorage.setItem('pending_referral', invite);
  }, []);

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

  // Auto-advance for social proof screen (step 13)
  useEffect(() => {
    if (step === 13) {
      const timer = setTimeout(() => setStep(14), 4000);
      return () => clearTimeout(timer);
    }
  }, [step]);

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
      const trialEndDate = new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000);
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
        referral_source: formData.referral_source,
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
      toast.error(lang === "es" ? "Error al activar el trial" : lang === "nl" ? "Fout bij activeren trial" : "Error activating trial");
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

  const L = {
    es: {
      lang_title: "Elige tu idioma",
      goal_title: "¿Cuál es tu objetivo?",
      goal_sub: "Elige tu enfoque principal",
      obstacle_title: "¿Cuál es tu mayor obstáculo?",
      obstacle_sub: "Te ayudamos a superarlo",
      obstacles: [
        { value: "time", emoji: "🕐", label: "Falta de tiempo" },
        { value: "cravings", emoji: "🍕", label: "Antojos y tentaciones" },
        { value: "what_to_eat", emoji: "🤷", label: "No sé qué comer" },
        { value: "forget", emoji: "📱", label: "Me olvido de registrar" },
      ],
      gender_title: "¿Cuál es tu género?",
      gender_sub: "Para calcular tu metabolismo basal",
      male: "Hombre", female: "Mujer",
      body_title: "Tu cuerpo",
      body_sub: "Para personalizar tu plan calórico",
      height: "Altura (cm)", weight: "Peso (kg)", age: "Edad",
      age_error: "Balancen es para mayores de 13 años",
      activity_title: "¿Cuán activo/a eres?",
      activity_sub: "Calculamos tus calorías diarias ideales",
      sedentary: "Sedentario", light: "Poco activo", active: "Activo", very_active: "Muy activo (atleta)",
      meals_title: "¿Cuántas comidas hacés por día?",
      meals_sub: "Para organizar tu seguimiento",
      meals: [
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
        { value: "4+", label: "Más de 4" },
      ],
      diet_title: "¿Tenés alguna restricción alimentaria?",
      diet_sub: "Podés elegir varias opciones",
      diet_continue: "Continuar",
      diet_options: [
        { value: "none", emoji: "✅", label: "Ninguna" },
        { value: "vegetarian", emoji: "🥦", label: "Vegetariano" },
        { value: "vegan", emoji: "🌱", label: "Vegano" },
        { value: "gluten_free", emoji: "🌾", label: "Sin gluten" },
        { value: "lactose_free", emoji: "🥛", label: "Sin lactosa" },
        { value: "allergies", emoji: "⚠️", label: "Alergias" },
      ],
      motivation_title: "¿Qué te motiva más?",
      motivation_sub: "Personalizamos tu experiencia",
      lose_weight: "Perder peso", build_muscle: "Ganar músculo",
      eat_healthier: "Comer mejor", perform_better: "Rendir más",
      weight_goal_title: "¿Cuál es tu meta de peso?",
      weight_goal_sub: "Calculamos tu plan personalizado",
      target_weight: "Peso objetivo (kg)",
      timeframe: "Plazo",
      weeks: "semanas",
      deficit_label: "Déficit semanal estimado:",
      follow_title: "¿A quién seguirás?",
      follow_sub: "Tu feed se personaliza desde el día 1",
      referral_title: "¿Cómo conociste Balancen?",
      referral_sub: "Nos ayuda a mejorar",
      summary_title: "Tu plan Balancen",
      summary_sub: "Basado en tu perfil personalizado",
      daily_calories: "Calorías diarias",
      protein: "Proteína", carbs: "Carbohidratos", fat: "Grasa",
      goal_date: "Fecha estimada de meta",
      meals_per_day: "Comidas por día",
      diet_pref: "Preferencias alimentarias",
      social_title: "Ya no estás solo/a",
      social_count: "10,000+",
      social_sub: "personas con tu mismo objetivo ya empezaron",
      trial_title: "¡Tu plan está listo!",
      trial_sub: "5 días gratis. Sin tarjeta. Sin trampa.",
      annual_label: "Plan Anual",
      annual_price: "€49.99/año",
      annual_monthly: "equivale a €4.17/mes",
      annual_badge: "Mejor valor",
      monthly_label: "Plan Mensual",
      monthly_price: "€6.99/mes",
      cta: "Ver mi plan →",
      restore: "Restaurar compra",
      next: "Continuar",
      entering: "Activando…",
      features: ['📸 300 análisis de comida con IA por mes', '✅ Feed social — ve qué comen tus amigos y atletas', '✅ Streaks y misiones diarias', '✅ Grupos, retos y leaderboard'],
      power_label: "Plan Power",
      power_price: "€12.99/mes",
      power_monthly: "Análisis ilimitados",
      founder_title: "Hi, I'm Gonzalo 👋",
      founder_para1: "Creé Balancen porque yo mismo luché para mantener hábitos de nutrición siendo deportista. Las apps existentes eran o muy complicadas o demasiado genéricas.",
      founder_para2: "Sé honesto: cada análisis de IA tiene un costo real. El precio de Balancen está calculado para ser justo — ni demasiado caro para vos, ni insostenible para mí. Quiero construir esto a largo plazo.",
      founder_para3: "5 días gratis, sin tarjeta. Si no te cambia el hábito, cancelás sin drama. — Gonzalo 🙌",
      },
    en: {
      lang_title: "Choose your language",
      goal_title: "What's your primary goal?",
      goal_sub: "Select your main focus",
      obstacle_title: "What's your biggest obstacle?",
      obstacle_sub: "We'll help you overcome it",
      obstacles: [
        { value: "time", emoji: "🕐", label: "Lack of time" },
        { value: "cravings", emoji: "🍕", label: "Cravings & temptations" },
        { value: "what_to_eat", emoji: "🤷", label: "I don't know what to eat" },
        { value: "forget", emoji: "📱", label: "I forget to track" },
      ],
      gender_title: "What's your gender?",
      gender_sub: "Used to calculate your base metabolism",
      male: "Male", female: "Female",
      body_title: "About your body",
      body_sub: "To personalize your calorie plan",
      height: "Height (cm)", weight: "Weight (kg)", age: "Age",
      age_error: "Balancen is for users 13 and older",
      activity_title: "How active are you?",
      activity_sub: "We calculate your ideal daily calories",
      sedentary: "Sedentary", light: "Lightly active", active: "Active", very_active: "Very active (athlete)",
      meals_title: "How many meals do you eat per day?",
      meals_sub: "To organize your tracking",
      meals: [
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
        { value: "4+", label: "More than 4" },
      ],
      diet_title: "Any dietary restrictions?",
      diet_sub: "You can select multiple options",
      diet_continue: "Continue",
      diet_options: [
        { value: "none", emoji: "✅", label: "None" },
        { value: "vegetarian", emoji: "🥦", label: "Vegetarian" },
        { value: "vegan", emoji: "🌱", label: "Vegan" },
        { value: "gluten_free", emoji: "🌾", label: "Gluten-free" },
        { value: "lactose_free", emoji: "🥛", label: "Lactose-free" },
        { value: "allergies", emoji: "⚠️", label: "Allergies" },
      ],
      motivation_title: "What motivates you most?",
      motivation_sub: "We personalize your experience",
      lose_weight: "Lose weight", build_muscle: "Build muscle",
      eat_healthier: "Eat healthier", perform_better: "Perform better",
      weight_goal_title: "What's your weight goal?",
      weight_goal_sub: "We calculate your personalized plan",
      target_weight: "Target weight (kg)",
      timeframe: "Timeframe",
      weeks: "weeks",
      deficit_label: "Estimated weekly deficit:",
      follow_title: "Who will you follow?",
      follow_sub: "Your feed will be personalized from day 1",
      referral_title: "How did you hear about Balancen?",
      referral_sub: "Helps us improve",
      summary_title: "Your Balancen Plan",
      summary_sub: "Based on your personalized profile",
      daily_calories: "Daily calories",
      protein: "Protein", carbs: "Carbs", fat: "Fat",
      goal_date: "Estimated goal date",
      meals_per_day: "Meals per day",
      diet_pref: "Dietary preferences",
      social_title: "You're not alone",
      social_count: "10,000+",
      social_sub: "people with your same goal already started",
      trial_title: "Your plan is ready!",
      trial_sub: "5 days free. No card. No catch.",
      annual_label: "Annual Plan",
      annual_price: "€49.99/year",
      annual_monthly: "equals €4.17/month",
      annual_badge: "Best value",
      monthly_label: "Monthly Plan",
      monthly_price: "€6.99/month",
      cta: "See my plan →",
      restore: "Restore purchase",
      next: "Continue",
      entering: "Activating…",
      features: ['📸 300 AI meal analyses per month', '✅ Social feed — see what friends & athletes eat', '✅ Daily streaks & missions', '✅ Groups, challenges & leaderboard'],
      power_label: "Power Plan",
      power_price: "€12.99/month",
      power_monthly: "Unlimited analyses",
      founder_title: "Hi, I'm Gonzalo 👋",
      founder_para1: "I built Balancen because I struggled myself to maintain nutrition habits as an athlete. Existing apps were either too complex or too generic.",
      founder_para2: "Full transparency: every AI analysis has a real cost. Balancen's price is calculated to be fair — not too expensive for you, not unsustainable for me. I want to build this for the long term.",
      founder_para3: "5 days free, no card needed. If it doesn't change your habit, cancel no drama. — Gonzalo 🙌",
      },
      nl: {
      lang_title: "Kies je taal",
      goal_title: "Wat is je hoofddoel?",
      goal_sub: "Selecteer je primaire focus",
      obstacle_title: "Wat is je grootste obstakel?",
      obstacle_sub: "We helpen je dit te overwinnen",
      obstacles: [
       { value: "time", emoji: "🕐", label: "Gebrek aan tijd" },
       { value: "cravings", emoji: "🍕", label: "Verlangen naar eten" },
       { value: "what_to_eat", emoji: "🤷", label: "Ik weet niet wat ik moet eten" },
       { value: "forget", emoji: "📱", label: "Ik vergeet in te voeren" },
      ],
      gender_title: "Wat is je geslacht?",
      gender_sub: "Om je basismetabolisme te berekenen",
      male: "Man", female: "Vrouw",
      body_title: "Over je lichaam",
      body_sub: "Om je calorieënplan aan te passen",
      height: "Lengte (cm)", weight: "Gewicht (kg)", age: "Leeftijd",
      age_error: "Balancen is voor gebruikers van 13 jaar en ouder",
      activity_title: "Hoe actief ben je?",
      activity_sub: "We berekenen je ideale dagelijkse calorieën",
      sedentary: "Zittend", light: "Licht actief", active: "Actief", very_active: "Zeer actief (sporter)",
      meals_title: "Hoeveel maaltijden eet je per dag?",
      meals_sub: "Om je registratie in te delen",
      meals: [
       { value: "2", label: "2" },
       { value: "3", label: "3" },
       { value: "4", label: "4" },
       { value: "4+", label: "Meer dan 4" },
      ],
      diet_title: "Voedselbeperking?",
      diet_sub: "Je kunt meerdere opties selecteren",
      diet_continue: "Doorgaan",
      diet_options: [
       { value: "none", emoji: "✅", label: "Geen" },
       { value: "vegetarian", emoji: "🥦", label: "Vegetarisch" },
       { value: "vegan", emoji: "🌱", label: "Veganistisch" },
       { value: "gluten_free", emoji: "🌾", label: "Glutenvrij" },
       { value: "lactose_free", emoji: "🥛", label: "Lactosevrij" },
       { value: "allergies", emoji: "⚠️", label: "Allergie ën" },
      ],
      motivation_title: "Wat motiveert je het meest?",
      motivation_sub: "We passen je ervaring aan",
      lose_weight: "Afvallen", build_muscle: "Spiermassa opbouwen",
      eat_healthier: "Gezonder eten", perform_better: "Beter presteren",
      weight_goal_title: "Wat is je gewichtsdoel?",
      weight_goal_sub: "We berekenen je persoonlijk plan",
      target_weight: "Doelgewicht (kg)",
      timeframe: "Tijdsbestek",
      weeks: "weken",
      deficit_label: "Geschat wekelijks tekort:",
      follow_title: "Wie ga je volgen?",
      follow_sub: "Je feed wordt vanaf dag 1 gepersonaliseerd",
      referral_title: "Hoe hoorde je van Balancen?",
      referral_sub: "Dit helpt ons te verbeteren",
      summary_title: "Je Balancen-plan",
      summary_sub: "Op basis van je persoonlijke profiel",
      daily_calories: "Dagelijkse calorieën",
      protein: "Eiwit", carbs: "Koolhydraten", fat: "Vet",
      goal_date: "Geschat doeldatum",
      meals_per_day: "Maaltijden per dag",
      diet_pref: "Voedingsvoorkeur",
      social_title: "Je bent niet alleen",
      social_count: "10.000+",
      social_sub: "mensen met hetzelfde doel zijn al gestart",
      trial_title: "Je plan is klaar!",
      trial_sub: "7 dagen gratis. Geen kaart. Geen foefjes.",
      annual_label: "Jaarplan",
      annual_price: "€49,99/jaar",
      annual_monthly: "gelijk aan €4,17/maand",
      annual_badge: "Beste waarde",
      monthly_label: "Maandplan",
      monthly_price: "€6,99/maand",
      cta: "Mijn plan zien →",
      restore: "Aankoop herstellen",
      next: "Doorgaan",
      entering: "Activeren…",
      features: ['📸 300 AI-maaltijdanalyses per maand', '✅ Sociale feed — zie wat vrienden en sporters eten', '✅ Dagelijkse streaks en missies', '✅ Groepen, uitdagingen en ranglijst'],
      power_label: "Power-plan",
      power_price: "€12.99/maand",
      power_monthly: "Onbeperkte analyses",
      founder_title: "Hallo, ik ben Gonzalo 👋",
      founder_para1: "Ik heb Balancen gemaakt omdat ik zelf moeite had met voedingsgewoonten als sporter. Bestaande apps waren te complex of te generiek.",
      founder_para2: "Volledige transparantie: elke AI-analyse kost geld. Balancens prijs is fair berekend — niet te duur voor jou, niet onhoudbaar voor mij.",
      founder_para3: "5 dagen gratis, geen kaart nodig. Als het je gewoonte niet verandert, kun je annuleren zonder stress. — Gonzalo 🙌",
      },
      pt: {
      lang_title: "Escolha seu idioma",
      goal_title: "Qual é o seu objetivo?",
      goal_sub: "Escolha seu foco principal",
      obstacle_title: "Qual é seu maior obstáculo?",
      obstacle_sub: "Vamos te ajudar a superar",
      obstacles: [
        { value: "time", emoji: "🕐", label: "Falta de tempo" },
        { value: "cravings", emoji: "🍕", label: "Desejos e tentações" },
        { value: "what_to_eat", emoji: "🤷", label: "Não sei o que comer" },
        { value: "forget", emoji: "📱", label: "Esqueço de registrar" },
      ],
      gender_title: "Qual é o seu gênero?",
      gender_sub: "Para calcular seu metabolismo basal",
      male: "Masculino", female: "Feminino",
      body_title: "Sobre seu corpo",
      body_sub: "Para personalizar seu plano calórico",
      height: "Altura (cm)", weight: "Peso (kg)", age: "Idade",
      age_error: "Balancen é para usuários com 13 anos ou mais",
      activity_title: "Quão ativo/a você é?",
      activity_sub: "Calculamos suas calorias diárias ideais",
      sedentary: "Sedentário", light: "Pouco ativo", active: "Ativo", very_active: "Muito ativo (atleta)",
      meals_title: "Quantas refeições você faz por dia?",
      meals_sub: "Para organizar seu registro",
      meals: [
        { value: "2", label: "2" },
        { value: "3", label: "3" },
        { value: "4", label: "4" },
        { value: "4+", label: "Mais de 4" },
      ],
      diet_title: "Alguma restrição alimentar?",
      diet_sub: "Você pode selecionar várias opções",
      diet_continue: "Continuar",
      diet_options: [
        { value: "none", emoji: "✅", label: "Nenhuma" },
        { value: "vegetarian", emoji: "🥦", label: "Vegetariano" },
        { value: "vegan", emoji: "🌱", label: "Vegano" },
        { value: "gluten_free", emoji: "🌾", label: "Sem glúten" },
        { value: "lactose_free", emoji: "🥛", label: "Sem lactose" },
        { value: "allergies", emoji: "⚠️", label: "Alergias" },
      ],
      motivation_title: "O que te motiva mais?",
      motivation_sub: "Personalizamos sua experiência",
      lose_weight: "Perder peso", build_muscle: "Ganhar músculo",
      eat_healthier: "Comer melhor", perform_better: "Render mais",
      weight_goal_title: "Qual é sua meta de peso?",
      weight_goal_sub: "Calculamos seu plano personalizado",
      target_weight: "Peso alvo (kg)",
      timeframe: "Prazo",
      weeks: "semanas",
      deficit_label: "Déficit semanal estimado:",
      follow_title: "Quem você vai seguir?",
      follow_sub: "Seu feed será personalizado desde o dia 1",
      referral_title: "Como você conheceu o Balancen?",
      referral_sub: "Nos ajuda a melhorar",
      summary_title: "Seu plano Balancen",
      summary_sub: "Baseado no seu perfil personalizado",
      daily_calories: "Calorias diárias",
      protein: "Proteína", carbs: "Carboidratos", fat: "Gordura",
      goal_date: "Data estimada da meta",
      meals_per_day: "Refeições por dia",
      diet_pref: "Preferências alimentares",
      social_title: "Você não está sozinho/a",
      social_count: "10.000+",
      social_sub: "pessoas com o mesmo objetivo já começaram",
      trial_title: "Seu plano está pronto!",
      trial_sub: "5 dias grátis. Sem cartão. Sem pegadinha.",
      annual_label: "Plano Anual",
      annual_price: "€49,99/ano",
      annual_monthly: "equivale a €4,17/mês",
      annual_badge: "Melhor valor",
      monthly_label: "Plano Mensal",
      monthly_price: "€6,99/mês",
      cta: "Ver meu plano →",
      restore: "Restaurar compra",
      next: "Continuar",
      entering: "Ativando…",
      features: ['✅ Análise de refeições com IA', '✅ Feed social — veja o que amigos e atletas comem', '✅ Streaks e missões diárias', '✅ Grupos, desafios e leaderboard'],
      founder_title: "Hi, I'm Gonzalo 👋",
      founder_para1: "Criei o Balancen porque eu mesmo lutei para manter hábitos de nutrição como atleta. Os apps existentes eram ou muito complexos ou muito genéricos.",
      founder_para2: "Com transparência: cada análise de IA tem um custo real. O preço do Balancen é calculado para ser justo — não muito caro para você, nem insustentável para mim.",
      founder_para3: "5 dias grátis, sem cartão. Se não mudar seu hábito, cancele sem drama. — Gonzalo 🙌",
      },
  };

  const currentLang = formData.language || lang || 'es';
  const l = L[currentLang] || L.es;

  const toggleDiet = (value) => {
    setFormData(p => {
      if (value === 'none') return { ...p, dietary_restrictions: ['none'] };
      const curr = (p.dietary_restrictions || []).filter(v => v !== 'none');
      if (curr.includes(value)) return { ...p, dietary_restrictions: curr.filter(v => v !== value) };
      return { ...p, dietary_restrictions: [...curr, value] };
    });
  };

  const weeklyDeficit = () => {
    if (!formData.target_weight_kg || !formData.weight_kg || !formData.goal_weeks) return null;
    const diff = parseFloat(formData.weight_kg) - parseFloat(formData.target_weight_kg);
    if (diff <= 0) return null;
    const gramsPerWeek = Math.round((diff * 1000) / formData.goal_weeks);
    return gramsPerWeek;
  };

  const goalDate = () => {
    const d = new Date();
    d.setDate(d.getDate() + (formData.goal_weeks || 12) * 7);
    return d.toLocaleDateString(currentLang === 'en' ? 'en-US' : currentLang === 'nl' ? 'nl-NL' : 'es-ES', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const macros = () => {
    const cal = formData.calories_goal || 2000;
    return {
      protein: Math.round((cal * 0.3) / 4),
      carbs: Math.round((cal * 0.4) / 4),
      fat: Math.round((cal * 0.3) / 9),
    };
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex flex-col items-center justify-center p-6"
      style={{ paddingTop: 'env(safe-area-inset-top, 24px)' }}
    >
      {/* Progress bar — hidden on language, social proof, founder, and paywall */}
      {step > 1 && step < 13 && (
        <div className="w-full max-w-md mb-8">
          <div className="flex items-center gap-3 mb-3">
            <button
              onClick={() => setStep(step - 1)}
              className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors flex-shrink-0"
            >
              <ArrowLeft size={18} className="text-white" />
            </button>
            <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full"
                animate={{ width: `${progressPct}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>
            <p className="text-white/30 text-xs">{step}/{TOTAL_STEPS - 1}</p>
          </div>
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
                   { flag: "🇳🇱", label: "Nederlands", value: "nl" },
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

          {/* Step 3: Biggest obstacle (NEW) */}
          {step === 3 && (
            <motion.div key="obstacle"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{l.obstacle_title}</h2>
                <p className="text-white/60">{l.obstacle_sub}</p>
              </div>
              <div className="space-y-3">
                {l.obstacles.map((opt) => (
                  <button key={opt.value}
                    onClick={() => { setFormData(p => ({ ...p, obstacle: opt.value })); setStep(4); }}
                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                      formData.obstacle === opt.value ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20'
                    }`}>
                    <span className="text-3xl">{opt.emoji}</span>
                    <span className="text-white font-semibold">{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: Gender */}
          {step === 4 && (
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
                    onClick={() => { setFormData(p => ({ ...p, gender: opt.value })); setStep(5); }}
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

          {/* Step 5: Height, weight, age */}
          {step === 5 && (
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
                  <input type="number" inputMode="numeric" placeholder="170"
                    value={formData.height_cm}
                    onChange={e => setFormData(p => ({ ...p, height_cm: e.target.value }))}
                    className="w-full p-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white text-lg font-bold placeholder-white/30 focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white/70 text-sm font-semibold">{l.weight}</label>
                  <input type="number" inputMode="numeric" placeholder="70"
                    value={formData.weight_kg}
                    onChange={e => setFormData(p => ({ ...p, weight_kg: e.target.value }))}
                    className="w-full p-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white text-lg font-bold placeholder-white/30 focus:border-teal-400 focus:outline-none"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-white/70 text-sm font-semibold">{l.age}</label>
                <input type="number" inputMode="numeric" placeholder="25"
                  value={formData.age}
                  onChange={e => {
                    setFormData(p => ({ ...p, age: e.target.value }));
                    const age = parseInt(e.target.value);
                    setAgeError(age && age < 13 ? l.age_error : '');
                  }}
                  className="w-full p-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white text-lg font-bold placeholder-white/30 focus:border-teal-400 focus:outline-none"
                />
                {ageError && <p className="text-red-400 text-sm font-semibold">{ageError}</p>}
              </div>
              <button
                onClick={() => setStep(6)}
                disabled={!formData.height_cm || !formData.weight_kg || !formData.age || ageError}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black text-lg shadow-xl active:scale-95 transition-transform disabled:opacity-40 disabled:cursor-not-allowed">
                {l.next}
              </button>
            </motion.div>
          )}

          {/* Step 6: Activity level */}
          {step === 6 && (
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
                      setStep(7);
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

          {/* Step 7: Meals per day (NEW) */}
          {step === 7 && (
            <motion.div key="meals"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{l.meals_title}</h2>
                <p className="text-white/60">{l.meals_sub}</p>
              </div>
              <div className="space-y-3">
                {l.meals.map((opt) => (
                  <button key={opt.value}
                    onClick={() => { setFormData(p => ({ ...p, meals_per_day: opt.value })); setStep(8); }}
                    className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                      formData.meals_per_day === opt.value ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20'
                    }`}>
                    <span className="text-white font-bold text-xl">{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 8: Dietary restrictions (NEW, multi-select) */}
          {step === 8 && (
            <motion.div key="diet"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{l.diet_title}</h2>
                <p className="text-white/60">{l.diet_sub}</p>
              </div>
              <div className="space-y-3">
                {l.diet_options.map((opt) => {
                  const selected = (formData.dietary_restrictions || []).includes(opt.value);
                  return (
                    <button key={opt.value}
                      onClick={() => toggleDiet(opt.value)}
                      className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-3 ${
                        selected ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20'
                      }`}>
                      <span className="text-3xl">{opt.emoji}</span>
                      <span className="text-white font-semibold">{opt.label}</span>
                      {selected && <span className="ml-auto text-teal-400 font-bold">✓</span>}
                    </button>
                  );
                })}
              </div>
              <button
                onClick={() => setStep(9)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black text-lg shadow-xl active:scale-95 transition-transform">
                {l.diet_continue}
              </button>
            </motion.div>
          )}

          {/* Step 9: Motivation */}
          {step === 9 && (
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
                    onClick={() => { setFormData(p => ({ ...p, motivation: opt.value })); setStep(10); }}
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

          {/* Step 10: Weight goal + timeframe (NEW) */}
          {step === 10 && (
            <motion.div key="weightgoal"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{l.weight_goal_title}</h2>
                <p className="text-white/60">{l.weight_goal_sub}</p>
              </div>
              {formData.weight_kg && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-3 text-center">
                  <p className="text-white/60 text-sm">
                      {currentLang === 'es' ? 'Peso actual:' : currentLang === 'nl' ? 'Huidig gewicht:' : 'Current weight:'}{' '}
                    <span className="text-white font-bold">{formData.weight_kg} kg</span>
                  </p>
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-white/70 text-sm font-semibold">{l.target_weight}</label>
                  <input type="number" inputMode="numeric" placeholder="65"
                    value={formData.target_weight_kg}
                    onChange={e => setFormData(p => ({ ...p, target_weight_kg: e.target.value }))}
                    className="w-full p-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white text-lg font-bold placeholder-white/30 focus:border-teal-400 focus:outline-none"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-white/70 text-sm font-semibold">{l.timeframe}</label>
                  <select
                    value={formData.goal_weeks}
                    onChange={e => setFormData(p => ({ ...p, goal_weeks: parseInt(e.target.value) }))}
                    className="w-full p-4 rounded-2xl bg-white/10 border-2 border-white/20 text-white text-lg font-bold focus:border-teal-400 focus:outline-none appearance-none"
                  >
                    {[4, 8, 12, 16, 20, 24].map(w => (
                      <option key={w} value={w} className="bg-slate-900">{w} {l.weeks}</option>
                    ))}
                  </select>
                </div>
              </div>
              {weeklyDeficit() && (
                <div className="bg-teal-500/10 border border-teal-400/20 rounded-2xl p-3">
                  <p className="text-teal-300 text-sm text-center">
                    {l.deficit_label} <span className="font-bold">{weeklyDeficit()}g/semana</span>
                  </p>
                </div>
              )}
              <button
                onClick={() => setStep(11)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black text-lg shadow-xl active:scale-95 transition-transform">
                {l.next}
              </button>
            </motion.div>
          )}

          {/* Step 11: Who will you follow? */}
          {step === 11 && (
            <motion.div key="follow"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{l.follow_title}</h2>
                <p className="text-white/60">{l.follow_sub}</p>
              </div>
              <div className="space-y-3">
                {[
                  { emoji: "👥", title: currentLang === 'es' ? "Amigos y comunidad" : currentLang === 'nl' ? "Vrienden en community" : "Friends & community", subtitle: currentLang === 'es' ? "Ve qué comen tus amigos y compite en streaks" : currentLang === 'nl' ? "Zie wat je vrienden eten en competeer in streaks" : "See what your friends eat and compete on streaks", value: "friends" },
                  { emoji: "⭐", title: currentLang === 'es' ? "Atletas de élite" : currentLang === 'nl' ? "Elite-atleten" : "Elite athletes", subtitle: currentLang === 'es' ? "Sigue atletas reales y ve su nutrición diaria" : currentLang === 'nl' ? "Volg echte atleten en zie hun dagelijkse voeding" : "Follow real athletes and see their daily nutrition", value: "athletes" },
                  { emoji: "🏆", title: currentLang === 'es' ? "Ambos" : currentLang === 'nl' ? "Beide" : "Both", subtitle: currentLang === 'es' ? "La experiencia completa de Balancen" : currentLang === 'nl' ? "De volledige Balancen-ervaring" : "The full Balancen experience", value: "both" },
                ].map((option) => (
                  <button key={option.value}
                    onClick={() => { setFormData(p => ({ ...p, follow_preference: option.value })); setStep(12); }}
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

          {/* Step 12: Referral source (NEW) */}
          {step === 12 && (
            <motion.div key="referral"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-8">
                <h2 className="text-2xl font-black text-white mb-2">{l.referral_title}</h2>
                <p className="text-white/60">{l.referral_sub}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { emoji: "📱", value: "tiktok", label: "TikTok" },
                  { emoji: "📸", value: "instagram", label: "Instagram" },
                  { emoji: "🔍", value: "google", label: currentLang === 'es' ? "Google / App Store" : currentLang === 'nl' ? "Google / App Store" : "Google / App Store" },
                  { emoji: "👥", value: "friend", label: currentLang === 'es' ? "Un amigo" : currentLang === 'nl' ? "Een vriend" : "A friend" },
                  { emoji: "🏋️", value: "coach", label: currentLang === 'es' ? "Mi entrenador / equipo" : currentLang === 'nl' ? "Mijn trainer / team" : "My coach / team" },
                  { emoji: "🎙️", value: "podcast", label: "Podcast" },
                  { emoji: "📧", value: "email", label: currentLang === 'es' ? "Email o newsletter" : currentLang === 'nl' ? "E-mail of nieuwsbrief" : "Email or newsletter" },
                  { emoji: "🌐", value: "other", label: currentLang === 'es' ? "Otro" : currentLang === 'nl' ? "Anders" : "Other" },
                ].map((opt) => (
                  <button key={opt.value}
                    onClick={() => { setFormData(p => ({ ...p, referral_source: opt.value })); setStep(13); }}
                    className={`p-4 rounded-2xl border-2 transition-all flex flex-col items-center gap-2 ${
                      formData.referral_source === opt.value ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20'
                    }`}>
                    <span className="text-3xl">{opt.emoji}</span>
                    <span className="text-white font-semibold text-xs text-center">{opt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 13: Personalized summary (NEW) */}
          {step === 13 && (
            <motion.div key="summary"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-black text-white mb-2">{l.summary_title}</h2>
                <p className="text-white/60 text-sm">{l.summary_sub}</p>
              </div>
              <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 border border-teal-400/30 rounded-3xl p-5 space-y-4">
                {/* Calories */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                    <Flame size={20} className="text-orange-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/60 text-xs">{l.daily_calories}</p>
                    <p className="text-white font-black text-xl">{formData.calories_goal || 2000} kcal</p>
                  </div>
                </div>
                {/* Macros */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                    <Zap size={20} className="text-purple-300" />
                  </div>
                  <div className="flex-1">
                    <p className="text-white/60 text-xs">{l.protein} / {l.carbs} / {l.fat}</p>
                    <p className="text-white font-bold text-sm">
                      {macros().protein}g · {macros().carbs}g · {macros().fat}g
                    </p>
                  </div>
                </div>
                {/* Goal date */}
                {formData.goal_weeks && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-teal-500/20 flex items-center justify-center flex-shrink-0">
                      <Calendar size={20} className="text-teal-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white/60 text-xs">{l.goal_date}</p>
                      <p className="text-white font-bold text-sm">{goalDate()}</p>
                    </div>
                  </div>
                )}
                {/* Meals per day */}
                {formData.meals_per_day && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Utensils size={20} className="text-emerald-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white/60 text-xs">{l.meals_per_day}</p>
                      <p className="text-white font-bold text-sm">{formData.meals_per_day}</p>
                    </div>
                  </div>
                )}
                {/* Dietary preferences */}
                {formData.dietary_restrictions?.length > 0 && !formData.dietary_restrictions.includes('none') && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center flex-shrink-0">
                      <Target size={20} className="text-green-300" />
                    </div>
                    <div className="flex-1">
                      <p className="text-white/60 text-xs">{l.diet_pref}</p>
                      <p className="text-white font-bold text-sm capitalize">
                        {formData.dietary_restrictions.join(', ').replace(/_/g, ' ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
              <button
                onClick={() => setStep(14)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black text-lg shadow-xl active:scale-95 transition-transform">
                {l.next}
              </button>
            </motion.div>
          )}

          {/* Step 14: Social proof (NEW) */}
          {step === 14 && (
            <motion.div key="social"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="space-y-8 text-center">
              <div className="space-y-3">
                <motion.p
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
                  className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-teal-300 to-emerald-300">
                  {l.social_count}
                </motion.p>
                <motion.p
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
                  className="text-white text-xl font-bold leading-snug">
                  {l.social_sub}
                </motion.p>
              </div>
              <div className="space-y-3">
                {TESTIMONIALS.map((t, i) => (
                  <motion.div
                    key={t.name}
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 + i * 0.15 }}
                    className="bg-white/8 border border-white/10 rounded-2xl p-4 text-left"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl">{t.flag}</span>
                      <span className="text-white font-semibold text-sm">{t.name}</span>
                      <span className="text-amber-400 text-xs ml-auto">★★★★★</span>
                    </div>
                    <p className="text-white/70 text-sm italic">"{t.quote[currentLang] || t.quote.en}"</p>
                  </motion.div>
                ))}
              </div>
              <button
                onClick={() => setStep(15)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black text-lg shadow-xl active:scale-95 transition-transform">
                {l.next}
              </button>
              </motion.div>
              )}

              {/* Step 15: Founder message */}
              {step === 15 && (
              <motion.div key="founder"
              initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
              className="space-y-6">
              {/* Avatar circle with initials */}
              <div className="flex justify-center mb-6">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center">
                  <span className="text-white font-black text-5xl">G</span>
                </div>
              </div>

              {/* Title */}
              <div className="text-center">
                <h2 className="text-2xl font-black text-white">{l.founder_title}</h2>
              </div>

              {/* Paragraphs */}
              <div className="space-y-4 text-center">
                <p className="text-white/80 text-sm leading-relaxed">
                  {l.founder_para1}
                </p>
                <p className="text-white/80 text-sm leading-relaxed">
                  {l.founder_para2}
                </p>
                <p className="text-white/80 text-sm leading-relaxed">
                  {l.founder_para3}
                </p>
              </div>

              {/* Continue button */}
              <button
                onClick={() => setStep(16)}
                className="w-full py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black text-lg shadow-xl active:scale-95 transition-transform">
                {l.next}
              </button>
              </motion.div>
              )}

              {/* Step 16: Paywall */}
              {step === 16 && (
            <motion.div key="paywall"
              initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
              className="space-y-6 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-black text-white leading-tight">{l.trial_title}</h1>
                <p className="text-teal-300 font-semibold">{l.trial_sub}</p>
              </div>

              {/* Plan options */}
              <div className="space-y-3">
                {/* Annual — highlighted */}
                <button
                  onClick={() => setSelectedPlan('annual')}
                  className={`w-full p-4 rounded-2xl border-2 transition-all text-left relative ${
                    selectedPlan === 'annual' ? 'border-teal-400 bg-teal-500/20' : 'border-white/20 bg-white/5'
                  }`}>
                  <div className="absolute -top-2.5 right-4 bg-amber-400 text-slate-900 text-xs font-black px-2.5 py-0.5 rounded-full">
                    {l.annual_badge}
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="text-left">
                      <p className="text-white font-bold">{l.annual_label}</p>
                      <p className="text-white/50 text-xs">{l.annual_monthly}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-black text-lg">{l.annual_price}</p>
                    </div>
                  </div>
                  {selectedPlan === 'annual' && (
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-teal-400 flex items-center justify-center">
                      <span className="text-white text-xs font-black">✓</span>
                    </div>
                  )}
                </button>

                {/* Monthly — decoy */}
                  <button
                    onClick={() => setSelectedPlan('monthly')}
                    className={`w-full p-4 rounded-2xl border-2 transition-all text-left ${
                      selectedPlan === 'monthly' ? 'border-teal-400 bg-teal-500/20' : 'border-white/10 bg-white/3 opacity-70'
                    }`}>
                    <div className="flex items-center justify-between">
                      <div className="text-left">
                        <p className="text-white font-bold">{l.monthly_label}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold">{l.monthly_price}</p>
                      </div>
                    </div>
                  </button>
                </div>

                {/* Comparison Table */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-3">
                  <div className="text-xs font-bold text-white/60 uppercase tracking-wide mb-3">Comparación de planes</div>

                  {/* Row 1: AI Analyses */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white/80 text-sm flex-1">📸 {currentLang === 'es' ? 'Análisis IA' : currentLang === 'nl' ? 'IA-analyses' : 'AI Analyses'}</span>
                    <span className="text-white font-bold text-sm">300/mes</span>
                    <span className="text-teal-300 font-black text-lg">∞</span>
                  </div>

                  {/* Row 2: Social Feed */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white/80 text-sm flex-1">📱 {currentLang === 'es' ? 'Feed Social' : currentLang === 'nl' ? 'Sociale feed' : 'Social Feed'}</span>
                    <span className="text-teal-400">✓</span>
                    <span className="text-teal-400">✓</span>
                  </div>

                  {/* Row 3: Groups & Challenges */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white/80 text-sm flex-1">🏆 {currentLang === 'es' ? 'Grupos y retos' : currentLang === 'nl' ? 'Groepen & retos' : 'Groups & Challenges'}</span>
                    <span className="text-teal-400">✓</span>
                    <span className="text-teal-400">✓</span>
                  </div>
                </div>

                {/* Features */}
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-left space-y-2">
                  {l.features.map((f, i) => (
                    <p key={i} className="text-white/80 text-sm">{f}</p>
                  ))}
                </div>

              {/* CTA */}
              <button
                onClick={handleActivateTrial}
                disabled={saving}
                className="w-full py-5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-black text-lg shadow-2xl shadow-teal-500/40 active:scale-95 transition-transform disabled:opacity-70">
                {saving ? l.entering : l.cta}
              </button>

              {/* Power Plan Option */}
              <button
                onClick={handleActivateTrial}
                disabled={saving}
                className="w-full py-3 rounded-2xl border-2 border-amber-400/40 bg-amber-500/10 text-amber-300 font-bold text-sm hover:border-amber-400/60 active:scale-95 transition-all relative">
                <span className="absolute -top-2 right-3 bg-amber-400 text-slate-900 text-xs font-black px-2 py-0.5 rounded-full">∞</span>
                {l.power_label} — {l.power_price}
              </button>

              <p className="text-white/30 text-xs">{l.trial_sub}</p>

              <button
                onClick={handleActivateTrial}
                disabled={saving}
                className="text-white/40 text-xs underline underline-offset-2 active:opacity-60">
                {l.restore}
              </button>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}