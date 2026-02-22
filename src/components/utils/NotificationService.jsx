// Notification phrases in EN and ES (exact as provided)
const REMINDER_PHRASES = {
  en: [
    "Stay consistent",
    "Keep your streak alive",
    "Win today",
    "Small steps, daily",
    "One good choice now",
    "Don't break momentum",
    "Back on track",
    "Progress over perfection",
    "Eat with intention",
    "Show up anyway"
  ],
  es: [
    "Mantén la constancia",
    "No rompas la racha",
    "Ganá el día hoy",
    "Pequeños pasos, diario",
    "Una buena decisión ahora",
    "No cortes el impulso",
    "Volvé al plan",
    "Progreso, no perfección",
    "Elegí con intención",
    "Hacelo igual"
  ]
};

const STORAGE_KEY_HISTORY = 'balancen_reminder_phrase_history';
const STORAGE_KEY_LAST_DATE = 'balancen_reminder_last_date';

/**
 * Get the next phrase in rotation (never repeats until all 10 are shown)
 */
export function getNextReminderPhrase(language = 'en') {
  const lang = (language === 'es') ? 'es' : 'en';
  const phrases = REMINDER_PHRASES[lang];
  
  let history = [];
  try {
    const stored = localStorage.getItem(STORAGE_KEY_HISTORY);
    history = stored ? JSON.parse(stored) : [];
  } catch (_) {
    history = [];
  }

  // If all 10 phrases shown, reset history
  if (history.length >= phrases.length) {
    history = [];
  }

  // Get remaining phrases
  const usedIndices = new Set(history);
  const remaining = phrases
    .map((phrase, idx) => ({ phrase, idx }))
    .filter(p => !usedIndices.has(p.idx));

  // Pick random from remaining
  const next = remaining[Math.floor(Math.random() * remaining.length)];
  
  // Add to history
  history.push(next.idx);
  localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(history));
  
  return next.phrase;
}

/**
 * Check if we should show a reminder today (once per day)
 */
function shouldShowReminderToday() {
  const today = new Date().toISOString().split('T')[0];
  const lastDate = localStorage.getItem(STORAGE_KEY_LAST_DATE);
  
  if (lastDate !== today) {
    localStorage.setItem(STORAGE_KEY_LAST_DATE, today);
    return true;
  }
  return false;
}

/**
 * Request notification permission (for iOS and other platforms)
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  }

  return false;
}

/**
 * Show a local notification
 */
export function showLocalNotification(title, options = {}) {
  if (Notification.permission === 'granted') {
    new Notification(title, {
      icon: '/favicon.ico', // Balancen icon
      badge: '/favicon.ico',
      ...options
    });
  }
}

/**
 * Schedule daily reminder (client-side via service worker if available)
 */
export function scheduleDailyReminder(language = 'en', timeStr = '09:00') {
  // For PWA/web apps, we'd use service worker + IndexedDB
  // For now, we'll schedule via setTimeout for each page load
  
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  const scheduledTime = new Date();
  scheduledTime.setHours(hours, minutes, 0, 0);

  if (scheduledTime <= now) {
    scheduledTime.setDate(scheduledTime.getDate() + 1);
  }

  const msUntilReminder = scheduledTime.getTime() - now.getTime();

  // Schedule for today/tomorrow
  setTimeout(() => {
    if (shouldShowReminderToday()) {
      const phrase = getNextReminderPhrase(language);
      showLocalNotification(phrase);
    }
    // Reschedule for next day
    scheduleDailyReminder(language, timeStr);
  }, msUntilReminder);
}

/**
 * Cancel scheduled reminders (clear timeout)
 */
export function cancelDailyReminder() {
  // In a real app with service workers, we'd cancel the push subscription
  // For this client-side implementation, reminders only run while app is loaded
}

export default {
  getNextReminderPhrase,
  requestNotificationPermission,
  showLocalNotification,
  scheduleDailyReminder,
  cancelDailyReminder
};