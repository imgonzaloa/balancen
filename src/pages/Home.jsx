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
import DailyTaskChecklist from "@/components/home/DailyTaskChecklist";

export default function Home() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [showFirstStreakModal, setShowFirstStreakModal] = useState(false);
  const [hasShownPaywall, setHasShownPaywall] = useState(false);

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
    staleTime: 30000,
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
    staleTime: 30000,
  });
  const todayCheckIn = checkIns.find(c => c.date === today);
  const yesterdayCheckIn = checkIns.find(c => c.date === yesterday);



  // Award app open fire on mount
  useEffect(() => {
    const awardAppOpenFire = async () => {
      if (!user || !profile) return;

      const existing = checkIns.find(c => c.date === today);
      if (existing?.app_open_fire_awarded) return;

      const checkInData = {
        date: today,
        completed: false,
        app_open_fire_awarded: true
      };

      if (existing) {
        await base44.entities.DailyCheckIn.update(existing.id, checkInData);
      } else {
        await base44.entities.DailyCheckIn.create(checkInData);
      }

      await base44.entities.UserProfile.update(profile.id, {
        fire_total: (profile.fire_total || 0) + 1
      });

      toast.success(`🔥 ${t("fire_for_opening")}`);
      queryClient.invalidateQueries(["checkIns"]);
      queryClient.invalidateQueries(["profile"]);
    };

    awardAppOpenFire();
  }, [user?.email, profile?.id]);

  const handleTaskAction = async (taskType) => {
    const existing = checkIns.find(c => c.date === today);

    if (taskType === "checkin") {
      document.getElementById('checkin-card')?.scrollIntoView({ behavior: 'smooth' });
    } else if (taskType === "meal_photo") {
      document.getElementById('calorie-tracker')?.scrollIntoView({ behavior: 'smooth' });
    } else if (taskType === "steps") {
      document.getElementById('checkin-card')?.scrollIntoView({ behavior: 'smooth' });
    } else if (taskType === "calories") {
      document.getElementById('calorie-tracker')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

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
        checkin_fire_awarded: !existing?.checkin_fire_awarded,
        meal_photo_fire_awarded: data.food_photo_url && !existing?.meal_photo_fire_awarded
      };
      
      if (existing) {
        return base44.entities.DailyCheckIn.update(existing.id, checkInData);
      }
      return base44.entities.DailyCheckIn.create(checkInData);
    },
    onSuccess: async (newCheckIn) => {
      queryClient.invalidateQueries(["checkIns"]);

      // Calculate fire rewards
      let fireIncrement = 0;
      const messages = [];

      // +2 fire for check-in completion
      if (newCheckIn.checkin_fire_awarded) {
        fireIncrement += 2;
        messages.push(`🔥 ${t("fire_for_checkin")}`);
      }

      // +2 fire for meal photo
      if (newCheckIn.meal_photo_fire_awarded) {
        fireIncrement += 2;
        messages.push(`🔥 ${t("fire_for_meal_photo")}`);
      }

      // +3 fire for steps goal
      if (newCheckIn.steps_fire_awarded) {
        fireIncrement += 3;
        messages.push(`🔥 ${t("fire_for_steps_goal")}`);

        // Auto-progression for steps goal
        const currentGoal = profile.steps_goal || 8000;
        let newGoal = currentGoal;

        if (currentGoal < 12000) {
          newGoal = currentGoal + 1000;
        } else if (currentGoal < 16000) {
          newGoal = currentGoal + 1500;
        }

        if (newGoal !== currentGoal && profile.is_premium) {
          await base44.entities.UserProfile.update(profile.id, {
            steps_goal: newGoal
          });
          toast.success(`${t("new_steps_goal")}: ${newGoal.toLocaleString()}`);
        }
      }

      // +3 fire for calories goal
      if (newCheckIn.calories_fire_awarded) {
        fireIncrement += 3;
        messages.push(`🔥 ${t("fire_for_calorie_goal")}`);

        // Auto-progression for calories goal
        if (profile.auto_adjust_calories_goal && profile.calories_goal) {
          const currentGoal = profile.calories_goal;
          const minFloor = 1400;
          const newGoal = Math.max(currentGoal - 50, minFloor);

          if (newGoal !== currentGoal && profile.is_premium) {
            await base44.entities.UserProfile.update(profile.id, {
              calories_goal: newGoal
            });
            toast.success(`${t("new_calories_goal")}: ${newGoal}`);
          }
        }
      }

      // Update streak and fire
      if (profile) {
        const newStreak = profile.current_streak + 1;
        const longestStreak = Math.max(profile.longest_streak, newStreak);
        const totalCheckins = profile.total_checkins + 1;

        // FREE PLAN: Cap streak at 3 days
        const finalStreak = (!profile.is_premium && newStreak > 3) ? 3 : newStreak;

        await base44.entities.UserProfile.update(profile.id, {
          current_streak: finalStreak,
          longest_streak: longestStreak,
          total_checkins: totalCheckins,
          fire_total: (profile.fire_total || 0) + fireIncrement
        });

        // Show messages
        messages.forEach(msg => toast.success(msg));

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

        // Badges
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

        if (totalCheckins === 1) {
          await base44.entities.Badge.create({
            badge_id: `first_checkin_${user.email}`,
            user_email: user.email,
            badge_type: "first_checkin",
            earned_date: today,
          });
        }

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

  const { t, lang } = useTranslation();

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

        {/* Daily Mission - PRIMARY FOCUS */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <DailyTaskChecklist 
            todayCheckIn={todayCheckIn}
            todayMeals={todayMeals}
            profile={profile}
            onTaskClick={handleTaskAction}
          />
        </motion.div>

        {/* Streak Risk Warning - Always Show Until All Complete */}
        <motion.div 
          className="flex items-center gap-2 mb-4 bg-red-500/20 border border-red-500/50 rounded-xl px-4 py-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0, scale: [1, 1.02, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-red-300 font-bold text-sm">
              {profile?.current_streak || 0} {t("streak_at_risk")}
            </p>
            <p className="text-red-200/80 text-xs">{t("complete_before_midnight")}</p>
          </div>
        </motion.div>

        {/* Social Pressure - Who Completed Today */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <SocialCompletionStatus user={user} profile={profile} todayCheckIn={todayCheckIn} />
        </motion.div>

        {/* Progressive Reward Preview */}
        <motion.div
          className="bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-2xl p-4 text-center mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-amber-300 font-bold text-sm mb-1">
            🔥 {3 - (profile?.current_streak || 0) % 3} {t("days_to_unlock")}
          </p>
          <p className="text-amber-200/70 text-xs">
            {t("keep_streak_alive")}
          </p>
        </motion.div>

        {/* Social Activity Feed */}
        <SocialActivityFeed user={user} />

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
                {t("youre_number")}{profile?.current_streak || 1} {t("in_your_friend_group")}
              </p>
              <p className="text-amber-200/80 text-xs">
                {t("keep_it_up_top")}
              </p>
            </motion.div>
            <p className="text-center text-sm text-amber-300 font-semibold">
              ⚡ {t("tomorrow_double_fire")}
            </p>
          </motion.div>
        )}

        {/* Calorie Tracker - Always visible */}
        <motion.div
          id="calorie-tracker"
          className="mt-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <CalorieTracker 
            meals={todayMeals}
            date={today}
            caloriesGoal={profile?.calories_goal}
            onMealAdded={async () => {
              queryClient.invalidateQueries(["meals", today]);
              
              // Award meal photo fire if first photo of the day
              const existing = checkIns.find(c => c.date === today);
              if (existing && !existing.meal_photo_fire_awarded && todayMeals.length === 0) {
                await base44.entities.DailyCheckIn.update(existing.id, {
                  meal_photo_fire_awarded: true
                });
                await base44.entities.UserProfile.update(profile.id, {
                  fire_total: (profile.fire_total || 0) + 2
                });
                toast.success(`🔥 ${t("fire_for_meal_photo")}`);
                queryClient.invalidateQueries(["checkIns"]);
                queryClient.invalidateQueries(["profile"]);
              }
              queryClient.invalidateQueries(["meals", today]);
            }}
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