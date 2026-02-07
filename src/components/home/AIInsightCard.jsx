import React from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp, TrendingDown, AlertCircle } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

const AIInsightCard = React.memo(function AIInsightCard({ todayMeals, profile, caloriesGoal }) {


  const { t, lang } = useTranslation();
  
  // Calculate macros
  const totalProtein = todayMeals.reduce((sum, m) => sum + (m.estimated_protein || 0), 0);
  const totalCarbs = todayMeals.reduce((sum, m) => sum + (m.estimated_carbs || 0), 0);
  const totalFats = todayMeals.reduce((sum, m) => sum + (m.estimated_fats || 0), 0);
  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0);
  
  // Generate insight
  const getInsight = () => {
    // Check protein
    const proteinTarget = (caloriesGoal * 0.3) / 4; // 30% of calories, 4 cal per gram
    if (totalProtein < proteinTarget * 0.7) {
      const needed = Math.round(proteinTarget - totalProtein);
      return {
        type: "protein_low",
        icon: TrendingDown,
        color: "from-blue-500 to-cyan-500",
        message: lang === "es" 
          ? `Bajo en proteína hoy. Añadí ${needed}g más para mejorar recuperación.`
          : `Low on protein today. Add ${needed}g more to improve recovery.`,
        action: lang === "es" ? "Ver alimentos ricos en proteína" : "View high-protein foods"
      };
    }
    
    // Check if over calories
    if (totalCalories > caloriesGoal * 1.1) {
      const over = Math.round(totalCalories - caloriesGoal);
      return {
        type: "calories_high",
        icon: AlertCircle,
        color: "from-amber-500 to-orange-500",
        message: lang === "es"
          ? `${over} kcal por encima de tu meta. Considerá ajustar la cena.`
          : `${over} kcal over your goal. Consider adjusting dinner.`,
        action: lang === "es" ? "Ajustar meta" : "Adjust goal"
      };
    }
    
    // Check carbs
    const carbsTarget = (caloriesGoal * 0.4) / 4;
    if (totalCarbs < carbsTarget * 0.6) {
      const needed = Math.round(carbsTarget - totalCarbs);
      return {
        type: "carbs_low",
        icon: TrendingDown,
        color: "from-orange-500 to-amber-500",
        message: lang === "es"
          ? `Energía baja. Añadí ${needed}g de carbos para mantener rendimiento.`
          : `Low energy. Add ${needed}g carbs to maintain performance.`,
        action: lang === "es" ? "Ver opciones" : "View options"
      };
    }
    
    // All good - positive reinforcement
    if (todayMeals.length >= 3) {
      return {
        type: "on_track",
        icon: TrendingUp,
        color: "from-emerald-500 to-teal-500",
        message: lang === "es"
          ? "¡Excelente balance nutricional hoy! Seguí así."
          : "Great nutritional balance today! Keep it up.",
        action: lang === "es" ? "Ver progreso" : "View progress"
      };
    }
    
    // Default - encourage logging
    return {
      type: "log_more",
      icon: Sparkles,
      color: "from-purple-500 to-pink-500",
      message: lang === "es"
        ? "Registrá tus comidas para recibir insights personalizados."
        : "Log your meals to receive personalized insights.",
      action: lang === "es" ? "Registrar comida" : "Log meal"
    };
  };
  
  const insight = getInsight();
  const Icon = insight.icon;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative overflow-hidden rounded-2xl p-5 bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-black/60 backdrop-blur-xl border border-white/10 shadow-lg"
    >
      {/* Glow effect */}
      <div className="absolute inset-0 opacity-20">
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${insight.color} rounded-full blur-2xl`} />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-start gap-3 mb-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${insight.color} flex items-center justify-center`}>
            <Icon size={20} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={14} className="text-purple-400" />
              <p className="text-purple-300 text-xs font-semibold uppercase tracking-wide">
                {lang === "es" ? "IA Insight" : "AI Insight"}
              </p>
            </div>
            <p className="text-white text-sm leading-relaxed">
              {insight.message}
            </p>
          </div>
        </div>
        
        {/* Action button */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="w-full mt-3 py-2 px-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-xs font-medium transition-colors"
        >
          {insight.action}
        </motion.button>
      </div>
    </motion.div>
  );
});

export default AIInsightCard;