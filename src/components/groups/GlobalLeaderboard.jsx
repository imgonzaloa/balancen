import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Trophy, Flame, TrendingUp } from "lucide-react";

export default function GlobalLeaderboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: allProfiles = [] } = useQuery({
    queryKey: ["globalLeaderboard"],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.list("-current_streak", 50);
      return profiles.filter(p => p.current_streak > 0);
    },
  });

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <Trophy size={22} className="text-white" />
          </div>
          <div>
            <h3 className="text-white font-bold text-lg">Global Leaderboard</h3>
            <p className="text-teal-200 text-sm">Top performers this month</p>
          </div>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto">
          {allProfiles.slice(0, 20).map((profile, index) => {
            const isCurrentUser = profile.created_by === user?.email;
            const isTop3 = index < 3;

            return (
              <motion.div
                key={profile.id}
                className={`flex items-center gap-3 p-3 rounded-xl ${
                  isCurrentUser ? "bg-teal-500/20 border border-teal-400/50" : "bg-white/5"
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  index === 0 ? "bg-amber-100 text-amber-700" :
                  index === 1 ? "bg-slate-200 text-slate-600" :
                  index === 2 ? "bg-orange-100 text-orange-600" :
                  "bg-white/10 text-white/60"
                }`}>
                  {index + 1}
                </div>

                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold">
                  {profile.display_name?.charAt(0) || "?"}
                </div>

                <div className="flex-1">
                  <p className={`font-semibold text-sm ${isCurrentUser ? "text-teal-100" : "text-white"}`}>
                    {profile.display_name}
                    {isCurrentUser && " (you)"}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-white/60">
                    <span className="flex items-center gap-1">
                      <TrendingUp size={12} />
                      {profile.total_checkins} check-ins
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-orange-500/20 px-2 py-1 rounded-lg">
                  <Flame size={16} className="text-orange-300" />
                  <span className="font-bold text-white text-sm">{profile.current_streak}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}