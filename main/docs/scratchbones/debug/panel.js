function ensureDebugPanelDom() {
  if (!document.body) return;

  let debugBtn = document.getElementById('_dbgBtn');
  if (!debugBtn) {
    debugBtn = document.createElement('button');
    debugBtn.id = '_dbgBtn';
    debugBtn.type = 'button';
    debugBtn.textContent = 'Debug Log';
    debugBtn.style.position = 'fixed';
    debugBtn.style.right = '12px';
    debugBtn.style.bottom = '12px';
    debugBtn.style.zIndex = '2147483647';
    debugBtn.style.padding = '6px 10px';
    debugBtn.style.fontSize = '12px';
    document.body.appendChild(debugBtn);
  }

  let debugPanel = document.getElementById('_dbgPanel');
  if (!debugPanel) {
    debugPanel = document.createElement('section');
    debugPanel.id = '_dbgPanel';
    debugPanel.style.position = 'fixed';
    debugPanel.style.right = '12px';
    debugPanel.style.bottom = '48px';
    debugPanel.style.width = 'min(640px, 90vw)';
    debugPanel.style.height = 'min(45vh, 420px)';
    debugPanel.style.background = 'rgba(0,0,0,0.9)';
    debugPanel.style.color = '#ddd';
    debugPanel.style.border = '1px solid #555';
    debugPanel.style.zIndex = '2147483647';
    debugPanel.style.setProperty('display', 'none', 'important');
    debugPanel.innerHTML = '<div style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;border-bottom:1px solid #444;"><strong>Debug Log</strong><button id="_dbgCopyBtn" type="button">Copy</button></div><div id="_dbgBody" style="height:calc(100% - 38px);overflow:auto;padding:8px;font:12px/1.3 monospace;white-space:pre-wrap;"></div>';
    document.body.appendChild(debugPanel);
  }
}

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
  ensureDebugPanelDom();
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
    if (!debugPanel.dataset.visible) debugPanel.style.setProperty('display', 'none', 'important');
  }
  if (debugBtn && !debugBtn.dataset.bound) {
    debugBtn.dataset.bound = 'true';
    debugBtn.addEventListener('click', () => {
      const panel = document.getElementById('_dbgPanel');
      if (!panel) return;
      const computedDisplay = window.getComputedStyle(panel).display;
      const isVisible = computedDisplay !== 'none';
      if (isVisible) {
        panel.style.setProperty('display', 'none', 'important');
        panel.dataset.visible = '0';
      } else {
        panel.style.setProperty('display', 'flex', 'important');
        panel.dataset.visible = '1';
      }
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
        catch { return String(x); }
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
