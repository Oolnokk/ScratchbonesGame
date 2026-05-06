// ── Scratchbones Tutorial ──────────────────────────────────────────────────────
// A step-by-step guided walkthrough shown at the start of a PvE match.
// Manages its own DOM overlay; the game is paused via `state.tutorialPaused`
// while steps are displayed.
//
// The spotlight ring uses a box-shadow pulse animation that mirrors the amber
// fire palette used elsewhere in the UI (topbar flame, claim glows).  The
// trick-bone glow keyframe in the main stylesheet uses the same drop-shadow
// approach; here we use box-shadow on a ring <div> so we can surround arbitrary
// element shapes without touching filter compositing on the underlying cards.
//
// Usage:
//   import { createTutorial } from './tutorial.js';
//   const tut = createTutorial({ onDone: () => { unpauseGame(); } });
//   tut.show();   // builds overlay if needed and renders step 0
//   tut.hide();   // hides without calling onDone (e.g. page hidden)

// ── Step definitions ───────────────────────────────────────────────────────────
// Each step has:
//   id      – stable identifier (not displayed)
//   target  – function returning an HTMLElement to spotlight (or null)
//   title   – heading text shown in the panel
//   text    – body explanation shown in the panel
const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    target: null,
    title: 'Welcome to Scratchbones!',
    text: 'This walkthrough will introduce you to the board before your first move. Use the arrows below to step back and forward through each element.',
  },
  {
    id: 'hand',
    target: () => document.querySelector('[data-proj-id="hand"]'),
    title: 'Your Hand',
    text: 'These are your cards. Each card shows a rank from 1 to 10. Wild cards (W) match any rank. Tap a card to select it — you can select multiple — then choose a declared rank and press Play.',
  },
  {
    id: 'trick-bones',
    target: () =>
      document.querySelector('[data-proj-id="hand"] [data-trick-glow]') ||
      document.querySelector('[data-proj-id="hand"]'),
    title: 'Trick Bone Cards',
    text: 'Glowing cards are Trick Bones — special cards with unique powers.\n\nSmuggle Bone: move one of your cards to another player\'s hand.\nTrap Bone: a wild card that can spring during a challenge.\nPunish Bone: arm a punishment before a betting decision to pressure your opponent.',
  },
  {
    id: 'claim',
    target: () => document.querySelector('[data-proj-id="claim-cluster"]'),
    title: 'The Claim Display',
    text: 'The centre of the table shows the active claim: the declared rank and how many cards were played face-down. Once a rank is declared, every player this round must play cards and declare that same rank.',
  },
  {
    id: 'chips',
    target: () => document.querySelector('[data-proj-id="topbar"]'),
    title: 'Chips & The Pot',
    text: 'Chips are how you win. Everyone antes up at the start of each round, growing the pot. Winning a challenge earns you chips from your opponent — but calling a wrong bluff costs you.',
  },
  {
    id: 'opponents',
    target: () => document.querySelector('[data-proj-id="sidebar"]'),
    title: 'Your Opponents',
    text: 'Your AI opponents sit in the sidebar. Watch their chip counts and hand sizes. If you believe the last player was bluffing their declared rank, challenge them before you pass your turn!',
  },
  {
    id: 'controls',
    target: () =>
      document.querySelector('[data-proj-id="controls"]') ||
      document.querySelector('[data-proj-id="challenge-prompt"]'),
    title: 'Your Actions',
    text: 'Select cards from your hand, choose a declared rank, and press Play. You can Concede (costs 1 chip) to skip without playing. During a challenge window, press Challenge if you think the last claim was a bluff, or Let Pass to accept it.',
  },
  {
    id: 'log',
    target: () => {
      const el = document.querySelector('[data-proj-id="log"]');
      return el && el.offsetParent !== null ? el : null;
    },
    title: 'Event Log',
    text: 'Recent game events appear here. Use it to track what everyone has been playing and spot bluffing patterns over the course of a match.',
  },
  {
    id: 'ready',
    target: null,
    title: "You're Ready!",
    text: "You know the board — the tutorial pauses are now off. Good luck, and may the bones favour you.",
  },
];

// ── createTutorial ─────────────────────────────────────────────────────────────
export function createTutorial({ onDone } = {}) {
  let currentStep = 0;
  let overlayEl = null;
  let backdropEl = null;
  let ringEl = null;
  let panelEl = null;
  let titleEl = null;
  let textEl = null;
  let counterEl = null;
  let backBtnEl = null;
  let nextBtnEl = null;
  let resizeObserver = null;

  // ── DOM construction ─────────────────────────────────────────────────────────
  function buildDom() {
    if (document.getElementById('sb-tutorial-overlay')) {
      overlayEl = document.getElementById('sb-tutorial-overlay');
      backdropEl = overlayEl.querySelector('.tut-backdrop');
      ringEl = overlayEl.querySelector('.tut-ring');
      panelEl = overlayEl.querySelector('.tut-panel');
      titleEl = overlayEl.querySelector('.tut-title');
      textEl = overlayEl.querySelector('.tut-text');
      counterEl = overlayEl.querySelector('.tut-counter');
      backBtnEl = overlayEl.querySelector('.tut-btn-back');
      nextBtnEl = overlayEl.querySelector('.tut-btn-next');
      return;
    }

    overlayEl = document.createElement('div');
    overlayEl.id = 'sb-tutorial-overlay';
    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-label', 'Scratchbones Tutorial');

    backdropEl = document.createElement('div');
    backdropEl.className = 'tut-backdrop';

    ringEl = document.createElement('div');
    ringEl.className = 'tut-ring';
    ringEl.setAttribute('aria-hidden', 'true');

    panelEl = document.createElement('div');
    panelEl.className = 'tut-panel';

    const headerEl = document.createElement('div');
    headerEl.className = 'tut-header';

    titleEl = document.createElement('div');
    titleEl.className = 'tut-title';

    counterEl = document.createElement('div');
    counterEl.className = 'tut-counter';

    headerEl.appendChild(titleEl);
    headerEl.appendChild(counterEl);

    textEl = document.createElement('div');
    textEl.className = 'tut-text';

    const navEl = document.createElement('div');
    navEl.className = 'tut-nav';

    backBtnEl = document.createElement('button');
    backBtnEl.className = 'tut-btn tut-btn-back';
    backBtnEl.textContent = '← Back';
    backBtnEl.addEventListener('click', () => advanceStep(-1));

    const skipBtnEl = document.createElement('button');
    skipBtnEl.className = 'tut-btn tut-btn-skip';
    skipBtnEl.textContent = 'Skip Tutorial';
    skipBtnEl.addEventListener('click', () => finish());

    nextBtnEl = document.createElement('button');
    nextBtnEl.className = 'tut-btn tut-btn-next';
    nextBtnEl.addEventListener('click', () => advanceStep(1));

    navEl.appendChild(backBtnEl);
    navEl.appendChild(skipBtnEl);
    navEl.appendChild(nextBtnEl);

    panelEl.appendChild(headerEl);
    panelEl.appendChild(textEl);
    panelEl.appendChild(navEl);

    overlayEl.appendChild(backdropEl);
    overlayEl.appendChild(ringEl);
    overlayEl.appendChild(panelEl);

    document.body.appendChild(overlayEl);
  }

  // ── Target resolution ────────────────────────────────────────────────────────
  function resolveTarget(step) {
    if (!step.target) return null;
    try {
      return step.target();
    } catch {
      return null;
    }
  }

  // ── Ring positioning ─────────────────────────────────────────────────────────
  // The ring is positioned with CSS `position: fixed` coordinates derived from
  // getBoundingClientRect() — the overlay itself is also `position: fixed` so
  // these values map 1:1 to the overlay's coordinate space.
  const RING_PAD = 9; // extra pixels around the target element

  function positionRing(targetEl) {
    if (!ringEl) return;
    if (!targetEl) {
      ringEl.style.display = 'none';
      return;
    }
    const rect = targetEl.getBoundingClientRect();
    if (!rect.width && !rect.height) {
      ringEl.style.display = 'none';
      return;
    }
    ringEl.style.display = 'block';
    ringEl.style.left = `${rect.left - RING_PAD}px`;
    ringEl.style.top = `${rect.top - RING_PAD}px`;
    ringEl.style.width = `${rect.width + RING_PAD * 2}px`;
    ringEl.style.height = `${rect.height + RING_PAD * 2}px`;
  }

  // ── Panel positioning ────────────────────────────────────────────────────────
  // Default: anchored to the bottom-centre.  If the target occupies the lower
  // half of the viewport we slide the panel to the top instead so it doesn't
  // occlude the spotlight.
  function positionPanel(targetEl) {
    if (!panelEl) return;
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      const midY = rect.top + rect.height / 2;
      const vh = window.innerHeight;
      if (midY > vh * 0.50) {
        panelEl.style.bottom = 'auto';
        panelEl.style.top = '20px';
      } else {
        panelEl.style.top = 'auto';
        panelEl.style.bottom = '20px';
      }
    } else {
      panelEl.style.top = 'auto';
      panelEl.style.bottom = '20px';
    }
  }

  // ── Render a step ────────────────────────────────────────────────────────────
  function renderStep(index) {
    const steps = TUTORIAL_STEPS;
    if (index < 0 || index >= steps.length) return;
    currentStep = index;
    const step = steps[index];
    const targetEl = resolveTarget(step);

    positionRing(targetEl);
    positionPanel(targetEl);

    if (titleEl) titleEl.textContent = step.title;
    if (textEl) textEl.textContent = step.text;
    if (counterEl) counterEl.textContent = `${index + 1} / ${steps.length}`;

    const isLast = index === steps.length - 1;
    if (nextBtnEl) nextBtnEl.textContent = isLast ? "Let's Play! →" : 'Next →';
    if (backBtnEl) backBtnEl.disabled = index === 0;
  }

  // ── Navigation ───────────────────────────────────────────────────────────────
  function advanceStep(delta) {
    const next = currentStep + delta;
    if (next >= TUTORIAL_STEPS.length) {
      finish();
      return;
    }
    if (next < 0) return;
    renderStep(next);
  }

  // ── Finish / teardown ────────────────────────────────────────────────────────
  function finish() {
    hide();
    if (resizeObserver) {
      resizeObserver.disconnect();
      resizeObserver = null;
    }
    if (typeof onDone === 'function') onDone();
  }

  // ── Public: show ─────────────────────────────────────────────────────────────
  function show() {
    buildDom();
    overlayEl.style.display = 'flex';
    renderStep(0);

    // Reposition the ring when the layout changes (resize, orientation change).
    if (typeof ResizeObserver !== 'undefined' && !resizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        const step = TUTORIAL_STEPS[currentStep];
        if (!step) return;
        const targetEl = resolveTarget(step);
        positionRing(targetEl);
        positionPanel(targetEl);
      });
      const app = document.getElementById('app') || document.body;
      resizeObserver.observe(app);
    }
  }

  // ── Public: hide (without calling onDone) ────────────────────────────────────
  function hide() {
    if (overlayEl) overlayEl.style.display = 'none';
  }

  return { show, hide, finish };
}
