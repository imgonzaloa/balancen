import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, TrendingUp, AlertCircle } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { Button } from "@/components/ui/button";

export default function AIInsightClickable({ todayMeals, profile, caloriesGoal }) {
  const { lang } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  
  const totalProtein = todayMeals.reduce((sum, m) => sum + (m.estimated_protein || 0), 0);
  const totalCalories = todayMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0);
  
  const proteinGoal = Math.round(profile?.weight ? profile.weight * 2 : 150);
  const proteinGap = proteinGoal - totalProtein;
  
  let insight, details, type;
  
  if (totalProtein < proteinGoal * 0.5 && todayMeals.length > 0) {
    insight = lang === "es" ? "IA: Bajo en proteína hoy" : "AI: Low protein today";
    details = lang === "es" 
      ? `Te faltan ${proteinGap}g de proteína. Intenta agregar pollo, huevos o yogurt griego.`
      : `You're ${proteinGap}g short on protein. Try adding chicken, eggs, or Greek yogurt.`;
    type = "warning";
  } else if (totalCalories > caloriesGoal * 1.2) {
    insight = lang === "es" ? "IA: Sobre tu objetivo calórico" : "AI: Over calorie goal";
    details = lang === "es"
      ? "Considera porciones más pequeñas o opciones más ligeras para la cena."
      : "Consider smaller portions or lighter options for dinner.";
    type = "warning";
  } else if (totalProtein >= proteinGoal) {
    insight = lang === "es" ? "IA: Excelente ingesta de proteína" : "AI: Excellent protein intake";
    details = lang === "es"
      ? "Estás alcanzando tus objetivos de proteína. ¡Sigue así!"
      : "You're hitting your protein goals. Keep it up!";
    type = "success";
  } else {
    return null;
  }
  
  return (
    <>
      <motion.button
        onClick={() => setShowDetails(true)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        className={`w-full bg-gradient-to-r ${
          type === "warning" 
            ? "from-amber-500/20 to-orange-500/20 border-amber-500/30" 
            : "from-emerald-500/20 to-teal-500/20 border-emerald-500/30"
        } backdrop-blur-xl rounded-2xl p-4 border text-left`}
      >
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-full ${
            type === "warning" ? "bg-amber-500/30" : "bg-emerald-500/30"
          } flex items-center justify-center`}>
            {type === "warning" ? (
              <AlertCircle size={20} className="text-amber-300" />
            ) : (
              <Sparkles size={20} className="text-emerald-300" />
            )}
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">{insight}</p>
            <p className="text-white/60 text-xs">
              {lang === "es" ? "Toca para ver detalles" : "Tap for details"}
            </p>
          </div>
          <TrendingUp size={16} className="text-white/40" />
        </div>
      </motion.button>
      
      <AnimatePresence>
        {showDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-x-4 top-1/2 -translate-y-1/2 max-w-md mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/20 shadow-2xl z-50 p-6"
            >
              <button
                onClick={() => setShowDetails(false)}
                className="absolute top-4 right-4 text-white/70 hover:text-white"
              >
                <X size={24} />
              </button>
              
              <div className="space-y-4">
                <div className={`w-16 h-16 rounded-2xl ${
                  type === "warning" ? "bg-amber-500/20" : "bg-emerald-500/20"
                } flex items-center justify-center mb-4`}>
                  {type === "warning" ? (
                    <AlertCircle size={32} className="text-amber-400" />
                  ) : (
                    <Sparkles size={32} className="text-emerald-400" />
                  )}
                </div>
                
                <h3 className="text-white font-bold text-xl">{insight}</h3>
                <p className="text-white/70">{details}</p>
                
                <Button
                  onClick={() => setShowDetails(false)}
                  className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
                >
                  {lang === "es" ? "Entendido" : "Got it"}
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}