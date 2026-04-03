import React from "react";
import { motion } from "framer-motion";
import { Flame, Camera, Users, Trophy, Star, Zap, Award, Target, Crown, Medal } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

const badgeConfig = {
  streak_3: { icon: Flame, label: { es: "3 días", en: "3 days", pt: "3 dias" }, color: "from-orange-400 to-amber-400", description: { es: "Tu primer mini-streak", en: "Your first mini-streak", pt: "Seu primeiro mini-racha" } },
  streak_7: { icon: Flame, label: { es: "1 semana", en: "1 week", pt: "1 semana" }, color: "from-orange-500 to-red-500", description: { es: "Una semana completa", en: "A full week", pt: "Uma semana completa" } },
  streak_14: { icon: Zap, label: { es: "2 semanas", en: "2 weeks", pt: "2 semanas" }, color: "from-yellow-400 to-orange-500", description: { es: "Dos semanas seguidas", en: "Two weeks straight", pt: "Duas semanas seguidas" } },
  streak_30: { icon: Trophy, label: { es: "1 mes", en: "1 month", pt: "1 mês" }, color: "from-amber-500 to-yellow-500", description: { es: "¡Un mes entero!", en: "A whole month!", pt: "Um mês inteiro!" } },
  streak_60: { icon: Crown, label: { es: "2 meses", en: "2 months", pt: "2 meses" }, color: "from-purple-500 to-pink-500", description: { es: "Dos meses de consistencia", en: "Two months of consistency", pt: "Dois meses de consistência" } },
  streak_100: { icon: Medal, label: { es: "100 días", en: "100 days", pt: "100 dias" }, color: "from-emerald-500 to-teal-500", description: { es: "¡Increíble dedicación!", en: "Incredible dedication!", pt: "Dedicação incrível!" } },
  first_checkin: { icon: Star, label: { es: "Primer día", en: "First day", pt: "Primeiro dia" }, color: "from-teal-400 to-cyan-400", description: { es: "Tu primer check-in", en: "Your first check-in", pt: "Seu primeiro check-in" } },
  first_photo: { icon: Camera, label: { es: "Primera foto", en: "First photo", pt: "Primeira foto" }, color: "from-pink-400 to-rose-400", description: { es: "Foto de comida", en: "Food photo", pt: "Foto de comida" } },
  joined_group: { icon: Users, label: { es: "En equipo", en: "Team player", pt: "Em equipe" }, color: "from-indigo-400 to-purple-400", description: { es: "Te uniste a un grupo", en: "You joined a group", pt: "Você entrou em um grupo" } },
  perfect_week: { icon: Target, label: { es: "Semana perfecta", en: "Perfect week", pt: "Semana perfeita" }, color: "from-emerald-400 to-green-500", description: { es: "7/7 días", en: "7/7 days", pt: "7/7 dias" } },
};

export default function BadgeCard({ badgeType, earned = true, size = "default" }) {
  const { lang } = useTranslation();
  const badge = badgeConfig[badgeType];
  if (!badge) return null;
  
  const Icon = badge.icon;
  const isSmall = size === "small";
  const label = typeof badge.label === "string" ? badge.label : badge.label[lang] || badge.label.en;
  const description = typeof badge.description === "string" ? badge.description : badge.description[lang] || badge.description.en;
  
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