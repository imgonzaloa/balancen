import React from "react";
import { motion } from "framer-motion";
import { CheckCircle, Circle, Camera, TrendingUp, Target, Flame } from "lucide-react";

export default function DailyTaskChecklist({ 
  todayCheckIn, 
  todayMeals = [], 
  profile, 
  onTaskClick 
}) {
  const stepsGoal = profile?.steps_goal || 8000;
  const caloriesGoal = profile?.calories_goal;
  const todayCalories = todayMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0);

  const tasks = [
    {
      id: "checkin",
      title: "Complete check-in",
      fire: 2,
      completed: todayCheckIn?.checkin_fire_awarded || false,
      action: () => onTaskClick("checkin"),
      icon: CheckCircle
    },
    {
      id: "meal_photo",
      title: "Add meal photo",
      fire: 2,
      completed: todayCheckIn?.meal_photo_fire_awarded || false,
      action: () => onTaskClick("meal_photo"),
      icon: Camera
    },
    {
      id: "steps",
      title: `Reach ${stepsGoal.toLocaleString()} steps`,
      fire: 3,
      completed: todayCheckIn?.steps_fire_awarded || false,
      action: () => onTaskClick("steps"),
      icon: TrendingUp
    }
  ];

  if (caloriesGoal) {
    tasks.push({
      id: "calories",
      title: `Stay under ${caloriesGoal} cal`,
      fire: 2,
      completed: todayCheckIn?.calories_fire_awarded || false,
      action: () => onTaskClick("calories"),
      icon: Target
    });
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const allCompleted = completedCount === totalCount;

  const totalFire = tasks.reduce((sum, t) => sum + (t.completed ? t.fire : 0), 0) + (allCompleted && todayCheckIn?.all_tasks_fire_awarded ? 5 : 0);

  return (
    <div className="space-y-3">
      {/* Progress Header */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-white font-bold text-2xl">Today's Mission 🔥</h2>
          <div className="flex items-center gap-2 bg-orange-500/20 px-3 py-1.5 rounded-full border border-orange-400/30">
            <Flame size={18} className="text-orange-400" />
            <span className="text-orange-300 font-bold text-sm">
              {totalFire} fire
            </span>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-1">
          <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-gradient-to-r from-orange-500 to-red-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${(completedCount / totalCount) * 100}%` }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-orange-300 text-sm font-bold whitespace-nowrap">
            {completedCount}/{totalCount}
          </span>
        </div>
        
        <p className="text-teal-200 text-xs">
          {completedCount === 0 ? "Start your day right" : 
           completedCount === totalCount ? "🎉 All tasks completed!" :
           `Only ${totalCount - completedCount} action${totalCount - completedCount > 1 ? 's' : ''} left`}
        </p>
      </div>

      {/* Task List */}
      <div className="space-y-2">
        {tasks.map((task, idx) => {
          const Icon = task.icon;
          return (
            <motion.div
              key={task.id}
              className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                task.completed
                  ? "bg-emerald-500/20 border-emerald-400"
                  : "bg-white/10 border-white/20 cursor-pointer hover:bg-white/15"
              }`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={!task.completed && task.action ? task.action : undefined}
              whileTap={!task.completed && task.action ? { scale: 0.98 } : {}}
            >
              {task.completed ? (
                <CheckCircle size={24} className="text-emerald-400 flex-shrink-0" />
              ) : (
                <Circle size={24} className="text-white/40 flex-shrink-0" />
              )}
              
              <div className="flex-1">
                <p className={`font-medium ${task.completed ? "text-emerald-300" : "text-white"}`}>
                  {task.title}
                </p>
              </div>

              <div className="flex items-center gap-1">
                <Flame size={16} className={task.completed ? "text-emerald-400" : "text-orange-400"} />
                <span className={`text-sm font-bold ${task.completed ? "text-emerald-400" : "text-orange-300"}`}>
                  +{task.fire}
                </span>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Daily Mission Bonus */}
      <motion.div
        className={`rounded-2xl p-4 text-center border-2 ${
          allCompleted && todayCheckIn?.all_tasks_fire_awarded
            ? "bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-purple-400"
            : "bg-white/5 border-white/20"
        }`}
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="flex items-center justify-center gap-2 mb-1">
          <Flame size={20} className={allCompleted && todayCheckIn?.all_tasks_fire_awarded ? "text-purple-400" : "text-white/40"} />
          <span className={`font-bold ${allCompleted && todayCheckIn?.all_tasks_fire_awarded ? "text-purple-300" : "text-white/60"}`}>
            Daily Mission Bonus
          </span>
        </div>
        <p className={`text-2xl font-bold ${allCompleted && todayCheckIn?.all_tasks_fire_awarded ? "text-purple-300" : "text-white/40"}`}>
          {allCompleted && todayCheckIn?.all_tasks_fire_awarded ? "✓ " : ""}+5 FIRE
        </p>
      </motion.div>
    </div>
  );
}