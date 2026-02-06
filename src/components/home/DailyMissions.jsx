import React from "react";
import { motion } from "framer-motion";
import { Flame, Check, Lock } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

const getMissions = (t) => [
  { id: "first_meal", label: t("first_meal_label") || "Log first meal", fire: 1, icon: "🥗" },
  { id: "stay_goal", label: t("stay_goal_label") || "Stay within goal", fire: 2, icon: "🎯" },
  { id: "complete_day", label: t("complete_day_label") || "Complete daily tracking", fire: 3, icon: "✅" }
];

export default function DailyMissions({ todayMeals, consumed, goal, profile }) {
  const { t } = useTranslation();
  const missions = getMissions(t);

  const getMissionStatus = (missionId) => {
    switch (missionId) {
      case "first_meal":
        return todayMeals && todayMeals.length > 0;
      case "stay_goal":
        return consumed <= goal;
      case "complete_day":
        return todayMeals && todayMeals.length > 0 && consumed <= goal;
      default:
        return false;
    }
  };

  const completedCount = missions.filter(m => getMissionStatus(m.id)).length;
  const totalFire = missions.reduce((sum, m) => getMissionStatus(m.id) ? sum + m.fire : sum, 0);
  const remainingTasks = missions.length - completedCount;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gradient-to-br from-amber-500/20 to-orange-500/10 backdrop-blur-xl border border-amber-500/30 rounded-3xl p-6 space-y-5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-white">{t("todays_mission") || "Today's Mission"}</h3>
          <p className="text-xs text-white/60 mt-1.5 font-medium">{completedCount}/{missions.length} {t("completed") || "completed"}</p>
        </div>
        <div className="flex items-center gap-2 bg-amber-500/20 rounded-full px-4 py-2.5 border border-amber-500/50">
          <Flame size={16} className="text-amber-400" />
          <span className="font-bold text-white text-sm">+{totalFire}</span>
        </div>
      </div>

      {/* Mission list */}
      <div className="space-y-3">
        {missions.map((mission, idx) => {
          const isComplete = getMissionStatus(mission.id);
          return (
            <motion.div
              key={mission.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                isComplete
                  ? "bg-emerald-500/20 border border-emerald-500/50"
                  : "bg-white/5 border border-white/10"
              }`}
            >
              <div className="text-lg">{mission.icon}</div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${isComplete ? "text-emerald-300" : "text-white"}`}>
                  {mission.label}
                </p>
                <p className="text-xs text-white/60">+{mission.fire} {t("fire")}</p>
              </div>
              {isComplete ? (
                <Check size={20} className="text-emerald-400" />
              ) : (
                <Lock size={20} className="text-white/30" />
              )}
            </motion.div>
          );
        })}
      </div>

      {/* Streak warning */}
      {completedCount < missions.length && (
        <div className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 text-center">
          <p className="text-sm text-red-300 font-semibold">
            ⚠️ {remainingTasks} {remainingTasks === 1 ? t("one_task_left_midnight") : t("tasks_left_midnight")}
          </p>
        </div>
      )}
    </motion.div>
  );
}