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
    className="bg-white/5 backdrop-blur-sm rounded-2xl p-4 border border-white/10"
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
            className="mt-2 w-full h-32 object-cover rounded-xl"
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

  const { data: friends = cachedFriends || [] } = useQuery({
    queryKey: ["friends", user?.email],
    queryFn: async () => {
      const friendsList = await base44.entities.Friend.filter({ created_by: user?.email });
      return friendsList.filter(f => f.status === "accepted");
    },
    enabled: !!user?.email && !cachedFriends,
    initialData: cachedFriends || [],
  });

  const { data: activities = [], isLoading: activitiesLoading } = useQuery({
    queryKey: ["friendActivities", friends],
    queryFn: async () => {
      if (friends.length === 0) return [];

      const today = new Date().toISOString().split("T")[0];
      const friendActivities = [];

      const friendsToCheck = friends.slice(0, 10);

      for (const friend of friendsToCheck) {
        try {
          const friendProfile = await base44.entities.UserProfile.filter({ 
            created_by: friend.friend_email || friend.user_email 
          });

          if (friendProfile[0]?.share_meals === "private") continue;

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
      }

      return friendActivities.sort((a, b) => 
        new Date(b.time) - new Date(a.time)
      ).slice(0, 20);
    },
    enabled: friends.length > 0,
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
          {activitiesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 rounded-2xl p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-full bg-white/10" />
                    <div className="flex-1">
                      <div className="h-4 bg-white/10 rounded w-32 mb-2" />
                      <div className="h-3 bg-white/10 rounded w-48" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : friends.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="bg-white/5 backdrop-blur-xl rounded-3xl p-8 border border-white/10 text-center"
            >
              <Users size={64} className="text-white/30 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-2">
                {lang === "es" ? "Aún no agregaste amigos" : "You haven't added friends yet"}
              </h3>
              <p className="text-white/60 text-sm mb-4">
                {lang === "es" 
                  ? "Invita a alguien y empieza a compartir progreso juntos."
                  : "Invite someone and start sharing progress together."}
              </p>
            </motion.div>
          ) : activities.length > 0 ? (
            <div className="space-y-4">
              {activities.map((activity) => (
                <ActivityCard key={activity.id} activity={activity} lang={lang} />
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-12"
            >
              <Users size={48} className="text-white/30 mx-auto mb-4" />
              <p className="text-white/60">
                {lang === "es" 
                  ? "Tus amigos aún no han registrado comidas hoy"
                  : "Your friends haven't logged meals yet today"}
              </p>
            </motion.div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
}