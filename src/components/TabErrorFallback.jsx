import React from 'react';
import { motion } from 'framer-motion';
import { AlertTriangle, RefreshCw, Shield, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSafeMode } from '@/components/SafeModeProvider';
import { logger } from '@/components/logger';
import { useTranslation } from '@/components/TranslationProvider';

/**
 * Per-tab error fallback (not full screen)
 * Shows in place of the tab that failed
 */
export default function TabErrorFallback({ tabName, error, onRetry }) {
  const { enableSafeMode } = useSafeMode();
  const { t, lang } = useTranslation();
  
  const handleCopyDiagnostics = () => {
    logger.copyCrashReport();
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-emerald-900 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border border-white/20 space-y-6"
      >
        {/* Icon */}
        <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <AlertTriangle className="text-red-400" size={32} />
        </div>
        
        {/* Message */}
        <div className="text-center space-y-2">
          <h2 className="text-xl font-bold text-white">
            {lang === 'es' ? `${tabName} no cargó` : `${tabName} failed to load`}
          </h2>
          <p className="text-white/70 text-sm">
            {lang === 'es' 
              ? 'Estamos investigando. Intentá recargar.'
              : 'We\'re investigating. Try reloading.'}
          </p>
        </div>
        
        {/* Error details (dev only) */}
        {import.meta.env.DEV && error && (
          <div className="bg-red-900/20 p-4 rounded-xl border border-red-500/30">
            <p className="text-xs text-red-300 font-mono break-words">
              {error.message || error.toString()}
            </p>
          </div>
        )}
        
        {/* Buttons */}
        <div className="space-y-3">
          <Button
            onClick={onRetry}
            className="w-full bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600"
          >
            <RefreshCw size={18} className="mr-2" />
            {lang === 'es' ? 'Reintentar' : 'Retry'}
          </Button>
          
          <Button
            onClick={enableSafeMode}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            <Shield size={18} className="mr-2" />
            {lang === 'es' ? 'Modo Seguro' : 'Safe Mode'}
          </Button>
          
          <Button
            onClick={handleCopyDiagnostics}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
          >
            <Copy size={18} className="mr-2" />
            {lang === 'es' ? 'Copiar Diagnóstico' : 'Copy Diagnostics'}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}