import React, { useState, useEffect, useRef } from 'react';
import { X, Copy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const STORAGE_KEY = 'balancen.debug_logs';
const MAX_LOGS = 200;

class DebugLogger {
  constructor() {
    this.logs = this.loadLogs();
    this.listeners = new Set();
  }

  loadLogs() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  saveLogs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.logs));
    } catch {}
  }

  log(type, message, data = {}) {
    const entry = {
      timestamp: Date.now(),
      time: new Date().toLocaleTimeString(),
      type,
      message,
      data
    };
    
    this.logs.push(entry);
    if (this.logs.length > MAX_LOGS) {
      this.logs.shift();
    }
    
    this.saveLogs();
    this.notify();
    
    // Dispatch event for PublicDebugPanel
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('debug-log', { detail: entry }));
    }
    
    // Also log to console if ?debug=1
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('debug') === '1') {
      console.log(`[${type}] ${message}`, data);
    }
  }

  clear() {
    this.logs = [];
    this.saveLogs();
    this.notify();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  notify() {
    this.listeners.forEach(cb => cb(this.logs));
  }
}

export const debugLogger = new DebugLogger();

// Capture global errors
if (typeof window !== 'undefined') {
  window.addEventListener('error', (e) => {
    debugLogger.log('ERROR', e.message, { 
      file: e.filename, 
      line: e.lineno, 
      col: e.colno 
    });
  });

  window.addEventListener('unhandledrejection', (e) => {
    debugLogger.log('UNHANDLED_REJECTION', e.reason?.message || String(e.reason));
  });

  // Wrap console.error
  const originalError = console.error;
  console.error = (...args) => {
    debugLogger.log('CONSOLE_ERROR', args.map(a => String(a)).join(' '));
    originalError.apply(console, args);
  };
}

export default function DebugOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  const [logs, setLogs] = useState(debugLogger.logs);
  const [state, setState] = useState({
    route: window.location.pathname,
    isLoggedIn: false,
    userId: null,
    language: localStorage.getItem('balancen.lang') || 'en',
    buildMode: window.location.hostname === 'localhost' ? 'preview' : 'production'
  });

  useEffect(() => {
    const unsubscribe = debugLogger.subscribe(setLogs);
    return unsubscribe;
  }, []);

  useEffect(() => {
    // Track route changes
    const handleRouteChange = () => {
      const newRoute = window.location.pathname;
      setState(s => ({ ...s, route: newRoute }));
      debugLogger.log('ROUTE_CHANGE', newRoute);
    };

    window.addEventListener('popstate', handleRouteChange);
    return () => window.removeEventListener('popstate', handleRouteChange);
  }, []);

  const copyLogs = () => {
    const text = logs.slice(-50).map(l => 
      `[${l.time}] ${l.type}: ${l.message} ${JSON.stringify(l.data)}`
    ).join('\n');
    
    navigator.clipboard.writeText(text).then(() => {
      alert('Logs copied to clipboard');
    });
  };

  const clearLogs = () => {
    debugLogger.clear();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 flex items-end justify-center z-[99999]"
      style={{ pointerEvents: 'auto' }}
      onClick={() => setIsOpen(false)}
    >
      <div 
        className="bg-slate-900 w-full max-w-2xl h-[80vh] rounded-t-3xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-slate-800 px-4 py-3 flex items-center justify-between border-b border-white/10">
          <div>
            <h2 className="text-white font-bold text-sm">Debug Console</h2>
            <p className="text-white/50 text-xs">{logs.length} logs</p>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={copyLogs}
              className="text-white/70 hover:text-white"
            >
              <Copy size={14} />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={clearLogs}
              className="text-white/70 hover:text-white"
            >
              <Trash2 size={14} />
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* State */}
        <div className="bg-slate-800/50 px-4 py-2 border-b border-white/10">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="text-white/70">Route: <span className="text-teal-400">{state.route}</span></div>
            <div className="text-white/70">Lang: <span className="text-teal-400">{state.language}</span></div>
            <div className="text-white/70">User: <span className="text-teal-400">{state.userId || 'none'}</span></div>
            <div className="text-white/70">Mode: <span className="text-teal-400">{state.buildMode}</span></div>
          </div>
        </div>

        {/* Logs */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {logs.slice(-50).reverse().map((log, idx) => (
            <div 
              key={idx}
              className={`text-xs p-2 rounded border ${
                log.type.includes('ERROR') || log.type.includes('FAIL') 
                  ? 'bg-red-500/10 border-red-500/30 text-red-300'
                  : log.type.includes('SUCCESS')
                  ? 'bg-green-500/10 border-green-500/30 text-green-300'
                  : 'bg-white/5 border-white/10 text-white/70'
              }`}
            >
              <div className="flex items-start gap-2">
                <span className="text-white/40">{log.time}</span>
                <span className="font-bold">{log.type}</span>
              </div>
              <div className="mt-1">{log.message}</div>
              {Object.keys(log.data).length > 0 && (
                <div className="mt-1 text-white/40 font-mono">
                  {JSON.stringify(log.data, null, 2)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Hook to open debug overlay
export function useDebugOverlay() {
  const [isOpen, setIsOpen] = useState(false);
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ctrl+Shift+D to open
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        setIsOpen(true);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return { isOpen, setIsOpen };
}