import { base44 } from '@/api/base44Client';
import { getLanguage } from '@/components/i18n';

// Behavioral message library - segment: [messages with intents]
const SMART_MESSAGES = {
  en: {
    NO_ACTION_TODAY: [
      { text: "Log your first action today", intent: "logging", screen: "CameraScreen" },
      { text: "Ask AI for today's meal plan", intent: "ai", screen: "GoalsAssistant" },
      { text: "Start with one entry", intent: "logging", screen: "CameraScreen" },
    ],
    ACTIVE_USER: [
      { text: "Keep building momentum", intent: "streak", screen: "Progress" },
      { text: "Stay consistent", intent: "streak", screen: "Progress" },
      { text: "Stack another win", intent: "logging", screen: "CameraScreen" },
    ],
    MISSED_YESTERDAY: [
      { text: "Back on track. Today counts", intent: "logging", screen: "CameraScreen" },
      { text: "Reset and log today", intent: "logging", screen: "CameraScreen" },
    ],
    STREAK_AT_RISK: [
      { text: "Don't break the streak", intent: "streak", screen: "Progress" },
      { text: "One log keeps it alive", intent: "logging", screen: "CameraScreen" },
    ],
    INACTIVE_3_DAYS: [
      { text: "Open Balancen. Start again", intent: "logging", screen: "CameraScreen" },
      { text: "Ask AI for today's plan", intent: "ai", screen: "GoalsAssistant" },
    ],
  },
  es: {
    NO_ACTION_TODAY: [
      { text: "Registrá tu primera acción hoy", intent: "logging", screen: "CameraScreen" },
      { text: "Pedile a la IA el plan de hoy", intent: "ai", screen: "GoalsAssistant" },
      { text: "Empezá con un registro", intent: "logging", screen: "CameraScreen" },
    ],
    ACTIVE_USER: [
      { text: "Seguí construyendo impulso", intent: "streak", screen: "Progress" },
      { text: "Mantén la constancia", intent: "streak", screen: "Progress" },
      { text: "Sumá otra victoria", intent: "logging", screen: "CameraScreen" },
    ],
    MISSED_YESTERDAY: [
      { text: "Volvé al plan. Hoy cuenta", intent: "logging", screen: "CameraScreen" },
      { text: "Reiniciá y registrá hoy", intent: "logging", screen: "CameraScreen" },
    ],
    STREAK_AT_RISK: [
      { text: "No rompas la racha", intent: "streak", screen: "Progress" },
      { text: "Un registro la mantiene viva", intent: "logging", screen: "CameraScreen" },
    ],
    INACTIVE_3_DAYS: [
      { text: "Abrí Balancen. Empezá de nuevo", intent: "logging", screen: "CameraScreen" },
      { text: "Pedile a la IA el plan de hoy", intent: "ai", screen: "GoalsAssistant" },
    ],
  },
};

const SEGMENT_HISTORY_KEY = 'balancen_notification_segment_history';

/**
 * Determine user segment based on activity history
 */
async function getUserSegment(userEmail) {
  try {
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    
    // Get all check-ins for this user
    const checkIns = await base44.entities.DailyCheckIn.filter(
      { created_by: userEmail },
      '-date',
      30 // Last 30 days
    );

    if (!checkIns || checkIns.length === 0) {
      return 'NO_ACTION_TODAY';
    }

    // Check if there's a check-in for today
    const todayCheckIn = checkIns.find(c => c.date === today);
    if (todayCheckIn && todayCheckIn.completed) {
      return 'ACTIVE_USER';
    }

    // Check yesterday
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];
    const yesterdayCheckIn = checkIns.find(c => c.date === yesterdayStr && c.completed);

    if (!yesterdayCheckIn) {
      // Check if user has been inactive for 3+ days
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
      
      const recentCheckIn = checkIns.find(c => c.date >= threeDaysAgoStr && c.completed);
      if (!recentCheckIn) {
        return 'INACTIVE_3_DAYS';
      }
      
      return 'MISSED_YESTERDAY';
    }

    // Yesterday exists - check if streak is at risk (1 day away from breaking)
    // This is typically a free plan limitation - streak caps at 3 days
    const currentStreak = checkIns[0]?.completed ? 1 : 0;
    if (currentStreak > 0 && currentStreak <= 2) {
      return 'STREAK_AT_RISK';
    }

    return 'MISSED_YESTERDAY';
  } catch (err) {
    console.error('Error determining user segment:', err);
    return 'NO_ACTION_TODAY';
  }
}

/**
 * Calculate days since last check-in
 */
function daysSinceLastCheckIn(checkIns) {
  if (!checkIns || checkIns.length === 0) return null;
  
  const lastDate = new Date(checkIns[0].date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  lastDate.setHours(0, 0, 0, 0);
  
  const daysDiff = Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
  return daysDiff > 0 ? daysDiff : null;
}

/**
 * Count meals logged this week
 */
function mealsLoggedThisWeek(checkIns) {
  if (!checkIns || checkIns.length === 0) return 0;
  
  const today = new Date();
  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);
  
  const weekStr = weekAgo.toISOString().split('T')[0];
  return checkIns.filter(c => c.date >= weekStr && c.completed).length;
}

/**
 * Get current streak days
 */
function getCurrentStreak(checkIns) {
  if (!checkIns || checkIns.length === 0) return 0;
  
  let streak = 0;
  const today = new Date();
  
  for (let i = 0; i < checkIns.length; i++) {
    const checkInDate = new Date(checkIns[i].date);
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    
    checkInDate.setHours(0, 0, 0, 0);
    expectedDate.setHours(0, 0, 0, 0);
    
    if (checkInDate.getTime() === expectedDate.getTime() && checkIns[i].completed) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}

/**
 * Generate dynamic message with user data
 */
function generateDynamicMessage(segment, language, userStreak, daysInactive, mealsThisWeek) {
  const lang = (language === 'es') ? 'es' : 'en';
  
  // Dynamic templates based on user data
  if (segment === 'STREAK_AT_RISK' && userStreak > 0) {
    const template = lang === 'es' 
      ? `Tu racha es de ${userStreak} días. No la rompas`
      : `Your streak is ${userStreak} days. Don't break it`;
    return {
      text: template,
      intent: "streak",
      screen: "Progress"
    };
  }
  
  if (segment === 'INACTIVE_3_DAYS' && daysInactive > 0) {
    const template = lang === 'es'
      ? `${daysInactive} días sin registrar. Volvé hoy`
      : `${daysInactive} days without logging. Come back today`;
    return {
      text: template,
      intent: "logging",
      screen: "CameraScreen"
    };
  }
  
  if (segment === 'ACTIVE_USER' && mealsThisWeek > 0) {
    const template = lang === 'es'
      ? `Registraste ${mealsThisWeek} comidas esta semana. Seguí así`
      : `You logged ${mealsThisWeek} meals this week. Keep going`;
    return {
      text: template,
      intent: "logging",
      screen: "CameraScreen"
    };
  }
  
  // Fallback to standard rotation
  return null;
}

/**
 * Get next message in rotation for a segment (never repeat until all shown)
 */
function getNextSegmentMessage(segment, language = 'en', userData = {}) {
  const lang = (language === 'es') ? 'es' : 'en';
  
  // Try dynamic message first if user data available
  const dynamicMsg = generateDynamicMessage(
    segment,
    lang,
    userData.currentStreak || 0,
    userData.daysInactive || 0,
    userData.mealsThisWeek || 0
  );
  
  if (dynamicMsg) {
    return dynamicMsg;
  }
  
  // Fallback to standard rotation
  const messages = SMART_MESSAGES[lang][segment] || [];

  if (messages.length === 0) return null;

  let history = {};
  try {
    const stored = localStorage.getItem(SEGMENT_HISTORY_KEY);
    history = stored ? JSON.parse(stored) : {};
  } catch (_) {
    history = {};
  }

  // Get history for this segment
  let segmentHistory = history[segment] || [];

  // If all messages shown, reset
  if (segmentHistory.length >= messages.length) {
    segmentHistory = [];
  }

  // Find unused messages
  const usedIndices = new Set(segmentHistory);
  const available = messages
    .map((msg, idx) => ({ ...msg, idx }))
    .filter(m => !usedIndices.has(m.idx));

  // Pick random from available
  const next = available[Math.floor(Math.random() * available.length)];

  // Update history
  segmentHistory.push(next.idx);
  history[segment] = segmentHistory;
  localStorage.setItem(SEGMENT_HISTORY_KEY, JSON.stringify(history));

  return next;
}

/**
 * Check if we should show notification today (once per day)
 */
function shouldShowNotificationToday() {
  const today = new Date().toISOString().split('T')[0];
  const lastShown = localStorage.getItem('balancen_notification_last_shown');

  if (lastShown !== today) {
    localStorage.setItem('balancen_notification_last_shown', today);
    return true;
  }
  return false;
}

/**
 * Main function: Get smart notification for user
 */
export async function getSmartNotification(userEmail, userLanguage = 'en') {
  if (!shouldShowNotificationToday()) {
    return null; // Already shown today
  }

  const segment = await getUserSegment(userEmail);
  
  // Fetch check-ins for dynamic data
  let userData = {};
  try {
    const checkIns = await base44.entities.DailyCheckIn.filter(
      { created_by: userEmail },
      '-date',
      30
    );
    
    if (checkIns && checkIns.length > 0) {
      userData = {
        currentStreak: getCurrentStreak(checkIns),
        daysInactive: daysSinceLastCheckIn(checkIns),
        mealsThisWeek: mealsLoggedThisWeek(checkIns),
      };
    }
  } catch (err) {
    console.error('Error fetching user data for notification:', err);
  }
  
  const message = getNextSegmentMessage(segment, userLanguage, userData);

  if (!message) {
    return null;
  }

  return {
    segment,
    title: message.text,
    intent: message.intent,
    deepLink: message.screen, // Route to open on notification tap
  };
}

/**
 * Show native notification with deep link
 */
export function showSmartNotification(title, deepLink = 'Home') {
  if (Notification.permission === 'granted') {
    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
    });

    notification.onclick = () => {
      // Deep link navigation is handled at app level
      window.dispatchEvent(new CustomEvent('notification:deeplink', {
        detail: { screen: deepLink }
      }));
      notification.close();
    };
  }
}

export default {
  getSmartNotification,
  showSmartNotification,
  getUserSegment,
};