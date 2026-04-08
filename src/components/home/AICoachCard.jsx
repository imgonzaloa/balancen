import React from "react";
import { Sparkles, Lock } from "lucide-react";

export default function AICoachCard({ lang, isPremium, onNavigate }) {
  const title = lang === 'es' ? 'Tu coach IA' : lang === 'nl' ? 'Je AI-coach' : 'Your AI Coach';
  const subtitle = lang === 'es'
    ? 'Plan de comidas y entrenamiento personalizado'
    : lang === 'nl'
    ? 'Persoonlijk voedings- en trainingsplan'
    : 'Personalized meal and workout plan';

  if (isPremium) {
    return (
      <button
        onClick={() => onNavigate('GoalsAssistant')}
        className="w-full text-left bg-gradient-to-r from-teal-500/25 via-emerald-500/20 to-cyan-500/15 backdrop-blur-xl rounded-2xl p-5 border border-teal-400/30 hover:border-teal-400/60 active:scale-[0.98] transition-all shadow-lg shadow-teal-500/10"
      >
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-teal-500/30">
            <Sparkles size={20} className="text-white" strokeWidth={2.5} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-teal-200 font-black text-base leading-tight">{title}</p>
            <p className="text-teal-300/60 text-xs mt-0.5 leading-relaxed">{subtitle}</p>
          </div>
          <div className="w-7 h-7 rounded-full bg-teal-400/20 flex items-center justify-center flex-shrink-0">
            <span className="text-teal-300 text-base leading-none">›</span>
          </div>
        </div>
      </button>
    );
  }

  // Locked version for free users
  return (
    <button
      onClick={() => onNavigate('Premium')}
      className="w-full text-left bg-gradient-to-r from-slate-800/80 to-slate-700/50 backdrop-blur-xl rounded-2xl p-5 border border-white/10 hover:border-white/20 active:scale-[0.98] transition-all"
    >
      <div className="flex items-center gap-4">
        <div className="w-11 h-11 rounded-xl bg-slate-700/80 flex items-center justify-center flex-shrink-0 relative">
          <Sparkles size={20} className="text-white/20" strokeWidth={2.5} />
          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center shadow">
            <Lock size={10} className="text-white" strokeWidth={2.5} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-white/40 font-black text-base leading-tight">{title}</p>
          <p className="text-amber-400/80 text-xs mt-0.5 font-semibold">
            {lang === 'es' ? '✦ Solo Premium — desbloquear' : lang === 'nl' ? '✦ Alleen Premium — ontgrendelen' : '✦ Premium only — unlock'}
          </p>
        </div>
        <div className="w-7 h-7 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <span className="text-amber-400 text-base leading-none">›</span>
        </div>
      </div>
    </button>
  );
}