import React from "react";
import { motion } from "framer-motion";
import { useTranslation } from "@/components/TranslationProvider";

// Memoize to prevent unnecessary rerenders
const DailyMacroRing = React.memo(function DailyMacroRing({ consumed, goal, protein = 0, carbs = 0, fats = 0 }) {


  const { t, lang } = useTranslation();
  
  const percentage = Math.min((consumed / goal) * 100, 100);
  const circumference = 2 * Math.PI * 70;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const macros = [
    { label: t("protein"), value: protein, color: "text-blue-400", bg: "from-blue-500/20" },
    { label: t("carbs"), value: carbs, color: "text-orange-400", bg: "from-orange-500/20" },
    { label: t("fats"), value: fats, color: "text-purple-400", bg: "from-purple-500/20" }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.005 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className="relative bg-gradient-to-br from-slate-800/60 via-slate-900/60 to-black/60 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-xl overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-teal-500/5 pointer-events-none" />
      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-3xl" />
      <div className="relative z-10 flex items-center gap-6">
        {/* Progress ring */}
        <div className="relative">
          <svg width="160" height="160" className="transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r="70"
              stroke="rgba(255, 255, 255, 0.1)"
              strokeWidth="12"
              fill="none"
            />
            
            {/* Progress circle */}
            <motion.circle
              cx="80"
              cy="80"
              r="70"
              stroke="url(#gradient)"
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 1.5, ease: "easeOut" }}
            />
            
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#10b981" />
                <stop offset="100%" stopColor="#14b8a6" />
              </linearGradient>
            </defs>
          </svg>

          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.p 
              key={consumed}
              initial={{ scale: 1.2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-3xl font-black text-white tabular-nums relative"
            >
              <span className="relative z-10">{Math.round(consumed)}</span>
              <div className="absolute inset-0 blur-lg bg-emerald-400/20 scale-150" />
            </motion.p>
            <p className="text-xs text-white/40 mb-1">
              {t("goal_text") || (lang === "es" ? "de" : "of")} {goal}
            </p>
            <p className="text-[10px] text-white/30 uppercase tracking-wide">kcal</p>
          </div>
        </div>

        {/* Macros breakdown */}
        <div className="flex-1 space-y-3">
          {macros.map((macro, idx) => (
            <div key={idx} className={`bg-gradient-to-r ${macro.bg} to-transparent rounded-xl p-3 border border-white/5`}>
              <div className="flex justify-between items-center">
                <span className="text-xs text-white/60 font-medium">{macro.label}</span>
                <span className={`text-sm font-bold ${macro.color} tabular-nums`}>
                  {Math.round(macro.value)}g
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
});

export default DailyMacroRing;