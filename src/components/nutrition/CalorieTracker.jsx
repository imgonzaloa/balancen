import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Plus, Flame, X, Loader2 } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import CalorieGoalCard from "./CalorieGoalCard";
import { useTranslation } from "@/components/TranslationProvider";

export default function CalorieTracker({ meals = [], onMealAdded, date, caloriesGoal }) {
  const { t } = useTranslation();
  const [uploading, setUploading] = useState(false);
  const [showMealType, setShowMealType] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.estimated_calories || 0), 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.estimated_protein || 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.estimated_carbs || 0), 0);
  const totalFats = meals.reduce((sum, meal) => sum + (meal.estimated_fats || 0), 0);

  const mealTypes = [
    { value: "breakfast", label: t("breakfast"), emoji: "🌅" },
    { value: "lunch", label: t("lunch"), emoji: "☀️" },
    { value: "dinner", label: t("dinner"), emoji: "🌙" },
    { value: "snack", label: t("snack"), emoji: "🍎" },
  ];

  const handlePhotoCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setSelectedPhoto(file);
    setShowMealType(true);
  };

  const handleMealTypeSelect = async (mealType) => {
    if (!selectedPhoto) return;
    
    setUploading(true);
    setShowMealType(false);

    try {
      // Upload photo
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedPhoto });

      // Analyze with AI
      const analysis = await base44.integrations.Core.InvokeLLM({
        prompt: `Analyze this food photo and estimate total calories, protein (g), carbohydrates (g), and fats (g). Be accurate but realistic.`,
        file_urls: [file_url],
        response_json_schema: {
          type: "object",
          properties: {
            calories: { type: "number" },
            protein: { type: "number" },
            carbs: { type: "number" },
            fats: { type: "number" },
            description: { type: "string" }
          }
        }
      });

      // Create meal log
      const now = new Date();
      const meal = await base44.entities.MealLog.create({
        date,
        meal_time: `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`,
        meal_type: mealType,
        photo_url: file_url,
        estimated_calories: analysis.calories || 0,
        estimated_protein: analysis.protein || 0,
        estimated_carbs: analysis.carbs || 0,
        estimated_fats: analysis.fats || 0,
        notes: analysis.description || ""
      });

      onMealAdded?.(meal);
      toast.success(`${analysis.calories || 0} ${t("kcal_added")}`);
    } catch (error) {
      toast.error(t("error_processing_photo"));
      console.error(error);
    } finally {
      setUploading(false);
      setSelectedPhoto(null);
    }
  };

  const deleteMeal = async (mealId) => {
    try {
      await base44.entities.MealLog.delete(mealId);
      onMealAdded?.();
      toast.success(t("meal_deleted"));
    } catch (error) {
      toast.error(t("error_deleting_meal"));
    }
  };

  return (
    <div className="relative overflow-hidden rounded-3xl p-5 bg-white/10 backdrop-blur-xl border border-white/20 shadow-xl">
      <div className="absolute -top-10 -left-10 w-32 h-32 bg-gradient-to-br from-orange-400/30 to-red-400/30 rounded-full blur-2xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center shadow-lg">
              <Flame size={22} className="text-white" />
            </div>
            <div>
              <h4 className="font-bold text-white text-lg">{t("calories_today")}</h4>
              <p className="text-xs text-orange-200">
                {meals.length} {t("meals_logged")}
              </p>
            </div>
          </div>
          <motion.div
            className="text-4xl font-black bg-gradient-to-r from-white to-orange-100 bg-clip-text text-transparent"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            key={totalCalories}
          >
            {totalCalories}
          </motion.div>
        </div>

        {/* Calorie Goal Progress */}
        {caloriesGoal && (
          <div className="mb-4">
            <CalorieGoalCard totalCalories={totalCalories} caloriesGoal={caloriesGoal} />
          </div>
        )}

        {/* Macros Summary */}
        {meals.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <p className="text-xs text-white/60">{t("protein")}</p>
              <p className="text-sm font-bold text-emerald-300">{Math.round(totalProtein)}g</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <p className="text-xs text-white/60">{t("carbs")}</p>
              <p className="text-sm font-bold text-amber-300">{Math.round(totalCarbs)}g</p>
            </div>
            <div className="bg-white/5 rounded-xl p-2 text-center">
              <p className="text-xs text-white/60">{t("fats")}</p>
              <p className="text-sm font-bold text-blue-300">{Math.round(totalFats)}g</p>
            </div>
          </div>
        )}

        {/* Meals List */}
        <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
          <AnimatePresence>
            {meals.map((meal) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10"
              >
                <img
                  src={meal.photo_url}
                  alt="meal"
                  className="w-12 h-12 rounded-xl object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm text-white font-medium">
                    {mealTypes.find(t => t.value === meal.meal_type)?.emoji} {meal.meal_time}
                  </p>
                  <p className="text-xs text-orange-200">
                    {meal.estimated_calories} kcal
                  </p>
                </div>
                <button
                  onClick={() => deleteMeal(meal.id)}
                  className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center transition-colors"
                >
                  <X size={14} className="text-red-300" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Add Meal Button */}
        <label className={`flex items-center justify-center gap-2 py-3 rounded-2xl border-2 border-dashed border-white/30 hover:border-white/50 hover:bg-white/5 transition-all cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handlePhotoCapture}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <Loader2 size={20} className="text-white animate-spin" />
          ) : (
            <Camera size={20} className="text-white" />
          )}
          <span className="text-white font-medium text-sm">
            {uploading ? t("analyzing") : t("add_meal")}
          </span>
        </label>

        {/* Meal Type Selection Modal */}
        <AnimatePresence>
          {showMealType && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-end justify-center p-4"
              onClick={() => {
                setShowMealType(false);
                setSelectedPhoto(null);
              }}
            >
              <motion.div
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg bg-slate-900 rounded-3xl p-6"
              >
                <h3 className="text-white font-bold text-lg mb-4">{t("what_meal")}</h3>
                <div className="grid grid-cols-2 gap-3">
                  {mealTypes.map((type) => (
                    <button
                      key={type.value}
                      onClick={() => handleMealTypeSelect(type.value)}
                      className="p-4 rounded-2xl bg-white/10 hover:bg-white/20 border border-white/20 transition-all"
                    >
                      <div className="text-3xl mb-2">{type.emoji}</div>
                      <p className="text-white font-medium">{type.label}</p>
                    </button>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}