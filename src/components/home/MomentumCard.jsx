import React from "react";
import { TrendingUp, Zap, Target } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function MomentumCard({ score, consistency, adherence }) {
  const { lang } = useTranslation();

  const getLevel = () => {
    if (score >= 90) return { text: lang === "es" ? "🔥 En fuego" : "🔥 On fire", color: "from-orange-500 to-red-500" };
    if (score >= 70) return { text: lang === "es" ? "⚡ Acelerando" : "⚡ Accelerating", color: "from-yellow-500 to-orange-500" };
    if (score >= 50) return { text: lang === "es" ? "🎯 Progresando" : "🎯 Progressing", color: "from-teal-500 to-emerald-500" };
    if (score >= 30) return { text: lang === "es" ? "🌱 Creciendo" : "🌱 Growing", color: "from-blue-500 to-teal-500" };
    return { text: lang === "es" ? "🚀 Comenzando" : "🚀 Starting", color: "from-purple-500 to-blue-500" };
  };

  const level = getLevel();

  return (
    <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-3xl p-6 border border-white/10 relative overflow-hidden">
      <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br ${level.color} opacity-20 blur-3xl`} />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/50 text-xs uppercase tracking-wider mb-1">Momentum Score</p>
            <p className="text-white/70 text-xs">{lang === "es" ? "Nunca vuelve a cero" : "Never resets"}</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black text-white">{score}</div>
            <p className={`text-xs font-bold bg-gradient-to-r ${level.color} bg-clip-text text-transparent`}>
              {level.text}
            </p>
          </div>
        </div>

        <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
          <div 
            className={`h-full bg-gradient-to-r ${level.color}`}
            style={{ width: `${score}%`, transition: 'width 1s ease' }}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Target size={14} className="text-teal-300" />
              <p className="text-white/60 text-xs">{lang === "es" ? "Consistencia" : "Consistency"}</p>
            </div>
            <p className="text-white font-bold text-lg">{Math.round(consistency)}%</p>
          </div>
          <div className="bg-white/5 rounded-xl p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap size={14} className="text-purple-300" />
              <p className="text-white/60 text-xs">{lang === "es" ? "Adherencia" : "Adherence"}</p>
            </div>
            <p className="text-white font-bold text-lg">{Math.round(adherence)}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}