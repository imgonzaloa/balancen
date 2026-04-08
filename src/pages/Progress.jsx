import React, { useMemo } from "react";
import { Lock, BarChart3, Sparkles, Flame, Camera, Info } from "lucide-react";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { base44 } from "@/api/base44Client";
import { ProgressSkeleton } from "@/components/ui/ScreenSkeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import AdvancedAnalytics from "@/components/progress/AdvancedAnalytics";
import WeeklyCalorieChart from "@/components/progress/WeeklyCalorieChart";
import WeeklyConsistencyCard from "@/components/progress/WeeklyConsistencyCard";
import WeightTrackingCard from "@/components/progress/WeightTrackingCard";
import { useQuery } from "@tanstack/react-query";
import GlobalHeader from "@/components/GlobalHeader";
import PullToRefresh from "@/components/PullToRefresh";
import EmptyState from "@/components/ui/EmptyState";
import { getLocalDateKey } from "@/lib/utils";

export default function Progress() {
  // ✅ Use global AppState - no duplicate auth/profile fetch on every tab visit
  const { user, profile, isInitialized, profileLoading } = useAppState();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  const today = getLocalDateKey();
  const last7Days = useMemo(() => Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return getLocalDateKey(d);
  }), []);

  const { data: todayMeals = [] } = useQuery({
    queryKey: ["progressMeals", user?.email, today],
    queryFn: async () => {
      const meals = await base44.entities.MealLog.filter({ created_by: user.email }, "-meal_time", 50);
      return meals.filter(m => m.date === today);
    },
    enabled: !!user?.email,
    staleTime: 30 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const { data: weekMeals = [] } = useQuery({
    queryKey: ["progressWeekMeals", user?.email, last7Days[0]],
    queryFn: async () => {
      const meals = await base44.entities.MealLog.filter({ created_by: user.email }, "-date", 50);
      return meals.filter(m => last7Days.includes(m.date));
    },
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const loading = !isInitialized;

  const calculations = useMemo(() => {
    const totalCaloriesToday = todayMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0);
    const totalProtein = todayMeals.reduce((sum, m) => sum + (m.estimated_protein || 0), 0);
    const totalCarbs = todayMeals.reduce((sum, m) => sum + (m.estimated_carbs || 0), 0);
    const totalFiber = todayMeals.reduce((sum, m) => sum + (m.estimated_fiber || 0), 0);
    const totalNetCarbs = Math.max(0, totalCarbs - totalFiber);
    const totalFats = todayMeals.reduce((sum, m) => sum + (m.estimated_fats || 0), 0);
    const caloriesGoal = profile?.calories_goal || 2000;
    const trackingConsistency = Math.min((todayMeals.length / 3) * 100, 100);
    const goalAdherence = Math.min((totalCaloriesToday / caloriesGoal) * 100, 100);
    const momentumScore = Math.round((trackingConsistency * 0.5 + goalAdherence * 0.5));
    const caloriesProgress = Math.min((totalCaloriesToday / caloriesGoal) * 100, 100);
    const proteinProgress = Math.min((totalProtein / 150) * 100, 100);

    return { totalCaloriesToday, totalProtein, totalCarbs, totalFiber, totalNetCarbs, totalFats, caloriesGoal, trackingConsistency, goalAdherence, momentumScore, caloriesProgress, proteinProgress };
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

  const { data: progressSnapshots = [] } = useQuery({
    queryKey: ["progressSnapshots", user?.email],
    queryFn: () => base44.entities.ProgressSnapshot.filter({ created_by: user.email }, "-date", 20),
    enabled: !!user?.email,
    staleTime: 2 * 60 * 1000,
  });

  if (loading) return <ProgressSkeleton />;

  // Anonymous or no profile yet — show actionable empty state, never blank
  if (!user?.email || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6">
        <EmptyState
          emoji="📊"
          headline={{ es: 'Sin datos aún', en: 'No data yet', pt: 'Sem dados ainda' }}
          subtitle={{ es: 'Registrá una comida para empezar a ver tu progreso', en: 'Log a meal to start tracking your progress', pt: 'Registre uma refeição para começar a acompanhar seu progresso' }}
          buttonLabel={{ es: 'Ir al inicio', en: 'Go to Home', pt: 'Ir ao início' }}
          buttonPage="Home"
          lang={lang}
        />
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

        {/* WEIGHT TRACKING */}
        <WeightTrackingCard snapshots={progressSnapshots} lang={lang} userEmail={user?.email} />

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
               <div key={macro.label} className={`flex items-center gap-2`}>
                 <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: macro.color }} />
                 <span className="text-white/60 text-xs w-16">{macro.label}</span>
                 <span className="text-white font-semibold text-sm">{macro.value}{macro.unit}</span>
               </div>
             ))}
             {/* Net carbs row */}
             <div className="flex items-center gap-2 pl-2 pt-1 border-t border-white/10">
               <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#14b8a6' }} />
               <span className="text-white/60 text-xs w-16">{lang === 'es' ? 'Carbos netos' : lang === 'nl' ? 'Netto koolh.' : 'Net carbs'}</span>
               <span className="text-teal-300 font-semibold text-sm flex-1">{Math.round(calculations.totalCarbs * 0.85)}g</span>
               <div className="group relative">
                 <Info size={12} className="text-white/40 cursor-help" />
                 <div className="absolute bottom-full right-0 mb-1 px-2 py-1 bg-slate-700 rounded-md text-white text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                   {lang === 'es' ? 'Estimado. Registrá fibra manualmente para mayor precisión.' : lang === 'nl' ? 'Geschat. Log vezels handmatig voor meer nauwkeurigheid.' : 'Estimated. Log fiber manually for more accuracy.'}
                 </div>
               </div>
             </div>
            </div>
          </div>
        </div>

        {/* 7-DAY CALORIE BAR CHART */}
        <WeeklyCalorieChart
          weekMeals={weekMeals}
          caloriesGoal={calculations.caloriesGoal}
          lang={lang}
        />

        {/* WEEKLY CONSISTENCY */}
        <WeeklyConsistencyCard weekMeals={weekMeals} lang={lang} />

        {/* 7-DAY STREAK CHART */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
          <div className="flex items-center justify-between mb-4">
            <p className="text-white/60 text-xs font-semibold uppercase tracking-wide">7-Day Log</p>
            <div className="flex items-center gap-1.5">
              <Flame size={14} className="text-orange-400" />
              <span className="text-white font-bold text-sm">{profile?.current_streak || 0} {lang === 'es' ? 'días de racha' : lang === 'nl' ? 'dagen reeks' : 'day streak'}</span>
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
              {lang === 'es' ? 'Fotos de progreso' : lang === 'nl' ? 'Voortgangsfoto\'s' : 'Progress Photos'}
            </p>
            <p className="text-white/40 text-xs mt-0.5">
              {lang === 'es' ? 'Visualiza tu transformación' : lang === 'nl' ? 'Visualiseer je transformatie' : 'Visualize your transformation'}
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