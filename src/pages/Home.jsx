import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import MealPhotoCapture from "@/components/home/MealPhotoCapture";
import MealResultCard from "@/components/home/MealResultCard";
import AddMealButton from "@/components/home/AddMealButton";
import DailyCalorieGoal from "@/components/home/DailyCalorieGoal";
import DailyMissions from "@/components/home/DailyMissions";
import StreakBanner from "@/components/home/StreakBanner";
import SocialPreview from "@/components/home/SocialPreview";
import OwnerRoleChecker from "@/components/OwnerRoleChecker";

export default function Home() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showMealCapture, setShowMealCapture] = useState(false);
  const [showMealResult, setShowMealResult] = useState(false);
  const [selectedMealFile, setSelectedMealFile] = useState(null);

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
          {t("loading") || "Loading"}...
        </motion.div>
      </div>
    );
  }

  const totalCaloriesToday = todayMeals.reduce((sum, meal) => sum + (meal.estimated_calories || 0), 0);
  const caloriesGoal = profile?.calories_goal || 2000;

  const handleMealPhotoSelected = (file) => {
    setSelectedMealFile(file);
    setShowMealCapture(false);
    setShowMealResult(true);
  };

  const handleMealSaved = () => {
    setShowMealResult(false);
    setSelectedMealFile(null);
    queryClient.invalidateQueries({ queryKey: ["meals", today] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
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
        {/* Header with greeting */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-1"
        >
          <p className="text-teal-200 text-xs font-semibold uppercase tracking-wide">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' })}
          </p>
          <h1 className="text-4xl font-black text-white">
            {profile?.display_name || t("welcome")}
          </h1>
        </motion.div>

        {/* CORE: Streak Banner */}
        <StreakBanner streak={profile?.current_streak || 0} fireTotal={profile?.fire_total || 0} />

        {/* MAIN ACTION: Add Meal Button */}
        <AddMealButton onClick={() => setShowMealCapture(true)} />

        {/* Daily Calorie Goal - Big Focus */}
        <DailyCalorieGoal consumed={totalCaloriesToday} goal={caloriesGoal} />

        {/* Daily Missions */}
        <DailyMissions
          todayMeals={todayMeals}
          consumed={totalCaloriesToday}
          goal={caloriesGoal}
          profile={profile}
        />

        {/* Social Preview */}
        <SocialPreview
          friendsCount={friendsList.length}
          groupsCount={groupsList.length}
          userStreak={profile?.current_streak || 0}
        />
      </div>

      {/* Meal Photo Capture Modal */}
      <MealPhotoCapture
        isOpen={showMealCapture}
        onClose={() => setShowMealCapture(false)}
        onPhotoSelected={handleMealPhotoSelected}
      />

      {/* Meal Result Modal */}
      <AnimatePresence>
        {showMealResult && selectedMealFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end"
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full bg-slate-900 rounded-t-3xl p-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4 sticky top-0">
                <h2 className="text-xl font-bold text-white">{t("meal_analysis")}</h2>
                <button
                  onClick={() => setShowMealResult(false)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <MealResultCard
                file={selectedMealFile}
                profile={profile}
                onSave={handleMealSaved}
                onCancel={() => setShowMealResult(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}