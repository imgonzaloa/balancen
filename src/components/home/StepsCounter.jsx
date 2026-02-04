import React from "react";
import { motion } from "framer-motion";
import { Footprints, TrendingUp } from "lucide-react";

export default function StepsCounter({ steps = 0, goal = 8000, showInput = false, onChange }) {
  const progress = Math.min((steps / goal) * 100, 100);
  const remaining = Math.max(goal - steps, 0);
  
  return (
    <div className="relative overflow-hidden rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-br from-teal-400/30 to-cyan-400/30 rounded-full blur-2xl" />
      <div className="flex items-center justify-between mb-4 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
            <Footprints size={22} className="text-white" />
          </div>
          <div>
            <p className="text-sm text-white font-semibold">Pasos hoy</p>
            <p className="text-xs text-teal-200">Meta: {goal.toLocaleString()}</p>
          </div>
        </div>
        {showInput && (
          <input
            type="number"
            value={steps || ""}
            onChange={(e) => onChange?.(parseInt(e.target.value) || 0)}
            placeholder="0"
            className="w-24 text-right text-2xl font-bold text-white bg-white/10 rounded-xl px-2 border-2 border-white/20 focus:border-teal-300 outline-none backdrop-blur-sm"
          />
        )}
      </div>

      {!showInput && (
        <div className="mb-3 relative z-10">
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-bold bg-gradient-to-r from-white to-teal-100 bg-clip-text text-transparent">
              {steps.toLocaleString()}
            </span>
            <span className="text-sm text-teal-200 font-medium">/ {goal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative h-4 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/20 relative z-10">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-400 via-cyan-400 to-emerald-400 rounded-full shadow-lg"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>

      {/* Status */}
      <div className="mt-3 flex items-center justify-between text-sm relative z-10">
        {steps >= goal ? (
          <span className="text-emerald-300 font-bold flex items-center gap-1">
            <TrendingUp size={16} />
            ¡Meta alcanzada!
          </span>
        ) : (
          <span className="text-teal-200 font-medium">
            Faltan {remaining.toLocaleString()} pasos
          </span>
        )}
        <span className="font-bold text-white text-lg">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}