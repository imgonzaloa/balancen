import React from "react";
import { motion } from "framer-motion";
import { TrendingDown } from "lucide-react";

export default function DailyCalorieDisplay({ consumed, remaining, goal }) {
  const percentage = goal ? (consumed / goal) * 100 : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-800 to-slate-900 border border-white/20 shadow-2xl mb-6"
    >
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-orange-500/20 to-teal-500/20 rounded-full blur-2xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Today's Nutrition</h3>
          <div className="flex items-center gap-2 text-teal-300">
            <TrendingDown size={16} />
            <span className="text-sm font-medium">{Math.max(0, remaining)} kcal left</span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="w-full h-3 rounded-full bg-white/10 border border-white/20 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${Math.min(percentage, 100)}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className={`h-full rounded-full ${
                percentage > 100
                  ? "bg-gradient-to-r from-red-500 to-orange-500"
                  : "bg-gradient-to-r from-teal-500 to-emerald-500"
              }`}
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-white/60 text-xs mb-1">Consumed</p>
            <p className="text-2xl font-bold text-orange-300">{consumed}</p>
            <p className="text-white/40 text-xs">kcal</p>
          </div>
          <div>
            <p className="text-white/60 text-xs mb-1">Daily Goal</p>
            <p className="text-2xl font-bold text-teal-300">{goal || "Not set"}</p>
            <p className="text-white/40 text-xs">kcal</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}