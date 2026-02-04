import React from "react";
import { motion } from "framer-motion";
import { Flame, Camera, Users, Trophy, Star, Zap, Award, Target, Crown, Medal } from "lucide-react";

const badgeConfig = {
  streak_3: { icon: Flame, label: "3 días", color: "from-orange-400 to-amber-400", description: "Tu primer mini-streak" },
  streak_7: { icon: Flame, label: "1 semana", color: "from-orange-500 to-red-500", description: "Una semana completa" },
  streak_14: { icon: Zap, label: "2 semanas", color: "from-yellow-400 to-orange-500", description: "Dos semanas seguidas" },
  streak_30: { icon: Trophy, label: "1 mes", color: "from-amber-500 to-yellow-500", description: "¡Un mes entero!" },
  streak_60: { icon: Crown, label: "2 meses", color: "from-purple-500 to-pink-500", description: "Dos meses de consistencia" },
  streak_100: { icon: Medal, label: "100 días", color: "from-emerald-500 to-teal-500", description: "¡Increíble dedicación!" },
  first_checkin: { icon: Star, label: "Primer día", color: "from-teal-400 to-cyan-400", description: "Tu primer check-in" },
  first_photo: { icon: Camera, label: "Primera foto", color: "from-pink-400 to-rose-400", description: "Foto de comida" },
  joined_group: { icon: Users, label: "En equipo", color: "from-indigo-400 to-purple-400", description: "Te uniste a un grupo" },
  perfect_week: { icon: Target, label: "Semana perfecta", color: "from-emerald-400 to-green-500", description: "7/7 días" },
};

export default function BadgeCard({ badgeType, earned = true, size = "default" }) {
  const badge = badgeConfig[badgeType];
  if (!badge) return null;
  
  const Icon = badge.icon;
  const isSmall = size === "small";
  
  return (
    <motion.div
      className={`relative ${isSmall ? "w-14 h-14" : "w-20 h-20"} rounded-2xl flex items-center justify-center ${
        earned 
          ? `bg-gradient-to-br ${badge.color} shadow-lg` 
          : "bg-slate-200"
      }`}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: earned ? 1 : 0.5 }}
      whileHover={{ scale: 1.1 }}
    >
      <Icon size={isSmall ? 24 : 36} className={earned ? "text-white" : "text-slate-400"} />
      {!earned && (
        <div className="absolute inset-0 bg-slate-200/60 rounded-2xl" />
      )}
    </motion.div>
  );
}

export { badgeConfig };