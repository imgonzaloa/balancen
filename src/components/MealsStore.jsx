import React, { createContext, useContext, useState, useEffect, useCallback } from "react";

const MealsStoreContext = createContext(null);

const STORAGE_KEY = "balancen.mealsByDate";

function formatLocalDateKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function MealsStoreProvider({ children }) {
  const [mealsByDate, setMealsByDate] = useState({});
  const [isHydrated, setIsHydrated] = useState(false);

  // Hydrate from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        console.log("🗄️ MEALS_HYDRATED", { dates: Object.keys(parsed).length });
        setMealsByDate(parsed);
      }
    } catch (err) {
      console.error("❌ HYDRATION_FAILED:", err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist to localStorage whenever mealsByDate changes
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(mealsByDate));
      console.log("💾 MEALS_PERSISTED", { dates: Object.keys(mealsByDate).length });
    } catch (err) {
      console.error("❌ PERSIST_FAILED:", err);
    }
  }, [mealsByDate, isHydrated]);

  const addMeal = useCallback((meal) => {
    const dateKey = meal.dateKey || formatLocalDateKey(new Date());
    
    console.log("➕ ADD_MEAL", {
      dateKey,
      id: meal.id,
      calories: meal.totals.calories
    });

    setMealsByDate(prev => {
      const updated = { ...prev };
      if (!updated[dateKey]) {
        updated[dateKey] = [];
      }
      updated[dateKey] = [...updated[dateKey], meal];
      return updated;
    });
  }, []);

  const removeMeal = useCallback((dateKey, mealId) => {
    console.log("➖ REMOVE_MEAL", { dateKey, mealId });
    setMealsByDate(prev => {
      const updated = { ...prev };
      if (updated[dateKey]) {
        updated[dateKey] = updated[dateKey].filter(m => m.id !== mealId);
      }
      return updated;
    });
  }, []);

  const getTodayMeals = useCallback(() => {
    const todayKey = formatLocalDateKey();
    return mealsByDate[todayKey] || [];
  }, [mealsByDate]);

  const getTodayTotals = useCallback(() => {
    const todayMeals = getTodayMeals();
    const totals = todayMeals.reduce((acc, meal) => ({
      calories: acc.calories + (meal.totals?.calories || 0),
      protein: acc.protein + (meal.totals?.protein || 0),
      carbs: acc.carbs + (meal.totals?.carbs || 0),
      fats: acc.fats + (meal.totals?.fats || 0),
    }), { calories: 0, protein: 0, carbs: 0, fats: 0 });
    
    return totals;
  }, [getTodayMeals]);

  const value = {
    mealsByDate,
    isHydrated,
    addMeal,
    removeMeal,
    getTodayMeals,
    getTodayTotals,
    formatLocalDateKey,
  };

  return (
    <MealsStoreContext.Provider value={value}>
      {children}
    </MealsStoreContext.Provider>
  );
}

export function useMealsStore() {
  const context = useContext(MealsStoreContext);
  if (!context) {
    throw new Error("useMealsStore must be used within MealsStoreProvider");
  }
  return context;
}