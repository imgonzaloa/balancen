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

  // Fetch friends
  const { data: friendsList = [] } = useQuery({
    queryKey: ["friends", user?.email],
    queryFn: async () => {
      const friends = await base44.entities.Friend.filter({ created_by: user?.email });
      return friends;
    },
    enabled: !!user?.email,
  });

  // Fetch real activity feed from friends' meals
  const { data: activityFeed = [] } = useQuery({
    queryKey: ["friendsActivity", friendsList],
    queryFn: async () => {
      if (friendsList.length === 0) return [];
      
      const activities = [];
      for (const friend of friendsList) {
        const meals = await base44.entities.MealLog.filter(
          { created_by: friend.friend_user_id },
          "-created_date",
          5
        );
        
        meals.forEach(meal => {
          activities.push({
            id: meal.id,
            type: "meal",
            user: {
              name: friend.display_name,
              avatar: friend.avatar_url || "👤"
            },
            image: meal.photo_url,
            calories: meal.estimated_calories,
            protein: meal.estimated_protein,
            carbs: meal.estimated_carbs,
            fats: meal.estimated_fats,
            timestamp: new Date(meal.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          });
        });
      }
      
      return activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    },
    enabled: friendsList.length > 0,
  });

  // Show empty state if no friends
  const hasFriends = friendsList.length > 0;

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

        {/* Stories-style activity row - only real friends */}
        {hasFriends && (
          <div className="px-6 pb-4 overflow-x-auto">
            <div className="flex gap-3">
              {friendsList.slice(0, 10).map((friend, idx) => (
                <motion.div
                  key={friend.id}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex-shrink-0"
                >
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 p-0.5">
                    <div className="w-full h-full rounded-full bg-slate-900 flex items-center justify-center text-2xl">
                      {friend.avatar_url || "👤"}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {!hasFriends && (
          <div className="px-6 py-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-sm mx-auto"
            >
              <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
                <Users size={48} className="text-white/40" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                {lang === "es" ? "Todavía no tienes actividad social" : "No social activity yet"}
              </h2>
              <p className="text-white/60 mb-8">
                {lang === "es" 
                  ? "Conecta con amigos para compartir progreso."
                  : "Connect with friends to share progress."}
              </p>
              <div className="flex flex-col gap-3">
                <button className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-semibold">
                  {lang === "es" ? "Invitar amigos" : "Invite friends"}
                </button>
                <button className="w-full py-3 rounded-xl bg-white/10 border border-white/20 text-white font-semibold">
                  {lang === "es" ? "Crear grupo" : "Create group"}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Activity Feed - Only real data */}
        {hasFriends && activityFeed.length > 0 && (
          <div className="space-y-4 px-4">
            {activityFeed.map((activity, idx) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
            >
              {activity.type === "meal" && activity.image && (
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
                      alt="Meal"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Meal info */}
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="text-emerald-400 text-2xl font-black tabular-nums">
                        {activity.calories || 0} <span className="text-white/40 text-sm">kcal</span>
                      </p>
                    </div>

                    {/* Macros */}
                    <div className="flex gap-3">
                      <div className="flex-1 bg-blue-500/20 rounded-lg px-3 py-2 border border-blue-500/30">
                        <p className="text-blue-300 text-xs">{lang === "es" ? "Proteína" : "Protein"}</p>
                        <p className="text-white font-bold">{activity.protein || 0}g</p>
                      </div>
                      <div className="flex-1 bg-orange-500/20 rounded-lg px-3 py-2 border border-orange-500/30">
                        <p className="text-orange-300 text-xs">{lang === "es" ? "Carbos" : "Carbs"}</p>
                        <p className="text-white font-bold">{activity.carbs || 0}g</p>
                      </div>
                      <div className="flex-1 bg-purple-500/20 rounded-lg px-3 py-2 border border-purple-500/30">
                        <p className="text-purple-300 text-xs">{lang === "es" ? "Grasas" : "Fats"}</p>
                        <p className="text-white font-bold">{activity.fats || 0}g</p>
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
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}