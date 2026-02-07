import React from "react";
import { motion } from "framer-motion";
import { Camera, Flame } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function LastMealPreview({ meal, onClick }) {
  const { t } = useTranslation();

  if (!meal) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={onClick}
        className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-6 cursor-pointer hover:border-emerald-500/30 transition-all"
      >
        <div className="flex flex-col items-center justify-center text-center py-8">
          <Camera className="text-white/40 mb-3" size={32} />
          <p className="text-white/60 text-sm font-medium">{t("no_meals_today")}</p>
          <p className="text-white/40 text-xs mt-1">{t("tap_to_add_meal")}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-4 overflow-hidden"
    >
      <div className="flex items-center gap-4">
        {/* Meal Image */}
        <div className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
          <img
            src={meal.photo_url}
            alt="Last meal"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>

        {/* Meal Info */}
        <div className="flex-1 min-w-0">
          <p className="text-white/60 text-xs mb-1">{t("last_meal")}</p>
          <div className="flex items-center gap-2 mb-2">
            <Flame className="text-orange-400" size={16} />
            <p className="text-white font-bold text-lg tabular-nums" style={{ fontVariantNumeric: "tabular-nums" }}>
              {meal.estimated_calories || 0}
            </p>
            <span className="text-white/60 text-xs">kcal</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-white/50">
            <span>P: {meal.estimated_protein || 0}g</span>
            <span>C: {meal.estimated_carbs || 0}g</span>
            <span>G: {meal.estimated_fats || 0}g</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}