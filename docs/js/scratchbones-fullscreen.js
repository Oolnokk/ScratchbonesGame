// ── Mobile Landscape Fullscreen ───────────────────────────────────────────────
// When a mobile device rotates to landscape, shows a fullscreen prompt overlay.
// On first tap, enters fullscreen (requires user gesture per browser policy).
// After acceptance, auto-enters fullscreen on subsequent landscape rotations.
// Exits fullscreen automatically when the device returns to portrait.
// Handles iOS/Android browser restrictions gracefully.

(function () {
  'use strict';

  // Only attach on touch-capable devices (mobile/tablet).
  if (!window.matchMedia('(pointer: coarse)').matches) return;

  const PROMPT_ID = 'sb-fs-prompt';

  // Track whether the user has ever accepted fullscreen (enables auto re-entry).
  let canAutoFullscreen = false;

  // ── Orientation helpers ─────────────────────────────────────────────────────
  function isLandscape() {
    // Prefer the ScreenOrientation API; fall back to matchMedia.
    if (window.screen && window.screen.orientation && window.screen.orientation.type) {
      return window.screen.orientation.type.startsWith('landscape');
    }
    return window.matchMedia('(orientation: landscape)').matches;
  }

  // ── Fullscreen target element ───────────────────────────────────────────────
  function getGameElement() {
    // Fullscreen the whole document so body-fixed overlays (layer manager host,
    // fly cards, chip clusters) remain visible, and the existing #app letterbox
    // CSS handles the "black bars + scaled content" framing.
    return document.documentElement;
  }

  // ── Fullscreen state helpers ────────────────────────────────────────────────
  function isFullscreen() {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement
    );
  }

  // ── Enter / exit fullscreen ─────────────────────────────────────────────────
  async function enterFullscreen() {
    const el = getGameElement();
    try {
      if (el.requestFullscreen) {
        await el.requestFullscreen();
      } else if (el.webkitRequestFullscreen) {
        // Safari / older WebKit
        await el.webkitRequestFullscreen();
      } else if (el.mozRequestFullScreen) {
        await el.mozRequestFullScreen();
      }
      canAutoFullscreen = true;
    } catch (_err) {
      // Browser may reject without a qualifying gesture – fail silently.
    }
    hideFsPrompt();
  }

  function exitFullscreen() {
    try {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        document.webkitExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        document.mozCancelFullScreen();
      }
    } catch (_err) { /* ignore */ }
  }

  // ── Prompt visibility ───────────────────────────────────────────────────────
  function showFsPrompt() {
    const el = document.getElementById(PROMPT_ID);
    if (el) el.style.display = 'flex';
  }

  function hideFsPrompt() {
    const el = document.getElementById(PROMPT_ID);
    if (el) el.style.display = 'none';
  }

  // ── Orientation change handler ──────────────────────────────────────────────
  function handleOrientationChange() {
    if (isLandscape()) {
      if (!isFullscreen()) {
        if (canAutoFullscreen) {
          // User already accepted once – re-enter automatically.
          enterFullscreen();
        } else {
          showFsPrompt();
        }
      }
    } else {
      // Portrait: hide prompt and exit fullscreen if active.
      hideFsPrompt();
      if (isFullscreen()) {
        exitFullscreen();
      }
    }
  }

  // ── Initialize ──────────────────────────────────────────────────────────────
  function init() {
    // Build the overlay element.
    const prompt = document.createElement('div');
    prompt.id = PROMPT_ID;
    prompt.setAttribute('role', 'dialog');
    prompt.setAttribute('aria-label', 'Fullscreen prompt');
    prompt.innerHTML = `
      <button id="sb-fs-accept" aria-label="Enter fullscreen">
        <span class="sb-fs-icon" aria-hidden="true">&#x26F6;</span>
        <span class="sb-fs-text">Tap for Fullscreen</span>
      </button>
      <button id="sb-fs-dismiss" aria-label="Dismiss">&#x2715;</button>
    `;
    document.body.appendChild(prompt);

    // Accept: enter fullscreen on user gesture.
    document.getElementById('sb-fs-accept').addEventListener('click', () => {
      enterFullscreen();
    });

    // Dismiss: hide overlay; do not re-prompt automatically this session.
    document.getElementById('sb-fs-dismiss').addEventListener('click', () => {
      hideFsPrompt();
      // Prevent auto-re-prompting on future rotations if user dismissed.
      canAutoFullscreen = false;
    });

    // Listen for orientation changes via both APIs for maximum compatibility.
    if (window.screen && window.screen.orientation) {
      window.screen.orientation.addEventListener('change', handleOrientationChange);
    }
    window.addEventListener('orientationchange', handleOrientationChange);

    // Check orientation immediately in case the page loaded in landscape.
    handleOrientationChange();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
