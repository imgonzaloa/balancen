import React, { useState } from "react";
import { useTranslation } from "@/components/TranslationProvider";
import { ChefHat, ShoppingCart, Lightbulb, X, ChevronDown, TrendingUp, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

const MacroBar = ({ label, value, goal, color, icon: Icon }) => {
  const percentage = Math.min((value / goal) * 100, 100);
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-2"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={16} className={color} />
          <span className="text-white/70 text-sm font-medium">{label}</span>
        </div>
        <span className={`${color} font-bold text-sm`}>{value}g</span>
      </div>
      <div className="h-2 bg-white/10 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full ${color.replace('text-', 'bg-').replace('/70', '')} rounded-full`}
        />
      </div>
      <div className="text-xs text-white/40 text-right">{goal}g goal</div>
    </motion.div>
  );
};

const DayCard = ({ day, index }) => {
  const [expanded, setExpanded] = useState(false);
  const totalMacros = day.meals?.reduce((acc, meal) => ({
    protein: acc.protein + (meal.protein || 0),
    carbs: acc.carbs + (meal.carbs || 0),
    fats: acc.fats + (meal.fats || 0)
  }), { protein: 0, carbs: 0, fats: 0 }) || { protein: 0, carbs: 0, fats: 0 };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-gradient-to-br from-white/5 to-white/[0.02] rounded-2xl border border-white/10 overflow-hidden hover:border-white/20 transition-all"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full p-5 flex items-center justify-between"
      >
        <div className="text-left">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl font-black text-white">Day {day.day}</span>
            <span className="text-xs px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 font-bold">
              {day.total_calories} kcal
            </span>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="text-blue-300/70">P: {totalMacros.protein}g</span>
            <span className="text-amber-300/70">C: {totalMacros.carbs}g</span>
            <span className="text-pink-300/70">F: {totalMacros.fats}g</span>
          </div>
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown size={20} className="text-white/40" />
        </motion.div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="border-t border-white/10 px-5 py-4 space-y-4 bg-white/[0.02]"
          >
            {day.meals?.map((meal, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="space-y-3"
              >
                <div>
                  <div className="flex items-start justify-between mb-1">
                    <div>
                      <p className="text-xs text-white/40 uppercase tracking-widest font-bold">
                        {meal.meal_type}
                      </p>
                      <h4 className="font-bold text-white text-sm">{meal.name}</h4>
                    </div>
                    <div className="text-right">
                      <p className="text-teal-300 font-bold text-sm">{meal.calories}</p>
                      <p className="text-xs text-white/40">kcal</p>
                    </div>
                  </div>
                  <p className="text-xs text-white/60">{meal.description}</p>
                </div>

                {/* Macros breakdown */}
                <div className="grid grid-cols-3 gap-2 bg-white/5 rounded-lg p-3">
                  <div className="text-center">
                    <p className="text-blue-300 text-xs font-bold">{meal.protein}g</p>
                    <p className="text-white/40 text-[10px]">Protein</p>
                  </div>
                  <div className="text-center">
                    <p className="text-amber-300 text-xs font-bold">{meal.carbs}g</p>
                    <p className="text-white/40 text-[10px]">Carbs</p>
                  </div>
                  <div className="text-center">
                    <p className="text-pink-300 text-xs font-bold">{meal.fats}g</p>
                    <p className="text-white/40 text-[10px]">Fats</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default function EnhancedMealPlanView({ plan, onClose }) {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('meals');

  if (!plan) return null;

  const totalMacros = plan.meal_plan?.reduce((acc, day) => {
    const dayMacros = day.meals?.reduce((m, meal) => ({
      protein: m.protein + (meal.protein || 0),
      carbs: m.carbs + (meal.carbs || 0),
      fats: m.fats + (meal.fats || 0),
      calories: m.calories + (meal.calories || 0)
    }), { protein: 0, carbs: 0, fats: 0, calories: 0 });
    return {
      protein: acc.protein + dayMacros.protein,
      carbs: acc.carbs + dayMacros.carbs,
      fats: acc.fats + dayMacros.fats,
      calories: acc.calories + dayMacros.calories
    };
  }, { protein: 0, carbs: 0, fats: 0, calories: 0 });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 overflow-y-auto"
    >
      <div className="min-h-screen py-6 px-4">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="max-w-3xl mx-auto bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/10 overflow-hidden"
        >
          {/* Premium Header */}
          <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 relative overflow-hidden p-6">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 4 }}
                  className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center"
                >
                  <ChefHat size={28} className="text-white" />
                </motion.div>
                <div>
                  <h2 className="text-2xl font-black text-white">
                    {t('your_meal_plan') || 'Your Meal Plan'}
                  </h2>
                  <p className="text-white/80 text-sm">
                    {plan.meal_plan?.length} {t('days') || 'days'} • {totalMacros.calories} kcal
                  </p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
              >
                <X size={20} className="text-white" />
              </motion.button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Summary Stats */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-2xl p-4 border border-orange-400/30">
                <div className="flex items-center gap-2 mb-2">
                  <Flame size={16} className="text-orange-300" />
                  <p className="text-orange-300 text-xs font-bold uppercase">Avg Daily Calories</p>
                </div>
                <p className="text-3xl font-black text-white">
                  {Math.round(totalMacros.calories / (plan.meal_plan?.length || 1))}
                </p>
              </div>

              <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 rounded-2xl p-4 border border-teal-400/30">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={16} className="text-teal-300" />
                  <p className="text-teal-300 text-xs font-bold uppercase">Macros Balance</p>
                </div>
                <p className="text-sm text-white/80 mt-1">
                  <span className="text-blue-300 font-bold">{Math.round((totalMacros.protein / totalMacros.calories) * 100 * 4)}%</span>
                  <span className="text-white/50"> • </span>
                  <span className="text-amber-300 font-bold">{Math.round((totalMacros.carbs / totalMacros.calories) * 100 * 4)}%</span>
                  <span className="text-white/50"> • </span>
                  <span className="text-pink-300 font-bold">{Math.round((totalMacros.fats / totalMacros.calories) * 100 * 9)}%</span>
                </p>
              </div>
            </motion.div>

            {/* Motivation */}
            {plan.motivation && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl p-5 border border-cyan-400/20 italic"
              >
                <p className="text-white/90 text-sm leading-relaxed">
                  "{plan.motivation}"
                </p>
              </motion.div>
            )}

            {/* Tabs */}
            <div className="flex gap-2 bg-white/5 rounded-xl p-1">
              {['meals', 'shopping', 'tips'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-semibold transition-all ${
                    activeTab === tab
                      ? 'bg-white/20 text-white'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  {tab === 'meals' ? '🍽️ Meals' : tab === 'shopping' ? '🛒 Shopping' : '💡 Tips'}
                </button>
              ))}
            </div>

            {/* Meals Tab */}
            {activeTab === 'meals' && (
              <div className="space-y-3">
                {plan.meal_plan?.map((day, idx) => (
                  <DayCard key={day.day} day={day} index={idx} />
                ))}
              </div>
            )}

            {/* Shopping Tab */}
            {activeTab === 'shopping' && plan.shopping_list && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-gradient-to-br from-blue-500/20 to-cyan-500/20 rounded-2xl p-6 border border-blue-400/30 space-y-4"
              >
                <div className="flex items-center gap-2 mb-4">
                  <ShoppingCart size={22} className="text-blue-300" />
                  <h3 className="text-lg font-bold text-white">
                    {t('shopping_list') || 'Shopping List'}
                  </h3>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  {Object.entries(plan.shopping_list).map(([category, items]) =>
                    items?.length > 0 && (
                      <motion.div
                        key={category}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                      >
                        <p className="text-xs text-blue-300 uppercase tracking-widest font-bold mb-3">
                          {category}
                        </p>
                        <ul className="space-y-1.5">
                          {items.map((item, idx) => (
                            <li key={idx} className="text-sm text-white/80 flex items-start gap-2">
                              <span className="text-blue-300 mt-0.5">✓</span>
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </motion.div>
                    )
                  )}
                </div>
              </motion.div>
            )}

            {/* Tips Tab */}
            {activeTab === 'tips' && plan.tips?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-3"
              >
                {plan.tips.map((tip, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-xl p-4 border border-amber-400/20 flex gap-3"
                  >
                    <Lightbulb size={18} className="text-amber-300 flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-white/90">{tip}</p>
                  </motion.div>
                ))}
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <Button
                onClick={onClose}
                className="w-full bg-gradient-to-r from-white/10 to-white/5 hover:from-white/20 hover:to-white/10 text-white font-semibold transition-all"
              >
                {t('close') || 'Close'}
              </Button>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}