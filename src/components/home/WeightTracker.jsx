import React from "react";
import { motion } from "framer-motion";
import { Scale, TrendingDown, TrendingUp, Minus } from "lucide-react";

export default function WeightTracker({ 
  currentWeight, 
  previousWeight, 
  startingWeight,
  showInput = false, 
  onChange 
}) {
  const weightChange = currentWeight && previousWeight 
    ? currentWeight - previousWeight 
    : null;
  
  const totalChange = currentWeight && startingWeight
    ? currentWeight - startingWeight
    : null;

  const getTrend = (change) => {
    if (!change || Math.abs(change) < 0.1) return "stable";
    return change < 0 ? "down" : "up";
  };

  const trend = getTrend(weightChange);
  
  return (
    <div className="relative overflow-hidden rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-2xl" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center shadow-lg">
            <Scale size={22} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-white font-semibold">Peso actual</p>
            {totalChange !== null && (
              <p className="text-xs text-purple-200">
                {totalChange > 0 ? "+" : ""}{totalChange.toFixed(1)} kg desde inicio
              </p>
            )}
          </div>
        </div>
        {showInput && (
          <div className="flex items-center gap-2">
            <input
              type="number"
              step="0.1"
              value={currentWeight || ""}
              onChange={(e) => onChange?.(parseFloat(e.target.value) || null)}
              placeholder="0.0"
              className="w-20 text-right text-2xl font-bold text-white bg-white/10 rounded-xl px-2 border-2 border-white/20 focus:border-purple-300 outline-none backdrop-blur-sm"
            />
            <span className="text-white font-medium">kg</span>
          </div>
        )}
      </div>

      {!showInput && currentWeight && (
        <div className="mb-3 relative z-10">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold bg-gradient-to-r from-white to-purple-100 bg-clip-text text-transparent">
              {currentWeight.toFixed(1)}
            </span>
            <span className="text-sm text-purple-200 font-medium">kg</span>
          </div>
        </div>
      )}

      {!showInput && !currentWeight && (
        <div className="text-center py-2 relative z-10">
          <p className="text-sm text-purple-200">No registrado hoy</p>
        </div>
      )}

      {/* Weight Change Indicator */}
      {weightChange !== null && Math.abs(weightChange) >= 0.1 && (
        <motion.div 
          className={`mt-3 flex items-center gap-2 px-4 py-2.5 rounded-2xl relative z-10 ${
            trend === "down" 
              ? "bg-emerald-500/20 text-emerald-200 border border-emerald-400/30" 
              : trend === "up"
              ? "bg-amber-500/20 text-amber-200 border border-amber-400/30"
              : "bg-white/10 text-white border border-white/20"
          }`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {trend === "down" && <TrendingDown size={18} />}
          {trend === "up" && <TrendingUp size={18} />}
          {trend === "stable" && <Minus size={18} />}
          <span className="text-sm font-bold">
            {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)} kg vs ayer
          </span>
        </motion.div>
      )}
    </div>
  );
}