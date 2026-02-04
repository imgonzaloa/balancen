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
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
            <Scale size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Peso actual</p>
            {totalChange !== null && (
              <p className="text-xs text-slate-400">
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
              className="w-20 text-right text-2xl font-bold text-purple-600 bg-transparent border-b-2 border-purple-200 focus:border-purple-500 outline-none"
            />
            <span className="text-slate-500 font-medium">kg</span>
          </div>
        )}
      </div>

      {!showInput && currentWeight && (
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">
              {currentWeight.toFixed(1)}
            </span>
            <span className="text-sm text-slate-500">kg</span>
          </div>
        </div>
      )}

      {!showInput && !currentWeight && (
        <div className="text-center py-2">
          <p className="text-sm text-slate-400">No registrado hoy</p>
        </div>
      )}

      {/* Weight Change Indicator */}
      {weightChange !== null && Math.abs(weightChange) >= 0.1 && (
        <motion.div 
          className={`mt-3 flex items-center gap-2 px-3 py-2 rounded-xl ${
            trend === "down" 
              ? "bg-emerald-50 text-emerald-700" 
              : trend === "up"
              ? "bg-amber-50 text-amber-700"
              : "bg-slate-50 text-slate-600"
          }`}
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {trend === "down" && <TrendingDown size={16} />}
          {trend === "up" && <TrendingUp size={16} />}
          {trend === "stable" && <Minus size={16} />}
          <span className="text-sm font-medium">
            {weightChange > 0 ? "+" : ""}{weightChange.toFixed(1)} kg vs ayer
          </span>
        </motion.div>
      )}
    </div>
  );
}