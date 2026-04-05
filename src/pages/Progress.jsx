import React, { useMemo } from "react";
import { Lock, BarChart3, Sparkles, Flame, Camera } from "lucide-react";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { base44 } from "@/api/base44Client";
import { ProgressSkeleton } from "@/components/ui/ScreenSkeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import AdvancedAnalytics from "@/components/progress/AdvancedAnalytics";
import { useQuery } from "@tanstack/react-query";
import GlobalHeader from "@/components/GlobalHeader";
import PullToRefresh from "@/components/PullToRefresh";

export default function Progress() {
  // ✅ Use global AppState - no duplicate auth/profile fetch on every tab visit
  const { user, profile, isInitialized, profileLoading } = useAppState();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const today = new Date().toISOString().split("T")[0];
  const last7Days = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return d.toISOString().split("T")[0];
  }), []);

  const { data: todayMeals = [] } = useQuery({
    queryKey: ["progressMeals", user?.email, today],
    queryFn: () => base44.entities.MealLog.filter({ created_by: user.email, date: today }, "-meal_time"),
    enabled: !!user?.email,
    staleTime: 30 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: weekMeals = [] } = useQuery({
    queryKey: ["progressWeekMeals", user?.email, last7Days[0]],
    queryFn: () => base44.entities.MealLog.filter({ created_by: user.email, date: { $in: last7Days } }, "-date"),
    enabled: !!user?.email,
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const loading = !isInitialized;

  const calculations = useMemo(() => {
    const totalCaloriesToday = todayMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0);
    const totalProtein = todayMeals.reduce((sum, m) => sum + (m.estimated_protein || 0), 0);
    const totalCarbs = todayMeals.reduce((sum, m) => sum + (m.estimated_carbs || 0), 0);
    const totalFats = todayMeals.reduce((sum, m) => sum + (m.estimated_fats || 0), 0);
    const caloriesGoal = profile?.calories_goal || 2000;
    const trackingConsistency = Math.min((todayMeals.length / 3) * 100, 100);
    const goalAdherence = Math.min((totalCaloriesToday / caloriesGoal) * 100, 100);
    const momentumScore = Math.round((trackingConsistency * 0.5 + goalAdherence * 0.5));
    const caloriesProgress = Math.min((totalCaloriesToday / caloriesGoal) * 100, 100);
    const proteinProgress = Math.min((totalProtein / 150) * 100, 100);

    return { totalCaloriesToday, totalProtein, totalCarbs, totalFats, caloriesGoal, trackingConsistency, goalAdherence, momentumScore, caloriesProgress, proteinProgress };
  }, [todayMeals, profile?.calories_goal]);

  // 7-day log chart: which days had at least 1 meal logged
  const weekActivity = useMemo(() => {
    const daysWithMeals = new Set(weekMeals.map(m => m.date));
    return last7Days.map(date => ({
      date,
      logged: daysWithMeals.has(date),
      dayLabel: new Date(date + 'T12:00:00').toLocaleDateString(undefined, { weekday: 'short' }).slice(0, 1),
    })).reverse();
  }, [weekMeals, last7Days]);

  const isPremium = profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator';

  const { data: recentPhotos = [] } = useQuery({
    queryKey: ["bodyPhotosRecent", user?.email],
    queryFn: () => base44.entities.BodyPhoto.filter({ created_by: user.email }, "-date", 1),
    enabled: !!user?.email && isPremium,
    staleTime: 10 * 60 * 1000,
  });

  if (loading) return <ProgressSkeleton />;

  // Anonymous or no profile yet — show actionable empty state, never blank
  if (!user?.email || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6">
            <BarChart3 size={40} className="text-white/30" />
          </div>
          <h2 className="text-white text-2xl font-bold mb-3">
            {t('no_data_yet')}
          </h2>
          <p className="text-white/60 mb-8">
            {t('log_a_meal_to_start_tracking')}
          </p>
          <Button
            onClick={() => navigate(createPageUrl('Home'))}
            className="bg-gradient-to-r from-teal-500 to-emerald-500 text-white font-bold"
          >
            {t('go_to_home')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh>
    <div style={{ minHeight: '100%', paddingBottom: '8px' }}>
      <div className="max-w-2xl mx-auto px-6 pt-2 pb-6 space-y-6">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">
            {t('progress')}
          </h1>
          <p className="text-white/60 text-sm">
            {t('track_your_journey')}
          </p>
        </div>

        {/* TODAY'S CALORIES — ring + goal */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
          <p className="text-white/60 text-xs font-semibold uppercase tracking-wide mb-4">{t('calories')}</p>
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 relative flex-shrink-0">
              <svg width="96" height="96" className="transform -rotate-90">
                <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.1)" strokeWidth="9" fill="none" />
                <circle cx="48" cy="48" r="40" stroke="#f97316" strokeWidth="9" fill="none"
                  strokeLinecap="round" strokeDasharray="251"
                  strokeDashoffset={251 - (calculations.caloriesProgress / 100) * 251}
                  style={{ transition: 'stroke-dashoffset 1s ease' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-xl font-black text-white">{Math.round(calculations.totalCaloriesToday)}</div>
                <div className="text-[10px] text-white/40">/ {calculations.caloriesGoal}</div>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              {[
                { label: t('protein'), value: Math.round(calculations.totalProtein), unit: 'g', color: '#3b82f6' },
                { label: t('carbs') || 'Carbs', value: Math.round(calculations.totalCarbs), unit: 'g', color: '#a855f7' },
                { label: t('fats') || 'Fats', value: Math.round(calculations.totalFats), unit: 'g', color: '#f59e0b' },
              ].map(macro => (
                <div key={macro.label} className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: macro.color }} />
                  <span className="text-white/60 text-xs w-14">{macro.label}</span>
                  <span className="text-white font-semibold text-sm">{macro.value}{macro.unit}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 7-DAY STREAK CHART */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">7-Day Log</p>
            <div className="flex items-center gap-1.5">
              <Flame size={14} className="text-orange-400" />
              <span className="text-white font-bold text-sm">{profile?.current_streak || 0} {lang === 'es' ? 'días de racha' : lang === 'pt' ? 'dias de sequência' : 'day streak'}</span>
            </div>
          </div>
          <div className="flex items-end justify-between gap-2">
            {weekActivity.map(({ date, logged, dayLabel }) => (
              <div key={date} className="flex flex-col items-center gap-1 flex-1">
                <div className={`w-full rounded-lg transition-all ${logged ? 'bg-teal-400 h-8' : 'bg-white/10 h-4'}`} />
                <span className="text-white/40 text-[10px]">{dayLabel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* PROGRESS PHOTOS CARD */}
        <button
          onClick={() => navigate(createPageUrl("ProgressPhotos"))}
          className="w-full bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-white/10 flex items-center gap-4 text-left hover:border-teal-500/40 transition-all"
        >
          <div className="w-14 h-14 rounded-xl overflow-hidden flex-shrink-0 bg-white/5 flex items-center justify-center">
            {recentPhotos[0]?.photo_url ? (
              <img src={recentPhotos[0].photo_url} alt="recent" className="w-full h-full object-cover" />
            ) : (
              <Camera size={24} className="text-white/30" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm">
              {lang === 'es' ? 'Fotos de progreso' : lang === 'pt' ? 'Fotos de progresso' : 'Progress Photos'}
            </p>
            <p className="text-white/40 text-xs mt-0.5">
              {lang === 'es' ? 'Visualiza tu transformación' : lang === 'pt' ? 'Visualize sua transformação' : 'Visualize your transformation'}
            </p>
          </div>
          <Camera size={18} className="text-teal-400 flex-shrink-0" />
        </button>

        {/* PREMIUM: Advanced Analytics Dashboard */}
        {isPremium ? (
          <AdvancedAnalytics
            profile={profile}
            todayMeals={todayMeals}
            weekMeals={weekMeals}
          />
        ) : (
          /* Upgrade prompt for free users */
          <div className="relative rounded-2xl overflow-hidden border border-white/10">
            {/* Blurred preview */}
            <div className="blur-sm pointer-events-none p-5 bg-slate-800/50 space-y-3">
              <div className="h-4 bg-white/10 rounded w-2/3" />
              <div className="h-20 bg-white/5 rounded-xl" />
              <div className="grid grid-cols-3 gap-2">
                {[1,2,3].map(i => <div key={i} className="h-12 bg-white/10 rounded-lg" />)}
              </div>
            </div>
            {/* Overlay */}
            <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col items-center justify-center text-center p-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center mb-3 shadow-lg">
                <Sparkles size={20} className="text-white" />
              </div>
              <p className="text-white font-bold text-sm mb-1">Unlock advanced analytics</p>
              <p className="text-white/60 text-xs mb-4 max-w-xs">
                See weekly trends, AI insights and detailed nutrition breakdowns
              </p>
              <Button
                onClick={() => navigate(createPageUrl('Premium'))}
                className="bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-sm px-6 rounded-xl shadow-lg"
              >
                {t('upgrade_now')}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
    </PullToRefresh>
  );
}