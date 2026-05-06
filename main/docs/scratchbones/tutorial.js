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
//   const tut = createTutorial({ getContext: () => ({ isHumanTurn: true }), onDone: () => { unpauseGame(); } });
//   tut.show();   // builds overlay if needed and renders step 0
//   tut.hide();   // hides without calling onDone (e.g. page hidden)

// ── Step definitions ───────────────────────────────────────────────────────────
// Each step has:
//   id      – stable identifier (not displayed)
//   target  – function returning one or more candidate HTMLElements to spotlight
//   title   – heading text shown in the panel
//   text    – body explanation shown in the panel; may be a string or (ctx) => string

function pluralize(count, singular, plural = `${singular}s`) {
  return count === 1 ? singular : plural;
}

function formatCount(count) {
  const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
  return Number.isInteger(count) && count >= 0 && count < words.length ? words[count] : String(count);
}

function joinList(items) {
  if (!items.length) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items.at(-1)}`;
}

function normalizeTrickType(trickType) {
  return String(trickType || '')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function formatCardName(card) {
  if (!card) return 'Unknown Card';
  if (card.trickType) return `${normalizeTrickType(card.trickType)} Bone`;
  if (card.wild === true) return 'Wild';
  if (card.rank !== null && card.rank !== undefined && card.rank !== '') return String(card.rank);
  return 'Unknown Card';
}

export function countRanks(hand = []) {
  return hand.reduce((counts, card) => {
    if (!card || card.wild === true || card.rank === null || card.rank === undefined || card.rank === '') return counts;
    const rank = String(card.rank);
    return { ...counts, [rank]: (counts[rank] || 0) + 1 };
  }, {});
}

function summarizeRankCounts(hand = []) {
  const counts = countRanks(hand);
  const rankEntries = Object.entries(counts).sort(([rankA], [rankB]) => Number(rankA) - Number(rankB));
  if (!rankEntries.length) return 'You have no ranked cards';
  const rankParts = rankEntries.map(([rank, count]) => `${formatCount(count)} ${rank}${count === 1 ? '' : 's'}`);
  return `You have ${joinList(rankParts)}`;
}

export function summarizeTrickBones(hand = []) {
  const counts = hand.reduce((tricks, card) => {
    if (!card?.trickType) return tricks;
    const name = formatCardName(card);
    return { ...tricks, [name]: (tricks[name] || 0) + 1 };
  }, {});
  const trickEntries = Object.entries(counts).sort(([nameA], [nameB]) => nameA.localeCompare(nameB));
  if (!trickEntries.length) return '';
  const trickParts = trickEntries.map(([name, count]) => `${formatCount(count)} ${pluralize(count, name)}`);
  const total = trickEntries.reduce((sum, [, count]) => sum + count, 0);
  return `${formatCount(total)} ${pluralize(total, 'Trick Bone')} present: ${joinList(trickParts)}`;
}

export function summarizeHand(hand = []) {
  const cards = Array.isArray(hand) ? hand : [];
  const totalCards = cards.length;
  const wildCount = cards.filter((card) => card?.wild === true).length;
  const pieces = [
    `Your hand has ${formatCount(totalCards)} ${pluralize(totalCards, 'card')}`,
    summarizeRankCounts(cards),
    `${formatCount(wildCount)} ${pluralize(wildCount, 'Wild card')}`,
  ];
  const trickSummary = summarizeTrickBones(cards);
  if (trickSummary) pieces.push(trickSummary);
  return `${pieces.join('. ')}.`;
}

function summarizeSelectedCards(selectedCards = []) {
  const count = Array.isArray(selectedCards) ? selectedCards.length : 0;
  if (!count) return '';
  return ` ${formatCount(count)} ${pluralize(count, 'card is', 'cards are')} currently selected.`;
}

function hasDeclaredRank(declaredRank) {
  return declaredRank !== null && declaredRank !== undefined && declaredRank !== '';
}

function summarizeClaimStep(ctx = {}) {
  const latestPlay = ctx.latestPlay || null;
  const declaredRank = hasDeclaredRank(ctx.declaredRank)
    ? ctx.declaredRank
    : latestPlay?.declaredRank;
  const pileCount = Number.isInteger(ctx.pileCount) ? ctx.pileCount : 0;
  const parts = [];

  if (!latestPlay && !hasDeclaredRank(declaredRank)) {
    parts.push('The table is empty. The first player to play cards will set the claim rank for the round.');
  } else {
    if (hasDeclaredRank(declaredRank)) {
      parts.push(`This round is locked to ${declaredRank}. Every later claim must use that same rank.`);
    }

    if (latestPlay) {
      const cardCount = Array.isArray(latestPlay.cards) ? latestPlay.cards.length : 0;
      const playRank = hasDeclaredRank(latestPlay.declaredRank) ? latestPlay.declaredRank : declaredRank;
      const rankText = hasDeclaredRank(playRank) ? ` as ${playRank}` : '';
      parts.push(`The latest claim added ${formatCount(cardCount)} face-down ${pluralize(cardCount, 'card')}${rankText}.`);
    }
  }

  if (pileCount > 0) {
    parts.push(`The pile now has ${formatCount(pileCount)} ${pluralize(pileCount, 'claim')}.`);
  }

  if (ctx.challengeWindow) {
    parts.push('A challenge window is open, so the player can challenge the latest claim if they think it is a bluff.');
  }

  return parts.join(' ');
}

const TUTORIAL_STEPS = [
  {
    id: 'welcome',
    target: null,
    title: 'Welcome to Scratchbones!',
    text: 'This walkthrough will introduce you to the board before your first move. Use the arrows below to step back and forward through each element.',
  },
  {
    id: 'hand',
    target: () => [document.querySelector('[data-proj-id="hand"]')],
    title: 'Your Hand',
    text: (ctx = {}) => `${summarizeHand(ctx.hand)}${summarizeSelectedCards(ctx.selectedCards)} Tap a card to select it — you can select multiple — then choose a declared rank and press Play.`,
  },
  {
    id: 'trick-bones',
    target: () => [
      document.querySelector('[data-proj-id="hand"] [data-trick-glow]'),
      document.querySelector('[data-proj-id="hand"]'),
    ],
    title: 'Trick Bone Cards',
    text: 'Glowing cards are Trick Bones — special cards with unique powers.\n\nSmuggle Bone: move one of your cards to another player\'s hand.\nTrap Bone: a wild card that can spring during a challenge.\nPunish Bone: arm a punishment before a betting decision to pressure your opponent.',
  },
  {
    id: 'claim',
    target: () => [
      document.querySelector('[data-proj-id="claim-cluster"]'),
      document.querySelector('.tableViewCards'),
    ],
    title: 'The Claim Display',
    text: summarizeClaimStep,
  },
  {
    id: 'chips',
    target: () => [document.querySelector('[data-proj-id="topbar"]')],
    title: 'Chips & The Pot',
    text: 'Chips are how you win. Everyone antes up at the start of each round, growing the pot. Winning a challenge earns you chips from your opponent — but calling a wrong bluff costs you.',
  },
  {
    id: 'opponents',
    target: () => [document.querySelector('[data-proj-id="sidebar"]')],
    title: 'Your Opponents',
    text: 'Your AI opponents sit in the sidebar. Watch their chip counts and hand sizes. If you believe the last player was bluffing their declared rank, challenge them before you pass your turn!',
  },
  {
    id: 'controls',
    target: () => [
      document.querySelector('[data-proj-id="controls"]'),
      document.querySelector('[data-proj-id="challenge-prompt"]'),
    ],
    title: 'Your Actions',
    text: 'Select cards from your hand, choose a declared rank, and press Play. You can Concede (costs 1 chip) to skip without playing. During a challenge window, press Challenge if you think the last claim was a bluff, or Let Pass to accept it.',
  },
  {
    id: 'log',
    target: () => [document.querySelector('[data-proj-id="log"]')],
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
export function createTutorial({ onDone, gameConfig, getContext } = {}) {
  const tutorialConfig = gameConfig?.tutorial || {};
  const ringPadPx = Math.max(0, Number(tutorialConfig.ringPadPx) || 0);
  const minVisibleAreaRatio = Math.min(1, Math.max(0, Number(tutorialConfig.minVisibleAreaRatio) || 0));
  const panelEdgePaddingPx = Math.max(0, Number(tutorialConfig.panelEdgePaddingPx) || 0);
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
    overlayEl = document.getElementById('sb-tutorial-overlay');
    if (!overlayEl) {
      overlayEl = document.createElement('div');
      overlayEl.id = 'sb-tutorial-overlay';
      document.body.appendChild(overlayEl);
    }

    if (overlayEl.parentNode !== document.body) document.body.appendChild(overlayEl);

    overlayEl.setAttribute('role', 'dialog');
    overlayEl.setAttribute('aria-modal', 'true');
    overlayEl.setAttribute('aria-label', 'Scratchbones Tutorial');

    // Reuse children if already built (e.g. re-entrant call).
    backdropEl = overlayEl.querySelector('.tut-backdrop');
    ringEl     = overlayEl.querySelector('.tut-ring');
    panelEl    = overlayEl.querySelector('.tut-panel');
    titleEl    = overlayEl.querySelector('.tut-title');
    textEl     = overlayEl.querySelector('.tut-text');
    counterEl  = overlayEl.querySelector('.tut-counter');
    backBtnEl  = overlayEl.querySelector('.tut-btn-back');
    nextBtnEl  = overlayEl.querySelector('.tut-btn-next');
    if (backdropEl) return; // Already fully built.

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
  }

  // ── Target resolution ────────────────────────────────────────────────────────
  function normalizeTargetCandidates(rawTarget) {
    if (!rawTarget) return [];
    if (rawTarget instanceof Element) return [rawTarget];
    if (typeof NodeList !== 'undefined' && rawTarget instanceof NodeList) return [...rawTarget];
    if (Array.isArray(rawTarget)) return rawTarget.flatMap((entry) => normalizeTargetCandidates(entry));
    return [];
  }

  function intersectRects(a, b) {
    const left = Math.max(a.left, b.left);
    const top = Math.max(a.top, b.top);
    const right = Math.min(a.right, b.right);
    const bottom = Math.min(a.bottom, b.bottom);
    return {
      left,
      top,
      right,
      bottom,
      width: Math.max(0, right - left),
      height: Math.max(0, bottom - top),
    };
  }

  function clippedVisibleRect(targetEl) {
    if (!targetEl || !targetEl.isConnected) return null;
    const rect = targetEl.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;

    let visibleRect = intersectRects(rect, {
      left: 0,
      top: 0,
      right: window.innerWidth,
      bottom: window.innerHeight,
    });

    let parentEl = targetEl.parentElement;
    while (parentEl && parentEl !== document.body && visibleRect.width && visibleRect.height) {
      const style = window.getComputedStyle(parentEl);
      const clipsX = /auto|scroll|hidden|clip/.test(style.overflowX || '');
      const clipsY = /auto|scroll|hidden|clip/.test(style.overflowY || '');
      if (clipsX || clipsY) {
        const parentRect = parentEl.getBoundingClientRect();
        visibleRect = intersectRects(visibleRect, parentRect);
      }
      parentEl = parentEl.parentElement;
    }

    return visibleRect.width && visibleRect.height ? visibleRect : null;
  }

  function isVisibleTutorialTarget(targetEl) {
    if (!targetEl || !targetEl.isConnected) return false;
    const style = window.getComputedStyle(targetEl);
    if (style.display === 'none' || style.visibility === 'hidden' || Number(style.opacity) === 0) return false;
    const rect = targetEl.getBoundingClientRect();
    const visibleRect = clippedVisibleRect(targetEl);
    if (!visibleRect) return false;
    const totalArea = rect.width * rect.height;
    const visibleArea = visibleRect.width * visibleRect.height;
    return totalArea > 0 && (visibleArea / totalArea) >= minVisibleAreaRatio;
  }

  function resolveTarget(step) {
    if (!step.target) return null;
    try {
      const candidates = normalizeTargetCandidates(step.target());
      return candidates.find((candidate) => isVisibleTutorialTarget(candidate)) || null;
    } catch {
      return null;
    }
  }

  // ── Ring positioning ─────────────────────────────────────────────────────────
  // The ring is positioned with CSS `position: fixed` coordinates derived from
  // the clipped visible portion of getBoundingClientRect(). The overlay is
  // reparented to <body> so transformed game layout containers cannot offset it.
  function positionRing(targetEl) {
    if (!ringEl) return;
    if (!targetEl) {
      ringEl.style.display = 'none';
      return;
    }
    const rect = clippedVisibleRect(targetEl);
    if (!rect?.width || !rect?.height) {
      ringEl.style.display = 'none';
      return;
    }
    ringEl.style.display = 'block';
    ringEl.style.left = `${rect.left - ringPadPx}px`;
    ringEl.style.top = `${rect.top - ringPadPx}px`;
    ringEl.style.width = `${rect.width + ringPadPx * 2}px`;
    ringEl.style.height = `${rect.height + ringPadPx * 2}px`;
  }

  // ── Panel positioning ────────────────────────────────────────────────────────
  // Default: anchored to the bottom-centre.  If the target occupies the lower
  // half of the viewport we slide the panel to the top instead so it doesn't
  // occlude the spotlight.
  function positionPanel(targetEl) {
    if (!panelEl) return;
    if (targetEl) {
      const rect = clippedVisibleRect(targetEl);
      if (!rect) {
        panelEl.style.top = 'auto';
        panelEl.style.bottom = `${panelEdgePaddingPx}px`;
        return;
      }
      const midY = rect.top + rect.height / 2;
      const vh = window.innerHeight;
      if (midY > vh * 0.50) {
        panelEl.style.bottom = 'auto';
        panelEl.style.top = `${panelEdgePaddingPx}px`;
      } else {
        panelEl.style.top = 'auto';
        panelEl.style.bottom = `${panelEdgePaddingPx}px`;
      }
    } else {
      panelEl.style.top = 'auto';
      panelEl.style.bottom = `${panelEdgePaddingPx}px`;
    }
  }

  // ── Render a step ────────────────────────────────────────────────────────────
  function renderStep(index) {
    const steps = TUTORIAL_STEPS;
    if (index < 0 || index >= steps.length) return;
    currentStep = index;
    const step = steps[index];
    const context = typeof getContext === 'function' ? getContext() : {};
    const targetEl = resolveTarget(step);
    const body = typeof step.text === 'function' ? step.text(context) : step.text;

    positionRing(targetEl);
    positionPanel(targetEl);

    if (titleEl) titleEl.textContent = step.title;
    if (textEl) textEl.textContent = body;
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
