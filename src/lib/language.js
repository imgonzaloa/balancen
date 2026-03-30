/**
 * Centralized language utility — single source of truth.
 *
 * - Authenticated users: UserProfile.language (DB) is authoritative.
 * - Local fallback:      ONE key "balancen_language" (read before auth resolves).
 * - All other legacy keys (i18nextLng, balancen_lang, balancen.lang, app_language)
 *   are intentionally NOT read or written here.
 */

const LS_KEY = "balancen_language";
const VALID = ["en", "es", "pt"];

/** Read the local fallback language (pre-auth). */
export function getLocalLanguage() {
  try {
    const v = localStorage.getItem(LS_KEY);
    if (VALID.includes(v)) return v;
  } catch (_) {}
  return null;
}

/** Persist language to the single local key. */
export function setLocalLanguage(lang) {
  if (!VALID.includes(lang)) return;
  try {
    localStorage.setItem(LS_KEY, lang);
    // Clean up legacy keys silently
    ["i18nextLng", "balancen_lang", "balancen.lang", "app_language"].forEach((k) => {
      try { localStorage.removeItem(k); } catch (_) {}
    });
  } catch (_) {}
}

/** Resolve language: prefer DB value, fall back to localStorage, then 'en'. */
export function resolveLanguage(dbLang) {
  if (VALID.includes(dbLang)) return dbLang;
  return getLocalLanguage() || "en";
}

export { VALID as VALID_LANGUAGES };