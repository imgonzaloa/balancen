import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { ArrowLeft, Search, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslation } from "@/components/TranslationProvider";
import { useAppState } from "@/components/AppStateContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createPageUrl } from "@/utils";

// Common food database (simplified)
const FOOD_DATABASE = [
  { name: "Chicken Breast", calories: 165, protein: 31, carbs: 0, fats: 3.6, portion: "100g" },
  { name: "Rice (cooked)", calories: 206, protein: 4.3, carbs: 45, fats: 0.3, portion: "150g" },
  { name: "Broccoli", calories: 34, protein: 2.8, carbs: 7, fats: 0.4, portion: "100g" },
  { name: "Salmon", calories: 208, protein: 22, carbs: 0, fats: 13, portion: "100g" },
  { name: "Eggs", calories: 155, protein: 13, carbs: 1.1, fats: 11, portion: "100g" },
  { name: "Oats", calories: 389, protein: 17, carbs: 66, fats: 6.9, portion: "100g" },
  { name: "Banana", calories: 89, protein: 1.1, carbs: 23, fats: 0.3, portion: "100g" },
  { name: "Bread", calories: 265, protein: 9, carbs: 49, fats: 3.3, portion: "100g" },
  { name: "Peanut Butter", calories: 588, protein: 25, carbs: 20, fats: 50, portion: "32g" },
  { name: "Pasta", calories: 131, protein: 5, carbs: 25, fats: 1.1, portion: "100g" },
  { name: "Milk", calories: 61, protein: 3.2, carbs: 4.8, fats: 3.3, portion: "100ml" },
  { name: "Yogurt", calories: 59, protein: 10, carbs: 3.3, fats: 0.4, portion: "100g" },
  { name: "Apple", calories: 52, protein: 0.3, carbs: 14, fats: 0.2, portion: "100g" },
  { name: "Almonds", calories: 579, protein: 21, carbs: 22, fats: 50, portion: "100g" },
  { name: "Beef", calories: 250, protein: 26, carbs: 0, fats: 17, portion: "100g" },
];

export default function AddMeal() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user } = useAppState();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFoods, setSelectedFoods] = useState([]);
  const [saving, setSaving] = useState(false);

  const filteredFoods = FOOD_DATABASE.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const addFood = (food) => {
    setSelectedFoods([...selectedFoods, { ...food, id: Date.now() }]);
    setSearchQuery("");
  };

  const removeFood = (id) => {
    setSelectedFoods(selectedFoods.filter(f => f.id !== id));
  };

  const updateQuantity = (id, portion) => {
    setSelectedFoods(selectedFoods.map(f =>
      f.id === id ? { ...f, quantity: portion } : f
    ));
  };

  const totalCalories = selectedFoods.reduce((sum, f) => sum + (f.calories || 0), 0);
  const totalProtein = selectedFoods.reduce((sum, f) => sum + (f.protein || 0), 0);
  const totalCarbs = selectedFoods.reduce((sum, f) => sum + (f.carbs || 0), 0);
  const totalFats = selectedFoods.reduce((sum, f) => sum + (f.fats || 0), 0);

  const handleSave = async () => {
    if (selectedFoods.length === 0) {
      toast.error(t('add_at_least_one_food') || "Add at least one food");
      return;
    }

    setSaving(true);
    try {
      const today = new Date().toISOString().split("T")[0];
      const meal_time = new Date().toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false
      });

      await base44.entities.MealLog.create({
        date: today,
        meal_time,
        photo_url: null,
        estimated_calories: Math.round(totalCalories),
        estimated_protein: Math.round(totalProtein),
        estimated_carbs: Math.round(totalCarbs),
        estimated_fats: Math.round(totalFats)
      });

      toast.success(t('meal_saved') || "Meal logged!");
      navigate(createPageUrl("Home"));
    } catch (err) {
      console.error("Error saving meal:", err);
      toast.error(t('save_failed') || "Error saving meal");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen pb-24" style={{ minHeight: '100dvh', overflowY: 'auto', WebkitOverflowScrolling: 'touch' }}>
      <div className="max-w-2xl mx-auto px-6 pt-2 pb-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors"
          >
            <ArrowLeft size={20} className="text-white" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-white">
              {t('log_meal_manually') || 'Log Meal'}
            </h1>
            <p className="text-white/60 text-sm">Search & add foods</p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <div className="relative">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <Input
              type="text"
              placeholder="Search foods..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-white/10 border-white/20 text-white placeholder-white/40"
            />
          </div>

          {/* Dropdown */}
          {searchQuery && filteredFoods.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800 border border-white/20 rounded-2xl overflow-hidden z-10 max-h-64 overflow-y-auto shadow-xl">
              {filteredFoods.length > 0 ? (
                filteredFoods.slice(0, 10).map((food) => (
                  <button
                    key={food.name}
                    onClick={() => addFood(food)}
                    className="w-full px-4 py-3 text-left hover:bg-white/10 border-b border-white/10 last:border-b-0 transition-colors flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-white font-semibold text-sm">{food.name}</p>
                      <p className="text-white/60 text-xs">{food.calories} cal • {food.portion}</p>
                    </div>
                    <Plus size={16} className="text-white/40 group-hover:text-teal-300 transition-colors" />
                  </button>
                ))
              ) : (
                <div className="px-4 py-3 text-center text-white/60 text-sm">
                  {t('no_results')} "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        {/* Selected Foods */}
        {selectedFoods.length > 0 && (
          <div className="space-y-3 mb-8">
            <h3 className="text-white font-bold text-sm uppercase tracking-wide">Selected Foods</h3>
            {selectedFoods.map((food) => (
              <div key={food.id} className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10 flex items-start justify-between">
                <div className="flex-1">
                  <p className="text-white font-semibold text-sm">{food.name}</p>
                  <p className="text-white/60 text-xs mt-1">{food.portion}</p>
                  <div className="flex gap-3 mt-2 text-xs text-white/50">
                    <span>{Math.round(food.calories)} cal</span>
                    <span>{Math.round(food.protein)}g protein</span>
                  </div>
                </div>
                <button
                  onClick={() => removeFood(food.id)}
                  className="p-2 rounded-lg hover:bg-white/10 transition-colors text-white/60 hover:text-red-400"
                >
                  <X size={18} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Totals */}
        {selectedFoods.length > 0 && (
          <div className="bg-gradient-to-br from-teal-500/20 to-emerald-500/20 backdrop-blur-xl rounded-3xl p-6 border border-teal-500/30 mb-6">
            <h3 className="text-white font-bold text-sm uppercase tracking-wide mb-4">Total Nutrition</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-white/60 text-xs mb-1">Calories</p>
                <p className="text-3xl font-black text-white">{Math.round(totalCalories)}</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-1">Protein</p>
                <p className="text-2xl font-black text-teal-300">{Math.round(totalProtein)}g</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-1">Carbs</p>
                <p className="text-2xl font-black text-amber-300">{Math.round(totalCarbs)}g</p>
              </div>
              <div>
                <p className="text-white/60 text-xs mb-1">Fats</p>
                <p className="text-2xl font-black text-pink-300">{Math.round(totalFats)}g</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {selectedFoods.length > 0 && (
          <div className="flex gap-3">
            <Button
              onClick={() => navigate(-1)}
              variant="outline"
              className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-2xl h-12"
            >
              {t('cancel')}
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-2xl h-12 font-bold"
            >
              {saving ? t('saving') : t('save_meal')}
            </Button>
          </div>
        )}

        {selectedFoods.length === 0 && (
          <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-8 text-center border border-white/10">
            <Search size={40} className="text-white/40 mx-auto mb-3" />
            <p className="text-white/70 font-semibold mb-1">{t('search_foods')}</p>
            <p className="text-white/50 text-sm">{t('type_food_name')}</p>
          </div>
        )}
      </div>
    </div>
  );
}