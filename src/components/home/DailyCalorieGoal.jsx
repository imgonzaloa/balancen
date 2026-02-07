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
         <h3 className="text-lg font-bold text-white">{t("today_calories")}</h3>
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
        <div className="bg-white/10 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[140px]">
            <p className="text-xs text-white/60 mb-3 font-semibold">{t("consumed")}</p>
            <p className="text-4xl font-bold text-white leading-none mb-2 tabular-nums" style={{ fontVariantNumeric: "tabular-nums" }}>{Math.round(consumed)}</p>
            <p className="text-xs text-white/40">kcal</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[140px]">
            <p className="text-xs text-white/60 mb-3 font-semibold">{t("remaining")}</p>
            <motion.p 
              key={remaining}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className={`text-4xl font-bold leading-none mb-2 tabular-nums ${isExceeded ? "text-red-400" : "text-emerald-400"}`} 
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {Math.round(remaining)}
            </motion.p>
            <p className="text-xs text-white/40">kcal</p>
          </div>
          <div className="bg-white/10 rounded-2xl p-5 flex flex-col items-center justify-center min-h-[140px]">
            <p className="text-xs text-white/60 mb-3 font-semibold">{t("goal")}</p>
            <p className="text-4xl font-bold text-white leading-none mb-2 tabular-nums" style={{ fontVariantNumeric: "tabular-nums" }}>{goal}</p>
            <p className="text-xs text-white/40">kcal</p>
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
              +{Math.round(consumed - goal)} {t("over_goal")}
            </span>
          )}
          </div>
          </div>

          {/* Motivational micro-copy */}
          <motion.div
            key={isComplete ? "complete" : isExceeded ? "exceeded" : "ongoing"}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            {!isExceeded && !isComplete && (
              <p className="text-sm text-emerald-300 font-medium">
                🎯 {t("keep_going") || "Keep going"} — {t("building_consistency") || "you're building consistency"}
              </p>
            )}
            {isComplete && !isExceeded && (
              <p className="text-sm text-emerald-300 font-medium">
                ✨ {t("goal_reached_perfect") || "Perfect! Goal reached"}
              </p>
            )}
            {isExceeded && (
              <p className="text-sm text-red-300 font-medium">
                ⚠️ {t("goal_exceeded_back_on_track") || "Over goal — back on track tomorrow"}
              </p>
            )}
          </motion.div>
    </motion.div>
  );
}