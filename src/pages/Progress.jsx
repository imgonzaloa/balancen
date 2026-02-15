import React, { useState, useEffect, useMemo } from "react";
import { TrendingUp, Target, Lock, Crown, Calendar, BarChart3 } from "lucide-react";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { base44 } from "@/api/base44Client";
import { ProgressSkeleton } from "@/components/ui/ScreenSkeleton";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import AdvancedAnalytics from "@/components/progress/AdvancedAnalytics";
import { motion } from "framer-motion";

export default function Progress() {
  const { user, profile: cachedProfile, todayMeals: cachedMeals, isInitialized } = useAppState();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(cachedProfile);
  const [todayMeals, setTodayMeals] = useState(cachedMeals || []);
  const [weekMeals, setWeekMeals] = useState([]);
  const [loading, setLoading] = useState(!cachedProfile);

  useEffect(() => {
    if (!user?.email) {
      setLoading(false);
      return;
    }
    
    if (cachedProfile) {
      setProfile(cachedProfile);
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        // Get 7 days of data
        const last7Days = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date();
          d.setDate(d.getDate() - i);
          return d.toISOString().split("T")[0];
        });

        const [profileData, mealsData, weekData] = await Promise.all([
          base44.entities.UserProfile.filter({ created_by: user.email }),
          base44.entities.MealLog.filter({
            created_by: user.email,
            date: new Date().toISOString().split("T")[0]
          }, "-meal_time").catch(() => []),
          base44.entities.MealLog.filter({
            created_by: user.email,
            date: { $in: last7Days }
          }, "-date").catch(() => [])
        ]);

        setProfile(profileData[0] || null);
        setTodayMeals(mealsData || []);
        setWeekMeals(weekData || []);
      } catch (err) {
        console.error("Failed to fetch progress data:", err);
        setProfile(null);
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

  const isPremium = profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator';

  if (!isInitialized || loading || !profile) {
    return <ProgressSkeleton />;
  }

  return (
    <div className="min-h-screen pb-24" style={{ minHeight: '100dvh', overflowY: 'auto' }}>
      <div className="max-w-2xl mx-auto px-6 pt-2 pb-6 space-y-6">
        <div>
          <h1 className="text-3xl font-black text-white mb-1">
            {t('progress')}
          </h1>
          <p className="text-white/60 text-sm">
            {t('track_your_journey')}
          </p>
        </div>

        {/* FREE USER: Limited View */}
        {!isPremium && (
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-pink-400/10 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center mx-auto mb-4 shadow-lg">
                <Lock size={32} className="text-white" />
              </div>
              <h3 className="text-white font-black text-xl mb-2">{t('locked_feature')}</h3>
              <p className="text-white/90 text-sm mb-6 leading-relaxed max-w-sm mx-auto">
                {t('premium_full_history')}
              </p>
              <Button
                onClick={() => navigate(createPageUrl('Premium'))}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold px-8 rounded-2xl shadow-xl"
              >
                {t('upgrade_now')}
              </Button>
            </div>
          </div>
        )}

        {/* TODAY'S DATA (Always visible) */}
        <div className="bg-gradient-to-br from-emerald-500/20 to-teal-500/20 backdrop-blur-xl rounded-3xl p-6 border border-emerald-500/30">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-emerald-300 text-sm font-semibold uppercase tracking-wide">
                {t('momentum_score')}
              </p>
              <p className="text-white/50 text-xs mt-1">
                {t('never_resets')}
              </p>
            </div>
            <div className="text-5xl font-black text-white">{calculations.momentumScore}</div>
          </div>
          <div className="h-3 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400" style={{ width: `${calculations.momentumScore}%`, transition: 'width 1s ease' }} />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/60 text-xs">{t('consistency_label')}</p>
              <p className="text-white font-bold">{Math.round(calculations.trackingConsistency)}%</p>
            </div>
            <div className="bg-white/5 rounded-lg p-3">
              <p className="text-white/60 text-xs">{t('adherence_label')}</p>
              <p className="text-white font-bold">{Math.round(calculations.goalAdherence)}%</p>
            </div>
          </div>
        </div>

        {/* Progress Rings (Today) */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: t('calories'), value: calculations.totalCaloriesToday, goal: calculations.caloriesGoal, progress: calculations.caloriesProgress, color: "#f97316" },
            { label: t('protein'), value: `${Math.round(calculations.totalProtein)}g`, progress: calculations.proteinProgress, color: "#3b82f6" }
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

        {/* PREMIUM: Advanced Analytics Dashboard */}
        {isPremium && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <AdvancedAnalytics
              profile={profile}
              todayMeals={todayMeals}
              weekMeals={weekMeals}
            />
          </motion.div>
        )}
      </div>
    </div>
  );
}