import React from "react";
import { motion } from "framer-motion";
import { Shield, Info } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function AINutritionConfidence({ todayMeals, profile }) {
  const { t, lang } = useTranslation();
  
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
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
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
        
        {/* Info tooltip */}
        <div className="group relative">
          <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors">
            <Info size={14} className="text-white/60" />
          </button>
          <div className="absolute right-0 top-10 w-64 p-3 bg-black/95 backdrop-blur-xl rounded-lg border border-white/20 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-20">
            <p className="text-white/80 text-xs leading-relaxed">
              {t("increase_accuracy")}
            </p>
          </div>
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
    </motion.div>
  );
}