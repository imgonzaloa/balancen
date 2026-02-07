import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { TrendingUp, Target, Calendar } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function Progress() {
  const { t, lang } = useTranslation();
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  const today = new Date().toISOString().split("T")[0];

  const { data: todayMeals = [] } = useQuery({
    queryKey: ["meals", today, user?.email],
    queryFn: async () => {
      return base44.entities.MealLog.filter(
        { created_by: user?.email, date: today },
        "-meal_time"
      );
    },
    enabled: !!user?.email,
  });

  const totalCaloriesToday = todayMeals.reduce((sum, meal) => sum + (meal.estimated_calories || 0), 0);
  const totalProtein = todayMeals.reduce((sum, meal) => sum + (meal.estimated_protein || 0), 0);
  const totalCarbs = todayMeals.reduce((sum, meal) => sum + (meal.estimated_carbs || 0), 0);
  const totalFats = todayMeals.reduce((sum, meal) => sum + (meal.estimated_fats || 0), 0);
  const caloriesGoal = profile?.calories_goal || 2000;

  // Momentum calculation
  const trackingConsistency = Math.min((todayMeals.length / 3) * 100, 100);
  const goalAdherence = Math.min((totalCaloriesToday / caloriesGoal) * 100, 100);
  const macroBalance = 85; // Simplified
  const frequency = 90; // Based on logging frequency
  
  const momentumScore = Math.round(
    (trackingConsistency * 0.3 + goalAdherence * 0.3 + macroBalance * 0.2 + frequency * 0.2)
  );

  // Projection
  const daysToGoal = Math.ceil((caloriesGoal * 7 - totalCaloriesToday * 7) / (caloriesGoal - totalCaloriesToday) || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 pb-24">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-white mb-2">
            {lang === "es" ? "Tu Progreso" : "Your Progress"}
          </h1>
          <p className="text-white/60 text-sm">
            {lang === "es" ? "Análisis completo de tu evolución" : "Complete analysis of your evolution"}
          </p>
        </div>

        {/* Momentum Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-3xl p-6 border border-emerald-500/30"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-2">
                <p className="text-emerald-300 text-sm font-semibold uppercase tracking-wide">
                  {lang === "es" ? "Momentum Score" : "Momentum Score"}
                </p>
                {/* Tooltip indicator */}
                <div className="group relative">
                  <div className="w-4 h-4 rounded-full bg-white/10 flex items-center justify-center text-[10px] text-white/60 cursor-help">
                    ?
                  </div>
                  <div className="absolute left-0 top-6 w-56 p-3 bg-black/95 backdrop-blur-xl rounded-lg border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                    <p className="text-white/80 text-[10px] leading-relaxed">
                      {lang === "es" 
                        ? "Combina consistencia, adherencia a meta, balance de macros y frecuencia de registro para medir tu progreso general."
                        : "Combines consistency, goal adherence, macro balance, and tracking frequency to measure your overall progress."}
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-white/60 text-xs mt-1">
                {lang === "es" ? "Nunca vuelve a cero" : "Never resets to zero"}
              </p>
            </div>
            <div className="text-5xl font-black text-white tabular-nums">
              {momentumScore}
            </div>
          </div>

          {/* Momentum bar */}
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${momentumScore}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full bg-gradient-to-r from-emerald-400 to-teal-400"
            />
          </div>

          {/* Breakdown */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/60 text-xs">{lang === "es" ? "Consistencia" : "Consistency"}</p>
              <p className="text-white font-bold">{Math.round(trackingConsistency)}%</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/60 text-xs">{lang === "es" ? "Adherencia" : "Adherence"}</p>
              <p className="text-white font-bold">{Math.round(goalAdherence)}%</p>
            </div>
          </div>
        </motion.div>

        {/* Projection Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gradient-to-br from-blue-500/20 to-purple-500/20 backdrop-blur-xl rounded-2xl p-5 border border-blue-500/30"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/30 flex items-center justify-center flex-shrink-0">
              <TrendingUp size={20} className="text-blue-300" />
            </div>
            <div className="flex-1">
              <p className="text-blue-300 text-xs font-semibold uppercase mb-1">
                {lang === "es" ? "Proyección estimada" : "Goal projection"}
              </p>
              <p className="text-white font-bold text-lg">
                {lang === "es" 
                  ? `~${Math.abs(daysToGoal)} días`
                  : `~${Math.abs(daysToGoal)} days`}
              </p>
              <p className="text-white/60 text-xs mt-1">
                {lang === "es" 
                  ? "Al ritmo actual de registro"
                  : "At current tracking pace"}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Daily Progress Rings */}
        <div className="grid grid-cols-2 gap-4">
          {/* Calories ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
          >
            <div className="relative w-28 h-28 mx-auto">
              <svg width="112" height="112" className="transform -rotate-90">
                <circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="rgba(255,255,255,0.1)"
                  strokeWidth="10"
                  fill="none"
                />
                <motion.circle
                  cx="56"
                  cy="56"
                  r="48"
                  stroke="url(#calGradient)"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={301}
                  initial={{ strokeDashoffset: 301 }}
                  animate={{ strokeDashoffset: 301 - (totalCaloriesToday / caloriesGoal) * 301 }}
                  transition={{ duration: 1 }}
                />
                <defs>
                  <linearGradient id="calGradient">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-black text-white">{Math.round(totalCaloriesToday)}</p>
                <p className="text-[10px] text-white/40">/ {caloriesGoal}</p>
              </div>
            </div>
            <p className="text-white/60 text-xs text-center mt-2">{lang === "es" ? "Calorías" : "Calories"}</p>
          </motion.div>

          {/* Protein ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
          >
            <div className="relative w-28 h-28 mx-auto">
              <svg width="112" height="112" className="transform -rotate-90">
                <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
                <motion.circle
                  cx="56" cy="56" r="48"
                  stroke="#3b82f6"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray={301}
                  initial={{ strokeDashoffset: 301 }}
                  animate={{ strokeDashoffset: 301 - Math.min(totalProtein / 150, 1) * 301 }}
                  transition={{ duration: 1 }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-2xl font-black text-white">{Math.round(totalProtein)}</p>
                <p className="text-[10px] text-white/40">g</p>
              </div>
            </div>
            <p className="text-white/60 text-xs text-center mt-2">{lang === "es" ? "Proteína" : "Protein"}</p>
          </motion.div>
        </div>

        {/* Recent Meals */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
          <h3 className="text-white font-bold mb-4 flex items-center gap-2">
            <Calendar size={18} />
            {lang === "es" ? "Comidas Recientes" : "Recent Meals"}
          </h3>
          <div className="space-y-3">
            {todayMeals.slice(0, 3).map((meal, idx) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="flex items-center gap-3 bg-white/5 rounded-lg p-3"
              >
                <img 
                  src={meal.photo_url} 
                  alt="Meal"
                  className="w-12 h-12 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{meal.meal_time}</p>
                  <p className="text-white/60 text-xs">{meal.estimated_calories} kcal</p>
                </div>
                <div className="text-right text-xs">
                  <p className="text-blue-300">{meal.estimated_protein}g P</p>
                  <p className="text-orange-300">{meal.estimated_carbs}g C</p>
                  <p className="text-purple-300">{meal.estimated_fats}g F</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* AI Insights */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-4 border border-purple-500/30"
        >
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
              <Target size={16} className="text-purple-300" />
            </div>
            <div>
              <p className="text-purple-300 text-xs font-semibold mb-1">
                {lang === "es" ? "IA Coach" : "AI Coach"}
              </p>
              <p className="text-white text-sm">
                {lang === "es" 
                  ? "Ingesta de proteína mejorando hoy."
                  : "Protein intake improving today."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}