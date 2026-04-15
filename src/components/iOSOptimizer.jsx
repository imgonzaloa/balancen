import { useEffect } from 'react';

/**
 * iOS Standalone mode optimizer
 * Disables heavy effects on iOS PWA for performance
 */
export default function IOSOptimizer() {
  useEffect(() => {
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    
    if (isIOS && isStandalone) {
      console.log('[iOS_OPTIMIZER] Running in iOS standalone mode - applying optimizations');
      
      // Add class to body to disable heavy effects
      document.body.classList.add('ios-standalone');
      
      // Inject CSS to disable expensive effects
      const style = document.createElement('style');
      style.innerHTML = `
        .ios-standalone .backdrop-blur-xl,
        .ios-standalone .backdrop-blur-sm,
        .ios-standalone .backdrop-blur {
          backdrop-filter: none !important;
          -webkit-backdrop-filter: none !important;
        }
        
        .ios-standalone .blur-3xl,
        .ios-standalone .blur-2xl {
          filter: none !important;
        }
        
        .ios-standalone .animate-pulse {
          animation: none !important;
        }
      `;
      document.head.appendChild(style);
      
      return () => {
        document.body.classList.remove('ios-standalone');
        document.head.removeChild(style);
      };
    }
  }, []);
  
  return null;
}