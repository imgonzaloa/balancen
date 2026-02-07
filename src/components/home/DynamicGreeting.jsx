import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Target, TrendingUp } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function DynamicGreeting({ profile, todayMeals, caloriesGoal }) {
  const { lang } = useTranslation();
  
  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0);
  const totalProtein = todayMeals.reduce((sum, m) => sum + (m.estimated_protein || 0), 0);
  const remaining = caloriesGoal - totalCalories;
  
  const proteinGoal = Math.round(profile?.weight ? profile.weight * 2 : 150);
  const proteinRemaining = proteinGoal - totalProtein;
  
  // Dynamic greeting based on progress
  let greeting, subtext, icon;
  
  if (totalCalories === 0) {
    greeting = lang === "es" ? `¡Hola ${profile?.display_name}!` : `Hi ${profile?.display_name}!`;
    subtext = lang === "es" ? "Comencemos el día" : "Let's start the day";
    icon = Sparkles;
  } else if (remaining > 0 && remaining < 300) {
    greeting = lang === "es" ? "¡Casi listo!" : "Almost there!";
    subtext = lang === "es" 
      ? `Solo ${remaining} kcal para tu objetivo`
      : `Just ${remaining} kcal to your goal`;
    icon = Target;
  } else if (proteinRemaining > 0 && proteinRemaining < 50) {
    greeting = lang === "es" ? "¡Excelente!" : "Excellent!";
    subtext = lang === "es"
      ? `${proteinRemaining}g de proteína para tu objetivo`
      : `${proteinRemaining}g protein to your goal`;
    icon = TrendingUp;
  } else if (remaining <= 0) {
    greeting = lang === "es" ? "¡Objetivo logrado!" : "Goal achieved!";
    subtext = lang === "es" ? "Día perfecto 🔥" : "Perfect day 🔥";
    icon = Sparkles;
  } else {
    greeting = lang === "es" ? `¡Hola ${profile?.display_name}!` : `Hi ${profile?.display_name}!`;
    subtext = lang === "es" ? "Vamos paso a paso" : "One step at a time";
    icon = Sparkles;
  }
  
  const Icon = icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center mb-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: "spring" }}
        className="w-12 h-12 bg-gradient-to-br from-teal-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-3"
      >
        <Icon size={24} className="text-white" />
      </motion.div>
      <h1 className="text-3xl font-black text-white mb-1">
        {greeting}
      </h1>
      <p className="text-teal-200 text-sm font-medium">
        {subtext}
      </p>
    </motion.div>
  );
}