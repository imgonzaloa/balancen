import React from 'react';
import BrandMark from '@/components/BrandMark';

/**
 * BootSplash: Stable loading screen during boot
 * CRITICAL: Must render without errors, no async calls
 */
export default function BootSplash({ stage = 'LOADING', safeMode = false }) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{
        background: 'linear-gradient(135deg, rgb(15 23 42) 0%, rgb(20 83 83) 50%, rgb(16 118 96) 100%)',
        paddingTop: 'env(safe-area-inset-top, 0)',
        paddingBottom: 'env(safe-area-inset-bottom, 0)',
      }}
    >
      <div className="text-center space-y-6 px-6">
        {/* Brand Mark */}
        <div className="flex justify-center mb-4">
          <BrandMark size={32} />
        </div>
        
        {/* Loading Indicator */}
        <div className="space-y-3">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
          <p className="text-white/80 text-sm">
            {stage === 'INIT' && 'Iniciando...'}
            {stage === 'LOADING' && 'Cargando...'}
            {stage === 'ERROR' && 'Error de inicio'}
          </p>
        </div>
        
        {/* Safe Mode Indicator */}
        {safeMode && (
          <div className="mt-8 px-4 py-2 bg-amber-500/20 border border-amber-500/30 rounded-lg">
            <p className="text-amber-200 text-xs">Modo seguro activo</p>
          </div>
        )}
      </div>
    </div>
  );
}