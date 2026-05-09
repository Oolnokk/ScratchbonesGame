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
//   composer.setBodyOverlay(speciesId, gender, animData, durationMs) triggers
//   a one-shot animation overlay (e.g. a reaction pose) that blends on top of
//   the breathing cycle. Use composer.clearBodyOverlay() to cancel early.
// ============================================================

'use strict';

class BreathingComposer {
  constructor() {
    this._defaultAnim = null;
    this._overrides   = new Map(); // "speciesId:gender" → anim data

    // One-shot emoji body overlay state
    this._overlay = null; // { anim, startMs, durationMs }
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
   * Trigger a one-shot body animation overlay (e.g. for emoji reactions).
   * The overlay blends on top of the breathing cycle for durationMs.
   * animData: same format as breathing animation data.
   */
  setBodyOverlay(speciesId, gender, animData, durationMs) {
    if (!_validateBreathingAnim(animData)) return;
    this._overlay = {
      speciesId: String(speciesId || ''),
      gender:    String(gender    || ''),
      anim:      animData,
      startMs:   Date.now(),
      durationMs: Number(durationMs) || 2000,
    };
  }

  clearBodyOverlay() {
    this._overlay = null;
  }

  // ── Point interpolation ──────────────────────────────────

  /**
   * Returns the interpolated deformed mesh points for the given species/gender
   * at the given time (with optional phase offset for portrait-to-portrait variation).
   * Returns null if no animation data is available.
   */
  getInterpolatedPoints(speciesId, gender, nowMs, phaseOffsetMs) {
    if (!this.enabled) return null;
    const anim = this.getAnimData(speciesId, gender);
    if (!anim) return null;
    const offset = Number(phaseOffsetMs) || 0;
    const breathePts = _interpolatePoses(anim, nowMs + offset);

    // If there is an active overlay for this species+gender, blend it in.
    if (this._overlay) {
      const ol = this._overlay;
      const elapsed = nowMs - ol.startMs;
      if (elapsed >= ol.durationMs) {
        this._overlay = null;
      } else if (ol.speciesId === String(speciesId || '') && ol.gender === String(gender || '')) {
        const olPts = _interpolatePoses(ol.anim, elapsed);
        if (olPts && breathePts) {
          // Blend: overlay fades in then out (triangle envelope)
          const t = elapsed / ol.durationMs;
          const env = t < 0.2 ? t / 0.2 : t > 0.8 ? (1 - t) / 0.2 : 1;
          const neutral = _getNeutralPoints(anim.gridCols, anim.gridRows);
          return breathePts.map(([bx, by], i) => {
            const [nx, ny] = neutral[i];
            const [ox, oy] = olPts[i];
            // Add overlay displacement on top of breathing displacement
            const odx = (ox - nx) * env;
            const ody = (oy - ny) * env;
            return [bx + odx, by + ody];
          });
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
 * Returns interpolated pose points using the same smoothstep technique as the
 * mesh-deformation-author tool's animLoop.
 */
function _interpolatePoses(anim, timeMs) {
  const poses = anim.poses;
  const durations = Array.isArray(anim.poseDurations) ? anim.poseDurations : [];
  const n = poses.length;
  const defaultDur = 0.8;

  // Total cycle in seconds
  let totalDuration = 0;
  for (let i = 0; i < n; i++) totalDuration += Number(durations[i]) || defaultDur;
  if (totalDuration <= 0) return null;

  // Time within the current cycle
  const cycleT = ((timeMs / 1000) % totalDuration + totalDuration) % totalDuration;

  // Find the "from" pose
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
  // Ken Perlin smoothstep: 3t² − 2t³
  const st = localT * localT * (3 - 2 * localT);

  const fromPts = poses[fromI].points;
  const toPts   = poses[toI].points;
  return fromPts.map(([fx, fy], i) => {
    const [tx, ty] = toPts[i];
    return [fx + (tx - fx) * st, fy + (ty - fy) * st];
  });
}

window.BreathingComposer = BreathingComposer;
