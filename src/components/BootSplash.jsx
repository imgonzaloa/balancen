import React from 'react';
import { Loader2 } from 'lucide-react';

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
        {/* App Icon */}
        <div className="w-24 h-24 rounded-3xl bg-black flex items-center justify-center mx-auto border-2 border-white shadow-2xl">
          <span className="text-6xl font-black text-white">B</span>
        </div>
        
        {/* Loading Indicator */}
        <div className="space-y-3">
          <Loader2 className="w-8 h-8 text-white animate-spin mx-auto" />
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