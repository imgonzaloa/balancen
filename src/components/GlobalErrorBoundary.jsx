import React from 'react';
import { AlertCircle, RotateCcw, Trash2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { logger } from '@/components/logger';

class GlobalErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorCount: parseInt(localStorage.getItem('ERROR_COUNT') || '0')
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

    // Track error count for Safe Mode
    const count = parseInt(localStorage.getItem('ERROR_COUNT') || '0') + 1;
    localStorage.setItem('ERROR_COUNT', count.toString());
    
    // Reset error count after 10 seconds (not truly repeated)
    setTimeout(() => {
      if (parseInt(localStorage.getItem('ERROR_COUNT') || '0') === count) {
        localStorage.setItem('ERROR_COUNT', '0');
      }
    }, 10000);

    this.setState({ errorCount: count });
  }

  handleReload = () => {
    localStorage.setItem('ERROR_COUNT', '0');
    // CRITICAL: Manual reload only - never auto
    window.location.reload();
  };

  handleHardRefresh = () => {
    localStorage.setItem('ERROR_COUNT', '0');
    // Clear service worker cache
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => caches.delete(name));
      });
    }
    // Clear local storage app data (but keep critical)
    const critical = ['language', 'onboarding_completed', 'app_language'];
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (!critical.includes(key)) {
        localStorage.removeItem(key);
      }
    });
    window.location.href = '/';
  };

  componentDidUpdate(prevProps, prevState) {
    // CRITICAL: prevent auto-reload loops
    if (this.state.hasError && !prevState.hasError) {
      logger.log('ERROR_BOUNDARY_CAUGHT_PREVENTING_LOOP');
    }
  }

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
              {this.state.errorCount >= 2 && (
                <p className="text-amber-300 text-xs bg-amber-500/10 rounded-lg p-3 border border-amber-500/20">
                  ⚠️ Safe Mode active: simplified interface
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
                Clear cache & reload
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