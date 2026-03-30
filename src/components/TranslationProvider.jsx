import React from "react";
import { useTranslation as useI18nTranslation } from "react-i18next";
import "./i18n";
import { setLocalLanguage } from "@/lib/language";
import { base44 } from "@/api/base44Client";

export function TranslationProvider({ children }) {
  return <>{children}</>;
}

export function useTranslation() {
  const { t, i18n } = useI18nTranslation();

  /**
   * changeLanguage — updates i18n, localStorage (single key), and DB simultaneously.
   * Components must always call this instead of writing to localStorage directly.
   */
  const changeLanguage = async (newLang) => {
    if (!["en", "es", "pt"].includes(newLang)) return;
    // 1. Apply to i18n runtime
    await i18n.changeLanguage(newLang);
    // 2. Persist to single local key (clears legacy keys)
    setLocalLanguage(newLang);
    // 3. Persist to DB (best-effort — don't block or throw)
    try {
      const user = await base44.auth.me();
      if (user?.email) {
        const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
        if (profiles?.[0]?.id) {
          // Only save valid DB enum values (en, es) — pt maps to pt but DB accepts it via schema
          await base44.entities.UserProfile.update(profiles[0].id, { language: newLang });
        }
      }
    } catch (_) {}
  };
  
  // CRITICAL: Production-ready translation with STRICT fallback - NEVER show "Missing"
  const safeT = (key, options) => {
    if (!key) return '';
    
    const result = t(key, options);
    
    // If translation is missing (returns the key itself)
    if (result === key || !result) {
      // Try English fallback
      const englishResult = i18n.t(key, { ...options, lng: 'en' });
      if (englishResult && englishResult !== key) {
        return englishResult;
      }
      // Last resort: return empty string instead of "Missing" or key
      console.warn(`Missing translation: ${key}`);
      return '';
    }
    return result;
  };
  
  return {
    t: safeT,
    lang: i18n.language || 'en',
    changeLanguage,
    setLang: changeLanguage
  };
}