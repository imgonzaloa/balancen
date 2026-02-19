import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useTranslation } from '@/components/TranslationProvider';

export default function LanguageSelector() {
  const navigate = useNavigate();
  const { changeLanguage } = useTranslation();
  const [loading, setLoading] = useState(false);

  const handleSelectLanguage = async (lang) => {
    setLoading(true);
    // Persist all language keys immediately
    localStorage.setItem('i18nextLng', lang);
    localStorage.setItem('balancen_lang', lang);
    localStorage.setItem('balancen.lang', lang);
    localStorage.setItem('app_language', lang);
    await changeLanguage(lang);
    navigate(createPageUrl('Onboarding'), { replace: true });
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-6"
      style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}
    >
      <div className="max-w-md w-full">
        <div className="text-center mb-12">
          <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center mx-auto mb-6 border-2 border-white shadow-2xl">
            <span className="text-5xl font-black text-white">B</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Balancen</h1>
          <p className="text-white/60 text-sm">Choose your language / Elegí tu idioma</p>
        </div>

        <div className="space-y-4">
          {[
            { code: 'en', flag: '🇬🇧', name: 'English' },
            { code: 'es', flag: '🇪🇸', name: 'Español' },
          ].map((lang) => (
            <button
              key={lang.code}
              onClick={() => handleSelectLanguage(lang.code)}
              disabled={loading}
              className="w-full p-6 rounded-2xl border-2 border-white/20 bg-white/5 hover:border-teal-400 hover:bg-teal-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-4xl mb-2">{lang.flag}</div>
              <div className="text-white font-bold text-xl">{lang.flag} {lang.name}</div>
            </button>
          ))}
        </div>

        <p className="text-center text-white/40 text-xs mt-8">
          You can change this anytime in settings<br />
          Puedes cambiar esto en configuración
        </p>
      </div>
    </div>
  );
}