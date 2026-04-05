import React, { useState, useEffect, useMemo, useRef } from "react";
import { Camera, Lock, Sparkles, Dumbbell, Clock, Crown, Pencil, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/AppStateContext";
import { useMealsStore } from "@/components/MealsStore";
import { useTranslation } from "@/components/TranslationProvider";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { formatDateLong, formatTime, formatNumber } from "@/lib/locale";
import { HomeSkeleton } from "@/components/ui/ScreenSkeleton";
import StreakFire from "@/components/ui/StreakFire";
import GlobalHeader from "@/components/GlobalHeader";
import { useEntitlement } from "@/components/hooks/useEntitlement";
import TrialBanner from "@/components/home/TrialBanner";
import PullToRefresh from "@/components/PullToRefresh";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";

// Memoized Home component for better performance
const Home = React.memo(() => {
  const { user, profile: cachedProfile, isInitialized, setProfile: setContextProfile } = useAppState();
  const { getTodayMeals, getTodayTotals, isHydrated } = useMealsStore();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(cachedProfile);
  const [editingStatus, setEditingStatus] = useState(false);
  const [statusDraft, setStatusDraft] = useState(cachedProfile?.status_message || '');
  const statusInputRef = useRef(null);

  useEffect(() => {
    if (cachedProfile) setProfile(cachedProfile);
  }, [cachedProfile]);

  useEffect(() => {
    setStatusDraft(profile?.status_message || '');
  }, [profile?.status_message]);

  useEffect(() => {
    if (editingStatus && statusInputRef.current) {
      statusInputRef.current.focus();
    }
  }, [editingStatus]);

  const handleSaveStatus = async () => {
    if (!profile?.id) return;
    const { base44 } = await import('@/api/base44Client');
    await base44.entities.UserProfile.update(profile.id, { status_message: statusDraft });
    const updated = { ...profile, status_message: statusDraft };
    setProfile(updated);
    setContextProfile(updated);
    setEditingStatus(false);
  };

  const handleCancelStatus = () => {
    setStatusDraft(profile?.status_message || '');
    setEditingStatus(false);
  };

  // DB sync: fetch today's meals from the database
  const today = new Date().toISOString().split('T')[0];
  const { data: dbMeals } = useQuery({
    queryKey: ['mealLogs', user?.email, today],
    queryFn: () => base44.entities.MealLog.filter({ created_by: user.email, date: today }, '-meal_time'),
    enabled: !!user?.email,
    staleTime: 5 * 60 * 1000,
  });

  const storeMeals = useMemo(() => getTodayMeals(), [getTodayMeals]);

  // Display-only merge: store meals first, then DB meals not already in the store (by id)
  const todayMeals = useMemo(() => {
    if (!dbMeals?.length) return storeMeals;
    const storeIds = new Set(storeMeals.map(m => m.id).filter(Boolean));
    const dbOnly = dbMeals
      .filter(m => m.id && !storeIds.has(m.id))
      .map(m => ({
        id: m.id,
        photoUri: m.photo_url || null,
        mealType: m.meal_type || null,
        createdAt: m.created_date || m.meal_time || null,
        totals: {
          calories: m.estimated_calories || 0,
          protein: m.estimated_protein || 0,
          carbs: m.estimated_carbs || 0,
          fats: m.estimated_fats || 0,
        },
        items: [],
      }));
    return [...storeMeals, ...dbOnly];
  }, [dbMeals, storeMeals]);

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

  const { isPremium, trialDaysLeft, trialDay, isTrialActive } = useEntitlement(profile);

  const getGreeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return t('good_morning');
    if (hour < 18) return t('good_afternoon');
    return t('good_evening');
  }, [t]);

  const currentDate = useMemo(() => formatDateLong(lang), [lang]);

  const handleNavigate = React.useCallback((page) => {
    navigate(createPageUrl(page));
  }, [navigate]);

  const showTrialBanner = isTrialActive && trialDaysLeft > 0;
  const effectiveTrialDay = 8 - trialDaysLeft; // Day 1 = first day, Day 7 = last day

  if (!isInitialized || !isHydrated) {
    return <HomeSkeleton />;
  }

  return (
    <PullToRefresh>
    <div style={{ minHeight: '100%', paddingBottom: '8px' }}>
      <div className="max-w-2xl mx-auto px-6 pt-4 pb-8 space-y-4">

        {/* Trial Day Banner */}
        {showTrialBanner && (
          <TrialBanner trialDay={effectiveTrialDay} trialDaysLeft={trialDaysLeft} lang={lang} navigate={navigate} />
        )}

        {/* Greeting */}
        <div>
          <p className="text-white/50 text-xs font-semibold uppercase tracking-wider">
            {currentDate}
          </p>
          <h1 className="text-3xl font-black text-white">
            {(() => {
              const nameForUI = profile?.display_name?.trim()
                || (user?.email ? user.email.split('@')[0] : null)
                || null;
              return nameForUI
                ? `${getGreeting}, ${nameForUI.split(' ')[0]}`
                : getGreeting;
            })()}
          </h1>
          {editingStatus ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                ref={statusInputRef}
                value={statusDraft}
                onChange={e => setStatusDraft(e.target.value)}
                maxLength={60}
                onKeyDown={e => { if (e.key === 'Enter') handleSaveStatus(); if (e.key === 'Escape') handleCancelStatus(); }}
                className="flex-1 bg-white/10 text-white text-sm italic rounded-lg px-3 py-1.5 border border-white/20 focus:border-teal-400 focus:outline-none placeholder-white/30 min-w-0"
                placeholder={lang === 'pt' ? 'Adicione seu status...' : lang === 'en' ? 'Add your status...' : 'Agrega tu estado...'}
              />
              <button onClick={handleSaveStatus} className="text-teal-400 hover:text-teal-300 active:scale-90 transition-all flex-shrink-0">
                <Check size={16} strokeWidth={2.5} />
              </button>
              <button onClick={handleCancelStatus} className="text-white/40 hover:text-white/70 active:scale-90 transition-all flex-shrink-0">
                <X size={16} strokeWidth={2.5} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditingStatus(true)}
              className="flex items-center gap-1.5 mt-1 group active:scale-95 transition-transform"
            >
              {profile?.status_message ? (
                <p className="text-white/50 text-sm italic group-hover:text-white/70 transition-colors">"{profile.status_message}"</p>
              ) : (
                <p className="text-white/25 text-sm italic group-hover:text-white/40 transition-colors">
                  {lang === 'pt' ? '+ Adicione seu status...' : lang === 'en' ? '+ Add your status...' : '+ Agrega tu estado...'}
                </p>
              )}
              <Pencil size={11} className="text-white/30 group-hover:text-white/50 flex-shrink-0 transition-colors" />
            </button>
          )}
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
                  {formatNumber(lang, metrics.totalCalories)}
                </span>
                <span className="text-xl text-white/50 font-bold">
                  / {formatNumber(lang, metrics.caloriesGoal)}
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

        {/* Buddy - temporarily disabled */}

        {/* Primary CTAs */}
        <div className={`grid gap-3 ${isPremium || isTrialActive ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <Button
            onClick={() => handleNavigate('CameraScreen')}
            className="h-16 rounded-2xl bg-gradient-to-r from-teal-500 via-emerald-500 to-teal-500 hover:shadow-xl hover:shadow-teal-500/40 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
          >
            <Camera size={20} strokeWidth={2.5} />
            {t('log_meal_button')}
          </Button>
          {(isPremium || isTrialActive) && (
            <Button
              onClick={() => handleNavigate('WorkoutTracker')}
              className="h-16 rounded-2xl bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 hover:shadow-xl hover:shadow-purple-500/40 text-white font-bold flex items-center justify-center gap-2 shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
            >
              <Dumbbell size={20} strokeWidth={2.5} />
              {lang === 'es' ? 'Registrar entreno' : lang === 'pt' ? 'Registrar treino' : 'Log Workout'}
            </Button>
          )}
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
              {todayMeals.slice(0, 5).map((meal) => {
                const photoSrc = meal.photoUri || meal.photo_url || null;

                // Determine meal type label
                const getMealLabel = () => {
                  const type = meal.mealType || meal.meal_type;
                  const rawHour = meal.createdAt || meal.meal_time;
                  const hour = type ? null : rawHour ? new Date(rawHour).getHours() : null;
                  const derived = type || (hour !== null ? (hour >= 5 && hour < 11 ? 'breakfast' : hour >= 11 && hour < 16 ? 'lunch' : hour >= 16 && hour < 22 ? 'dinner' : 'snack') : null);
                  const labels = {
                    breakfast: { es: 'Desayuno', pt: 'Café da manhã', en: 'Breakfast' },
                    lunch:     { es: 'Almuerzo',  pt: 'Almoço',        en: 'Lunch' },
                    dinner:    { es: 'Cena',       pt: 'Jantar',        en: 'Dinner' },
                    snack:     { es: 'Snack',      pt: 'Lanche',        en: 'Snack' },
                  };
                  return labels[derived]?.[lang] || labels[derived]?.en || t('meal');
                };

                return (
                  <div key={meal.id} className="bg-white/10 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 flex">
                    {photoSrc ? (
                      <img
                        src={photoSrc}
                        alt="Meal"
                        className="w-20 h-20 object-cover flex-shrink-0"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <div className="w-20 h-20 flex-shrink-0 bg-white/5 flex items-center justify-center">
                        <Camera size={22} className="text-white/20" />
                      </div>
                    )}
                    <div className="flex-1 p-3 flex items-center justify-between">
                      <div>
                        <p className="text-white text-sm font-bold">
                          {getMealLabel()}
                        </p>
                        <p className="text-white/50 text-xs mt-0.5">
                          {meal.createdAt ? formatTime(lang, meal.createdAt) : ''}
                        </p>
                        {meal.items?.length > 0 && (
                          <p className="text-white/40 text-[10px] mt-0.5 truncate max-w-[120px]">
                            {meal.items.slice(0, 2).map(i => i.name).join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-teal-300 font-black text-lg">{Math.round(meal.totals?.calories || 0)}</p>
                        <p className="text-white/50 text-[10px] uppercase font-bold">{t('kcal_short')}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
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
    </PullToRefresh>
  );
});

Home.displayName = 'Home';

export default Home;