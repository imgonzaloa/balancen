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
  
  return {
    t,
    lang: i18n.language,
    changeLanguage
  };
}