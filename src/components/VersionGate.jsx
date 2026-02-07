import { useEffect } from 'react';

/**
 * VERSION GATE: Prevents stale cache issues in PWA
 * Clears caches and reloads if build version changed
 */
const APP_BUILD_VERSION = '2026-02-07-001'; // Update on each deploy

export default function VersionGate({ children }) {
  useEffect(() => {
    const checkVersion = async () => {
      const storedVersion = localStorage.getItem('app_build_version');
      
      if (storedVersion !== APP_BUILD_VERSION) {
        console.log('[VERSION_GATE] Version mismatch', { 
          stored: storedVersion, 
          current: APP_BUILD_VERSION 
        });
        
        // Clear all caches
        if ('caches' in window) {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map(name => caches.delete(name)));
          console.log('[VERSION_GATE] Caches cleared');
        }
        
        // Unregister service worker
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          await Promise.all(registrations.map(reg => reg.unregister()));
          console.log('[VERSION_GATE] Service worker unregistered');
        }
        
        // Update version
        localStorage.setItem('app_build_version', APP_BUILD_VERSION);
        
        // Force reload to get fresh assets
        window.location.reload(true);
      }
    };
    
    checkVersion().catch(err => {
      console.error('[VERSION_GATE] Check failed', err);
    });
  }, []);
  
  return children;
}