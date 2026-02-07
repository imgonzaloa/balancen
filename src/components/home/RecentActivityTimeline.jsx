import React from "react";
import { motion } from "framer-motion";
import { Utensils, Flame, Trophy } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function RecentActivityTimeline({ recentMeals, profile }) {
  const { t } = useTranslation();

  const activities = [];

  // Recent meals
  if (recentMeals && recentMeals.length > 0) {
    recentMeals.slice(0, 2).forEach((meal) => {
      activities.push({
        icon: Utensils,
        text: t("meal_logged") || "Meal logged",
        detail: `${meal.estimated_calories} kcal`,
        time: meal.meal_time,
        color: "text-emerald-400",
      });
    });
  }

  // Streak milestone
  if (profile?.current_streak > 0 && profile.current_streak % 7 === 0) {
    activities.push({
      icon: Flame,
      text: t("streak_milestone") || "Streak milestone",
      detail: `${profile.current_streak} days`,
      color: "text-orange-400",
    });
  }

  // Goal reached (if calories met today)
  const todayCalories = recentMeals?.reduce((sum, m) => sum + (m.estimated_calories || 0), 0) || 0;
  const goal = profile?.calories_goal || 2000;
  if (todayCalories >= goal * 0.9) {
    activities.push({
      icon: Trophy,
      text: t("goal_reached") || "Goal almost reached",
      detail: `${Math.round((todayCalories / goal) * 100)}%`,
      color: "text-amber-400",
    });
  }

  if (activities.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
    >
      <h3 className="text-white/70 text-xs font-semibold uppercase tracking-wide mb-3">
        {t("recent_activity") || "Recent Activity"}
      </h3>

      <div className="space-y-2">
        {activities.slice(0, 3).map((activity, idx) => {
          const Icon = activity.icon;
          return (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * idx }}
              className="flex items-center gap-3 py-2"
            >
              <div className={`p-2 rounded-lg bg-white/5 ${activity.color}`}>
                <Icon size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{activity.text}</p>
                {activity.time && (
                  <p className="text-white/40 text-[10px]">{activity.time}</p>
                )}
              </div>
              <p className="text-white/60 text-xs font-semibold">{activity.detail}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}