import { useCallback, useEffect, useState } from 'react';
import { requestNotificationPermission, scheduleDailyReminder } from '@/components/utils/NotificationService';

const PERMISSION_REQUESTED_KEY = 'balancen_notification_permission_requested';

/**
 * Hook to handle notification permission flow
 * Triggers once after first useful action (e.g., saving first meal)
 */
export function useNotificationPermission(language = 'en', reminderTime = '09:00') {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [hasRequestedPermission, setHasRequestedPermission] = useState(
    localStorage.getItem(PERMISSION_REQUESTED_KEY) === 'true'
  );

  // Check current permission status
  useEffect(() => {
    if ('Notification' in window) {
      setPermissionGranted(Notification.permission === 'granted');
    }
  }, []);

  // Auto-schedule reminders if permission is granted
  useEffect(() => {
    if (permissionGranted && !hasRequestedPermission) {
      scheduleDailyReminder(language, reminderTime);
    }
  }, [permissionGranted, hasRequestedPermission, language, reminderTime]);

  const requestPermissionAndSchedule = useCallback(async () => {
    localStorage.setItem(PERMISSION_REQUESTED_KEY, 'true');
    setHasRequestedPermission(true);

    const granted = await requestNotificationPermission();
    if (granted) {
      setPermissionGranted(true);
      scheduleDailyReminder(language, reminderTime);
    }
  }, [language, reminderTime]);

  return {
    permissionGranted,
    hasRequestedPermission,
    requestPermissionAndSchedule
  };
}

export default useNotificationPermission;