import React from 'react';
import { useAppState } from '@/components/AppStateContext';
import { useTranslation } from '@/components/TranslationProvider';
import { createPageUrl } from '@/utils';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Camera, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SafeModeHome() {
  const { profile } = useAppState();
  const { t, lang } = useTranslation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 pb-24">
      <div className="max-w-lg mx-auto px-5 pt-8 space-y-6">
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }} 
          className="text-center"
        >
          <h1 className="text-3xl font-black text-white mb-2">{t('home')}</h1>
          <p className="text-white/60 text-sm">{t('safe_mode_active') || 'Safe Mode: Offline'}</p>
        </motion.div>

        {profile && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 rounded-2xl p-6 border border-white/20"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                <Flame size={24} className="text-white" />
              </div>
              <div>
                <p className="text-white/60 text-sm">{t('total_fire')}</p>
                <p className="text-white text-2xl font-bold">{profile.fire_total || 0}</p>
              </div>
            </div>
            <div className="h-8 bg-white/10 rounded-full overflow-hidden border border-white/20">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500"
                style={{ width: `${Math.min((profile.current_streak / 30) * 100, 100)}%` }}
              />
            </div>
            <p className="text-white/60 text-xs mt-2 text-center">
              {t('current_streak')}: {profile.current_streak || 0} {t('days_in_a_row')}
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Button
            onClick={() => navigate(createPageUrl('CameraScreen'))}
            className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-semibold rounded-2xl flex items-center justify-center gap-2"
          >
            <Camera size={20} />
            {t('log_your_meal')}
          </Button>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          onClick={() => window.location.reload()}
          className="w-full h-12 bg-white/10 hover:bg-white/20 text-white rounded-xl transition-colors border border-white/20"
        >
          {lang === 'es' ? 'Reintentar' : 'Retry'}
        </motion.button>
      </div>
    </div>
  );
}