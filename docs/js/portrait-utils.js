// ============================================================
// PORTRAIT UTILS
// Shared portrait generation and rendering logic.
// Used by: character-tools.html, ScratchbonesBluffGame.html
//
// Setup (call before rendering):
//   setPortraitAssetBase('./assets/');          // character-tools (default)
//   setPortraitAssetBase('./docs/assets/');     // ScratchbonesBluffGame
// ============================================================

// ── Constants / Config ─────────────────────────────────────

// ── Xform Presets ──────────────────────────────────────────
// A: heads and ur-head overlays
// B: body layers and all other cosmetics
// C/D: placeholder presets (identity)
const _XFORM_PRESET_DEFAULTS = {
  A: { ax: -0.2,    ay: 0,       sx: 2.55, sy: 2.55 },
  B: { ax: -0.0983, ay: -0.0809, sx: 2.49, sy: 2.49 },
  C: { ax: 0,       ay: 0,       sx: 1,    sy: 1    },
  D: { ax: 0,       ay: 0,       sx: 1,    sy: 1    },
};

/**
 * Returns the current normalized xform for a named preset (A/B/C/D).
 * Values are read live from SCRATCHBONES_CONFIG so the lobby panel can
 * update them and have all sprites re-render with the new values.
 */
function getPortraitXformPreset(name) {
  const cfg = window.SCRATCHBONES_CONFIG?.game?.portrait?.xformPresets;
  const preset = (cfg && cfg[name]) || _XFORM_PRESET_DEFAULTS[name] || _XFORM_PRESET_DEFAULTS.C;
  return {
    ax: preset.ax ?? 0,
    ay: preset.ay ?? 0,
    sx: preset.scaleX ?? preset.sx ?? 1,
    sy: preset.scaleY ?? preset.sy ?? 1,
  };
}

const _PORTRAIT_DEFAULTS = {
  canvas: { width: 200, height: 200, layerSize: 80 },
  headXform: { ax: 0, ay: -0.1, sx: 0.95, sy: 1.14 },
  fighters: [
    {
      id:      'M',
      speciesId: 'mao_ao',
      gender:  'male',
      label:   'Mao-ao (M)',
      headUrl: 'fightersprites/mao-ao-m/head_mint.png',
      bodyLayers: [
        { id: 'armL', url: 'portraitsprites/arm-L_mao-ao_m.png', tintSlot: 'A', pos: 'back' },
        { id: 'torso', url: 'portraitsprites/torso_mao-ao_m.png', tintSlot: 'A', pos: 'back' },
        { id: 'armR', url: 'portraitsprites/arm-R_mao-ao_m.png', tintSlot: 'A', pos: 'back' },
      ],
      urLayers: [
        { url: 'fightersprites/mao-ao-m/untinted_regions/ur-head.png' },
      ],
    },
    {
      id:      'F',
      speciesId: 'mao_ao',
      gender:  'female',
      label:   'Mao-ao (F)',
      headUrl: 'fightersprites/mao-ao-f/head.png',
      bodyLayers: [
        { id: 'armL', url: 'portraitsprites/arm-L_mao-ao_f.png', tintSlot: 'A', pos: 'back' },
        { id: 'torso', url: 'portraitsprites/torso_mao-ao_f.png', tintSlot: 'A', pos: 'back' },
        { id: 'armR', url: 'portraitsprites/arm-R_mao-ao_f.png', tintSlot: 'A', pos: 'back' },
      ],
      urLayers: [
        { url: 'fightersprites/mao-ao-f/untinted_regions/ur-head.png' },
      ],
    },
  ],
  bodyColorLimits: {
    A: { hMin: -100, hMax:  -30, sMin: 0.05, sMax: 0.75, vMin: -0.50, vMax: 0.20 },
    B: { hMin: -100, hMax:  -30, sMin: -0.20, sMax: 0.90, vMin: -0.85, vMax: 0.10 },
    C: { hMin: -100, hMax:  -30, sMin: -0.65, sMax: 0.65, vMin: -0.25, vMax: 0.55 },
  }
};

let _portraitConfig = {
  ..._PORTRAIT_DEFAULTS,
  ...(window.PORTRAIT_CONFIG || {})
};

function normalizePortraitLayerXform(layer) {
  if (!layer || typeof layer !== 'object') return layer;
  const next = { ...layer };
  const xf = (layer.xform && typeof layer.xform === 'object') ? layer.xform : null;
  if (next.ax == null) next.ax = xf?.ax ?? 0;
  if (next.ay == null) next.ay = xf?.ay ?? 0;
  if (next.sx == null) next.sx = xf?.sx ?? xf?.scaleX ?? xf?.scaleMulX ?? 1;
  if (next.sy == null) next.sy = xf?.sy ?? xf?.scaleY ?? xf?.scaleMulY ?? 1;
  return next;
}

function normalizePortraitMaskLayer(maskLayer) {
  if (!maskLayer || typeof maskLayer !== 'object') return null;
  return normalizePortraitLayerXform(maskLayer);
}

function normalizedFighterPortrait(fighter) {
  if (!fighter || typeof fighter !== 'object') return fighter;
  return {
    ...fighter,
    bodyLayers: Array.isArray(fighter.bodyLayers)
      ? fighter.bodyLayers.map(normalizePortraitLayerXform)
      : fighter.bodyLayers,
    opacityMaskLayer: normalizePortraitMaskLayer(fighter.opacityMaskLayer),
  };
}

function setPortraitConfig(overrides) {
  _portraitConfig = {
    ..._PORTRAIT_DEFAULTS,
    ..._portraitConfig,
    ...(overrides || {})
  };
  PORTRAIT_CW = _portraitConfig.canvas?.width ?? 200;
  PORTRAIT_CH = _portraitConfig.canvas?.height ?? 200;
  PORTRAIT_L = _portraitConfig.canvas?.layerSize ?? 80;
  HEAD_XFORM = _portraitConfig.headXform || _PORTRAIT_DEFAULTS.headXform;
  FIGHTERS = (_portraitConfig.fighters || _PORTRAIT_DEFAULTS.fighters).map(normalizedFighterPortrait);
  BODYCOLOR_LIMITS = _portraitConfig.bodyColorLimits || _PORTRAIT_DEFAULTS.bodyColorLimits;
}

let PORTRAIT_CW = _portraitConfig.canvas?.width ?? 200;
let PORTRAIT_CH = _portraitConfig.canvas?.height ?? 200;
let PORTRAIT_L  = _portraitConfig.canvas?.layerSize ?? 80;
let HEAD_XFORM = _portraitConfig.headXform || _PORTRAIT_DEFAULTS.headXform;
let FIGHTERS = (_portraitConfig.fighters || _PORTRAIT_DEFAULTS.fighters).map(normalizedFighterPortrait);
let BODYCOLOR_LIMITS = _portraitConfig.bodyColorLimits || _PORTRAIT_DEFAULTS.bodyColorLimits;
let LAST_RANDOMIZATION_RULES_BY_FIGHTER = {};
const BLINK_STATE_BY_HEAD_URL = new Map();

function getBlinkConfig() {
  const cfg = window.SCRATCHBONES_CONFIG?.game?.portrait?.blink || {};
  return {
    enabled: cfg.enabled !== false,
    minIntervalMs: Number(cfg.minIntervalMs) || 2500,
    maxIntervalMs: Number(cfg.maxIntervalMs) || 6000,
    durationMs: Number(cfg.durationMs) || 140,
    flurryChance: Number.isFinite(Number(cfg.flurryChance)) ? Number(cfg.flurryChance) : 0.18,
    flurryCountMin: Math.max(1, Number(cfg.flurryCountMin) || 1),
    flurryCountMax: Math.max(1, Number(cfg.flurryCountMax) || 2),
    flurryIntervalMs: Number(cfg.flurryIntervalMs) || 280,
  };
}

function blinkUrlFor(headOverlayUrl) {
  if (typeof headOverlayUrl !== 'string' || !headOverlayUrl.endsWith('.png')) return null;
  return headOverlayUrl.replace(/\.png$/i, '_blink.png');
}

function getBlinkState(headUrl) {
  if (!headUrl) return null;
  let state = BLINK_STATE_BY_HEAD_URL.get(headUrl);
  if (!state) {
    state = { supported: null, nextBlinkAtMs: 0, closeUntilMs: 0, flurryBlinksLeft: 0 };
    BLINK_STATE_BY_HEAD_URL.set(headUrl, state);
  }
  return state;
}

function shouldRenderBlink(headUrl, nowMs) {
  const cfg = getBlinkConfig();
  if (!cfg.enabled || !headUrl) return false;
  const state = getBlinkState(headUrl);
  if (!state || state.supported !== true) return false;
  const minGap = Math.min(cfg.minIntervalMs, cfg.maxIntervalMs);
  const maxGap = Math.max(cfg.minIntervalMs, cfg.maxIntervalMs);
  if (!state.nextBlinkAtMs) {
    state.nextBlinkAtMs = nowMs + minGap + Math.random() * (maxGap - minGap);
    return false;
  }
  if (nowMs >= state.closeUntilMs && nowMs >= state.nextBlinkAtMs) {
    state.closeUntilMs = nowMs + cfg.durationMs;
    if (state.flurryBlinksLeft > 0) {
      state.flurryBlinksLeft--;
      state.nextBlinkAtMs = state.closeUntilMs + cfg.flurryIntervalMs;
    } else if (Math.random() < cfg.flurryChance) {
      const flurryCount = cfg.flurryCountMin + Math.floor(Math.random() * (cfg.flurryCountMax - cfg.flurryCountMin + 1));
      state.flurryBlinksLeft = flurryCount;
      state.nextBlinkAtMs = state.closeUntilMs + cfg.flurryIntervalMs;
    } else {
      state.nextBlinkAtMs = state.closeUntilMs + minGap + Math.random() * (maxGap - minGap);
    }
  }
  return nowMs < state.closeUntilMs;
}

// ── Image loading ──────────────────────────────────────────

let _puAssetBase = './assets/';
const IMG_CACHE  = new Map();

/** Set the asset base URL used by loadImg(). Call before rendering. */
function setPortraitAssetBase(base) {
  _puAssetBase = base;
  IMG_CACHE.clear();
}

function loadImg(relPath) {
  if (IMG_CACHE.has(relPath)) return IMG_CACHE.get(relPath);

  const ensureTrailingSlash = (base) => String(base || './assets/').replace(/\/?$/, '/');
  const localBase = ensureTrailingSlash(_puAssetBase);
  const fallbackBase = localBase.includes('/docs/assets/')
    ? localBase.replace('/docs/assets/', '/assets/')
    : localBase.replace('/assets/', '/docs/assets/');

  const candidateUrls = [
    localBase + relPath,
    fallbackBase + relPath,
    'https://raw.githubusercontent.com/Oolnokk/SoKEmpirePrologue/main/docs/assets/' + relPath,
  ];

  const seen = new Set();
  const uniqueCandidates = candidateUrls.filter((url) => {
    if (!url || seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  const tryLoadUrl = (url) => new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(url);
    img.src = url;
  });

  const promise = (async () => {
    const attemptedUrls = [];
    for (const url of uniqueCandidates) {
      attemptedUrls.push(url);
      try {
        return await tryLoadUrl(url);
      } catch (_) {
        // Try next candidate URL.
      }
    }
    const error = new Error(`Failed to load portrait asset "${relPath}"`);
    error.name = 'PortraitImageLoadError';
    error.relPath = relPath;
    error.attemptedUrls = attemptedUrls;
    throw error;
  })();

  IMG_CACHE.set(relPath, promise);
  return promise;
}

// ── CSS filter helpers ─────────────────────────────────────

function buildCSSFilter(h, s, v) {
  const hueOffset  = (window.SCRATCHBONES_CONFIG?.clothingHueOffset)   ?? 0;
  const satOffset  = (window.SCRATCHBONES_CONFIG?.clothingSatOffset)   ?? 0;
  const lightOffset = (window.SCRATCHBONES_CONFIG?.clothingLightOffset) ?? 0;
  const sat = Math.max(0, 1 + (Number(s) || 0) + satOffset);
  const bri = Math.max(0, 1 + (Number(v) || 0) + lightOffset);
  const finalH = (Number(h) || 0) + hueOffset;
  if (finalH === 0 && sat === 1 && bri === 1) return 'none';
  return `hue-rotate(${finalH.toFixed(1)}deg) saturate(${sat.toFixed(3)}) brightness(${bri.toFixed(3)})`;
}

function makeCSSFilter(color) {
  if (!color) return 'none';
  return buildCSSFilter(color.h, color.s, color.v ?? color.l);
}

// ── Canvas helpers ─────────────────────────────────────────

function drawPortraitLayer(ctx, img, xform, cssFilter) {
  const { ax, ay, sx, sy } = xform;
  const h  = PORTRAIT_L * sy;
  const w  = (img.naturalWidth / img.naturalHeight) * PORTRAIT_L * sx;
  const cx = PORTRAIT_CW / 2 + ay * PORTRAIT_L;
  const cy = PORTRAIT_CH / 2 - ax * PORTRAIT_L;
  ctx.save();
  ctx.filter = cssFilter || 'none';
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
}

function applyPortraitOpacityMask(ctx, img, xform) {
  const { ax, ay, sx, sy } = xform;
  const h  = PORTRAIT_L * sy;
  const w  = (img.naturalWidth / img.naturalHeight) * PORTRAIT_L * sx;
  const cx = PORTRAIT_CW / 2 + ay * PORTRAIT_L;
  const cy = PORTRAIT_CH / 2 - ax * PORTRAIT_L;
  ctx.save();
  ctx.globalCompositeOperation = 'destination-out';
  ctx.drawImage(img, cx - w / 2, cy - h / 2, w, h);
  ctx.restore();
}


function getPortraitLayeringConfig() {
  const layering = window.SCRATCHBONES_CONFIG?.game?.portrait?.layering || {};
  return {
    hatUnderHoodTag: layering.hatUnderHoodTag || null,
    eyeAccessoryAboveUnderHoodHatTag: layering.eyeAccessoryAboveUnderHoodHatTag || null,
  };
}

function hasPortraitTag(option, tag) {
  if (!option || !tag) return false;
  return Array.isArray(option.tags) && option.tags.includes(tag);
}

function hatLayersUnderHood(hat) {
  const { hatUnderHoodTag } = getPortraitLayeringConfig();
  return hat?.hoodLayering === 'under' || hasPortraitTag(hat, hatUnderHoodTag);
}

function eyeAccessoryLayersAboveUnderHoodHat(eyes, hat) {
  if (!hatLayersUnderHood(hat)) return false;
  const { eyeAccessoryAboveUnderHoodHatTag } = getPortraitLayeringConfig();
  return hasPortraitTag(eyes, eyeAccessoryAboveUnderHoodHatTag);
}

function getProfileSpriteXforms(profile) {
  if (!profile) return [];
  const { fighter, hair, hairFront, hairBack, hairSide, hairSideL, hood, eyes, facialHair, pauldron, hat, torsoCosmetic, armCosmetic } = profile;
  const resolvedFighter = resolvePortraitFighter(fighter) || fighter;
  const opacityMaskLayer = resolvedFighter?.opacityMaskLayer || fighter?.opacityMaskLayer || null;
  const headUrl = resolvedFighter?.headUrl || fighter?.headUrl;
  const bodyLayerSource = resolvedFighter?.bodyLayers || fighter?.bodyLayers || [];
  const urLayerSource = resolvedFighter?.urLayers || fighter?.urLayers || [];
  const resolveLayerXform = (layer) => layer?.xformPreset
    ? getPortraitXformPreset(layer.xformPreset)
    : {
      ax: layer?.ax ?? 0,
      ay: layer?.ay ?? 0,
      sx: layer?.sx ?? 1,
      sy: layer?.sy ?? 1,
    };
  const toRecord = (part, layer, extra = {}) => ({
    part,
    url: layer?.url || null,
    xform: resolveLayerXform(layer),
    ...extra,
  });
  const records = [];
  const hatIsUnderHood = hatLayersUnderHood(hat);
  const eyesLayerAboveUnderHoodHat = eyeAccessoryLayersAboveUnderHoodHat(eyes, hat);
  const pushGroupRecords = (group) => {
    if (!group) return;
    const groupLayers = resolveOptionLayers(group, resolvedFighter);
    for (const layer of groupLayers) {
      records.push(toRecord('cosmetic', layer, { group: group.id || null, hairSlot: group.hairSlot || null, pos: layer.pos || 'front' }));
    }
  };
  if (hairFront !== undefined) {
    // Pre-arm back layers: back hairstyle then hat back sprite
    for (const group of [hairBack, hat]) {
      if (!group) continue;
      for (const layer of resolveOptionLayers(group, resolvedFighter)) {
        if (layer.pos === 'back') records.push(toRecord('cosmetic', layer, { group: group.id || null, hairSlot: group.hairSlot || null, pos: 'back' }));
      }
    }
  }
  // Body layers (arms, torso)
  for (const layer of bodyLayerSource) records.push(toRecord('body', layer, { pos: layer.pos || 'back', id: layer.id || null }));
  // Clothing and overwear
  for (const group of [torsoCosmetic, armCosmetic]) {
    if (!group) continue;
    const groupLayers = resolveOptionLayers(group, resolvedFighter);
    if (!groupLayers.length) continue;
    for (const layer of groupLayers) {
      records.push(toRecord('bodyCosmetic', layer, { group: group.id || null, pos: layer.pos || 'front' }));
    }
  }
  if (hairFront !== undefined) {
    // Left side hairstyle before head
    pushGroupRecords(hairSideL);
    // Head
    if (headUrl) records.push({ part: 'head', url: headUrl, xform: getPortraitXformPreset('B') });
    // Facial hair and standard eyes after head, before ur-head. Tagged eye accessories
    // can be promoted later so under-hood hats do not cover goggles.
    pushGroupRecords(facialHair);
    if (!eyesLayerAboveUnderHoodHat) pushGroupRecords(eyes);
    // Ur-head overlays
    for (const layer of urLayerSource) {
      records.push({ part: 'headOverlay', url: layer.url || null, renderOrder: layer.renderOrder || 'normal', xform: getPortraitXformPreset('B') });
    }
    // Front hairstyle, right side hairstyle
    pushGroupRecords(hairFront);
    pushGroupRecords(hairSide);
    // Hat (under hood), hood, pauldron, hat (over hood)
    if (hatIsUnderHood) pushGroupRecords(hat);
    if (eyesLayerAboveUnderHoodHat) pushGroupRecords(eyes);
    pushGroupRecords(hood);
    pushGroupRecords(pauldron);
    if (!hatIsUnderHood) pushGroupRecords(hat);
  } else {
    const legacyGroups = [hair, eyes, facialHair, hat];
    for (const group of legacyGroups) {
      if (!group) continue;
      const groupLayers = resolveOptionLayers(group, resolvedFighter);
      if (!groupLayers.length) continue;
      for (const layer of groupLayers) {
        records.push(toRecord('cosmetic', layer, { group: group.id || null, hairSlot: group.hairSlot || null, pos: layer.pos || 'front' }));
      }
    }
    if (headUrl) records.push({ part: 'head', url: headUrl, xform: getPortraitXformPreset('B') });
    for (const layer of urLayerSource) {
      records.push({ part: 'headOverlay', url: layer.url || null, renderOrder: layer.renderOrder || 'normal', xform: getPortraitXformPreset('B') });
    }
  }
  if (opacityMaskLayer?.url) records.push(toRecord('opacityMask', opacityMaskLayer));
  return records;
}

// ── Rendering ──────────────────────────────────────────────

async function renderProfile(canvas, profile, renderOptions = {}) {
  const { fighter, hair, hairFront, hairBack, hairSide, hairSideL, hood, eyes, facialHair, pauldron, hat, torsoCosmetic, armCosmetic, bodyColors } = profile;
  const omitHeadSpriteAndCosmetics = renderOptions?.omitHeadSpriteAndCosmetics === true;
  const renderHeadSprite = !omitHeadSpriteAndCosmetics;
  const renderHeadCosmetics = !omitHeadSpriteAndCosmetics;
  const resolvedFighter = resolvePortraitFighter(fighter) || fighter;
  const opacityMaskLayer = resolvedFighter?.opacityMaskLayer || fighter?.opacityMaskLayer || null;
  const headUrl = renderHeadSprite ? (resolvedFighter?.headUrl || fighter?.headUrl) : null;
  const bodyLayerSource = resolvedFighter?.bodyLayers || fighter?.bodyLayers || [];
  const urLayerSource = renderHeadSprite ? (resolvedFighter?.urLayers || fighter?.urLayers || []) : [];
  const blinkOverlayUrlsByBase = new Map();
  for (const layer of urLayerSource) {
    const blinkUrl = blinkUrlFor(layer?.url);
    if (blinkUrl) blinkOverlayUrlsByBase.set(layer.url, blinkUrl);
  }
  const ctx = canvas.getContext('2d');
  ctx.clearRect(0, 0, PORTRAIT_CW, PORTRAIT_CH);

  const filterFor = (slot) => slot ? makeCSSFilter(bodyColors[slot]) : 'none';
  const filterA   = makeCSSFilter(bodyColors.A);

  const baseLeftArmLayers = [];
  const baseTorsoLayers = [];
  const baseRightArmLayers = [];
  const torsoClothingLayers = [];
  const overwearLayers = [];
  for (const layer of bodyLayerSource) {
    const normalizedId = String(layer.id || '').toLowerCase();
    const target = normalizedId.includes('arml') ? baseLeftArmLayers
      : normalizedId.includes('armr') ? baseRightArmLayers
      : normalizedId.includes('torso') ? baseTorsoLayers
      : baseTorsoLayers;
    target.push({ layer, filter: filterFor(layer.tintSlot || 'A') });
  }
  for (const group of [torsoCosmetic, armCosmetic]) {
    if (!group) continue;
    const groupLayers = resolveOptionLayers(group, resolvedFighter);
    if (!groupLayers.length) continue;
    for (const layer of groupLayers) {
      const target = group?.slot === 'torso' ? torsoClothingLayers : overwearLayers;
      target.push({ layer, filter: filterFor(group.tintSlot || 'A') });
    }
  }

  // Support both three-slot (hairBack/hairSide/hairFront) and legacy single-slot (hair).
  const hatIsUnderHood = hatLayersUnderHood(hat);
  const eyesLayerAboveUnderHoodHat = eyeAccessoryLayersAboveUnderHoodHat(eyes, hat);
  const hoodHideFrontAndSideHair = Boolean(resolveOptionLayers(hood, resolvedFighter).length);
  const hiddenCosmeticGroups = hoodHideFrontAndSideHair ? new Set([hairFront, hairSide, hairSideL]) : null;

  const preBackLayers    = [];  // back hairstyle + hat-back, drawn before arms
  const sideLeftLayers   = [];  // left side hairstyle, drawn before head
  const facialHairLayers = [];  // facial hair, drawn after head
  const eyesLayers       = [];  // eyes, drawn after facial hair
  const frontHairLayers   = [];  // front fringe hair, drawn after facial hair and ur-head overlays
  const rightSideHairLayers = [];  // right-side hairstyle, drawn between head and facial hair
  const hatUnderLayers   = [];  // hat front when configured to render under hoods
  const elevatedEyeAccessoryLayers = []; // tagged eye accessories that render above under-hood hats
  const hoodPauldronLayers = []; // hood then pauldron
  const hatOverLayers    = [];  // hat front when hoodLayering=over (default)

  const pushToTarget = (group, target) => {
    if (!group || hiddenCosmeticGroups?.has(group)) return;
    const groupLayers = resolveOptionLayers(group, resolvedFighter);
    if (!groupLayers.length) return;
    for (const layer of groupLayers) {
      const key = layer.paletteColorKey;
      const layerTintSlot = (!key || key === 'A') ? group.tintSlot
        : (group.tintSlot ? `${group.tintSlot}_${key}` : null);
      target.push({ layer, filter: filterFor(layerTintSlot), group });
    }
  };

  if (renderHeadCosmetics && hairFront !== undefined) {
    // Pre-arm back layers: back hairstyle then hat back sprite
    for (const group of [hairBack, hat]) {
      if (!group) continue;
      const groupLayers = resolveOptionLayers(group, resolvedFighter);
      for (const layer of groupLayers) {
        if (layer.pos === 'back') {
          const key = layer.paletteColorKey;
          const layerTintSlot = (!key || key === 'A') ? group.tintSlot
            : (group.tintSlot ? `${group.tintSlot}_${key}` : null);
          preBackLayers.push({ layer, filter: filterFor(layerTintSlot), group });
        }
      }
    }
    pushToTarget(hairSideL, sideLeftLayers);
    pushToTarget(facialHair, facialHairLayers);
    pushToTarget(eyes, eyesLayerAboveUnderHoodHat ? elevatedEyeAccessoryLayers : eyesLayers);
    pushToTarget(hairFront, frontHairLayers);
    pushToTarget(hairSide, rightSideHairLayers);
    if (hat) {
      const groupLayers = resolveOptionLayers(hat, resolvedFighter);
      for (const layer of groupLayers) {
        if (layer.pos !== 'back') {
          const key = layer.paletteColorKey;
          const layerTintSlot = (!key || key === 'A') ? hat.tintSlot
            : (hat.tintSlot ? `${hat.tintSlot}_${key}` : null);
          (hatIsUnderHood ? hatUnderLayers : hatOverLayers).push({ layer, filter: filterFor(layerTintSlot), group: hat });
        }
      }
    }
    pushToTarget(hood, hoodPauldronLayers);
    pushToTarget(pauldron, hoodPauldronLayers);
  } else if (renderHeadCosmetics) {
    // Legacy single-slot hair
    const legacyGroups = [hair, eyes, facialHair, hat];
    for (const group of legacyGroups) {
      if (!group) continue;
      const groupLayers = resolveOptionLayers(group, resolvedFighter);
      if (!groupLayers.length) continue;
      for (const layer of groupLayers) {
        const key = layer.paletteColorKey;
        const layerTintSlot = (!key || key === 'A') ? group.tintSlot
          : (group.tintSlot ? `${group.tintSlot}_${key}` : null);
        (layer.pos === 'back' ? preBackLayers : frontHairLayers).push({ layer, filter: filterFor(layerTintSlot), group });
      }
    }
  }

  const neededUrls = new Set([
    ...(headUrl ? [headUrl] : []),
    ...urLayerSource.map(m => m.url),
    ...preBackLayers.map(({ layer }) => layer.url),
    ...baseLeftArmLayers.map(({ layer }) => layer.url),
    ...baseTorsoLayers.map(({ layer }) => layer.url),
    ...baseRightArmLayers.map(({ layer }) => layer.url),
    ...torsoClothingLayers.map(({ layer }) => layer.url),
    ...overwearLayers.map(({ layer }) => layer.url),
    ...sideLeftLayers.map(({ layer }) => layer.url),
    ...rightSideHairLayers.map(({ layer }) => layer.url),
    ...facialHairLayers.map(({ layer }) => layer.url),
    ...eyesLayers.map(({ layer }) => layer.url),
    ...frontHairLayers.map(({ layer }) => layer.url),
    ...hatUnderLayers.map(({ layer }) => layer.url),
    ...elevatedEyeAccessoryLayers.map(({ layer }) => layer.url),
    ...hoodPauldronLayers.map(({ layer }) => layer.url),
    ...hatOverLayers.map(({ layer }) => layer.url),
    ...(opacityMaskLayer?.url ? [opacityMaskLayer.url] : []),
    ...blinkOverlayUrlsByBase.values(),
  ].filter(Boolean));

  let imgMap;
  try {
    const entries = await Promise.all(
      [...neededUrls].map(async (url) => [url, await loadImg(url)])
    );
    imgMap = new Map(entries);
  } catch (err) {
    console.warn('[portrait] image load error', {
      message: err?.message || String(err),
      name: err?.name || 'Error',
      relPath: err?.relPath || null,
      attemptedUrls: Array.isArray(err?.attemptedUrls) ? err.attemptedUrls : [],
    });
    ctx.fillStyle = '#220000'; ctx.fillRect(0, 0, PORTRAIT_CW, PORTRAIT_CH);
    ctx.fillStyle = '#ff4444'; ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Load error', PORTRAIT_CW / 2, PORTRAIT_CH / 2);
    return;
  }
  // Capture current time after image loading so blink-state timing is accurate.
  const nowMs = Date.now();
  const headBlinkState = getBlinkState(headUrl);
  if (headBlinkState) {
    headBlinkState.supported = false;
    for (const blinkUrl of blinkOverlayUrlsByBase.values()) {
      if (imgMap.get(blinkUrl)) {
        headBlinkState.supported = true;
        break;
      }
    }
  }
  const isBlinkFrame = shouldRenderBlink(headUrl, nowMs);
  const resolveXform = (layer) => layer.xformPreset
    ? getPortraitXformPreset(layer.xformPreset)
    : {
      ax: layer?.ax ?? 0,
      ay: layer?.ay ?? 0,
      sx: layer?.sx ?? 1,
      sy: layer?.sy ?? 1,
    };

  const drawLayers = (layerList) => {
    for (const { layer, filter } of layerList) {
      const img = imgMap.get(layer.url);
      if (img) drawPortraitLayer(ctx, img, resolveXform(layer), filter);
    }
  };

  drawLayers(preBackLayers);
  drawLayers(baseLeftArmLayers);
  drawLayers(baseTorsoLayers);
  drawLayers(baseRightArmLayers);
  drawLayers(torsoClothingLayers);
  drawLayers(overwearLayers);
  drawLayers(sideLeftLayers);
  if (headUrl) { const img = imgMap.get(headUrl); if (img) drawPortraitLayer(ctx, img, getPortraitXformPreset('B'), filterA); }
  drawLayers(rightSideHairLayers);
  drawLayers(facialHairLayers);
  drawLayers(frontHairLayers);
  drawLayers(eyesLayers);
  for (const mid of urLayerSource) {
    const activeUrl = isBlinkFrame ? (blinkOverlayUrlsByBase.get(mid.url) || mid.url) : mid.url;
    const img = imgMap.get(activeUrl) || imgMap.get(mid.url);
    if (img) drawPortraitLayer(ctx, img, getPortraitXformPreset('B'), 'none');
  }
  drawLayers(hatUnderLayers);
  drawLayers(elevatedEyeAccessoryLayers);
  drawLayers(hoodPauldronLayers);
  drawLayers(hatOverLayers);
  if (opacityMaskLayer?.url) {
    const maskImg = imgMap.get(opacityMaskLayer.url);
    if (maskImg) applyPortraitOpacityMask(ctx, maskImg, resolveXform(opacityMaskLayer));
  }
}

// ── Cosmetic config parsing ────────────────────────────────

function portraitRelPath(url) {
  if (!url) return url;
  if (url.startsWith('./assets/')) return url.slice('./assets/'.length);
  return url;
}

function portraitCategoryForEntry(entry) {
  const path = (entry.path || '').toLowerCase();
  const name = (entry.id.split('::').pop() || '').toLowerCase();
  if (path.includes('/headhair/') || path.includes('headhair/')) return 'hair';
  if (path.includes('/eyes/')     || path.includes('eyes/'))     return 'eyes';
  if (path.includes('/facialhair/') || path.includes('facialhair/')) return 'facialhair';
  if (name.includes('eye')) return 'eyes';
  if (name.includes('beard') || name.includes('stache') || name.includes('whisker') || name.includes('facial')) return 'facialhair';
  return 'hair';
}

/**
 * Extract portrait layer descriptors from a cosmetic JSON `parts` block.
 * paletteLayerMap (optional): maps layerRole names to palette color keys.
 */
function _extractLayersFromParts(partsJson, paletteLayerMap) {
  if (!partsJson || typeof partsJson !== 'object') return [];
  const layers = [];
  const head = partsJson.head;
  if (head) {
    if (head.layers) {
      for (const [layerName, layer] of Object.entries(head.layers)) {
        const xf =
          (layer.spriteStyle && layer.spriteStyle.base && layer.spriteStyle.base.xform && layer.spriteStyle.base.xform.head) ||
          (layer.spriteStyle && layer.spriteStyle.xform && layer.spriteStyle.xform.head) || {};
        const imgUrl = layer.image && layer.image.url;
        if (imgUrl) {
          const layerRole = layer.layerRole || null;
          const paletteColorKey = (layerRole && paletteLayerMap) ? (paletteLayerMap[layerRole] || null) : null;
          layers.push({
            url: portraitRelPath(imgUrl),
            ax:  xf.ax     ?? 0,
            ay:  xf.ay     ?? 0,
            sx:  xf.scaleX ?? 1,
            sy:  xf.scaleY ?? 1,
            pos: layerName === 'back' ? 'back' : 'front',
            paletteColorKey,
            xformPreset: 'B',
          });
        }
      }
    } else if (head.image) {
      const xf = (head.spriteStyle && head.spriteStyle.xform && head.spriteStyle.xform.head) || {};
      const imgUrl = head.image.url;
      if (imgUrl) {
        layers.push({
          url: portraitRelPath(imgUrl),
          ax:  xf.ax     ?? 0,
          ay:  xf.ay     ?? 0,
          sx:  xf.scaleX ?? 1,
          sy:  xf.scaleY ?? 1,
          pos: 'front',
          xformPreset: 'B',
        });
      }
    }
  }
  // Portrait torso/arm clothing layers are identified by their '/portrait/' asset paths.
  if (!layers.length) {
    for (const [partName, partDef] of Object.entries(partsJson)) {
      const partLayers = partDef && partDef.layers ? partDef.layers : null;
      if (!partLayers || typeof partLayers !== 'object') continue;
      for (const [layerName, layer] of Object.entries(partLayers)) {
        const imgUrl = layer?.image?.url;
        if (!imgUrl || !String(imgUrl).toLowerCase().includes('/portrait/')) continue;
        const xf =
          layer?.spriteStyle?.base?.xform?.[partName] ||
          layer?.spriteStyle?.base?.xform?.head ||
          layer?.spriteStyle?.xform?.[partName] ||
          layer?.spriteStyle?.xform?.head ||
          {};
        layers.push({
          url: portraitRelPath(imgUrl),
          ax:  xf.ax     ?? 0,
          ay:  xf.ay     ?? 0,
          sx:  xf.scaleX ?? xf.scaleMulX ?? 1,
          sy:  xf.scaleY ?? xf.scaleMulY ?? 1,
          pos: layerName === 'back' ? 'back' : 'front',
          xformPreset: 'B',
        });
      }
    }
  }
  return layers;
}

/**
 * Return the correct layer list for an option given the current fighter.
 * Falls back to option.layers when no matching variant exists.
 */
function portraitVariantKeysForFighter(fighter) {
  const speciesId = String(fighter?.speciesId || '').trim();
  const gender = String(fighter?.gender || '').trim();
  if (!speciesId || !gender) return [];
  return [...new Set([
    `${speciesId}_${gender}`,
    `${speciesId.replace(/_/g, '-')}_${gender}`,
    `${speciesId.replace(/-/g, '_')}_${gender}`,
  ])];
}

function resolveOptionLayers(option, fighter) {
  if (!option) return [];
  const vl = option.variantLayers;
  if (vl && fighter) {
    for (const key of portraitVariantKeysForFighter(fighter)) {
      const resolved = vl[key];
      if (resolved && resolved.length) return resolved;
    }
  }
  return option.layers || [];
}

function portraitOptionFromJson(entry, json) {
  const label    = (json.meta && json.meta.name) || entry.id.split('::').pop().replace(/^mao-ao_/i, '').replace(/_/g, ' ');
  const tintSlot = (json.appearance && json.appearance.bodyColors && json.appearance.bodyColors[0]) || null;
  const shortId  = entry.id.split('::').pop().replace(/^mao-ao_/i, '');

  const paletteLayerMap = (json.palette && json.palette.layers) ? json.palette.layers : null;

  // Extract default layers from the top-level parts block.
  const layers = _extractLayersFromParts(json.parts, paletteLayerMap);

  // Extract per-species-gender variant layers from the speciesVariants block.
  // Keys are "{speciesId}_{genderKey}" (e.g. "mao-ao_male", "kenkari_female").
  const variantLayers = {};
  if (json.speciesVariants && typeof json.speciesVariants === 'object') {
    for (const [variantKey, variantData] of Object.entries(json.speciesVariants)) {
      const vLayers = _extractLayersFromParts(variantData && variantData.parts, paletteLayerMap);
      if (vLayers.length) variantLayers[variantKey] = vLayers;
    }
  }

  const colorRange = json.colorRange || null;
  const tags = Array.isArray(json.tags) ? json.tags : [];
  const materialTag = (typeof json.material === 'string' && json.material.trim())
    ? json.material.trim().toLowerCase()
    : (tags.find(tag => typeof tag === 'string' && tag.toLowerCase().startsWith('material:')) || '')
      .split(':')[1]
      ?.trim()
      ?.toLowerCase()
      || null;
  const resolvedTintSlot = json.slot === 'hat' && colorRange ? 'HAT'
                         : json.slot === 'hood' && colorRange ? 'HOOD'
                         : !json.appearance && colorRange ? 'CLOTH'
                         : json.slot === 'hood' && !json.appearance ? (json.tintSlot ?? 'HOOD')
                         : !json.appearance && json.tintSlot != null ? json.tintSlot
                         : json.slot === 'torso' && !json.appearance ? 'TORSO'
                         : tintSlot;
  const hairSlot = json.hairSlot || null; // 'front' | 'back' | 'side' | 'side-L'
  const portraitSlot = json.portraitSlot || null; // 'eyes' | 'facialHair' | 'hairFront' | 'hairBack' | 'hairSide' | 'hairSideL'
  const hoodLayering = json.hoodLayering || null; // 'under' means hat renders under hood; default is over
  return { id: shortId, label, tintSlot: resolvedTintSlot, layers, variantLayers, slot: json.slot || null, portraitSlot, colorRange, hairSlot, tags, materialTag, hoodLayering };
}

/**
 * Fetch cosmetics index and all appearance entries.
 * Returns { hairOptions, eyesOptions, facialHairOptions, indexEntries, optionCache }.
 * Throws on unrecoverable failure.
 */
async function loadPortraitCosmetics(configBase) {
  let indexBaseUrl = new URL(configBase + 'cosmetics/index.json', window.location.href).toString();
  let data;
  try {
    const resp = await fetch(indexBaseUrl);
    if (!resp.ok) throw new Error('HTTP ' + resp.status);
    data = await resp.json();
  } catch (e) {
    console.warn('[portrait] Primary index fetch failed, falling back to raw GitHub URL', e);
    const rawUrl = 'https://raw.githubusercontent.com/Oolnokk/SoKEmpirePrologue/main/docs/config/cosmetics/index.json';
    const resp2 = await fetch(rawUrl);
    if (!resp2.ok) throw new Error('HTTP ' + resp2.status);
    data = await resp2.json();
    indexBaseUrl = rawUrl;
  }

  const allEntries = (data.entries || []).filter(e => e.id && (e.id.startsWith('appearance::') || !e.id.includes('::')));
  const pathToEntries = new Map();
  for (const entry of allEntries) {
    if (!pathToEntries.has(entry.path)) pathToEntries.set(entry.path, []);
    pathToEntries.get(entry.path).push(entry);
  }

  const optionCache  = new Map();
  const indexEntries = [];

  await Promise.all([...pathToEntries.entries()].map(async ([path, entries]) => {
    const jsonUrl = new URL(path, indexBaseUrl).toString();
    let json;
    try {
      const resp = await fetch(jsonUrl);
      if (!resp.ok) throw new Error('HTTP ' + resp.status + ' for ' + path);
      json = await resp.json();
    } catch (e) {
      console.warn('[portrait] Could not load cosmetic JSON:', path, e);
      return;
    }
    for (const entry of entries) {
      const opt = portraitOptionFromJson(entry, json);
      if (opt.layers.length || Object.keys(opt.variantLayers).length) {
        optionCache.set(entry.id, opt);
        indexEntries.push(entry);
      }
    }
  }));

  // Build categorised option arrays (unfiltered — callers may apply species filtering)
  const hairFrontOptions  = [{ id: 'none', label: 'No Front Hair',  tintSlot: null, layers: [] }];
  const hairBackOptions   = [{ id: 'none', label: 'No Back Hair',   tintSlot: null, layers: [] }];
  const hairSideOptions   = [{ id: 'none', label: 'No Side Hair (R)',  tintSlot: null, layers: [] }];
  const hairSideLOptions  = [{ id: 'none', label: 'No Side Hair (L)',  tintSlot: null, layers: [] }];
  const eyesOptions       = [{ id: 'none', label: 'No Eye Mark',    tintSlot: null, layers: [] }];
  const facialHairOptions = [{ id: 'none', label: 'No Facial Hair', tintSlot: null, layers: [] }];
  const hatOptions        = [{ id: 'none', label: 'No Hat',         tintSlot: null, layers: [] }];
  const hoodOptions       = [{ id: 'none', label: 'No Hood',        tintSlot: null, layers: [] }];
  const torsoPortraitOptions = [{ id: 'none', label: 'No Torso Clothing', tintSlot: null, layers: [] }];
  const armPortraitOptions = [{ id: 'none', label: 'No Arm Clothing', tintSlot: null, layers: [] }];
  const seenIds = new Set();

  for (const entry of indexEntries) {
    const opt = optionCache.get(entry.id);
    const optHasLayers = opt && (opt.layers.length > 0 || Object.keys(opt.variantLayers || {}).length > 0);
    if (!optHasLayers) continue;
    if (seenIds.has(opt.id)) continue;
    seenIds.add(opt.id);
    const cat = opt.portraitSlot === 'eyes'       ? 'eyes'
              : opt.portraitSlot === 'facialHair' ? 'facialhair'
              : opt.portraitSlot === 'hairFront'  ? 'hairFront'
              : opt.portraitSlot === 'hairBack'   ? 'hairBack'
              : opt.portraitSlot === 'hairSide'   ? 'hairSide'
              : opt.portraitSlot === 'hairSideL'  ? 'hairSideL'
              : opt.slot === 'hat'        ? 'hat'
              : opt.slot === 'hood'       ? 'hood'
              : opt.hairSlot === 'front'  ? 'hairFront'
              : opt.hairSlot === 'back'   ? 'hairBack'
              : opt.hairSlot === 'side'   ? 'hairSide'
              : opt.hairSlot === 'side-L' ? 'hairSideL'
              : portraitCategoryForEntry(entry);
    if      (cat === 'hat')        hatOptions.push(opt);
    else if (cat === 'hood')       hoodOptions.push(opt);
    else if (cat === 'hairFront')  hairFrontOptions.push(opt);
    else if (cat === 'hairBack')   hairBackOptions.push(opt);
    else if (cat === 'hairSide')   hairSideOptions.push(opt);
    else if (cat === 'hairSideL')  hairSideLOptions.push(opt);
    else if (cat === 'eyes')       eyesOptions.push(opt);
    else if (cat === 'facialhair') facialHairOptions.push(opt);

    if (!entry.id.startsWith('appearance::')) {
      const allOptLayers = [...opt.layers, ...Object.values(opt.variantLayers || {}).flat()];
      const lowerLayers = allOptLayers.map(l => (l.url || '').toLowerCase());
      if (lowerLayers.some(u => u.includes('/torso/portrait/'))) torsoPortraitOptions.push(opt);
      if (lowerLayers.some(u => u.includes('/arms/portrait/') || u.includes('/overwear/portrait/'))) armPortraitOptions.push(opt);
    }
  }

  // Load species body color ranges, allowed cosmetics, and cosmetic weights, keyed by fighter ID
  const bodyColorRangesByGender = {};
  const allowedCosmeticsByFighter = {};
  const cosmeticWeightsByFighter = {};
  const fighterPortraitOverrides = {};
  const forcedCosmeticsByFighter = {};
  const conditionalCosmeticsByFighter = {};
  const randomizationRulesByFighter = {};
  try {
    const speciesIdxUrl = new URL(configBase + 'species/index.json', window.location.href).toString();
    const speciesIdxResp = await fetch(speciesIdxUrl);
    if (speciesIdxResp.ok) {
      const speciesIdx = await speciesIdxResp.json();
      await Promise.all((speciesIdx.entries || []).map(async entry => {
        const sUrl = new URL(entry.path, speciesIdxUrl).toString();
        const sResp = await fetch(sUrl);
        if (!sResp.ok) return;
        const sData = await sResp.json();
        for (const [genderKey, genderData] of Object.entries(sData)) {
          if (!genderData || typeof genderData !== 'object' || !genderData.bodyColorRanges) continue;
          let fighter = FIGHTERS.find(f => genderData.headSprite && f.headUrl === genderData.headSprite);
          if (!fighter && genderData.headSprite && Array.isArray(genderData.portraitBodyLayers)) {
            fighter = normalizedFighterPortrait({
              id: `${sData.speciesId}_${genderKey}`,
              speciesId: sData.speciesId,
              gender: genderKey,
              label: `${sData.label || entry.label} (${genderKey === 'male' ? 'M' : 'F'})`,
              headUrl: genderData.headSprite,
              bodyLayers: genderData.portraitBodyLayers.map(l => ({ ...normalizePortraitLayerXform(l), xformPreset: 'B' })),
              urLayers: (genderData.headUrLayers || []).map(l => ({ url: l.url, renderOrder: l.renderOrder })),
              headXform: genderData.headXform ? normalizePortraitLayerXform(genderData.headXform) : null,
              opacityMaskLayer: genderData.portraitOpacityMaskLayer ? normalizePortraitMaskLayer(genderData.portraitOpacityMaskLayer) : null,
            });
            FIGHTERS.push(fighter);
          }
          if (fighter) {
            bodyColorRangesByGender[fighter.id] = genderData.bodyColorRanges;
            fighterPortraitOverrides[fighter.id] = {
              ...(fighterPortraitOverrides[fighter.id] || {}),
              gender: genderKey,
              speciesId: sData.speciesId,
              ...(genderData.headXform ? { headXform: genderData.headXform } : {}),
              ...(Array.isArray(genderData.portraitBodyLayers) ? {
                bodyLayers: genderData.portraitBodyLayers.map(l => ({ ...normalizePortraitLayerXform(l), xformPreset: 'B' }))
              } : {}),
              ...(genderData.portraitOpacityMaskLayer ? {
                opacityMaskLayer: normalizePortraitMaskLayer(genderData.portraitOpacityMaskLayer)
              } : {})
            };
            if (genderData.allowedCosmetics) {
              allowedCosmeticsByFighter[fighter.id] = {
                set: new Set(
                  genderData.allowedCosmetics.map(id => id.split('::').pop().replace(/^mao-ao_/i, ''))
                ),
                disallowedCombos: (genderData.disallowedCosmeticCombos || []).map(rule => ({
                  conditions: rule.conditions || {},
                  repairSlots: rule.repairSlots || []
                }))
              };
            }
            if (genderData.cosmeticWeights) {
              cosmeticWeightsByFighter[fighter.id] = genderData.cosmeticWeights;
            }
            if (genderData.forcedCosmetics && typeof genderData.forcedCosmetics === 'object') {
              forcedCosmeticsByFighter[fighter.id] = genderData.forcedCosmetics;
            }
            if (Array.isArray(genderData.conditionalCosmetics)) {
              conditionalCosmeticsByFighter[fighter.id] = genderData.conditionalCosmetics;
            }
            if (genderData.randomizationRules && typeof genderData.randomizationRules === 'object') {
              randomizationRulesByFighter[fighter.id] = genderData.randomizationRules;
            }
          }
        }
      }));
    }
  } catch (e) {
    console.warn('[portrait] Could not load species data', e);
  }

  if (Object.keys(fighterPortraitOverrides).length) {
    FIGHTERS = FIGHTERS.map(fighter => {
      const override = fighterPortraitOverrides[fighter.id];
      if (!override) return fighter;
      return normalizedFighterPortrait({
        ...fighter,
        ...(override.gender    != null ? { gender:    override.gender    } : {}),
        ...(override.speciesId != null ? { speciesId: override.speciesId } : {}),
        ...(override.headXform ? { headXform: override.headXform } : {}),
        ...(override.bodyLayers ? { bodyLayers: override.bodyLayers } : {}),
        ...(override.opacityMaskLayer ? { opacityMaskLayer: override.opacityMaskLayer } : {})
      });
    });
  }

  LAST_RANDOMIZATION_RULES_BY_FIGHTER = randomizationRulesByFighter;

  return { hairFrontOptions, hairBackOptions, hairSideOptions, hairSideLOptions, eyesOptions, facialHairOptions, hatOptions, hoodOptions, torsoPortraitOptions, armPortraitOptions, indexEntries, optionCache, bodyColorRangesByGender, allowedCosmeticsByFighter, cosmeticWeightsByFighter, forcedCosmeticsByFighter, conditionalCosmeticsByFighter, randomizationRulesByFighter };
}

// ── Seeded randomisation ───────────────────────────────────

function clamp(n, lo, hi) { return Math.max(lo, Math.min(hi, n)); }

/**
 * Random color from a bodyColorRange stop table, driven by a provided rng().
 */
function randomColorFromRangeSeeded(range, rng) {
  if (!range || !range.stops || range.stops.length < 2) return { h: 0, s: 0, v: 0 };
  const h = range.minH + rng() * (range.maxH - range.minH);
  const stops = range.stops;
  let i = 0;
  while (i < stops.length - 2 && stops[i + 1].h <= h) i++;
  const s0 = stops[i], s1 = stops[i + 1];
  const t = s1.h === s0.h ? 0 : clamp((h - s0.h) / (s1.h - s0.h), 0, 1);
  const sMin = s0.sMin + t * (s1.sMin - s0.sMin);
  const sMax = s0.sMax + t * (s1.sMax - s0.sMax);
  const vMin = s0.vMin + t * (s1.vMin - s0.vMin);
  const vMax = s0.vMax + t * (s1.vMax - s0.vMax);
  return { h, s: sMin + rng() * (sMax - sMin), v: vMin + rng() * (vMax - vMin) };
}

/**
 * Generate random body colors driven by a provided rng().
 * bodyColorRanges is optional (from species data); falls back to BODYCOLOR_LIMITS.
 */
function randomBodyColorsSeeded(rng, bodyColorRanges) {
  const rh = (lo, hi) => lo + rng() * (hi - lo);
  function fallback(slot) {
    const lim = BODYCOLOR_LIMITS[slot];
    return { h: rh(lim.hMin, lim.hMax), s: rh(lim.sMin, lim.sMax), v: rh(lim.vMin, lim.vMax) };
  }
  return {
    A: bodyColorRanges && bodyColorRanges.A ? randomColorFromRangeSeeded(bodyColorRanges.A, rng) : fallback('A'),
    B: bodyColorRanges && bodyColorRanges.B ? randomColorFromRangeSeeded(bodyColorRanges.B, rng) : fallback('B'),
    C: bodyColorRanges && bodyColorRanges.C ? randomColorFromRangeSeeded(bodyColorRanges.C, rng) : fallback('C'),
  };
}

function randomInRange(rng, lo, hi) {
  return lo + rng() * (hi - lo);
}

function materialColorRangeFor(option) {
  const materialTag = option?.materialTag;
  if (!materialTag) return null;
  const materialPalettes = window.SCRATCHBONES_CONFIG?.cosmeticMaterialPalettes
    || window.CONFIG?.cosmeticMaterialPalettes;
  if (!materialPalettes || typeof materialPalettes !== 'object') return null;
  return materialPalettes[materialTag] || null;
}

function isMaterialTag(option, expectedTag) {
  if (!expectedTag || typeof expectedTag !== 'string') return false;
  return String(option?.materialTag || '').trim().toLowerCase() === expectedTag.trim().toLowerCase();
}

function applyBodyColorRulesSeeded(bodyColors, rules, rng) {
  if (!bodyColors || !rules || typeof rules !== 'object') return bodyColors;
  const result = {
    ...bodyColors,
    A: bodyColors.A ? { ...bodyColors.A } : bodyColors.A,
    B: bodyColors.B ? { ...bodyColors.B } : bodyColors.B,
    C: bodyColors.C ? { ...bodyColors.C } : bodyColors.C
  };
  const brightnessRule = rules.brightnessContrastAB;
  if (!brightnessRule || !result.A || !result.B) return result;
  const medium = brightnessRule.medium;
  const bright = brightnessRule.bright;
  if (!medium || !bright) return result;
  const flip = rng() < 0.5;
  const slotA = flip ? 'A' : 'B';
  const slotB = flip ? 'B' : 'A';
  result[slotA].v = randomInRange(rng, medium.min, medium.max);
  result[slotB].v = randomInRange(rng, bright.min, bright.max);
  return result;
}

/**
 * Weighted random pick from an array, driven by rng().
 * weights: object mapping item.id to a numeric weight (items absent from the map default to 1).
 * Falls back to uniform pick when weights is null/undefined.
 *
 * To tune cosmetic odds, add a "cosmeticWeights" block to the species JSON (e.g. mao-ao.json)
 * under the gender section:
 *   "cosmeticWeights": {
 *     "hat":       { "none": 65, "basic_headband": 28, "riverlandskasa_low": 3.5, ... },
 *     "hairFront": { "none": 5, "smooth_striped": 5, "tuft": 30, ... },
 *     "hairBack":  { "none": 50, "long_ponytail": 25, "splayedknot_medium": 25 },
 *     "hairSide":  { "none": 90, "shoulder_length_drape": 10 }
 *   }
 * Optional per-hat occlusion can be configured under "randomizationRules.hatHideRules":
 *   "hatHideRules": {
 *     "riverlandskasa_low": { "hideSlots": ["hairFront", "hairBack"] },
 *     "basic_headband": { "hideSlots": [] }
 *   }
 * Unspecified categories use uniform random. Cosmetics missing from a weight map default to weight 1.
 * Weight 0 excludes an item from selection entirely.
 */
function weightedPickRng(arr, weights, rng) {
  if (!arr || arr.length === 0) return undefined;
  if (!weights) return arr[Math.floor(rng() * arr.length)];
  const hasWeightKey = (key) => Object.prototype.hasOwnProperty.call(weights, key);
  const resolveWeight = (optionId) => {
    if (hasWeightKey(optionId)) return weights[optionId];
    const underscoreIndex = typeof optionId === 'string' ? optionId.indexOf('_') : -1;
    if (underscoreIndex > 0) {
      const suffixId = optionId.slice(underscoreIndex + 1);
      if (hasWeightKey(suffixId)) return weights[suffixId];
    }
    return 1;
  };
  const w = arr.map(o => resolveWeight(o.id));
  const total = w.reduce((a, b) => a + b, 0);
  if (total <= 0) return arr[Math.floor(rng() * arr.length)];
  let r = rng() * total;
  for (let i = 0; i < arr.length; i++) {
    r -= w[i];
    if (r <= 0) return arr[i];
  }
  return arr[arr.length - 1];
}

function resolvePortraitFighter(fighter) {
  if (!fighter) return fighter;
  const byId = FIGHTERS.find((candidate) => candidate?.id === fighter.id);
  if (byId) return byId;
  const byHead = fighter.headUrl
    ? FIGHTERS.find((candidate) => candidate?.headUrl === fighter.headUrl)
    : null;
  return byHead || fighter;
}

function noneOptionForSlot(options, fallbackLabel) {
  return options.find((option) => option?.id === 'none')
    ?? options[0]
    ?? { id: 'none', label: fallbackLabel, tintSlot: null, layers: [] };
}

function toHiddenSlotSet(rule) {
  if (!rule) return null;
  if (Array.isArray(rule.hideSlots)) {
    return new Set(rule.hideSlots.filter((slot) => typeof slot === 'string'));
  }
  if (Array.isArray(rule)) {
    return new Set(rule.filter((slot) => typeof slot === 'string'));
  }
  return null;
}

function hatHideRuleFor(hatId, randomizationRules) {
  if (!hatId || hatId === 'none') return null;
  const map = randomizationRules?.hatHideRules;
  if (!map || typeof map !== 'object') return null;
  return map[hatId] || null;
}

/**
 * Generate a fully deterministic random profile using a provided rng() function.
 * All option arrays must be supplied by the caller.
 * cosmeticWeightsByFighter (optional): object keyed by fighter.id, each value being a
 *   per-category weights map (see weightedPickRng docs above). When omitted the selection
 *   falls back to the original uniform-random behaviour.
 */
function randomProfileSeeded(rng, fighters, hairFrontOptions, hairBackOptions, hairSideOptions, hairSideLOptions, eyesOptions, facialHairOptions, bodyColorRangesByGender, allowedCosmeticsByFighter, hatOptions, hoodOptions, cosmeticWeightsByFighter, torsoPortraitOptions, armPortraitOptions, forcedCosmeticsByFighter, conditionalCosmeticsByFighter, randomizationRulesByFighter) {
  const pickRng   = (arr) => arr[Math.floor(rng() * arr.length)];
  const fighterInput = pickRng(fighters);
  const fighter = resolvePortraitFighter(fighterInput);
  const fighterEntry = allowedCosmeticsByFighter?.[fighter.id] ?? allowedCosmeticsByFighter?.[fighterInput?.id];
  const allowed   = fighterEntry instanceof Set ? fighterEntry : (fighterEntry?.set ?? null);
  const disallowedCombos = (fighterEntry instanceof Set ? [] : (fighterEntry?.disallowedCombos ?? []));
  const allowedPrefixes = allowed
    ? new Set(
      Array.from(allowed)
        .filter(id => typeof id === 'string' && id.includes('_'))
        .map(id => id.slice(0, id.indexOf('_')))
    )
    : null;
  const isAllowedId = (optionId) => {
    if (!allowed) return true;
    if (allowed.has(optionId)) return true;
    const underscoreIndex = typeof optionId === 'string' ? optionId.indexOf('_') : -1;
    if (underscoreIndex > 0) {
      const prefixId = optionId.slice(0, underscoreIndex);
      if (!allowedPrefixes?.has(prefixId)) return false;
      const suffixId = optionId.slice(underscoreIndex + 1);
      if (allowed.has(suffixId)) return true;
    }
    return false;
  };
  const filterArr = (arr) => arr && allowed ? arr.filter(o => o.id === 'none' || isAllowedId(o.id)) : arr;
  const weights   = cosmeticWeightsByFighter?.[fighter.id] ?? cosmeticWeightsByFighter?.[fighterInput?.id] ?? null;

  const filteredHairFront  = filterArr(hairFrontOptions)  ?? [];
  const filteredHairBack   = filterArr(hairBackOptions)   ?? [];
  const filteredHairSide   = filterArr(hairSideOptions)   ?? [];
  const filteredHairSideL  = filterArr(hairSideLOptions)  ?? [];
  const filteredEyes       = filterArr(eyesOptions)       ?? [];
  const filteredFacialHair = filterArr(facialHairOptions) ?? [];
  const filteredHat        = filterArr(hatOptions) ?? [{ id: 'none', label: 'No Hat', tintSlot: null, layers: [] }];
  const filteredHood       = filterArr(hoodOptions) ?? [{ id: 'none', label: 'No Hood', tintSlot: null, layers: [] }];

  let hairFront  = weightedPickRng(filteredHairFront.length  ? filteredHairFront  : [{ id: 'none', label: 'No Front Hair', tintSlot: null, layers: [] }], weights?.hairFront,  rng);
  let hairBack   = weightedPickRng(filteredHairBack.length   ? filteredHairBack   : [{ id: 'none', label: 'No Back Hair',  tintSlot: null, layers: [] }], weights?.hairBack,   rng);
  let hairSide   = weightedPickRng(filteredHairSide.length   ? filteredHairSide   : [{ id: 'none', label: 'No Side Hair (R)',  tintSlot: null, layers: [] }], weights?.hairSide,   rng);
  let hairSideL  = weightedPickRng(filteredHairSideL.length  ? filteredHairSideL  : [{ id: 'none', label: 'No Side Hair (L)',  tintSlot: null, layers: [] }], weights?.hairSideL,  rng);
  let eyes         = weightedPickRng(filteredEyes.length       ? filteredEyes       : [{ id: 'none', label: 'No Eye Mark',   tintSlot: null, layers: [] }], weights?.eyes,       rng);
  const noFacialHair = filteredFacialHair.find(o => o.id === 'none') ?? filteredFacialHair[0] ?? { id: 'none', label: 'No Facial Hair', tintSlot: null, layers: [] };
  let facialHair = weights?.facialHair
    ? weightedPickRng(filteredFacialHair.length ? filteredFacialHair : [noFacialHair], weights.facialHair, rng)
    : (rng() < 0.35 ? pickRng(filteredFacialHair.length ? filteredFacialHair : [noFacialHair]) : noFacialHair);
  const noHat      = filteredHat.find(o => o.id === 'none') ?? filteredHat[0];
  // When hat weights are configured, use a single weighted pick (weights include 'none').
  // Otherwise fall back to the original 50%-skip + uniform-pick behaviour.
  let hat = weights?.hat
    ? weightedPickRng(filteredHat.length ? filteredHat : [noHat], weights.hat, rng)
    : (rng() < 0.5 ? pickRng(filteredHat) : noHat);
  const noHood     = filteredHood.find(o => o.id === 'none') ?? filteredHood[0];
  let hood = weights?.hood
    ? weightedPickRng(filteredHood.length ? filteredHood : [noHood], weights.hood, rng)
    : noHood;

  // Enforce disallowed cosmetic combination rules.
  // Each rule specifies conditions (slot-value pairs that must all match) and
  // repairSlots (slots to try forcing to a non-none option, tried in random order).
  if (disallowedCombos.length) {
    const filteredBySlot = { hairFront: filteredHairFront, hairBack: filteredHairBack, hairSide: filteredHairSide, hairSideL: filteredHairSideL };
    let maxIter = disallowedCombos.length * 2 + 1;
    let violated = true;
    while (violated && maxIter-- > 0) {
      violated = false;
      for (const rule of disallowedCombos) {
        const cur = { hairFront, hairBack, hairSide, hairSideL };
        const matches = Object.entries(rule.conditions).every(([slot, val]) => cur[slot]?.id === val);
        if (!matches || !rule.repairSlots.length) continue;
        violated = true;
        const slots = rule.repairSlots.slice();
        if (slots.length >= 2 && rng() < 0.5) slots.reverse();
        for (const slot of slots) {
          const nonNone = (filteredBySlot[slot] || []).filter(o => o.id !== 'none');
          if (nonNone.length) {
            if      (slot === 'hairFront')  hairFront  = pickRng(nonNone);
            else if (slot === 'hairBack')   hairBack   = pickRng(nonNone);
            else if (slot === 'hairSide')   hairSide   = pickRng(nonNone);
            else if (slot === 'hairSideL')  hairSideL  = pickRng(nonNone);
            break;
          }
        }
        break; // restart rule checking after each repair
      }
    }
  }

  const hasClothingVariant = (o) => o.id === 'none' || resolveOptionLayers(o, fighter).length > 0;
  const filteredTorso = (torsoPortraitOptions ?? []).filter(hasClothingVariant);
  const filteredArm   = (armPortraitOptions   ?? []).filter(hasClothingVariant);
  const torsoCosmetic = weightedPickRng(filteredTorso.length ? filteredTorso : [{ id: 'none', label: 'No Torso Clothing', tintSlot: null, layers: [] }], weights?.torso, rng);
  const armCosmetic   = weightedPickRng(filteredArm.length   ? filteredArm   : [{ id: 'none', label: 'No Arm Clothing',   tintSlot: null, layers: [] }], weights?.overwear, rng);

  // Apply forced cosmetics — species-level slots that always override random selection.
  const forced = forcedCosmeticsByFighter?.[fighter.id] ?? forcedCosmeticsByFighter?.[fighterInput?.id];
  if (forced) {
    const filteredBySlot = { eyes: filteredEyes, facialHair: filteredFacialHair, hairFront: filteredHairFront, hairBack: filteredHairBack, hairSide: filteredHairSide, hairSideL: filteredHairSideL, hat: filteredHat, hood: filteredHood };
    for (const [slot, id] of Object.entries(forced)) {
      const opt = filteredBySlot[slot]?.find(o => o.id === id);
      if (!opt) continue;
      if      (slot === 'eyes')       eyes      = opt;
      else if (slot === 'facialHair') facialHair = opt;
      else if (slot === 'hairFront')  hairFront  = opt;
      else if (slot === 'hairBack')   hairBack   = opt;
      else if (slot === 'hairSide')   hairSide   = opt;
      else if (slot === 'hairSideL')  hairSideL  = opt;
      else if (slot === 'hat')        hat        = opt;
      else if (slot === 'hood')       hood       = opt;
    }
  }

  // Apply conditional cosmetics — rules that fire based on current slot state and clothing tags.
  const conditionals = conditionalCosmeticsByFighter?.[fighter.id] ?? conditionalCosmeticsByFighter?.[fighterInput?.id];
  if (conditionals) {
    const curSlots = { hairFront, hairBack, hairSide, hairSideL, eyes, facialHair, hat, hood };
    const filteredBySlot = { eyes: filteredEyes, facialHair: filteredFacialHair, hairFront: filteredHairFront, hairBack: filteredHairBack, hairSide: filteredHairSide, hairSideL: filteredHairSideL, hat: filteredHat, hood: filteredHood };
    for (const rule of conditionals) {
      const met = Object.entries(rule.conditions).every(([key, val]) => {
        if (key === 'anyClothingTag') return [torsoCosmetic, armCosmetic].some(c => c?.tags?.includes(val));
        return curSlots[key]?.id === val;
      });
      if (!met) continue;
      const opt = (filteredBySlot[rule.slot] || []).find(o => o.id === rule.cosmeticId);
      if (!opt) continue;
      if      (rule.slot === 'eyes')       eyes      = opt;
      else if (rule.slot === 'facialHair') facialHair = opt;
      else if (rule.slot === 'hairFront')  hairFront  = opt;
      else if (rule.slot === 'hairBack')   hairBack   = opt;
      else if (rule.slot === 'hairSide')   hairSide   = opt;
      else if (rule.slot === 'hairSideL')  hairSideL  = opt;
      else if (rule.slot === 'hat')        hat        = opt;
      else if (rule.slot === 'hood')       hood       = opt;
    }
  }

  const ruleMap = randomizationRulesByFighter || LAST_RANDOMIZATION_RULES_BY_FIGHTER || null;
  const randomizationRules = ruleMap?.[fighter.id] ?? ruleMap?.[fighterInput?.id] ?? null;
  const hatHideSlots = toHiddenSlotSet(hatHideRuleFor(hat?.id, randomizationRules));
  if (hatHideSlots?.size) {
    if (hatHideSlots.has('hairFront')) {
      hairFront = noneOptionForSlot(filteredHairFront, 'No Front Hair');
    }
    if (hatHideSlots.has('hairBack')) {
      hairBack = noneOptionForSlot(filteredHairBack, 'No Back Hair');
    }
    if (hatHideSlots.has('hairSide')) {
      hairSide = noneOptionForSlot(filteredHairSide, 'No Side Hair (R)');
    }
    if (hatHideSlots.has('hairSideL')) {
      hairSideL = noneOptionForSlot(filteredHairSideL, 'No Side Hair (L)');
    }
    if (hatHideSlots.has('facialHair')) {
      facialHair = noneOptionForSlot(filteredFacialHair, 'No Facial Hair');
    }
  }

  let bodyColors = randomBodyColorsSeeded(rng, bodyColorRangesByGender?.[fighter.id] ?? bodyColorRangesByGender?.[fighterInput?.id]);
  bodyColors = applyBodyColorRulesSeeded(bodyColors, randomizationRules, rng);

  const clothingRule = randomizationRules?.clothingColors;
  const torsoLayers = resolveOptionLayers(torsoCosmetic, fighter);
  const armLayers = resolveOptionLayers(armCosmetic, fighter);
  const hoodLayers = resolveOptionLayers(hood, fighter);
  const hasClothPiece = Boolean(torsoLayers.length || armLayers.length);
  const hasHoodPiece = Boolean(hoodLayers.length);
  const syncAcrossPieces = clothingRule?.syncAcrossPieces === true;
  const ruleRange = clothingRule?.range || null;
  const clothSourceRange = ruleRange || torsoCosmetic?.colorRange || armCosmetic?.colorRange || null;
  const hoodMaterialRange = materialColorRangeFor(hood);
  const hoodSourceRange = ruleRange || hoodMaterialRange || hood?.colorRange || null;
  const clothMaterialTag = window.CONFIG?.portraitRandomization?.materialTags?.cloth || 'cloth';
  const hatUsesClothMaterial = isMaterialTag(hat, clothMaterialTag);
  const hatMaterialRange = materialColorRangeFor(hat);
  const hatSourceRange = hatMaterialRange
    || (hatUsesClothMaterial ? (ruleRange || hat?.colorRange || null) : (hat?.colorRange || null));
  const hasPaletteB = (layers) => (layers || []).some(layer => layer?.paletteColorKey === 'B');

  if (hasClothPiece && clothSourceRange) {
    bodyColors.CLOTH = randomColorFromRangeSeeded(clothSourceRange, rng);
    if (hasPaletteB([...torsoLayers, ...armLayers])) {
      bodyColors.CLOTH_B = randomColorFromRangeSeeded(clothSourceRange, rng);
    }
  }
  if (hasHoodPiece && hoodSourceRange) {
    bodyColors.HOOD = randomColorFromRangeSeeded(hoodSourceRange, rng);
    if (hasPaletteB(hoodLayers)) {
      bodyColors.HOOD_B = randomColorFromRangeSeeded(hoodSourceRange, rng);
    }
  }
  if (hatSourceRange) {
    bodyColors.HAT = (syncAcrossPieces && hatUsesClothMaterial && bodyColors.CLOTH)
      ? bodyColors.CLOTH
      : randomColorFromRangeSeeded(hatSourceRange, rng);
  }
  return { fighter, hairFront, hairBack, hairSide, hairSideL, hood, eyes, facialHair, hat, torsoCosmetic, armCosmetic, bodyColors };
}

window.setPortraitConfig = setPortraitConfig;
window.getPortraitFighters = () => FIGHTERS;
window.getPortraitXformPreset = getPortraitXformPreset;

window.loadPortraitCosmetics = loadPortraitCosmetics;
window.renderPortraitProfile = renderProfile;
window.randomPortraitProfileSeeded = randomProfileSeeded;
