import React from "react";
import { motion } from "framer-motion";
import { Footprints, TrendingUp } from "lucide-react";

export default function StepsCounter({ steps = 0, goal = 8000, showInput = false, onChange }) {
  const progress = Math.min((steps / goal) * 100, 100);
  const remaining = Math.max(goal - steps, 0);
  
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
            <Footprints size={20} className="text-teal-600" />
          </div>
          <div>
            <p className="text-sm text-slate-500">Pasos hoy</p>
            <p className="text-xs text-slate-400">Meta: {goal.toLocaleString()}</p>
          </div>
        </div>
        {showInput && (
          <input
            type="number"
            value={steps || ""}
            onChange={(e) => onChange?.(parseInt(e.target.value) || 0)}
            placeholder="0"
            className="w-24 text-right text-2xl font-bold text-teal-600 bg-transparent border-b-2 border-teal-200 focus:border-teal-500 outline-none"
          />
        )}
      </div>

      {!showInput && (
        <div className="mb-3">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-bold text-slate-800">
              {steps.toLocaleString()}
            </span>
            <span className="text-sm text-slate-500">/ {goal.toLocaleString()}</span>
          </div>
        </div>
      )}

      {/* Progress Bar */}
      <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-teal-400 to-emerald-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>

      {/* Status */}
      <div className="mt-3 flex items-center justify-between text-sm">
        {steps >= goal ? (
          <span className="text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp size={14} />
            ¡Meta alcanzada!
          </span>
        ) : (
          <span className="text-slate-500">
            Faltan {remaining.toLocaleString()} pasos
          </span>
        )}
        <span className="font-medium text-teal-600">{Math.round(progress)}%</span>
      </div>
    </div>
  );
}