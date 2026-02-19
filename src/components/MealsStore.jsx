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

  // Hydrate from localStorage synchronously on mount - prevents flicker
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Only keep last 7 days to prevent stale data bloat
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - 7);
        const cutoffKey = formatLocalDateKey(cutoff);
        const pruned = Object.fromEntries(
          Object.entries(parsed).filter(([k]) => k >= cutoffKey)
        );
        setMealsByDate(pruned);
      }
    } catch (_) {
      // Silent fail
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // Persist to localStorage whenever mealsByDate changes - DEBOUNCED
  useEffect(() => {
    if (!isHydrated) return;
    
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(mealsByDate));
      } catch (err) {
        // Silent fail in production
      }
    }, 100);
    
    return () => clearTimeout(timer);
  }, [mealsByDate, isHydrated]);

  const addMeal = useCallback((meal) => {
    const dateKey = meal.dateKey || formatLocalDateKey(new Date());

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