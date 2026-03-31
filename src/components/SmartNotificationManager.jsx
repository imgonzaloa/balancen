import React, { useState, useEffect, useCallback } from "react";
import { useAppState } from "@/components/AppStateContext";
import { useTranslation } from "@/components/TranslationProvider";

/**
 * SmartNotificationManager — Background service for streak reminders
 * Schedules daily notifications at 8 PM to remind users to log meals
 * Manages Notification API permissions and scheduling
 */
export default function SmartNotificationManager() {
  // ─────────────────────────────────────────────────────────────────
  // ALL HOOKS DECLARED AT TOP — BEFORE ANY CONDITIONAL RETURNS
  // ─────────────────────────────────────────────────────────────────
  const { user, profile } = useAppState();
  const { t } = useTranslation();
  const [notifPermission, setNotifPermission] = useState(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      return "unsupported";
    }
    return Notification?.permission || "default";
  });

  // ─────────────────────────────────────────────────────────────────
  // REQUEST NOTIFICATION PERMISSION
  // ─────────────────────────────────────────────────────────────────
  const requestPermission = useCallback(async () => {
    try {
      if (typeof window === "undefined" || !("Notification" in window)) {
        setNotifPermission("unsupported");
        return;
      }

      const current = Notification?.permission;
      if (current !== "default") {
        setNotifPermission(current);
        return;
      }

      const permission = await Notification.requestPermission();
      setNotifPermission(permission);
      
      if (permission === "granted") {
        localStorage.setItem("balancen_notif_asked", "true");
      }
    } catch (err) {
      console.error("[SmartNotificationManager] Permission request failed:", err);
      setNotifPermission("denied");
    }
  }, []);

  // ─────────────────────────────────────────────────────────────────
  // STREAK REMINDER NOTIFICATION SCHEDULING
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Check if Notification API is supported
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    if (!user?.email || !profile?.id) {
      return;
    }

    // Track if we already showed notification today
    const todayKey = new Date().toISOString().split("T")[0];
    const shownTodayKey = `balancen_streak_notif_shown_${todayKey}`;

    // Set up interval to check every 60 minutes
    const checkInterval = setInterval(() => {
      try {
        const now = new Date();
        const currentHour = now.getHours();

        // Only check at 8 PM (hour 20)
        if (currentHour !== 20) {
          return;
        }

        // Don't show twice per day
        if (localStorage.getItem(shownTodayKey) === "true") {
          return;
        }

        // Check if meals logged today
        const mealStorageKey = "balancen.mealsByDate";
        const todayMealKey = new Date().toISOString().split("T")[0];

        let mealsLoggedToday = false;
        try {
          const stored = localStorage.getItem(mealStorageKey);
          if (stored) {
            const parsed = JSON.parse(stored);
            mealsLoggedToday = Array.isArray(parsed[todayMealKey]) && parsed[todayMealKey].length > 0;
          }
        } catch (_) {
          // Silent fail on parse error
        }

        // Only show if: user has streak + no meals logged today + permission granted
        const hasStreak = profile?.current_streak && profile.current_streak > 0;
        if (!mealsLoggedToday && hasStreak && notifPermission === "granted") {
          try {
            new Notification(t("streak_reminder_title") || "🔥 Don't break your streak!", {
              body: t("streak_reminder_body", {
                days: profile.current_streak,
              }) || `You're on a ${profile.current_streak} day streak. Log a meal to keep it alive.`,
              icon: "/balancen-icon.png",
              badge: "/balancen-icon.png",
              tag: "streak-reminder",
              requireInteraction: false,
            });

            // Mark as shown today
            localStorage.setItem(shownTodayKey, "true");
          } catch (err) {
            console.error("[SmartNotificationManager] Notification failed:", err);
          }
        }
      } catch (err) {
        console.error("[SmartNotificationManager] Check interval error:", err);
      }
    }, 60 * 60 * 1000); // Check every 60 minutes

    return () => clearInterval(checkInterval);
  }, [user?.email, profile?.id, profile?.current_streak, notifPermission, t]);

  // ─────────────────────────────────────────────────────────────────
  // AUTO-REQUEST PERMISSION ON FIRST MEAL LOG
  // (called from elsewhere when user logs first meal)
  // ─────────────────────────────────────────────────────────────────
  useEffect(() => {
    // Check if we should prompt for permission
    if (typeof window === "undefined" || !("Notification" in window)) {
      return;
    }

    const alreadyAsked = localStorage.getItem("balancen_notif_asked") === "true";
    if (alreadyAsked) {
      return;
    }

    const current = Notification?.permission;
    if (current === "default") {
      // Auto-request after short delay to avoid disrupting UX
      const timer = setTimeout(() => {
        requestPermission();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [requestPermission]);

  // ─────────────────────────────────────────────────────────────────
  // BACKGROUND MANAGER — RENDERS NOTHING
  // ─────────────────────────────────────────────────────────────────
  return null;
}