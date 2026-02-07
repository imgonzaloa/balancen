import React from "react";
import { motion } from "framer-motion";
import { Shield, Info } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function AINutritionConfidence({ todayMeals, profile }) {
  const { t, lang } = useTranslation();
  const [showModal, setShowModal] = React.useState(false);
  
  // Calculate confidence score
  const calculateConfidence = () => {
    let score = 70; // Base score
    
    // +5 for each confirmed meal (has photo + macros)
    const confirmedMeals = todayMeals.filter(m => 
      m.photo_url && m.estimated_protein && m.estimated_carbs && m.estimated_fats
    );
    score += confirmedMeals.length * 5;
    
    // +10 if all 3 daily meals logged
    if (todayMeals.length >= 3) score += 10;
    
    // +5 if user has weight data
    if (profile?.weight) score += 5;
    
    // Cap at 99%
    return Math.min(score, 99);
  };
  
  const confidence = calculateConfidence();
  const circumference = 2 * Math.PI * 20;
  const strokeDashoffset = circumference - (confidence / 100) * circumference;
  
  return (
    <>
      <motion.button
        onClick={() => setShowModal(true)}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        transition={{ delay: 0.2 }}
        className="w-full bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-black/60 backdrop-blur-xl rounded-2xl p-4 border border-white/10 shadow-lg cursor-pointer"
      >
        <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Confidence ring */}
          <div className="relative w-12 h-12">
            <svg width="48" height="48" className="transform -rotate-90">
              <circle
                cx="24"
                cy="24"
                r="20"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="4"
                fill="none"
              />
              <motion.circle
                cx="24"
                cy="24"
                r="20"
                stroke={confidence >= 90 ? "#10b981" : confidence >= 75 ? "#fbbf24" : "#f59e0b"}
                strokeWidth="4"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 1, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <Shield size={16} className={`${
                confidence >= 90 ? "text-emerald-400" : 
                confidence >= 75 ? "text-amber-400" : 
                "text-orange-400"
              }`} />
            </div>
          </div>
          
          <div>
            <p className="text-white/60 text-xs">
              {t("estimated_accuracy")}
            </p>
            <p className="text-white text-xl font-black tabular-nums">
              {confidence}%
            </p>
          </div>
        </div>
        
        {/* Tap indicator */}
        <div className="text-white/40">
          <Info size={18} />
        </div>
      </div>
      
      {/* Progress hint */}
      {confidence < 90 && todayMeals.length < 3 && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <p className="text-white/50 text-xs">
            {lang === "es" 
              ? `+${90 - confidence}% ${t("by_logging")} ${3 - todayMeals.length} ${3 - todayMeals.length > 1 ? t("more_meals") : t("more_meal")}`
              : `+${90 - confidence}% ${t("by_logging")} ${3 - todayMeals.length} ${3 - todayMeals.length > 1 ? t("more_meals") : t("more_meal")}`}
          </p>
        </div>
      )}
      </motion.button>
      
      {/* Explanation Modal */}
      {showModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowModal(false)}
          className="fixed inset-0 z-[9999] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-slate-800 via-slate-900 to-black rounded-3xl p-6 max-w-md w-full border border-white/20 shadow-2xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Shield size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-white text-xl font-bold">
                  {lang === "es" ? "Precisión del Análisis" : "Analysis Accuracy"}
                </h3>
                <p className="text-white/60 text-sm">
                  {lang === "es" ? "Cómo funciona" : "How it works"}
                </p>
              </div>
            </div>
            
            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-emerald-400 text-sm">✓</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm mb-1">
                    {lang === "es" ? "Visión AI" : "AI Vision"}
                  </p>
                  <p className="text-white/60 text-xs leading-relaxed">
                    {lang === "es" 
                      ? "Analizamos tu foto usando inteligencia artificial entrenada en millones de alimentos."
                      : "We analyze your photo using AI trained on millions of food items."}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-blue-400 text-sm">✓</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm mb-1">
                    {lang === "es" ? "Base Nutricional" : "Nutrition Database"}
                  </p>
                  <p className="text-white/60 text-xs leading-relaxed">
                    {lang === "es"
                      ? "Comparamos con bases de datos validadas (USDA, locales) para estimar calorías y macros."
                      : "We compare against validated databases (USDA, local) to estimate calories and macros."}
                  </p>
                </div>
              </div>
              
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-purple-400 text-sm">✓</span>
                </div>
                <div>
                  <p className="text-white font-medium text-sm mb-1">
                    {lang === "es" ? "Ajuste Manual" : "Manual Adjustment"}
                  </p>
                  <p className="text-white/60 text-xs leading-relaxed">
                    {lang === "es"
                      ? "Podés ajustar porciones y confirmar alimentos para mejorar precisión en futuros análisis."
                      : "You can adjust portions and confirm foods to improve accuracy in future analyses."}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 mb-6">
              <p className="text-white/80 text-xs leading-relaxed">
                {lang === "es"
                  ? "💡 La precisión aumenta cuando registrás todas tus comidas y confirmás las porciones."
                  : "💡 Accuracy increases when you log all meals and confirm portions."}
              </p>
            </div>
            
            <button
              onClick={() => setShowModal(false)}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold"
            >
              {lang === "es" ? "Entendido" : "Got it"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </>
  );
}