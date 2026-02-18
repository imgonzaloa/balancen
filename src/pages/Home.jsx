import React, { useState, useEffect, useMemo } from "react";
import { Camera, Lock, Sparkles, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/AppStateContext";
import { useMealsStore } from "@/components/MealsStore";
import { useTranslation } from "@/components/TranslationProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { HomeSkeleton } from "@/components/ui/ScreenSkeleton";
import StreakFire from "@/components/ui/StreakFire";

// Memoized Home component for better performance
const Home = React.memo(() => {
  const { user, profile: cachedProfile, isInitialized } = useAppState();
  const { getTodayMeals, getTodayTotals, isHydrated } = useMealsStore();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(cachedProfile);

  useEffect(() => {
    if (cachedProfile) setProfile(cachedProfile);
  }, [cachedProfile]);

  // Memoize meals and totals to prevent recalculation
  const todayMeals = useMemo(() => getTodayMeals(), [getTodayMeals]);
  const storeTotals = useMemo(() => getTodayTotals(), [getTodayTotals]);

  const metrics = useMemo(() => {
    const totalCalories = storeTotals.calories;
    const totalProtein = storeTotals.protein;
    const totalCarbs = storeTotals.carbs;
    const totalFats = storeTotals.fats;
    const caloriesGoal = profile?.calories_goal || 2000;
    const progress = Math.min((totalCalories / caloriesGoal) * 100, 100);

    return { totalCalories, totalProtein, totalCarbs, totalFats, caloriesGoal, progress };
  }, [storeTotals, profile?.calories_goal]);

  const todayMissions = useMemo(() => [
    { 
      id: 1, 
      label: t('meal_logged'), 
      completed: todayMeals.length >= 1, 
    },
    { 
      id: 2, 
      label: t('stay_within_goal'), 
      completed: metrics.progress >= 80 && metrics.progress <= 120, 
    },
    { 
      id: 3, 
      label: t('log_three_meals'), 
      completed: todayMeals.length >= 3, 
    }
  ], [todayMeals.length, metrics.progress, t]);

  const completedCount = useMemo(() => 
    todayMissions.filter(m => m.completed).length,
    [todayMissions]
  );

  const isPremium = useMemo(() => 
    profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator',
    [profile]
  );

  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good_morning');
    if (hour < 18) return t('good_afternoon');
    return t('good_evening');
  }, [t]);

  const currentDate = useMemo(() => 
    new Date().toLocaleDateString(lang === "es" ? "es-ES" : "en-US", {
      weekday: "long",
      day: "numeric",
      month: "long"
    }),
    [lang]
  );

  const handleNavigate = React.useCallback((page) => {
    navigate(createPageUrl(page));
  }, [navigate]);

  if (!isInitialized || !isHydrated) {
    return <HomeSkeleton />;
  }

  return (
    <div style={{ minHeight: '100%', paddingBottom: '8px' }}>
      <div className="max-w-2xl mx-auto px-6 pb-8 space-y-4">
        
        {/* Header - Premium CTA only */}
        {!isPremium && (
          <div className="flex items-center justify-end">
            <button
              onClick={() => handleNavigate('Premium')}
              className="px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold hover:bg-white/20 transition-colors"
            >
              {t('upgrade_to_premium_title')}
            </button>
          </div>
        )}

        {/* Greeting */}
        <div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">
            {currentDate}
          </p>
          <h1 className="text-3xl font-black text-white">
            {getGreeting}, {profile?.display_name?.split(' ')[0] || t('user')}
          </h1>
        </div>

        {/* Daily Intake - Hero Card */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl rounded-3xl p-6 border border-white/10 shadow-2xl">
          <h2 className="text-white/70 text-sm font-bold uppercase tracking-wide mb-4">
            {t('daily_intake')}
          </h2>
          
          {/* Calories Ring */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="text-5xl font-black text-white">
                  {Math.round(metrics.totalCalories)}
                </span>
                <span className="text-xl text-white/50 font-bold">
                  / {metrics.caloriesGoal}
                </span>
              </div>
              <p className="text-white/60 text-sm font-medium">{t('kcal_short')}</p>
            </div>
            
            {/* Mini ring */}
            <div className="relative w-24 h-24 flex-shrink-0">
              <svg width="96" height="96" className="transform -rotate-90">
                <circle cx="48" cy="48" r="42" stroke="rgba(255,255,255,0.08)" strokeWidth="10" fill="none" />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  stroke="url(#ringGradient)"
                  strokeWidth="10"
                  fill="none"
                  strokeLinecap="round"
                  strokeDasharray="264"
                  strokeDashoffset={264 - (metrics.progress / 100) * 264}
                  style={{ transition: 'stroke-dashoffset 0.8s ease' }}
                />
                <defs>
                  <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#14b8a6" />
                    <stop offset="100%" stopColor="#10b981" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-black text-white">
                  {Math.round(metrics.progress)}%
                </span>
              </div>
            </div>
          </div>

          {/* Macros */}
          <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
            {[
              { label: t('protein'), value: Math.round(metrics.totalProtein), color: 'text-blue-400' },
              { label: t('carbs'), value: Math.round(metrics.totalCarbs), color: 'text-amber-400' },
              { label: t('fats'), value: Math.round(metrics.totalFats), color: 'text-pink-400' }
            ].map((macro, i) => (
              <div key={i} className="text-center">
                <div className={`text-2xl font-black ${macro.color} mb-0.5`}>
                  {macro.value}{t('gram_short')}
                </div>
                <div className="text-[10px] text-white/50 uppercase tracking-wider font-bold">
                  {macro.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Primary CTAs */}
         <div className="grid grid-cols-2 gap-3">
           <Button
             onClick={() => handleNavigate('CameraScreen')}
             className="h-16 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 hover:shadow-xl hover:shadow-teal-500/40 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
           >
             <Camera size={20} strokeWidth={2.5} />
             {t('log_meal_button')}
           </Button>
           <Button
             onClick={() => handleNavigate('TrainerDashboard')}
             className="h-16 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 hover:shadow-xl hover:shadow-purple-500/40 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
             title={!isPremium ? t('premium_feature') : ''}
             disabled={!isPremium}
             style={{ opacity: !isPremium ? 0.6 : 1 }}
           >
             <Dumbbell size={20} strokeWidth={2.5} />
             {t('workout_button')}
           </Button>
         </div>

        {/* Recent Meals */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-white font-black text-base">{t('recent_meals')}</h3>
            {todayMeals.length > 0 && (
              <span className="text-white/50 text-sm font-bold">{todayMeals.length}</span>
            )}
          </div>
          
          {todayMeals.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
              <Camera size={40} className="text-white/40 mx-auto mb-3" />
              <p className="text-white/70 font-semibold mb-1">{t('no_meals_logged')}</p>
              <p className="text-white/50 text-sm">{t('start_logging')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {todayMeals.slice(0, 3).map((meal) => (
                <div key={meal.id} className="bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 hover:border-white/20 transition-all flex">
                  {meal.photoUri && (
                    <img 
                      src={meal.photoUri} 
                      alt="Meal" 
                      className="w-20 h-20 object-cover flex-shrink-0" 
                      onError={(e) => { e.target.style.display = 'none'; }} 
                    />
                  )}
                  <div className="flex-1 p-3 flex items-center justify-between">
                    <div>
                      <p className="text-white text-sm font-bold">
                        {meal.mealType ? (meal.mealType.charAt(0).toUpperCase() + meal.mealType.slice(1)) : t('meal')}
                      </p>
                      <p className="text-white/60 text-xs mt-0.5">
                        {new Date(meal.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-teal-300 font-black text-lg">{Math.round(meal.totals?.calories || 0)}</p>
                      <p className="text-white/50 text-[10px] uppercase font-bold">{t('kcal_short')}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Streak & Momentum - UNLOCKED FOR BASE PLAN */}
        <div className="bg-gradient-to-br from-amber-500/15 to-orange-500/15 backdrop-blur-xl rounded-2xl p-5 border border-amber-500/20">
          <h3 className="text-amber-300/90 text-xs font-bold uppercase tracking-wider mb-3">
            {t('streak_momentum')}
          </h3>
          <div className="flex items-center gap-4 mb-4">
            <StreakFire streak={profile?.current_streak || 0} size="large" />
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wide font-semibold">
                {t('best_streak')}
              </p>
              <p className="text-white text-xl font-black">
                {profile?.longest_streak || 0}
              </p>
            </div>
          </div>
          
          {/* Today's Missions - compact */}
          <div className="pt-3 border-t border-amber-500/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-white/80 text-xs font-bold uppercase tracking-wide">
                {t('todays_missions')}
              </p>
              <span className="text-amber-300 text-xs font-black">
                {completedCount}/3
              </span>
            </div>
            <div className="space-y-1.5">
              {todayMissions.map((mission) => (
                <button
                  key={mission.id}
                  onClick={() => {
                    if (mission.id === 1 || mission.id === 3) {
                      handleNavigate('CameraScreen');
                    } else if (mission.id === 2) {
                      handleNavigate('Progress');
                    }
                  }}
                  className="flex items-center gap-2 w-full py-1 px-2 -mx-2 rounded-lg hover:bg-white/5 transition-colors active:scale-95 cursor-pointer"
                >
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    mission.completed
                      ? 'bg-teal-500 border-teal-400'
                      : 'border-white/30'
                  }`}>
                    {mission.completed && <span className="text-white text-[10px] font-bold">✓</span>}
                  </div>
                  <span className={`text-xs ${mission.completed ? 'text-white/90 font-semibold' : 'text-white/50'}`}>
                    {mission.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Manual Add Meal - FREE USERS OPTION */}
        {!isPremium && (
          <button
            onClick={() => handleNavigate('AddMeal')}
            className="w-full text-left bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-2xl p-5 border border-emerald-500/30 hover:border-emerald-500/50 transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Camera size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-emerald-300 font-bold text-xs uppercase tracking-wide mb-2">
                  {t('log_meal_manually')}
                </p>
                <p className="text-white/90 text-sm leading-relaxed">
                  {t('manual_log_description')}
                </p>
              </div>
            </div>
          </button>
        )}

        {/* AI Insights (PREMIUM ONLY) */}
        {isPremium && (
          <button
            onClick={() => handleNavigate('GoalsAssistant')}
            className="w-full text-left bg-gradient-to-br from-purple-500/12 to-pink-500/12 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/20 hover:border-purple-500/40 transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-purple-300 font-bold text-xs uppercase tracking-wide mb-2">
                  {t('ai_daily_insight')}
                </p>
                <p className="text-white/90 text-sm leading-relaxed">
                  {metrics.progress >= 100 
                    ? t('ai_coach_goal_reached')
                    : (metrics.progress >= 50
                      ? t('ai_coach_halfway')
                      : t('ai_coach_start')
                    )
                  }
                </p>
              </div>
            </div>
          </button>
        )}

        {/* Premium CTA - All Features Teaser */}
        {!isPremium && (
          <button
            onClick={() => handleNavigate('Premium')}
            className="w-full text-left bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-5 border border-purple-500/30 hover:border-purple-500/50 transition-all active:scale-[0.98] cursor-pointer"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
                <Sparkles size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <div className="flex-1 pt-0.5">
                <p className="text-purple-300 font-bold text-xs uppercase tracking-wide mb-2">
                  {t('premium_features')}
                </p>
                <p className="text-white/90 text-sm leading-relaxed">
                  {t('premium_features_description')}
                </p>
              </div>
            </div>
          </button>
        )}


        </div>
      </div>
    </div>
  );
});

Home.displayName = 'Home';

export default Home;