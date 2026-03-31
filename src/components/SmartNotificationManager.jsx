import { useEffect } from "react";
import { useAppState } from "@/components/AppStateContext";

export default function SmartNotificationManager() {
  const { profile } = useAppState();

  useEffect(() => {
    if (!('Notification' in window)) return;
    const interval = setInterval(() => {
      try {
        const hour = new Date().getHours();
        if (hour !== 20) return;
        if (Notification.permission !== 'granted') return;
        const today = new Date().toISOString().split('T')[0];
        const raw = localStorage.getItem('balancen.mealsByDate');
        const meals = JSON.parse(raw || '{}');
        const todayMeals = meals[today] || [];
        if (todayMeals.length === 0 && (profile?.current_streak || 0) > 0) {
          new Notification('🔥 Don\'t break your streak!', {
            body: `You're on a ${profile.current_streak} day streak. Log a meal!`,
          });
        }
      } catch (_) {}
    }, 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [profile?.current_streak]);

  return null;
}