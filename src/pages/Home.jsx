import React, { useState, useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { HomeSkeleton } from "@/components/ui/ScreenSkeleton";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/components/AppStateContext";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { useMeal } from "@/components/MealContext";
import { createPageUrl } from "@/utils";
import DailyMissions from "@/components/home/DailyMissions";
import MealResultCard from "@/components/home/MealResultCard";
import FireIncreaseAnimation from "@/components/home/FireIncreaseAnimation";
import OwnerRoleChecker from "@/components/OwnerRoleChecker";
import ErrorBoundary from "@/components/ErrorBoundary";
import MealSavedCelebration from "@/components/home/MealSavedCelebration";
import DailyMacroRing from "@/components/home/DailyMacroRing";
import QuickAddButton from "@/components/home/QuickAddButton";
import MomentumHeroCard from "@/components/home/MomentumHeroCard";
import DynamicGreeting from "@/components/home/DynamicGreeting";
import NextActionCard from "@/components/home/NextActionCard";
import SocialHighlight from "@/components/home/SocialHighlight";
import MicroProgressPulse from "@/components/home/MicroProgressPulse";
import AIInsightClickable from "@/components/home/AIInsightClickable";

// Memoize to prevent recreating on every render
const MemoizedMissions = React.memo(DailyMissions);

export default function Home() {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { previewUrl } = useMeal();
  const { user, profile: cachedProfile, todayMeals: cachedMeals, isInitialized } = useAppState();
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

  const { data: friendsList = [] } = useQuery({
    queryKey: ["friends", user?.email],
    queryFn: async () => {
      const sent = await base44.entities.Friend.filter({ user_email: user?.email });
      const received = await base44.entities.Friend.filter({ friend_email: user?.email });
      return [...sent, ...received].filter(f => f.status === "accepted");
    },
    enabled: !!user?.email,
    keepPreviousData: true,
  });

  const { data: groupsList = [] } = useQuery({
    queryKey: ["groups", user?.email],
    queryFn: async () => {
      const members = await base44.entities.GroupMember.filter({ user_email: user?.email });
      return members;
    },
    enabled: !!user?.email,
    keepPreviousData: true,
  });

  const { data: topGroupMembers = [] } = useQuery({
    queryKey: ["topGroupMembers", groupsList],
    queryFn: async () => {
      if (groupsList.length === 0) return [];
      
      // Get first group's top members
      const firstGroupId = groupsList[0].group_id;
      const members = await base44.entities.GroupMember.filter({ group_id: firstGroupId });
      const profiles = await Promise.all(
        members.slice(0, 5).map(async (m) => { // Limit to 5 for performance
          const p = await base44.entities.UserProfile.filter({ created_by: m.user_email });
          return { name: m.display_name, fire: p[0]?.fire_total || 0 };
        })
      );
      return profiles.sort((a, b) => b.fire - a.fire);
    },
    enabled: groupsList.length > 0,
    keepPreviousData: true,
  });

  // Memoize expensive calculations
  const { totalCaloriesToday, totalProtein, totalCarbs, totalFats } = useMemo(() => ({
    totalCaloriesToday: todayMeals.reduce((sum, meal) => sum + (meal.estimated_calories || 0), 0),
    totalProtein: todayMeals.reduce((sum, meal) => sum + (meal.estimated_protein || 0), 0),
    totalCarbs: todayMeals.reduce((sum, meal) => sum + (meal.estimated_carbs || 0), 0),
    totalFats: todayMeals.reduce((sum, meal) => sum + (meal.estimated_fats || 0), 0),
  }), [todayMeals]);
  
  const caloriesGoal = profile?.calories_goal || 2000;

  const handleMealSaved = async (addedCalories) => {
    // Optimistic update - show celebration immediately
    setShowCelebration(true);
    
    // Micro progress feedback
    setMicroPulseMessage(lang === "es" ? "¡Comida registrada!" : "Meal logged!");
    setShowMicroPulse(true);
    
    // Award fire for meal photo
    if (addedCalories > 0) {
      setFireAmount(2);
      setShowFireAnimation(true);
      
      // Optimistic fire update
      if (profile) {
        const newFireTotal = (profile.fire_total || 0) + 2;
        
        // Update cache immediately
        queryClient.setQueryData(["profile", user?.email], {
          ...profile,
          fire_total: newFireTotal
        });
        
        // Sync to backend in background
        base44.entities.UserProfile.update(profile.id, {
          fire_total: newFireTotal
        }).catch(err => {
          console.error("Fire update failed:", err);
          // Revert on error
          queryClient.invalidateQueries({ queryKey: ["profile"] });
        });
      }
    }
    
    // Invalidate to refresh with real data
    queryClient.invalidateQueries({ queryKey: ["meals", today] });
  };

  // Show skeleton while loading
  if (!isInitialized || !profile) {
    return <HomeSkeleton />;
  }

  // Redirect to onboarding if no profile
  if (!profile && user) {
    window.location.href = "/Onboarding";
    return null;
  }

  return (
    <ErrorBoundary screen="Home">
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
        <OwnerRoleChecker user={user} profile={profile} />

      {/* Background effects */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>

      <div className="max-w-lg mx-auto px-4 pb-24 pt-6 relative z-10 space-y-5">
        {/* Dynamic Greeting */}
        <DynamicGreeting 
          profile={profile}
          todayMeals={todayMeals}
          caloriesGoal={caloriesGoal}
        />

        {/* Note of the day - only in Home, check 24h expiry */}
        {profile?.status_text && (() => {
          const isExpired = profile?.status_updated_at ? 
            (new Date() - new Date(profile.status_updated_at)) / (1000 * 60 * 60) >= 24 : true;
          return !isExpired && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex justify-center"
            >
              <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20">
                <p className="text-white/80 text-sm">"{profile.status_text}"</p>
              </div>
            </motion.div>
          );
        })()}

        {/* Momentum Hero Card */}
        <MomentumHeroCard 
          streak={profile?.current_streak || 0} 
          profile={profile}
        />

        {/* Next Action Card */}
        <NextActionCard 
          todayMeals={todayMeals}
          caloriesGoal={caloriesGoal}
          totalCalories={totalCaloriesToday}
          friendsCount={friendsList.length}
        />

        {/* Daily Macro Ring - Enhanced nutrition view */}
        <DailyMacroRing 
          consumed={totalCaloriesToday} 
          goal={caloriesGoal}
          protein={totalProtein}
          carbs={totalCarbs}
          fats={totalFats}
        />

        {/* AI Insight Clickable */}
        <AIInsightClickable 
          todayMeals={todayMeals} 
          profile={profile}
          caloriesGoal={caloriesGoal}
        />

        {/* Daily Missions - Only show if has meals */}
        {todayMeals.length > 0 && (
          <MemoizedMissions
            todayMeals={todayMeals}
            consumed={totalCaloriesToday}
            goal={caloriesGoal}
            profile={profile}
          />
        )}

        {/* Social Highlight */}
        <SocialHighlight 
          friendsCount={friendsList.length}
          topFriendStreak={friendsList.length > 0 ? Math.max(...friendsList.map(f => f.current_streak || 0)) : 0}
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

      {/* Meal Saved Celebration */}
      <MealSavedCelebration 
        show={showCelebration}
        onComplete={() => setShowCelebration(false)}
      />

      {/* Micro Progress Pulse */}
      <MicroProgressPulse 
        show={showMicroPulse}
        message={microPulseMessage}
        onComplete={() => setShowMicroPulse(false)}
      />

      {/* Floating Quick Add Button */}
      <QuickAddButton onClick={() => navigate(createPageUrl("CameraScreen"))} />
      </div>
      </ErrorBoundary>
      );
      }