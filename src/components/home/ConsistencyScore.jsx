import React from "react";
import { motion } from "framer-motion";
import { TrendingUp, Star } from "lucide-react";

export default function ConsistencyScore({ score = 0, breakdown }) {
  const getScoreColor = (s) => {
    if (s >= 80) return { gradient: "from-emerald-400 to-green-500", text: "text-emerald-300", bg: "bg-emerald-500/20" };
    if (s >= 60) return { gradient: "from-teal-400 to-cyan-500", text: "text-teal-300", bg: "bg-teal-500/20" };
    if (s >= 40) return { gradient: "from-amber-400 to-orange-500", text: "text-amber-300", bg: "bg-amber-500/20" };
    return { gradient: "from-red-400 to-rose-500", text: "text-red-300", bg: "bg-red-500/20" };
  };

  const colors = getScoreColor(score);

  return (
    <div className="relative overflow-hidden rounded-3xl p-6 bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-gradient-to-br from-teal-400/30 to-emerald-400/30 rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center shadow-lg">
              <Star size={24} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-white text-lg">Consistencia Integral</h4>
              <p className="text-xs text-teal-200">Score de hoy</p>
            </div>
          </div>
          <motion.div
            className="text-5xl font-black bg-gradient-to-r from-white to-teal-100 bg-clip-text text-transparent"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", bounce: 0.5 }}
          >
            {score}
          </motion.div>
        </div>

        {/* Progress Circle */}
        <div className="relative w-full h-3 bg-white/10 rounded-full overflow-hidden mb-4">
          <motion.div
            className={`absolute inset-y-0 left-0 bg-gradient-to-r ${colors.gradient} rounded-full`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </div>

        {/* Breakdown */}
        {breakdown && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {breakdown.movement && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-teal-400" />
                <span className="text-white/80">Movimiento</span>
              </div>
            )}
            {breakdown.nutrition && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="text-white/80">Nutrición</span>
              </div>
            )}
            {breakdown.sleep && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                <span className="text-white/80">Sueño</span>
              </div>
            )}
            {breakdown.hydration && (
              <div className="flex items-center gap-2 text-xs">
                <div className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-white/80">Hidratación</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}