import React, { useState, useEffect, useMemo } from "react";
import { Camera, Flame, Sparkles, TrendingUp, Target, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { HomeSkeleton } from "@/components/ui/ScreenSkeleton";
import StreakFire from "@/components/ui/StreakFire";
import UserStatusHeader from "@/components/home/UserStatusHeader";

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
      label: lang === 'es' ? 'Cumplir meta de calorías' : 'Stay within calorie goal', 
      completed: metrics.caloriesGoalProgress >= 80 && metrics.caloriesGoalProgress <= 120, 
      reward: 2 
    },
    { 
      id: 3, 
      label: lang === 'es' ? 'Registrar 3 comidas' : 'Log 3 meals today', 
      completed: todayMeals.length >= 3, 
      reward: 3 
    }
  ];

  const completedMissions = todayMissions.filter(m => m.completed).length;
  const totalRewards = todayMissions.filter(m => m.completed).reduce((sum, m) => sum + m.reward, 0);

  if (!isInitialized || loading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="min-h-screen" style={{ minHeight: '100dvh', paddingBottom: '96px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-2xl mx-auto px-6 pt-2 pb-6 space-y-6">
        {/* Header with Language Indicator */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-black text-white mb-1">{t('home')}</h1>
              <p className="text-white/60 text-sm">{t('today_progress')}</p>
            </div>
            {/* DEV Language Indicator */}
            <div className="px-3 py-1 rounded-lg bg-teal-500/20 border border-teal-500/40">
              <span className="text-teal-300 text-xs font-bold">LANG: {lang.toUpperCase()}</span>
            </div>
          </div>
          
          {/* User Status */}
          <UserStatusHeader profile={profile} onStatusUpdate={refreshProfile} lang={lang} />
        </div>

        {/* Momentum / Streak Card */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-6 border border-amber-500/30 relative overflow-hidden">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-400/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-amber-300 text-sm font-semibold uppercase tracking-wide mb-1">
                  {t('current_streak')}
                </p>
                <p className="text-white/50 text-xs">{t('days_in_a_row')}</p>
              </div>
              <StreakFire streak={profile?.current_streak || 0} size="large" />
            </div>
            <div className="text-sm text-white/60">
              {t('total_fire')}: <span className="font-bold text-white">{profile?.fire_total || 0}</span>
            </div>
          </div>
        </div>

        {/* Calories Ring */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
          <div className="text-center">
            <div className="w-40 h-40 mx-auto mb-4 relative">
              <svg width="160" height="160" className="transform -rotate-90">
                <circle cx="80" cy="80" r="70" stroke="rgba(255,255,255,0.1)" strokeWidth="12" fill="none" />
                <circle
                  cx="80"
                  cy="80"
                  r="70"
                  stroke="url(#gradientHome)"
                  strokeWidth="12"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="440"
                  strokeDashoffset={metrics.strokeDashoffset}
                  style={{ transition: 'stroke-dashoffset 1s ease' }}
                />
                <defs>
                  <linearGradient id="gradientHome" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f97316" />
                    <stop offset="100%" stopColor="#ef4444" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-3xl font-black text-white">{Math.round(metrics.totalCalories)}</div>
                <div className="text-xs text-white/40">/ {metrics.caloriesGoal}</div>
              </div>
            </div>
            <p className="text-white/70 font-semibold text-sm">
              {t('calories')}
            </p>
            <p className="text-white/40 text-xs mt-1">
              {t('meals_logged_today')}: {todayMeals.length}
            </p>
          </div>
        </div>

        {/* Log Meal Button */}
        <Button
          onClick={() => navigate(createPageUrl('CameraScreen'))}
          className="w-full py-5 rounded-2xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white font-bold text-base flex items-center justify-center gap-2 shadow-xl shadow-teal-500/30"
        >
          <Camera size={20} />
          {t('log_your_meal')}
        </Button>

        {/* Macros */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: t('protein'), value: `${Math.round(metrics.totalProtein)}g` },
            { label: t('carbs'), value: `${Math.round(metrics.totalCarbs)}g` },
            { label: t('fats'), value: `${Math.round(metrics.totalFats)}g` }
          ].map((stat, i) => (
            <div key={i} className="bg-white/5 backdrop-blur-xl rounded-2xl p-4 border border-white/10 text-center">
              <div className="text-2xl font-black text-white mb-1">{stat.value}</div>
              <div className="text-xs text-white/50 font-semibold">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* AI Insight Card */}
        <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/30">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
              <Sparkles size={22} className="text-white" />
            </div>
            <div className="flex-1">
              <p className="text-purple-300 font-bold text-sm mb-2">{t('ai_coach')}</p>
              <p className="text-white text-sm leading-relaxed">
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
        <div className="bg-gradient-to-br from-teal-500/10 to-emerald-500/10 backdrop-blur-xl rounded-3xl p-6 border border-teal-500/30">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-white font-bold text-lg">
              {lang === 'es' ? 'Misiones de Hoy' : "Today's Missions"}
            </h3>
            <div className="flex items-center gap-2">
              <Flame size={16} className="text-orange-400" />
              <span className="text-white font-bold text-sm">+{totalRewards}</span>
            </div>
          </div>
          <div className="space-y-3">
            {todayMissions.map((mission) => (
              <div
                key={mission.id}
                className={`flex items-center justify-between p-3 rounded-xl border ${
                  mission.completed
                    ? 'bg-teal-500/20 border-teal-500/40'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    mission.completed
                      ? 'bg-teal-500 border-teal-400'
                      : 'border-white/30'
                  }`}>
                    {mission.completed && <span className="text-white text-xs">✓</span>}
                  </div>
                  <span className={`text-sm ${mission.completed ? 'text-white font-semibold' : 'text-white/70'}`}>
                    {mission.label}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <Flame size={14} className={mission.completed ? 'text-orange-400' : 'text-white/30'} />
                  <span className={`text-xs font-bold ${mission.completed ? 'text-orange-400' : 'text-white/30'}`}>
                    +{mission.reward}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Meals + Last Meal Preview */}
        {todayMeals && todayMeals.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-lg">{t('logged_meals')}</h3>
              <span className="text-white/50 text-sm">{todayMeals.length}</span>
            </div>
            
            {/* Last Meal Preview - Featured */}
            <div className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 backdrop-blur-xl rounded-3xl overflow-hidden border border-indigo-500/30">
              {todayMeals[0].photo_url && (
                <div className="relative h-48">
                  <img 
                    src={todayMeals[0].photo_url} 
                    alt="Last meal" 
                    className="w-full h-full object-cover" 
                    loading="lazy" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4">
                    <p className="text-white font-bold text-lg mb-1">
                      {lang === 'es' ? 'Última Comida' : 'Last Meal'}
                    </p>
                    <div className="flex items-center gap-4 text-white/80 text-sm">
                      <span className="font-bold text-teal-300">{todayMeals[0].estimated_calories} kcal</span>
                      <span>P: {Math.round(todayMeals[0].estimated_protein || 0)}g</span>
                      <span>C: {Math.round(todayMeals[0].estimated_carbs || 0)}g</span>
                      <span>F: {Math.round(todayMeals[0].estimated_fats || 0)}g</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Rest of meals - Grid */}
            {todayMeals.length > 1 && (
              <div className="grid grid-cols-2 gap-3">
                {todayMeals.slice(1, 5).map((meal) => (
                  <div key={meal.id} className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-colors">
                    {meal.photo_url && (
                      <div className="relative">
                        <img src={meal.photo_url} alt="Meal" className="w-full h-28 object-cover" loading="lazy" />
                        <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm rounded-lg px-2 py-1">
                          <p className="text-teal-300 font-bold text-xs">{meal.estimated_calories} kcal</p>
                        </div>
                      </div>
                    )}
                    <div className="p-3">
                      <p className="text-white text-xs font-semibold">
                        {meal.meal_type ? (meal.meal_type.charAt(0).toUpperCase() + meal.meal_type.slice(1)) : t('meal')}
                      </p>
                      <p className="text-white/50 text-[10px] mt-0.5">
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