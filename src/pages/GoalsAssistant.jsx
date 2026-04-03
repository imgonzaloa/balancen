import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";
import { ArrowLeft, Sparkles, Target, TrendingUp, Zap, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { createPageUrl } from "@/utils";
import MealPlanCard from "@/components/ai/MealPlanCard";
import WorkoutCard from "@/components/ai/WorkoutCard";
import EnhancedMealPlanView from "@/components/ai/EnhancedMealPlanView";
import WorkoutView from "@/components/ai/WorkoutView";

export default function GoalsAssistant() {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAppState();
  const { t, lang } = useTranslation();
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendations, setRecommendations] = useState(null);
  const [applying, setApplying] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);
  const [workout, setWorkout] = useState(null);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data } = await base44.functions.invoke('aiGoalsAssistant', {
        action: 'analyze',
        lang
      });

      if (data.success) {
        setRecommendations(data.recommendations);
      } else {
        toast.error(t('analysis_failed'));
      }
    } catch (err) {
      console.error('Analysis error:', err);
      toast.error(t('analysis_failed'));
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApply = async () => {
    if (!recommendations) return;

    setApplying(true);
    try {
      await base44.functions.invoke('aiGoalsAssistant', {
        action: 'apply',
        recommended_calories: recommendations.recommended_calories,
        recommended_protein: recommendations.recommended_protein,
        recommended_carbs: recommendations.recommended_carbs,
        recommended_fats: recommendations.recommended_fats
      });

      toast.success(t('goals_updated'));
      await refreshProfile?.();
      setTimeout(() => {
        navigate(createPageUrl('Profile'));
      }, 1000);
    } catch (err) {
      console.error('Apply error:', err);
      toast.error(t('update_failed'));
    } finally {
      setApplying(false);
    }
  };

  // Check if premium
  const isPremium = profile?.is_premium || profile?.role === 'owner' || profile?.role === 'collaborator';

  return (
    <div className="min-h-screen relative overflow-hidden pb-24" style={{ minHeight: '100dvh' }}>
      {/* Background */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 right-0 w-96 h-96 bg-purple-500 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-teal-500 rounded-full blur-3xl" />
      </div>

      <div className="max-w-2xl mx-auto px-6 pt-6 pb-8 relative z-10">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-white flex items-center gap-2">
              <Sparkles size={24} className="text-purple-400" />
              {t('ai_goals_assistant') || 'AI Goals Assistant'}
            </h1>
            <p className="text-white/60 text-sm">
              {t('ai_goals_desc') || 'Get personalized goal recommendations'}
            </p>
          </div>
        </div>

        {/* Premium Lock */}
        {!isPremium && (
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 backdrop-blur-xl rounded-3xl p-8 border border-purple-500/30 text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mx-auto mb-4">
              <Sparkles size={28} className="text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">
              {t('premium_feature') || 'Premium Feature'}
            </h3>
            <p className="text-white/70 text-sm mb-6">
              {t('ai_goals_premium_desc') || 'Unlock AI-powered personalized goal recommendations with Premium'}
            </p>
            <Button
              onClick={() => navigate(createPageUrl('Premium'))}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
            >
              {t('upgrade_to_premium') || 'Upgrade to Premium'}
            </Button>
          </div>
        )}

        {/* Content */}
        {isPremium && (
          <>
            {/* Current Goals */}
            <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20 mb-6">
              <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Target size={20} className="text-teal-400" />
                {t('current_goals') || 'Your Current Goals'}
              </h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5">
                  <span className="text-white/70 text-sm">{t('daily_calories')}</span>
                  <span className="font-semibold text-white">
                    {profile?.calories_goal ? `${profile.calories_goal} kcal` : t('not_set')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5">
                  <span className="text-white/70 text-sm">{t('primary_goal')}</span>
                  <span className="font-semibold text-white capitalize">
                    {profile?.primary_goal?.replace(/_/g, ' ') || t('not_set')}
                  </span>
                </div>
                <div className="flex items-center justify-between py-3 px-4 rounded-xl bg-white/5">
                  <span className="text-white/70 text-sm">{t('intensity')}</span>
                  <span className="font-semibold text-white capitalize">
                    {profile?.intensity_level || t('not_set')}
                  </span>
                </div>
              </div>
            </div>

            {/* Analyze Button */}
            {!recommendations && (
              <button
                onClick={handleAnalyze}
                disabled={analyzing}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-3xl p-6 border border-purple-400/50 shadow-lg shadow-purple-500/20 transition-all disabled:opacity-50"
              >
                <div className="flex items-center justify-center gap-3">
                  {analyzing ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span className="text-white font-bold">
                        {t('analyzing') || 'Analyzing your data...'}
                      </span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={24} className="text-white" />
                      <span className="text-white font-bold text-lg">
                        {t('get_ai_recommendations') || 'Get AI Recommendations'}
                      </span>
                    </>
                  )}
                </div>
              </button>
            )}

            {/* Recommendations */}
            {recommendations && (
              <div className="space-y-6">
                {/* Motivation */}
                <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 backdrop-blur-xl rounded-3xl p-6 border border-teal-400/30">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-400 flex items-center justify-center flex-shrink-0">
                      <Zap size={20} className="text-white" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold mb-2">
                        {t('personalized_insight') || 'Personalized Insight'}
                      </h3>
                      <p className="text-white/90 text-sm leading-relaxed">
                        {recommendations.motivation_message}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Recommendations Card */}
                <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 border border-white/20">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <TrendingUp size={20} className="text-purple-400" />
                    {t('recommended_goals') || 'Recommended Goals'}
                  </h2>
                  
                  <div className="space-y-4 mb-6">
                    <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-2xl p-4 border border-purple-400/20">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/70 text-sm font-semibold">
                          {t('daily_calories')}
                        </span>
                        <span className="text-2xl font-bold text-purple-300">
                          {recommendations.recommended_calories} kcal
                        </span>
                      </div>
                      <p className="text-xs text-white/60">
                        {t('based_on_your_activity') || 'Based on your activity and goals'}
                      </p>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                        <p className="text-xs text-white/60 mb-1">{t('protein')}</p>
                        <p className="text-xl font-bold text-teal-300">
                          {recommendations.recommended_protein}g
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                        <p className="text-xs text-white/60 mb-1">{t('carbs')}</p>
                        <p className="text-xl font-bold text-amber-300">
                          {recommendations.recommended_carbs}g
                        </p>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 text-center border border-white/10">
                        <p className="text-xs text-white/60 mb-1">{t('fats')}</p>
                        <p className="text-xl font-bold text-pink-300">
                          {recommendations.recommended_fats}g
                        </p>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                      <div className="flex items-center justify-between">
                        <span className="text-white/70 text-sm">{t('activity_goal')}</span>
                        <span className="text-lg font-bold text-white">
                          {recommendations.activity_days_per_week} {t('days_per_week') || 'days/week'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Explanation */}
                  <div className="bg-white/5 rounded-2xl p-4 border border-white/10 mb-6">
                    <p className="text-white/90 text-sm leading-relaxed">
                      {recommendations.explanation}
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={handleAnalyze}
                      disabled={analyzing}
                      className="flex-1 py-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition-colors disabled:opacity-50"
                    >
                      {t('reanalyze') || 'Reanalyze'}
                    </button>
                    <button
                      onClick={handleApply}
                      disabled={applying}
                      className="flex-1 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {applying ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Check size={18} />
                          {t('apply_goals') || 'Apply Goals'}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* AI Coaching Cards */}
            <div className="mt-8 space-y-6">
              <div className="border-t border-white/10 pt-6">
                <h2 className="text-xl font-bold text-white mb-4">
                  {t('ai_coaching_tools') || 'AI Coaching Tools'}
                </h2>
              </div>

              <MealPlanCard onGenerate={setMealPlan} />
              <WorkoutCard onGenerate={setWorkout} />
            </div>
          </>
        )}
      </div>

      {/* Meal Plan Modal */}
      {mealPlan && (
        <EnhancedMealPlanView plan={mealPlan} onClose={() => setMealPlan(null)} />
      )}

      {/* Workout Modal */}
      {workout && (
        <WorkoutView workout={workout} onClose={() => setWorkout(null)} />
      )}
    </div>
  );
}