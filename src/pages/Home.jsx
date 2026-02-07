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
import { Camera, Flame } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import MealResultCard from "@/components/home/MealResultCard";
import FireIncreaseAnimation from "@/components/home/FireIncreaseAnimation";
import MealSavedCelebration from "@/components/home/MealSavedCelebration";
import MicroProgressPulse from "@/components/home/MicroProgressPulse";
import { Button } from "@/components/ui/button";
import AINutritionConfidence from "@/components/home/AINutritionConfidence";
import QuickActionButton from "@/components/QuickActionButton";
import HomeErrorFallback from "@/components/HomeErrorFallback";
import PullToRefresh from "@/components/PullToRefresh";

// Import optimized fetcher with timeout and retry
import { fetchWithRetry, withTimeout, useSafeQuery } from "@/components/DataFetcher";

const fetchWithTimeout = (promise, timeoutMs = 8000) => {
  return withTimeout(promise, timeoutMs);
};

export default function Home() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { previewUrl } = useMeal();
  const { user, profile: cachedProfile, todayMeals: cachedMeals, friends: cachedFriends, isInitialized } = useAppState();
  const [safeMode, setSafeMode] = React.useState(localStorage.getItem('SAFE_MODE') === '1');
  const [showFireAnimation, setShowFireAnimation] = useState(false);
  const [fireAmount, setFireAmount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [showMicroPulse, setShowMicroPulse] = useState(false);
  const [microPulseMessage, setMicroPulseMessage] = useState("");

  const { data: profile = null, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.email],
    queryFn: async () => {
      try {
        return await fetchWithRetry(
          () => base44.entities.UserProfile.filter({ created_by: user?.email }).then(r => r[0] || null)
        );
      } catch (err) {
        console.warn('[HOME] Profile fetch timeout/error', err);
        return null;
      }
    },
    enabled: !!user?.email && !cachedProfile,
    initialData: cachedProfile,
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
  });

  const today = new Date().toISOString().split("T")[0];

  const { data: todayMeals = [], isLoading: mealsLoading } = useQuery({
  queryKey: ["meals", today, user?.email],
  queryFn: async () => {
  return await fetchWithRetry(
  () => base44.entities.MealLog.filter(
    { created_by: user?.email, date: today },
    "-meal_time"
  )
  );
  },
  enabled: !!user?.email && !cachedMeals,
  initialData: cachedMeals || [],
  staleTime: 1 * 60 * 1000,
  keepPreviousData: true,
  });

  const { data: friends = [], isLoading: friendsLoading } = useQuery({
    queryKey: ["friends", user?.email],
    queryFn: async () => {
      const sent = await fetchWithRetry(
        () => base44.entities.Friend.filter({ created_by: user?.email })
      );
      return sent.filter(f => f.status === "accepted");
    },
    enabled: !!user?.email && !cachedFriends,
    initialData: cachedFriends || [],
    staleTime: 5 * 60 * 1000,
    keepPreviousData: true,
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

  // SAFE MODE: minimal rendering
  if (safeMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 pb-24">
        <div className="max-w-lg mx-auto px-5 pt-8 space-y-6">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
            <h1 className="text-3xl font-black text-white mb-2">{t('home')}</h1>
            <p className="text-white/60 text-sm">Modo seguro activado</p>
          </motion.div>
          
          {profile && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/10 rounded-2xl p-6 border border-white/20"
            >
              <p className="text-white/60 text-sm mb-1">{t('calories')}</p>
              <p className="text-white text-2xl font-bold">
                {todayMeals?.reduce((sum, m) => sum + (m.estimated_calories || 0), 0) || 0} kcal
              </p>
            </motion.div>
          )}
          
          <Button
            onClick={() => navigate(createPageUrl("CameraScreen"))}
            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500"
          >
            {t('log_your_meal')}
          </Button>
          
          <button
            onClick={() => window.location.reload()}
            className="w-full h-12 bg-white/10 text-white rounded-xl hover:bg-white/20 transition"
          >
            Recargar
          </button>
        </div>
      </div>
    );
  }

  // Show skeleton only if initializing AND profile fetch is loading (not profile is empty)
  if (!isInitialized && profileLoading) {
    return <HomeSkeleton />;
  }

  // Timeout fallback after 3 seconds of loading with no profile
  const [showTimeout, setShowTimeout] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (profileLoading && !profile) {
        setShowTimeout(true);
      }
    }, 3000);
    return () => clearTimeout(timer);
  }, [profileLoading, profile]);

  if (showTimeout && profileLoading && !profile) {
    return (
      <HomeErrorFallback
        onRetry={() => {
          setShowTimeout(false);
          queryClient.invalidateQueries({ queryKey: ["profile"] });
        }}
        error={new Error("Profile loading timeout")}
      />
    );
  }

  // If fully initialized but no profile, redirect to onboarding
  if (isInitialized && !profile && user) {
    window.location.href = "/Onboarding";
    return null;
  }

  return (
    <ErrorBoundary screen="Home">
      <PullToRefresh>
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
          <div className="absolute inset-0 opacity-20 pointer-events-none">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
            <div className="absolute top-20 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
          </div>

          <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10 space-y-6">
          {/* Streak Card - Premium Design */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-orange-500/20 via-red-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-7 border border-orange-500/30 shadow-2xl shadow-orange-500/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-orange-400/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-red-400/10 rounded-full blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-400 to-pink-500 rounded-full" />
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

          {/* Daily Progress Rings - Premium Design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-br from-slate-800/60 to-slate-900/60 backdrop-blur-xl rounded-3xl p-7 border border-white/10 shadow-2xl shadow-slate-900/50 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5" />
            <div className="absolute top-0 right-0 w-32 h-32 bg-teal-400/10 rounded-full blur-3xl" />
            <h3 className="text-white font-bold text-xl mb-6 relative z-10">{t("today_progress")}</h3>
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

          {/* Precision Confidence - Interactive */}
          <AINutritionConfidence todayMeals={todayMeals} profile={profile} />

          {/* Primary CTA */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Button
              onClick={() => navigate(createPageUrl("CameraScreen"))}
              className="w-full h-16 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:from-emerald-600 hover:via-teal-600 hover:to-cyan-600 text-white font-bold text-lg rounded-2xl shadow-2xl shadow-emerald-500/30 active:scale-[0.98] transition-transform"
            >
              <Camera size={24} className="mr-3" />
              {t("log_your_meal")}
            </Button>
          </motion.div>

          {/* Friend Activity Highlights - ONLY if real friends exist */}
          {friends.length > 0 && (
            <motion.button
              onClick={() => navigate(createPageUrl("Social"))}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              whileTap={{ scale: 0.98 }}
              className="w-full bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/30 shadow-lg text-left active:scale-[0.98] transition-transform"
            >
              <div className="flex items-center gap-4">
                <div className="flex -space-x-3">
                  {friends.slice(0, 3).map((friend, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, x: -10 }}
                      animate={{ scale: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 border-3 border-slate-900 flex items-center justify-center text-white font-bold shadow-lg"
                    >
                      {friend.display_name?.charAt(0) || "?"}
                    </motion.div>
                  ))}
                </div>
                <div className="flex-1">
                  <p className="text-white font-bold text-sm mb-0.5">{t("friends_active")}</p>
                  <p className="text-purple-200 text-xs">{friends.length} {t("friends")}</p>
                </div>
                <div className="text-purple-300 text-xs font-semibold">
                  {lang === "es" ? "Ver →" : "View →"}
                </div>
              </div>
            </motion.button>
          )}

          {/* Recent Activity - Premium Design */}
          {todayMeals.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 backdrop-blur-xl rounded-3xl p-6 border border-blue-500/20 shadow-lg relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/10 rounded-full blur-3xl" />
              <h3 className="text-white font-bold text-lg mb-4 relative z-10">{t("recent_activity")}</h3>
              <div className="space-y-3 relative z-10">
                {todayMeals.slice(0, 3).map((meal, i) => (
                  <motion.div 
                    key={i} 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className="flex items-center gap-4 bg-white/5 rounded-xl p-3 border border-white/10"
                  >
                    {meal.photo_url && (
                      <img 
                        src={meal.photo_url} 
                        alt="" 
                        className="w-14 h-14 rounded-xl object-cover shadow-md" 
                        loading="lazy"
                      />
                    )}
                    <div className="flex-1">
                      <p className="text-white text-sm font-semibold">{meal.meal_type || t("meal")}</p>
                      <p className="text-cyan-300 text-xs font-medium">{meal.estimated_calories || 0} kcal</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>

          {previewUrl && <MealResultCard profile={profile} onSave={handleMealSaved} />}
          <FireIncreaseAnimation show={showFireAnimation} amount={fireAmount} onComplete={() => setShowFireAnimation(false)} />
          <MealSavedCelebration show={showCelebration} onComplete={() => setShowCelebration(false)} />
          <MicroProgressPulse show={showMicroPulse} message={microPulseMessage} onComplete={() => setShowMicroPulse(false)} />
          <QuickActionButton />
        </div>
      </PullToRefresh>
    </ErrorBoundary>
  );
}