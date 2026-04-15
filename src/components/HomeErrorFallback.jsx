import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Home as HomeIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/components/TranslationProvider';

/**
 * Fallback UI for Home page crashes
 * Shows after 5 seconds of loading, or on error
 */
export default function HomeErrorFallback({ onRetry, error }) {
  const { t, lang } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-sm"
      >
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center mx-auto mb-6">
          <HomeIcon size={32} className="text-teal-300" />
        </div>

        {/* Message */}
        <h2 className="text-white text-2xl font-bold mb-2">
          {lang === 'es' ? 'Algo salió mal' : 'Something went wrong'}
        </h2>
        <p className="text-white/60 text-sm mb-8">
          {lang === 'es' 
            ? 'No pudimos cargar tu inicio. Intentá de nuevo.' 
            : 'We couldn\'t load your home. Try again.'}
        </p>

        {/* Retry Button */}
        <Button
          onClick={onRetry}
          className="w-full h-12 bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2"
        >
          <RefreshCw size={18} />
          {lang === 'es' ? 'Reintentar' : 'Retry'}
        </Button>

        {/* Debug Info (dev only) */}
        {import.meta.env.DEV && error && (
          <pre className="mt-6 p-4 bg-white/5 rounded-lg text-left text-xs text-red-300 overflow-auto max-h-40">
            {error.message || 'Unknown error'}
          </pre>
        )}
      </motion.div>
    </div>
  );
}