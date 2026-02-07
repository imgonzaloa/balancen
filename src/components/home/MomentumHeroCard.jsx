import React from "react";
import { motion } from "framer-motion";
import { Flame, TrendingUp, Zap } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

const MomentumHeroCard = React.memo(function MomentumHeroCard({ streak, momentumScore, profile }) {


  const { t, lang } = useTranslation();
  
  // Calculate momentum score based on streak, consistency, and activity
  const calculateMomentum = () => {
    let score = 0;
    
    // Streak contribution (max 40 points)
    score += Math.min(streak * 4, 40);
    
    // Activity contribution (max 30 points)
    const totalActivity = (profile?.total_checkins || 0);
    score += Math.min(totalActivity * 0.5, 30);
    
    // Fire contribution (max 30 points)
    const fireTotal = (profile?.fire_total || 0);
    score += Math.min(fireTotal * 0.3, 30);
    
    return Math.min(Math.round(score), 100);
  };
  
  const momentum = momentumScore || calculateMomentum();
  
  // Energy level based on momentum
  const getEnergyLevel = () => {
    if (momentum >= 80) return { label: lang === "es" ? "🚀 Imparable" : "🚀 Unstoppable", color: "from-emerald-400 to-teal-400" };
    if (momentum >= 60) return { label: lang === "es" ? "⚡ En fuego" : "⚡ On Fire", color: "from-orange-400 to-amber-400" };
    if (momentum >= 40) return { label: lang === "es" ? "💪 Ganando ritmo" : "💪 Building", color: "from-blue-400 to-cyan-400" };
    return { label: lang === "es" ? "🌱 Comenzando" : "🌱 Starting", color: "from-purple-400 to-pink-400" };
  };
  
  const energy = getEnergyLevel();
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="relative overflow-hidden rounded-3xl p-6 bg-gradient-to-br from-slate-800/80 via-slate-900/80 to-black/80 backdrop-blur-2xl border border-white/10 shadow-2xl"
    >
      {/* Animated background glow */}
      <div className="absolute inset-0 opacity-30">
        <motion.div
          animate={{ 
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ 
            repeat: Infinity, 
            duration: 3,
            ease: "easeInOut"
          }}
          className={`absolute -top-1/2 -left-1/4 w-full h-full bg-gradient-to-br ${energy.color} rounded-full blur-3xl`}
        />
      </div>
      
      <div className="relative z-10">
        {/* Top section - Energy status */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Zap size={20} className={`text-transparent bg-gradient-to-r ${energy.color} bg-clip-text`} fill="currentColor" />
            </motion.div>
            <span className={`text-sm font-bold text-transparent bg-gradient-to-r ${energy.color} bg-clip-text`}>
              {energy.label}
            </span>
          </div>
          
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10">
            <Flame size={14} className="text-orange-400" />
            <span className="text-white text-xs font-bold">{streak} {lang === "es" ? "días" : "days"}</span>
          </div>
        </div>
        
        {/* Center - Momentum score */}
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/60 text-xs mb-1 uppercase tracking-wide">
              {lang === "es" ? "Momentum" : "Momentum"}
            </p>
            <div className="flex items-baseline gap-2">
              <motion.p
                key={momentum}
                initial={{ scale: 1.2, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-5xl font-black text-white tabular-nums"
              >
                {momentum}
              </motion.p>
              <span className="text-white/40 text-lg font-bold">/100</span>
            </div>
          </div>
          
          {/* Visual momentum ring */}
          <div className="relative w-20 h-20">
            <svg width="80" height="80" className="transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="32"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="6"
                fill="none"
              />
              <motion.circle
                cx="40"
                cy="40"
                r="32"
                stroke={`url(#momentum-gradient)`}
                strokeWidth="6"
                fill="none"
                strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 32}
                initial={{ strokeDashoffset: 2 * Math.PI * 32 }}
                animate={{ strokeDashoffset: 2 * Math.PI * 32 * (1 - momentum / 100) }}
                transition={{ duration: 1.5, ease: "easeOut" }}
              />
              <defs>
                <linearGradient id="momentum-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#14b8a6" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <TrendingUp size={20} className="text-emerald-400" />
            </div>
          </div>
        </div>
        
        {/* Bottom - Progress hint */}
        <div className="pt-3 border-t border-white/10">
          <p className="text-white/50 text-xs">
            {momentum < 80 
              ? (lang === "es" 
                  ? `+${80 - momentum} puntos para alcanzar nivel "En fuego"` 
                  : `+${80 - momentum} points to reach "On Fire" level`)
              : (lang === "es" 
                  ? "¡Estás en tu mejor momento!" 
                  : "You're at your peak!")}
          </p>
        </div>
      </div>
    </motion.div>
  );
});

export default MomentumHeroCard;