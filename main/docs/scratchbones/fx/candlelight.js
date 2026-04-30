  export function initCandleLight({ gameConfig = null, debugLog = null } = {}) {
    const SCRATCHBONES_GAME = gameConfig || window.SCRATCHBONES_CONFIG?.game || {};
    const logCandle = (level, event, payload = {}) => {
      if (typeof debugLog === 'function') debugLog(level, `candlelight.${event}`, payload);
    };
    const APP_REF_W = 1920, APP_REF_H = 1080;
    const candlelightConfig = SCRATCHBONES_GAME.layout?.lighting?.candlelight || {};
    const rawSources = Array.isArray(candlelightConfig.sources) ? candlelightConfig.sources : [];
    const lightSources = (rawSources.length ? rawSources : [
      { xPct: 61 / APP_REF_W, yPct: 360 / APP_REF_H, intensity: 0.77, radiusMultiplier: 1, flickerSpeed: 4.17, turbulence: 1 },
    ]).map((source) => ({
      xPct: Number.isFinite(Number(source?.xPct)) ? Number(source.xPct) : (61 / APP_REF_W),
      yPct: Number.isFinite(Number(source?.yPct)) ? Number(source.yPct) : (360 / APP_REF_H),
      intensity: Math.max(0, Number(source?.intensity) || 0.77),
      radiusMultiplier: Math.max(0, Number(source?.radiusMultiplier) || 1),
      flickerSpeed: Math.max(0.01, Number(source?.flickerSpeed) || 4.17),
      turbulence: Math.max(0, Number(source?.turbulence) || 1),
    }));
    const RADIUS_REF = Math.max(0, Number(candlelightConfig.radiusRefPx) || 1200);
    const thevmenuOpacityConfigValue = Number(candlelightConfig.thevmenuOpacity);
    const THEVMENU_CANDLELIGHT_OPACITY_DEFAULT = Number.isFinite(thevmenuOpacityConfigValue)
      ? clamp(thevmenuOpacityConfigValue, 0, 1)
      : 0.1;
    const thevmenuLayerZIndexConfig = Number(candlelightConfig.thevmenuLayerZIndex);
    const THEVMENU_CANDLELIGHT_LAYER_Z_INDEX = Number.isFinite(thevmenuLayerZIndexConfig)
      ? Math.round(thevmenuLayerZIndexConfig)
      : 2147483646;

    // Shadow height parameters (demo occluder convention)
    const CARD_SHADOW_HEIGHT = 36;
    const COIN_SHADOW_HEIGHT = 11;

    // CSS selectors that identify card and coin <img> elements
    const CARD_IMG_SEL = '.handScroll .cardArt, .tableViewCard img, .seatHandCard img';
    const COIN_IMG_SEL = '.stakeTierBtn img, .stakeAnchor img';

    function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
    function lerp(a, b, t)    { return a + (b - a) * t; }

    function smoothNoise(t) {
      return (
        Math.sin(t * 1.7)         * 0.44 +
        Math.sin(t * 4.9  + 1.8) * 0.31 +
        Math.sin(t * 9.3  + 4.2) * 0.18 +
        Math.sin(t * 17.1 + 0.7) * 0.07
      );
    }

    let w = 0, h = 0, appRef = null;

    // ── Canvas: occluder shadows (mix-blend-mode: multiply) ──────────────────
    // Black silhouettes of the actual card/coin PNGs cast away from the light.
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.id = 'candleShadowCanvas';
    shadowCanvas.setAttribute('aria-hidden', 'true');

    // ── Canvas: darkness / depth vignette (mix-blend-mode: multiply) ────────
    const darkCanvas = document.createElement('canvas');
    darkCanvas.id = 'candleDarknessCanvas';
    darkCanvas.setAttribute('aria-hidden', 'true');

    // ── Canvas: warm glow (mix-blend-mode: screen) ───────────────────────────
    const glowCanvas = document.createElement('canvas');
    glowCanvas.id = 'candleGlowCanvas';
    glowCanvas.setAttribute('aria-hidden', 'true');

    const thevmenuCandlelightCanvas = document.createElement('canvas');
    const thevmenuCandlelightHost = document.createElement('div');
    thevmenuCandlelightHost.id = 'thevmenuCandlelightHost';
    thevmenuCandlelightHost.setAttribute('aria-hidden', 'true');
    thevmenuCandlelightHost.style.position = 'fixed';
    thevmenuCandlelightHost.style.inset = '0';
    thevmenuCandlelightHost.style.pointerEvents = 'none';
    thevmenuCandlelightHost.style.zIndex = String(THEVMENU_CANDLELIGHT_LAYER_Z_INDEX);
    thevmenuCandlelightCanvas.id = 'thevmenuCandlelightLayer';
    thevmenuCandlelightCanvas.setAttribute('aria-hidden', 'true');
    thevmenuCandlelightCanvas.style.opacity = String(THEVMENU_CANDLELIGHT_OPACITY_DEFAULT);
    thevmenuCandlelightCanvas.style.position = 'fixed';
    thevmenuCandlelightCanvas.style.top = '0';
    thevmenuCandlelightCanvas.style.left = '0';
    thevmenuCandlelightCanvas.style.pointerEvents = 'none';
    thevmenuCandlelightCanvas.style.mixBlendMode = 'screen';
    thevmenuCandlelightHost.appendChild(thevmenuCandlelightCanvas);

    const shadowCtx = shadowCanvas.getContext('2d', { alpha: true });
    const darkCtx   = darkCanvas.getContext('2d',   { alpha: true });
    const glowCtx   = glowCanvas.getContext('2d',   { alpha: true });
    const thevmenuGlowCtx = thevmenuCandlelightCanvas.getContext('2d', { alpha: true });

    // Off-screen work buffers
    const workDark    = document.createElement('canvas');
    const workGlow    = document.createElement('canvas');
    const workShadow  = document.createElement('canvas');
    const workBacklit = document.createElement('canvas');
    const wdCtx  = workDark.getContext('2d',    { alpha: true });
    const wgCtx  = workGlow.getContext('2d',    { alpha: true });
    const wsCtx  = workShadow.getContext('2d',  { alpha: true });
    const wbCtx  = workBacklit.getContext('2d', { alpha: true });

    // Silhouette cache: pre-render each unique img.src as a black shape once
    const silhouetteCache = new Map();
    function getSilhouette(img) {
      const key = img.src;
      if (silhouetteCache.has(key)) return silhouetteCache.get(key);
      const nw = img.naturalWidth  || 1;
      const nh = img.naturalHeight || 1;
      const oc = document.createElement('canvas');
      oc.width = nw; oc.height = nh;
      const octx = oc.getContext('2d');
      octx.drawImage(img, 0, 0);
      octx.globalCompositeOperation = 'source-atop';
      octx.fillStyle = '#000';
      octx.fillRect(0, 0, nw, nh);
      silhouetteCache.set(key, oc);
      return oc;
    }

    // Throttled occluder cache (~12 fps gather, 60 fps render)
    let lastGatherMs = 0, cachedOccluders = [];
    function maybeGather(app) {
      const now = performance.now();
      if (now - lastGatherMs < 80) return cachedOccluders;
      lastGatherMs = now;
      cachedOccluders = gatherOccluders(app);
      return cachedOccluders;
    }

    // ── Backlit UI panels ─────────────────────────────────────────────────────
    // Each panel gets its own element-shaped light source: the box IS the core,
    // glow spills from the edges via blur-blit (no hard edge, low desaturation).
    const CANDLELIGHT_ROLE_KEYS = ['container', 'avatar', 'text', 'sub'];
    const candlelightMaskingConfig = candlelightConfig.masking || {};
    const CANDLELIGHT_FALLBACKS = {
      backlitAlphaDefault: 0.14,
      backlitBlurDefault: 0,
      selectorGroups: {
        backlit: {
          container: ['#aiSidebar', '.humanSeatZone', '.turnSpotlight'],
          avatar: ['.seatAvatarBox', '.turnSpotlightAvatar', '.cin-avatar'],
          text: ['.seatName', '.seatMeta', '.seatStatus', '.turnSpotlightNameBar', '.cin-name'],
          sub: ['[data-stake-left-contribution-anchor]', '[data-stake-right-contribution-anchor]', '[data-stake-betting-choice-anchor]', '.stakeTierBtnRow'],
        },
        immuneCapable: {
          container: ['#aiSidebar', '.humanSeatZone', '.turnSpotlight'],
          avatar: ['.seatAvatarBox', '.turnSpotlightAvatar', '.cin-avatar'],
          text: ['.seatName', '.seatMeta', '.seatStatus', '.turnSpotlightNameBar', '.cin-name'],
          sub: ['[data-stake-left-contribution-anchor]', '[data-stake-right-contribution-anchor]', '[data-stake-betting-choice-anchor]', '.stakeTierBtnRow'],
        },
      },
      projectionMappings: {
        'sidebar': {
          container: ['#aiSidebar'],
          avatar: ['#aiSidebar .seatAvatarBox'],
          text: ['#aiSidebar .seatName', '#aiSidebar .seatMeta', '#aiSidebar .seatStatus'],
        },
        'human-seat-zone': {
          container: ['.humanSeatZone'],
          avatar: ['.humanSeatZone .seatAvatarBox'],
          text: ['.humanSeatZone .seatName', '.humanSeatZone .seatMeta', '.humanSeatZone .seatStatus'],
        },
        'turn-spotlight': {
          container: ['.turnSpotlight'],
          avatar: ['.turnSpotlightAvatar'],
          text: ['.turnSpotlightNameBar', '.cin-name'],
        },
        'betting-left-contribution-anchor': { sub: ['[data-stake-left-contribution-anchor]'] },
        'betting-right-contribution-anchor': { sub: ['[data-stake-right-contribution-anchor]'] },
        'betting-choice-anchor': { sub: ['[data-stake-betting-choice-anchor]'] },
        'betting-tier-buttons': { sub: ['.stakeTierBtnRow'] },
        'avatar-*': { sub: ['[data-proj-id="{projId}"]'] },
      },
      selectorDefaults: {},
    };
    const candlelightTargets = candlelightConfig.selectorGroups || candlelightConfig.targets || {};
    const candlelightProjectionRoles = candlelightConfig.projectionMappings || candlelightConfig.projectionRoles || {};
    const candlelightSelectorDefaults = candlelightConfig.selectorDefaults && typeof candlelightConfig.selectorDefaults === 'object'
      ? candlelightConfig.selectorDefaults
      : CANDLELIGHT_FALLBACKS.selectorDefaults;
    const candlelightFallbackNotices = new Set();
    function warnCandlelightFallbackOnce(key, fallbackValue) {
      if (candlelightFallbackNotices.has(key)) return;
      candlelightFallbackNotices.add(key);
      console.warn(`[CandleLight] Missing config "${key}" in docs/config/scratchbones-config.js. Using fallback.`, fallbackValue);
      logCandle('warn', 'config-fallback', { key, fallbackValue });
    }
    if (!Number.isFinite(Number(candlelightConfig.backlitAlphaDefault))) {
      warnCandlelightFallbackOnce('layout.lighting.candlelight.backlitAlphaDefault', CANDLELIGHT_FALLBACKS.backlitAlphaDefault);
    }
    if (!Number.isFinite(Number(candlelightConfig.backlitBlurDefault))) {
      warnCandlelightFallbackOnce('layout.lighting.candlelight.backlitBlurDefault', CANDLELIGHT_FALLBACKS.backlitBlurDefault);
    }
    if (!candlelightConfig.selectorGroups && !candlelightConfig.targets) {
      warnCandlelightFallbackOnce('layout.lighting.candlelight.selectorGroups', CANDLELIGHT_FALLBACKS.selectorGroups);
    }
    if (!candlelightConfig.projectionMappings && !candlelightConfig.projectionRoles) {
      warnCandlelightFallbackOnce('layout.lighting.candlelight.projectionMappings', CANDLELIGHT_FALLBACKS.projectionMappings);
    }
    const LEGACY_PROJ_ID_TO_BACKLIT = {
      'sidebar': '#aiSidebar',
      'human-seat-zone': '.humanSeatZone',
      'turn-spotlight': '.turnSpotlight',
    };
    function normalizeSelectorArray(value) {
      if (Array.isArray(value)) return value.filter(v => typeof v === 'string' && v.trim()).map(v => v.trim());
      if (typeof value === 'string' && value.trim()) return [value.trim()];
      return [];
    }
    function flattenTargetSelectors(targetGroup) {
      if (!targetGroup || typeof targetGroup !== 'object') return [];
      if (Array.isArray(targetGroup)) return normalizeSelectorArray(targetGroup);
      return CANDLELIGHT_ROLE_KEYS.flatMap(role => normalizeSelectorArray(targetGroup[role]));
    }
    function uniqSelectors(selectors) {
      return Array.from(new Set(normalizeSelectorArray(selectors)));
    }
    function matchesProjPattern(pattern, projId) {
      if (typeof pattern !== 'string' || typeof projId !== 'string') return false;
      return pattern.endsWith('*') ? projId.startsWith(pattern.slice(0, -1)) : pattern === projId;
    }
    function applyProjectionSelectorTemplate(selector, projId) {
      return String(selector || '').replaceAll('{projId}', projId || '');
    }
    function getProjectionRoleSelectors(projId, role = 'container') {
      const roleSelectors = [];
      for (const [pattern, byRole] of Object.entries(candlelightProjectionRoles || {})) {
        if (!matchesProjPattern(pattern, projId)) continue;
        normalizeSelectorArray(byRole?.[role]).forEach(sel => {
          roleSelectors.push(applyProjectionSelectorTemplate(sel, projId));
        });
      }
      const deduped = uniqSelectors(roleSelectors);
      if (deduped.length) return deduped;
      if (role !== 'container') return [];
      const legacySelector = LEGACY_PROJ_ID_TO_BACKLIT[projId];
      return legacySelector ? [legacySelector] : [];
    }
    const selectorGroups = {
      backlit: candlelightTargets.backlit || CANDLELIGHT_FALLBACKS.selectorGroups.backlit,
      immuneCapable: candlelightTargets.immuneCapable || CANDLELIGHT_FALLBACKS.selectorGroups.immuneCapable,
    };
    const BACKLIT_SELECTORS = uniqSelectors([
      ...flattenTargetSelectors(selectorGroups.backlit),
      ...Object.values(LEGACY_PROJ_ID_TO_BACKLIT),
    ]);
    const IMMUNE_CAPABLE_SELECTORS = uniqSelectors([
      ...flattenTargetSelectors(selectorGroups.immuneCapable),
      ...BACKLIT_SELECTORS,
    ]);
    const BACKLIT_SELECTOR_SET = new Set(BACKLIT_SELECTORS);
    const IMMUNE_CAPABLE_SELECTOR_SET = new Set(IMMUNE_CAPABLE_SELECTORS);
    const CANDLE_SELECTOR_ROLES = new Map();
    function registerSelectorRoles(targetGroup) {
      if (!targetGroup || typeof targetGroup !== 'object') return;
      CANDLELIGHT_ROLE_KEYS.forEach(role => {
        normalizeSelectorArray(targetGroup[role]).forEach(sel => {
          if (!CANDLE_SELECTOR_ROLES.has(sel)) CANDLE_SELECTOR_ROLES.set(sel, role);
        });
      });
    }
    registerSelectorRoles(selectorGroups.backlit);
    registerSelectorRoles(selectorGroups.immuneCapable);
    BACKLIT_SELECTORS.forEach(sel => {
      if (!CANDLE_SELECTOR_ROLES.has(sel)) CANDLE_SELECTOR_ROLES.set(sel, 'container');
    });
    const PROJ_ID_TO_BACKLIT = Object.fromEntries(
      Object.keys(LEGACY_PROJ_ID_TO_BACKLIT).map(projId => [projId, getProjectionRoleSelectors(projId, 'container')[0] || LEGACY_PROJ_ID_TO_BACKLIT[projId]])
    );
    // Mutable runtime parameters (exposed on window.__candleLight for the UI)
    let BACKLIT_ALPHA = clamp(Number(candlelightConfig.backlitAlphaDefault), 0, 1);
    if (!Number.isFinite(BACKLIT_ALPHA)) BACKLIT_ALPHA = CANDLELIGHT_FALLBACKS.backlitAlphaDefault;
    let BACKLIT_BLUR = Math.max(0, Number(candlelightConfig.backlitBlurDefault));
    if (!Number.isFinite(BACKLIT_BLUR)) BACKLIT_BLUR = CANDLELIGHT_FALLBACKS.backlitBlurDefault;
    let THEVMENU_CANDLELIGHT_OPACITY = THEVMENU_CANDLELIGHT_OPACITY_DEFAULT;
    // Per-selector state
    const TRACKED_CANDLE_SELECTORS = uniqSelectors([
      ...BACKLIT_SELECTORS,
      ...IMMUNE_CAPABLE_SELECTORS,
      ...Object.keys(candlelightSelectorDefaults),
      ...Object.values(candlelightProjectionRoles).flatMap(entry => flattenTargetSelectors(entry)),
    ]);
    const backlitState = new Map(TRACKED_CANDLE_SELECTORS.map(s => {
      const cfg = candlelightSelectorDefaults[s] || {};
      return [s, {
        backlit: cfg.backlit !== false,
        immune: cfg.immune === true,
      }];
    }));
    const IMMUNE_GATHER_CADENCE_MS = Math.max(16, Number(candlelightMaskingConfig.gatherCadenceMs) || 100);
    const IMMUNE_TEXT_MASK_PADDING_PX = Math.max(0, Number(candlelightMaskingConfig.textMaskPaddingPx) || 1);
    let DEBUG_IMMUNE_MASKS = Boolean(candlelightMaskingConfig.debugImmuneMasks);
    const immuneMaskCache = new Map();
    let lastBacklitMs = 0, cachedBacklit = [], cachedImmune = [];
    function fastHash(text) {
      let hash = 2166136261;
      for (let i = 0; i < text.length; i++) {
        hash ^= text.charCodeAt(i);
        hash = Math.imul(hash, 16777619);
      }
      return (hash >>> 0).toString(16);
    }
    function parseRadiusPx(value) {
      const n = Number.parseFloat(value);
      return Number.isFinite(n) ? n : 0;
    }
    function getBorderRadiusMeta(style) {
      const tl = parseRadiusPx(style.borderTopLeftRadius);
      const tr = parseRadiusPx(style.borderTopRightRadius);
      const br = parseRadiusPx(style.borderBottomRightRadius);
      const bl = parseRadiusPx(style.borderBottomLeftRadius);
      return { tl, tr, br, bl, max: Math.max(tl, tr, br, bl) };
    }
    function classifyImmuneElement(el, role) {
      if (!el) return 'unknown';
      const tag = (el.tagName || '').toLowerCase();
      if (role === 'text') return 'text';
      if (tag === 'img' || tag === 'canvas' || role === 'avatar') {
        if (tag === 'img' || tag === 'canvas') return 'avatar-visual';
        if (el.querySelector('img,canvas')) return 'avatar-visual';
        return 'avatar-container';
      }
      if (el.querySelector && !el.querySelector('img,canvas') && ((el.textContent || '').trim().length > 0)) return 'text';
      return 'unknown';
    }
    function buildTextMask(meta) {
      const txt = (meta.element?.innerText || meta.element?.textContent || '').trim();
      if (!txt) return null;
      const c = document.createElement('canvas');
      const cw = Math.max(1, Math.ceil(meta.rect.w));
      const ch = Math.max(1, Math.ceil(meta.rect.h));
      c.width = cw;
      c.height = ch;
      const cctx = c.getContext('2d', { alpha: true });
      cctx.clearRect(0, 0, cw, ch);
      cctx.font = meta.computedStyle.font || `${meta.computedStyle.fontSize} ${meta.computedStyle.fontFamily}`;
      cctx.textAlign = meta.computedStyle.textAlign === 'center' ? 'center' : (meta.computedStyle.textAlign === 'right' || meta.computedStyle.textAlign === 'end' ? 'right' : 'left');
      cctx.textBaseline = 'top';
      cctx.direction = meta.computedStyle.direction || 'ltr';
      cctx.fillStyle = '#000';
      const lines = txt.split('\n').map(s => s.trim()).filter(Boolean);
      const lineHeight = parseRadiusPx(meta.computedStyle.lineHeight) || (parseRadiusPx(meta.computedStyle.fontSize) * 1.2) || 16;
      const anchorX = cctx.textAlign === 'center' ? cw * 0.5 : (cctx.textAlign === 'right' ? cw - IMMUNE_TEXT_MASK_PADDING_PX : IMMUNE_TEXT_MASK_PADDING_PX);
      lines.forEach((line, idx) => {
        cctx.fillText(line, anchorX, IMMUNE_TEXT_MASK_PADDING_PX + idx * lineHeight);
      });
      return c;
    }
    function buildVisualMask(meta) {
      const source = meta.element?.tagName?.toLowerCase() === 'img'
        ? meta.element
        : meta.element?.tagName?.toLowerCase() === 'canvas'
          ? meta.element
          : meta.element?.querySelector('img,canvas');
      if (!source) return null;
      const sw = Math.max(1, Math.ceil(meta.rect.w));
      const sh = Math.max(1, Math.ceil(meta.rect.h));
      const c = document.createElement('canvas');
      c.width = sw;
      c.height = sh;
      const cctx = c.getContext('2d', { alpha: true });
      cctx.clearRect(0, 0, sw, sh);
      try {
        cctx.drawImage(source, 0, 0, sw, sh);
      } catch (_) {
        return null;
      }
      cctx.globalCompositeOperation = 'source-in';
      cctx.fillStyle = '#000';
      cctx.fillRect(0, 0, sw, sh);
      cctx.globalCompositeOperation = 'source-over';
      return c;
    }
    function getImmuneMaskForMeta(meta) {
      const sig = meta.signature;
      if (immuneMaskCache.has(sig)) return immuneMaskCache.get(sig);
      let maskCanvas = null;
      if (meta.type === 'avatar-visual') maskCanvas = buildVisualMask(meta);
      else if (meta.type === 'text') maskCanvas = buildTextMask(meta);
      const payload = { type: meta.type, maskCanvas };
      immuneMaskCache.set(sig, payload);
      return payload;
    }
    function addRoundedRectPath(ctx, x, y, w, h, radii) {
      const maxR = Math.min(w, h) * 0.5;
      const tl = Math.min(radii.tl || 0, maxR);
      const tr = Math.min(radii.tr || 0, maxR);
      const br = Math.min(radii.br || 0, maxR);
      const bl = Math.min(radii.bl || 0, maxR);
      ctx.beginPath();
      ctx.moveTo(x + tl, y);
      ctx.lineTo(x + w - tr, y);
      ctx.quadraticCurveTo(x + w, y, x + w, y + tr);
      ctx.lineTo(x + w, y + h - br);
      ctx.quadraticCurveTo(x + w, y + h, x + w - br, y + h);
      ctx.lineTo(x + bl, y + h);
      ctx.quadraticCurveTo(x, y + h, x, y + h - bl);
      ctx.lineTo(x, y + tl);
      ctx.quadraticCurveTo(x, y, x + tl, y);
      ctx.closePath();
    }
    function getCandleSelectors(targetOrProjId, role) {
      if (Array.isArray(targetOrProjId)) return uniqSelectors(targetOrProjId);
      if (targetOrProjId && typeof targetOrProjId === 'object') {
        const objectRole = typeof targetOrProjId.role === 'string' ? targetOrProjId.role : role;
        const objectProj = targetOrProjId.projId || targetOrProjId.projectionId;
        if (objectProj) return getProjectionRoleSelectors(objectProj, objectRole || 'container');
        if (Array.isArray(targetOrProjId.selectors)) return uniqSelectors(targetOrProjId.selectors);
      }
      if (typeof targetOrProjId !== 'string') return [];
      const str = targetOrProjId.trim();
      if (!str) return [];
      if (role) return getProjectionRoleSelectors(str, role);
      if (str.includes('.') || str.includes('#') || str.includes('[') || str.includes(':') || str.includes(' ')) return [str];
      const mapped = getProjectionRoleSelectors(str, 'container');
      return mapped.length ? mapped : [str];
    }
    function setCandleState(targetOrProjId, roleOrOn, maybeOn, field) {
      const role = typeof roleOrOn === 'string' ? roleOrOn : null;
      const on = role ? maybeOn : roleOrOn;
      if (typeof on !== 'boolean') return;
      const selectors = getCandleSelectors(targetOrProjId, role || undefined);
      selectors.forEach(sel => {
        if (!sel) return;
        if (!backlitState.has(sel)) {
          TRACKED_CANDLE_SELECTORS.push(sel);
          backlitState.set(sel, { backlit: true, immune: false });
        }
        const state = backlitState.get(sel);
        if (!state) return;
        if (field === 'immune' && !IMMUNE_CAPABLE_SELECTOR_SET.has(sel) && !role) return;
        if (field === 'immune') IMMUNE_CAPABLE_SELECTOR_SET.add(sel);
        if (field === 'backlit') BACKLIT_SELECTOR_SET.add(sel);
        state[field] = on;
      });
      lastBacklitMs = 0;
    }
    function maybeGatherBacklit(app) {
      const now = performance.now();
      if (now - lastBacklitMs < IMMUNE_GATHER_CADENCE_MS) return;
      lastBacklitMs = now;
      const ar = app.getBoundingClientRect();
      const seenImmuneSignatures = new Set();
      cachedBacklit = []; cachedImmune = [];
      for (const sel of TRACKED_CANDLE_SELECTORS) {
        const st = backlitState.get(sel);
        const role = CANDLE_SELECTOR_ROLES.get(sel) || 'container';
        const elements = app.querySelectorAll(sel);
        if (!elements.length) continue;
        elements.forEach(el => {
          if (!el || el.hidden) return;
          const r = el.getBoundingClientRect();
          if (r.width < 1 || r.height < 1) return;
          const style = getComputedStyle(el);
          const rect = { x: r.left - ar.left, y: r.top - ar.top, w: r.width, h: r.height };
          if (st?.immune) {
            const borderRadius = getBorderRadiusMeta(style);
            const type = classifyImmuneElement(el, role);
            const textHash = type === 'text' ? fastHash((el.innerText || el.textContent || '').trim()) : '';
            const src = (el.currentSrc || el.src || el.querySelector?.('img')?.currentSrc || '');
            const signature = [
              sel,
              role,
              type,
              Math.round(rect.w),
              Math.round(rect.h),
              borderRadius.tl, borderRadius.tr, borderRadius.br, borderRadius.bl,
              textHash,
              src
            ].join('|');
            seenImmuneSignatures.add(signature);
            cachedImmune.push({
              selector: sel,
              role,
              element: el,
              rect,
              borderRadius,
              computedStyle: style,
              styleSignature: `${style.font}|${style.textAlign}|${style.direction}|${style.lineHeight}`,
              type,
              textHash,
              signature
            });
            return;
          }
          if (BACKLIT_SELECTOR_SET.has(sel) && st?.backlit !== false) cachedBacklit.push(rect);
        });
      }
      if (immuneMaskCache.size) {
        for (const key of immuneMaskCache.keys()) {
          if (!seenImmuneSignatures.has(key)) immuneMaskCache.delete(key);
        }
      }
    }

    // Punch out immune element masks from any canvas (destination-out erase).
    function punchOutImmune(ctx) {
      if (!cachedImmune.length) return;
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = '#000';
      for (const immune of cachedImmune) {
        const { rect, borderRadius, type } = immune;
        if (type === 'avatar-container' && borderRadius.max > 0) {
          addRoundedRectPath(ctx, rect.x, rect.y, rect.w, rect.h, borderRadius);
          ctx.fill();
          continue;
        }
        if (type === 'avatar-visual' || type === 'text') {
          const mask = getImmuneMaskForMeta(immune);
          if (mask?.maskCanvas) {
            ctx.drawImage(mask.maskCanvas, rect.x, rect.y, rect.w, rect.h);
            continue;
          }
        }
        ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
      }
      ctx.restore();
    }
    function drawImmuneDebugOverlay(ctx) {
      if (!DEBUG_IMMUNE_MASKS || !cachedImmune.length) return;
      ctx.save();
      ctx.globalCompositeOperation = 'source-over';
      cachedImmune.forEach(immune => {
        const { rect, type } = immune;
        ctx.strokeStyle = type === 'text' ? 'rgba(80,180,255,0.9)' : (type === 'avatar-visual' ? 'rgba(120,255,120,0.9)' : 'rgba(255,120,120,0.9)');
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
      });
      ctx.restore();
    }

    // Draw all backlit panels: fill to workBacklit, blit with blur → glow canvas.
    // Blur spreads the fill outward, naturally softening the edges with no hard
    // boundary. Saturated amber (not near-white) keeps desaturation minimal.
    function drawBacklitPanels(ctx) {
      if (!cachedBacklit.length) return;
      for (const b of cachedBacklit) {
        wbCtx.clearRect(0, 0, w, h);
        wbCtx.fillStyle = 'rgba(255, 168, 60, 1)';
        wbCtx.fillRect(b.x, b.y, b.w, b.h);
        const blurR = BACKLIT_BLUR > 0 ? BACKLIT_BLUR : Math.min(b.w, b.h) * 0.35;
        ctx.save();
        ctx.globalAlpha = BACKLIT_ALPHA;
        ctx.filter = `blur(${blurR.toFixed(1)}px)`;
        ctx.drawImage(workBacklit, 0, 0);
        ctx.filter = 'none';
        ctx.restore();
      }
    }

    function resize(app) {
      const rect = app.getBoundingClientRect();
      w = Math.max(1, Math.round(rect.width));
      h = Math.max(1, Math.round(rect.height));
      const dpr = Math.min(devicePixelRatio || 1, 2);
      for (const cv of [shadowCanvas, darkCanvas, glowCanvas, thevmenuCandlelightCanvas]) {
        cv.width  = w * dpr;
        cv.height = h * dpr;
        cv.style.width  = w + 'px';
        cv.style.height = h + 'px';
      }
      shadowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      darkCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      glowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      thevmenuGlowCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
      workDark.width    = w; workDark.height    = h;
      workGlow.width    = w; workGlow.height    = h;
      workShadow.width  = w; workShadow.height  = h;
      workBacklit.width = w; workBacklit.height = h;
      syncThevmenuLayerGeometry(app);
    }

    function syncThevmenuLayerGeometry(app) {
      const rect = app.getBoundingClientRect();
      thevmenuCandlelightCanvas.style.left = `${rect.left}px`;
      thevmenuCandlelightCanvas.style.top = `${rect.top}px`;
      thevmenuCandlelightCanvas.style.width = `${rect.width}px`;
      thevmenuCandlelightCanvas.style.height = `${rect.height}px`;
    }

    function ensureInApp(app) {
      // Append in order: shadow first (deepest), then dark, then glow (topmost)
      if (shadowCanvas.parentNode !== app) app.appendChild(shadowCanvas);
      if (darkCanvas.parentNode   !== app) app.appendChild(darkCanvas);
      if (glowCanvas.parentNode   !== app) app.appendChild(glowCanvas);
      if (thevmenuCandlelightHost.parentNode !== document.body) document.body.appendChild(thevmenuCandlelightHost);
      if (thevmenuCandlelightCanvas.parentNode !== thevmenuCandlelightHost) thevmenuCandlelightHost.appendChild(thevmenuCandlelightCanvas);
      syncThevmenuLayerGeometry(app);
    }

    // ── Occluder gathering ────────────────────────────────────────────────────
    // Query every card/coin <img> that is loaded and visible, return lightweight
    // objects holding their center position and dimensions relative to #app.
    function gatherOccluders(app) {
      const appRect = app.getBoundingClientRect();
      const occluders = [];

      function addImgs(selector, shadowHeight) {
        app.querySelectorAll(selector).forEach(img => {
          if (!img.complete || !img.naturalWidth) return;
          const r = img.getBoundingClientRect();
          if (r.width < 2 || r.height < 2) return;
          occluders.push({
            img,
            cx: r.left - appRect.left + r.width  * 0.5,
            cy: r.top  - appRect.top  + r.height * 0.5,
            iw: r.width,
            ih: r.height,
            sh: shadowHeight
          });
        });
      }

      addImgs(CARD_IMG_SEL, CARD_SHADOW_HEIGHT);
      addImgs(COIN_IMG_SEL, COIN_SHADOW_HEIGHT);

      // Card lerp clones live on document.body — include their shadows too
      document.querySelectorAll('[data-candle-lerp-clone]').forEach(el => {
        if (!el.complete || !el.naturalWidth) return;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        occluders.push({
          img: el,
          cx:  r.left - appRect.left + r.width  * 0.5,
          cy:  r.top  - appRect.top  + r.height * 0.5,
          iw:  r.width,
          ih:  r.height,
          sh:  CARD_SHADOW_HEIGHT,
        });
      });

      return occluders;
    }

    // ── Shadow drawing ────────────────────────────────────────────────────────
    // Steps rendered to workShadow with NO per-step blur; a single blur blit
    // to shadowCtx replaces the old per-step brightness(0)+blur filter chain.
    function drawOccluderShadows(lx, ly, intensity, occluders) {
      wsCtx.clearRect(0, 0, w, h);

      occluders.forEach(occ => {
        const sil = getSilhouette(occ.img);
        if (!sil || !sil.width || !sil.height) return;

        const dx   = occ.cx - lx;
        const dy   = occ.cy - ly;
        const dist = Math.hypot(dx, dy) || 1;
        const dirX = dx / dist;
        const dirY = dy / dist;

        const shadowLength = occ.sh * 1.35;
        const spread    = 1 + occ.sh * 0.0022;
        const baseAlpha = clamp(0.34 + intensity * 0.22, 0.15, 0.72);
        // Scale silhouette canvas coords → screen coords
        const sx = occ.iw / sil.width;
        const sy = occ.ih / sil.height;

        for (let step = 1; step <= 4; step++) {
          const t = step / 4;
          wsCtx.save();
          wsCtx.globalAlpha = baseAlpha * Math.pow(1 - t + 0.02, 1.35);
          wsCtx.translate(
            occ.cx + dirX * shadowLength * t,
            occ.cy + dirY * shadowLength * t
          );
          wsCtx.scale(
            (1 + t * (spread - 1) * 0.85) * sx,
            (1 + t * (spread - 1))        * sy
          );
          wsCtx.drawImage(sil, -sil.width * 0.5, -sil.height * 0.5);
          wsCtx.restore();
        }
      });

      // workShadow holds unblurred steps; caller blits with clip + blur
    }

    function draw(time) {
      requestAnimationFrame(ms => draw(ms / 1000));
      if (!w || !h || !appRef) return;

      // Scale radius to match the current #app height vs reference
      const baseRadius = RADIUS_REF * (h / APP_REF_H);
      const lights = lightSources.map((source) => {
        const noise = smoothNoise(time * source.flickerSpeed);
        const qp = Math.sin(time * 31.0) * 0.025;
        const flick = clamp(1 + noise * 0.16 * source.turbulence + qp, 0.72, 1.28);
        const driftX = Math.sin(time * 2.2) * 16 * source.turbulence + noise * 10 * source.turbulence;
        const driftY = Math.cos(time * 2.9) * 10 * source.turbulence;
        const lx = source.xPct * w + driftX;
        const ly = source.yPct * h - 12 + driftY;
        const pulse = clamp(0.86 + (flick - 1) * 0.8, 0.68, 1.18);
        return {
          lx,
          ly,
          radius: baseRadius * source.radiusMultiplier,
          alpha: clamp(0.5 * source.intensity * pulse, 0.08, 1.25),
          shadowIntensity: source.intensity * pulse,
          pulse,
          flick,
          turbulence: source.turbulence,
        };
      });
      const primaryLight = lights[0];

      // Gather backlit panel rects (~10 fps)
      maybeGatherBacklit(appRef);

      // ── Shadow layer ────────────────────────────────────────────────────────
      const occluders = maybeGather(appRef);
      drawOccluderShadows(primaryLight.lx, primaryLight.ly, primaryLight.shadowIntensity, occluders);
      shadowCtx.clearRect(0, 0, w, h);
      shadowCtx.filter = 'blur(3px)';
      shadowCtx.drawImage(workShadow, 0, 0);
      shadowCtx.filter = 'none';
      punchOutImmune(shadowCtx);

      // ── Darkness layer ─────────────────────────────────────────────────────
      wdCtx.clearRect(0, 0, w, h);
      const dg = wdCtx.createRadialGradient(primaryLight.lx, primaryLight.ly, 0, primaryLight.lx, primaryLight.ly, primaryLight.radius * 1.45);
      dg.addColorStop(0,    `rgba(255, 200, 100, ${0.04 * primaryLight.flick})`);
      dg.addColorStop(0.18, 'rgba(200, 140, 60, 0.18)');
      dg.addColorStop(0.40, 'rgba(60, 36, 14, 0.54)');
      dg.addColorStop(0.68, 'rgba(16, 10, 4, 0.76)');
      dg.addColorStop(1,    'rgba(6, 3, 1, 0.88)');
      wdCtx.fillStyle = dg;
      wdCtx.fillRect(0, 0, w, h);
      darkCtx.clearRect(0, 0, w, h);
      darkCtx.drawImage(workDark, 0, 0);
      punchOutImmune(darkCtx);

      // ── Glow layer ─────────────────────────────────────────────────────────
      wgCtx.clearRect(0, 0, w, h);
      wgCtx.globalCompositeOperation = 'source-over';

      lights.forEach((light) => {
        wgCtx.save();
        wgCtx.translate(light.lx, light.ly + light.radius * 0.12);
        wgCtx.scale(1.12, 0.72);
        const gg = wgCtx.createRadialGradient(0, 0, 0, 0, 0, light.radius);
        gg.addColorStop(0,    `rgba(255, 223, 136, ${light.alpha})`);
        gg.addColorStop(0.14, `rgba(255, 223, 136, ${light.alpha})`);
        gg.addColorStop(0.55, `rgba(255, 166, 54, ${light.alpha * 0.5})`);
        gg.addColorStop(1,    'rgba(255, 120, 16, 0)');
        wgCtx.fillStyle = gg;
        wgCtx.beginPath();
        wgCtx.arc(0, 0, light.radius, 0, Math.PI * 2);
        wgCtx.fill();
        wgCtx.restore();
        const cg = wgCtx.createRadialGradient(light.lx, light.ly - 18, 0, light.lx, light.ly - 18, light.radius * 0.07);
        cg.addColorStop(0, `rgba(255, 248, 200, ${light.alpha * 0.9})`);
        cg.addColorStop(1, 'rgba(255, 145, 32, 0)');
        wgCtx.fillStyle = cg;
        wgCtx.beginPath();
        wgCtx.arc(light.lx, light.ly - 18, light.radius * 0.07, 0, Math.PI * 2);
        wgCtx.fill();
        wgCtx.globalCompositeOperation = 'screen';
        wgCtx.lineWidth = 1;
        for (let i = 0; i < 14; i++) {
          const ang = (i / 14) * Math.PI * 2 + Math.sin(time + i) * 0.08;
          const len = light.radius * (0.42 + (i % 4) * 0.055);
          const start = 34 + (i % 3) * 10;
          const wobble = Math.sin(time * (2.1 + i * 0.13) + i) * 18 * light.turbulence;
          const x1 = light.lx + Math.cos(ang) * start + wobble;
          const y1 = light.ly + Math.sin(ang) * start * 0.64;
          const x2 = light.lx + Math.cos(ang) * len + wobble * 0.45;
          const y2 = light.ly + Math.sin(ang) * len * 0.64;
          const sg = wgCtx.createLinearGradient(x1, y1, x2, y2);
          sg.addColorStop(0, `rgba(255, 221, 140, ${light.alpha * 0.11})`);
          sg.addColorStop(1, 'rgba(255, 130, 28, 0)');
          wgCtx.strokeStyle = sg;
          wgCtx.beginPath();
          wgCtx.moveTo(x1, y1);
          wgCtx.lineTo(x2, y2);
          wgCtx.stroke();
        }
      });

      // Backlit panels — element-shaped amber glow, soft blur edges
      wgCtx.globalCompositeOperation = 'source-over';
      drawBacklitPanels(wgCtx);

      glowCtx.clearRect(0, 0, w, h);
      glowCtx.drawImage(workGlow, 0, 0);
      punchOutImmune(glowCtx);
      drawImmuneDebugOverlay(glowCtx);

      thevmenuGlowCtx.clearRect(0, 0, w, h);
      thevmenuGlowCtx.drawImage(glowCanvas, 0, 0);

      // ── Lerp clone lighting ─────────────────────────────────────────────────
      // Clones on document.body get a CSS filter that approximates their position
      // in the candlelight (dark + warm near source, dim + cool far from it).
      const ar = appRef.getBoundingClientRect();
      document.querySelectorAll('[data-candle-lerp-clone]').forEach(el => {
        const r  = el.getBoundingClientRect();
        const cx = r.left + r.width  * 0.5 - ar.left;
        const cy = r.top  + r.height * 0.5 - ar.top;
        const falloff = Math.max(0, 1 - Math.hypot(cx - primaryLight.lx, cy - primaryLight.ly) / primaryLight.radius);
        el.style.filter =
          `brightness(${(0.28 + falloff * 0.72 * primaryLight.pulse).toFixed(3)})` +
          ` sepia(${(falloff * 0.5).toFixed(3)})`;
      });
    }

    function start() {
      const app = document.getElementById('app');
      if (!app) {
        logCandle('debug', 'app-missing-retry');
        setTimeout(start, 80);
        return;
      }
      appRef = app;
      logCandle('debug', 'start', {
        trackedSelectors: TRACKED_CANDLE_SELECTORS.length,
        backlitSelectors: BACKLIT_SELECTORS.length,
      });

      resize(app);
      ensureInApp(app);

      new ResizeObserver(() => resize(app)).observe(app);

      // Re-inject canvases each time app.innerHTML is replaced
      new MutationObserver(() => ensureInApp(app)).observe(app, { childList: true });

      requestAnimationFrame(ms => draw(ms / 1000));
    }

    // ── Public API (used by the Vars panel controls) ──────────────────────────
    window.__candleLight = {
      get backlitAlpha()   { return BACKLIT_ALPHA; },
      set backlitAlpha(v)  { BACKLIT_ALPHA = clamp(Number(v) || 0, 0, 1); },
      get backlitBlur()    { return BACKLIT_BLUR; },
      set backlitBlur(v)   { BACKLIT_BLUR = Math.max(0, Number(v) || 0); },
      get backlitAlphaDefault() {
        const value = Number(candlelightConfig.backlitAlphaDefault);
        return Number.isFinite(value) ? clamp(value, 0, 1) : CANDLELIGHT_FALLBACKS.backlitAlphaDefault;
      },
      get backlitBlurDefault() {
        const value = Number(candlelightConfig.backlitBlurDefault);
        return Number.isFinite(value) ? Math.max(0, value) : CANDLELIGHT_FALLBACKS.backlitBlurDefault;
      },
      get thevmenuOpacity() { return THEVMENU_CANDLELIGHT_OPACITY; },
      set thevmenuOpacity(v) {
        THEVMENU_CANDLELIGHT_OPACITY = clamp(Number(v) || 0, 0, 1);
        thevmenuCandlelightCanvas.style.opacity = String(THEVMENU_CANDLELIGHT_OPACITY);
      },
      get thevmenuOpacityDefault() { return THEVMENU_CANDLELIGHT_OPACITY_DEFAULT; },
      get debugImmuneMasks()  { return DEBUG_IMMUNE_MASKS; },
      set debugImmuneMasks(v) { DEBUG_IMMUNE_MASKS = Boolean(v); },
      resolveSelectors(targetOrProjId, role) { return getCandleSelectors(targetOrProjId, role); },
      getState(sel)        { return backlitState.get(sel); },
      getStates(targetOrProjId, role) {
        const selectors = getCandleSelectors(targetOrProjId, role);
        return selectors.map(sel => ({ selector: sel, state: backlitState.get(sel) || null }));
      },
      setBacklit(targetOrProjId, roleOrOn, maybeOn) { setCandleState(targetOrProjId, roleOrOn, maybeOn, 'backlit'); },
      setImmune(targetOrProjId, roleOrOn, maybeOn)  { setCandleState(targetOrProjId, roleOrOn, maybeOn, 'immune'); },
      setProjectionImmune(projId, on, role = 'sub') { setCandleState({ projId, role }, Boolean(on), undefined, 'immune'); },
      selectors:           BACKLIT_SELECTORS,
      trackedSelectors:    TRACKED_CANDLE_SELECTORS,
      selectorGroups:      selectorGroups,
      selectorDefaults:    candlelightSelectorDefaults,
      projIdMap:           PROJ_ID_TO_BACKLIT,
      projectionRoles:     candlelightProjectionRoles,
    };

    // ── Candlelight controls in the Vars panel ────────────────────────────────
    function initCandleLightControls() {
      const panelBody = document.getElementById('projVarPanelBody');
      const panelTitle = document.getElementById('projVarPanelTitle');
      if (!panelBody || !panelTitle) return;

      function getSelectedSel() {
        const txt = panelTitle.textContent || '';
        const sep = txt.indexOf(' · ');
        const projId = sep >= 0 ? txt.slice(sep + 3).trim() : null;
        if (!projId) return null;
        const selectedSourceEl = document.querySelector(`[data-proj-id="${projId}"]`);
        if (selectedSourceEl) {
          for (const role of CANDLELIGHT_ROLE_KEYS) {
            const roleSelectors = getProjectionRoleSelectors(projId, role);
            for (const selector of roleSelectors) {
              if (selectedSourceEl.matches(selector) || selectedSourceEl.closest(selector)) return selector;
            }
            if (role === 'sub' && roleSelectors.length) return roleSelectors[0];
          }
        }
        return window.__candleLight.projIdMap[projId] || null;
      }

      function buildSection() {
        const sel = getSelectedSel();
        const st  = sel ? window.__candleLight.getState(sel) : null;
        const sec = document.createElement('div');
        sec.className = 'candleLightSection';
        sec.style.cssText = 'border-top:1px solid rgba(200,170,120,0.22);margin-top:10px;padding-top:8px';
        sec.innerHTML = `
          <div class="projVarHint" style="color:#c89952;font-weight:600;margin-bottom:4px">Candlelight</div>
          <label class="projVarRow"><span class="projVarLabel">backlit-alpha</span>
            <input class="projVarInput" type="number" data-cl="backlitAlpha" step="0.01" min="0" max="1" value="${window.__candleLight.backlitAlpha.toFixed(2)}">
            <input class="projVarInput" type="range"  data-cl="backlitAlpha" step="0.01" min="0" max="1" value="${window.__candleLight.backlitAlpha.toFixed(2)}">
          </label>
          <label class="projVarRow"><span class="projVarLabel">backlit-blur (0=auto)</span>
            <input class="projVarInput" type="number" data-cl="backlitBlur" step="1" min="0" max="300" value="${window.__candleLight.backlitBlur}">
            <input class="projVarInput" type="range"  data-cl="backlitBlur" step="1" min="0" max="300" value="${window.__candleLight.backlitBlur}">
          </label>
          <label class="projVarRow"><span class="projVarLabel">thevmenu opacity</span>
            <input class="projVarInput" type="number" data-cl="thevmenuOpacity" step="0.01" min="0" max="1" value="${window.__candleLight.thevmenuOpacity.toFixed(2)}">
            <input class="projVarInput" type="range"  data-cl="thevmenuOpacity" step="0.01" min="0" max="1" value="${window.__candleLight.thevmenuOpacity.toFixed(2)}">
          </label>
          <label class="projVarRow" style="gap:8px;align-items:center">
            <span class="projVarLabel">debug immune masks</span>
            <input type="checkbox" data-cl="debugImmuneMasks" ${window.__candleLight.debugImmuneMasks ? 'checked' : ''}>
          </label>
          ${st ? `<div style="margin-top:6px;font-size:0.82em;color:#cdbb9f;margin-bottom:2px">${sel}</div>
          <label class="projVarRow" style="gap:8px;align-items:center">
            <span class="projVarLabel">backlit</span>
            <input type="checkbox" data-cl="backlit" data-sel="${sel}" ${st.backlit ? 'checked' : ''}>
          </label>
          <label class="projVarRow" style="gap:8px;align-items:center">
            <span class="projVarLabel">immune (fully unaffected)</span>
            <input type="checkbox" data-cl="immune" data-sel="${sel}" ${st.immune ? 'checked' : ''}>
          </label>` : ''}
        `;
        sec.addEventListener('input', e => {
          const key = e.target.dataset.cl;
          const elSel = e.target.dataset.sel;
          if (!key) return;
          if (key === 'backlitAlpha') {
            window.__candleLight.backlitAlpha = e.target.value;
            sec.querySelectorAll('[data-cl="backlitAlpha"]').forEach(i => { if (i !== e.target) i.value = e.target.value; });
          } else if (key === 'backlitBlur') {
            window.__candleLight.backlitBlur = e.target.value;
            sec.querySelectorAll('[data-cl="backlitBlur"]').forEach(i => { if (i !== e.target) i.value = e.target.value; });
          } else if (key === 'thevmenuOpacity') {
            window.__candleLight.thevmenuOpacity = e.target.value;
            const synced = window.__candleLight.thevmenuOpacity.toFixed(2);
            sec.querySelectorAll('[data-cl="thevmenuOpacity"]').forEach(i => { if (i !== e.target) i.value = synced; });
          } else if (key === 'debugImmuneMasks') {
            window.__candleLight.debugImmuneMasks = e.target.checked;
          } else if (key === 'backlit' && elSel) {
            window.__candleLight.setBacklit(elSel, e.target.checked);
          } else if (key === 'immune' && elSel) {
            window.__candleLight.setImmune(elSel, e.target.checked);
          }
        });
        return sec;
      }

      new MutationObserver(() => {
        if (!panelBody.querySelector('.candleLightSection'))
          panelBody.appendChild(buildSection());
      }).observe(panelBody, { childList: true });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', () => { start(); initCandleLightControls(); });
    } else {
      start();
      initCandleLightControls();
    }
    logCandle('debug', 'initialized');
  }
