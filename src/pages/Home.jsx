import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { useMeal } from "@/components/MealContext";
import { createPageUrl } from "@/utils";
import AddMealButton from "@/components/home/AddMealButton";
import DailyCalorieGoal from "@/components/home/DailyCalorieGoal";
import DailyMissions from "@/components/home/DailyMissions";
import StreakBanner from "@/components/home/StreakBanner";
import SocialPreview from "@/components/home/SocialPreview";
import MealResultCard from "@/components/home/MealResultCard";
import LastMealPreview from "@/components/home/LastMealPreview";
import FireIncreaseAnimation from "@/components/home/FireIncreaseAnimation";
import GroupLeaderboardShortcut from "@/components/home/GroupLeaderboardShortcut";
import OwnerRoleChecker from "@/components/OwnerRoleChecker";
import StatusBubble from "@/components/home/StatusBubble";
import RecentActivityTimeline from "@/components/home/RecentActivityTimeline";

export default function Home() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { previewUrl } = useMeal();
  const [user, setUser] = useState(null);
  const [showFireAnimation, setShowFireAnimation] = useState(false);
  const [fireAmount, setFireAmount] = useState(0);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => setUser(null));
  }, []);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });

  const today = new Date().toISOString().split("T")[0];

  const { data: todayMeals = [] } = useQuery({
    queryKey: ["meals", today, user?.email],
    queryFn: async () => {
      return base44.entities.MealLog.filter(
        { created_by: user?.email, date: today },
        "-meal_time"
      );
    },
    enabled: !!user?.email,
    staleTime: 10000,
  });

  const { data: friendsList = [] } = useQuery({
    queryKey: ["friends", user?.email],
    queryFn: async () => {
      const sent = await base44.entities.Friend.filter({ user_email: user?.email });
      const received = await base44.entities.Friend.filter({ friend_email: user?.email });
      return [...sent, ...received].filter(f => f.status === "accepted");
    },
    enabled: !!user?.email,
  });

  const { data: groupsList = [] } = useQuery({
    queryKey: ["groups", user?.email],
    queryFn: async () => {
      const members = await base44.entities.GroupMember.filter({ user_email: user?.email });
      return members;
    },
    enabled: !!user?.email,
  });

  const { data: topGroupMembers = [] } = useQuery({
    queryKey: ["topGroupMembers", groupsList],
    queryFn: async () => {
      if (groupsList.length === 0) return [];
      
      // Get first group's top members
      const firstGroupId = groupsList[0].group_id;
      const members = await base44.entities.GroupMember.filter({ group_id: firstGroupId });
      const profiles = await Promise.all(
        members.map(async (m) => {
          const p = await base44.entities.UserProfile.filter({ created_by: m.user_email });
          return { name: m.display_name, fire: p[0]?.fire_total || 0 };
        })
      );
      return profiles.sort((a, b) => b.fire - a.fire);
    },
    enabled: groupsList.length > 0,
  });

  if (!profileLoading && !profile && user) {
    window.location.href = "/Onboarding";
    return null;
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center">
        <motion.div
          className="text-white text-lg"
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {t("loading")}...
        </motion.div>
      </div>
    );
  }

  const totalCaloriesToday = todayMeals.reduce((sum, meal) => sum + (meal.estimated_calories || 0), 0);
  const caloriesGoal = profile?.calories_goal || 2000;



  const handleMealSaved = (addedCalories) => {
    queryClient.invalidateQueries({ queryKey: ["meals", today] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    
    // Award fire for meal photo
    if (addedCalories > 0) {
      setFireAmount(2);
      setShowFireAnimation(true);
      
      // Update fire total in profile
      if (profile) {
        base44.entities.UserProfile.update(profile.id, {
          fire_total: (profile.fire_total || 0) + 2
        });
      }
    }
    
    toast.success("🍽️ " + t("meal_saved"));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
      <OwnerRoleChecker user={user} profile={profile} />

      {/* Background effects */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24 pt-6 relative z-10 space-y-6">
        {/* Header with greeting and status bubble */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-start justify-between gap-4"
        >
          <div className="flex-1 text-center space-y-1">
            <p className="text-teal-200 text-xs font-semibold uppercase tracking-wide">
              {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
            </p>
            <h1 className="text-4xl font-black text-white">
              {profile?.display_name || t("welcome")}
            </h1>
          </div>
          
          {/* Status Bubble */}
          <StatusBubble 
            profile={profile} 
            onUpdate={() => queryClient.invalidateQueries(["profile"])} 
          />
        </motion.div>

        {/* CORE: Streak Banner */}
        <StreakBanner streak={profile?.current_streak || 0} fireTotal={profile?.fire_total || 0} />

        {/* Daily Calorie Goal - Big Focus */}
        <DailyCalorieGoal consumed={totalCaloriesToday} goal={caloriesGoal} />
        
        {/* Recent Activity Timeline */}
        <RecentActivityTimeline recentMeals={todayMeals} profile={profile} />
        
        {/* Last Meal Preview */}
        <LastMealPreview 
          meal={todayMeals[0] || null} 
          onClick={() => navigate(createPageUrl("CameraScreen"))}
        />

        {/* MAIN ACTION: Add Meal Button */}
        <AddMealButton onClick={() => navigate(createPageUrl("CameraScreen"))} />

        {/* Daily Missions */}
        <DailyMissions
          todayMeals={todayMeals}
          consumed={totalCaloriesToday}
          goal={caloriesGoal}
          profile={profile}
        />

        {/* Group Leaderboard Shortcut */}
        {topGroupMembers.length > 0 && (
          <GroupLeaderboardShortcut topMembers={topGroupMembers} />
        )}

        {/* Social Preview */}
        <SocialPreview
          friendsCount={friendsList.length}
          groupsCount={groupsList.length}
          userStreak={profile?.current_streak || 0}
        />
      </div>

      {/* Meal Result Modal */}
      {previewUrl && (
        <MealResultCard
          profile={profile}
          onSave={handleMealSaved}
        />
      )}

      {/* Fire Animation */}
      <FireIncreaseAnimation 
        show={showFireAnimation} 
        amount={fireAmount}
        onComplete={() => setShowFireAnimation(false)}
      />
    </div>
  );
}