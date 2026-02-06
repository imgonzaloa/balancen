import React from "react";
import { motion } from "framer-motion";
import { Flame, TrendingDown } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function CaloriesSummary({ consumed, goal, todayMeals, profile }) {
  const { t } = useTranslation();
  const remaining = Math.max(0, goal - consumed);
  const percentage = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0;
  const isExceeded = consumed > goal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-white">{t("today_calories") || "Today's Calories"}</h3>
        <Flame size={20} className="text-orange-400" />
      </div>

      {/* Main Display */}
      <div className="space-y-3">
        {/* Progress Bar */}
        <div className="relative h-3 rounded-full bg-white/10 overflow-hidden border border-white/20">
          <motion.div
            className={`h-full rounded-full transition-all duration-500 ${
              isExceeded
                ? "bg-gradient-to-r from-red-500 to-orange-500"
                : "bg-gradient-to-r from-emerald-400 to-teal-500"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>

        {/* Numbers */}
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-white/60 mb-1">{t("consumed") || "Consumed"}</p>
            <p className="text-3xl font-bold text-white">{Math.round(consumed)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-white/60 mb-1">{t("goal") || "Goal"}</p>
            <p className="text-xl font-semibold text-teal-300">{goal}</p>
          </div>
        </div>

        {/* Remaining or Exceeded */}
        <div className={`py-3 px-4 rounded-xl text-center font-semibold ${
          isExceeded
            ? "bg-red-500/20 border border-red-500/50 text-red-300"
            : "bg-emerald-500/20 border border-emerald-500/50 text-emerald-300"
        }`}>
          {isExceeded ? (
            <>
              <p className="text-sm">⚠️ {t("goal_exceeded") || "Goal exceeded"}</p>
              <p className="text-lg font-bold mt-1">+{Math.round(consumed - goal)} kcal</p>
            </>
          ) : (
            <>
              <p className="text-sm flex items-center justify-center gap-2">
                <TrendingDown size={16} />
                {t("remaining") || "Remaining"}
              </p>
              <p className="text-lg font-bold mt-1">{Math.round(remaining)} kcal</p>
            </>
          )}
        </div>
      </div>

      {/* Last Meal */}
      {todayMeals && todayMeals.length > 0 && (
        <div className="pt-3 border-t border-white/10">
          <p className="text-xs text-white/60 mb-2">{t("last_meal") || "Last meal"}</p>
          <div className="flex items-center justify-between bg-white/5 rounded-xl p-3">
            <div>
              <p className="text-white font-medium text-sm">{Math.round(todayMeals[0].estimated_calories)} kcal</p>
              <p className="text-xs text-white/60">{todayMeals[0].meal_time}</p>
            </div>
            {todayMeals[0].photo_url && (
              <img src={todayMeals[0].photo_url} alt="Last meal" className="w-12 h-12 rounded-lg object-cover" />
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}