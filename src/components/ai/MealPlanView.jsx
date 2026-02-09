import React from "react";
import { useTranslation } from "@/components/TranslationProvider";
import { ChefHat, ShoppingCart, Lightbulb, X } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MealPlanView({ plan, onClose }) {
  const { t } = useTranslation();

  if (!plan) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 overflow-y-auto">
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-3xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/20 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <ChefHat size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">
                    {t('your_meal_plan') || 'Your Meal Plan'}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {plan.meal_plan?.length} {t('days') || 'days'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-white" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Motivation */}
            {plan.motivation && (
              <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-2xl p-4 border border-teal-400/30">
                <p className="text-white/90 text-sm leading-relaxed">
                  {plan.motivation}
                </p>
              </div>
            )}

            {/* Daily Plans */}
            {plan.meal_plan?.map((day) => (
              <div key={day.day} className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-white">
                    {t('day') || 'Day'} {day.day}
                  </h3>
                  <span className="text-sm font-semibold text-amber-300">
                    {day.total_calories} {t('kcal_short') || 'kcal'}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {day.meals?.map((meal, idx) => (
                    <div key={idx} className="bg-white/5 rounded-xl p-4 border border-white/10">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-xs text-white/50 uppercase tracking-wide mb-1">
                            {meal.meal_type}
                          </p>
                          <h4 className="font-bold text-white">{meal.name}</h4>
                        </div>
                        <span className="text-sm font-semibold text-teal-300">
                          {meal.calories} {t('cal') || 'cal'}
                        </span>
                      </div>
                      <p className="text-sm text-white/70 mb-3">{meal.description}</p>
                      <div className="flex gap-4 text-xs">
                        <span className="text-blue-300">P: {meal.protein}g</span>
                        <span className="text-amber-300">C: {meal.carbs}g</span>
                        <span className="text-pink-300">F: {meal.fats}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {/* Shopping List */}
            {plan.shopping_list && (
              <div className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-5 border border-blue-400/30">
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart size={20} className="text-blue-300" />
                  <h3 className="text-lg font-bold text-white">
                    {t('shopping_list') || 'Shopping List'}
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(plan.shopping_list).map(([category, items]) => (
                    items?.length > 0 && (
                      <div key={category}>
                        <p className="text-xs text-white/50 uppercase tracking-wide mb-2">
                          {category}
                        </p>
                        <ul className="space-y-1">
                          {items.map((item, idx) => (
                            <li key={idx} className="text-sm text-white/80">
                              • {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {plan.tips?.length > 0 && (
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb size={20} className="text-amber-300" />
                  <h3 className="text-lg font-bold text-white">
                    {t('tips') || 'Tips'}
                  </h3>
                </div>
                <ul className="space-y-2">
                  {plan.tips.map((tip, idx) => (
                    <li key={idx} className="text-sm text-white/80">
                      • {tip}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Button
              onClick={onClose}
              className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold"
            >
              {t('close') || 'Close'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}