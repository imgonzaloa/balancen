import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Users } from "lucide-react";
import { SocialSkeleton } from "@/components/ui/ScreenSkeleton";
import InviteSystemCard from "@/components/social/InviteSystemCard";
import { useTranslation } from "@/components/TranslationProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useAppState } from "@/components/AppStateContext";

const ActivityCard = React.memo(({ activity, lang }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-gradient-to-br from-white/5 to-white/[0.02] backdrop-blur-sm rounded-2xl p-5 border border-white/10 shadow-lg hover:border-white/20 transition-colors"
  >
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold flex-shrink-0">
        {activity.userName?.charAt(0) || "?"}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm">{activity.userName}</p>
        <p className="text-white/60 text-xs">
          {lang === "es" ? "Registró una comida" : "Logged a meal"} • {activity.time}
        </p>
        {activity.meal?.photo_url && (
          <img 
            src={activity.meal.photo_url} 
            alt="Meal"
            className="mt-3 w-full h-36 object-cover rounded-xl shadow-md"
            loading="lazy"
          />
        )}
        {activity.meal?.estimated_calories && (
          <p className="text-teal-300 text-xs mt-2">
            {activity.meal.estimated_calories} kcal
            {activity.meal.estimated_protein && ` • ${activity.meal.estimated_protein}g protein`}
          </p>
        )}
      </div>
    </div>
  </motion.div>
));

export default function Social() {
  const { t, lang } = useTranslation();
  const { user, profile, friends: cachedFriends, isInitialized, refreshFriends } = useAppState();

  const { data: friends = [] } = useQuery({
    queryKey: ["friends", user?.email],
    queryFn: async () => {
      const friendsList = await base44.entities.Friend.filter({ created_by: user?.email });
      return friendsList.filter(f => f.status === "accepted");
    },
    enabled: !!user?.email && !cachedFriends,
    initialData: cachedFriends || [],
    keepPreviousData: true, // Prevent disappearing content
    staleTime: 5 * 60 * 1000,
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["friendActivities", friends],
    queryFn: async () => {
      if (friends.length === 0) return [];

      const today = new Date().toISOString().split("T")[0];
      const friendActivities = [];

      // Limit to 10 friends for performance
      const friendsToCheck = friends.slice(0, 10);

      // Parallel fetch for faster loading
      await Promise.all(friendsToCheck.map(async (friend) => {
        try {
          const friendProfile = await base44.entities.UserProfile.filter({ 
            created_by: friend.friend_email || friend.user_email 
          });

          if (friendProfile[0]?.share_meals === "private") return;

          const friendMeals = await base44.entities.MealLog.filter({
            created_by: friend.friend_email || friend.user_email,
            date: today,
          }, "-created_date", 3);

          friendMeals.forEach(meal => {
            const shouldShowMacros = friendProfile[0]?.share_macros;
            const shouldShowCalories = friendProfile[0]?.share_calories;

            friendActivities.push({
              id: meal.id,
              userName: friend.display_name,
              userAvatar: friend.avatar_url,
              time: new Date(meal.created_date).toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              meal: {
                photo_url: meal.photo_url,
                estimated_calories: shouldShowCalories ? meal.estimated_calories : null,
                estimated_protein: shouldShowMacros ? meal.estimated_protein : null,
              }
            });
          });
        } catch (err) {
          console.error("Error fetching friend activity:", err);
        }
      }));

      return friendActivities.sort((a, b) => 
        new Date(b.time) - new Date(a.time)
      ).slice(0, 20);
    },
    enabled: friends.length > 0,
    keepPreviousData: true, // CRITICAL: Prevent disappearing content
    staleTime: 2 * 60 * 1000,
  });

  const isLoading = !isInitialized || !profile;

  if (isLoading) {
    return <SocialSkeleton />;
  }

  return (
    <ErrorBoundary screen="Social">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 pb-24">
        <div className="max-w-2xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-black text-white mb-2">
              {lang === "es" ? "Social" : "Social"}
            </h1>
            <p className="text-white/60 text-sm">
              {lang === "es" 
                ? "Comparte progreso con amigos"
                : "Share progress with friends"}
            </p>
          </div>

          {/* Invite System Card - Always visible */}
          <InviteSystemCard profile={profile} />

          {/* Friend Activities or Empty State */}
          {activitiesLoading && activities.length === 0 ? (
            <div className="space-y-4">
              {[1, 2].map(i => (
                <div key={i} className="bg-white/5 rounded-2xl p-4 overflow-hidden relative">
                  <div className="absolute inset-0 animate-shimmer" />
                  <div className="flex gap-3 relative">
                    <div className="w-10 h-10 rounded-full bg-white/10" />
                    <div className="flex-1 space-y-2">
                      <div className="h-4 bg-white/10 rounded w-32" />
                      <div className="h-3 bg-white/10 rounded w-48" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl p-10 border border-purple-500/20 shadow-lg text-center relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-400/10 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="text-7xl mb-4">🚀</div>
                <h3 className="text-white font-bold text-xl mb-2">
                  {lang === "es" ? "Entrenar con amigos aumenta la constancia" : "Training with friends increases consistency"}
                </h3>
                <p className="text-white/70 text-sm">
                  {lang === "es" 
                    ? "Invita a alguien y empieza a compartir progreso juntos"
                    : "Invite someone and start sharing progress together"}
                </p>
              </div>
            </motion.div>
          ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} lang={lang} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-10 border border-white/10 text-center"
            >
              <div className="text-6xl mb-4">😴</div>
              <h3 className="text-white font-bold text-lg mb-2">
                {lang === "es" ? "Aún sin actividad hoy" : "No activity yet today"}
              </h3>
              <p className="text-white/60 text-sm">
                {lang === "es" 
                  ? "Tus amigos aún no han registrado comidas"
                  : "Your friends haven't logged meals yet"}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}