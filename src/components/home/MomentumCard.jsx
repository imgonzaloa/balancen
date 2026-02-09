import React from "react";
import { TrendingUp, Zap } from "lucide-react";

export default function MomentumCard({ score, consistency, adherence, lang }) {
  const getLevel = (score) => {
    if (score < 20) return lang === "es" ? "Comenzando" : "Starting";
    if (score < 40) return lang === "es" ? "En Marcha" : "Building";
    if (score < 60) return lang === "es" ? "Consistente" : "Consistent";
    if (score < 80) return lang === "es" ? "En Fuego" : "On Fire";
    return lang === "es" ? "Imparable" : "Unstoppable";
  };

  return (
    <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-3xl p-6 border border-emerald-500/30 relative overflow-hidden">
      <div className="absolute -right-10 -top-10 w-32 h-32 bg-emerald-400/10 rounded-full blur-3xl" />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={18} className="text-emerald-300" />
              <p className="text-emerald-300 text-sm font-bold uppercase tracking-wide">
                Momentum Score
              </p>
            </div>
            <p className="text-white/60 text-xs">
              {lang === "es" ? "Nunca vuelve a cero" : "Never resets to zero"}
            </p>
          </div>
          <div className="text-5xl font-black text-white">{score}</div>
        </div>
        
        <div className="h-3 bg-white/10 rounded-full overflow-hidden mb-4">
          <div 
            className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 transition-all duration-1000 ease-out" 
            style={{ width: `${Math.min(score, 100)}%` }} 
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2">
            <p className="text-emerald-300 text-xs font-semibold">{getLevel(score)}</p>
          </div>
          <div className="flex gap-3">
            <div className="text-right">
              <p className="text-white/50 text-[10px] uppercase tracking-wide">{lang === "es" ? "Consistencia" : "Consistency"}</p>
              <p className="text-white font-bold text-sm">{consistency}%</p>
            </div>
            <div className="text-right">
              <p className="text-white/50 text-[10px] uppercase tracking-wide">{lang === "es" ? "Adherencia" : "Adherence"}</p>
              <p className="text-white font-bold text-sm">{adherence}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}