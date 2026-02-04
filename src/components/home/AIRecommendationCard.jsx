import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X, TrendingUp, Apple, Dumbbell, Moon } from "lucide-react";

const typeIcons = {
  motivation: Sparkles,
  nutrition: Apple,
  activity: Dumbbell,
  recovery: Moon,
  progressive_overload: TrendingUp,
};

const typeColors = {
  motivation: "from-purple-400 to-pink-500",
  nutrition: "from-emerald-400 to-green-500",
  activity: "from-teal-400 to-cyan-500",
  recovery: "from-blue-400 to-indigo-500",
  progressive_overload: "from-amber-400 to-orange-500",
};

export default function AIRecommendationCard({ recommendation, onDismiss }) {
  if (!recommendation) return null;

  const Icon = typeIcons[recommendation.type] || Sparkles;
  const colorGradient = typeColors[recommendation.type] || typeColors.motivation;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        className="relative overflow-hidden rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl"
      >
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-purple-400/30 to-pink-400/30 rounded-full blur-2xl" />
        
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${colorGradient} flex items-center justify-center shadow-lg`}>
                <Icon size={22} className="text-white" />
              </div>
              <div>
                <p className="text-xs text-teal-200 font-medium">Recomendación IA</p>
                <p className="text-xs text-white/60">Personalizada para ti</p>
              </div>
            </div>
            <button
              onClick={onDismiss}
              className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <X size={16} className="text-white/60" />
            </button>
          </div>
          
          <p className="text-white text-sm leading-relaxed">
            {recommendation.recommendation_text}
          </p>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}