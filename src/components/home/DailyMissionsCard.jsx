import React from "react";
import { Check, Flame, Camera, Users, TrendingUp } from "lucide-react";

export default function DailyMissionsCard({ missions, lang }) {
  const missionIcons = {
    log_meal: Camera,
    hit_calories: Flame,
    social_interaction: Users,
    consistency: TrendingUp,
  };

  return (
    <div className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">
          {lang === "es" ? "Misiones Diarias" : "Daily Missions"}
        </h3>
        <div className="flex items-center gap-1">
          <Flame size={16} className="text-orange-400" />
          <span className="text-orange-400 font-bold text-sm">
            +{missions.filter(m => m.completed).reduce((sum, m) => sum + m.reward, 0)}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {missions.map((mission, idx) => {
          const Icon = missionIcons[mission.type] || Check;
          return (
            <div 
              key={idx}
              className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                mission.completed 
                  ? "bg-emerald-500/20 border border-emerald-500/30" 
                  : "bg-white/5 border border-white/10"
              }`}
            >
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                mission.completed ? "bg-emerald-500" : "bg-white/10"
              }`}>
                {mission.completed ? (
                  <Check size={16} className="text-white" />
                ) : (
                  <Icon size={16} className="text-white/60" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${mission.completed ? "text-emerald-300" : "text-white"}`}>
                  {mission.title}
                </p>
                <p className="text-white/50 text-xs">{mission.description}</p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Flame size={12} className={mission.completed ? "text-orange-400" : "text-white/30"} />
                <span className={`text-xs font-bold ${mission.completed ? "text-orange-400" : "text-white/30"}`}>
                  +{mission.reward}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}