/**
 * CausalFunnel Analytics Tracker v1.0
 * Drop this script into any webpage to start tracking.
 *
 * Usage:
 *   <script src="tracker.js" data-api="http://localhost:5000"></script>
 */
(function () {
  'use strict';

  // ── Config ───────────────────────────────────────────────
  const scriptTag = document.currentScript || {};
  const API_BASE = (scriptTag.getAttribute && scriptTag.getAttribute('data-api')) || 'http://localhost:5000';
  const BATCH_INTERVAL_MS = 2000;  // flush every 2 s
  const SESSION_KEY = 'cf_session_id';
  const SESSION_COOKIE = 'cf_sid';

  // ── Session ID ────────────────────────────────────────────
  function generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  function getSessionId() {
    // Try localStorage first, fall back to cookie
    try {
      let id = localStorage.getItem(SESSION_KEY);
      if (!id) {
        id = generateId();
        localStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch (_) {}

    // Cookie fallback
    const match = document.cookie.match(new RegExp('(?:^|; )' + SESSION_COOKIE + '=([^;]+)'));
    if (match) return match[1];
    const id = generateId();
    document.cookie = SESSION_COOKIE + '=' + id + '; path=/; max-age=86400';
    return id;
  }

  const SESSION_ID = getSessionId();

  // ── Event Queue & Flush ───────────────────────────────────
  const queue = [];

  function flush() {
    if (queue.length === 0) return;
    const batch = queue.splice(0, queue.length);
    const payload = JSON.stringify({ events: batch });

    // Use sendBeacon when unloading for reliability
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon(API_BASE + '/api/events/batch', blob);
    } else {
      fetch(API_BASE + '/api/events/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
      }).catch(() => {});
    }
  }

  setInterval(flush, BATCH_INTERVAL_MS);
  window.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flush();
  });
  window.addEventListener('beforeunload', flush);

  // ── Track Event ───────────────────────────────────────────
  function track(event_type, extra) {
    const event = Object.assign({
      session_id: SESSION_ID,
      event_type,
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      user_agent: navigator.userAgent,
      viewport_width: window.innerWidth,
      viewport_height: window.innerHeight,
    }, extra || {});
    queue.push(event);
  }

  // ── Page View ─────────────────────────────────────────────
  track('page_view');

  // Track SPA navigation (popstate / hashchange)
  window.addEventListener('popstate', () => track('page_view'));
  window.addEventListener('hashchange', () => track('page_view'));

  // ── Click Tracking ────────────────────────────────────────
  document.addEventListener('click', function (e) {
    track('click', {
      x: e.clientX,
      y: e.clientY,
      // Normalised coords (0–100) relative to viewport
      x_pct: parseFloat(((e.clientX / window.innerWidth) * 100).toFixed(2)),
      y_pct: parseFloat(((e.clientY / window.innerHeight) * 100).toFixed(2)),
    });
  });

  // ── Expose for manual tracking ────────────────────────────
  window.CausalFunnel = { track, getSessionId: () => SESSION_ID };

  console.log('[CausalFunnel] Tracker ready. Session:', SESSION_ID);
})();
