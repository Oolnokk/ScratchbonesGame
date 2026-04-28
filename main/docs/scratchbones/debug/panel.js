function copyDebugLogsToClipboard() {
  const text = (window._debugLogs || [])
    .map(e => `[${e.lvl.toUpperCase()}] ${e.line}`)
    .join('\n');
  navigator.clipboard?.writeText(text).catch(() => {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
  });
  const btn = document.getElementById('_dbgCopyBtn');
  if (!btn) return;
  btn.textContent = 'Copied!';
  setTimeout(() => { btn.textContent = 'Copy'; }, 1500);
}

function initDebugPanelUi() {
  const debugBtn = document.getElementById('_dbgBtn');
  const debugPanel = document.getElementById('_dbgPanel');
  if (debugBtn) {
    debugBtn.hidden = false;
    debugBtn.removeAttribute('aria-hidden');
    debugBtn.style.display = 'block';
  }
  if (debugPanel) {
    debugPanel.hidden = false;
    debugPanel.removeAttribute('aria-hidden');
    if (!debugPanel.dataset.visible) debugPanel.style.display = 'none';
  }
  if (debugBtn && !debugBtn.dataset.bound) {
    debugBtn.dataset.bound = 'true';
    debugBtn.addEventListener('click', () => {
      const panel = document.getElementById('_dbgPanel');
      if (!panel) return;
      const computedDisplay = window.getComputedStyle(panel).display;
      const isVisible = computedDisplay !== 'none';
      panel.style.display = isVisible ? 'none' : 'block';
      panel.dataset.visible = isVisible ? '0' : '1';
      panel.classList.toggle('open', isVisible);
    });
  }
  const copyBtn = document.getElementById('_dbgCopyBtn');
  if (copyBtn && !copyBtn.dataset.bound) {
    copyBtn.dataset.bound = 'true';
    copyBtn.addEventListener('click', copyDebugLogsToClipboard);
  }
}

export function initDebugPanelInterceptor() {
  initDebugPanelUi();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initDebugPanelUi, { once: true });
  }
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
