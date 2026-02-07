import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Heart, TrendingUp, Flame, Award } from "lucide-react";
import { useTranslation } from "@/components/TranslationProvider";

export default function Social() {
  const { t, lang } = useTranslation();
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  // Fetch friends activity
  const { data: friendsList = [] } = useQuery({
    queryKey: ["friends", user?.email],
    queryFn: async () => {
      const sent = await base44.entities.Friend.filter({ user_email: user?.email });
      const received = await base44.entities.Friend.filter({ friend_email: user?.email });
      return [...sent, ...received].filter(f => f.status === "accepted");
    },
    enabled: !!user?.email,
  });

  // Mock activity feed
  const activityFeed = [
    {
      id: 1,
      type: "meal",
      user: { name: "Sarah", avatar: "🧑‍🍳" },
      image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
      food: "Caesar Salad",
      calories: 320,
      protein: 28,
      carbs: 18,
      fats: 14,
      timestamp: "2h ago"
    },
    {
      id: 2,
      type: "streak",
      user: { name: "Mike", avatar: "💪" },
      milestone: 30,
      timestamp: "4h ago"
    },
    {
      id: 3,
      type: "meal",
      user: { name: "Emma", avatar: "🏃‍♀️" },
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400",
      food: "Margherita Pizza",
      calories: 580,
      protein: 24,
      carbs: 68,
      fats: 22,
      timestamp: "6h ago"
    },
    {
      id: 4,
      type: "achievement",
      user: { name: "John", avatar: "🎯" },
      achievement: "100 meals logged",
      timestamp: "8h ago"
    }
  ];

  // Stories-style activity indicators
  const activeUsers = ["🧑‍🍳", "💪", "🏃‍♀️", "🎯", "🌟", "🔥"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 pb-24">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="p-6 pb-4">
          <h1 className="text-3xl font-black text-white mb-2">
            {lang === "es" ? "Actividad Social" : "Social Feed"}
          </h1>
          <p className="text-white/60 text-sm">
            {lang === "es" ? "Ve qué están logrando tus amigos" : "See what your friends are achieving"}
          </p>
        </div>

        {/* Stories-style activity row */}
        <div className="px-6 pb-4 overflow-x-auto">
          <div className="flex gap-3">
            {activeUsers.map((avatar, idx) => (
              <motion.div
                key={idx}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: idx * 0.05 }}
                className="flex-shrink-0"
              >
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5">
                  <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-2xl">
                    {avatar}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div className="space-y-4 px-4">
          {activityFeed.map((activity, idx) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              {activity.type === "meal" && (
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10">
                  {/* User header */}
                  <div className="p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-xl">
                      {activity.user.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold text-sm">{activity.user.name}</p>
                      <p className="text-white/50 text-xs">{activity.timestamp}</p>
                    </div>
                  </div>

                  {/* Meal image */}
                  <div className="relative h-64 bg-black">
                    <img 
                      src={activity.image} 
                      alt={activity.food}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Meal info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <h3 className="text-white font-bold text-lg">{activity.food}</h3>
                      <p className="text-emerald-400 text-2xl font-black tabular-nums">
                        {activity.calories} <span className="text-white/40 text-sm">kcal</span>
                      </p>
                    </div>

                    {/* Macros */}
                    <div className="flex gap-3">
                      <div className="flex-1 bg-blue-500/20 rounded-lg px-3 py-2 border border-blue-500/30">
                        <p className="text-blue-300 text-xs">{lang === "es" ? "Proteína" : "Protein"}</p>
                        <p className="text-white font-bold">{activity.protein}g</p>
                      </div>
                      <div className="flex-1 bg-orange-500/20 rounded-lg px-3 py-2 border border-orange-500/30">
                        <p className="text-orange-300 text-xs">{lang === "es" ? "Carbos" : "Carbs"}</p>
                        <p className="text-white font-bold">{activity.carbs}g</p>
                      </div>
                      <div className="flex-1 bg-purple-500/20 rounded-lg px-3 py-2 border border-purple-500/30">
                        <p className="text-purple-300 text-xs">{lang === "es" ? "Grasas" : "Fats"}</p>
                        <p className="text-white font-bold">{activity.fats}g</p>
                      </div>
                    </div>

                    {/* Reaction buttons */}
                    <div className="flex gap-2 pt-2 border-t border-white/10">
                      <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10">
                        <Flame size={16} className="text-orange-400" />
                        <span className="text-white text-sm font-medium">🔥</span>
                      </button>
                      <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg bg-white/5 hover:bg-white/10">
                        <Heart size={16} className="text-red-400" />
                        <span className="text-white text-sm font-medium">👍</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {activity.type === "streak" && (
                <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-xl rounded-2xl p-4 border border-orange-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-xl">
                      {activity.user.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{activity.user.name}</p>
                      <p className="text-orange-300 text-sm flex items-center gap-1">
                        <TrendingUp size={14} />
                        {activity.milestone} {lang === "es" ? "días de racha" : "day streak"}
                      </p>
                    </div>
                    <div className="text-4xl">🔥</div>
                  </div>
                </div>
              )}

              {activity.type === "achievement" && (
                <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-4 border border-purple-500/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-xl">
                      {activity.user.avatar}
                    </div>
                    <div className="flex-1">
                      <p className="text-white font-semibold">{activity.user.name}</p>
                      <p className="text-purple-300 text-sm flex items-center gap-1">
                        <Award size={14} />
                        {activity.achievement}
                      </p>
                    </div>
                    <div className="text-3xl">🏆</div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}