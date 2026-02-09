import React from "react";
import { Check, Camera, Utensils, TrendingUp, Flame } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function DailyMissions({ mealsCount, caloriesLogged, streakActive }) {
  const { lang } = useTranslation();

  const missions = [
    {
      id: 1,
      icon: Camera,
      title: lang === "es" ? "Registra tu primera comida" : "Log your first meal",
      completed: mealsCount >= 1,
      reward: "+2 🔥"
    },
    {
      id: 2,
      icon: Utensils,
      title: lang === "es" ? "Registra 3 comidas hoy" : "Log 3 meals today",
      completed: mealsCount >= 3,
      reward: "+3 🔥"
    },
    {
      id: 3,
      icon: TrendingUp,
      title: lang === "es" ? "Alcanza tu meta de calorías" : "Hit your calorie goal",
      completed: caloriesLogged >= 100,
      reward: "+5 🔥"
    },
    {
      id: 4,
      icon: Flame,
      title: lang === "es" ? "Mantén tu racha" : "Keep your streak",
      completed: streakActive,
      reward: "+1 🔥"
    }
  ];

  const completedCount = missions.filter(m => m.completed).length;

  return (
    <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 backdrop-blur-xl rounded-3xl p-6 border border-amber-500/20">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">
          {lang === "es" ? "Misiones Diarias" : "Daily Missions"}
        </h3>
        <span className="text-amber-300 font-bold text-sm">{completedCount}/{missions.length}</span>
      </div>

      <div className="space-y-3">
        {missions.map((mission) => {
          const Icon = mission.icon;
          return (
            <div
              key={mission.id}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                mission.completed
                  ? "bg-emerald-500/20 border border-emerald-500/30"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                mission.completed ? "bg-emerald-500/30" : "bg-white/10"
              }`}>
                {mission.completed ? (
                  <Check size={16} className="text-emerald-300" />
                ) : (
                  <Icon size={16} className="text-white/60" />
                )}
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${
                  mission.completed ? "text-white line-through" : "text-white/90"
                }`}>
                  {mission.title}
                </p>
              </div>
              <span className="text-xs font-bold text-amber-300">{mission.reward}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}