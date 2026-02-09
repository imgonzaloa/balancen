import React, { useState, useEffect, useMemo } from "react";
import { Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { HomeSkeleton } from "@/components/ui/ScreenSkeleton";
import StreakFire from "@/components/ui/StreakFire";
import UserHeader from "@/components/home/UserHeader";
import MomentumCard from "@/components/home/MomentumCard";
import DailyMissions from "@/components/home/DailyMissions";
import PrecisionCard from "@/components/home/PrecisionCard";

export default function Home() {
  // ALL HOOKS AT TOP - UNCONDITIONALLY
  const { user, profile: cachedProfile, todayMeals: cachedMeals, friends: cachedFriends, isInitialized } = useAppState();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(cachedProfile);
  const [todayMeals, setTodayMeals] = useState(cachedMeals || []);
  const [friends, setFriends] = useState(cachedFriends || []);
  const [loading, setLoading] = useState(!cachedProfile);

  // Fetch profile, meals, and friends once user is available
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

  // Calculate metrics
  const metrics = useMemo(() => {
    const totalCalories = todayMeals.reduce((sum, m) => sum + (m.estimated_calories || 0), 0);
    const totalProtein = todayMeals.reduce((sum, m) => sum + (m.estimated_protein || 0), 0);
    const totalCarbs = todayMeals.reduce((sum, m) => sum + (m.estimated_carbs || 0), 0);
    const totalFats = todayMeals.reduce((sum, m) => sum + (m.estimated_fats || 0), 0);
    const caloriesGoal = profile?.calories_goal || 2000;
    const progress = Math.min((totalCalories / caloriesGoal) * 100, 100);
    const strokeDashoffset = 440 - (progress / 100) * 440;
    
    // Momentum calculation (never resets to zero, persists across sessions)
    const trackingConsistency = Math.min((todayMeals.length / 3) * 100, 100);
    const goalAdherence = Math.min((totalCalories / caloriesGoal) * 100, 100);
    const baseMomentum = profile?.momentum_score || 0;
    const todayBoost = (trackingConsistency * 0.3 + goalAdherence * 0.2) * 0.5;
    const momentumScore = Math.min(Math.round(baseMomentum + todayBoost), 100);
    
    const hasPhotos = todayMeals.some(m => m.photo_url);
    const hasManualEntry = todayMeals.length > 0;

    return { 
      totalCalories, 
      totalProtein, 
      totalCarbs, 
      totalFats, 
      caloriesGoal, 
      strokeDashoffset, 
      progress,
      momentumScore,
      trackingConsistency,
      goalAdherence,
      hasPhotos,
      hasManualEntry
    };
  }, [todayMeals, profile?.calories_goal, profile?.momentum_score]);

  // Loading state
  if (!isInitialized || loading) {
    return <HomeSkeleton />;
  }

  return (
    <div className="min-h-screen" style={{ minHeight: '100dvh', paddingBottom: '96px', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-2xl mx-auto px-6 pt-2 pb-6 space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-black text-white mb-2">
            {t('home')}
          </h1>
          <p className="text-white/60 text-sm">
            {t('today_progress')}
          </p>
        </div>

        {/* Fire Score Card */}
        <div className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 backdrop-blur-xl rounded-3xl p-6 border border-amber-500/30">
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

        {/* Add Meal Button */}
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

        {/* Recent Meals */}
        {todayMeals && todayMeals.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-white font-bold text-lg">{lang === "es" ? "Comidas de hoy" : "Today's Meals"}</h3>
            <div className="grid grid-cols-2 gap-3">
              {todayMeals.slice(0, 4).map((meal) => (
                <div key={meal.id} className="bg-white/5 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10">
                  {meal.photo_url && (
                    <img src={meal.photo_url} alt="Meal" className="w-full h-24 object-cover" />
                  )}
                  <div className="p-3">
                    <p className="text-teal-300 font-semibold text-sm">{meal.estimated_calories} kcal</p>
                    <p className="text-white/60 text-xs">{meal.meal_time || new Date(meal.created_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* AI Coach Card */}
        <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 backdrop-blur-xl rounded-3xl p-6 border border-purple-500/20">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center flex-shrink-0">
              <span className="text-lg">✨</span>
            </div>
            <div className="flex-1">
              <p className="text-purple-300 font-semibold text-sm mb-1">{lang === "es" ? "Coach IA" : "AI Coach"}</p>
              <p className="text-white/80 text-sm leading-relaxed">
                {metrics.caloriesGoalProgress >= 100 
                  ? (lang === "es" ? "¡Excelente! Alcanzaste tu meta de calorías. Mantén la consistencia." : "Excellent! You hit your calorie goal. Keep up the consistency.")
                  : (lang === "es" ? "Sigue así, estás progresando bien. Registra más comidas para mejor precisión." : "Keep going, you're making progress. Log more meals for better accuracy.")
                }
              </p>
            </div>
          </div>
        </div>

        {/* Social Preview */}
        <SocialPreview friends={friends} profile={profile} />
      </div>
    </div>
  );
}