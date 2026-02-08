import React from 'react';
import { AlertCircle, RotateCcw, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { logger } from '@/components/logger';
import { SafeBootManager } from './SafeBootManager';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    logger.error('GLOBAL_ERROR_BOUNDARY', {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    });

    // Record crash and activate safe mode if threshold reached
    const crashCount = SafeBootManager.recordCrash();
    this.setState({ errorCount: crashCount });
  }

  handleReload = () => {
    // CRITICAL: Manual reload only - never auto
    SafeBootManager.clearCrashLog();
    window.location.reload();
  };

  handleHardRefresh = () => {
    // Exit safe mode and clear everything
    SafeBootManager.exitSafeMode();
    SafeBootManager.clearCrashLog();
    
    // Clear service worker cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    
    // Clear local storage app data (but keep critical)
    const critical = ['onboarding_completed', 'app_language'];
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (!critical.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    
    window.location.href = '/';
  };

  handleTryAgain = () => {
    // Reset error state without full reload
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/20 to-emerald-900 flex items-center justify-center p-6">
          <div className="max-w-md w-full text-center">
            <div className="mb-8">
              <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500 flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={32} className="text-red-400" />
              </div>
              <h1 className="text-3xl font-black text-white mb-2">
                Something went wrong
              </h1>
              <p className="text-white/60 text-sm mb-4">
                We've logged this error to help fix it.
              </p>
              {SafeBootManager.isInSafeMode() && (
                <p className="text-amber-300 text-xs bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                  ⚠️ Safe Mode active: {this.state.errorCount} crashes detected
                </p>
              )}
            </div>

            {this.state.error && (
              <details className="mb-6 text-left">
                <summary className="cursor-pointer text-white/50 text-xs hover:text-white/80 mb-2">
                  Technical details
                </summary>
                <pre className="bg-black/50 rounded p-3 text-red-300 text-[10px] overflow-auto max-h-32 font-mono">
                  {this.state.error.message}
                </pre>
              </details>
            )}

            <div className="space-y-3">
              {!SafeBootManager.isInSafeMode() && (
                <Button
                  onClick={this.handleTryAgain}
                  className="w-full h-12 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl"
                >
                  Try Again (No Reload)
                </Button>
              )}
              
              <Button
                onClick={this.handleReload}
                className="w-full h-12 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl flex items-center justify-center gap-2"
              >
                <RotateCcw size={18} />
                Reload
              </Button>

              <Button
                onClick={this.handleHardRefresh}
                variant="outline"
                className="w-full h-12 border-white/20 text-white hover:bg-white/10 rounded-xl flex items-center justify-center gap-2"
              >
                <Trash2 size={18} />
                Clear All Data & Reload
              </Button>
            </div>

            <p className="text-white/40 text-xs mt-6">
              If this persists, contact support.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default GlobalErrorBoundary;