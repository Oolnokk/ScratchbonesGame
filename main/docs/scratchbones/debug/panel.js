export function initDebugPanelInterceptor() {
  const _logs = [];
  const _orig = { debug: console.debug, log: console.log, warn: console.warn, error: console.error };
  ['debug', 'log', 'warn', 'error'].forEach((lvl) => {
    console[lvl] = function (...a) {
      _orig[lvl].apply(console, a);
      const line = a.map((x) => {
        try { return (typeof x === 'object') ? JSON.stringify(x, null, 1) : String(x); }
        catch (_) { return String(x); }
      }).join(' ');
      _logs.push({ lvl, line, t: Date.now() });
      const el = document.getElementById('_dbgBody');
      if (!el) return;
      const row = document.createElement('div');
      row.className = `_dl _dl-${lvl}`;
      row.textContent = line;
      el.appendChild(row);
      el.scrollTop = el.scrollHeight;
    };
  });
  window.addEventListener('error', (e) => console.error('UNCAUGHT', e.message, `${e.filename}:${e.lineno}`));
  window.addEventListener('unhandledrejection', (e) => console.error('UNHANDLED PROMISE', e.reason));
  window._debugLogs = _logs;
}
