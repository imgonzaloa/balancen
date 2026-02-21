import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X, Copy, RefreshCw, Trash2 } from 'lucide-react';

// ─── BUILD ID ─────────────────────────────────────────────────────────────────
const BUILD_ID = "2026-02-21_1805";

// ─── Log collector ────────────────────────────────────────────────────────────
const _logs = [];
const MAX_LOGS = 30;

function addLog(level, msg) {
  _logs.push({ level, msg: String(msg).slice(0, 200), t: new Date().toISOString().slice(11, 19) });
  if (_logs.length > MAX_LOGS) _logs.shift();
}

// Capture global errors once
if (!window.__buildBadgeInstalled) {
  window.__buildBadgeInstalled = true;
  const origError = console.error.bind(console);
  console.error = (...args) => { addLog('error', args.join(' ')); origError(...args); };
  const origWarn = console.warn.bind(console);
  console.warn = (...args) => { addLog('warn', args.join(' ')); origWarn(...args); };
  const origLog = console.log.bind(console);
  console.log = (...args) => { addLog('log', args.join(' ')); origLog(...args); };
  window.addEventListener('error', (e) => addLog('error', `UNCAUGHT: ${e.message} @ ${e.filename}:${e.lineno}`));
  window.addEventListener('unhandledrejection', (e) => addLog('error', `UNHANDLED_REJECTION: ${e.reason}`));
}

export default function BuildBadge({ currentPageName }) {
  const [open, setOpen] = useState(false);
  const [logs, setLogs] = useState([]);
  const [route, setRoute] = useState(window.location.pathname);

  // Refresh logs when panel opens
  useEffect(() => {
    if (open) setLogs([..._logs]);
  }, [open]);

  useEffect(() => {
    const onPop = () => setRoute(window.location.pathname);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const copyLogs = useCallback(() => {
    const text = logs.map(l => `[${l.t}][${l.level}] ${l.msg}`).join('\n');
    navigator.clipboard.writeText(`BUILD: ${BUILD_ID}\nROUTE: ${route}\nPAGE: ${currentPageName}\n\n${text}`)
      .then(() => alert('Logs copied!'));
  }, [logs, route, currentPageName]);

  const resetCache = useCallback(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.reload();
  }, []);

  const reloadApp = useCallback(() => window.location.reload(), []);

  // Badge is hidden in production — pointer-events:none so taps always go through
  const badge = (
    <div
      style={{
        position: 'fixed',
        top: 6,
        left: 6,
        zIndex: 1,
        pointerEvents: 'none',
        opacity: 0,
      }}
    />
  );

  const panel = open && (
    <>
      <div
        onClick={() => setOpen(false)}
        style={{ position: 'fixed', inset: 0, zIndex: 29999, background: 'rgba(0,0,0,0.6)', pointerEvents: 'auto' }}
      />
      <div style={{
        position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
        zIndex: 30001, width: 'min(95vw, 420px)', maxHeight: '80vh',
        background: '#0f172a', border: '1px solid rgba(255,255,255,0.15)',
        borderRadius: 16, overflow: 'hidden', display: 'flex', flexDirection: 'column',
        pointerEvents: 'auto',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <span style={{ color: '#6ee7b7', fontFamily: 'monospace', fontWeight: 700, fontSize: 13 }}>
            DEBUG PANEL — BUILD {BUILD_ID}
          </span>
          <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.6)', cursor: 'pointer', padding: 4 }}>
            <X size={16} />
          </button>
        </div>

        {/* Info */}
        <div style={{ padding: '10px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)', fontSize: 11, fontFamily: 'monospace' }}>
          <div style={{ color: '#94a3b8' }}>Route: <span style={{ color: '#f1f5f9' }}>{route}</span></div>
          <div style={{ color: '#94a3b8' }}>Page: <span style={{ color: '#f1f5f9' }}>{currentPageName}</span></div>
          <div style={{ color: '#94a3b8' }}>Camera: <span style={{ color: '#f1f5f9' }}>pages/CameraScreen</span></div>
          <div style={{ color: '#94a3b8' }}>Profile photo picker: <span style={{ color: '#f1f5f9' }}>components/profile/PhotoPickerModal</span></div>
        </div>

        {/* Logs */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '8px 16px' }}>
          {logs.length === 0 && <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: 11, fontFamily: 'monospace' }}>No logs yet.</div>}
          {logs.map((l, i) => (
            <div key={i} style={{
              fontSize: 10, fontFamily: 'monospace', lineHeight: 1.5,
              color: l.level === 'error' ? '#f87171' : l.level === 'warn' ? '#fbbf24' : '#94a3b8',
              borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: 2, marginBottom: 2
            }}>
              <span style={{ color: 'rgba(255,255,255,0.3)' }}>[{l.t}]</span> {l.msg}
            </div>
          ))}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          <button onClick={copyLogs} style={btnStyle('#1e40af', '#3b82f6')}>
            <Copy size={12} /> Copy logs
          </button>
          <button onClick={resetCache} style={btnStyle('#7f1d1d', '#ef4444')}>
            <Trash2 size={12} /> Reset cache
          </button>
          <button onClick={reloadApp} style={btnStyle('#14532d', '#22c55e')}>
            <RefreshCw size={12} /> Reload
          </button>
        </div>
      </div>
    </>
  );

  return createPortal(
    <>
      {badge}
      {panel}
    </>,
    document.body
  );
}

function btnStyle(bg, border) {
  return {
    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4,
    padding: '8px 4px', borderRadius: 8, fontSize: 11, fontWeight: 600, fontFamily: 'monospace',
    background: bg, border: `1px solid ${border}`, color: '#fff',
    cursor: 'pointer', pointerEvents: 'auto', touchAction: 'manipulation',
  };
}