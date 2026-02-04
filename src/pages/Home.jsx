import React, { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { Users, Award, Settings, Flame } from "lucide-react";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

import StreakFire from "@/components/ui/StreakFire";
import QuickCheckIn from "@/components/home/QuickCheckIn";
import WeekProgress from "@/components/home/WeekProgress";
import StepsCounter from "@/components/home/StepsCounter";
import WeightTracker from "@/components/home/WeightTracker";
import CalorieTracker from "@/components/nutrition/CalorieTracker";
import FirstStreakModal from "@/components/home/FirstStreakModal";
import { useTranslation } from "@/components/TranslationProvider";

export default function Home() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showFirstStreakModal, setShowFirstStreakModal] = useState(false);
  const [hasShownPaywall, setHasShownPaywall] = useState(false);

  useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      return profiles[0] || null;
    },
    enabled: !!user?.email,
  });

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  const { data: checkIns = [] } = useQuery({
    queryKey: ["checkIns"],
    queryFn: async () => {
      return base44.entities.DailyCheckIn.filter(
        { created_by: user?.email },
        "-date",
        30
      );
    },
    enabled: !!user?.email,
  });

  const { data: todayMeals = [] } = useQuery({
    queryKey: ["meals", today],
    queryFn: async () => {
      return base44.entities.MealLog.filter(
        { created_by: user?.email, date: today },
        "-meal_time"
      );
    },
    enabled: !!user?.email,
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

        // Auto-progression for steps goal
        if (newCheckIn.steps_goal_met && newCheckIn.steps_fire_awarded) {
          const currentGoal = profile.steps_goal || 8000;
          let newGoal = currentGoal;
          
          if (currentGoal < 12000) {
            newGoal = currentGoal + 1000;
          } else if (currentGoal < 16000) {
            newGoal = currentGoal + 1500;
          }
          
          if (newGoal !== currentGoal) {
            profileUpdates.steps_goal = newGoal;
            toast.success(`${t("new_steps_goal")}: ${newGoal.toLocaleString()}`);
          }
          
          toast.success(t("steps_goal_achieved"));
        }

        // Auto-progression for calories goal (if enabled)
        if (newCheckIn.calories_goal_met && newCheckIn.calories_fire_awarded && profile.auto_adjust_calories_goal && profile.calories_goal) {
          const currentGoal = profile.calories_goal;
          const minFloor = 1400;
          const newGoal = Math.max(currentGoal - 50, minFloor);
          
          if (newGoal !== currentGoal) {
            profileUpdates.calories_goal = newGoal;
            toast.success(`${t("new_calories_goal")}: ${newGoal}`);
          }
          
          toast.success(t("calories_goal_achieved"));
        }

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
      {/* Animated Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 -left-4 w-72 h-72 bg-teal-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" />
        <div className="absolute top-20 -right-4 w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-cyan-500 rounded-full mix-blend-multiply filter blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
      </div>
      
      <div className="max-w-lg mx-auto px-5 pb-24 pt-8 relative z-10">
        {/* Header */}
        <motion.div 
          className="flex justify-between items-start mb-8"
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

        {/* Main Check-in Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <QuickCheckIn 
            onComplete={(data) => createCheckInMutation.mutateAsync(data)}
            todayCheckIn={todayCheckIn}
            yesterdayCheckIn={yesterdayCheckIn}
            profile={profile}
          />
        </motion.div>

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
          className="flex gap-3 mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Link
            to={createPageUrl("Groups")}
            className="flex-1 rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 flex items-center gap-3 hover:bg-white/20 transition-all shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95"
          >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-lg">
              <Users size={22} className="text-white" />
            </div>
            <span className="font-semibold text-white">{t("groups")}</span>
            </Link>

            <Link
            to={createPageUrl("Badges")}
            className="flex-1 rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 flex items-center gap-3 hover:bg-white/20 transition-all shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95"
            >
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
              <Award size={22} className="text-white" />
            </div>
            <span className="font-semibold text-white">{t("badges")}</span>
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