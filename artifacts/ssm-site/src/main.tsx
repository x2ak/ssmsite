import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';

// ── Global user-error capture ─────────────────────────────────────────────────
// Sends unhandled JS errors / promise rejections to the error log.
// Filters out Vite internals and browser extension noise.

function shouldIgnore(msg: string): boolean {
  const m = msg.toLowerCase();
  return (
    m.includes('[vite]') ||
    m.includes('hmr') ||
    m.includes('chrome-extension') ||
    m.includes('moz-extension') ||
    m.includes('resizeobserver loop') ||
    m.includes('script error') // cross-origin noise
  );
}

function shipUserError(message: string, detail?: string) {
  if (shouldIgnore(message)) return;
  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'user',
      message: message.slice(0, 500),
      detail: detail?.slice(0, 2000),
      path: window.location.pathname,
      userAgent: navigator.userAgent.slice(0, 300),
    }),
  }).catch(() => { /* never throw from error reporter */ });
}

window.onerror = (_msg, _src, _line, _col, err) => {
  const message = err?.message || String(_msg);
  const detail  = err?.stack;
  shipUserError(message, detail);
  return false; // don't suppress the browser's default handling
};

window.addEventListener('unhandledrejection', (event) => {
  const reason = event.reason;
  const message = reason?.message || String(reason);
  const detail  = reason?.stack;
  shipUserError(message, detail);
});
// ─────────────────────────────────────────────────────────────────────────────

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found — check your index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>
);
