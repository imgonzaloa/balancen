import React, { useState, useEffect, useMemo } from "react";
import { TrendingUp, Target } from "lucide-react";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { base44 } from "@/api/base44Client";
import { ProgressSkeleton } from "@/components/ui/ScreenSkeleton";

export default function Progress() {
  // ALL HOOKS AT TOP
  const { user, profile: cachedProfile, todayMeals: cachedMeals, isInitialized } = useAppState();
  const { t, lang } = useTranslation();
  const [profile, setProfile] = useState(cachedProfile);
  const [todayMeals, setTodayMeals] = useState(cachedMeals || []);
  const [loading, setLoading] = useState(!cachedProfile);

  useEffect(() => {
    if (!user?.email || cachedProfile) return;

    const fetchData = async () => {
      try {
        const [profileData, mealsData] = await Promise.all([
          base44.entities.UserProfile.filter({ created_by: user.email }),
          base44.entities.MealLog.filter({
            created_by: user.email,
            date: new Date().toISOString().split("T")[0]
          }, "-meal_time")
        ]);

        setProfile(profileData[0] || null);
        setTodayMeals(mealsData || []);
      } catch (err) {
        console.error("Failed to fetch progress data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user?.email, cachedProfile]);

  const calculations = useMemo(() => {
    const totalCaloriesToday = todayMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0);
    const totalProtein = todayMeals.reduce((sum, m) => sum + (m.estimated_protein || 0), 0);
    const caloriesGoal = profile?.calories_goal || 2000;
    const trackingConsistency = Math.min((todayMeals.length / 3) * 100, 100);
    const goalAdherence = Math.min((totalCaloriesToday / caloriesGoal) * 100, 100);
    const momentumScore = Math.round((trackingConsistency * 0.5 + goalAdherence * 0.5));
    const caloriesProgress = Math.min((totalCaloriesToday / caloriesGoal) * 100, 100);
    const proteinProgress = Math.min((totalProtein / 150) * 100, 100);

    return { totalCaloriesToday, totalProtein, caloriesGoal, trackingConsistency, goalAdherence, momentumScore, caloriesProgress, proteinProgress };
  }, [todayMeals, profile?.calories_goal]);

  if (!isInitialized || loading) {
    return <ProgressSkeleton />;
  }

  return (
    <div className="min-h-screen pb-24" style={{ minHeight: '100dvh', overflowY: 'auto' }}>
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div>
          <h1 className="text-3xl font-black text-white mb-2">
            {lang === "es" ? "Tu Progreso" : "Your Progress"}
          </h1>
          <p className="text-white/60 text-sm">
            {lang === "es" ? "Análisis completo de tu evolución" : "Complete analysis of your evolution"}
          </p>
        </div>

        {/* Momentum Score */}
        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-3xl p-6 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-emerald-300 text-sm font-semibold uppercase tracking-wide">
                {lang === "es" ? "Momentum Score" : "Momentum Score"}
              </p>
              <p className="text-white/50 text-xs mt-1">
                {lang === "es" ? "Nunca vuelve a cero" : "Never resets"}
              </p>
            </div>
            <div className="text-5xl font-black text-white">{calculations.momentumScore}</div>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${calculations.momentumScore}%`, transition: 'width 1s ease' }} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/60 text-xs">{lang === "es" ? "Consistencia" : "Consistency"}</p>
              <p className="text-white font-bold">{Math.round(calculations.trackingConsistency)}%</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/60 text-xs">{lang === "es" ? "Adherencia" : "Adherence"}</p>
              <p className="text-white font-bold">{Math.round(calculations.goalAdherence)}%</p>
            </div>
          </div>
        </div>

        {/* Progress Rings */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: lang === "es" ? "Calorías" : "Calories", value: calculations.totalCaloriesToday, goal: calculations.caloriesGoal, progress: calculations.caloriesProgress, color: "#f97316" },
            { label: lang === "es" ? "Proteína" : "Protein", value: `${Math.round(calculations.totalProtein)}g`, progress: calculations.proteinProgress, color: "#3b82f6" }
          ].map((item, i) => (
            <div key={i} className="bg-slate-800/50 backdrop-blur-xl rounded-2xl p-5 border border-white/10">
              <div className="w-28 h-28 mx-auto relative">
                <svg width="112" height="112" className="transform -rotate-90">
                  <circle cx="56" cy="56" r="48" stroke="rgba(255,255,255,0.1)" strokeWidth="10" fill="none" />
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke={item.color}
                    strokeWidth="10"
                    fill="none"
                    strokeLinecap="round"
                    strokeDasharray="301"
                    strokeDashoffset={301 - (item.progress / 100) * 301}
                    style={{ transition: 'stroke-dashoffset 1s ease' }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-2xl font-black text-white">{typeof item.value === 'number' ? Math.round(item.value) : item.value}</div>
                  {item.goal && <div className="text-[10px] text-white/40">/ {item.goal}</div>}
                </div>
              </div>
              <p className="text-white/60 text-xs text-center mt-2">{item.label}</p>
            </div>
          ))}
        </div>

        {/* AI Insight */}
        <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-2xl p-4 border border-purple-500/30">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-purple-500/30 flex items-center justify-center flex-shrink-0">
              <Target size={16} className="text-purple-300" />
            </div>
            <div>
              <p className="text-purple-300 text-xs font-semibold mb-1">
                {lang === "es" ? "IA Coach" : "AI Coach"}
              </p>
              <p className="text-white text-sm">
                {lang === "es" ? "Buen progreso hoy. Mantén el ritmo." : "Good progress today. Keep it up."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}