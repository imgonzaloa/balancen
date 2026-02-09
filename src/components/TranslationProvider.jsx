import React from "react";
import { useTranslation as useI18nTranslation } from "react-i18next";
import "./i18n";

export function TranslationProvider({ children }) {
  return <>{children}</>;
}

export function useTranslation() {
  const { t, i18n } = useI18nTranslation();
  
  const changeLanguage = async (newLang) => {
    if (newLang !== "en" && newLang !== "es") {
      console.error("❌ Invalid language:", newLang);
      return;
    }
    
    await i18n.changeLanguage(newLang);
  };
  
  // Production-ready translation with silent fallback
  const safeT = (key, options) => {
    const result = t(key, options);
    // If translation is missing, return English fallback silently
    if (result === key) {
      // Try English fallback
      const englishResult = i18n.t(key, { ...options, lng: 'en' });
      return englishResult !== key ? englishResult : key;
    }
    return result;
  };
  
  return {
    t: safeT,
    lang: i18n.language,
    changeLanguage,
    setLang: changeLanguage
  };
}