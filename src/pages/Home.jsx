import React, { useState, useEffect, useMemo } from "react";
import { Camera, Flame, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { HomeSkeleton } from "@/components/ui/ScreenSkeleton";
import StreakFire from "@/components/ui/StreakFire";

export default function Home() {
  const { user, profile: cachedProfile, todayMeals: cachedMeals, friends: cachedFriends, isInitialized, refreshProfile } = useAppState();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(cachedProfile);
  const [todayMeals, setTodayMeals] = useState(cachedMeals || []);
  const [friends, setFriends] = useState(cachedFriends || []);
  const [loading, setLoading] = useState(!cachedProfile);

  useEffect(() => {
    if (!user?.email || cachedProfile) return;

    const fetchData = async () => {
      try {
        const [profileData, mealsData, friendsData] = await Promise.all([
          base44.entities.UserProfile.filter({ created_by: user.email }),
          base44.entities.MealLog.filter({
            created_by: user.email,
            date: new Date().toISOString().split("T")[0]
          }, "-meal_time"),
          base44.entities.Friend.filter({ created_by: user.email }).catch(() => [])
        ]);

        setProfile(profileData[0] || null);
        setTodayMeals(mealsData || []);
        setFriends(friendsData || []);
      } catch (err) {
        console.error("Failed to fetch home data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.email, cachedProfile]);

  const metrics = useMemo(() => {
    const totalCalories = todayMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0);
    const totalProtein = todayMeals.reduce((sum, m) => sum + (m.estimated_protein || 0), 0);
    const totalCarbs = todayMeals.reduce((sum, m) => sum + (m.estimated_carbs || 0), 0);
    const totalFats = todayMeals.reduce((sum, m) => sum + (m.estimated_fats || 0), 0);
    const caloriesGoal = profile?.calories_goal || 2000;
    const progress = Math.min((totalCalories / caloriesGoal) * 100, 100);
    const strokeDashoffset = 440 - (progress / 100) * 440;
    const caloriesGoalProgress = progress;

    return { totalCalories, totalProtein, totalCarbs, totalFats, caloriesGoal, strokeDashoffset, caloriesGoalProgress };
  }, [todayMeals, profile?.calories_goal]);

  const todayMissions = [
    { 
      id: 1, 
      label: t('meal_logged'), 
      completed: todayMeals.length >= 1, 
      reward: 1 
    },
    { 
      id: 2, 
      label: t('stay_within_goal'), 
      completed: metrics.caloriesGoalProgress >= 80 && metrics.caloriesGoalProgress <= 120, 
      reward: 2 
    },
    { 
      id: 3, 
      label: t('log_three_meals'), 
      completed: todayMeals.length >= 3, 
      reward: 3 
    }
  ];

  const completedMissions = todayMissions.filter(m => m.completed).length;
  const totalRewards = todayMissions.filter(m => m.completed).reduce((sum, m) => sum + m.reward, 0);

  const currentDate = new Date().toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
    weekday: "long",
    day: "numeric",
    month: "long"
  });

  if (!isInitialized || loading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="min-h-screen" style={{ minHeight: '100dvh', paddingBottom: '96px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-2xl mx-auto px-6 pt-4 pb-8 space-y-5">
        
        {/* Greeting Header */}
        <div className="space-y-1">
          <p className="text-white/40 text-xs font-medium uppercase tracking-wider">
            {currentDate}
          </p>
          <h1 className="text-4xl font-black text-white">
            {t('home')}, {profile?.display_name?.split(' ')[0] || "User"}
          </h1>
          <p className="text-white/60 text-sm">
            {t('today_progress')}
          </p>
        </div>

        {/* Main Calorie Ring Card - Hero */}
        <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-[32px] p-8 border border-white/10 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-white/50 text-xs font-semibold uppercase tracking-wide mb-1">
                {t('calories')}
              </p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black text-white">
                  {Math.round(metrics.totalCalories)}
                </span>
                <span className="text-2xl text-white/40 font-bold">
                  / {metrics.caloriesGoal}
                </span>
              </div>
            </div>
            
            {/* Mini ring indicator */}
            <div className="relative w-20 h-20">
              <svg width="80" height="80" className="transform -rotate-90">
                <circle cx="40" cy="40" r="34" stroke="rgba(255,255,255,0.08)" strokeWidth="8" fill="none" />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="url(#miniGradient)"
                  strokeWidth="8"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="214"
                  strokeDashoffset={214 - (metrics.caloriesGoalProgress / 100) * 214}
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
                <defs>
                  <linearGradient id="miniGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-black text-white">
                  {Math.round(metrics.caloriesGoalProgress)}%
                </span>
              </div>
            </div>
          </div>

          {/* Macros row */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-white/10">
            {[
              { label: t('protein'), value: Math.round(metrics.totalProtein), color: 'text-blue-400' },
              { label: t('carbs'), value: Math.round(metrics.totalCarbs), color: 'text-amber-400' },
              { label: t('fats'), value: Math.round(metrics.totalFats), color: 'text-pink-400' }
            ].map((macro, i) => (
              <div key={i} className="text-center">
                <div className={`text-2xl font-black ${macro.color} mb-0.5`}>
                  {macro.value}g
                </div>
                <div className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">
                  {macro.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Log Meal CTA */}
        <Button
          onClick={() => navigate(createPageUrl('CameraScreen'))}
          className="w-full h-16 rounded-[24px] bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 hover:shadow-2xl hover:shadow-teal-500/40 text-white font-bold text-lg flex items-center justify-center gap-3 shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
        >
          <Camera size={24} strokeWidth={2.5} />
          {t('log_your_meal')}
        </Button>

        {/* Streak Card */}
        <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/15 backdrop-blur-xl rounded-[28px] p-6 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-amber-300/80 text-xs font-bold uppercase tracking-wider mb-1">
                {t('current_streak')}
              </p>
              <p className="text-white/60 text-xs mb-3">
                {t('days_in_a_row')}
              </p>
              <div className="flex items-center gap-3">
                <StreakFire streak={profile?.current_streak || 0} size="large" />
                <div>
                  <p className="text-white/50 text-[10px] uppercase tracking-wide font-semibold">
                    {t('total_fire')}
                  </p>
                  <p className="text-white text-lg font-black">
                    {profile?.fire_total || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Coach Insight */}
        <div className="bg-gradient-to-br from-purple-500/12 to-pink-500/12 backdrop-blur-xl rounded-[28px] p-6 border border-purple-500/20">
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
              <Sparkles size={20} className="text-white" strokeWidth={2.5} />
            </div>
            <div className="flex-1 pt-1">
              <p className="text-purple-300 font-bold text-xs uppercase tracking-wide mb-2">
                {t('ai_coach')}
              </p>
              <p className="text-white/90 text-sm leading-relaxed">
                {metrics.caloriesGoalProgress >= 100 
                  ? t('ai_coach_goal_reached')
                  : (metrics.caloriesGoalProgress >= 50
                    ? t('ai_coach_halfway')
                    : t('ai_coach_start')
                  )
                }
              </p>
            </div>
          </div>
        </div>

        {/* Today's Missions */}
        <div className="bg-gradient-to-br from-teal-500/8 to-emerald-500/8 backdrop-blur-xl rounded-[28px] p-6 border border-teal-500/20">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-white font-black text-base">
              {t('todays_missions')}
            </h3>
            <div className="flex items-center gap-1.5 bg-orange-500/20 border border-orange-400/30 rounded-full px-3 py-1">
              <Flame size={14} className="text-orange-400" />
              <span className="text-orange-400 font-black text-sm">+{totalRewards}</span>
            </div>
          </div>
          <div className="space-y-2.5">
            {todayMissions.map((mission) => (
              <div
                key={mission.id}
                className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                  mission.completed
                    ? 'bg-teal-500/15 border-teal-400/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                    mission.completed
                      ? 'bg-teal-500 border-teal-400 shadow-lg shadow-teal-500/50'
                      : 'border-white/30'
                  }`}>
                    {mission.completed && <span className="text-white text-xs font-bold">✓</span>}
                  </div>
                  <span className={`text-sm leading-snug ${mission.completed ? 'text-white font-semibold' : 'text-white/60'}`}>
                    {mission.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Flame size={13} className={mission.completed ? 'text-orange-400' : 'text-white/20'} />
                  <span className={`text-xs font-black ${mission.completed ? 'text-orange-400' : 'text-white/30'}`}>
                    +{mission.reward}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Meals */}
        {todayMeals && todayMeals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-black text-base">{t('logged_meals')}</h3>
              <span className="text-white/40 text-sm font-bold">{todayMeals.length}</span>
            </div>
            
            {/* Last Meal Preview */}
            <div className="bg-gradient-to-br from-indigo-500/15 to-purple-500/15 backdrop-blur-xl rounded-[28px] overflow-hidden border border-indigo-500/20">
              {todayMeals[0].photo_url && (
                <div className="relative h-52">
                  <img 
                    src={todayMeals[0].photo_url} 
                    alt="Last meal" 
                    className="w-full h-full object-cover" 
                    loading="lazy" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
                  <div className="absolute bottom-5 left-5 right-5">
                    <p className="text-white font-black text-base mb-2 tracking-tight">
                      {t('last_meal')}
                    </p>
                    <div className="flex items-center gap-4 text-white/90 text-sm">
                      <span className="font-black text-teal-300 text-base">
                        {todayMeals[0].estimated_calories} kcal
                      </span>
                      <span className="text-white/70">P: {Math.round(todayMeals[0].estimated_protein || 0)}g</span>
                      <span className="text-white/70">C: {Math.round(todayMeals[0].estimated_carbs || 0)}g</span>
                      <span className="text-white/70">F: {Math.round(todayMeals[0].estimated_fats || 0)}g</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rest of meals */}
            {todayMeals.length > 1 && (
              <div className="grid grid-cols-2 gap-3">
                {todayMeals.slice(1, 5).map((meal) => (
                  <div key={meal.id} className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all">
                    {meal.photo_url && (
                      <div className="relative">
                        <img src={meal.photo_url} alt="Meal" className="w-full h-28 object-cover" loading="lazy" />
                        <div className="absolute top-2 right-2 bg-black/70 backdrop-blur-sm rounded-lg px-2.5 py-1">
                          <p className="text-teal-300 font-bold text-xs">{meal.estimated_calories} kcal</p>
                        </div>
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-white text-xs font-semibold">
                        {meal.meal_type ? (meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)) : t('meal')}
                      </p>
                      <p className="text-white/40 text-[10px] mt-0.5">
                        {meal.meal_time || new Date(meal.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}