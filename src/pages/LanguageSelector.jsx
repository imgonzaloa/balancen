import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/TranslationProvider';
import { logger } from '@/components/logger';

export default function LanguageSelector() {
  const navigate = useNavigate();
  const { changeLanguage } = useTranslation();
  const [selectedLang, setSelectedLang] = useState('en');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const init = async () => {
      const u = await base44.auth.me();
      if (!u) {
        window.location.href = '/';
        return;
      }
      setUser(u);
    };
    init();
  }, []);

  const handleSelectLanguage = async (lang) => {
    setLoading(true);
    try {
      setSelectedLang(lang);
      await changeLanguage(lang);
      
      // Create or update profile with language
      const profiles = await base44.entities.UserProfile.filter({ created_by: user?.email });
      
      if (profiles?.length > 0) {
        await base44.entities.UserProfile.update(profiles[0].id, {
          language: lang,
        });
      } else {
        await base44.entities.UserProfile.create({
          display_name: user?.full_name || 'User',
          language: lang,
          onboarding_completed: false,
        });
      }
      
      logger.log('LANGUAGE_SELECTED', { lang });
      
      // Go to onboarding
      navigate(createPageUrl('Onboarding'));
    } catch (error) {
      logger.error('LANGUAGE_SELECTION_ERROR', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-6" style={{ paddingTop: 'env(safe-area-inset-top, 0)' }}>
      <div className="max-w-md w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center mb-12"
        >
          <div className="w-20 h-20 rounded-2xl bg-black flex items-center justify-center mx-auto mb-6 border-2 border-white shadow-2xl">
            <span className="text-5xl font-black text-white">B</span>
          </div>
          <h1 className="text-3xl font-black text-white mb-2">Balancen</h1>
          <p className="text-white/60 text-sm">Select your language</p>
        </motion.div>

        <div className="space-y-4">
          {[
            { code: 'en', name: '🇬🇧 English', desc: 'English' },
            { code: 'es', name: '🇪🇸 Español', desc: 'Spanish' }
          ].map((lang, idx) => (
            <motion.button
              key={lang.code}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              onClick={() => handleSelectLanguage(lang.code)}
              disabled={loading}
              className={`w-full p-6 rounded-2xl border-2 transition-all ${
                selectedLang === lang.code && !loading
                  ? 'border-emerald-400 bg-emerald-500/20 scale-105'
                  : 'border-white/20 bg-white/5 hover:border-white/40'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <div className="text-4xl mb-2">{lang.name.split(' ')[0]}</div>
              <div className="text-white font-semibold">{lang.name}</div>
              <div className="text-white/50 text-sm">{lang.desc}</div>
            </motion.button>
          ))}
        </div>

        <p className="text-center text-white/40 text-xs mt-8">
          You can change language anytime in settings
        </p>
      </div>
    </div>
  );
}