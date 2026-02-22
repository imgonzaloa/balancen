import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export default function PublicDebugPanel() {
  // Only mount in debug mode — never visible to normal users
  const isDebugMode = new URLSearchParams(window.location.search).get('debug') === '1' ||
    localStorage.getItem('DEBUG_OVERLAY') === '1';

  if (!isDebugMode) return null;

  const [isVisible, setIsVisible] = useState(true);
  const [route, setRoute] = useState(window.location.pathname);
  const [navAttempts, setNavAttempts] = useState([]);
  const [lastClick, setLastClick] = useState(null);
  const [authStatus, setAuthStatus] = useState({ loggedIn: false, hasToken: false });
  const [lastError, setLastError] = useState(null);

  useEffect(() => {

    // Track route changes
    const handleRouteChange = () => {
      setRoute(window.location.pathname);
    };

    // Track clicks/touches
    const handleClick = (e) => {
      setLastClick({
        tag: e.target.tagName,
        class: e.target.className,
        x: e.clientX,
        y: e.clientY,
        time: new Date().toLocaleTimeString()
      });
    };

    // Listen to custom events from debugLogger
    const handleDebugLog = (e) => {
      const { type, message, data } = e.detail;
      
      if (type === 'TAB_CLICK') {
        setNavAttempts(prev => [...prev.slice(-9), {
          tab: message,
          time: new Date().toLocaleTimeString()
        }]);
      }
      
      if (type.includes('ERROR') || type.includes('FAIL')) {
        setLastError({
          code: type,
          message: message,
          time: new Date().toLocaleTimeString()
        });
      }
      
      if (type === 'AUTH_STATE' || type === 'USER_LOADED') {
        setAuthStatus({
          loggedIn: !message.includes('anonymous') && !message.includes('Not authenticated'),
          hasToken: !!data?.userId || !!data?.email
        });
      }
    };

    window.addEventListener('popstate', handleRouteChange);
    window.addEventListener('click', handleClick);
    window.addEventListener('touchend', handleClick);
    window.addEventListener('debug-log', handleDebugLog);

    return () => {
      window.removeEventListener('popstate', handleRouteChange);
      window.removeEventListener('click', handleClick);
      window.removeEventListener('touchend', handleClick);
      window.removeEventListener('debug-log', handleDebugLog);
    };
  }, []);

  if (!isVisible) return null;

  return (
    <div className="fixed top-4 right-4 z-[99999] w-64 bg-black/90 backdrop-blur-xl border border-white/20 rounded-lg p-3 text-xs font-mono pointer-events-auto">
      <div className="flex items-center justify-between mb-2">
        <span className="text-green-400 font-bold">DEBUG</span>
        <button onClick={() => setIsVisible(false)} className="text-white/60 hover:text-white">
          <X size={14} />
        </button>
      </div>

      <div className="space-y-2 text-white/80">
        <div>
          <span className="text-white/50">Route:</span>{' '}
          <span className="text-yellow-400">{route}</span>
        </div>

        <div>
          <span className="text-white/50">Auth:</span>{' '}
          <span className={authStatus.loggedIn ? 'text-green-400' : 'text-red-400'}>
            {authStatus.loggedIn ? 'Logged In' : 'Anonymous'}
          </span>
          {authStatus.hasToken && <span className="text-green-400 ml-1">✓</span>}
        </div>

        {lastClick && (
          <div>
            <span className="text-white/50">Last Click:</span>{' '}
            <div className="text-[10px] text-white/60 mt-1">
              {lastClick.tag} at ({lastClick.x},{lastClick.y})
              <br />
              {lastClick.time}
            </div>
          </div>
        )}

        {lastError && (
          <div>
            <span className="text-red-400">Last Error:</span>{' '}
            <div className="text-[10px] text-red-300 mt-1">
              {lastError.code}
              <br />
              {lastError.message}
              <br />
              {lastError.time}
            </div>
          </div>
        )}

        {navAttempts.length > 0 && (
          <div>
            <span className="text-white/50">Nav History:</span>
            <div className="text-[10px] text-white/60 mt-1 space-y-0.5 max-h-32 overflow-y-auto">
              {navAttempts.map((nav, i) => (
                <div key={i}>
                  {nav.tab} - {nav.time}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}