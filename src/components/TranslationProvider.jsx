import React from "react";
import { useTranslation as useI18nTranslation } from "react-i18next";
import "./i18n";

export function TranslationProvider({ children }) {
  return <>{children}</>;
}

export function useTranslation() {
  const { t, i18n } = useI18nTranslation();
  
  const changeLanguage = async (newLang) => {
    if (newLang !== "en" && newLang !== "es") return;
    await i18n.changeLanguage(newLang);
    // Single source of truth – keep all legacy keys in sync
    localStorage.setItem('i18nextLng', newLang);
    localStorage.setItem('balancen_lang', newLang);
    localStorage.setItem('balancen.lang', newLang);
    localStorage.setItem('app_language', newLang);
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