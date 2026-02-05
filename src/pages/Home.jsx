import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Users, Award, Settings, Flame, TrendingUp } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";

import StreakFire from "@/components/ui/StreakFire";
import QuickCheckIn from "@/components/home/QuickCheckIn";
import WeekProgress from "@/components/home/WeekProgress";
import StepsCounter from "@/components/home/StepsCounter";
import WeightTracker from "@/components/home/WeightTracker";
import CalorieTracker from "@/components/nutrition/CalorieTracker";
import FirstStreakModal from "@/components/home/FirstStreakModal";
import AIHealthInsights from "@/components/ai/AIHealthInsights";
import WeeklySummary from "@/components/ai/WeeklySummary";
import ChallengeSuggestions from "@/components/ai/ChallengeSuggestions";
import AIPremiumUpsell from "@/components/ai/AIPremiumUpsell";
import { useTranslation } from "@/components/TranslationProvider";
import { UIVersionManager } from "@/components/UIVersionManager";
import FriendsList from "@/components/home/FriendsList";
import SocialCompletionStatus from "@/components/home/SocialCompletionStatus";
import SocialActivityFeed from "@/components/home/SocialActivityFeed";

export default function Home() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showFirstStreakModal, setShowFirstStreakModal] = useState(false);
  const [hasShownPaywall, setHasShownPaywall] = useState(false);

  useEffect(() => {
    // Force fresh user data on mount
    base44.auth.me().then(setUser).catch(() => setUser(null));
    
    // Invalidate all queries on mount to force fresh data
    queryClient.invalidateQueries();
  }, []);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile", user?.email],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkIns", user?.email],
    queryFn: async () => {
      return base44.entities.DailyCheckIn.filter(
        { created_by: user?.email },
        "-date",
        30
      );
    },
    enabled: !!user?.email,
    staleTime: 0,
    cacheTime: 0,
    refetchOnMount: "always",
  });

  const { data: todayMeals = [] } = useQuery({
    queryKey: ["meals", today, user?.email],
    queryFn: async () => {
      return base44.entities.MealLog.filter(
        { created_by: user?.email, date: today },
        "-meal_time"
      );
    },
    enabled: !!user?.email,
    staleTime: 0,
    refetchOnMount: "always",
  });
  const todayCheckIn = checkIns.find(c => c.date === today);
  const yesterdayCheckIn = checkIns.find(c => c.date === yesterday);

  const createCheckInMutation = useMutation({
    mutationFn: async (data) => {
      const existing = checkIns.find(c => c.date === data.date);
      
      // Check goal achievements
      const stepsGoalMet = profile?.steps_goal && data.steps >= profile.steps_goal;
      const caloriesGoalMet = profile?.calories_goal && todayMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0) <= profile.calories_goal;
      
      const checkInData = {
        ...data,
        steps_goal_met: stepsGoalMet || false,
        calories_goal_met: caloriesGoalMet || false,
        steps_fire_awarded: stepsGoalMet && !existing?.steps_fire_awarded,
        calories_fire_awarded: caloriesGoalMet && !existing?.calories_fire_awarded,
      };
      
      if (existing) {
        return base44.entities.DailyCheckIn.update(existing.id, checkInData);
      }
      return base44.entities.DailyCheckIn.create(checkInData);
    },
    onSuccess: async (newCheckIn) => {
      queryClient.invalidateQueries(["checkIns"]);

      // Update streak
      if (profile) {
        const newStreak = profile.current_streak + 1;
        const longestStreak = Math.max(profile.longest_streak, newStreak);
        const totalCheckins = profile.total_checkins + 1;

        // FREE PLAN: Cap streak at 3 days
        const finalStreak = (!profile.is_premium && newStreak > 3) ? 3 : newStreak;

        const profileUpdates = {
          current_streak: finalStreak,
          longest_streak: longestStreak,
          total_checkins: totalCheckins,
        };

        // Update fire_total based on achievements
        let fireIncrement = 1; // Base fire for consistency

        // Auto-progression for steps goal
        if (newCheckIn.steps_goal_met && newCheckIn.steps_fire_awarded) {
          fireIncrement += 1; // +1 fire for steps goal

          const currentGoal = profile.steps_goal || 8000;
          let newGoal = currentGoal;

          if (currentGoal < 12000) {
            newGoal = currentGoal + 1000;
          } else if (currentGoal < 16000) {
            newGoal = currentGoal + 1500;
          }

          if (newGoal !== currentGoal && profile.is_premium) {
            profileUpdates.steps_goal = newGoal;
            toast.success(`${t("new_steps_goal")}: ${newGoal.toLocaleString()}`);
          }

          toast.success(t("steps_goal_achieved"));
        }

        // Auto-progression for calories goal (if enabled)
        if (newCheckIn.calories_goal_met && newCheckIn.calories_fire_awarded && profile.auto_adjust_calories_goal && profile.calories_goal) {
          fireIncrement += 1; // +1 fire for calories goal

          const currentGoal = profile.calories_goal;
          const minFloor = 1400;
          const newGoal = Math.max(currentGoal - 50, minFloor);

          if (newGoal !== currentGoal && profile.is_premium) {
            profileUpdates.calories_goal = newGoal;
            toast.success(`${t("new_calories_goal")}: ${newGoal}`);
          }

          toast.success(t("calories_goal_achieved"));
        }

        // Update fire_total
        profileUpdates.fire_total = (profile.fire_total || 0) + fireIncrement;

        await base44.entities.UserProfile.update(profile.id, profileUpdates);

        // Show first streak modal
        if (totalCheckins === 1) {
          setShowFirstStreakModal(true);
        }

        // Show paywall when reaching day 3 for free users
        if (finalStreak === 3 && !profile.is_premium) {
          setTimeout(() => {
            window.location.href = createPageUrl("Paywall");
          }, 2000);
        }

        // Check for badges
        const streakMilestones = [3, 7, 14, 30, 60, 100];
        for (const milestone of streakMilestones) {
          if (newStreak === milestone) {
            await base44.entities.Badge.create({
              badge_id: `streak_${milestone}_${user.email}_${Date.now()}`,
              user_email: user.email,
              badge_type: `streak_${milestone}`,
              earned_date: today,
            });
          }
        }

        // First check-in badge
        if (totalCheckins === 1) {
          await base44.entities.Badge.create({
            badge_id: `first_checkin_${user.email}`,
            user_email: user.email,
            badge_type: "first_checkin",
            earned_date: today,
          });
        }

        // First photo badge
        if (newCheckIn.food_photo_url) {
          const existingPhotoBadge = await base44.entities.Badge.filter({
            user_email: user.email,
            badge_type: "first_photo"
          });
          if (existingPhotoBadge.length === 0) {
            await base44.entities.Badge.create({
              badge_id: `first_photo_${user.email}`,
              user_email: user.email,
              badge_type: "first_photo",
              earned_date: today,
            });
          }
        }

        queryClient.invalidateQueries(["profile"]);
        queryClient.invalidateQueries(["friends"]);
        queryClient.invalidateQueries(["friendsStatus"]);
        }
        },
        });

        // Redirect to onboarding if no profile
        if (!profileLoading && !profile && user) {
        window.location.href = createPageUrl("Onboarding");
        return null;
        }

  const { t } = useTranslation();

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t("good_morning");
    if (hour < 19) return t("good_afternoon");
    return t("good_evening");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 relative overflow-hidden">
      {/* UI Version Manager - handles migrations */}
      <UIVersionManager user={user} profile={profile} />
      
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10">
        {/* Header */}
        <motion.div 
          className="flex justify-between items-start mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div>
            <p className="text-teal-200 text-sm font-medium mb-1">{greeting()}</p>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-white to-teal-100 bg-clip-text text-transparent">
              {profile?.display_name || user?.full_name?.split(" ")[0] || "Usuario"}
            </h1>
          </div>

          <StreakFire streak={profile?.current_streak || 0} />
        </motion.div>

        {/* Friends List */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <FriendsList currentUser={user} profile={profile} />
        </motion.div>

        {/* Today's Rewards */}
        {todayCheckIn && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
          >
            <p className="text-teal-200 text-sm font-medium mb-3">{t("today_rewards")}</p>
            <div className="flex gap-3">
              <div className={`flex-1 rounded-2xl p-4 border-2 ${todayCheckIn.completed ? 'bg-emerald-500/20 border-emerald-400' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Flame size={18} className={todayCheckIn.completed ? "text-emerald-300" : "text-slate-400"} />
                  <span className="text-xs text-white font-medium">{t("consistency_fire")}</span>
                </div>
                <p className="text-2xl font-bold text-white">{todayCheckIn.completed ? "✓" : "—"}</p>
              </div>

              <div className={`flex-1 rounded-2xl p-4 border-2 ${todayCheckIn.steps_goal_met ? 'bg-teal-500/20 border-teal-400' : 'bg-white/5 border-white/10'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Flame size={18} className={todayCheckIn.steps_goal_met ? "text-teal-300" : "text-slate-400"} />
                  <span className="text-xs text-white font-medium">{t("steps_fire")}</span>
                </div>
                <p className="text-2xl font-bold text-white">{todayCheckIn.steps_goal_met ? "✓" : "—"}</p>
              </div>

              {profile?.calories_goal && (
                <div className={`flex-1 rounded-2xl p-4 border-2 ${todayCheckIn.calories_goal_met ? 'bg-orange-500/20 border-orange-400' : 'bg-white/5 border-white/10'}`}>
                  <div className="flex items-center gap-2 mb-1">
                    <Flame size={18} className={todayCheckIn.calories_goal_met ? "text-orange-300" : "text-slate-400"} />
                    <span className="text-xs text-white font-medium">{t("calories_fire")}</span>
                  </div>
                  <p className="text-2xl font-bold text-white">{todayCheckIn.calories_goal_met ? "✓" : "—"}</p>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Mission Section */}
        {!todayCheckIn && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 }}
          >
            <h2 className="text-2xl font-bold text-white mb-1">Today's mission 🔥</h2>
            <p className="text-teal-200 text-sm font-medium mb-2">Keep your streak alive</p>
            
            {/* Streak Risk Warning */}
            <motion.div 
              className="flex items-center gap-2 mb-4 bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-3"
              animate={{ scale: [1, 1.02, 1] }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <span className="text-2xl">🔥</span>
              <div>
                <p className="text-red-300 font-bold text-sm">Your {profile?.current_streak || 0} day streak is at risk!</p>
                <p className="text-red-200/80 text-xs">Complete before midnight or lose it all</p>
              </div>
            </motion.div>
            
            {/* Primary CTA */}
            <motion.div
              animate={{ 
                scale: [1, 1.02, 1],
                boxShadow: [
                  "0 10px 40px rgba(251, 146, 60, 0.3)",
                  "0 15px 50px rgba(251, 146, 60, 0.5)",
                  "0 10px 40px rgba(251, 146, 60, 0.3)"
                ]
              }}
              transition={{ repeat: Infinity, duration: 2 }}
            >
              <Button
                onClick={() => document.getElementById('checkin-card')?.scrollIntoView({ behavior: 'smooth' })}
                className="w-full py-6 rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-bold text-lg shadow-2xl mb-2 border-2 border-orange-300/50"
              >
                COMPLETE TODAY
              </Button>
            </motion.div>
            
            {/* Progress Indicator */}
            <div className="text-center mb-3">
              <p className="text-xs text-orange-200 font-semibold">
                🔥 Today progress: 0/3 tasks completed
              </p>
            </div>
            
            {/* Future Anticipation Trigger */}
            <p className="text-center text-xs text-orange-200 font-semibold mb-4">
              🔥 {3 - (profile?.current_streak || 0) % 3} more days to unlock DOUBLE FIRE bonus
            </p>

            {/* Social Completion Indicators */}
            <SocialCompletionStatus user={user} />
            
            {/* Competition Trigger */}
            <motion.div
              className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-3 text-center mt-3"
              animate={{ scale: [1, 1.01, 1] }}
              transition={{ repeat: Infinity, duration: 3 }}
            >
              <p className="text-purple-200 font-bold text-sm">
                🔥 Complete now and jump ahead instantly
              </p>
            </motion.div>
            
            {/* Social Activity Feed */}
            <SocialActivityFeed user={user} />
          </motion.div>
        )}

        {/* Main Check-in Card */}
        <motion.div
          id="checkin-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <QuickCheckIn 
            onComplete={(data) => createCheckInMutation.mutateAsync(data)}
            todayCheckIn={todayCheckIn}
            yesterdayCheckIn={yesterdayCheckIn}
            profile={profile}
            showFireReward={true}
          />
        </motion.div>

        {/* Future Anticipation & Ranking */}
        {todayCheckIn && (
          <motion.div
            className="mt-4 space-y-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <motion.div 
              className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 text-center backdrop-blur-sm"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
            >
              <p className="text-amber-300 font-bold mb-1 flex items-center justify-center gap-2">
                <TrendingUp size={16} />
                You're #{profile?.current_streak || 1} in your friend group!
              </p>
              <p className="text-amber-200/80 text-xs">
                Keep it up to stay on top
              </p>
            </motion.div>
            <p className="text-center text-sm text-amber-300 font-semibold">
              ⚡ Tomorrow: Double fire bonus
            </p>
          </motion.div>
        )}

        {/* Calorie Tracker - Always visible */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <CalorieTracker 
            meals={todayMeals}
            date={today}
            caloriesGoal={profile?.calories_goal}
            onMealAdded={() => queryClient.invalidateQueries(["meals", today])}
          />
        </motion.div>

        {/* Today's Stats - Only show after check-in */}
        {todayCheckIn && (
          <motion.div
            className="grid grid-cols-1 gap-4 mt-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {todayCheckIn.steps > 0 && (
              <StepsCounter 
                steps={todayCheckIn.steps} 
                goal={profile?.daily_step_goal || 8000}
              />
            )}
            
            {todayCheckIn.weight && (
              <WeightTracker 
                currentWeight={todayCheckIn.weight}
                previousWeight={yesterdayCheckIn?.weight}
                startingWeight={profile?.starting_weight}
              />
            )}
          </motion.div>
        )}

        {/* Week Progress */}
        <motion.div
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <WeekProgress checkIns={checkIns} />
        </motion.div>

        {/* AI Features - Premium Only */}
        {profile?.is_premium ? (
          <>
            {/* AI Health Insights */}
            {profile?.ai_recommendations_enabled !== false && checkIns.length >= 3 && (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
              >
                <AIHealthInsights profile={profile} recentCheckIns={checkIns} />
              </motion.div>
            )}

            {/* Weekly Summary */}
            {checkIns.length >= 7 && profile?.current_streak >= 3 && (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <WeeklySummary profile={profile} checkIns={checkIns} />
              </motion.div>
            )}

            {/* Challenge Suggestions */}
            {profile?.current_streak >= 2 && (
              <motion.div
                className="mt-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                <ChallengeSuggestions profile={profile} checkIns={checkIns} />
              </motion.div>
            )}
          </>
        ) : (
          checkIns.length >= 2 && (
            <motion.div
              className="mt-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <AIPremiumUpsell />
            </motion.div>
          )
        )}

        {/* Quick Stats */}
        <motion.div
          className="grid grid-cols-2 gap-4 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="relative overflow-hidden rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-teal-400/30 to-emerald-400/30 rounded-full blur-2xl" />
            <p className="text-xs text-teal-100 mb-2 font-medium relative z-10">{t("total_checkins")}</p>
            <p className="text-3xl font-bold text-white relative z-10">{profile?.total_checkins || 0}</p>
          </div>
          <div className="relative overflow-hidden rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 shadow-2xl">
            <div className="absolute -top-10 -right-10 w-24 h-24 bg-gradient-to-br from-amber-400/30 to-orange-400/30 rounded-full blur-2xl" />
            <p className="text-xs text-amber-100 mb-2 font-medium relative z-10">{t("best_streak")}</p>
            <p className="text-3xl font-bold bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent relative z-10">{profile?.longest_streak || 0} {t("days")}</p>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="grid grid-cols-2 gap-3 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Link
            to={createPageUrl("Groups")}
            className="rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 flex items-center gap-3 hover:bg-white/20 transition-all shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
              <Users size={22} className="text-white" />
            </div>
            <span className="font-semibold text-white">{t("groups")}</span>
          </Link>

          <Link
            to={createPageUrl("Friends")}
            className="rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 flex items-center gap-3 hover:bg-white/20 transition-all shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-lg">
              <Users size={22} className="text-white" />
            </div>
            <span className="font-semibold text-white">{t("friends")}</span>
          </Link>
        </motion.div>
      </div>

      {/* First Streak Modal */}
      <FirstStreakModal 
        isOpen={showFirstStreakModal} 
        onClose={() => setShowFirstStreakModal(false)} 
      />
    </div>
  );
}