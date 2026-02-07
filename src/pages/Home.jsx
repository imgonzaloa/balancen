import React, { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HomeSkeleton } from "@/components/ui/ScreenSkeleton";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/components/AppStateContext";
import { motion } from "framer-motion";
import { useTranslation } from "@/components/TranslationProvider";
import { useMeal } from "@/components/MealContext";
import { createPageUrl } from "@/utils";
import { Camera, Flame, Target, Users } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import MealResultCard from "@/components/home/MealResultCard";
import FireIncreaseAnimation from "@/components/home/FireIncreaseAnimation";
import MealSavedCelebration from "@/components/home/MealSavedCelebration";
import MicroProgressPulse from "@/components/home/MicroProgressPulse";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { previewUrl } = useMeal();
  const { user, profile: cachedProfile, todayMeals: cachedMeals, friends: cachedFriends, isInitialized } = useAppState();
  const [showFireAnimation, setShowFireAnimation] = useState(false);
  const [fireAmount, setFireAmount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showMicroPulse, setShowMicroPulse] = useState(false);
  const [microPulseMessage, setMicroPulseMessage] = useState("");

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email && !cachedProfile,
    initialData: cachedProfile,
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
    enabled: !!user?.email && !cachedMeals,
    initialData: cachedMeals || [],
  });

  const { data: friends = [] } = useQuery({
    queryKey: ["friends", user?.email],
    queryFn: async () => {
      const sent = await base44.entities.Friend.filter({ created_by: user?.email });
      return sent.filter(f => f.status === "accepted");
    },
    enabled: !!user?.email && !cachedFriends,
    initialData: cachedFriends || [],
  });

  const { totalCaloriesToday, totalProtein } = useMemo(() => ({
    totalCaloriesToday: todayMeals.reduce((sum, meal) => sum + (meal.estimated_calories || 0), 0),
    totalProtein: todayMeals.reduce((sum, meal) => sum + (meal.estimated_protein || 0), 0),
  }), [todayMeals]);
  
  const caloriesGoal = profile?.calories_goal || 2000;
  const proteinGoal = Math.round(profile?.weight ? profile.weight * 2 : 150);

  const caloriesPercent = Math.min((totalCaloriesToday / caloriesGoal) * 100, 100);
  const proteinPercent = Math.min((totalProtein / proteinGoal) * 100, 100);

  const handleMealSaved = async (addedCalories) => {
    setShowCelebration(true);
    setMicroPulseMessage(t("meal_logged"));
    setShowMicroPulse(true);
    
    if (addedCalories > 0) {
      setFireAmount(2);
      setShowFireAnimation(true);
      
      if (profile) {
        const newFireTotal = (profile.fire_total || 0) + 2;
        queryClient.setQueryData(["profile", user?.email], {
          ...profile,
          fire_total: newFireTotal
        });
        
        base44.entities.UserProfile.update(profile.id, {
          fire_total: newFireTotal
        }).catch(() => {
          queryClient.invalidateQueries({ queryKey: ["profile"] });
        });
      }
    }
    
    queryClient.invalidateQueries({ queryKey: ["meals", today] });
  };

  if (!isInitialized || !profile) {
    return <HomeSkeleton />;
  }

  if (!profile && user) {
    window.location.href = "/Onboarding";
    return null;
  }

  return (
    <ErrorBoundary screen="Home">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
          <div className="absolute top-20 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        </div>

        <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10 space-y-6">
          {/* Streak Card */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-500/20 via-red-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-6 border border-orange-500/30 shadow-2xl relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-400/10 rounded-full blur-3xl" />
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl flex items-center justify-center shadow-lg"
                >
                  <Flame size={32} className="text-white" />
                </motion.div>
                <div>
                  <p className="text-white/70 text-sm font-medium">{t("current_streak")}</p>
                  <motion.p 
                    key={profile?.current_streak}
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                    className="text-white text-4xl font-black"
                  >
                    {profile?.current_streak || 0}
                  </motion.p>
                  <p className="text-orange-200 text-xs font-medium">{t("days_in_a_row")}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/70 text-xs mb-1">{t("total_fire")}</p>
                <motion.p 
                  key={profile?.fire_total}
                  initial={{ scale: 1.2 }}
                  animate={{ scale: 1 }}
                  className="text-orange-300 text-3xl font-black"
                >
                  {profile?.fire_total || 0}
                </motion.p>
              </div>
            </div>
          </motion.div>

          {/* Daily Progress Rings */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5" />
            <h3 className="text-white font-bold text-lg mb-5 relative z-10">{t("today_progress")}</h3>
            <div className="grid grid-cols-2 gap-4 relative z-10">
              {/* Calories Ring */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-3">
                  <svg width="128" height="128" className="transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#caloriesGradient)"
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 56}
                      initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - caloriesPercent / 100) }}
                      transition={{ duration: 1.5, ease: "easeOut" }}
                    />
                    <defs>
                      <linearGradient id="caloriesGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.p 
                      key={totalCaloriesToday}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-white text-2xl font-black"
                    >
                      {Math.round(totalCaloriesToday)}
                    </motion.p>
                    <p className="text-white/40 text-[10px]">/ {caloriesGoal}</p>
                  </div>
                </div>
                <p className="text-white/80 font-semibold text-sm">{t("calories")}</p>
              </div>

              {/* Protein Ring */}
              <div className="text-center">
                <div className="relative w-32 h-32 mx-auto mb-3">
                  <svg width="128" height="128" className="transform -rotate-90">
                    <circle cx="64" cy="64" r="56" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
                    <motion.circle
                      cx="64"
                      cy="64"
                      r="56"
                      stroke="url(#proteinGradient)"
                      strokeWidth="10"
                      fill="none"
                      strokeLinecap="round"
                      strokeDasharray={2 * Math.PI * 56}
                      initial={{ strokeDashoffset: 2 * Math.PI * 56 }}
                      animate={{ strokeDashoffset: 2 * Math.PI * 56 * (1 - proteinPercent / 100) }}
                      transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                    />
                    <defs>
                      <linearGradient id="proteinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" />
                        <stop offset="100%" stopColor="#8b5cf6" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <motion.p 
                      key={totalProtein}
                      initial={{ scale: 1.3, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-white text-2xl font-black"
                    >
                      {Math.round(totalProtein)}
                    </motion.p>
                    <p className="text-white/40 text-[10px]">/ {proteinGoal}g</p>
                  </div>
                </div>
                <p className="text-white/80 font-semibold text-sm">{t("protein")}</p>
              </div>
            </div>

            {/* Meals Logged Counter */}
            <div className="mt-5 pt-5 border-t border-white/10 text-center">
              <p className="text-white/60 text-xs mb-1">{t("meals_logged_today")}</p>
              <p className="text-white text-xl font-bold">{todayMeals.length}/3</p>
            </div>
          </motion.div>

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={() => navigate(createPageUrl("CameraScreen"))}
              className="w-full h-16 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-emerald-500/30"
            >
              <Camera size={24} className="mr-3" />
              {t("log_your_meal")}
            </Button>
          </motion.div>

          {/* Friend Activity Highlights */}
          {friends.length > 0 && (
            <motion.button
              onClick={() => navigate(createPageUrl("Social"))}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="w-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/30 text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Users size={24} className="text-purple-300" />
                  <div>
                    <p className="text-white font-semibold">{t("friends_active")}</p>
                    <p className="text-white/60 text-sm">{friends.length} {t("friends")}</p>
                  </div>
                </div>
                <div className="flex -space-x-2">
                  {friends.slice(0, 3).map((friend, i) => (
                    <div
                      key={i}
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-2 border-slate-900 flex items-center justify-center text-white font-bold text-sm"
                    >
                      {friend.display_name?.charAt(0) || "?"}
                    </div>
                  ))}
                </div>
              </div>
            </motion.button>
          )}

          {/* Recent Activity */}
          {todayMeals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-white/5 backdrop-blur-xl rounded-2xl p-5 border border-white/10"
            >
              <h3 className="text-white font-bold mb-4">{t("recent_activity")}</h3>
              <div className="space-y-3">
                {todayMeals.slice(0, 3).map((meal, i) => (
                  <div key={i} className="flex items-center gap-3">
                    {meal.photo_url && (
                      <img src={meal.photo_url} alt="" className="w-12 h-12 rounded-xl object-cover" />
                    )}
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{meal.meal_type || t("meal")}</p>
                      <p className="text-white/60 text-xs">{meal.estimated_calories || 0} kcal</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

        {previewUrl && <MealResultCard profile={profile} onSave={handleMealSaved} />}
        <FireIncreaseAnimation show={showFireAnimation} amount={fireAmount} onComplete={() => setShowFireAnimation(false)} />
        <MealSavedCelebration show={showCelebration} onComplete={() => setShowCelebration(false)} />
        <MicroProgressPulse show={showMicroPulse} message={microPulseMessage} onComplete={() => setShowMicroPulse(false)} />
      </div>
    </ErrorBoundary>
  );
}