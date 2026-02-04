import React from "react";
import { motion } from "framer-motion";
import { Flame, TrendingDown } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function CalorieGoalCard({ totalCalories, caloriesGoal }) {
  const { t } = useTranslation();
  
  if (!caloriesGoal) return null;
  
  const remaining = caloriesGoal - totalCalories;
  const progress = Math.min((totalCalories / caloriesGoal) * 100, 100);
  const goalMet = totalCalories <= caloriesGoal;
  
  return (
    <div className="relative overflow-hidden rounded-2xl p-4 bg-white/5 backdrop-blur-sm border border-white/10">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Flame size={16} className="text-orange-300" />
          <span className="text-sm text-white font-medium">{t("calories_goal")}</span>
        </div>
        <span className="text-xs text-white/60">{caloriesGoal} kcal</span>
      </div>
      
      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full ${
            goalMet ? "bg-gradient-to-r from-emerald-400 to-teal-400" : "bg-gradient-to-r from-orange-400 to-red-400"
          }`}
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
      
      <div className="flex items-center justify-between mt-2">
        {goalMet ? (
          <span className="text-xs text-emerald-300 font-medium flex items-center gap-1">
            <TrendingDown size={14} />
            Under goal!
          </span>
        ) : (
          <span className="text-xs text-orange-200 font-medium">
            {Math.abs(remaining)} kcal over
          </span>
        )}
        <span className="text-xs text-white/80 font-bold">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}