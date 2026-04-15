/**
 * Ring buffer logger for diagnostics
 * Keeps last 200 events in memory + localStorage for bug reporting
 */

const MAX_LOGS = 200;
let logBuffer = [];

// Restore from localStorage on init
try {
  const stored = localStorage.getItem('app_logs');
  if (stored) {
    logBuffer = JSON.parse(stored).slice(-MAX_LOGS);
  }
} catch (e) {
  console.warn('Failed to restore logs');
}

export const logger = {
  log: (event, data = {}) => {
    const entry = {
      timestamp: new Date().toISOString(),
      event,
      data,
      url: typeof window !== 'undefined' ? window.location.pathname : null,
    };
    
    logBuffer.push(entry);
    if (logBuffer.length > MAX_LOGS) {
      logBuffer.shift();
    }
    
    // Persist every 10 logs
    if (logBuffer.length % 10 === 0) {
      try {
        localStorage.setItem('app_logs', JSON.stringify(logBuffer));
      } catch (e) {
        console.warn('Failed to save logs');
      }
    }
    
    // DEV: console in development
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.log(`[${event}]`, data);
    }
  },
  
  error: (event, error) => {
    logger.log(event, {
      message: error?.message,
      stack: error?.stack?.split('\n').slice(0, 3).join('\n'),
    });
  },
  
  getLogs: () => logBuffer,
  
  getDiagnostics: () => {
    const lastError = logBuffer
      .filter(l => l.event.includes('ERROR') || l.event.includes('error'))
      .slice(-1)[0];
    
    const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
    const isStandalone = typeof window !== 'undefined' && 
      window.matchMedia('(display-mode: standalone)').matches;
    const safeMode = typeof localStorage !== 'undefined' && 
      localStorage.getItem('SAFE_MODE') === '1';
    
    return {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      isIOS,
      isStandalone,
      safeMode,
      crashCount: localStorage.getItem('HOME_CRASH_COUNT') || '0',
      lastError: lastError ? {
        event: lastError.event,
        message: lastError.data?.message,
        stack: lastError.data?.stack,
        time: lastError.timestamp,
      } : null,
      recentLogs: logBuffer.slice(-20).map(l => ({
        time: l.timestamp.split('T')[1],
        event: l.event,
        data: l.data,
      })),
    };
  },
  
  copyCrashReport: () => {
    const diagnostics = logger.getDiagnostics();
    const report = `
=== CRASH REPORT ===
Time: ${diagnostics.timestamp}
User Agent: ${diagnostics.userAgent}
iOS: ${diagnostics.isIOS}
Standalone: ${diagnostics.isStandalone}
Safe Mode: ${diagnostics.safeMode}
Crashes: ${diagnostics.crashCount}

=== Last Error ===
${diagnostics.lastError ? `
Event: ${diagnostics.lastError.event}
Message: ${diagnostics.lastError.message}
Stack: ${diagnostics.lastError.stack}
Time: ${diagnostics.lastError.time}
` : 'None'}

=== Recent Logs (last 20) ===
${diagnostics.recentLogs.map(l => `${l.time} [${l.event}] ${JSON.stringify(l.data)}`).join('\n')}
`;
    
    navigator.clipboard.writeText(report).then(() => {
      alert('Diagnóstico copiado al clipboard');
    });
  },
};