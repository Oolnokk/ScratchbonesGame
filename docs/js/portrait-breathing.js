// ============================================================
// PORTRAIT BREATHING COMPOSER
// Manages mesh-deformation breathing animations for portrait
// body, body-cosmetic, and hood layers.
//
// Usage:
//   const composer = new BreathingComposer();
//   await composer.load('./docs/config/');   // loads default + overrides
//   // In render loop:
//   renderPortraitProfile(canvas, profile, { breathingComposer: composer, breathingPhaseOffsetMs: offset });
//
// Species overrides:
//   Species JSON may define "breathingAnimationUrl" under a gender key.
//   loadPortraitCosmetics() passes override data to the composer automatically
//   when it detects a "breathingAnimation" block in species gender data.
//
// Emoji compositing hook:
//   composer.triggerEmote('disgust'|'love'|'alarmed'|'curious') plays a
//   one-shot body deformation that blends additively on top of breathing.
//   composer.setBodyOverlay(speciesId, gender, animData, opts) is the lower-
//   level API; opts can be a number (durationMs) or { oneshot, global, durationMs }.
//   composer.clearBodyOverlay() cancels any active overlay.
// ============================================================

'use strict';

// ── Neutral 4×6 control points (reused by emote animation definitions) ────
const _N4x6 = [
  [0,0],[0.333333,0],[0.666667,0],[1,0],
  [0,0.2],[0.333333,0.2],[0.666667,0.2],[1,0.2],
  [0,0.4],[0.333333,0.4],[0.666667,0.4],[1,0.4],
  [0,0.6],[0.333333,0.6],[0.666667,0.6],[1,0.6],
  [0,0.8],[0.333333,0.8],[0.666667,0.8],[1,0.8],
  [0,1],[0.333333,1],[0.666667,1],[1,1],
];

// ── Emote one-shot deformation animations ────────────────────────────────
// Each animation starts AND ends at neutral so blending in/out is seamless.
// Poses are additive on top of the breathing cycle via triggerEmote().
const EMOTE_ANIMATIONS = {

  // Humorous vertical squash-stretch-settle
  disgust: {
    gridCols: 4, gridRows: 6,
    poseDurations: [0.05, 0.15, 0.10, 0.12, 0.30],
    poses: [
      { label: 'neutral', points: _N4x6 },
      { label: 'squash', points: [
        [0,0],[0.333333,0],[0.666667,0],[1,0],
        [0,0.20],[0.295,0.20],[0.705,0.20],[1,0.20],
        [0,0.41],[0.292,0.41],[0.708,0.41],[1,0.41],
        [0,0.55],[0.289,0.55],[0.711,0.55],[1,0.55],
        [0,0.70],[0.290,0.70],[0.710,0.70],[1,0.70],
        [0,0.85],[0.292,0.85],[0.708,0.85],[1,0.85],
      ]},
      { label: 'stretch', points: [
        [0,0],[0.333333,0],[0.666667,0],[1,0],
        [0,0.18],[0.365,0.18],[0.635,0.18],[1,0.18],
        [0,0.37],[0.368,0.37],[0.632,0.37],[1,0.37],
        [0,0.64],[0.368,0.64],[0.632,0.64],[1,0.64],
        [0,0.83],[0.366,0.83],[0.634,0.83],[1,0.83],
        [0,1.00],[0.365,1.00],[0.635,1.00],[1,1.00],
      ]},
      { label: 'squash2', points: [
        [0,0],[0.333333,0],[0.666667,0],[1,0],
        [0,0.20],[0.311,0.20],[0.689,0.20],[1,0.20],
        [0,0.41],[0.310,0.41],[0.690,0.41],[1,0.41],
        [0,0.58],[0.310,0.58],[0.690,0.58],[1,0.58],
        [0,0.76],[0.310,0.76],[0.690,0.76],[1,0.76],
        [0,0.91],[0.310,0.91],[0.690,0.91],[1,0.91],
      ]},
      { label: 'neutral', points: _N4x6 },
    ],
  },

  // Cartoony blow-kiss sway: lean right → hold → sway back → small left → neutral
  love: {
    gridCols: 4, gridRows: 6,
    poseDurations: [0.06, 0.22, 0.15, 0.12, 0.30],
    poses: [
      { label: 'neutral', points: _N4x6 },
      { label: 'lean-right', points: [
        [0,0],[0.333333,0],[0.666667,0],[1,0],
        [0,0.20],[0.360,0.20],[0.693,0.20],[1,0.20],
        [0,0.40],[0.383,0.40],[0.716,0.40],[1,0.40],
        [0,0.60],[0.400,0.60],[0.733,0.60],[1,0.60],
        [0,0.80],[0.385,0.80],[0.718,0.80],[1,0.80],
        [0,1.00],[0.360,1.00],[0.693,1.00],[1,1.00],
      ]},
      { label: 'lean-right-hold', points: [
        [0,0],[0.333333,0],[0.666667,0],[1,0],
        [0,0.20],[0.355,0.20],[0.688,0.20],[1,0.20],
        [0,0.40],[0.375,0.40],[0.708,0.40],[1,0.40],
        [0,0.60],[0.392,0.60],[0.725,0.60],[1,0.60],
        [0,0.80],[0.378,0.80],[0.711,0.80],[1,0.80],
        [0,1.00],[0.353,1.00],[0.686,1.00],[1,1.00],
      ]},
      { label: 'lean-left-slight', points: [
        [0,0],[0.333333,0],[0.666667,0],[1,0],
        [0,0.20],[0.318,0.20],[0.651,0.20],[1,0.20],
        [0,0.40],[0.312,0.40],[0.645,0.40],[1,0.40],
        [0,0.60],[0.310,0.60],[0.643,0.60],[1,0.60],
        [0,0.80],[0.312,0.80],[0.645,0.80],[1,0.80],
        [0,1.00],[0.318,1.00],[0.651,1.00],[1,1.00],
      ]},
      { label: 'neutral', points: _N4x6 },
    ],
  },

  // Text-burst-style outward expansion → contract overshoot → small burst → neutral
  alarmed: {
    gridCols: 4, gridRows: 6,
    poseDurations: [0.03, 0.12, 0.08, 0.10, 0.25],
    poses: [
      { label: 'neutral', points: _N4x6 },
      { label: 'burst', points: [
        [0,0],[0.333333,0],[0.666667,0],[1,0],
        [0,0.17],[0.28,0.17],[0.72,0.17],[1,0.17],
        [0,0.36],[0.26,0.36],[0.74,0.36],[1,0.36],
        [0,0.64],[0.26,0.64],[0.74,0.64],[1,0.64],
        [0,0.83],[0.28,0.83],[0.72,0.83],[1,0.83],
        [0,1],[0.333333,1],[0.666667,1],[1,1],
      ]},
      { label: 'contract', points: [
        [0,0],[0.333333,0],[0.666667,0],[1,0],
        [0,0.22],[0.370,0.22],[0.630,0.22],[1,0.22],
        [0,0.43],[0.385,0.43],[0.615,0.43],[1,0.43],
        [0,0.57],[0.385,0.57],[0.615,0.57],[1,0.57],
        [0,0.78],[0.370,0.78],[0.630,0.78],[1,0.78],
        [0,1],[0.333333,1],[0.666667,1],[1,1],
      ]},
      { label: 'burst2', points: [
        [0,0],[0.333333,0],[0.666667,0],[1,0],
        [0,0.19],[0.305,0.19],[0.695,0.19],[1,0.19],
        [0,0.39],[0.294,0.39],[0.706,0.39],[1,0.39],
        [0,0.61],[0.294,0.61],[0.706,0.61],[1,0.61],
        [0,0.81],[0.305,0.81],[0.695,0.81],[1,0.81],
        [0,1],[0.333333,1],[0.666667,1],[1,1],
      ]},
      { label: 'neutral', points: _N4x6 },
    ],
  },

  // Inverted alarm: inward contraction → small burst → secondary contract → neutral
  curious: {
    gridCols: 4, gridRows: 6,
    poseDurations: [0.03, 0.12, 0.08, 0.10, 0.25],
    poses: [
      { label: 'neutral', points: _N4x6 },
      { label: 'contract', points: [
        [0,0],[0.333333,0],[0.666667,0],[1,0],
        [0,0.23],[0.370,0.23],[0.630,0.23],[1,0.23],
        [0,0.44],[0.385,0.44],[0.615,0.44],[1,0.44],
        [0,0.56],[0.385,0.56],[0.615,0.56],[1,0.56],
        [0,0.77],[0.370,0.77],[0.630,0.77],[1,0.77],
        [0,1],[0.333333,1],[0.666667,1],[1,1],
      ]},
      { label: 'bounce-out', points: [
        [0,0],[0.333333,0],[0.666667,0],[1,0],
        [0,0.18],[0.30,0.18],[0.70,0.18],[1,0.18],
        [0,0.38],[0.285,0.38],[0.715,0.38],[1,0.38],
        [0,0.62],[0.285,0.62],[0.715,0.62],[1,0.62],
        [0,0.82],[0.30,0.82],[0.70,0.82],[1,0.82],
        [0,1],[0.333333,1],[0.666667,1],[1,1],
      ]},
      { label: 'contract2', points: [
        [0,0],[0.333333,0],[0.666667,0],[1,0],
        [0,0.22],[0.355,0.22],[0.645,0.22],[1,0.22],
        [0,0.42],[0.365,0.42],[0.635,0.42],[1,0.42],
        [0,0.58],[0.365,0.58],[0.635,0.58],[1,0.58],
        [0,0.78],[0.355,0.78],[0.645,0.78],[1,0.78],
        [0,1],[0.333333,1],[0.666667,1],[1,1],
      ]},
      { label: 'neutral', points: _N4x6 },
    ],
  },
};

// ============================================================

class BreathingComposer {
  constructor() {
    this._defaultAnim = null;
    this._overrides   = new Map(); // "speciesId:gender" → anim data

    // One-shot emoji body overlay state
    this._overlay = null; // { anim, startMs, durationMs, oneshot, global, speciesId, gender }
  }

  get enabled() {
    const cfg = window.SCRATCHBONES_CONFIG?.game?.portrait?.breathing;
    return cfg?.enabled !== false;
  }

  // ── Data management ──────────────────────────────────────

  setDefault(animData) {
    this._defaultAnim = _validateBreathingAnim(animData) ? animData : null;
  }

  setOverride(speciesId, gender, animData) {
    const key = `${String(speciesId).trim()}:${String(gender).trim()}`;
    if (_validateBreathingAnim(animData)) {
      this._overrides.set(key, animData);
    }
  }

  getAnimData(speciesId, gender) {
    const key = `${String(speciesId || '').trim()}:${String(gender || '').trim()}`;
    return this._overrides.get(key) || this._defaultAnim;
  }

  // ── Loading ──────────────────────────────────────────────

  async load(configBase) {
    const base = String(configBase || './config/').replace(/\/?$/, '/');
    try {
      const url = new URL(base + 'animations/breathing-default.json', window.location.href).toString();
      const resp = await fetch(url);
      if (resp.ok) {
        const data = await resp.json();
        this.setDefault(data);
      } else {
        console.warn('[breathing] Default animation not found:', url);
      }
    } catch (e) {
      console.warn('[breathing] Could not load default breathing animation', e);
    }
  }

  // ── Emoji body overlay ───────────────────────────────────

  /**
   * Trigger a one-shot global body deformation for an emoji reaction.
   * emoteName: 'disgust' | 'love' | 'alarmed' | 'curious'
   */
  triggerEmote(emoteName) {
    const anim = EMOTE_ANIMATIONS[emoteName];
    if (!anim || !this.enabled) return;
    const durations = Array.isArray(anim.poseDurations) ? anim.poseDurations : [];
    const totalMs = durations.reduce((s, d) => s + (Number(d) || 0.8), 0) * 1000;
    this.setBodyOverlay(null, null, anim, { oneshot: true, global: true, durationMs: totalMs });
  }

  /**
   * Low-level overlay API. animData must pass validation.
   * opts: number (legacy durationMs) or { oneshot, global, durationMs }
   */
  setBodyOverlay(speciesId, gender, animData, opts) {
    if (!_validateBreathingAnim(animData)) return;
    let oneshot = false, global = false, durationMs = 2000;
    if (typeof opts === 'number') {
      durationMs = Number(opts) || 2000;
    } else if (opts && typeof opts === 'object') {
      oneshot    = !!opts.oneshot;
      global     = !!opts.global;
      durationMs = Number(opts.durationMs) || 2000;
    }
    this._overlay = {
      speciesId:  global ? null : String(speciesId || ''),
      gender:     global ? null : String(gender    || ''),
      anim:       animData,
      startMs:    Date.now(),
      durationMs,
      oneshot,
      global,
    };
  }

  clearBodyOverlay() {
    this._overlay = null;
  }

  // ── Point interpolation ──────────────────────────────────

  /**
   * Returns the interpolated deformed mesh points for the given species/gender
   * at the given time (with optional phase offset for portrait-to-portrait variation).
   * Returns null if no animation data is available and no overlay is active.
   */
  getInterpolatedPoints(speciesId, gender, nowMs, phaseOffsetMs) {
    if (!this.enabled) return null;
    const anim = this.getAnimData(speciesId, gender);
    const offset = Number(phaseOffsetMs) || 0;
    const breathePts = anim ? _interpolatePoses(anim, nowMs + offset) : null;

    if (this._overlay) {
      const ol = this._overlay;
      const elapsed = nowMs - ol.startMs;

      if (elapsed >= ol.durationMs) {
        this._overlay = null;
      } else {
        const applies = ol.global ||
          (ol.speciesId === String(speciesId || '') && ol.gender === String(gender || ''));

        if (applies) {
          const olPts = ol.oneshot
            ? _interpolatePosesOneShot(ol.anim, elapsed)
            : _interpolatePoses(ol.anim, elapsed);

          if (olPts) {
            const olNeutral = _getNeutralPoints(ol.anim.gridCols, ol.anim.gridRows);
            // Base to composite onto: breathing if available, else the overlay's neutral grid
            const base = breathePts || olNeutral;

            if (ol.oneshot) {
              // One-shot: add displacement directly — animation starts/ends at neutral so no fade needed
              return base.map(([bx, by], i) => {
                const [onx, ony] = olNeutral[i];
                const [ox, oy] = olPts[i];
                return [bx + (ox - onx), by + (oy - ony)];
              });
            } else {
              // Fading overlay: triangle fade envelope (in over first 20%, out over last 20%)
              const t = elapsed / ol.durationMs;
              const env = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
              return base.map(([bx, by], i) => {
                const [onx, ony] = olNeutral[i];
                const [ox, oy] = olPts[i];
                return [bx + (ox - onx) * env, by + (oy - ony) * env];
              });
            }
          }
        }
      }
    }

    return breathePts;
  }
}

// ── Internal helpers ─────────────────────────────────────────

function _validateBreathingAnim(data) {
  if (!data || typeof data !== 'object') return false;
  if (!Array.isArray(data.poses) || data.poses.length < 2) return false;
  if (!Number.isFinite(data.gridCols) || !Number.isFinite(data.gridRows)) return false;
  const ptCount = data.gridCols * data.gridRows;
  for (const pose of data.poses) {
    if (!Array.isArray(pose.points) || pose.points.length !== ptCount) return false;
  }
  return true;
}

function _getNeutralPoints(gridCols, gridRows) {
  const pts = [];
  for (let r = 0; r < gridRows; r++) {
    for (let c = 0; c < gridCols; c++) {
      pts.push([
        gridCols > 1 ? c / (gridCols - 1) : 0.5,
        gridRows > 1 ? r / (gridRows - 1) : 0.5,
      ]);
    }
  }
  return pts;
}

/**
 * Looping interpolation used for the breathing cycle.
 * Uses Ken Perlin smoothstep: 3t² − 2t³
 */
function _interpolatePoses(anim, timeMs) {
  const poses = anim.poses;
  const durations = Array.isArray(anim.poseDurations) ? anim.poseDurations : [];
  const n = poses.length;
  const defaultDur = 0.8;

  let totalDuration = 0;
  for (let i = 0; i < n; i++) totalDuration += Number(durations[i]) || defaultDur;
  if (totalDuration <= 0) return null;

  const cycleT = ((timeMs / 1000) % totalDuration + totalDuration) % totalDuration;

  let elapsed = 0;
  let fromI = n - 1;
  for (let i = 0; i < n; i++) {
    const dur = Number(durations[i]) || defaultDur;
    if (elapsed + dur > cycleT) { fromI = i; break; }
    elapsed += dur;
  }
  const toI = (fromI + 1) % n;
  const dur = Number(durations[fromI]) || defaultDur;
  const localT = Math.max(0, Math.min(1, (cycleT - elapsed) / dur));
  const st = localT * localT * (3 - 2 * localT);

  const fromPts = poses[fromI].points;
  const toPts   = poses[toI].points;
  return fromPts.map(([fx, fy], i) => {
    const [tx, ty] = toPts[i];
    return [fx + (tx - fx) * st, fy + (ty - fy) * st];
  });
}

/**
 * One-shot interpolation: plays through poses once then holds the last frame.
 * Last pose should be neutral for a clean exit.
 */
function _interpolatePosesOneShot(anim, elapsedMs) {
  const poses = anim.poses;
  const durations = Array.isArray(anim.poseDurations) ? anim.poseDurations : [];
  const n = poses.length;
  const defaultDur = 0.8;
  const elapsedS = elapsedMs / 1000;

  let totalDuration = 0;
  for (let i = 0; i < n; i++) totalDuration += Number(durations[i]) || defaultDur;

  if (elapsedS >= totalDuration) {
    return poses[n - 1].points.map(p => [p[0], p[1]]);
  }

  let accum = 0, fromI = 0;
  for (let i = 0; i < n; i++) {
    const dur = Number(durations[i]) || defaultDur;
    if (accum + dur > elapsedS) { fromI = i; break; }
    accum += dur;
  }
  const toI = Math.min(fromI + 1, n - 1);
  const dur = Number(durations[fromI]) || defaultDur;
  const localT = Math.max(0, Math.min(1, (elapsedS - accum) / dur));
  const st = localT * localT * (3 - 2 * localT);

  const fromPts = poses[fromI].points;
  const toPts   = poses[toI].points;
  return fromPts.map(([fx, fy], i) => {
    const [tx, ty] = toPts[i];
    return [fx + (tx - fx) * st, fy + (ty - fy) * st];
  });
}

window.BreathingComposer = BreathingComposer;

// ── Auto-initialise a shared global composer ─────────────────
// Loaded automatically so callers (bootstrap.js, lobby.js) don't need
// to be modified. renderProfile() in portrait-utils.js falls back to
// window.portraitBreathingComposer when no composer is in renderOptions.
(function _autoInitBreathingComposer() {
  const composer = new BreathingComposer();
  window.portraitBreathingComposer = composer;

  // Derive config base from the portrait-utils or breathing script src,
  // falling back to common paths used in the project.
  function _resolveConfigBase() {
    const candidates = ['./docs/config/', './config/'];
    // Try to mirror whatever loadPortraitCosmetics was last called with.
    const cfgBase = window.SCRATCHBONES_CONFIG?.game?.assets?.portrait?.configBase;
    if (cfgBase) candidates.unshift(cfgBase);
    return candidates[0];
  }

  function _load() {
    composer.load(_resolveConfigBase()).catch(() => {});
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _load, { once: true });
  } else {
    _load();
  }
}());
