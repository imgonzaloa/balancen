/**
 * Centralized locale utilities.
 * Use lang from useTranslation() as the first argument everywhere.
 */

const LOCALE_MAP = {
  en: "en-US",
  es: "es-ES",
  pt: "pt-BR",
};

export function getLocale(lang) {
  return LOCALE_MAP[lang] || "en-US";
}

/** Format a number as an integer with locale-aware grouping. */
export function formatNumber(lang, value) {
  return new Intl.NumberFormat(getLocale(lang)).format(Math.round(value));
}

/** Format a number with decimals and locale-aware decimal separator. */
export function formatDecimal(lang, value, fractionDigits = 1) {
  return new Intl.NumberFormat(getLocale(lang), {
    minimumFractionDigits: 0,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

/** Format a date to long local format: e.g. "Monday, 30 March" / "lunes, 30 de marzo". */
export function formatDateLong(lang, date = new Date()) {
  return new Intl.DateTimeFormat(getLocale(lang), {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(date);
}

/** Format a date to short local format: DD/MM/YYYY or MM/DD/YYYY. */
export function formatDateShort(lang, date) {
  return new Intl.DateTimeFormat(getLocale(lang), {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(typeof date === "string" ? new Date(date) : date);
}

/** Format a time (HH:MM) respecting locale. */
export function formatTime(lang, date) {
  return new Intl.DateTimeFormat(getLocale(lang), {
    hour: "2-digit",
    minute: "2-digit",
  }).format(typeof date === "string" ? new Date(date) : date);
}

/** Short weekday name for chart X-axis labels (Mon / lun / seg). */
export function formatWeekdayShort(lang, date) {
  return new Intl.DateTimeFormat(getLocale(lang), { weekday: "short" }).format(
    typeof date === "string" ? new Date(date) : date
  );
}

/** Relative time: "2 hours ago" / "hace 2 horas" / "há 2 horas". */
export function formatRelativeTime(lang, date) {
  const locale = getLocale(lang);
  const diffMs = Date.now() - new Date(date).getTime();
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-diffSec, "second");
  }
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-diffMin, "minute");
  }
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) {
    return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-diffHr, "hour");
  }
  const diffDay = Math.floor(diffHr / 24);
  return new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(-diffDay, "day");
}