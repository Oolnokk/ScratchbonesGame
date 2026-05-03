// ── Verdigris Particle Glow for Trick Bones ──────────────────────────────────
// Renders an animated, fiery particle effect around DOM elements that carry
// the `data-trick-glow` attribute.  The attribute is added by bootstrap.js to
// trick-bone card elements that are currently shown face-up (not flipped).
//
// Color palette: bright white/cyan core → verdigris mid (#43b48c / #27ce8c) →
// dark blue-green edges – giving a "firey" look in the green-teal spectrum.

export function initTrickBoneGlow() {
  // ── Canvas overlay ──────────────────────────────────────────────────────────
  const canvas = document.createElement('canvas');
  canvas.id = 'trickBoneGlowCanvas';
  canvas.setAttribute('aria-hidden', 'true');
  // Sits above cards but below fixed overlays; pointer events pass through.
  canvas.style.cssText =
    'position:absolute;inset:0;pointer-events:none;z-index:9000;';

  const ctx = canvas.getContext('2d', { alpha: true });

  let w = 0, h = 0, appRef = null;

  // ── Particle pool ───────────────────────────────────────────────────────────
  const particles = [];

  // Verdigris palette: [r, g, b] tuples ordered bright → dark.
  const PALETTE = [
    [255, 255, 255],  // 0 – bright white (core)
    [190, 255, 245],  // 1 – pale cyan
    [67,  206, 162],  // 2 – light verdigris
    [67,  180, 140],  // 3 – #43b48c verdigris
    [39,  206, 140],  // 4 – #27ce8c bright verdigris
    [20,  140, 100],  // 5 – deeper verdigris
    [8,   70,  80],   // 6 – dark blue-green edge
  ];

  // ── Particle spawning ───────────────────────────────────────────────────────
  function spawnParticles(cx, cy, cardW, cardH) {
    // Emit a small burst from random points along the card perimeter.
    const count = 3;
    for (let i = 0; i < count; i++) {
      // Bias upward – flame rises.
      const baseAngle = -Math.PI / 2;
      const spread    = Math.PI * 0.75;
      const angle     = baseAngle + (Math.random() - 0.5) * spread;
      const speed     = 0.25 + Math.random() * 0.65;
      const maxLife   = 36 + Math.random() * 28;

      // Spawn from a random point inside / near the card boundary.
      const ox = (Math.random() - 0.5) * cardW * 0.7;
      const oy = (Math.random() - 0.5) * cardH * 0.6;

      particles.push({
        x:           cx + ox,
        y:           cy + oy,
        vx:          Math.cos(angle) * speed * 0.3,
        vy:          Math.sin(angle) * speed,
        life:        maxLife,
        maxLife,
        radius:      2.5 + Math.random() * 4,
        wobble:      Math.random() * Math.PI * 2,
        wobbleSpeed: 1.5 + Math.random() * 2.5,
      });
    }
  }

  // ── Gather trick-bone positions ─────────────────────────────────────────────
  let lastGatherMs = 0;
  let cachedTargets = [];

  function gatherTargets(app) {
    const appRect = app.getBoundingClientRect();
    const result  = [];
    app.querySelectorAll('[data-trick-glow]').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return; // hidden / zero-size
      result.push({
        cx: r.left - appRect.left + r.width  / 2,
        cy: r.top  - appRect.top  + r.height / 2,
        w:  r.width,
        h:  r.height,
      });
    });
    return result;
  }

  // ── Main render loop ────────────────────────────────────────────────────────
  function draw(timeMs) {
    requestAnimationFrame(draw);

    // Lazily find #app and insert canvas when first available.
    if (!appRef) appRef = document.getElementById('app');
    if (!appRef) return;
    if (!canvas.parentElement) appRef.appendChild(canvas);

    // Keep canvas dimensions in sync with #app.
    const appRect = appRef.getBoundingClientRect();
    const rw = Math.round(appRect.width);
    const rh = Math.round(appRect.height);
    if (canvas.width !== rw || canvas.height !== rh) {
      w = canvas.width  = rw;
      h = canvas.height = rh;
    }

    ctx.clearRect(0, 0, w, h);

    // Throttle DOM querying to ~15 fps to match candlelight.js pattern.
    if (timeMs - lastGatherMs > 66) {
      cachedTargets = gatherTargets(appRef);
      lastGatherMs  = timeMs;
    }

    if (cachedTargets.length === 0) return; // nothing to draw

    const t = timeMs / 1000;

    // ── Ambient halo glow ───────────────────────────────────────────────────
    // A soft pulsing radial gradient behind each trick bone.
    for (const tgt of cachedTargets) {
      const glowR = Math.max(tgt.w, tgt.h) * 0.72;
      const pulse = 0.10 + Math.sin(t * 2.1 + tgt.cx * 0.01) * 0.04;

      const grad = ctx.createRadialGradient(
        tgt.cx, tgt.cy, 0,
        tgt.cx, tgt.cy, glowR
      );
      grad.addColorStop(0,    `rgba(140,255,220,${(pulse * 0.55).toFixed(3)})`);
      grad.addColorStop(0.30, `rgba(67,180,140,${(pulse * 0.45).toFixed(3)})`);
      grad.addColorStop(0.65, `rgba(20,100,80,${(pulse * 0.20).toFixed(3)})`);
      grad.addColorStop(1,    'rgba(8,60,80,0)');

      ctx.beginPath();
      ctx.arc(tgt.cx, tgt.cy, glowR, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // ── Spawn particles ─────────────────────────────────────────────────────
    for (const tgt of cachedTargets) {
      spawnParticles(tgt.cx, tgt.cy, tgt.w, tgt.h);
    }

    // ── Update & draw particles ─────────────────────────────────────────────
    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];

      p.life -= 1;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      // Wobble sideways (flame flicker), drift upward.
      p.wobble += p.wobbleSpeed * 0.05;
      p.x      += p.vx + Math.sin(p.wobble) * 0.35;
      p.y      += p.vy;
      p.vy     *= 0.985; // mild drag

      const lifeRatio = p.life / p.maxLife; // 1 → 0 as particle ages

      // Radius shrinks as particle ages.
      const r = p.radius * (0.4 + lifeRatio * 0.6);
      if (r < 0.5) continue;

      // Pick edge palette colour based on age (bright when young → dark edge when old).
      const edgeIdx = Math.min(
        Math.floor((1 - lifeRatio) * (PALETTE.length - 1)),
        PALETTE.length - 1
      );
      const [er, eg, eb] = PALETTE[edgeIdx];

      // Radial gradient: white/cyan core → verdigris mid → dark transparent edge.
      const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r);
      grad.addColorStop(0,    `rgba(220,255,240,${(lifeRatio * 0.95).toFixed(2)})`);
      grad.addColorStop(0.35, `rgba(67,206,162,${(lifeRatio * 0.75).toFixed(2)})`);
      grad.addColorStop(0.70, `rgba(39,180,130,${(lifeRatio * 0.50).toFixed(2)})`);
      grad.addColorStop(1,    `rgba(${er},${eg},${eb},0)`);

      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  // Kick off the animation loop.
  requestAnimationFrame(draw);

  return { canvas };
}
