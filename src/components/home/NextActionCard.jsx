import React from "react";
import { motion } from "framer-motion";
import { Camera, Target, Users, TrendingUp, ChevronRight } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function NextActionCard({ todayMeals, caloriesGoal, totalCalories, friendsCount }) {
  const { lang } = useTranslation();
  const navigate = useNavigate();
  
  // Determine next action based on user state
  let action, description, actionIcon, actionColor, onClick;
  
  if (todayMeals.length === 0) {
    action = lang === "es" ? "Registra tu primera comida" : "Log your first meal";
    description = lang === "es" ? "Empieza el día con una foto" : "Start the day with a photo";
    actionIcon = Camera;
    actionColor = "from-purple-500 to-pink-500";
    onClick = () => navigate(createPageUrl("CameraScreen"));
  } else if (totalCalories < caloriesGoal * 0.5) {
    action = lang === "es" ? "Continúa registrando" : "Keep logging meals";
    description = lang === "es" ? `${Math.round(caloriesGoal - totalCalories)} kcal restantes` : `${Math.round(caloriesGoal - totalCalories)} kcal remaining`;
    actionIcon = Camera;
    actionColor = "from-orange-500 to-red-500";
    onClick = () => navigate(createPageUrl("CameraScreen"));
  } else if (totalCalories >= caloriesGoal * 0.9 && totalCalories < caloriesGoal) {
    action = lang === "es" ? "¡Casi listo!" : "Almost there!";
    description = lang === "es" ? "Última comida del día" : "Last meal of the day";
    actionIcon = Target;
    actionColor = "from-emerald-500 to-teal-500";
    onClick = () => navigate(createPageUrl("CameraScreen"));
  } else if (friendsCount === 0) {
    action = lang === "es" ? "Invita a un amigo" : "Invite a friend";
    description = lang === "es" ? "Gana 1 mes gratis por cada 3 amigos" : "Earn 1 free month per 3 friends";
    actionIcon = Users;
    actionColor = "from-teal-500 to-cyan-500";
    onClick = () => navigate(createPageUrl("Social"));
  } else {
    action = lang === "es" ? "Revisa tu progreso" : "Check your progress";
    description = lang === "es" ? "Ve qué tan bien vas" : "See how you're doing";
    actionIcon = TrendingUp;
    actionColor = "from-blue-500 to-indigo-500";
    onClick = () => navigate(createPageUrl("Progress"));
  }
  
  const Icon = actionIcon;
  
  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileTap={{ scale: 0.98 }}
      className="w-full"
    >
      <div className={`bg-gradient-to-r ${actionColor} p-[2px] rounded-3xl`}>
        <div className="bg-slate-900 rounded-3xl p-5 flex items-center gap-4">
          <div className={`w-14 h-14 bg-gradient-to-br ${actionColor} rounded-2xl flex items-center justify-center flex-shrink-0`}>
            <Icon size={28} className="text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-white font-bold text-lg mb-0.5">{action}</p>
            <p className="text-white/60 text-sm">{description}</p>
          </div>
          <ChevronRight size={24} className="text-white/40" />
        </div>
      </div>
    </motion.button>
  );
}