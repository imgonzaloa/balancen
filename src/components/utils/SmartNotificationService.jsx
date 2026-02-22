import { base44 } from '@/api/base44Client';
import { getLanguage } from '@/components/i18n';

// Behavioral message library - segment: [messages with intents]
const SMART_MESSAGES = {
  en: {
    NO_ACTION_TODAY: [
      { text: 'Ready to log your first meal?', intent: 'logging', screen: 'CameraScreen' },
      { text: 'Your fire is waiting—start logging now', intent: 'logging', screen: 'CameraScreen' },
      { text: 'Build momentum—log a meal today', intent: 'logging', screen: 'CameraScreen' },
    ],
    ACTIVE_USER: [
      { text: 'You're off to a great start! Keep it up', intent: 'streak', screen: 'Home' },
      { text: 'Nice work logging—share your progress?', intent: 'social', screen: 'Social' },
      { text: 'Check your momentum score', intent: 'progress', screen: 'Progress' },
    ],
    MISSED_YESTERDAY: [
      { text: 'Back on track—log a meal today', intent: 'logging', screen: 'CameraScreen' },
      { text: 'Your streak resets tomorrow—log now', intent: 'logging', screen: 'CameraScreen' },
      { text: 'Get AI coaching to stay consistent', intent: 'ai', screen: 'GoalsAssistant' },
    ],
    STREAK_AT_RISK: [
      { text: 'One meal away from keeping your streak!', intent: 'logging', screen: 'CameraScreen' },
      { text: 'Your fire is almost gone—save it', intent: 'logging', screen: 'CameraScreen' },
      { text: 'Don't break the chain—log now', intent: 'logging', screen: 'CameraScreen' },
    ],
    INACTIVE_3_DAYS: [
      { text: 'We miss you—ready to restart?', intent: 'logging', screen: 'CameraScreen' },
      { text: 'Fresh start—log your first meal back', intent: 'logging', screen: 'CameraScreen' },
      { text: 'Get a personalized plan to restart', intent: 'ai', screen: 'GoalsAssistant' },
    ],
  },
  es: {
    NO_ACTION_TODAY: [
      { text: '¿Listo para registrar tu primera comida?', intent: 'logging', screen: 'CameraScreen' },
      { text: 'Tu fuego te espera—registra ahora', intent: 'logging', screen: 'CameraScreen' },
      { text: 'Crea impulso—registra una comida hoy', intent: 'logging', screen: 'CameraScreen' },
    ],
    ACTIVE_USER: [
      { text: '¡Excelente comienzo! Mantén el ritmo', intent: 'streak', screen: 'Home' },
      { text: 'Bien registrado—¿compartís tu progreso?', intent: 'social', screen: 'Social' },
      { text: 'Mira tu puntaje de momentum', intent: 'progress', screen: 'Progress' },
    ],
    MISSED_YESTERDAY: [
      { text: 'Volvé al plan—registra hoy', intent: 'logging', screen: 'CameraScreen' },
      { text: 'Tu racha se reinicia mañana—registra ahora', intent: 'logging', screen: 'CameraScreen' },
      { text: 'Obtén coaching IA para ser consistente', intent: 'ai', screen: 'GoalsAssistant' },
    ],
    STREAK_AT_RISK: [
      { text: '¡Una comida para mantener tu racha!', intent: 'logging', screen: 'CameraScreen' },
      { text: 'Tu fuego casi se apaga—consérvalo', intent: 'logging', screen: 'CameraScreen' },
      { text: 'No rompas la cadena—registra ahora', intent: 'logging', screen: 'CameraScreen' },
    ],
    INACTIVE_3_DAYS: [
      { text: 'Te echamos de menos—¿listo para volver?', intent: 'logging', screen: 'CameraScreen' },
      { text: 'Nuevo comienzo—registra tu primer comida', intent: 'logging', screen: 'CameraScreen' },
      { text: 'Obtén un plan personalizado para reiniciar', intent: 'ai', screen: 'GoalsAssistant' },
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
 * Get next message in rotation for a segment (never repeat until all shown)
 */
function getNextSegmentMessage(segment, language = 'en') {
  const lang = (language === 'es') ? 'es' : 'en';
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
  const message = getNextSegmentMessage(segment, userLanguage);

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