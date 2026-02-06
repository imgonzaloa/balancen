import React from "react";
import { motion } from "framer-motion";
import { Flame, AlertCircle, CheckCircle2 } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function DailyCalorieGoal({ consumed, goal }) {
  const { t } = useTranslation();
  const remaining = Math.max(0, goal - consumed);
  const percentage = goal > 0 ? Math.min(100, (consumed / goal) * 100) : 0;
  const isExceeded = consumed > goal;
  const isComplete = consumed >= goal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-teal-500/20 to-emerald-500/10 backdrop-blur-xl border border-teal-500/30 rounded-3xl p-6 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-white">{t("today_calories") || "Today's Calories"}</h3>
        <div className={`p-2 rounded-xl ${isExceeded ? "bg-red-500/20" : "bg-teal-500/20"}`}>
          {isExceeded ? (
            <AlertCircle className="text-red-400" size={20} />
          ) : isComplete ? (
            <CheckCircle2 className="text-emerald-400" size={20} />
          ) : (
            <Flame className="text-orange-400" size={20} />
          )}
        </div>
      </div>

      {/* Main metrics */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/10 rounded-2xl p-4 text-center">
          <p className="text-xs text-white/60 mb-2">{t("consumed") || "Consumed"}</p>
          <p className="text-3xl font-bold text-white">{Math.round(consumed)}</p>
          <p className="text-xs text-white/40 mt-1">kcal</p>
        </div>
        <div className="bg-white/10 rounded-2xl p-4 text-center">
          <p className="text-xs text-white/60 mb-2">{t("remaining") || "Remaining"}</p>
          <p className={`text-3xl font-bold ${isExceeded ? "text-red-400" : "text-emerald-400"}`}>
            {Math.round(remaining)}
          </p>
          <p className="text-xs text-white/40 mt-1">kcal</p>
        </div>
        <div className="bg-white/10 rounded-2xl p-4 text-center">
          <p className="text-xs text-white/60 mb-2">{t("goal") || "Goal"}</p>
          <p className="text-3xl font-bold text-white">{goal}</p>
          <p className="text-xs text-white/40 mt-1">kcal</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <div className="relative h-4 rounded-full bg-white/10 overflow-hidden border border-white/20">
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
        <div className="flex justify-between items-center text-xs">
          <span className="text-white/60">{percentage.toFixed(0)}%</span>
          {isExceeded && (
            <span className="text-red-400 font-semibold">
              +{Math.round(consumed - goal)} over goal
            </span>
          )}
        </div>
      </div>

      {/* Status message */}
      {!isExceeded && !isComplete && (
        <p className="text-sm text-emerald-300 text-center font-medium">
          🎯 Keep going! {Math.round(remaining)} kcal left
        </p>
      )}
      {isComplete && !isExceeded && (
        <p className="text-sm text-emerald-300 text-center font-medium">
          ✨ Goal reached! Perfect balance today
        </p>
      )}
      {isExceeded && (
        <p className="text-sm text-red-300 text-center font-medium">
          ⚠️ Goal exceeded. Back on track tomorrow!
        </p>
      )}
    </motion.div>
  );
}