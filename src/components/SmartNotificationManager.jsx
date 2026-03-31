import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAppState } from '@/components/AppStateContext';
import { getSmartNotification, showSmartNotification } from '@/components/utils/SmartNotificationService';
import { base44 } from '@/api/base44Client';
import NotificationPermissionModal from '@/components/NotificationPermissionModal';

const NOTIF_PREFS_KEY = 'balancen_notif_prefs';
const FRIEND_NOTIF_KEY = 'balancen_friend_notif_shown'; // { [friendEmail]: "2024-01-01" }

function getNotifPrefs() {
  try { return JSON.parse(localStorage.getItem(NOTIF_PREFS_KEY) || '{}'); } catch { return {}; }
}
function setNotifPrefs(prefs) {
  localStorage.setItem(NOTIF_PREFS_KEY, JSON.stringify(prefs));
}

function hasMealLoggedToday() {
  try {
    const today = new Date().toISOString().split('T')[0];
    const stored = localStorage.getItem('balancen.mealsByDate');
    if (!stored) return false;
    const meals = JSON.parse(stored);
    return !!(meals[today] && meals[today].length > 0);
  } catch { return false; }
}

function canShowPermissionPrompt() {
  const prefs = getNotifPrefs();
  if (prefs.permissionDenied) return false;
  if (prefs.askedAt) {
    const daysSince = (Date.now() - prefs.askedAt) / (1000 * 60 * 60 * 24);
    if (daysSince < 3) return false;
  }
  return true;
}

function sendNativeNotification(title, body, onClick) {
  if (Notification.permission !== 'granted') return;
  const n = new Notification(title, {
    body,
    icon: '/favicon.ico',
    badge: '/favicon.ico',
  });
  if (onClick) n.onclick = () => { onClick(); n.close(); };
}

export default function SmartNotificationManager() {
  const { user, profile, friends } = useAppState();
  const navigate = useNavigate();
  const [showPermissionModal, setShowPermissionModal] = useState(false);

  // --- Listen for "first meal saved" event to trigger permission prompt ---
  useEffect(() => {
    const handleFirstMeal = () => {
      if (Notification.permission !== 'default') return;
      if (!canShowPermissionPrompt()) return;
      setShowPermissionModal(true);
    };
    window.addEventListener('balancen:first-meal-saved', handleFirstMeal);
    return () => window.removeEventListener('balancen:first-meal-saved', handleFirstMeal);
  }, []);

  const handleAllowNotifications = useCallback(async () => {
    setShowPermissionModal(false);
    const result = await Notification.requestPermission();
    setNotifPrefs({ ...getNotifPrefs(), askedAt: Date.now(), permissionGranted: result === 'granted' });
  }, []);

  const handleLaterNotifications = useCallback(() => {
    setShowPermissionModal(false);
    setNotifPrefs({ ...getNotifPrefs(), askedAt: Date.now() });
  }, []);

  // --- Streak reminder at 8:00 PM ---
  useEffect(() => {
    if (!user?.email || !profile) return;

    const scheduleStreakReminder = () => {
      if (Notification.permission !== 'granted') return;
      if (hasMealLoggedToday()) return;

      const streak = profile.current_streak || 0;
      const title = streak > 0
        ? "🔥 Don't break your streak!"
        : "🍽️ Time to log your meal";
      const body = streak > 0
        ? `You're on a ${streak} day streak. Log a meal to keep it alive.`
        : "Track what you eat today and start building your streak.";

      sendNativeNotification(title, body, () => navigate(createPageUrl('Home')));
    };

    const now = new Date();
    const reminder = new Date();
    reminder.setHours(20, 0, 0, 0);
    if (reminder <= now) reminder.setDate(reminder.getDate() + 1);

    const msUntil = reminder.getTime() - now.getTime();
    const timeoutId = setTimeout(() => {
      scheduleStreakReminder();
      // Reschedule every 24h
      const intervalId = setInterval(scheduleStreakReminder, 24 * 60 * 60 * 1000);
      // Store intervalId to clear on unmount via a closure — not perfect but acceptable
      window.__balancen_streak_interval = intervalId;
    }, msUntil);

    return () => {
      clearTimeout(timeoutId);
      if (window.__balancen_streak_interval) {
        clearInterval(window.__balancen_streak_interval);
      }
    };
  }, [user?.email, profile?.current_streak]);

  // --- Friend activity on foreground ---
  useEffect(() => {
    if (!user?.email) return;

    const checkFriendActivity = async () => {
      if (Notification.permission !== 'granted') return;
      if (document.hidden) return;

      try {
        const today = new Date().toISOString().split('T')[0];
        let shown = {};
        try { shown = JSON.parse(localStorage.getItem(FRIEND_NOTIF_KEY) || '{}'); } catch { shown = {}; }

        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

        // Get recent meal logs from friends
        const friendEmails = (friends || []).map(f => f.friend_user_id).filter(Boolean);
        if (friendEmails.length === 0) return;

        // Check recent posts from friends
        const recentPosts = await base44.entities.Post.filter({ post_type: 'meal' }, '-created_date', 20);
        const friendPost = recentPosts.find(p =>
          friendEmails.includes(p.author_email) &&
          p.created_date > twoHoursAgo &&
          shown[p.author_email] !== today
        );

        if (friendPost) {
          shown[friendPost.author_email] = today;
          localStorage.setItem(FRIEND_NOTIF_KEY, JSON.stringify(shown));

          sendNativeNotification(
            `${friendPost.author_name} just shared a meal 👀`,
            "See what they're eating today",
            () => navigate(createPageUrl('Feed'))
          );
        }
      } catch (_) {}
    };

    const handleVisibility = () => {
      if (!document.hidden) checkFriendActivity();
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, [user?.email, friends, navigate]);

  // --- Existing deep-link listener ---
  useEffect(() => {
    const handleDeepLink = (event) => {
      const { screen } = event.detail;
      if (screen) navigate(createPageUrl(screen));
    };
    window.addEventListener('notification:deeplink', handleDeepLink);
    return () => window.removeEventListener('notification:deeplink', handleDeepLink);
  }, [navigate]);

  // --- Existing daily smart notification (unchanged) ---
  useEffect(() => {
    if (!user?.email || !profile?.daily_reminders_enabled) return;

    const scheduleNotification = async () => {
      try {
        const notification = await getSmartNotification(user.email, 'en');
        if (notification) showSmartNotification(notification.title, notification.deepLink);
      } catch (_) {}
    };

    const reminderTime = profile?.daily_reminders_time || '09:00';
    const [hours, minutes] = reminderTime.split(':').map(Number);
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);
    if (scheduledTime <= now) scheduledTime.setDate(scheduledTime.getDate() + 1);

    const msUntilReminder = scheduledTime.getTime() - now.getTime();
    const timeoutId = setTimeout(() => {
      scheduleNotification();
      setInterval(scheduleNotification, 24 * 60 * 60 * 1000);
    }, msUntilReminder);

    return () => clearTimeout(timeoutId);
  }, [user?.email, profile?.daily_reminders_enabled, profile?.daily_reminders_time]);

  return showPermissionModal ? (
    <NotificationPermissionModal
      onAllow={handleAllowNotifications}
      onLater={handleLaterNotifications}
    />
  ) : null;
}