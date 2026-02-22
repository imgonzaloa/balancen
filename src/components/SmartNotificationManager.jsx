import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAppState } from '@/components/AppStateContext';
import { useTranslation } from '@/components/TranslationProvider';
import { getSmartNotification, showSmartNotification } from '@/components/utils/SmartNotificationService';

/**
 * Smart Notification Manager Component
 * 
 * Handles:
 * - Daily smart notifications based on user behavior
 * - Deep linking from notifications to relevant screens
 * - Permission management
 * - Never shows white screen on app open from notification
 */
export default function SmartNotificationManager() {
  const { user, profile } = useAppState();
  const { lang } = useTranslation();
  const navigate = useNavigate();

  // Schedule daily notification
  useEffect(() => {
    if (!user?.email || !profile?.daily_reminders_enabled) return;

    const scheduleNotification = async () => {
      try {
        const notification = await getSmartNotification(user.email, lang);
        
        if (notification) {
          showSmartNotification(notification.title, notification.deepLink);
        }
      } catch (err) {
        console.error('Error scheduling smart notification:', err);
      }
    };

    // Calculate time until next reminder
    const reminderTime = profile?.daily_reminders_time || '09:00';
    const [hours, minutes] = reminderTime.split(':').map(Number);
    
    const now = new Date();
    const scheduledTime = new Date();
    scheduledTime.setHours(hours, minutes, 0, 0);

    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }

    const msUntilReminder = scheduledTime.getTime() - now.getTime();

    // Schedule for today/tomorrow
    const timeoutId = setTimeout(() => {
      scheduleNotification();
      // Reschedule for next day (24 hours)
      setInterval(scheduleNotification, 24 * 60 * 60 * 1000);
    }, msUntilReminder);

    return () => clearTimeout(timeoutId);
  }, [user?.email, profile?.daily_reminders_enabled, profile?.daily_reminders_time, lang]);

  // Listen for deep link from notification
  useEffect(() => {
    const handleDeepLink = (event) => {
      const { screen } = event.detail;
      if (screen) {
        navigate(createPageUrl(screen));
      }
    };

    window.addEventListener('notification:deeplink', handleDeepLink);
    return () => window.removeEventListener('notification:deeplink', handleDeepLink);
  }, [navigate]);

  // No UI - purely functional manager
  return null;
}