import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

// Global unhandled rejection handler for iPad stability
window.addEventListener('unhandledrejection', (event) => {
  console.error('[Main] Unhandled promise rejection:', event.reason);
  // Prevent app from crashing on unhandled rejections
  event.preventDefault();
});

// Safe render with error fallback
const root = document.getElementById('root');
if (!root) {
  document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #065f46 100%);font-family:system-ui,-apple-system,sans-serif"><div style="text-align:center;color:white"><div style="font-size:80px;font-weight:900;color:#1D9E75;margin-bottom:20px">B</div><p style="font-size:18px;margin:0">Initializing...</p></div></div>';
} else {
  try {
    ReactDOM.createRoot(root).render(
      <App />
    )
  } catch (err) {
    console.error('[Main] React render failed:', err);
    document.body.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100vh;background:linear-gradient(135deg, #0f172a 0%, #134e4a 50%, #065f46 100%);font-family:system-ui,-apple-system,sans-serif"><div style="text-align:center;color:white"><div style="font-size:80px;font-weight:900;color:#1D9E75;margin-bottom:20px">B</div><p style="font-size:18px;margin:0">Error Loading App</p><p style="font-size:14px;margin:10px 0 0 0;color:#888">Reloading...</p></div></div>';
    setTimeout(() => window.location.reload(), 2500);
  }
}