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
      id: "app_open",
      title: "Open app",
      fire: 1,
      completed: todayCheckIn?.app_open_fire_awarded || false,
      autoComplete: true,
      icon: Flame
    },
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
      fire: 3,
      completed: todayCheckIn?.calories_fire_awarded || false,
      action: () => onTaskClick("calories"),
      icon: Target
    });
  }

  const completedCount = tasks.filter(t => t.completed).length;
  const totalCount = tasks.length;
  const allCompleted = completedCount === totalCount;

  return (
    <div className="space-y-3">
      {/* Progress Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-white font-bold text-lg">Today's Mission</h3>
        <div className="flex items-center gap-2">
          <span className="text-orange-300 text-sm font-semibold">
            {completedCount}/{totalCount}
          </span>
          <Flame size={18} className="text-orange-400" />
        </div>
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

      {/* All Tasks Bonus */}
      {allCompleted && todayCheckIn?.all_tasks_fire_awarded && (
        <motion.div
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-400 rounded-2xl p-4 text-center"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <p className="text-purple-300 font-bold flex items-center justify-center gap-2">
            <Flame size={20} className="text-purple-400" />
            ALL TASKS BONUS +5 FIRE
          </p>
        </motion.div>
      )}

      {/* Remaining Actions */}
      {!allCompleted && (
        <motion.div
          className="text-center py-2"
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <p className="text-orange-300 font-semibold text-sm">
            🔥 Only {totalCount - completedCount} action{totalCount - completedCount > 1 ? 's' : ''} left to complete today
          </p>
        </motion.div>
      )}
    </div>
  );
}