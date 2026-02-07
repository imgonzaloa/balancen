/**
 * Language Selection - First Time Experience
 * Shows on first install before onboarding
 */

import React, { useState } from 'react';
    import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { useTranslation } from '@/components/TranslationProvider';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';

export default function LanguageSelector() {
  const [selectedLang, setSelectedLang] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const { changeLanguage } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    base44.auth.me().then(setUser);
  }, []);

  const handleLanguageSelect = async (lang) => {
    setIsLoading(true);
    try {
      // Change app language immediately
      await changeLanguage(lang);
      
      // Save language to localStorage for quick access
      localStorage.setItem('app_language', lang);

      // Navigate to onboarding (profile not created yet)
      navigate(createPageUrl('Onboarding'));
    } catch (error) {
      console.error('Error setting language:', error);
      toast.error('Failed to set language');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full text-center"
      >
        {/* Balancen Logo */}
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="w-16 h-16 rounded-lg bg-black flex items-center justify-center mx-auto mb-6 border-2 border-white"
        >
          <span className="text-4xl font-black text-white">B</span>
        </motion.div>

        {/* Title */}
        <h1 className="text-3xl font-black text-white mb-2">Balancen</h1>
        <p className="text-white/60 mb-8">Choose your language</p>

        {/* Language Options */}
        <div className="space-y-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLanguageSelect('en')}
            disabled={isLoading}
            className="w-full p-5 rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-xl hover:border-teal-400 hover:bg-teal-500/20 transition-all disabled:opacity-50"
          >
            <p className="text-white font-semibold mb-1">🇬🇧 English</p>
            <p className="text-white/60 text-sm">Standard experience</p>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleLanguageSelect('es')}
            disabled={isLoading}
            className="w-full p-5 rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-xl hover:border-emerald-400 hover:bg-emerald-500/20 transition-all disabled:opacity-50"
          >
            <p className="text-white font-semibold mb-1">🇪🇸 Español</p>
            <p className="text-white/60 text-sm">Experiencia en español</p>
          </motion.button>
        </div>

        {/* Loading */}
        {isLoading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-teal-300 text-sm mt-6"
          >
            Loading...
          </motion.p>
        )}
      </motion.div>
    </div>
  );
}