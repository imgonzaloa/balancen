import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useTranslation } from "@/components/TranslationProvider";
import { ChefHat, ShoppingCart, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function MealPlanCard({ onGenerate }) {
  const { t, lang } = useTranslation();
  const [generating, setGenerating] = useState(false);
  const [dietary, setDietary] = useState("");
  const [preferences, setPreferences] = useState("");
  const [days, setDays] = useState(7);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const { data } = await base44.functions.invoke('aiMealPlanner', {
        dietary_restrictions: dietary,
        preferences,
        days,
        lang
      });

      if (data.success) {
        onGenerate?.(data.plan);
        toast.success(t('meal_plan_generated') || 'Meal plan generated');
      } else {
        toast.error(t('generation_failed') || 'Failed to generate meal plan');
      }
    } catch (err) {
      console.error('Generation error:', err);
      toast.error(t('generation_failed') || 'Failed to generate meal plan');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 backdrop-blur-xl rounded-3xl p-6 border border-orange-400/30">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center">
          <ChefHat size={24} className="text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-white">
            {t('ai_meal_planner') || 'AI Meal Planner'}
          </h3>
          <p className="text-white/70 text-sm">
            {t('personalized_meal_plans') || 'Personalized meal plans'}
          </p>
        </div>
      </div>

      <div className="space-y-3 mb-4">
        <div>
          <label className="text-white/70 text-xs mb-1 block">
            {t('dietary_restrictions') || 'Dietary Restrictions'}
          </label>
          <input
            type="text"
            value={dietary}
            onChange={(e) => setDietary(e.target.value)}
            placeholder={t('dietary_placeholder') || 'e.g., vegan, gluten-free'}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40"
          />
        </div>

        <div>
          <label className="text-white/70 text-xs mb-1 block">
            {t('food_preferences') || 'Food Preferences'}
          </label>
          <input
            type="text"
            value={preferences}
            onChange={(e) => setPreferences(e.target.value)}
            placeholder={t('preferences_placeholder') || 'e.g., loves chicken, no seafood'}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40"
          />
        </div>

        <div>
          <label className="text-white/70 text-xs mb-1 block">
            {t('plan_duration') || 'Plan Duration'}
          </label>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white"
          >
            <option value={3}>3 {t('days') || 'days'}</option>
            <option value={7}>7 {t('days') || 'days'}</option>
            <option value={14}>14 {t('days') || 'days'}</option>
          </select>
        </div>
      </div>

      <Button
        onClick={handleGenerate}
        disabled={generating}
        className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold"
      >
        {generating ? (
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            {t('generating') || 'Generating...'}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Sparkles size={18} />
            {t('generate_meal_plan') || 'Generate Meal Plan'}
          </div>
        )}
      </Button>
    </div>
  );
}