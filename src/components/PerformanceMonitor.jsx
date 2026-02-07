import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Minimal performance monitoring (DEV only)
 * Tracks navigation timing for debugging
 */
export default function PerformanceMonitor() {
  const location = useLocation();
  
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    
    const startTime = performance.now();
    const pageName = location.pathname.replace('/', '') || 'Home';
    
    // Log navigation start
    console.log(`[PERF:${pageName}] Navigation started`);
    
    // Track time to first render
    requestAnimationFrame(() => {
      const renderTime = performance.now() - startTime;
      console.log(`[PERF:${pageName}] Shell render: ${renderTime.toFixed(0)}ms`);
    });
    
    // Track time to interactive (data loaded)
    const timeout = setTimeout(() => {
      const totalTime = performance.now() - startTime;
      console.log(`[PERF:${pageName}] Total load: ${totalTime.toFixed(0)}ms`);
    }, 100);
    
    return () => clearTimeout(timeout);
  }, [location.pathname]);
  
  return null;
}