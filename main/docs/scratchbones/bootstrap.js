import { getScratchbonesGameConfig } from './config/normalizeScratchbonesGameConfig.js';
import { createInitialState } from './state/createInitialState.js';
import { applyAuthoredLayoutMode as applyAuthoredLayoutModeModule } from './layout/authoredLayout.js';
import { compareRenderedScreenSpaceModes, createLayoutDiagnosticsState, resetLayoutDiagnosticsState, summarizeRenderedScreenSpaceDrift, summarizeRenderedScreenSpaceDriftByPromotedSubtree, updateLayoutDiagnosticsState } from './layout/diagnostics.js';
import { createScratchbonesAudio } from './fx/audio.js';
import { initDebugPanelInterceptor } from './debug/panel.js';
import { initCandleLight } from './fx/candlelight.js';
import { createLayerManager } from './ui/layerManager.js';

    initDebugPanelInterceptor();
    const DEBUG_ENABLED = true;
    const scratchbonesRootConfig = window.SCRATCHBONES_CONFIG || {};
    function reportScratchbonesConfigError(message) {
      const fullMessage = `[scratchbones config] ${message}`;
      console.error(fullMessage);
      const debugBody = document.getElementById('_dbgBody');
      if (debugBody) {
        const row = document.createElement('div');
        row.className = '_dl _dl-error';
        row.textContent = fullMessage;
        debugBody.appendChild(row);
      }
      const appRoot = document.getElementById('app');
      if (appRoot) {
        appRoot.innerHTML = `<div style="padding:16px;background:#2a1414;border:1px solid #c85a5a;border-radius:12px;color:#ffdede;">${escapeHtml(fullMessage)}</div>`;
      }
      return fullMessage;
    }
    // Most recent config-boundary cleanup: Scratchbones now reads only SCRATCHBONES_CONFIG.game.
    const SCRATCHBONES_GAME = getScratchbonesGameConfig({ rootConfig: scratchbonesRootConfig, reportError: reportScratchbonesConfigError, debugEnabled: DEBUG_ENABLED });
    const RENDERED_SCREEN_SPACE_PARITY = SCRATCHBONES_GAME.layout?.diagnostics?.renderedScreenSpaceParity || {};
    const AUTHORED_BOX_KEY_BY_PROJ_ID = {
      'topbar': 'topbar',
      'sidebar': 'sidebar',
      'human-seat-zone': 'humanSeat',
      'human-seat': 'humanSeat',
      'hand': 'hand',
      'log': 'log',
      'turn-spotlight': 'turnSpotlight',
      'claim-cluster': 'claimCluster',
      'challenge-prompt': 'challengePrompt',
      'controls': 'challengePrompt',
    };
    const AUTHORED_PARENT_BOX = {};
    const AUTHORED_BOX_DEFAULTS = SCRATCHBONES_GAME.layout?.authored?.boxes || {};
    function applyRootCssCustomProperties(cssRootVars) {
      const rootStyle = document.documentElement.style;
      const entries = cssRootVars && typeof cssRootVars === 'object' ? Object.entries(cssRootVars) : [];
      for (const [key, value] of entries) {
        if (!String(key).startsWith('--')) continue;
        if (value === undefined || value === null) continue;
        rootStyle.setProperty(key, String(value));
      }
    }
    applyRootCssCustomProperties(SCRATCHBONES_GAME.cssRootVars);
    const authoredEditorState = {
      selectedId: null,
      selectedSubId: null,
      subLayerMode: false,
      pointerDrag: null,
      pointerCaptureTarget: null,
      pointerCaptureId: null,
      mode: 'none',
      lastChange: 'Editor idle.',
      gridEnabled: false,
      gridSize: 8,
    };
    function getScratchbonesLayoutMode() {
      const rawMode = String(SCRATCHBONES_GAME.layout?.mode || 'responsive').toLowerCase();
      return rawMode === 'authored' ? 'authored' : 'responsive';
    }
    function getScratchbonesAuthoredConfig() {
      const authored = SCRATCHBONES_GAME.layout?.authored || {};
      const boxes = authored.boxes && typeof authored.boxes === 'object' ? authored.boxes : {};
      const normalizedBoxes = {};
      for (const [id, fallback] of Object.entries(AUTHORED_BOX_DEFAULTS)) {
        const source = boxes[id] || {};
        normalizedBoxes[id] = {
          x: Number.isFinite(Number(source.x)) ? Number(source.x) : fallback.x,
          y: Number.isFinite(Number(source.y)) ? Number(source.y) : fallback.y,
          width: Math.max(24, Number.isFinite(Number(source.width)) ? Number(source.width) : fallback.width),
          height: Math.max(24, Number.isFinite(Number(source.height)) ? Number(source.height) : fallback.height),
        };
      }
      const rawSubOffsets = authored.subOffsets && typeof authored.subOffsets === 'object' ? authored.subOffsets : {};
      const rawSubSizes = authored.subSizes && typeof authored.subSizes === 'object' ? authored.subSizes : {};
      const subOffsets = {};
      const subSizes = {};
      for (const [projId, raw] of Object.entries(rawSubOffsets)) {
        subOffsets[projId] = {
          dx: Number.isFinite(Number(raw.dx)) ? Number(raw.dx) : 0,
          dy: Number.isFinite(Number(raw.dy)) ? Number(raw.dy) : 0,
        };
      }
      for (const [projId, raw] of Object.entries(rawSubSizes)) {
        subSizes[projId] = {
          width: Math.max(12, Number.isFinite(Number(raw.width)) ? Number(raw.width) : 12),
          height: Math.max(12, Number.isFinite(Number(raw.height)) ? Number(raw.height) : 12),
        };
      }
      SCRATCHBONES_GAME.layout.authored = {
        enabled: authored.enabled !== false,
        designWidthPx: Math.max(320, Number(authored.designWidthPx)),
        designHeightPx: Math.max(180, Number(authored.designHeightPx)),
        scaleMode: String(authored.scaleMode).toLowerCase(),
        boxes: normalizedBoxes,
        subOffsets,
        subSizes,
      };
      return SCRATCHBONES_GAME.layout.authored;
    }
    function computeAuthoredScale(liveWidth, liveHeight, designWidth, designHeight) {
      const sx = Math.max(0.001, liveWidth / Math.max(1, designWidth));
      const sy = Math.max(0.001, liveHeight / Math.max(1, designHeight));
      return Math.min(sx, sy);
    }
    function applyAuthoredBoxStyles(element, box, origin = null) {
      if (!element || !box) return;
      const left = Math.round(box.x - (origin?.x || 0));
      const top = Math.round(box.y - (origin?.y || 0));
      // Clear grid-area so the containing block is #app's padding edge, not the named grid area.
      // Without this, sidebar/humanSeat (col 3) and contextBox/log (rows 3-4) are offset by their
      // grid area's position within #app, placing them hundreds of pixels off-screen.
      element.style.gridArea = 'auto';
      element.style.transform = 'none';
      element.style.position = 'absolute';
      element.style.left = `${left}px`;
      element.style.top = `${top}px`;
      element.style.width = `${Math.round(box.width)}px`;
      element.style.height = `${Math.round(box.height)}px`;
    }
    function updateEditorStatus(message) {
      authoredEditorState.lastChange = String(message || 'Editor idle.');
      const statusEl = document.getElementById('editorStatus');
      if (statusEl) statusEl.textContent = authoredEditorState.lastChange;
    }
    function getSelectedAuthoredBox() {
      return authoredEditorState.selectedId;
    }
    function selectAuthoredBox(id) {
      authoredEditorState.selectedId = id && AUTHORED_BOX_DEFAULTS[id] ? id : null;
      renderAuthoredOverlays();
      renderAuthoredInspector();
    }
    function updateAuthoredBox(id, patch = {}) {
      const authoredConfig = getScratchbonesAuthoredConfig();
      if (!authoredConfig.boxes[id]) return;
      const current = authoredConfig.boxes[id];
      authoredConfig.boxes[id] = {
        x: Math.round(Number.isFinite(Number(patch.x)) ? Number(patch.x) : current.x),
        y: Math.round(Number.isFinite(Number(patch.y)) ? Number(patch.y) : current.y),
        width: Math.max(24, Math.round(Number.isFinite(Number(patch.width)) ? Number(patch.width) : current.width)),
        height: Math.max(24, Math.round(Number.isFinite(Number(patch.height)) ? Number(patch.height) : current.height)),
      };
      applyAuthoredLayoutMode(document.getElementById('app'), authoredConfig);
      renderAuthoredOverlays();
      renderAuthoredInspector();
    }
    function buildAuthoredLayoutExport() {
      const authored = getScratchbonesAuthoredConfig();
      return JSON.stringify({
        layout: {
          mode: getScratchbonesLayoutMode(),
          authored,
        },
      }, null, 2);
    }
    function collectRenderedScreenSpaceSnapshot() {
      const app = document.getElementById('app');
      if (!app) return {};
      const layerHost = document.getElementById('uiLayerManagerHost');
      const queryRoots = [app];
      if (layerHost) queryRoots.push(layerHost);
      const countsByProjId = new Map();
      const snapshot = {};
      const seenElements = new Set();
      for (const root of queryRoots) {
        root.querySelectorAll('[data-proj-id]').forEach((el) => {
          if (seenElements.has(el)) return;
          seenElements.add(el);
          const projId = String(el.getAttribute('data-proj-id') || '').trim();
          if (!projId) return;
          const seenCount = countsByProjId.get(projId) || 0;
          countsByProjId.set(projId, seenCount + 1);
          const key = seenCount === 0 ? projId : `${projId}#${seenCount + 1}`;
          const rect = el.getBoundingClientRect();
          snapshot[key] = {
            transform: getComputedStyle(el).transform || 'none',
            typography: collectComputedTypography(el),
            rect: {
              x: Number(rect.x.toFixed(3)),
              y: Number(rect.y.toFixed(3)),
              width: Number(rect.width.toFixed(3)),
              height: Number(rect.height.toFixed(3)),
              left: Number(rect.left.toFixed(3)),
              top: Number(rect.top.toFixed(3)),
              right: Number(rect.right.toFixed(3)),
              bottom: Number(rect.bottom.toFixed(3)),
            },
          };
        });
      }
      return snapshot;
    }
    function collectComputedTypography(element) {
      const computed = getComputedStyle(element);
      return {
        fontSize: computed.fontSize,
        lineHeight: computed.lineHeight,
        fontFamily: computed.fontFamily,
        letterSpacing: computed.letterSpacing,
        fontWeight: computed.fontWeight,
      };
    }
    function compareRenderedTypography(renderedScreenSpace, topDrift = [], modeA = 'original', modeB = 'layered') {
      const aEntries = renderedScreenSpace?.[modeA] || {};
      const bEntries = renderedScreenSpace?.[modeB] || {};
      const trackedIds = Array.from(new Set((Array.isArray(topDrift) ? topDrift : []).map((entry) => entry?.id).filter(Boolean)));
      return trackedIds.map((id) => {
        const typographyA = aEntries[id]?.typography || {};
        const typographyB = bEntries[id]?.typography || {};
        return {
          id,
          fontSize: { [modeA]: typographyA.fontSize || null, [modeB]: typographyB.fontSize || null, equal: (typographyA.fontSize || null) === (typographyB.fontSize || null) },
          lineHeight: { [modeA]: typographyA.lineHeight || null, [modeB]: typographyB.lineHeight || null, equal: (typographyA.lineHeight || null) === (typographyB.lineHeight || null) },
          fontFamily: { [modeA]: typographyA.fontFamily || null, [modeB]: typographyB.fontFamily || null, equal: (typographyA.fontFamily || null) === (typographyB.fontFamily || null) },
          letterSpacing: { [modeA]: typographyA.letterSpacing || null, [modeB]: typographyB.letterSpacing || null, equal: (typographyA.letterSpacing || null) === (typographyB.letterSpacing || null) },
          fontWeight: { [modeA]: typographyA.fontWeight || null, [modeB]: typographyB.fontWeight || null, equal: (typographyA.fontWeight || null) === (typographyB.fontWeight || null) },
        };
      });
    }
    function buildRenderedTransformsExport() {
      const activeMode = projectionUiState.showUnlayeredPreview ? 'original' : 'layered';
      return JSON.stringify({
        layout: {
          mode: getScratchbonesLayoutMode(),
          projectionPreviewMode: activeMode,
          renderedScreenSpace: {
            [activeMode]: collectRenderedScreenSpaceSnapshot(),
          },
          renderedScreenSpaceBaselineMode: 'original',
          renderedScreenSpaceCompareMode: activeMode === 'original' ? 'layered' : 'original',
          renderedScreenSpaceDelta: layoutDiagnostics.renderedScreenSpaceDelta,
          renderedScreenSpaceTopDrift: layoutDiagnostics.renderedScreenSpaceTopDrift,
          renderedScreenSpaceGroupDrift: layoutDiagnostics.renderedScreenSpaceGroupDrift,
          renderedScreenSpaceParity: layoutDiagnostics.renderedScreenSpaceParity,
        },
      }, null, 2);
    }
    function computeRenderedScreenSpaceDiagnostics(renderedScreenSpace, modeA = 'original', modeB = 'layered') {
      const deltas = compareRenderedScreenSpaceModes(renderedScreenSpace, modeA, modeB);
      const topDrift = summarizeRenderedScreenSpaceDrift(deltas);
      const groupedDrift = summarizeRenderedScreenSpaceDriftByPromotedSubtree(deltas);
      return {
        renderedScreenSpaceDelta: {
          modeA,
          modeB,
          deltas,
        },
        renderedScreenSpaceTopDrift: topDrift,
        renderedScreenSpaceGroupDrift: groupedDrift,
        renderedScreenSpaceParity: RENDERED_SCREEN_SPACE_PARITY,
      };
    }
    async function captureRenderedScreenSpaceBothModes() {
      const previousPreviewState = projectionUiState.showUnlayeredPreview;
      const nextFrame = () => new Promise((resolve) => {
        if (typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(() => resolve());
          return;
        }
        setTimeout(resolve, 0);
      });
      const renderAndWaitForStableLayout = async () => {
        render();
        await nextFrame();
        const app = document.getElementById('app');
        if (app && shouldRenderLayerManagedUi()) SCRATCHBONES_LAYER_MANAGER.sync(app);
        await nextFrame();
      };
      const captureModeSnapshot = async (showUnlayeredPreview) => {
        projectionUiState.showUnlayeredPreview = showUnlayeredPreview;
        await renderAndWaitForStableLayout();
        return collectRenderedScreenSpaceSnapshot();
      };
      try {
        const originalSnapshot = await captureModeSnapshot(true);
        const layeredSnapshot = await captureModeSnapshot(false);
        const renderedScreenSpace = {
          original: originalSnapshot,
          layered: layeredSnapshot,
        };
        updateLayoutDiagnosticsState(layoutDiagnostics, {
          renderedScreenSpace,
          renderedScreenSpaceBaselineMode: 'original',
          renderedScreenSpaceCompareMode: 'layered',
          renderedScreenSpaceParity: RENDERED_SCREEN_SPACE_PARITY,
        });
        return renderedScreenSpace;
      } finally {
        projectionUiState.showUnlayeredPreview = previousPreviewState;
        await renderAndWaitForStableLayout();
      }
    }
    async function buildRenderedTransformsDualModeExport() {
      const renderedScreenSpace = await captureRenderedScreenSpaceBothModes();
      const { renderedScreenSpaceDelta, renderedScreenSpaceTopDrift, renderedScreenSpaceGroupDrift } = computeRenderedScreenSpaceDiagnostics(renderedScreenSpace, 'original', 'layered');
      const renderedScreenSpaceTypographyDiagnostics = compareRenderedTypography(renderedScreenSpace, renderedScreenSpaceTopDrift, 'original', 'layered');
      return JSON.stringify({
        layout: {
          mode: getScratchbonesLayoutMode(),
          projectionPreviewMode: 'both',
          renderedScreenSpaceBaselineMode: 'original',
          renderedScreenSpaceCompareMode: 'layered',
          renderedScreenSpace,
          renderedScreenSpaceDelta,
          renderedScreenSpaceTopDrift,
          renderedScreenSpaceGroupDrift,
          renderedScreenSpaceTypographyDiagnostics,
        },
      }, null, 2);
    }
    function normalizeErrorForLogging(error) {
      if (error instanceof Error) return { name: error.name, message: error.message, stack: error.stack || null };
      if (error && typeof error === 'object') {
        const normalized = {};
        for (const [key, value] of Object.entries(error)) normalized[key] = value;
        return Object.keys(normalized).length ? normalized : { value: String(error) };
      }
      return { value: String(error) };
    }
    async function copyTextToClipboard(payload) {
      const text = String(payload || '');
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return;
        } catch (error) {
          console.warn('Clipboard API copy failed; falling back to execCommand copy.', normalizeErrorForLogging(error));
        }
      }
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', 'readonly');
      ta.style.position = 'fixed';
      ta.style.top = '-9999px';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      const copied = document.execCommand('copy');
      document.body.removeChild(ta);
      if (!copied) throw new Error('Clipboard copy failed for both Clipboard API and execCommand fallback.');
    }
    function applyAuthoredLayoutMode(app, authoredConfig) {
      return applyAuthoredLayoutModeModule({ app, authoredConfig, authoredBoxKeyByProjId: AUTHORED_BOX_KEY_BY_PROJ_ID, authoredParentBox: AUTHORED_PARENT_BOX, applyAuthoredBoxStyles });
    }
    const CHALLENGE_TIMER_SECS = SCRATCHBONES_GAME.timers.challengeTimerSecs;
    const DEBUG_OPTIONS = SCRATCHBONES_GAME.debug || {};
    const DEBUG_TRACE = DEBUG_OPTIONS.trace || {};
    const DEBUG_EVENT_LOG_LIMIT = Math.max(50, Number(DEBUG_OPTIONS.eventLogLimit) || 300);
    window.__scratchbonesDebugEvents = window.__scratchbonesDebugEvents || [];
    function traceEvent(level, channel, payload = {}) {
      if (DEBUG_OPTIONS.enabled === false) return;
      if (level === 'debug' && DEBUG_OPTIONS.includeConsoleDebug === false) return;
      const entry = { ts: Date.now(), level, channel, payload };
      window.__scratchbonesDebugEvents.unshift(entry);
      window.__scratchbonesDebugEvents = window.__scratchbonesDebugEvents.slice(0, DEBUG_EVENT_LOG_LIMIT);
      const logger = console[level] || console.log;
      logger(`[scratchbones:${channel}]`, payload);
    }
    const traceGameplay = (channel, payload = {}, level = 'debug') => {
      if (DEBUG_TRACE.gameplayFlow === false) return;
      traceEvent(level, channel, payload);
    };
    const traceAudio = (level, channel, payload = {}) => {
      if (DEBUG_TRACE.audio === false) return;
      traceEvent(level, channel, payload);
    };
    const traceCandlelight = (level, channel, payload = {}) => {
      if (DEBUG_TRACE.candlelight === false) return;
      traceEvent(level, channel, payload);
    };
    const SCRATCHBONES_LAYER_MANAGER = createLayerManager({ gameConfig: SCRATCHBONES_GAME, debugLog: traceEvent });
    const SCRATCHBONES_AUDIO = createScratchbonesAudio(SCRATCHBONES_GAME, { debugLog: traceAudio });
    function hashStringToSeed(text) {
      return window.SCRATCHBONES_NAME_GENERATOR.hashStringToSeed(text);
    }
    function generateNameFromSeed(seedString, gender = 'male', cultureId) {
      return window.SCRATCHBONES_NAME_GENERATOR.generateIdentityFromSeed(seedString, gender, cultureId);
    }
    function generateAiIdentity(index, cultureId) {
      const identitySeed = `${NAME_SEED_PREFIX}-${state.seed}-${index}`;
      const gender = (hashStringToSeed(identitySeed) & 1) === 0 ? 'male' : 'female';
      const name = generateNameFromSeed(identitySeed, gender, cultureId);
      return {
        name,
        seed: name,
        gender,
        personality: derivePersonality(name),
      };
    }
    // Deterministic hash: same seed string always yields same personality
    function hashSeed(seed, salt) {
      let h = (salt * 2654435761) >>> 0;
      for (let i = 0; i < seed.length; i++) {
        h = Math.imul(h ^ seed.charCodeAt(i), 2246822519) >>> 0;
        h ^= h >>> 16;
      }
      return h / 4294967296;
    }
    function clamp01(n) {
      return Math.max(0, Math.min(1, n));
    }
    function derivePersonality(seed) {
      const roleCycle = ['bold_liar', 'tricky_neutral', 'careful_honest'];
      const roleIndex = Math.floor(hashSeed(seed, 97) * roleCycle.length);
      const role = roleCycle[roleIndex];
      const aggressionBase = hashSeed(seed, 1);
      const suspicionBase = hashSeed(seed, 2);
      const courageBase = hashSeed(seed, 3);
      const solidarityBase = hashSeed(seed, 4);
      const greedBase = hashSeed(seed, 5);
      const honestyBase = hashSeed(seed, 6);
      if (role === 'bold_liar') {
        return {
          archetype: 'Bold liar',
          aggression: clamp01(0.78 + aggressionBase * 0.2),
          suspicion: clamp01(0.52 + suspicionBase * 0.28),
          courage: clamp01(0.66 + courageBase * 0.26),
          solidarity: clamp01(0.2 + solidarityBase * 0.55),
          greed: clamp01(0.62 + greedBase * 0.28),
          honesty: clamp01(0.14 + honestyBase * 0.18),
          overSuspects: suspicionBase > 0.45,
        };
      }
      if (role === 'tricky_neutral') {
        return {
          archetype: 'Tricky neutral',
          aggression: clamp01(0.48 + aggressionBase * 0.18),
          suspicion: clamp01(0.58 + suspicionBase * 0.26),
          courage: clamp01(0.46 + courageBase * 0.24),
          solidarity: clamp01(0.25 + solidarityBase * 0.45),
          greed: clamp01(0.48 + greedBase * 0.22),
          honesty: clamp01(0.42 + honestyBase * 0.16),
          overSuspects: suspicionBase > 0.25,
        };
      }
      return {
        archetype: 'Careful honest',
        aggression: clamp01(0.1 + aggressionBase * 0.18),
        suspicion: clamp01(0.48 + suspicionBase * 0.24),
        courage: clamp01(0.18 + courageBase * 0.22),
        solidarity: clamp01(0.3 + solidarityBase * 0.45),
        greed: clamp01(0.28 + greedBase * 0.2),
        honesty: clamp01(0.76 + honestyBase * 0.16),
        overSuspects: suspicionBase > 0.7,
      };
    }
    function personalityTags(p) {
      const tags = [];
      if (p.archetype) tags.push(p.archetype);
      if      (p.aggression  > 0.72) tags.push('Bluffs big');
      else if (p.aggression  > 0.56) tags.push('Pressure plays');
      else if (p.honesty !== undefined && p.honesty > 0.74) tags.push('Truth baits');
      if      (p.overSuspects || p.suspicion > 0.76) tags.push('Over-suspects');
      else if (p.suspicion   > 0.6) tags.push('Suspicious');
      else if (p.suspicion   < 0.24) tags.push('Trusting');
      if      (p.courage     > 0.66) tags.push('Bold bettor');
      else if (p.courage     < 0.34) tags.push('Folds easy');
      if      (p.solidarity  > 0.66) tags.push('Backs others');
      if      (p.greed       > 0.66) tags.push('Dumps big');
      return tags.length ? tags.join(' · ') : 'Balanced';
    }
 // Used by: debug panel rendering and state dumps.
    const AI_THINK_MS = SCRATCHBONES_GAME.timers.aiThinkMs; // Used by: AI turn pacing so mobile play stays readable.
    const AI_DECISION_DELAYS = SCRATCHBONES_GAME.timers.aiDecisionDelays || {};
    const AI_CONFIG = SCRATCHBONES_GAME.ai || {};
    const START_HAND_SIZE = SCRATCHBONES_GAME.deck.handSize; // Used by: dealing fresh hands at match start and after a clear.
    const WILD_COUNT = SCRATCHBONES_GAME.deck.wildCount; // Used by: deck construction and bluff validation.
    const TRICK_CARD_COUNTS = SCRATCHBONES_GAME.deck.trickCardCounts || {};
    const RANK_COUNT = SCRATCHBONES_GAME.deck.rankCount;
    const COPIES_PER_RANK = SCRATCHBONES_GAME.deck.copiesPerRank;
    const PLAYER_NAMES = SCRATCHBONES_GAME.deck.humanNames; // Optional authored names; Mao-ao generation is the fallback for any seat.
    const NAME_SEED_PREFIX = SCRATCHBONES_GAME.nameGeneration.seedPrefix;
    const CONFIG = {
      startingChips: SCRATCHBONES_GAME.chips.startingChips,
      challengeBaseTransfer: SCRATCHBONES_GAME.chips.challengeBaseTransfer,
      concedeRoundChipLoss: SCRATCHBONES_GAME.chips.concedeRoundChipLoss,
      walletDisplay: SCRATCHBONES_GAME.chips.walletDisplay || {},
      poolDisplay: SCRATCHBONES_GAME.chips.poolDisplay || {},
      challengeStakeTiers: SCRATCHBONES_GAME.chips.challengeStakeTiers,
      challengeStakeAnimation: SCRATCHBONES_GAME.chips.challengeStakeAnimation,
      clearBonusBase: SCRATCHBONES_GAME.chips.clearBonusBase,
      clearBonusIncrement: SCRATCHBONES_GAME.chips.clearBonusIncrement,
      anteStart: SCRATCHBONES_GAME.chips.anteStart,
      anteIncrement: SCRATCHBONES_GAME.chips.anteIncrement,
      aiChallengeThreshold: Number(AI_CONFIG.challengeThreshold),
      aiChallengeRandomNudgeMax: Number(AI_CONFIG.challengeRandomNudgeMax),
      aiBettingConfidenceSuspicionWeight: Number(AI_CONFIG.bettingConfidenceSuspicionWeight),
      assets: SCRATCHBONES_GAME.assets,
    };
    const STAKE_TIERS = (Array.isArray(CONFIG.challengeStakeTiers) ? CONFIG.challengeStakeTiers : [])
      .map((tier) => ({
        id: String(tier?.id || ''),
        value: Number(tier?.value) || 0,
      }))
      .filter((tier) => tier.id && tier.value > 0)
      .sort((a, b) => a.value - b.value);
    const STAKE_TIER_BY_ID = Object.fromEntries(STAKE_TIERS.map((tier) => [tier.id, tier]));
    const STAKE_COIN_SRC = CONFIG.assets.stakeTierCoinSrc;
    const STAKE_COIN_FALLBACK_TIER_ID = String(CONFIG.assets.coinFallbackTierId);
    const WALLET_TIERS = (Array.isArray(CONFIG.walletDisplay.tiers) ? CONFIG.walletDisplay.tiers : [])
      .map((tier) => ({ id: String(tier?.id || ''), value: Number(tier?.value) || 0 }))
      .filter((tier) => tier.id && tier.value > 0)
      .sort((a, b) => b.value - a.value);
    const MAX_WALLET_ICONS_PER_SEAT = Math.max(1, Number(CONFIG.walletDisplay.maxIconsPerSeat) || 18);
    const TABLE_POOL_DISPLAY = CONFIG.poolDisplay || {};
    function stakeCoinSrcForTier(tierId) {
      const fallback = STAKE_COIN_SRC[STAKE_COIN_FALLBACK_TIER_ID] || CONFIG.assets.cinematicTokenIconSrc;
      return STAKE_COIN_SRC[tierId] || fallback;
    }
    function coinBreakdownForChips(chipCount) {
      const safeChipCount = Math.max(0, Number(chipCount) || 0);
      if (!WALLET_TIERS.length) return [];
      let remaining = safeChipCount;
      const breakdown = [];
      for (const tier of WALLET_TIERS) {
        const count = Math.floor(remaining / tier.value);
        if (count > 0) breakdown.push({ ...tier, count });
        remaining -= count * tier.value;
      }
      return breakdown;
    }
    function renderSeatCoinRow(player) {
      const breakdown = coinBreakdownForChips(player?.chips);
      if (!breakdown.length) return '<div class="seatCoinRow seatCoinRowEmpty" aria-hidden="true" style="min-height:20px;"></div>';
      const icons = [];
      for (const tier of breakdown) {
        for (let index = 0; index < tier.count; index += 1) {
          icons.push(`<img class="seatCoinIcon" style="width:24px;height:24px;object-fit:contain;margin-left:-8px;filter:drop-shadow(0 1px 2px rgba(0,0,0,.55));" src="${escapeHtml(stakeCoinSrcForTier(tier.id))}" data-fallback-src="${escapeHtml(stakeCoinSrcForTier(STAKE_COIN_FALLBACK_TIER_ID))}" alt="${escapeHtml(tier.id)} coin">`);
        }
      }
      const overflow = Math.max(0, icons.length - MAX_WALLET_ICONS_PER_SEAT);
      const visibleIcons = overflow > 0 ? icons.slice(0, MAX_WALLET_ICONS_PER_SEAT) : icons;
      return `<div class="seatCoinRow" style="display:flex;align-items:center;min-height:24px;padding-left:8px;margin:4px 0 2px;">${visibleIcons.join('')}${overflow > 0 ? `<span class="seatCoinOverflow" style="margin-left:6px;font-size:.76rem;color:var(--muted);">+${overflow}</span>` : ''}</div>`;
    }

    function renderTablePoolPile(chipCount, pileSeedInput, anchorXPct, anchorYPct) {
      const breakdown = coinBreakdownForChips(chipCount);
      const pileMaxIcons = Math.max(1, Number(TABLE_POOL_DISPLAY.maxIcons) || 28);
      const pileWidthPx = Math.max(100, Number(TABLE_POOL_DISPLAY.widthPx) || 220);
      const pileHeightPx = Math.max(60, Number(TABLE_POOL_DISPLAY.heightPx) || 96);
      const coinSizePx = Math.max(16, Number(TABLE_POOL_DISPLAY.coinSizePx) || 30);
      const spreadXPx = Math.max(10, Number(TABLE_POOL_DISPLAY.spreadXPx) || 84);
      const spreadYPx = Math.max(8, Number(TABLE_POOL_DISPLAY.spreadYPx) || 28);
      const offsetYPx = Number(TABLE_POOL_DISPLAY.offsetYPx) || 2;
      if (!breakdown.length) return '';
      const icons = [];
      for (const tier of breakdown) {
        for (let index = 0; index < tier.count; index += 1) icons.push(tier.id);
      }
      const overflow = Math.max(0, icons.length - pileMaxIcons);
      const visibleIcons = overflow > 0 ? icons.slice(0, pileMaxIcons) : icons;
      const baseSeed = Math.round(Number(pileSeedInput) || 0) >>> 0;
      const pileSeed = (baseSeed ^ ((Math.round(Number(chipCount) || 0) * 2654435761) >>> 0)) >>> 0;
      const pileHtml = visibleIcons.map((tierId, index) => {
        const localSeed = (((pileSeed + (index + 1) * 1013904223) >>> 0) % 10000) / 10000;
        const localSeedB = (((pileSeed + (index + 1) * 1664525) >>> 0) % 10000) / 10000;
        const xPx = (localSeed - 0.5) * spreadXPx * 2;
        const yPx = (localSeedB - 0.5) * spreadYPx * 2;
        const rotateDeg = (localSeedB - 0.5) * 46;
        const z = 1 + index;
        return `<img class="tablePoolCoin" src="${escapeHtml(stakeCoinSrcForTier(tierId))}" data-fallback-src="${escapeHtml(stakeCoinSrcForTier(STAKE_COIN_FALLBACK_TIER_ID))}" alt="${escapeHtml(tierId)} coin" style="position:absolute;left:50%;top:50%;width:${coinSizePx}px;height:${coinSizePx}px;object-fit:contain;transform:translate(calc(-50% + ${xPx.toFixed(1)}px),calc(-50% + ${yPx.toFixed(1)}px)) rotate(${rotateDeg.toFixed(1)}deg);filter:drop-shadow(0 2px 3px rgba(0,0,0,.45));z-index:${z};">`;
      }).join('');
      const overflowHtml = overflow > 0 ? `<span class="tablePoolOverflow" style="position:absolute;right:6px;bottom:2px;font-size:.76rem;color:var(--muted);">+${overflow}</span>` : '';
      return `<div class="tablePoolPile" data-proj-id="claim-pool-pile" style="position:absolute;left:${(anchorXPct * 100).toFixed(3)}%;top:calc(${(anchorYPct * 100).toFixed(3)}% + ${offsetYPx.toFixed(1)}px);transform:translateX(-50%);width:${pileWidthPx}px;height:${pileHeightPx}px;pointer-events:none;z-index:1;"><div class="tablePoolCoins" style="position:relative;width:100%;height:100%;">${pileHtml}${overflowHtml}</div></div>`;
    }
    const { gameState: state, uiDebugState } = createInitialState(SCRATCHBONES_GAME);
    const layoutDiagnostics = createLayoutDiagnosticsState();
   function mulberry32(a) {
      return function() {
        let t = a += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
      }
    }
    let rand = mulberry32(state.seed);
    function rngInt(min, max) {
      return Math.floor(rand() * (max - min + 1)) + min;
    }
    function shuffle(arr) {
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    }
    function createDeck() {
      const deck = [];
      let id = 1;
      for (let rank = 1; rank <= RANK_COUNT; rank++) {
        for (let copy = 0; copy < COPIES_PER_RANK; copy++) {
          deck.push({ id: id++, rank, wild: false });
        }
      }
      for (let i = 0; i < WILD_COUNT; i++) deck.push({ id: id++, rank: null, wild: true });
      const trickSpecs = [
        { key: 'smuggle', count: Number(TRICK_CARD_COUNTS.smuggle) || 0 },
        { key: 'trap', count: Number(TRICK_CARD_COUNTS.trap) || 0 },
        { key: 'punish', count: Number(TRICK_CARD_COUNTS.punish) || 0 },
      ];
      for (const spec of trickSpecs) {
        for (let i = 0; i < Math.max(0, spec.count); i++) {
          deck.push({ id: id++, rank: null, wild: spec.key === 'trap', trickType: spec.key });
        }
      }
      return shuffle(deck);
    }
    function sortCards(a, b) {
      if (a.wild && !b.wild) return 1;
      if (!a.wild && b.wild) return -1;
      if (a.wild && b.wild) return a.id - b.id;
      return a.rank - b.rank || a.id - b.id;
    }

    function deckCompositionSnapshot() {
      const rankCounts = {};
      for (let rank = 1; rank <= RANK_COUNT; rank += 1) {
        rankCounts[rank] = Math.max(0, Number(COPIES_PER_RANK) || 0);
      }
      const trickCounts = {
        smuggle: Math.max(0, Number(TRICK_CARD_COUNTS.smuggle) || 0),
        trap: Math.max(0, Number(TRICK_CARD_COUNTS.trap) || 0),
        punish: Math.max(0, Number(TRICK_CARD_COUNTS.punish) || 0),
      };
      const wildCount = Math.max(0, Number(WILD_COUNT) || 0);
      const totalCards = Object.values(rankCounts).reduce((sum, count) => sum + count, 0)
        + wildCount
        + Object.values(trickCounts).reduce((sum, count) => sum + count, 0);
      return { totalCards, rankCounts, trickCounts, wildCount };
    }
    function resolveSeatName(index, generatedName) {
      const configuredName = PLAYER_NAMES[index] || (index === 0 ? PLAYER_NAMES[0] : null);
      if (typeof configuredName === 'string' && configuredName.trim()) return configuredName;
      return generatedName;
    }
    function makePlayers() {
      return Array.from({ length: SCRATCHBONES_GAME.deck.playerCount }, (_, index) => {
        const aiIdentity = generateAiIdentity(index);
        return {
          id: index,
          name: resolveSeatName(index, aiIdentity.name),
          hand: [],
          chips: CONFIG.startingChips,
          eliminated: false,
          isHuman: index === 0,
          lastAction: 'Ready',
          clears: 0,
          seed: aiIdentity.seed,
          gender: aiIdentity.gender,
          personality: index === 0 ? null : aiIdentity.personality,
          reads: {},
        };
      });
    }
    function inferPlayerCultureFromProfile(player) {
      const cultureCfg = SCRATCHBONES_GAME.nameGeneration?.aiCultureSelection || {};
      const speciesToCultureId = cultureCfg.speciesToCultureId || {};
      const fallbackCultureId = cultureCfg.fallbackCultureId || SCRATCHBONES_GAME.nameGeneration?.defaultCultureId;
      if (!cultureCfg.usePortraitSpeciesCulture) return fallbackCultureId;
      const fighter = player?.profile?.fighter;
      const speciesId = fighter?.speciesId || null;
      if (speciesId && speciesToCultureId[speciesId]) return speciesToCultureId[speciesId];
      const fighterId = String(fighter?.id || '').toLowerCase();
      if ((fighterId === 'm' || fighterId === 'f') && speciesToCultureId.mao_ao) return speciesToCultureId.mao_ao;
      return fallbackCultureId;
    }
    function applyAiNamesByPortraitCulture() {
      for (const player of state.players) {
        if (player.isHuman) continue;
        const cultureId = inferPlayerCultureFromProfile(player);
        const aiIdentity = generateAiIdentity(player.id, cultureId);
        player.name = resolveSeatName(player.id, aiIdentity.name);
        player.seed = aiIdentity.seed;
        player.gender = aiIdentity.gender;
        player.personality = aiIdentity.personality;
      }
    }
    function alivePlayers() {
      return state.players.filter(p => !p.eliminated);
    }
    function nextAliveIndex(start) {
      let i = start;
      for (let steps = 0; steps < state.players.length; steps++) {
        i = (i + 1) % state.players.length;
        if (!state.players[i].eliminated) return i;
      }
      return start;
    }
    function previousAliveIndex(start) {
      let i = start;
      for (let steps = 0; steps < state.players.length; steps++) {
        i = (i - 1 + state.players.length) % state.players.length;
        if (!state.players[i].eliminated) return i;
      }
      return start;
    }
    function hasConcededThisRound(playerIndex) {
      return state.roundConcessions.has(playerIndex);
    }
    function isEligibleForCurrentRound(playerIndex) {
      const player = state.players[playerIndex];
      return !!player && !player.eliminated && !hasConcededThisRound(playerIndex);
    }
    function nextRoundEligibleIndex(start) {
      let i = start;
      for (let steps = 0; steps < state.players.length; steps++) {
        i = (i + 1) % state.players.length;
        if (isEligibleForCurrentRound(i)) return i;
      }
      return null;
    }
    function currentDeclarerIndex() {
      const lastPlay = state.pile[state.pile.length - 1];
      return lastPlay ? lastPlay.playerIndex : state.leaderIndex;
    }
    function maybeEndRoundFromConcessions() {
      if (state.declaredRank === null || !state.pile.length) return false;
      const declarerId = currentDeclarerIndex();
      const remainingOpponents = alivePlayers().filter(p => p.id !== declarerId && !hasConcededThisRound(p.id));
      if (remainingOpponents.length > 0) return false;
      addLog(`Everyone else concedes the claim. ${seatLabel(state.players[declarerId])} wins the round uncontested.`);
      openNewRound(declarerId);
      return true;
    }
    function selectedCards() {
      return state.players[0].hand.filter(c => state.selectedCardIds.has(c.id));
    }
    function addLog(text) {
      state.logs.unshift({ text, ts: Date.now() });
      state.logs = state.logs.slice(0, 30);
    }
    function seatLabel(playerOrIndex) {
      const player = typeof playerOrIndex === 'number' ? state.players[playerOrIndex] : playerOrIndex;
      if (!player) return 'Seat ?';
      const seatNumber = Number(player.id) + 1;
      return `Seat ${seatNumber} · ${player.name}`;
    }
    function seatFirstName(playerOrIndex) {
      const player = typeof playerOrIndex === 'number' ? state.players[playerOrIndex] : playerOrIndex;
      if (!player) return 'Seat ?';
      if (player.isHuman) return 'You';
      return String(player.name || '').trim().split(/\s+/)[0] || `Seat ${Number(player.id) + 1}`;
    }
    function setBanner(text) {
      state.banner = text;
    }
    function collectAnteForNewRound() {
      let totalPaid = 0;
      for (const player of state.players) {
        if (player.eliminated) continue;
        const paid = transferToBank(player.id, state.ante);
        totalPaid += paid;
        if (paid > 0) addLog(`${seatLabel(player)} antes ${paid} chip${paid === 1 ? '' : 's'} to the table pot.`);
      }
      state.tablePot += totalPaid;
      return totalPaid;
    }

    function dealFreshHands() {
      const deck = createDeck();
      for (const player of state.players) {
        if (player.eliminated) {
          player.hand = [];
          continue;
        }
        player.hand = deck.splice(0, START_HAND_SIZE).sort(sortCards);
        player.lastAction = player.lastAction === 'Out of chips' ? player.lastAction : 'Waiting';
      }
    }
    function refillHandsAfterClearInTurnOrder(clearerIndex) {
      const deck = createDeck();
      const drawOrder = [];
      for (let offset = 0; offset < state.players.length; offset++) {
        drawOrder.push((clearerIndex + offset) % state.players.length);
      }
      let dealtInPass = true;
      while (deck.length && dealtInPass) {
        dealtInPass = false;
        for (const playerIndex of drawOrder) {
          if (!deck.length) break;
          const player = state.players[playerIndex];
          if (player.eliminated || player.hand.length >= START_HAND_SIZE) continue;
          player.hand.push(deck.shift());
          dealtInPass = true;
        }
      }
      for (const player of state.players) {
        if (player.eliminated) {
          player.hand = [];
          continue;
        }
        player.hand.sort(sortCards);
        player.lastAction = player.lastAction === 'Out of chips' ? player.lastAction : 'Waiting';
      }
    }
    function startGame() {
      SCRATCHBONES_AUDIO.startPlaylist();
      clearChallengeTimer();
      state.seed = Math.floor(Math.random() * 1e9);
      state.poolVisualSeed = Math.floor(Math.random() * 1e9);
      rand = mulberry32(state.seed);
      state.players = makePlayers();
      state.selectedCardIds.clear();
      state.pile = [];
      state.challengeWindow = null;
      state.betting = null;
      clearChallengeIntro();
      state.declaredRank = null;
      state.gameOver = false;
      state.winnerIndex = null;
      state.logs = [];
      traceGameplay('deck-composition', deckCompositionSnapshot(), 'info');
      state.round = 1;
      state.roundConcessions.clear();
      state.stats = { successfulChallenges: 0, failedChallenges: 0, bluffsCaught: 0, safeTruths: 0, totalClears: 0, chipsMovedByChallenges: 0 };
      state.ante = Math.max(1, Number(CONFIG.anteStart) || 1);
      state.tablePot = 0;
      collectAnteForNewRound();
      if (checkGameOverBySurvivors()) {
        render();
        return true;
      }
      dealFreshHands();
      for (const p of state.players) p.profile = generatePlayerProfile(p);
      applyAiNamesByPortraitCulture();
      for (const p of state.players) logPlayerPortraitXforms(p);
      state.leaderIndex = rngInt(0, state.players.length - 1);
      state.currentTurn = state.leaderIndex;
      setBanner(state.currentTurn === 0 ? SCRATCHBONES_GAME.uiText.yourLeadBanner : `${seatLabel(state.currentTurn)} opens the round.`);
      addLog(`A new match begins. ${seatLabel(state.leaderIndex)} leads the first round.`);
      render();
      if (state.currentTurn !== 0) scheduleAiTurn();
    }
    function toggleSelect(cardId) {
      if (state.gameOver || state.currentTurn !== 0 || state.challengeWindow || state.betting) return;
      if (state.selectedCardIds.has(cardId)) state.selectedCardIds.delete(cardId);
      else state.selectedCardIds.add(cardId);
      render();
    }
    function humanPlay() {
      if (state.betting) return;
      const cards = selectedCards();
      const declaredRank = Number(document.getElementById('declareRank').value);
      if (!cards.length) {
        setBanner(SCRATCHBONES_GAME.uiText.pickCardWarning, 'warn');
        render();
        return;
      }
      if (state.declaredRank !== null && declaredRank !== state.declaredRank) {
        setBanner(`This round is locked to ${state.declaredRank}.`, 'warn');
        render();
        return;
      }
      performPlay(0, cards.map(c => c.id), declaredRank);
    }
    function humanConcedeRound() {
      if (state.gameOver || state.currentTurn !== 0 || state.challengeWindow || state.betting) return;
      if (state.declaredRank === null) {
        setBanner('You can only concede after a declaration exists.', 'warn');
        render();
        return;
      }
      const amount = transferToBank(0, CONFIG.concedeRoundChipLoss, 'You concede the claim and pay 1 chip to the bank.');
      state.players[0].lastAction = 'Conceded round';
      if (amount <= 0) return;
      state.roundConcessions.add(0);
      if (maybeEndRoundFromConcessions()) return;
      const nextPlayer = nextRoundEligibleIndex(0);
      if (nextPlayer === null) {
        openNewRound(currentDeclarerIndex());
        return;
      }
      state.currentTurn = nextPlayer;
      setBanner(`${seatLabel(state.players[nextPlayer])} is up on ${state.declaredRank}.`);
      render();
      if (nextPlayer !== 0) scheduleAiTurn();
    }
    function performPlay(playerIndex, cardIds, declaredRank) {
      const player = state.players[playerIndex];
      const cards = player.hand.filter(c => cardIds.includes(c.id));
      if (!cards.length) return;
      player.hand = player.hand.filter(c => !cardIds.includes(c.id));
      player.hand.sort(sortCards);
      const truthful = cards.every(c => c.wild || c.rank === declaredRank);
      state.declaredRank = declaredRank;
      const play = {
        playerIndex,
        cards,
        declaredRank,
        truthful,
        actualSummary: cards.map(c => c.wild ? 'W' : String(c.rank)).join(', '),
      };
      state.pile.push(play);
      observeClaimForReads(play);
      player.lastAction = truthful ? `Played ${cards.length}` : `Bluffed ${cards.length}`;
      if (truthful) state.stats.safeTruths += 1;
      state.selectedCardIds.clear();
      addLog(`${seatLabel(player)} declares ${cards.length} × ${declaredRank}.`);
      setBanner(player.isHuman
        ? `You declared ${cards.length} × ${declaredRank}. Opponents may challenge.`
        : `${seatLabel(player)} declared ${cards.length} × ${declaredRank}. You may challenge now.`);
      const backups = alivePlayers().map(p => p.id).filter(id => id !== playerIndex && !hasConcededThisRound(id));
      state.challengeWindow = {
        lastPlay: play,
        challengerOptions: backups,
        backupCandidates: backups,
      };
      traceGameplay('claim.opened', {
        playerIndex,
        declaredRank,
        cardsPlayed: cards.length,
        truthful,
        challengerOptions: backups,
      });
      render();
      if (playerIndex !== 0) {
        startChallengeTimer();
      }
      scheduleAiChallengeWindowDecisions(playerIndex);
    }
    function countKnownRank(rank) {
      let count = 0;
      for (const play of state.pile) {
        for (const card of play.cards) {
          if (!card.wild && card.rank === rank) count++;
        }
      }
      return count;
    }
    function countVisibleWilds() {
      let count = 0;
      for (const play of state.pile) {
        for (const card of play.cards) if (card.wild) count++;
      }
      return count;
    }
    function ensureReadProfile(observerIndex, targetIndex) {
      const observer = state.players[observerIndex];
      if (!observer) return null;
      if (!observer.reads) observer.reads = {};
      if (!observer.reads[targetIndex]) {
        observer.reads[targetIndex] = {
          truthfulCount: 0,
          bluffCount: 0,
          challengeWins: 0,
          challengeLosses: 0,
          repeatRankCount: 0,
          repeatedCount: 0,
          quickJudgmentBias: 0,
          currentTruthStreak: 0,
          currentBluffStreak: 0,
          lastDeclaredRank: null,
        };
      }
      return observer.reads[targetIndex];
    }
    function observeClaimForReads(play) {
      for (const observer of state.players) {
        if (observer.eliminated || observer.id === play.playerIndex) continue;
        const read = ensureReadProfile(observer.id, play.playerIndex);
        if (!read) continue;
        if (read.lastDeclaredRank === play.declaredRank) {
          read.repeatRankCount += 1;
          read.repeatedCount += 1;
          read.quickJudgmentBias += 0.06;
        } else {
          read.repeatRankCount = 0;
        }
        read.quickJudgmentBias += Math.max(0, play.cards.length - 2) * 0.015;
        read.lastDeclaredRank = play.declaredRank;
        read.quickJudgmentBias = clamp01((read.quickJudgmentBias + 1) / 2) * 2 - 1;
      }
    }
    function observeRevealedTruthForReads(play, wasTruthful) {
      for (const observer of state.players) {
        if (observer.eliminated || observer.id === play.playerIndex) continue;
        const read = ensureReadProfile(observer.id, play.playerIndex);
        if (!read) continue;
        if (wasTruthful) {
          read.truthfulCount += 1;
          read.currentTruthStreak += 1;
          read.currentBluffStreak = 0;
          if (read.quickJudgmentBias < 0) read.quickJudgmentBias *= 0.55;
          read.quickJudgmentBias -= 0.1;
        } else {
          read.bluffCount += 1;
          read.currentBluffStreak += 1;
          read.currentTruthStreak = 0;
          if (read.quickJudgmentBias > 0) read.quickJudgmentBias *= 0.55;
          read.quickJudgmentBias += 0.14;
        }
        read.quickJudgmentBias = Math.max(-1, Math.min(1, read.quickJudgmentBias));
      }
    }
    function noteChallengeReadResult(challengerIndex, targetIndex, challengeSucceeded) {
      const read = ensureReadProfile(challengerIndex, targetIndex);
      if (!read) return;
      if (challengeSucceeded) {
        read.challengeWins += 1;
        read.quickJudgmentBias += 0.18;
      } else {
        read.challengeLosses += 1;
        read.quickJudgmentBias -= 0.14;
      }
      read.quickJudgmentBias = Math.max(-1, Math.min(1, read.quickJudgmentBias));
    }
    function suspicionFromReadProfile(read, pers) {
      if (!read) return 0;
      const seenTotal = read.truthfulCount + read.bluffCount;
      const bluffRate = seenTotal > 0 ? read.bluffCount / seenTotal : 0.5;
      const repeatPressure = Math.min(0.18, read.repeatRankCount * 0.05 + read.repeatedCount * 0.015);
      const streakPressure = Math.min(0.22, read.currentBluffStreak * 0.09) - Math.min(0.16, read.currentTruthStreak * 0.05);
      const challengeMemory = Math.min(0.2, read.challengeWins * 0.08) - Math.min(0.14, read.challengeLosses * 0.05);
      const snapWeight = pers?.overSuspects ? 0.16 : 0.1;
      return (
        (bluffRate - 0.5) * 0.42 +
        repeatPressure +
        streakPressure +
        challengeMemory +
        read.quickJudgmentBias * snapWeight
      );
    }
    function challengeSuspicionScore(challengerIndex, play, { includeRandom = true } = {}) {
      const challenger = state.players[challengerIndex];
      const pers = challenger.personality;
      const knownRankCount = countKnownRank(play.declaredRank);
      const visibleWilds = countVisibleWilds();
      const impossibleOverage = Math.max(0, knownRankCount + play.cards.length - 4 - visibleWilds);
      const read = ensureReadProfile(challengerIndex, play.playerIndex);
      let suspicion = 0;
      suspicion += impossibleOverage * 0.27;
      suspicion += play.cards.length >= 3 ? 0.1 : 0;
      suspicion += play.cards.length >= 5 ? 0.08 : 0;
      suspicion += challenger.chips <= 2 ? -0.18 : 0;
      suspicion += challenger.chips >= 8 ? 0.05 : 0;
      suspicion += play.playerIndex === 0 ? 0.1 : 0;
      suspicion += suspicionFromReadProfile(read, pers);
      if (includeRandom) suspicion += rand() * CONFIG.aiChallengeRandomNudgeMax;
      if (pers) {
        suspicion += (pers.suspicion  - 0.5) * 0.34;
        suspicion += (pers.aggression - 0.5) * 0.08;
        if (pers.overSuspects) suspicion += 0.1;
      }
      return suspicion;
    }
    function aiShouldChallenge(challengerIndex, play) {
      return challengeSuspicionScore(challengerIndex, play, { includeRandom: true }) >= CONFIG.aiChallengeThreshold;
    }
    function clampMs(value, minMs, maxMs) {
      return Math.max(minMs, Math.min(maxMs, Math.round(value)));
    }
    function aiDecisionDelayMs(kind, actorId, context = {}) {
      const actor = state.players[actorId];
      const pers = actor?.personality || {};
      if (kind === 'turn') {
        const targetRank = state.declaredRank;
        const handSize = actor?.hand?.length || 0;
        const matches = targetRank === null ? 0 : cardsOfRank(actor, targetRank).length + wildCards(actor).length;
        const opponentCount = state.players.filter(p => !p.eliminated && p.id !== actorId).length;
        const styleTempo = 1 - ((pers.courage ?? 0.5) * 0.4 + (pers.aggression ?? 0.5) * 0.3 + (pers.honesty ?? 0.5) * 0.3);
        const complexity = clamp01(0.22 + (handSize / Math.max(1, START_HAND_SIZE)) * 0.32 + (targetRank === null ? 0.18 : 0.12) + (matches <= 1 ? 0.15 : 0.05) + opponentCount * 0.04);
        const pace = clamp01(complexity * 0.7 + styleTempo * 0.3 + rand() * 0.12);
        const minMs = Number(AI_DECISION_DELAYS.turnMinMs) || 420;
        const maxMs = Number(AI_DECISION_DELAYS.turnMaxMs) || 1300;
        return clampMs(minMs + (maxMs - minMs) * pace, minMs, maxMs);
      }
      if (kind === 'challenge') {
        const play = context.play;
        if (!play) return Number(AI_DECISION_DELAYS.challengeMinMs) || AI_THINK_MS;
        const read = ensureReadProfile(actorId, play.playerIndex);
        const knownRankCount = countKnownRank(play.declaredRank);
        const visibleWilds = countVisibleWilds();
        const impossibleOverage = Math.max(0, knownRankCount + play.cards.length - 4 - visibleWilds);
        const readSuspicion = suspicionFromReadProfile(read, pers);
        const handPressure = state.declaredRank === null ? 0.08 : Math.max(0, 0.2 - (cardsOfRank(actor, state.declaredRank).length * 0.05));
        const uncertainty = clamp01(0.45 - impossibleOverage * 0.14 + Math.max(0, 0.18 - Math.abs(readSuspicion) * 0.6) + handPressure + rand() * 0.08);
        const styleTempo = 1 - ((pers.courage ?? 0.5) * 0.46 + (pers.suspicion ?? 0.5) * 0.34 + (pers.aggression ?? 0.5) * 0.2);
        const pace = clamp01(uncertainty * 0.72 + styleTempo * 0.28);
        const minMs = Number(AI_DECISION_DELAYS.challengeMinMs) || 360;
        const maxMs = Number(AI_DECISION_DELAYS.challengeMaxMs) || 2200;
        return clampMs(minMs + (maxMs - minMs) * pace, minMs, maxMs);
      }
      if (kind === 'betting') {
        const intent = aiBetIntent(actorId);
        const toCall = amountToCall(actorId);
        const confidenceGap = Math.abs((intent.confidence ?? 0.5) - (intent.foldFloor ?? 0.32));
        const stakePressure = state.betting ? Math.min(0.25, Math.max(0, state.betting.currentTierValue - CONFIG.challengeBaseTransfer) * 0.03) : 0;
        const styleTempo = 1 - ((pers.courage ?? 0.5) * 0.5 + (pers.aggression ?? 0.5) * 0.3 + (pers.greed ?? 0.5) * 0.2);
        const uncertainty = clamp01(0.42 - confidenceGap * 0.6 + Math.min(0.2, toCall * 0.05) + stakePressure + rand() * 0.08);
        const canRaise = getRaiseOptionsForPlayer(actorId).length > 0;
        const decisiveSpot = (toCall === 0 && !canRaise) || confidenceGap >= 0.42;
        const pace = clamp01(uncertainty * 0.66 + styleTempo * 0.34);
        const minMs = Number(AI_DECISION_DELAYS.bettingMinMs) || 200;
        const maxMs = Number(AI_DECISION_DELAYS.bettingMaxMs) || 650;
        if (decisiveSpot) {
          return clampMs(minMs + Math.max(20, (maxMs - minMs) * 0.12), minMs, maxMs);
        }
        return clampMs(minMs + (maxMs - minMs) * pace, minMs, maxMs);
      }
      return AI_THINK_MS;
    }
    function scheduleAiChallengeWindowDecisions(playerIndex) {
      if (!state.challengeWindow || state.betting || state.gameOver) return;
      const lastPlay = state.challengeWindow.lastPlay;
      if (!lastPlay || lastPlay.playerIndex !== playerIndex) return;
      const possibleChallengers = state.challengeWindow.challengerOptions.filter(idx => idx !== 0 && !state.players[idx].eliminated);
      const challengeSessionId = ++state.challengeDecisionSession;
      const staggerMs = Number(AI_DECISION_DELAYS.challengeStaggerMs) || 220;
      let maxDecisionDelay = 0;
      traceGameplay('challenge.window-open', {
        playerIndex,
        challengeSessionId,
        possibleChallengers,
      });
      possibleChallengers.forEach((idx, order) => {
        const thinkMs = aiDecisionDelayMs('challenge', idx, { play: lastPlay });
        const delayMs = Math.max(0, thinkMs + (order * staggerMs));
        maxDecisionDelay = Math.max(maxDecisionDelay, delayMs);
        setTimeout(() => {
          if (state.challengeDecisionSession !== challengeSessionId) return;
          if (!state.challengeWindow || state.betting || state.gameOver) return;
          if (state.challengeIntro) return;
          if (state.challengeWindow.lastPlay?.playerIndex !== playerIndex) return;
          if (aiShouldChallenge(idx, lastPlay)) {
            startChallenge(idx, playerIndex);
          }
        }, delayMs);
      });
      if (playerIndex === 0) {
        const baseChallengeDurationMs = CHALLENGE_TIMER_SECS * 1000;
        const countdownDurationMs = Math.min(baseChallengeDurationMs, maxDecisionDelay + 30);
        startChallengeTimer({
          durationMs: countdownDurationMs,
          onExpire: () => {
            if (state.challengeDecisionSession !== challengeSessionId) return;
            if (state.challengeWindow && !state.challengeIntro && !state.betting && !state.gameOver && state.challengeWindow.lastPlay?.playerIndex === playerIndex) {
              advanceAfterNoChallenge(playerIndex);
            }
          },
        });
      }
    }
    function humanChallenge() {
      if (!state.challengeWindow || state.gameOver || state.betting) return;
      const target = state.challengeWindow.lastPlay.playerIndex;
      if (target === 0) return;
      clearChallengeTimer();
      startChallenge(0, target);
    }
    function humanAcceptNoChallenge() {
      if (!state.challengeWindow || state.gameOver || state.betting) return;
      clearChallengeTimer();
      const target = state.challengeWindow.lastPlay.playerIndex;
      advanceAfterNoChallenge(target);
    }
    function clearChallengeIntro() {
      if (state.challengeIntroTimeout) {
        clearTimeout(state.challengeIntroTimeout);
        state.challengeIntroTimeout = null;
      }
      state.challengeIntro = null;
    }
    function startChallengeBetting(challengerIndex, challengedIndex) {
      const play = state.challengeWindow?.lastPlay;
      if (!play) {
        clearChallengeIntro();
        return;
      }
      clearChallengeIntro();
      SCRATCHBONES_AUDIO.playChallengeStart();
      SCRATCHBONES_AUDIO.startChallengeMusic();
      addLog(`${seatLabel(challengerIndex)} challenges ${seatLabel(challengedIndex)}.`);
      const challenger = state.players[challengerIndex];
      challenger.trickPunishActive = false;
      state.betting = {
        play,
        challengerId: challengerIndex,
        challengedId: challengedIndex,
        currentActorId: challengerIndex,
        currentTierId: null,
        currentTierValue: 0,
        displayedTierId: null,
        displayedTierValue: 0,
        contributions: {
          [challengerIndex]: 0,
          [challengedIndex]: 0,
        },
        challengerHasRaised: false,
        challengedHasRaised: false,
        phase: 'opening',
        pendingAutoReveal: false,
        actionInFlight: false,
        punishArmed: false,
        punishAvailable: challenger.hand.some((card) => card.trickType === 'punish'),
      };
      state.challengeWindow = null;
      setBanner(`${seatLabel(challengerIndex)} and ${seatLabel(challengedIndex)} are betting on the challenge.`);
      render();
      scheduleBettingAiIfNeeded();
    }
    function startChallenge(challengerIndex, challengedIndex) {
      if (!state.challengeWindow || state.gameOver || state.betting || state.challengeIntro) return;
      clearChallengeTimer();
      clearChallengeIntro();
      traceGameplay('challenge.started', { challengerIndex, challengedIndex, challengeWindowOpen: Boolean(state.challengeWindow) });
      state.challengeIntro = {
        challengerId: challengerIndex,
        challengedId: challengedIndex,
        burstText: String(CONFIG.uiText?.challengeBurstText || 'LIAR!!!'),
      };
      setBanner(`${seatFirstName(challengerIndex)} calls liar! Challenge begins...`);
      render();
      const introMs = Math.max(0, Number(CONFIG.timers?.challengeIntroMs) || 2200);
      state.challengeIntroTimeout = setTimeout(() => {
        if (!state.challengeWindow || state.gameOver || state.betting) return;
        if (!state.challengeIntro || state.challengeIntro.challengerId !== challengerIndex || state.challengeIntro.challengedId !== challengedIndex) return;
        startChallengeBetting(challengerIndex, challengedIndex);
      }, introMs);
    }
    function stakeTierValueById(tierId) {
      return STAKE_TIER_BY_ID[tierId]?.value ?? 0;
    }
    function currentStakeTier() {
      return STAKE_TIER_BY_ID[state.betting?.currentTierId] || STAKE_TIERS[0] || null;
    }
    function tierIdForContributionValue(value) {
      if (!value) return null;
      const exact = STAKE_TIERS.find((tier) => tier.value === Number(value));
      return exact?.id || null;
    }
    function legalStakeTierIdsForPlayer(playerId) {
      if (!state.betting) return [];
      const player = state.players[playerId];
      if (!player || player.eliminated) return [];
      const currentTier = currentStakeTier();
      if (state.betting.phase === 'opening') {
        return STAKE_TIERS.filter((tier) => player.chips >= tier.value).map((tier) => tier.id);
      }
      return STAKE_TIERS
        .filter((tier) => tier.value > currentTier.value)
        .filter((tier) => player.chips >= Math.max(0, tier.value - getContribution(playerId)))
        .map((tier) => tier.id);
    }
    function legalBettingActionsFor(playerId) {
      if (!state.betting) return [];
      const player = state.players[playerId];
      if (!player || player.eliminated) return [];
      if (state.betting.phase === 'opening') {
        const tiers = legalStakeTierIdsForPlayer(playerId);
        return tiers.length ? ['open-tier'] : ['fold'];
      }
      const actions = [];
      const toCall = amountToCall(playerId);
      if (toCall <= player.chips) actions.push('call');
      actions.push('fold');
      const higherTiers = legalStakeTierIdsForPlayer(playerId);
      const isChallenger = playerId === state.betting.challengerId;
      const isChallenged = playerId === state.betting.challengedId;
      if (higherTiers.length) {
        if (isChallenged && state.betting.challengerHasRaised) {
          // Final response window: challenged can only call/fold.
        } else if (isChallenger && state.betting.challengerHasRaised) {
          // Challenger already spent raise.
        } else if (isChallenged && state.betting.challengedHasRaised) {
          // Challenged already spent raise.
        } else {
          actions.push('raise-tier');
        }
      }
      return actions;
    }
    function getContribution(id) {
      return state.betting?.contributions?.[id] || 0;
    }
    function getRaiseOptionsForPlayer(id) {
      return legalStakeTierIdsForPlayer(id).map((tierId) => STAKE_TIER_BY_ID[tierId]?.value).filter(Boolean);
    }
    function getOpponentId(id) {
      if (!state.betting) return null;
      return id === state.betting.challengerId ? state.betting.challengedId : state.betting.challengerId;
    }
    function amountToCall(id) {
      if (!state.betting) return 0;
      return Math.max(0, state.betting.currentTierValue - getContribution(id));
    }
    function canPlayerAfford(id, amount) {
      return state.players[id] && !state.players[id].eliminated && state.players[id].chips >= amount;
    }
    function recordContribution(id, amount) {
      if (!state.betting || amount <= 0) return 0;
      const player = state.players[id];
      const paid = Math.min(player.chips, amount);
      player.chips -= paid;
      state.betting.contributions[id] = getContribution(id) + paid;
      eliminateIfNeeded(id, `${seatLabel(player)} ran out of chips during the challenge.`);
      return paid;
    }
    function transferToBank(playerIndex, amount, logMessage) {
      const player = state.players[playerIndex];
      if (player.eliminated) return 0;
      const paid = Math.min(player.chips, amount);
      player.chips -= paid;
      if (logMessage) addLog(logMessage.replace('1 chip', `${paid} chip${paid === 1 ? '' : 's'}`));
      eliminateIfNeeded(playerIndex, `${seatLabel(player)} ran out of chips.`);
      render();
      return paid;
    }
    function eliminateIfNeeded(playerIndex, logMessage) {
      const player = state.players[playerIndex];
      if (!player || player.eliminated || player.chips > 0) return false;
      player.chips = 0;
      player.eliminated = true;
      player.hand = [];
      player.lastAction = 'Out of chips';
      addLog(logMessage || `${seatLabel(player)} is out of chips and eliminated.`);
      if (state.currentTurn === playerIndex) state.currentTurn = nextAliveIndex(playerIndex);
      return checkGameOverBySurvivors();
    }
    function maybeAutoRevealAfterMatchedBet() {
      if (!state.betting) return false;
      const a = state.betting.challengerId;
      const b = state.betting.challengedId;
      if (getContribution(a) === state.betting.currentTierValue && getContribution(b) === state.betting.currentTierValue) {
        if (state.betting.pendingAutoReveal) return true;
        state.betting.pendingAutoReveal = true;
        revealChallenge();
        return true;
      }
      return false;
    }
    function sleep(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }
    async function animateCoinCloneToTarget(sourceEl, targetEl, { durationMs = 280, replaceOut = false } = {}) {
      if (!sourceEl || !targetEl) {
        console.warn('[stake-anim] skipped: missing source or target element', {
          hasSource: !!sourceEl,
          hasTarget: !!targetEl,
          bettingPhase: state.betting?.phase || null,
          actorId: state.betting?.currentActorId ?? null,
        });
        return;
      }
      const sourceRect = sourceEl.getBoundingClientRect();
      const targetRect = targetEl.getBoundingClientRect();
      if (!sourceRect.width || !sourceRect.height || !targetRect.width || !targetRect.height) {
        console.warn('[stake-anim] skipped: zero-size source/target rect', {
          sourceRect: { width: sourceRect.width, height: sourceRect.height },
          targetRect: { width: targetRect.width, height: targetRect.height },
          bettingPhase: state.betting?.phase || null,
          actorId: state.betting?.currentActorId ?? null,
        });
        return;
      }
      const clone = sourceEl.cloneNode(true);
      clone.style.position = 'fixed';
      clone.style.left = `${sourceRect.left}px`;
      clone.style.top = `${sourceRect.top}px`;
      clone.style.width = `${sourceRect.width}px`;
      clone.style.height = `${sourceRect.height}px`;
      clone.style.pointerEvents = 'none';
      clone.style.margin = '0';
      clone.style.zIndex = '10010';
      clone.style.transition = 'none';
      document.body.appendChild(clone);
      await new Promise((resolve) => requestAnimationFrame(resolve));
      clone.style.transition = `transform ${durationMs}ms ease, opacity ${durationMs}ms ease`;
      const dx = (targetRect.left + targetRect.width / 2) - (sourceRect.left + sourceRect.width / 2);
      const dy = (targetRect.top + targetRect.height / 2) - (sourceRect.top + sourceRect.height / 2);
      const targetScale = Math.max(0.74, Math.min(1.1, targetRect.width / Math.max(1, sourceRect.width)));
      clone.style.transform = `translate(${dx}px, ${dy}px) scale(${replaceOut ? 0.84 : targetScale})`;
      clone.style.opacity = replaceOut ? '0.18' : '1';
      await sleep(durationMs + 30);
      clone.remove();
    }
    function coinButtonForTier(tierId) {
      return document.querySelector(`[data-stake-tier-btn="${tierId}"]`);
    }
    function contributionAnchorForPlayer(playerId) {
      return document.querySelector(`[data-stake-contrib-anchor="${playerId}"]`);
    }
    function contributionCoinForPlayer(playerId) {
      return document.querySelector(`[data-stake-contrib-coin="${playerId}"]`);
    }
    function stakeAnchor() {
      return document.querySelector('[data-stake-current-anchor]');
    }
    function contributionLerpAnchorForPlayer(playerId) {
      if (!state.betting) return null;
      if (playerId === state.betting.challengerId) return document.querySelector('[data-stake-left-contribution-anchor]');
      if (playerId === state.betting.challengedId) return document.querySelector('[data-stake-right-contribution-anchor]');
      return null;
    }
    async function animateStakeOpen(playerId, tierId) {
      await animateCoinCloneToTarget(coinButtonForTier(tierId), contributionAnchorForPlayer(playerId), { durationMs: CONFIG.challengeStakeAnimation.openMs });
      await animateCoinCloneToTarget(coinButtonForTier(tierId), stakeAnchor(), { durationMs: CONFIG.challengeStakeAnimation.openMs });
      await animateCoinCloneToTarget(coinButtonForTier(tierId), contributionLerpAnchorForPlayer(playerId), { durationMs: CONFIG.challengeStakeAnimation.openMs });
    }
    async function animateStakeCall(playerId, tierId) {
      await animateCoinCloneToTarget(coinButtonForTier(tierId), contributionAnchorForPlayer(playerId), { durationMs: CONFIG.challengeStakeAnimation.callMs });
      await animateCoinCloneToTarget(coinButtonForTier(tierId), contributionLerpAnchorForPlayer(playerId), { durationMs: CONFIG.challengeStakeAnimation.callMs });
    }
    async function animateStakeRaise(playerId, newTierId) {
      console.log('[stake-anim] raise animation start', { playerId, newTierId });
      const tierBtn = coinButtonForTier(newTierId);
      const currentStakeCoin = document.querySelector('[data-stake-current-coin]');
      const existingContributionCoin = contributionCoinForPlayer(playerId);
      if (existingContributionCoin && tierBtn) {
        await animateCoinCloneToTarget(existingContributionCoin, tierBtn, {
          durationMs: CONFIG.challengeStakeAnimation.raiseOutMs,
          replaceOut: true,
        });
        console.log('[stake-anim] old contribution coin backed out', { playerId });
      }
      if (currentStakeCoin && tierBtn) {
        await animateCoinCloneToTarget(currentStakeCoin, tierBtn, {
          durationMs: CONFIG.challengeStakeAnimation.raiseOutMs,
          replaceOut: true,
        });
        console.log('[stake-anim] center stake coin backed out', { playerId });
      }
      await animateCoinCloneToTarget(tierBtn, contributionAnchorForPlayer(playerId), { durationMs: CONFIG.challengeStakeAnimation.raiseInMs });
      await animateCoinCloneToTarget(tierBtn, stakeAnchor(), { durationMs: CONFIG.challengeStakeAnimation.raiseInMs });
      await animateCoinCloneToTarget(tierBtn, contributionLerpAnchorForPlayer(playerId), { durationMs: CONFIG.challengeStakeAnimation.raiseInMs });
      console.log('[stake-anim] new tier coin inserted', { playerId, newTierId });
    }
    async function resolveBetAction(playerId, action, options = {}) {
      if (!state.betting || state.gameOver) return;
      if (state.betting.pendingAutoReveal) return;
      if (state.betting.actionInFlight && !options.allowWhileLocked) return;
      if (state.betting.currentActorId !== playerId) return;
      const command = typeof action === 'string' ? action : action?.type;
      const targetTierId = typeof action === 'object' ? action?.tierId : null;
      const player = state.players[playerId];
      const opponentId = getOpponentId(playerId);
      const toCall = amountToCall(playerId);
      if (state.betting.punishArmed && playerId === state.betting.challengerId && ['open-tier', 'raise-tier', 'call'].includes(command)) {
        const punishCardIndex = player.hand.findIndex((card) => card.trickType === 'punish');
        if (punishCardIndex >= 0) {
          player.hand.splice(punishCardIndex, 1);
          state.betting.punishAvailable = false;
          state.players[playerId].trickPunishActive = true;
          addLog(`${seatLabel(playerId)} arms a Punish Bone.`);
        }
        state.betting.punishArmed = false;
      }
      if (!options.allowWhileLocked) {
        state.betting.actionInFlight = true;
        render();
      }
      // Queue cinematic text effects; render() will fire them after DOM/layout update.
      state.pendingCinematicBetAction = { playerId, command };
      try {
        if (command === 'open-tier' && state.betting.phase === 'opening') {
          const chosenTierId = targetTierId;
          const chosenTierValue = stakeTierValueById(chosenTierId);
          if (!chosenTierValue || !canPlayerAfford(playerId, chosenTierValue)) return;
          console.log('[betting-tier] selected tier', { playerId, tierId: chosenTierId, value: chosenTierValue, action: 'open-tier' });
          await animateStakeOpen(playerId, chosenTierId);
          state.betting.currentTierId = chosenTierId;
          state.betting.currentTierValue = chosenTierValue;
          state.betting.displayedTierId = chosenTierId;
          state.betting.displayedTierValue = chosenTierValue;
          const paid = recordContribution(playerId, chosenTierValue);
          addLog(`${seatLabel(player)} opens the challenge stake at ${chosenTierValue}.`);
          player.lastAction = `Opened ${chosenTierValue}`;
          if (paid < chosenTierValue) {
            finalizeChallengeByFold(opponentId, playerId, 'could not fund the opening stake');
            return;
          }
          state.betting.phase = 'response';
          state.betting.currentActorId = opponentId;
          render();
          scheduleBettingAiIfNeeded();
          return;
        }
        if (command === 'call') {
          const tierId = state.betting.currentTierId;
          await animateStakeCall(playerId, tierId);
          const paid = recordContribution(playerId, toCall);
          addLog(`${seatLabel(player)} calls ${state.betting.currentTierValue}.`);
          player.lastAction = 'Called';
          if (state.gameOver) return;
          if (getContribution(playerId) < state.betting.currentTierValue) {
            finalizeChallengeByFold(opponentId, playerId, 'could not cover the call');
            return;
          }
          if (maybeAutoRevealAfterMatchedBet()) return;
          return;
        }
        if (command === 'raise-tier') {
          const newTierId = targetTierId;
          const newStake = stakeTierValueById(newTierId);
          console.log('[betting-tier] selected tier', { playerId, tierId: newTierId, value: newStake, action: 'raise-tier' });
          if (!newStake || newStake <= state.betting.currentTierValue) {
            await resolveBetAction(playerId, 'call', { allowWhileLocked: true });
            return;
          }
          const amountNeeded = newStake - getContribution(playerId);
          if (!canPlayerAfford(playerId, amountNeeded)) {
            await resolveBetAction(playerId, 'fold', { allowWhileLocked: true });
            return;
          }
          await animateStakeRaise(playerId, newTierId);
          state.betting.currentTierId = newTierId;
          state.betting.currentTierValue = newStake;
          state.betting.displayedTierId = newTierId;
          state.betting.displayedTierValue = newStake;
          if (playerId === state.betting.challengerId) state.betting.challengerHasRaised = true;
          if (playerId === state.betting.challengedId) state.betting.challengedHasRaised = true;
          const paid = recordContribution(playerId, amountNeeded);
          player.lastAction = `Raised to ${newStake}`;
          addLog(`${seatLabel(player)} raises the stake to ${newStake}.`);
          if (state.gameOver) return;
          if (paid < amountNeeded) {
            finalizeChallengeByFold(opponentId, playerId, 'could not fund the raise');
            return;
          }
          state.betting.currentActorId = opponentId;
          render();
          scheduleBettingAiIfNeeded();
          return;
        }
        if (command === 'fold') {
          player.lastAction = 'Folded challenge';
          finalizeChallengeByFold(opponentId, playerId, 'folded');
        }
      } finally {
        if (!options.allowWhileLocked && state.betting) {
          state.betting.actionInFlight = false;
          render();
        }
      }
    }
    function challengePotTotal() {
      if (!state.betting) return 0;
      return Object.values(state.betting.contributions).reduce((sum, val) => sum + val, 0);
    }
    function netChallengeGainFor(winnerId, grossAward) {
      if (!state.betting) return grossAward;
      const ownContribution = state.betting.contributions?.[winnerId] || 0;
      return Math.max(0, grossAward - ownContribution);
    }
    function finalizeChallengeByFold(winnerId, loserId, reason) {
      if (!state.betting || state.gameOver) return;
      SCRATCHBONES_AUDIO.playChallengeEnd();
      SCRATCHBONES_AUDIO.stopChallengeMusic();
      const winner = state.players[winnerId];
      const loser = state.players[loserId];
      let award = challengePotTotal();
      if (award < CONFIG.challengeBaseTransfer) award = CONFIG.challengeBaseTransfer;
      const netGain = netChallengeGainFor(winnerId, award);
      winner.chips += award;
      state.stats.chipsMovedByChallenges += award;
      addLog(`${seatLabel(loser)} ${reason}. ${seatLabel(winner)} wins ${netGain} net chip${netGain === 1 ? '' : 's'} from the challenge.`);
      if (winnerId === state.betting.challengerId) {
        state.stats.successfulChallenges += 1;
        noteChallengeReadResult(state.betting.challengerId, state.betting.challengedId, true);
      } else {
        state.stats.failedChallenges += 1;
        noteChallengeReadResult(state.betting.challengerId, state.betting.challengedId, false);
      }
      showFoldCinematic(winnerId, loserId, () => {
        state.betting = null;
        concludeChallengeFlow(winnerId);
      });
    }
    function revealChallenge() {
      if (!state.betting || state.gameOver) return;
      SCRATCHBONES_AUDIO.playChallengeEnd();
      SCRATCHBONES_AUDIO.stopChallengeMusic();
      const play = state.betting.play;
      const challengerId = state.betting.challengerId;
      const challengedId = state.betting.challengedId;
      const success = !play.truthful;
      const winnerId = success ? challengerId : challengedId;
      const loserId = success ? challengedId : challengerId;
      const winner = state.players[winnerId];
      const loser = state.players[loserId];
      const pot = challengePotTotal();
      const netGain = netChallengeGainFor(winnerId, pot);
      showClaimGlow('red', 2500, () => {
        winner.chips += pot;
        state.stats.chipsMovedByChallenges += pot;
        observeRevealedTruthForReads(play, play.truthful);
        if (success) {
          state.stats.successfulChallenges += 1;
          state.stats.bluffsCaught += 1;
          noteChallengeReadResult(challengerId, challengedId, true);
          loser.lastAction = 'Caught bluffing';
          addLog(`Challenge succeeds. ${seatLabel(loser)} was bluffing.`);
          loser.hand.push(...collectPileCards());
          loser.hand.sort(sortCards);
          applyPunishTransferOnSuccessfulChallenge(play, challengerId, challengedId);
        } else {
          state.stats.failedChallenges += 1;
          addLog(`Challenge fails. ${state.players[challengedId].name} was truthful.`);
          applyTrapTransferOnDefendedChallenge(play, challengedId, challengerId);
        }
        addLog(`${seatLabel(winner)} wins ${netGain} net chip${netGain === 1 ? '' : 's'} from the challenge.`);
        state.betting = null;
        showRevealCinematic(challengerId, challengedId, play, success, () => {
          concludeChallengeFlow(winnerId);
        });
      });
    }
    function concludeChallengeFlow(winnerId) {
      if (state.gameOver) return;
      if (checkGameOverBySurvivors()) return;
      if (state.pile.length) {
        const lastPlay = state.pile[state.pile.length - 1];
        if (lastPlay && lastPlay.playerIndex === winnerId && checkForClearAndRedeal(winnerId)) return;
      }
      openNewRound(winnerId);
    }
    function collectPileCards() {
      const cards = [];
      for (const play of state.pile) cards.push(...play.cards);
      state.pile = [];
      state.declaredRank = null;
      return cards;
    }
    function showClaimGlow(type, durationMs, callback) {
      const bar = document.querySelector('.claimHandBar');
      if (!bar || !bar.querySelector('.tableViewCard')) { callback(); return; }
      bar.classList.remove('glow-green', 'glow-red');
      void bar.offsetWidth;
      bar.classList.add(`glow-${type}`);
      setTimeout(() => {
        bar.classList.remove('glow-green', 'glow-red');
        callback();
      }, durationMs);
    }
    function advanceAfterNoChallenge(lastPlayerIndex) {
      if (!state.challengeWindow || state.gameOver || state.betting) return;
      clearChallengeTimer();
      clearChallengeIntro();
      state.challengeWindow = null;
      traceGameplay('challenge.no-challenge-accepted', { lastPlayerIndex, declaredRank: state.declaredRank });
      showClaimGlow('green', 1600, () => {
        const lastPlay = state.pile[state.pile.length - 1];
        if (lastPlay && lastPlay.playerIndex === lastPlayerIndex) applySmuggleTransferOnPassedClaim(lastPlay);
        if (state.smuggleSelection) {
          state.smuggleSelection.resumePlayerIndex = lastPlayerIndex;
          return;
        }
        continueAfterNoChallenge(lastPlayerIndex);
      });
    }
    function continueAfterNoChallenge(lastPlayerIndex) {
        if (state.gameOver) return;
        if (checkForClearAndRedeal(lastPlayerIndex)) return;
        if (maybeEndRoundFromConcessions()) return;
        const nextPlayer = nextRoundEligibleIndex(lastPlayerIndex);
        if (nextPlayer === null) {
          openNewRound(currentDeclarerIndex());
          return;
        }
        state.currentTurn = nextPlayer;
        traceGameplay('turn.advance', { from: lastPlayerIndex, to: nextPlayer, reason: 'claim-stood' });
        setBanner(state.currentTurn === 0
          ? `Your turn. Match ${state.declaredRank}, bluff, or concede the round.`
          : `${seatLabel(state.players[state.currentTurn])} is thinking about ${state.declaredRank}.`);
        render();
        if (state.currentTurn !== 0) scheduleAiTurn();
    }
    function checkForClearAndRedeal(playerIndex) {
      const player = state.players[playerIndex];
      if (player.eliminated || player.hand.length !== 0) return false;
      const totalWon = state.tablePot;
      player.chips += totalWon;
      player.clears += 1;
      state.stats.totalClears += 1;
      state.tablePot = 0;
      addLog(`${seatLabel(player)} clears their hand and collects the ${totalWon} chip${totalWon === 1 ? '' : 's'} table pot.`);
      state.ante += Math.max(1, Number(CONFIG.anteIncrement) || 1);
      addLog(`The ante rises to ${state.ante} chip${state.ante === 1 ? '' : 's'}.`);
      let ended = false;
      for (const p of state.players) {
        if (eliminateIfNeeded(p.id, `${seatLabel(p)} is out of chips after the clear payout.`)) ended = true;
      }
      if (ended || checkGameOverBySurvivors()) {
        render();
        return true;
      }
      collectAnteForNewRound();
      if (checkGameOverBySurvivors()) {
        render();
        return true;
      }
      refillHandsAfterClearInTurnOrder(playerIndex);
      state.pile = [];
      state.declaredRank = null;
      state.challengeWindow = null;
      state.betting = null;
      clearChallengeIntro();
      state.round += 1;
      state.leaderIndex = playerIndex;
      state.currentTurn = playerIndex;
      setBanner(playerIndex === 0
        ? `You cleared your hand. Hands refill up to ${START_HAND_SIZE} cards in turn order, and you lead again.`
        : `${seatLabel(player)} cleared their hand. Hands refill up to ${START_HAND_SIZE} cards in turn order, and they lead again.`, 'good');
      render();
      if (state.currentTurn !== 0) scheduleAiTurn();
      return true;
    }
    function openNewRound(leaderIndex) {
      if (state.gameOver) return;
      if (checkGameOverBySurvivors()) return;
      state.leaderIndex = leaderIndex;
      state.currentTurn = leaderIndex;
      state.declaredRank = null;
      state.challengeWindow = null;
      state.betting = null;
      clearChallengeIntro();
      state.pile = [];
      state.roundConcessions.clear();
      state.round += 1;
      state.selectedCardIds.clear();
      state.roundConcessions.clear();
      setBanner(state.currentTurn === 0
        ? 'You open the new round. Select cards and declare any number.'
        : `${seatLabel(state.currentTurn)} opens a new round.`);
      render();
      if (state.currentTurn !== 0) scheduleAiTurn();
    }
    function checkGameOverBySurvivors() {
      const survivors = alivePlayers();
      if (survivors.length === 1) {
        state.gameOver = true;
        state.winnerIndex = survivors[0].id;
        setBanner(survivors[0].id === 0 ? 'You win. Everyone else ran out of chips.' : `${seatLabel(survivors[0])} wins. Everyone else ran out of chips.`, 'good');
        addLog(state.banner);
        render();
        return true;
      }
      return false;
    }
    function scheduleAiTurn() {
      if (state.gameOver) return;
      const actorId = state.currentTurn;
      const thinkMs = aiDecisionDelayMs('turn', actorId);
      window.setTimeout(() => {
        if (!state.gameOver && state.currentTurn !== 0 && !state.challengeWindow && !state.betting) {
          aiTakeTurn(state.currentTurn);
        }
      }, thinkMs);
    }
    function scheduleBettingAiIfNeeded() {
      if (!state.betting || state.gameOver) return;
      const actorId = state.betting.currentActorId;
      if (actorId === 0) return;
      const intent = aiBetIntent(actorId);
      const thinkMs = aiDecisionDelayMs('betting', actorId);
      window.setTimeout(() => {
        if (state.betting && !state.gameOver && state.betting.currentActorId === actorId) {
          aiTakeBettingAction(actorId, intent);
        }
      }, thinkMs);
    }
    function aiTakeTurn(playerIndex) {
      const player = state.players[playerIndex];
      if (player.eliminated || state.gameOver || state.challengeWindow || state.betting) return;
      const decision = chooseAiPlay(player);
      if (decision.type === 'concede') {
        player.lastAction = 'Conceded round';
        const paid = transferToBank(playerIndex, CONFIG.concedeRoundChipLoss, `${seatLabel(player)} concedes the claim and pays 1 chip to the bank.`);
        if (paid <= 0 || state.gameOver) return;
        state.roundConcessions.add(playerIndex);
        if (maybeEndRoundFromConcessions()) return;
        const nextPlayer = nextRoundEligibleIndex(playerIndex);
        if (nextPlayer === null) {
          openNewRound(currentDeclarerIndex());
          return;
        }
        state.currentTurn = nextPlayer;
        setBanner(nextPlayer === 0
          ? `Your turn. Match ${state.declaredRank}, bluff, or concede the round.`
          : `${seatLabel(state.players[nextPlayer])} is up on ${state.declaredRank}.`);
        render();
        if (nextPlayer !== 0) scheduleAiTurn();
        return;
      }
      performPlay(playerIndex, decision.cardIds, decision.declaredRank);
    }
    function getAiHonesty(player) {
      const explicitHonesty = player?.personality?.honesty;
      if (typeof explicitHonesty === 'number') return clamp01(explicitHonesty);
      const aggression = player?.personality?.aggression ?? 0.5;
      return Math.max(0.08, Math.min(0.92, 1 - aggression));
    }
    function cardsOfRank(player, rank) {
      return player.hand.filter(c => !c.wild && c.rank === rank);
    }
    function wildCards(player) {
      return player.hand.filter(c => c.wild);
    }
    function bestTruthfulOpeningRank(player) {
      const allWilds = wildCards(player).length;
      let bestRank = 1;
      let bestCount = -1;
      let bestNatural = -1;
      for (let rank = 1; rank <= RANK_COUNT; rank++) {
        const natural = cardsOfRank(player, rank).length;
        const total = natural + allWilds;
        if (total > bestCount || (total === bestCount && natural > bestNatural)) {
          bestRank = rank;
          bestCount = total;
          bestNatural = natural;
        }
      }
      return {
        rank: bestRank,
        naturalCount: bestNatural,
        totalTruthfulCount: bestCount,
      };
    }
    function buildTruthfulPlayForRank(player, rank, desiredCount, opts = {}) {
      const saveWilds = !!opts.saveWilds;
      const natural = cardsOfRank(player, rank).slice();
      const wilds = wildCards(player).slice();
      const chosen = [];
      while (natural.length && chosen.length < desiredCount) chosen.push(natural.shift());
      if (!saveWilds || chosen.length < desiredCount) {
        while (wilds.length && chosen.length < desiredCount) chosen.push(wilds.shift());
      }
      return chosen.slice(0, desiredCount);
    }
    function buildBluffPlay(player, declaredRank, desiredCount = 1) {
      const offRank = player.hand.filter(c => !c.wild && c.rank !== declaredRank);
      const wilds = wildCards(player).slice();
      const chosen = [];
      while (offRank.length && chosen.length < desiredCount) chosen.push(offRank.shift());
      while (chosen.length < desiredCount && wilds.length) chosen.push(wilds.shift());
      if (!chosen.length && player.hand.length) chosen.push(player.hand[0]);
      return chosen.slice(0, Math.max(1, desiredCount));
    }
    function chooseAiPlay(player) {
      const targetRank = state.declaredRank;
      const pers = player.personality;
      const honesty = getAiHonesty(player);
      const greed = pers ? pers.greed : 0.5;
      const aggression = pers ? pers.aggression : 0.5;
      if (targetRank === null) {
        const openingPlan = bestTruthfulOpeningRank(player);
        const canMakeHugeTruth = openingPlan.totalTruthfulCount >= 5;
        const wantsTruthBait = honesty >= 0.68 && canMakeHugeTruth;
        let desiredCount;
        if (wantsTruthBait) {
          desiredCount = Math.min(openingPlan.totalTruthfulCount, Math.max(5, Math.min(6, openingPlan.totalTruthfulCount)));
        } else if (openingPlan.naturalCount >= 3 && rand() < 0.52 + greed * 0.22) {
          desiredCount = Math.min(openingPlan.naturalCount, rngInt(2, Math.min(4, openingPlan.naturalCount)));
        } else if (openingPlan.totalTruthfulCount >= 3 && rand() < 0.32 + greed * 0.2) {
          desiredCount = Math.min(openingPlan.totalTruthfulCount, rngInt(2, Math.min(4, openingPlan.totalTruthfulCount)));
        } else {
          desiredCount = 1;
        }
        const openingCards = buildTruthfulPlayForRank(player, openingPlan.rank, desiredCount, {
          saveWilds: honesty >= 0.62 && !wantsTruthBait,
        });
        if (openingCards.length) {
          return {
            type: 'play',
            declaredRank: openingPlan.rank,
            cardIds: openingCards.map(c => c.id),
          };
        }
        const fallbackCard = player.hand[0];
        return { type: 'play', declaredRank: rngInt(1, 10), cardIds: [fallbackCard.id] };
      }
      const normalMatches = cardsOfRank(player, targetRank);
      const wilds = wildCards(player);
      const maxTruthful = normalMatches.length + wilds.length;
      const hasHugeTruth = maxTruthful >= 5;
      const wantsTruthBait = honesty >= 0.68 && hasHugeTruth;
      const shouldPreserveWilds = honesty >= 0.62 && wilds.length > 0 && normalMatches.length > 0;
      if (wantsTruthBait) {
        const baitCount = Math.min(maxTruthful, Math.max(5, Math.min(6, maxTruthful)));
        const baitCards = buildTruthfulPlayForRank(player, targetRank, baitCount, { saveWilds: false });
        if (baitCards.length >= 5) {
          return { type: 'play', declaredRank: targetRank, cardIds: baitCards.map(c => c.id) };
        }
      }
      if (normalMatches.length) {
        let desiredCount = 1;
        if (normalMatches.length >= 3 && rand() < 0.42 + greed * 0.22) {
          desiredCount = rngInt(2, Math.min(4, normalMatches.length));
        } else if (player.hand.length <= 3) {
          desiredCount = Math.min(normalMatches.length, player.hand.length);
        }
        return {
          type: 'play',
          declaredRank: targetRank,
          cardIds: normalMatches.slice(0, desiredCount).map(c => c.id),
        };
      }
      if (wilds.length) {
        if (honesty >= 0.74) {
          const bluffRiskTolerance = player.chips <= 2
            ? 0.1 + (1 - honesty) * 0.4
            : player.chips <= 5
              ? 0.18 + (1 - honesty) * 0.45
              : 0.28 + (1 - honesty) * 0.5;
          if (rand() < bluffRiskTolerance) {
            return { type: 'play', declaredRank: targetRank, cardIds: buildBluffPlay(player, targetRank, 1).map(c => c.id) };
          }
          return { type: 'concede' };
        }
        const useWildsNow = player.hand.length <= 2 || rand() < (0.18 + (1 - honesty) * 0.38);
        if (useWildsNow) {
          return { type: 'play', declaredRank: targetRank, cardIds: [wilds[0].id] };
        }
      }
      const bluffCountCap = aggression > 0.74 ? 4 : aggression > 0.52 ? 3 : 2;
      const bluffCount = Math.min(
        bluffCountCap,
        Math.max(1, player.hand.length <= 3 ? player.hand.length : (rand() < 0.4 + greed * 0.2 ? 2 : 1))
      );
      const bluffRiskTolerance = player.chips <= 2
        ? 0.12 + aggression * 0.45
        : player.chips <= 5
          ? 0.24 + aggression * 0.58
          : Math.min(0.95, 0.4 + aggression * 0.72);
      if (honesty <= 0.32 && rand() < bluffRiskTolerance) {
        return {
          type: 'play',
          declaredRank: targetRank,
          cardIds: buildBluffPlay(player, targetRank, Math.max(2, bluffCount)).map(c => c.id),
        };
      }
      if (honesty > 0.32 && honesty < 0.68) {
        const trickyRate = Math.min(0.7, 0.18 + aggression * 0.34 + greed * 0.16);
        if (rand() < trickyRate) {
          return {
            type: 'play',
            declaredRank: targetRank,
            cardIds: buildBluffPlay(player, targetRank, bluffCount).map(c => c.id),
          };
        }
      }
      if (rand() < bluffRiskTolerance * 0.72) {
        return {
          type: 'play',
          declaredRank: targetRank,
          cardIds: buildBluffPlay(player, targetRank, 1).map(c => c.id),
        };
      }
      if (shouldPreserveWilds && wilds.length) {
        return { type: 'concede' };
      }
      if (wilds.length) return { type: 'play', declaredRank: targetRank, cardIds: [wilds[0].id] };
      return { type: 'concede' };
    }
    function estimateFoldPressureAgainst(actorId, opponentId) {
      const opponent = state.players[opponentId];
      const actorRead = ensureReadProfile(actorId, opponentId);
      const opponentPers = opponent?.personality;
      let pressure = 0.5;
      pressure += actorRead ? -Math.min(0.2, actorRead.challengeWins * 0.06) + Math.min(0.12, actorRead.challengeLosses * 0.04) : 0;
      pressure += opponentPers ? (0.5 - opponentPers.courage) * 0.32 : 0;
      pressure += opponentPers ? (0.5 - opponentPers.suspicion) * 0.12 : 0;
      pressure += opponentPers?.overSuspects ? -0.06 : 0;
      pressure += opponent && opponent.chips <= 2 ? 0.08 : 0;
      pressure += opponent && opponent.chips >= 8 ? -0.04 : 0;
      pressure += state.betting ? Math.min(0.14, Math.max(0, state.betting.currentTierValue - CONFIG.challengeBaseTransfer) * 0.05) : 0;
      return Math.max(0.05, Math.min(0.95, pressure));
    }
    function aiBetIntent(actorId) {
      const b = state.betting;
      if (!b) {
        return { confidence: 0.5, raiseDrive: 0.5, foldFloor: 0.32 };
      }
      const play = b.play;
      const player = state.players[actorId];
      const pers = player.personality;
      const opponentId = getOpponentId(actorId);
      const opponent = state.players[opponentId];
      const playerRead = ensureReadProfile(actorId, opponentId);
      const opponentRead = ensureReadProfile(opponentId, actorId);
      const opponentPers = opponent?.personality; // Used by: challenged-side betting incentives and fold-pressure reads.
      const foldPressure = estimateFoldPressureAgainst(actorId, opponentId);
      const bankrollBoost = Math.min(0.18, player.chips / 40);
      const couragePush = pers ? (pers.courage - 0.5) * 0.22 : 0;
      const randomNudge = rand() * 0.12 - 0.06;
      const challengerSuspicion = challengeSuspicionScore(b.challengerId, play, { includeRandom: false });
      const suspicionWeight = CONFIG.aiBettingConfidenceSuspicionWeight;
      let confidence = actorId === b.challengerId
        ? (0.5 + challengerSuspicion * suspicionWeight)
        : (0.5 - challengerSuspicion * suspicionWeight);
      confidence += bankrollBoost + couragePush + randomNudge;
      let raiseDrive = confidence;
      let foldFloor = pers ? 0.32 - (pers.courage - 0.5) * 0.18 : 0.32;
      if (actorId === b.challengerId) {
        confidence += suspicionFromReadProfile(playerRead, pers) * 0.18;
        raiseDrive += foldPressure * 0.45;
        raiseDrive += opponentRead && opponentRead.currentBluffStreak > 0 ? Math.min(0.12, opponentRead.currentBluffStreak * 0.05) : 0;
        raiseDrive -= challengerSuspicion < 0 ? Math.min(0.14, Math.abs(challengerSuspicion) * 0.2) : 0;
      } else if (challengerSuspicion < 0) {
        raiseDrive += (1 - foldPressure) * 0.34;
        raiseDrive += opponentPers ? opponentPers.aggression * 0.12 : 0;
        raiseDrive += Math.min(0.12, Math.max(0, b.currentTierValue - CONFIG.challengeBaseTransfer) * 0.04);
        confidence += 0.06;
      } else {
        raiseDrive += foldPressure * 0.58;
        raiseDrive -= (1 - foldPressure) * 0.2;
        raiseDrive += opponentPers ? (0.5 - opponentPers.courage) * 0.16 : 0;
        foldFloor += 0.06;
      }
      return {
        confidence: Math.max(0.05, Math.min(0.95, confidence)),
        raiseDrive: Math.max(0.05, Math.min(0.98, raiseDrive)),
        foldFloor: Math.max(0.08, Math.min(0.7, foldFloor)),
      };
    }
    function aiTakeBettingAction(actorId, precomputedIntent = null) {
      if (!state.betting || state.gameOver || state.betting.currentActorId !== actorId) return;
      const intent = precomputedIntent || aiBetIntent(actorId);
      const legalActions = legalBettingActionsFor(actorId);
      if (!legalActions.length) return;
      if (state.betting.phase === 'opening') {
        const tierIds = legalStakeTierIdsForPlayer(actorId);
        if (!tierIds.length) { resolveBetAction(actorId, 'fold'); return; }
        const selected = tierIds[tierIds.length - 1];
        resolveBetAction(actorId, { type: 'open-tier', tierId: selected });
        return;
      }
      const confidence = intent.confidence;
      const toCall = amountToCall(actorId);
      const player = state.players[actorId];
      const pers = player.personality;
      const raiseTierIds = legalStakeTierIdsForPlayer(actorId);
      const canRaise = legalActions.includes('raise-tier') && raiseTierIds.length > 0;
      const raiseThresh = pers ? 0.68 - (pers.courage - 0.5) * 0.18 : 0.68;
      const hardRaiseThresh = raiseThresh + 0.08;
      if (toCall > player.chips) {
        resolveBetAction(actorId, 'fold');
        return;
      }
      if (confidence < intent.foldFloor) {
        resolveBetAction(actorId, 'fold');
      } else if (canRaise && intent.raiseDrive > hardRaiseThresh && player.chips > toCall) {
        resolveBetAction(actorId, { type: 'raise-tier', tierId: raiseTierIds[raiseTierIds.length - 1] });
      } else {
        resolveBetAction(actorId, 'call');
      }
    }
    function humanBetAction(action) {
      resolveBetAction(0, action);
    }
    function humanOpenTierSelected(tierId) {
      resolveBetAction(0, { type: 'open-tier', tierId });
    }
    function humanRaiseTierSelected(tierId) {
      resolveBetAction(0, { type: 'raise-tier', tierId });
    }
    function transferCardsBetweenHands(fromId, toId, limit) {
      const from = state.players[fromId];
      const to = state.players[toId];
      if (!from || !to) return [];
      const cap = Math.max(0, Number(limit) || 0);
      if (!cap || !from.hand.length) return [];
      const moved = from.hand.slice(0, cap);
      from.hand = from.hand.slice(moved.length);
      to.hand.push(...moved);
      from.hand.sort(sortCards);
      to.hand.sort(sortCards);
      return moved;
    }
    function transferSpecificCardsBetweenHands(fromId, toId, cardIds) {
      const from = state.players[fromId];
      const to = state.players[toId];
      if (!from || !to || !Array.isArray(cardIds) || !cardIds.length) return [];
      const chosen = new Set(cardIds.map((id) => Number(id)));
      const moved = from.hand.filter((card) => chosen.has(card.id));
      if (!moved.length) return [];
      from.hand = from.hand.filter((card) => !chosen.has(card.id));
      to.hand.push(...moved);
      from.hand.sort(sortCards);
      to.hand.sort(sortCards);
      return moved;
    }
    function humanPickSmuggleTarget(play, candidateIds) {
      if (play.playerIndex !== 0 || candidateIds.length <= 1) return candidateIds[0];
      const list = candidateIds.map((id) => `${id}: ${seatLabel(id)}`).join('\n');
      const picked = window.prompt(`Smuggle Bone: choose target seat id\n${list}`, String(candidateIds[0]));
      const pickedId = Number(picked);
      return candidateIds.includes(pickedId) ? pickedId : candidateIds[0];
    }
    function humanPickTrapCardIds(fromId, maxCount) {
      const from = state.players[fromId];
      if (fromId !== 0 || !from) return null;
      const cap = Math.min(Math.max(0, Number(maxCount) || 0), from.hand.length);
      if (!cap) return [];
      const options = from.hand.map((card, index) => `${index + 1}: ${card.trickType ? card.trickType.toUpperCase() : (card.wild ? 'Wild' : `Rank ${card.rank}`)}`);
      const answer = window.prompt(`Trap Bone: choose ${cap} card index${cap === 1 ? '' : 'es'} to give (comma-separated)\n${options.join('\n')}`);
      if (!answer) return null;
      const pickedIndexes = answer.split(',').map((token) => Number(token.trim()) - 1).filter((index) => Number.isInteger(index) && index >= 0 && index < from.hand.length);
      const uniqueIndexes = [...new Set(pickedIndexes)].slice(0, cap);
      if (uniqueIndexes.length !== cap) return null;
      return uniqueIndexes.map((index) => from.hand[index].id);
    }
    function applySmuggleTransferOnPassedClaim(play) {
      if (!play.cards.some((card) => card.trickType === 'smuggle')) return;
      const movedCards = play.cards.filter((card) => card.trickType !== 'smuggle');
      if (!movedCards.length) return;
      const candidateIds = alivePlayers().map((player) => player.id).filter((id) => id !== play.playerIndex);
      if (!candidateIds.length) return;
      if (play.playerIndex === 0) {
        state.smuggleSelection = {
          playCardIds: movedCards.map((card) => card.id),
          candidateIds,
          selectedTargetId: candidateIds[0],
        };
        addLog('Smuggle Bone ready: choose a seat and offload bones.');
        render();
        return;
      }
      const targetId = humanPickSmuggleTarget(play, candidateIds);
      state.players[targetId].hand.push(...movedCards);
      state.players[targetId].hand.sort(sortCards);
      play.cards = play.cards.filter((card) => card.trickType === 'smuggle');
      addLog(`Smuggle Bone triggers: ${seatLabel(play.playerIndex)} moves ${movedCards.length} claimed card${movedCards.length === 1 ? '' : 's'} into ${seatLabel(targetId)}'s hand.`);
    }
    function resolvePendingSmuggleSelection() {
      const selection = state.smuggleSelection;
      if (!selection) return;
      const lastPlay = state.pile[state.pile.length - 1];
      if (!lastPlay) {
        state.smuggleSelection = null;
        return;
      }
      const movedCards = lastPlay.cards.filter((card) => selection.playCardIds.includes(card.id));
      const targetId = selection.selectedTargetId;
      if (movedCards.length && Number.isInteger(targetId)) {
        state.players[targetId].hand.push(...movedCards);
        state.players[targetId].hand.sort(sortCards);
        lastPlay.cards = lastPlay.cards.filter((card) => !selection.playCardIds.includes(card.id));
        addLog(`Smuggle Bone triggers: You offload ${movedCards.length} claimed card${movedCards.length === 1 ? '' : 's'} to ${seatLabel(targetId)}.`);
      }
      const resumePlayerIndex = selection.resumePlayerIndex;
      state.smuggleSelection = null;
      render();
      if (Number.isInteger(resumePlayerIndex)) continueAfterNoChallenge(resumePlayerIndex);
    }
    function applyTrapTransferOnDefendedChallenge(play, challengedId, challengerId) {
      if (!play.cards.some((card) => card.trickType === 'trap')) return;
      if (challengedId === 0) {
        state.trapSelection = { challengerId, maxCount: Math.min(play.cards.length, state.players[0].hand.length) };
        state.selectedCardIds.clear();
        render();
        return;
      }
      let moved = [];
      const selectedCardIds = humanPickTrapCardIds(challengedId, play.cards.length);
      if (Array.isArray(selectedCardIds)) moved = transferSpecificCardsBetweenHands(challengedId, challengerId, selectedCardIds);
      if (!moved.length) moved = transferCardsBetweenHands(challengedId, challengerId, play.cards.length);
      if (!moved.length) return;
      addLog(`Trap Bone triggers: ${seatLabel(challengedId)} transfers ${moved.length} card${moved.length === 1 ? '' : 's'} to ${seatLabel(challengerId)}.`);
    }
    function resolvePendingTrapSelection() {
      if (!state.trapSelection) return;
      const { challengerId, maxCount } = state.trapSelection;
      const selectedIds = [...state.selectedCardIds].slice(0, maxCount);
      let moved = transferSpecificCardsBetweenHands(0, challengerId, selectedIds);
      if (!moved.length) moved = transferCardsBetweenHands(0, challengerId, maxCount);
      if (moved.length) addLog(`Trap Bone triggers: You transfer ${moved.length} card${moved.length === 1 ? '' : 's'} to ${seatLabel(challengerId)}.`);
      state.selectedCardIds.clear();
      state.trapSelection = null;
      render();
    }
    function applyPunishTransferOnSuccessfulChallenge(play, challengerId, challengedId) {
      if (!state.players[challengerId]?.trickPunishActive) return;
      state.players[challengerId].trickPunishActive = false;
      const moved = transferCardsBetweenHands(challengerId, challengedId, play.cards.length);
      if (!moved.length) return;
      addLog(`Punish Bone triggers: ${seatLabel(challengerId)} gives ${moved.length} card${moved.length === 1 ? '' : 's'} to ${seatLabel(challengedId)}.`);
    }
        function normalizedAssetPath(basePath, fileName) {
      const safeBase = String(basePath || '').replace(/\/+$/, '');
      const safeFile = String(fileName || '').replace(/^\/+/, '');
      return `${safeBase}/${safeFile}`;
    }
    function rankAssetFromTemplate(template, rank) {
      return String(template || '').replaceAll('{rank}', String(rank));
    }
    function formatChallengePrompt(lastPlay) {
      return SCRATCHBONES_GAME.uiText.challengePromptTemplate
        .replaceAll('{seat}', seatLabel(lastPlay.playerIndex))
        .replaceAll('{count}', String(lastPlay.cards.length))
        .replaceAll('{rank}', String(lastPlay.declaredRank));
    }
    function resolveScratchbone2DAsset(card, { flipped = false } = {}) {
      const clampedRank = Math.max(1, Math.min(RANK_COUNT, Number(card?.rank) || 1));
      if (flipped) {
        return {
          src: normalizedAssetPath(SCRATCHBONES_GAME.assets.cardHudBasePath, SCRATCHBONES_GAME.assets.flippedCardSrc),
          fallbackSrc: normalizedAssetPath(SCRATCHBONES_GAME.assets.cardHudBasePath, SCRATCHBONES_GAME.assets.flippedCardFallbackSrc),
        };
      }
      if (card?.trickType && SCRATCHBONES_GAME.assets?.trickCardSrc?.[card.trickType]) {
        return {
          src: normalizedAssetPath(SCRATCHBONES_GAME.assets.cardHudBasePath, SCRATCHBONES_GAME.assets.trickCardSrc[card.trickType]),
          fallbackSrc: normalizedAssetPath(SCRATCHBONES_GAME.assets.cardHudBasePath, SCRATCHBONES_GAME.assets.trickCardFallbackSrc?.[card.trickType] || SCRATCHBONES_GAME.assets.trickCardSrc[card.trickType]),
        };
      }
      if (card?.wild) {
        return {
          src: normalizedAssetPath(SCRATCHBONES_GAME.assets.cardHudBasePath, SCRATCHBONES_GAME.assets.wildCardSrc),
          fallbackSrc: normalizedAssetPath(SCRATCHBONES_GAME.assets.cardHudBasePath, SCRATCHBONES_GAME.assets.wildCardFallbackSrc),
        };
      }
      return {
        src: normalizedAssetPath(SCRATCHBONES_GAME.assets.cardHudBasePath, rankAssetFromTemplate(SCRATCHBONES_GAME.assets.rankCardTemplateSrc, clampedRank)),
        fallbackSrc: normalizedAssetPath(SCRATCHBONES_GAME.assets.cardHudBasePath, rankAssetFromTemplate(SCRATCHBONES_GAME.assets.rankCardTemplateFallbackSrc, clampedRank)),
      };
    }
    function wireScratchboneImageFallbacks(root = document) {
      root.querySelectorAll('img[data-fallback-src]').forEach(img => {
        const fallbackSrc = img.getAttribute('data-fallback-src');
        if (!fallbackSrc || img.dataset.fallbackApplied === 'true') return;
        img.addEventListener('error', () => {
          if (img.dataset.fallbackApplied === 'true') return;
          img.dataset.fallbackApplied = 'true';
          img.src = fallbackSrc;
        }, { once: true });
      });
    }
    function showChallengeCountdownBurst(count, durationMs) {
      const cluster = document.querySelector('.claimCluster');
      if (!cluster) return;
      cluster.querySelectorAll('.challenge-countdown-burst').forEach(el => el.remove());
      const shell = document.createElement('div');
      shell.className = 'fx-burst-shell challenge-countdown-burst';
      const inner = document.createElement('div');
      inner.className = 'cin-action-burst burst-countdown';
      inner.textContent = count;
      inner.style.animation = `cinBurst ${(durationMs / 1000).toFixed(2)}s both`;
      shell.appendChild(inner);
      cluster.appendChild(shell);
      setTimeout(() => { if (shell.parentNode) shell.remove(); }, durationMs + 100);
    }
    function startChallengeTimer({ durationMs = CHALLENGE_TIMER_SECS * 1000, onExpire = null } = {}) {
      clearChallengeTimer();
      const totalDurationMs = Math.max(1, Number(durationMs) || (CHALLENGE_TIMER_SECS * 1000));
      const tickMs = Math.max(1, Math.round(totalDurationMs / 3));
      const burstDurationMs = Math.max(120, tickMs - 80);
      traceGameplay('challenge.timer-start', { totalDurationMs, tickMs, burstDurationMs, hasOnExpire: typeof onExpire === 'function' });
      const expireHandler = typeof onExpire === 'function'
        ? onExpire
        : () => humanAcceptNoChallenge();
      showChallengeCountdownBurst(3, burstDurationMs);
      state.challengeTimerT1 = setTimeout(() => showChallengeCountdownBurst(2, burstDurationMs), tickMs);
      state.challengeTimerT2 = setTimeout(() => showChallengeCountdownBurst(1, burstDurationMs), tickMs * 2);
      state.challengeTimer = setTimeout(() => {
        state.challengeTimer = null;
        if (state.challengeWindow && !state.betting && !state.gameOver) {
          traceGameplay('challenge.timer-expire', {
            activePlayer: state.challengeWindow?.lastPlay?.playerIndex ?? null,
            challengeSession: state.challengeDecisionSession,
          });
          expireHandler();
        }
      }, totalDurationMs);
    }
    function clearChallengeTimer() {
      clearTimeout(state.challengeTimer);
      state.challengeTimer = null;
      clearTimeout(state.challengeTimerT1);
      state.challengeTimerT1 = null;
      clearTimeout(state.challengeTimerT2);
      state.challengeTimerT2 = null;
      state.challengeTimeLeft = 0;
    }
    function updateChallengeBoxTimer() {}
    function clampNumber(value, min, max) {
      return Math.min(max, Math.max(min, value));
    }
    function isOverflowing(node, tolerancePx = 1) {
      if (!node) return false;
      const overflowY = (node.scrollHeight - node.clientHeight) > tolerancePx;
      const overflowX = (node.scrollWidth - node.clientWidth) > tolerancePx;
      return overflowX || overflowY;
    }
    function normalizeFitPolicy(policy) {
      if (!policy || policy.enabled === false) return null;
      const stages = Array.isArray(policy.stages) && policy.stages.length
        ? policy.stages
        : [
            { fontScale: 0.96, imageScale: 0.95, gapScale: 0.94 },
            { fontScale: 0.92, imageScale: 0.90, gapScale: 0.88 },
            { fontScale: 0.88, imageScale: 0.86, gapScale: 0.82 },
            { fontScale: 0.84, imageScale: 0.82, gapScale: 0.76 },
          ];
      return {
        stages,
        overflowTolerancePx: Math.max(0, Number(policy.overflowTolerancePx) || 1),
        minReadableFontScale: clampNumber(Number(policy.minReadableFontScale) || 0.76, 0.5, 1),
        targets: policy.targets || {},
        overlap: policy.overlap || {},
      };
    }
    function normalizeOverlapPolicy(overlapPolicy, normalizedPolicy) {
      if (!overlapPolicy || overlapPolicy.enabled === false) return null;
      const criticalRegions = overlapPolicy.criticalRegions && typeof overlapPolicy.criticalRegions === 'object'
        ? overlapPolicy.criticalRegions
        : {};
      return {
        criticalRegions,
        tolerancePx: Math.max(0, Number(overlapPolicy.tolerancePx) || 0),
        collapseOrder: Array.isArray(overlapPolicy.collapseOrder) ? overlapPolicy.collapseOrder : [],
        preserveRegions: Array.isArray(overlapPolicy.preserveRegions) ? overlapPolicy.preserveRegions : [],
        minContainerScale: clampNumber(Number(overlapPolicy.minContainerScale) || normalizedPolicy.minReadableFontScale, 0.5, 1),
        containerScaleStep: clampNumber(Number(overlapPolicy.containerScaleStep) || 0.04, 0.01, 0.2),
      };
    }
    function rectsIntersect(rectA, rectB, tolerancePx = 0) {
      if (!rectA || !rectB) return false;
      return (
        rectA.left < (rectB.right - tolerancePx)
        && (rectA.right - tolerancePx) > rectB.left
        && rectA.top < (rectB.bottom - tolerancePx)
        && (rectA.bottom - tolerancePx) > rectB.top
      );
    }
    function collectCriticalRegionRects(rootEl, overlapPolicy) {
      const entries = Object.entries(overlapPolicy.criticalRegions || {});
      const regions = [];
      for (const [key, selector] of entries) {
        if (!selector || typeof selector !== 'string') continue;
        const node = rootEl.querySelector(selector);
        if (!node || node.dataset.layoutCollapsed === 'true') continue;
        const rect = node.getBoundingClientRect();
        if (!(rect.width > 0) || !(rect.height > 0)) continue;
        regions.push({ key, selector, node, rect });
      }
      return regions;
    }
    function detectCriticalOverlaps(regions, tolerancePx = 0) {
      const overlaps = [];
      for (let i = 0; i < regions.length; i++) {
        for (let j = i + 1; j < regions.length; j++) {
          const regionA = regions[i];
          const regionB = regions[j];
          if (rectsIntersect(regionA.rect, regionB.rect, tolerancePx)) {
            overlaps.push({
              a: { key: regionA.key, selector: regionA.selector },
              b: { key: regionB.key, selector: regionB.selector },
            });
          }
        }
      }
      return overlaps;
    }
    function applyFitStageClass(targetNode, stageClassNames, stage) {
      if (!targetNode) return;
      targetNode.classList.remove(...stageClassNames, 'fit-0');
      targetNode.classList.add('fit-target');
      if (stage > 0) targetNode.classList.add(`fit-${stage}`);
      else targetNode.classList.add('fit-0');
    }
    function tryCollapseNonCriticalPanels(rootEl, overlapPolicy, overlaps) {
      const activeOverlaps = Array.isArray(overlaps) ? overlaps : [];
      if (activeOverlaps.length) {
        console.warn('[layout] overlap unresolved after shrink passes; keeping panels visible.', {
          overlaps: activeOverlaps,
          collapseOrder: overlapPolicy?.collapseOrder || [],
        });
      }
      return { collapsed: [], overlaps: activeOverlaps };
    }
    function fitContainer(rootEl, policy) {
      if (!rootEl) return {};
      const normalizedPolicy = normalizeFitPolicy(policy);
      if (!normalizedPolicy) return {};
      const stageClassNames = normalizedPolicy.stages.map((_, index) => `fit-${index + 1}`);
      const targetEntries = Object.entries(normalizedPolicy.targets || {});
      const fitSummary = {};
      const overlapPolicy = normalizeOverlapPolicy(normalizedPolicy.overlap, normalizedPolicy);
      const overlapSnapshot = [];
      for (const [targetKey, targetPolicy] of targetEntries) {
        const selector = targetPolicy?.selector;
        if (!selector) continue;
        const targetNode = rootEl.querySelector(selector);
        if (!targetNode) {
          fitSummary[targetKey] = { selector, found: false, stage: 0, overflowing: false };
          continue;
        }
        const containmentNode = targetPolicy?.containmentSelector
          ? (targetNode.querySelector(targetPolicy.containmentSelector) || targetNode)
          : targetNode;
        const targetFloor = clampNumber(
          Number(targetPolicy?.minReadableFontScale) || normalizedPolicy.minReadableFontScale,
          0.5,
          1
        );
        const configuredMaxStage = Math.max(0, Number(targetPolicy?.maxStage) || normalizedPolicy.stages.length);
        const floorLimitedStage = normalizedPolicy.stages.reduce((maxAllowed, stageConfig, stageIndex) => {
          return Number(stageConfig.fontScale) >= targetFloor ? stageIndex + 1 : maxAllowed;
        }, 0);
        const maxStage = Math.min(configuredMaxStage, floorLimitedStage > 0 ? floorLimitedStage : 0);
        let stage = 0;
        applyFitStageClass(targetNode, stageClassNames, stage);
        let overflowing = isOverflowing(containmentNode, normalizedPolicy.overflowTolerancePx);
        while (overflowing && stage < maxStage) {
          stage++;
          applyFitStageClass(targetNode, stageClassNames, stage);
          overflowing = isOverflowing(containmentNode, normalizedPolicy.overflowTolerancePx);
        }
        fitSummary[targetKey] = {
          selector,
          containmentSelector: targetPolicy?.containmentSelector || null,
          stage,
          maxStage,
          floor: targetFloor,
          overflowing,
          scrollHeight: containmentNode.scrollHeight,
          clientHeight: containmentNode.clientHeight,
          scrollWidth: containmentNode.scrollWidth,
          clientWidth: containmentNode.clientWidth,
        };
      }
      if (!overlapPolicy) {
        return { fitSummary, overlap: { overlaps: [], stage: 'disabled', snapshot: [] } };
      }
      const stageOrder = ['text', 'image', 'gap', 'container'];
      let regions = collectCriticalRegionRects(rootEl, overlapPolicy);
      let overlaps = detectCriticalOverlaps(regions, overlapPolicy.tolerancePx);
      for (const stageName of stageOrder) {
        if (!overlaps.length) break;
        for (const [targetKey, targetPolicy] of targetEntries) {
          if (!overlaps.length) break;
          const targetNode = rootEl.querySelector(targetPolicy?.selector || '');
          const fitInfo = fitSummary[targetKey];
          if (!targetNode || !fitInfo) continue;
          if (fitInfo.stage >= fitInfo.maxStage) continue;
          fitInfo.stage += 1;
          applyFitStageClass(targetNode, stageClassNames, fitInfo.stage);
          fitInfo.overflowing = isOverflowing(
            targetPolicy?.containmentSelector
              ? (targetNode.querySelector(targetPolicy.containmentSelector) || targetNode)
              : targetNode,
            normalizedPolicy.overflowTolerancePx
          );
          regions = collectCriticalRegionRects(rootEl, overlapPolicy);
          overlaps = detectCriticalOverlaps(regions, overlapPolicy.tolerancePx);
        }
        overlapSnapshot.push({
          kind: 'fit-stage-pass',
          stage: stageName,
          overlaps: overlaps.map((entry) => ({ offending: [entry.a.key, entry.b.key], selectors: [entry.a.selector, entry.b.selector] })),
        });
      }
      let containerScale = 1;
      while (overlaps.length && containerScale > overlapPolicy.minContainerScale) {
        containerScale = clampNumber(containerScale - overlapPolicy.containerScaleStep, overlapPolicy.minContainerScale, 1);
        rootEl.style.setProperty('--layout-parent-height-scale', containerScale.toFixed(3));
        regions = collectCriticalRegionRects(rootEl, overlapPolicy);
        overlaps = detectCriticalOverlaps(regions, overlapPolicy.tolerancePx);
        overlapSnapshot.push({
          kind: 'container-scale',
          stage: 'container',
          containerScale: Number(containerScale.toFixed(3)),
          overlaps: overlaps.map((entry) => ({ offending: [entry.a.key, entry.b.key], selectors: [entry.a.selector, entry.b.selector] })),
        });
      }
      const collapseResult = overlaps.length
        ? tryCollapseNonCriticalPanels(rootEl, overlapPolicy, overlaps)
        : { collapsed: [], overlaps };
      overlaps = collapseResult.overlaps;
      return {
        fitSummary,
        overlap: {
          overlaps,
          stage: overlaps.length ? 'unresolved-visible' : 'resolved',
          containerScale: Number(containerScale.toFixed(3)),
          collapsed: [],
          snapshot: overlapSnapshot,
        },
      };
    }
    function syncDebugSnapshotPre() {
      const debugPre = document.getElementById('debugSnapshotData');
      if (!debugPre || !DEBUG_ENABLED) return;
      debugPre.textContent = JSON.stringify(debugSnapshot(), null, 2);
    }
    function applyResponsiveFit(rootEl = document.getElementById('app')) {
      const layoutResult = fitContainer(rootEl, SCRATCHBONES_GAME.layout?.fitter);
      updateLayoutDiagnosticsState(layoutDiagnostics, layoutResult);
      syncDebugSnapshotPre();
      return layoutDiagnostics.fitStages;
    }
    function getLayoutRegionsConfig() {
      const layoutRegions = SCRATCHBONES_GAME.layout?.regions || {};
      return {
        actionFocus: {
          enabled: layoutRegions.actionFocus?.enabled === true,
          replaceWithFloatingClaimCluster: layoutRegions.actionFocus?.replaceWithFloatingClaimCluster !== false,
        },
        turnSpotlight: {
          enabled: layoutRegions.turnSpotlight?.enabled !== false,
          mustStayVisible: layoutRegions.turnSpotlight?.mustStayVisible !== false,
          avatarSizePx: Number(layoutRegions.turnSpotlight?.avatarSizePx) || 180,
          nameBarBelowAvatar: layoutRegions.turnSpotlight?.nameBarBelowAvatar !== false,
        },
        contextBox: {
          enabled: layoutRegions.contextBox?.enabled !== false,
          sharedDeclareAndChallengeSlot: layoutRegions.contextBox?.sharedDeclareAndChallengeSlot !== false,
          mustStayVisible: layoutRegions.contextBox?.mustStayVisible !== false,
        },
        log: {
          enabled: layoutRegions.log?.enabled === true,
        },
      };
    }
    function getClaimClusterConfig() {
      const claimCluster = SCRATCHBONES_GAME.layout?.claimCluster || {};
      const elements = claimCluster.elements || {};
      return {
        enabled: claimCluster.enabled !== false,
        anchor: claimCluster.anchor || 'tableView',
        scaleAsOne: claimCluster.scaleAsOne !== false,
        preserveRelativePositions: claimCluster.preserveRelativePositions !== false,
        mustStayVisible: claimCluster.mustStayVisible !== false,
        transparentShells: claimCluster.transparentShells !== false,
        geometry: {
          centerXPct: Number(claimCluster.geometry?.centerXPct ?? 0.50),
          centerYPct: Number(claimCluster.geometry?.centerYPct ?? 0.54),
          widthPctOfTableView: Number(claimCluster.geometry?.widthPctOfTableView ?? 0.78),
          heightPctOfTableView: Number(claimCluster.geometry?.heightPctOfTableView ?? 0.48),
        },
        elements: {
          claimRankBox: elements.claimRankBox || { xPct: 0.50, yPct: 0.08, wPct: 0.12, hPct: 0.18 },
          claimHandBar: elements.claimHandBar || { xPct: 0.50, yPct: 0.52, wPct: 0.42, hPct: 0.30 },
          actorAvatarFloat: elements.actorAvatarFloat || { xPct: 0.14, yPct: 0.52, wPct: 0.16, hPct: 0.24 },
          reactorAvatarFloat: elements.reactorAvatarFloat || { xPct: 0.86, yPct: 0.52, wPct: 0.16, hPct: 0.24 },
          claimTimesBoxLeft: elements.claimTimesBoxLeft || { xPct: 0.26, yPct: 0.52, wPct: 0.07, hPct: 0.13 },
          claimCountBoxLeft: elements.claimCountBoxLeft || { xPct: 0.26, yPct: 0.66, wPct: 0.07, hPct: 0.13 },
          claimTimesBoxRight: elements.claimTimesBoxRight || { xPct: 0.74, yPct: 0.52, wPct: 0.07, hPct: 0.13 },
          claimCountBoxRight: elements.claimCountBoxRight || { xPct: 0.74, yPct: 0.66, wPct: 0.07, hPct: 0.13 },
          cinematicPane: elements.cinematicPane || { xPct: 0.50, yPct: 0.91, wPct: 0.50, hPct: 0.28 },
        },
      };
    }
    function claimClusterElementStyle(elementLayout) {
      const xPct = clampNumber(Number(elementLayout?.xPct ?? 0.5), 0, 1);
      const yPct = clampNumber(Number(elementLayout?.yPct ?? 0.5), 0, 1);
      const wPct = clampNumber(Number(elementLayout?.wPct ?? 0.1), 0.01, 1);
      return `left:${(xPct * 100).toFixed(2)}%;top:${(yPct * 100).toFixed(2)}%;width:${(wPct * 100).toFixed(2)}%;`;
    }
    function applyLayoutContract(app) {
      if (!app) return null;
      const layout = SCRATCHBONES_GAME.layout || {};
      const layoutRegions = getLayoutRegionsConfig();
      const claimCluster = getClaimClusterConfig();
      const layoutSizing = layout.sizing || {};
      const layoutCards = layout.cards || {};
      const bettingLayout = layout.betting || {};
      const viewportLayout = layout.viewport || {};
      const handLayout = layout.hand || {};
      const handPanelLayout = handLayout.panel || {};
      const handPanelVisible = handLayout.visible !== false;
      const tableViewLayout = layout.tableView || {};
      const backgroundLayout = layout.background || {};
      const lightingLayout = layout.lighting || {};
      const flameLighting = lightingLayout.flame || {};
      const cardShadowLighting = lightingLayout.cardShadow || {};
      const cardBaseScale = clampNumber(Number(layoutCards.baseScale) || 0.25, 0.1, 0.75);
      const desiredHeightFrac = clampNumber(Number(handLayout.desiredHeightFrac) || 0.20, 0.08, 0.60);
      const handHeightScale = clampNumber(Number(handLayout.heightScale) || 0.5, 0.2, 0.75);
      const configuredHandMinHeightPx = Math.max(80, Number(handLayout.minHeightPx) || 160);
      const configuredHandMaxHeightPx = Math.max(configuredHandMinHeightPx, Number(handLayout.maxHeightPx) || 360);
      const controlsBelow = String(layout.controlsToHandRelationship || 'below').toLowerCase() === 'below';
      const forceAllVisible = handLayout.forceAllVisible !== false;
      const compactEnabled = forceAllVisible && handLayout.compact?.enabled !== false;
      const compactCardMinWidthPx = clampNumber(Number(handLayout.compact?.cardMinWidthPx) || 64, 48, 120);
      const compactCardGapPx = clampNumber(Number(handLayout.compact?.cardGapPx) || 6, 2, 16);
      const compactCardMinHeightPx = clampNumber(Number(handLayout.compact?.cardMinHeightPx) || 128, 96, 240);
      const tableViewDesiredHeightFrac = clampNumber(Number(tableViewLayout.desiredHeightFrac) || 0.58, 0.51, 0.9);
      const tableMinDominanceFrac = clampNumber(Number(tableViewLayout.minDominanceFrac) || 0.56, 0.51, 0.9);
      const configuredTableViewMinHeightPx = clampNumber(Number(tableViewLayout.minHeightPx) || 260, 180, 1200);
      const configuredTableViewMaxHeightPx = Math.max(configuredTableViewMinHeightPx, clampNumber(Number(tableViewLayout.maxHeightPx) || 680, configuredTableViewMinHeightPx, 1600));
      const turnSpotlightLayout = tableViewLayout.turnSpotlight || {};
      const tableVisualFit = tableViewLayout.visualFit || {};
      const tableCardVisualMode = ['facedown', 'faceup'].includes(String(tableViewLayout.cardVisualMode || '').toLowerCase())
        ? String(tableViewLayout.cardVisualMode).toLowerCase()
        : 'facedown';
      const cinematicEnabled = tableViewLayout.cinematic?.enabled !== false;
      const actionColumnHeightScale = clampNumber(Number(layout.actionColumn?.heightScale) || 0.25, 0.1, 0.75);
      const controlsHeightScale = clampNumber(Number(layout.controls?.heightScale) || 0.5, 0.2, 0.9);
      const logRegionEnabled = layoutRegions.log?.enabled === true;
      const root = document.documentElement;
      const cssTargets = [root, app];
      const setCssVar = (name, value) => {
        for (const target of cssTargets) target.style.setProperty(name, value);
      };
      const numberOrDefault = (value, fallback) => {
        const numericValue = Number(value);
        return Number.isFinite(numericValue) ? numericValue : fallback;
      };
      const cssLengthOrDefault = (value, fallback) => {
        const raw = String(value ?? '').trim();
        if (!raw) return fallback;
        if (/^clamp\(.+\)$/i.test(raw)) return raw;
        if (/^-?\d+(\.\d+)?(px|%|rem|em|vw|vh)$/.test(raw)) return raw;
        return fallback;
      };
      const viewportWidthPx = Math.max(320, Number(viewportLayout.widthPx) || Number(app?.clientWidth) || 320);
      const viewportHeightPx = Math.max(180, Number(viewportLayout.heightPx) || Number(app?.clientHeight) || 180);
      const appWidthPx = Math.max(320, Number(app?.clientWidth) || Number(window?.innerWidth) || 0);
      const appHeightPx = Math.max(180, Number(app?.clientHeight) || Number(window?.innerHeight) || 0);
      const handMinHeightPx = Math.max(64, Math.min(configuredHandMinHeightPx, Math.round(appHeightPx * 0.18)));
      const maxHeightPx = Math.max(handMinHeightPx, configuredHandMaxHeightPx);
      const tableViewMinHeightPx = Math.max(96, Math.min(configuredTableViewMinHeightPx, Math.round(appHeightPx * 0.30)));
      const tableViewMaxHeightPx = Math.max(tableViewMinHeightPx, configuredTableViewMaxHeightPx);
      const sidebarWidthFracRaw = Number(layoutSizing.sidebarWidthFrac);
      const sidebarWidthFrac = Number.isFinite(sidebarWidthFracRaw)
        ? clampNumber(sidebarWidthFracRaw, 0.25, 0.9)
        : null;
      const sidebarWidthTargetPx = sidebarWidthFrac !== null
        ? appWidthPx * sidebarWidthFrac
        : (Number(layoutSizing.sidebarWidthPx) || 280);
      const sidebarWidthPxRaw = clampNumber(sidebarWidthTargetPx, 120, Math.max(220, appWidthPx - 140));
      const sidebarWidthPx = clampNumber(sidebarWidthPxRaw * 0.5, 90, Math.max(140, appWidthPx - 140));
      const appGapPx = clampNumber(Number(layoutSizing.appGapPx) || 8, 0, 40);
      const appPaddingPx = clampNumber(Number(layoutSizing.appPaddingPx) || 8, 0, 48);
      const seatAvatarPx = clampNumber(Number(layoutSizing.seatAvatarPx) || 132, 72, 280);
      const humanSeatAvatarPx = clampNumber(Number(layoutSizing.humanSeatAvatarPx) || 204, seatAvatarPx, 360);
      const cinematicAvatarPx = clampNumber(Number(layoutSizing.cinematicAvatarPx) || seatAvatarPx, 72, 320);
      const turnSpotlightAvatarPx = clampNumber(Number(layoutRegions.turnSpotlight.avatarSizePx) || 180, 80, 320);
      const turnSpotlightOffsetXPx = clampNumber(Number(turnSpotlightLayout.offsetXPx) || 10, 0, 120);
      const turnSpotlightOffsetYPx = clampNumber(Number(turnSpotlightLayout.offsetYPx) || 10, 0, 120);
      const tableCardContainerScale = clampNumber(Number(tableVisualFit.tableCardContainerScale) || 1.25, 0.75, 2.25);
      const tableCardContentScale = clampNumber(Number(tableVisualFit.tableCardContentScale) || 0.8, 0.45, 1);
      const claimAvatarSizePx = clampNumber(Number(tableVisualFit.claimAvatarSizePx) || 270, 80, 320);
      const claimAvatarZoomScale = clampNumber(Number(tableVisualFit.claimAvatarZoomScale) || 1.2, 0.8, 1.6);
      const claimAvatarBorderRadiusPx = clampNumber(Number(tableVisualFit.claimAvatarBorderRadiusPx) || 12, 0, 48);
      const claimAvatarBorderColor = String(tableVisualFit.claimAvatarBorderColor || 'rgba(242,208,143,0.28)');
      const claimAvatarBackground = String(tableVisualFit.claimAvatarBackground || 'rgba(22,16,14,0.72)');
      const avatarAdditiveZoomScale = clampNumber(Number(tableVisualFit.avatarAdditiveZoomScale) || 1.2, 0.8, 1.6);
      const claimAvatarOverlayZIndex = Math.max(1, Math.round(Number(tableVisualFit.claimAvatarOverlayZIndex) || 9990));
      const cinematicLayout = tableViewLayout.cinematic || {};
      const cinematicPlayerInfoOffsetPx = clampNumber(Number(cinematicLayout.playerInfoOffsetPx) || 12, -40, 160);
      const cinematicPlayerInfoFontRem = clampNumber(Number(cinematicLayout.playerInfoFontRem) || 1.05, 0.6, 3);
      const claimTitleOffsetYPx = clampNumber(Number(cinematicLayout.claimTitleOffsetYPx) || -150, -420, 160);
      const claimBetControlsOffsetYPx = clampNumber(Number(cinematicLayout.betControlsOffsetYPx) || Math.abs(claimTitleOffsetYPx), 0, 420);
      const claimTitleScale = clampNumber(Number(cinematicLayout.claimTitleScale) || 1.5, 0.6, 3.2);
      const cinematicBurstFontRem = clampNumber(Number(cinematicLayout.betActionBurstFontRem) || 2, 0.75, 5);
      const cinematicBurstDurationSec = clampNumber(Number(cinematicLayout.betActionBurstDurationSec) || 2.1, 0.4, 6);
      const liarBurstFontRem = clampNumber(Number(cinematicLayout.liarBurstFontRem) || 3.2, 1, 7);
      const liarBurstDurationSec = clampNumber(Number(cinematicLayout.liarBurstDurationSec) || 3.2, 0.6, 8);
      const liarBurstEndYPct = clampNumber(Number(cinematicLayout.liarBurstEndYPct) || -180, -320, -110);
      const bettingTitleOffsetY = cssLengthOrDefault(bettingLayout.titleOffsetY, '-80%');
      const bettingChoiceOffsetY = cssLengthOrDefault(bettingLayout.choiceOffsetY, '115%');
      const bettingLeftSlotOffsetX = cssLengthOrDefault(bettingLayout.leftSlotOffsetX, '260px');
      const bettingLeftSlotOffsetY = cssLengthOrDefault(bettingLayout.leftSlotOffsetY, '150px');
      const bettingRightSlotOffsetX = cssLengthOrDefault(bettingLayout.rightSlotOffsetX, '-260px');
      const bettingRightSlotOffsetY = cssLengthOrDefault(bettingLayout.rightSlotOffsetY, '150px');
      const bettingCoinButtonSize = cssLengthOrDefault(bettingLayout.coinButtonSize, 'clamp(58px, 8.6vw, 86px)');
      const bettingContributionCoinSize = cssLengthOrDefault(bettingLayout.contributionCoinSize, 'clamp(48px, 6.7vw, 72px)');
      const bettingTierGap = cssLengthOrDefault(bettingLayout.tierGap, 'clamp(10px, 2.2vw, 20px)');
      const tabletopImageSrcRaw = String(backgroundLayout.tabletopImageSrc || '').trim();
      const tabletopImageSrc = tabletopImageSrcRaw.replace(/["\\]/g, '');
      const flameEnabled = flameLighting.enabled !== false;
      const flameXPct = clampNumber(numberOrDefault(flameLighting.xPct, 0.5), 0, 1);
      const flameYPct = clampNumber(numberOrDefault(flameLighting.yPct, 0.14), -0.5, 0.35);
      const flameCoreAlpha = flameEnabled ? clampNumber(numberOrDefault(flameLighting.coreAlpha, 0.4), 0, 0.45) : 0;
      const flameMidAlpha = flameEnabled ? clampNumber(numberOrDefault(flameLighting.midAlpha, 0.27), 0, 0.35) : 0;
      const flameFarAlpha = flameEnabled ? clampNumber(numberOrDefault(flameLighting.farAlpha, 0.14), 0, 0.2) : 0;
      const flameFlickerSeconds = clampNumber(numberOrDefault(flameLighting.flickerSeconds, 2.9), 1.2, 8);
      const cardShadowOffsetXPx = clampNumber(numberOrDefault(cardShadowLighting.offsetXPx, 1.5), -18, 18);
      const cardShadowOffsetYPx = clampNumber(numberOrDefault(cardShadowLighting.offsetYPx, 9), 0, 28);
      const cardShadowBlurPx = clampNumber(numberOrDefault(cardShadowLighting.blurPx, 12), 0, 40);
      const cardShadowSpreadPx = clampNumber(numberOrDefault(cardShadowLighting.spreadPx, -2), -24, 24);
      const cardShadowAlpha = clampNumber(numberOrDefault(cardShadowLighting.alpha, 0.34), 0, 0.7);
      const cardShadowContactAlpha = clampNumber(numberOrDefault(cardShadowLighting.contactAlpha, 0.2), 0, 0.65);
      const handCardMinWidthPx = clampNumber(Number(layoutSizing.handCardMinWidthPx) || 74, 48, 180);
      const handCardMaxWidthPx = clampNumber(Number(layoutSizing.handCardMaxWidthPx) || 104, handCardMinWidthPx, 220);
      const handCardMinHeightPx = clampNumber(Number(layoutSizing.handCardMinHeightPx) || 146, 88, 280);
      const handCardMaxHeightPx = clampNumber(Number(layoutSizing.handCardMaxHeightPx) || 186, handCardMinHeightPx, 360);
      const handCardGapMinPx = clampNumber(Number(layoutSizing.handCardGapMinPx) || 8, 0, 24);
      const handCardGapMaxPx = clampNumber(Number(layoutSizing.handCardGapMaxPx) || 12, handCardGapMinPx, 32);
      const eventLogMaxHeightPx = clampNumber(Number(layoutSizing.eventLogMaxHeightPx) || 78, 36, 320);
      const controlsPaddingYpx = clampNumber(Number(layoutSizing.controlsPaddingYpx) || 12, 0, 32);
      const controlsPaddingXpx = clampNumber(Number(layoutSizing.controlsPaddingXpx) || 12, 0, 40);
      const controlsGapPx = clampNumber(Number(layoutSizing.controlsGapPx) || 10, 0, 24);
      const handWrapPaddingYpx = clampNumber(Number(layoutSizing.handWrapPaddingYpx) || 8, 0, 32);
      const handWrapPaddingXpx = clampNumber(Number(layoutSizing.handWrapPaddingXpx) || 12, 0, 40);
      const handWrapGapPx = clampNumber(Number(layoutSizing.handWrapGapPx) || 6, 0, 24);
      const handPanelBackground = String(handPanelLayout.background ?? 'transparent').trim() || 'transparent';
      const handPanelBorder = String(handPanelLayout.border ?? '0').trim() || '0';
      const handPanelOutline = String(handPanelLayout.outline ?? 'none').trim() || 'none';
      const handPanelShadow = String(handPanelLayout.shadow ?? 'none').trim() || 'none';
      const eventLogPaddingYpx = clampNumber(Number(layoutSizing.eventLogPaddingYpx) || 8, 0, 32);
      const eventLogPaddingXpx = clampNumber(Number(layoutSizing.eventLogPaddingXpx) || 12, 0, 40);
      const eventLogGapPx = clampNumber(Number(layoutSizing.eventLogGapPx) || 6, 0, 24);
      const logItemPaddingYpx = clampNumber(Number(layoutSizing.logItemPaddingYpx) || 9, 0, 40);
      const logItemPaddingXpx = clampNumber(Number(layoutSizing.logItemPaddingXpx) || 10, 0, 40);
      const scaledCardMinWidthPx = clampNumber(handCardMinWidthPx * (cardBaseScale / 0.25), 44, 320);
      const scaledCardMaxWidthPx = Math.max(scaledCardMinWidthPx, clampNumber(handCardMaxWidthPx * (cardBaseScale / 0.25), scaledCardMinWidthPx, 400));
      const scaledCardMinHeightPx = clampNumber(handCardMinHeightPx * (cardBaseScale / 0.25), 44, 420);
      const scaledCardMaxHeightPx = Math.max(scaledCardMinHeightPx, clampNumber(handCardMaxHeightPx * (cardBaseScale / 0.25), scaledCardMinHeightPx, 520));
      setCssVar('--layout-viewport-width', `${Math.round(viewportWidthPx)}px`);
      setCssVar('--layout-viewport-height', `${Math.round(viewportHeightPx)}px`);
      setCssVar('--hand-height-frac', desiredHeightFrac.toFixed(3));
      setCssVar('--layout-hand-min-height', `${Math.round(handMinHeightPx)}px`);
      setCssVar('--layout-hand-max-height', `${Math.round(maxHeightPx)}px`);
      setCssVar('--layout-table-view-min-height', `${Math.round(tableViewMinHeightPx)}px`);
      setCssVar('--layout-table-view-max-height', `${Math.round(tableViewMaxHeightPx)}px`);
      setCssVar('--layout-turn-spotlight-avatar-size', `${Math.round(turnSpotlightAvatarPx)}px`);
      setCssVar('--layout-turn-spotlight-offset-x', `${Math.round(turnSpotlightOffsetXPx)}px`);
      setCssVar('--layout-turn-spotlight-offset-y', `${Math.round(turnSpotlightOffsetYPx)}px`);
      setCssVar('--layout-claim-cluster-center-x', clampNumber(claimCluster.geometry.centerXPct, 0, 1).toFixed(3));
      setCssVar('--layout-claim-cluster-center-y', clampNumber(claimCluster.geometry.centerYPct, 0, 1).toFixed(3));
      setCssVar('--layout-claim-cluster-width', (clampNumber(claimCluster.geometry.widthPctOfTableView, 0.05, 1) * 100).toFixed(3));
      setCssVar('--layout-claim-cluster-height', (clampNumber(claimCluster.geometry.heightPctOfTableView, 0.05, 1) * 100).toFixed(3));
      setCssVar('--layout-claim-cluster-scale', claimCluster.scaleAsOne ? '1' : '1');
      setCssVar('--layout-table-card-container-scale', tableCardContainerScale.toFixed(3));
      setCssVar('--layout-table-card-content-scale', tableCardContentScale.toFixed(3));
      setCssVar('--layout-claim-avatar-size', `${Math.round(claimAvatarSizePx)}px`);
      setCssVar('--layout-claim-avatar-zoom', claimAvatarZoomScale.toFixed(3));
      setCssVar('--layout-claim-avatar-border-radius', `${claimAvatarBorderRadiusPx.toFixed(2)}px`);
      setCssVar('--layout-claim-avatar-border-color', claimAvatarBorderColor);
      setCssVar('--layout-claim-avatar-background', claimAvatarBackground);
      setCssVar('--layout-fit-additive-avatar-zoom', avatarAdditiveZoomScale.toFixed(3));
      setCssVar('--layout-cinematic-player-info-offset', `${cinematicPlayerInfoOffsetPx.toFixed(2)}px`);
      setCssVar('--layout-cinematic-player-info-font', `${cinematicPlayerInfoFontRem.toFixed(3)}rem`);
      setCssVar('--layout-claim-title-offset-y', `${claimTitleOffsetYPx.toFixed(2)}px`);
      setCssVar('--layout-claim-bet-controls-offset-y', `${claimBetControlsOffsetYPx.toFixed(2)}px`);
      setCssVar('--layout-claim-title-scale', claimTitleScale.toFixed(3));
      setCssVar('--layout-betting-title-offset-y', bettingTitleOffsetY);
      setCssVar('--layout-betting-choice-offset-y', bettingChoiceOffsetY);
      setCssVar('--layout-betting-left-slot-offset-x', bettingLeftSlotOffsetX);
      setCssVar('--layout-betting-left-slot-offset-y', bettingLeftSlotOffsetY);
      setCssVar('--layout-betting-right-slot-offset-x', bettingRightSlotOffsetX);
      setCssVar('--layout-betting-right-slot-offset-y', bettingRightSlotOffsetY);
      setCssVar('--layout-betting-coin-button-size', bettingCoinButtonSize);
      setCssVar('--layout-betting-contribution-coin-size', bettingContributionCoinSize);
      setCssVar('--layout-betting-tier-gap', bettingTierGap);
      setCssVar('--layout-cinematic-burst-font', `${cinematicBurstFontRem.toFixed(3)}rem`);
      setCssVar('--layout-cinematic-burst-duration', `${cinematicBurstDurationSec.toFixed(3)}s`);
      setCssVar('--layout-liar-burst-font', `${liarBurstFontRem.toFixed(3)}rem`);
      setCssVar('--layout-liar-burst-duration', `${liarBurstDurationSec.toFixed(3)}s`);
      setCssVar('--layout-liar-burst-end-y', `${liarBurstEndYPct.toFixed(2)}%`);
      setCssVar('--layout-ui-tabletop-url', tabletopImageSrc ? `url("${tabletopImageSrc}")` : 'none');
      setCssVar('--layout-flame-x', `${(flameXPct * 100).toFixed(2)}%`);
      setCssVar('--layout-flame-y', `${(flameYPct * 100).toFixed(2)}%`);
      setCssVar('--layout-flame-core-alpha', flameCoreAlpha.toFixed(3));
      setCssVar('--layout-flame-mid-alpha', flameMidAlpha.toFixed(3));
      setCssVar('--layout-flame-far-alpha', flameFarAlpha.toFixed(3));
      setCssVar('--layout-flame-flicker-seconds', `${flameFlickerSeconds.toFixed(3)}s`);
      setCssVar('--layout-flame-enabled', flameEnabled ? '1' : '0');
      setCssVar('--layout-card-shadow-offset-x', `${cardShadowOffsetXPx.toFixed(2)}px`);
      setCssVar('--layout-card-shadow-offset-y', `${cardShadowOffsetYPx.toFixed(2)}px`);
      setCssVar('--layout-card-shadow-blur', `${cardShadowBlurPx.toFixed(2)}px`);
      setCssVar('--layout-card-shadow-spread', `${cardShadowSpreadPx.toFixed(2)}px`);
      setCssVar('--layout-card-shadow-alpha', cardShadowAlpha.toFixed(3));
      setCssVar('--layout-card-contact-alpha', cardShadowContactAlpha.toFixed(3));
      setCssVar('--layout-table-dominance-frac', tableMinDominanceFrac.toFixed(3));
      setCssVar('--layout-action-column-height-scale', actionColumnHeightScale.toFixed(3));
      setCssVar('--layout-controls-height-scale', controlsHeightScale.toFixed(3));
      setCssVar('--layout-hand-height-scale', handHeightScale.toFixed(3));
      setCssVar('--layout-card-hand-scale', clampNumber(handHeightScale, 0.2, 1).toFixed(3));
      setCssVar('--layout-card-base-scale', cardBaseScale.toFixed(3));
      setCssVar('--layout-action-column-max-height', `${(actionColumnHeightScale * 100).toFixed(2)}%`);
      setCssVar('--layout-controls-max-height', `${(controlsHeightScale * 100).toFixed(2)}%`);
      setCssVar('--layout-hand-max-row-height', `${(handHeightScale * 100).toFixed(2)}%`);
      setCssVar('--layout-log-max-row-height', logRegionEnabled ? `${(actionColumnHeightScale * 100).toFixed(2)}%` : '0px');
      setCssVar('--hand-compact-card-min', `${Math.round(compactCardMinWidthPx)}px`);
      setCssVar('--hand-compact-card-gap', `${compactCardGapPx.toFixed(2)}px`);
      setCssVar('--hand-compact-card-min-height', `${Math.round(compactCardMinHeightPx)}px`);
      setCssVar('--layout-sidebar-width', `${Math.round(sidebarWidthPx)}px`);
      setCssVar('--layout-app-gap', `${appGapPx.toFixed(2)}px`);
      setCssVar('--layout-app-padding', `${appPaddingPx.toFixed(2)}px`);
      setCssVar('--layout-seat-avatar-size', `${Math.round(seatAvatarPx)}px`);
      setCssVar('--layout-human-seat-avatar-size', `${Math.round(humanSeatAvatarPx)}px`);
      setCssVar('--layout-cinematic-avatar-size', `${Math.round(cinematicAvatarPx)}px`);
      setCssVar('--layout-hand-card-min-width', `${Math.round(scaledCardMinWidthPx)}px`);
      setCssVar('--layout-hand-card-max-width', `${Math.round(scaledCardMaxWidthPx)}px`);
      setCssVar('--layout-hand-card-min-height', `${Math.round(scaledCardMinHeightPx)}px`);
      setCssVar('--layout-hand-card-max-height', `${Math.round(scaledCardMaxHeightPx)}px`);
      setCssVar('--layout-hand-card-gap-min', `${handCardGapMinPx.toFixed(2)}px`);
      setCssVar('--layout-hand-card-gap-max', `${handCardGapMaxPx.toFixed(2)}px`);
      setCssVar('--layout-event-log-max-height', `${Math.round(eventLogMaxHeightPx)}px`);
      setCssVar('--layout-controls-padding-y', `${controlsPaddingYpx.toFixed(2)}px`);
      setCssVar('--layout-controls-padding-x', `${controlsPaddingXpx.toFixed(2)}px`);
      setCssVar('--layout-controls-gap', `${controlsGapPx.toFixed(2)}px`);
      setCssVar('--layout-hand-wrap-padding-y', `${handWrapPaddingYpx.toFixed(2)}px`);
      setCssVar('--layout-hand-wrap-padding-x', `${handWrapPaddingXpx.toFixed(2)}px`);
      setCssVar('--layout-hand-wrap-gap', `${handWrapGapPx.toFixed(2)}px`);
      setCssVar('--layout-hand-panel-background', handPanelBackground);
      setCssVar('--layout-hand-panel-border', handPanelBorder);
      setCssVar('--layout-hand-panel-outline', handPanelOutline);
      setCssVar('--layout-hand-panel-shadow', handPanelShadow);
      setCssVar('--layout-event-log-padding-y', `${eventLogPaddingYpx.toFixed(2)}px`);
      setCssVar('--layout-event-log-padding-x', `${eventLogPaddingXpx.toFixed(2)}px`);
      setCssVar('--layout-event-log-gap', `${eventLogGapPx.toFixed(2)}px`);
      setCssVar('--layout-log-item-padding-y', `${logItemPaddingYpx.toFixed(2)}px`);
      setCssVar('--layout-log-item-padding-x', `${logItemPaddingXpx.toFixed(2)}px`);
      app.classList.toggle('layout-controls-above-hand', !controlsBelow);
      app.classList.toggle('layout-hand-force-all-visible', forceAllVisible);
      app.classList.toggle('layout-hand-compact', compactEnabled);
      return {
        allowChallengeOverflow: layout.allowChallengeOverflow !== false,
        handPanelVisible,
        tableView: {
          desiredHeightFrac: tableViewDesiredHeightFrac,
          minDominanceFrac: tableMinDominanceFrac,
          minHeightPx: tableViewMinHeightPx,
          maxHeightPx: tableViewMaxHeightPx,
          cardVisualMode: tableCardVisualMode,
          turnSpotlight: {
            embedded: turnSpotlightLayout.embedded !== false,
            pinCorner: String(turnSpotlightLayout.pinCorner || 'top-right'),
            offsetXPx: turnSpotlightOffsetXPx,
            offsetYPx: turnSpotlightOffsetYPx,
          },
          visualFit: {
            tableCardContainerScale,
            tableCardContentScale,
            claimAvatarSizePx,
            claimAvatarZoomScale,
            claimAvatarBorderRadiusPx,
            claimAvatarBorderColor,
            claimAvatarBackground,
            avatarAdditiveZoomScale,
            claimAvatarOverlayZIndex,
          },
          cinematicEnabled,
        },
        actionColumn: {
          heightScale: actionColumnHeightScale,
        },
        regions: layoutRegions,
        claimCluster,
        controls: {
          heightScale: controlsHeightScale,
        },
        hand: {
          heightScale: handHeightScale,
        },
      };
    }
    function resolveChallengeLayoutPressure(app, allowChallengeOverflow = true) {
      if (!app) return;
      if (!allowChallengeOverflow) {
        app.classList.remove('layout-challenge-wrap');
        app.style.setProperty('--layout-challenge-font-scale', '1');
        app.style.setProperty('--layout-challenge-image-scale', '1');
        app.style.setProperty('--layout-challenge-gap-scale', '1');
        app.style.setProperty('--layout-parent-height-scale', '1');
        return;
      }
      const challengePane = app.querySelector('#challengePromptPane');
      const challengeActive = !!(challengePane && challengePane.style.display !== 'none');
      if (!challengeActive) {
        app.classList.remove('layout-challenge-wrap');
        app.style.setProperty('--layout-challenge-font-scale', '1');
        app.style.setProperty('--layout-challenge-image-scale', '1');
        app.style.setProperty('--layout-challenge-gap-scale', '1');
        app.style.setProperty('--layout-parent-height-scale', '1');
        return;
      }
      const overflowPx = Math.max(0, challengePane.scrollHeight - challengePane.clientHeight);
      const severity = clampNumber(overflowPx / 220, 0, 1);
      const humanClaimDecisionTurn = state.currentTurn === 0 && !!state.challengeWindow && !state.betting;
      // Deterministic resolver order:
      // 1) wrap text
      // 2) reduce font scale
      // 3) reduce image scale
      // 4) reduce internal gaps/padding
      // 5) reduce parent height proportionally (except on the human decision turn)
      app.classList.toggle('layout-challenge-wrap', overflowPx > 0);
      const fontScale = overflowPx > 0 ? (1 - (0.14 * severity)) : 1;
      const imageScale = overflowPx > 0 ? (1 - (0.16 * severity)) : 1;
      const gapScale = overflowPx > 0 ? (1 - (0.24 * severity)) : 1;
      const parentHeightScale = (overflowPx > 0 && !humanClaimDecisionTurn) ? (1 - (0.18 * severity)) : 1;
      app.style.setProperty('--layout-challenge-font-scale', clampNumber(fontScale, 0.82, 1).toFixed(3));
      app.style.setProperty('--layout-challenge-image-scale', clampNumber(imageScale, 0.78, 1).toFixed(3));
      app.style.setProperty('--layout-challenge-gap-scale', clampNumber(gapScale, 0.72, 1).toFixed(3));
      app.style.setProperty('--layout-parent-height-scale', clampNumber(parentHeightScale, 0.80, 1).toFixed(3));
    }
    function enforceFitContainerBounds(app) {
      if (!app) return;
      const humanSeatZone = app.querySelector('.humanSeatZone');
      if (humanSeatZone) {
        humanSeatZone.style.minWidth = '0';
        humanSeatZone.style.maxWidth = '100%';
      }
      const humanSeatCard = app.querySelector('.humanSeatCard');
      if (humanSeatCard) {
        humanSeatCard.style.minWidth = '0';
        humanSeatCard.style.maxWidth = '100%';
        humanSeatCard.style.overflow = 'hidden';
      }
      const declareRankSelect = app.querySelector('#declareRank');
      if (declareRankSelect) {
        declareRankSelect.style.width = '100%';
        declareRankSelect.style.maxWidth = '100%';
        declareRankSelect.style.boxSizing = 'border-box';
      }
    }
    function updateTableViewHeight(app, tableLayoutPolicy) {
      if (!app || !tableLayoutPolicy) return;
      const topbar = app.querySelector('.topbar');
      const topbarHeight = topbar?.offsetHeight || 0;
      const appStyles = window.getComputedStyle(app);
      const safeInsetBottom = Number.parseFloat(appStyles.getPropertyValue('--safe')) || 0;
      const appGap = Number.parseFloat(appStyles.getPropertyValue('--layout-app-gap')) || 0;
      const appPadding = Number.parseFloat(appStyles.getPropertyValue('--layout-app-padding')) || 0;
      const viewportHeight = Number(app?.clientHeight) || window.innerHeight || document.documentElement.clientHeight || 0;
      const availableHeight = Math.max(0, viewportHeight - topbarHeight - (appPadding * 2) - safeInsetBottom - (appGap * 3));
      const desiredHeightPx = availableHeight * tableLayoutPolicy.desiredHeightFrac;
      const dominantHeightPx = availableHeight * (tableLayoutPolicy.minDominanceFrac || 0.56);
      const tableViewHeightPx = clampNumber(
        Math.max(desiredHeightPx, dominantHeightPx),
        tableLayoutPolicy.minHeightPx,
        tableLayoutPolicy.maxHeightPx
      );
      app.style.setProperty('--layout-table-view-height', `${Math.round(tableViewHeightPx)}px`);
    }
    function isTableCinematicEnabled() {
      return SCRATCHBONES_GAME.layout?.tableView?.cinematic?.enabled !== false;
    }
    const seatAvatarAnim = (() => {
      const CARD_STAGGER_MS = 40;

      let trackedActorId = null;
      let clusterSnapshot = null; // { src, rect }
      let seatPreviewCaptures = new Map(); // playerId → [{rect,src}]
      let activeClone = null;
      let activeDarkClones = [];
      let genId = 0;

      function actorFromState() {
        if (state.betting?.play) return state.betting.play.playerIndex;
        if (state.challengeWindow?.lastPlay) return state.challengeWindow.lastPlay.playerIndex;
        return state.currentTurn ?? null;
      }
      function seatCanvas(id) {
        return document.querySelector(`.seatAvatarBox canvas.seatPortrait[data-seat-id="${id}"]`);
      }
      function clusterCanvas() {
        return document.querySelector('.actorAvatarFloat canvas.seatPortrait');
      }
      function getPreRenderClusterRect() {
        return clusterSnapshot?.rect || null;
      }

      function capturePreRender() {
        // Cancel any in-flight clones from previous animation
        if (activeClone) { activeClone.remove(); activeClone = null; }
        activeDarkClones.forEach(c => c.remove());
        activeDarkClones = [];

        // Always capture cluster canvas (not gated on trackedActorId)
        const canvas = clusterCanvas();
        if (canvas) {
          try {
            clusterSnapshot = { src: canvas.toDataURL(), rect: canvas.getBoundingClientRect() };
          } catch (_) { clusterSnapshot = null; }
        } else {
          clusterSnapshot = null;
        }

        // Capture seat hand preview positions for all players
        seatPreviewCaptures.clear();
        document.querySelectorAll('.seatHandPreview[data-seat-id]').forEach(container => {
          const id = Number(container.dataset.seatId);
          const cards = [];
          container.querySelectorAll('.seatHandCard img').forEach(img => {
            cards.push({ rect: img.getBoundingClientRect(), src: img.src });
          });
          seatPreviewCaptures.set(id, cards);
        });
      }

      function animatePostRender() {
        if (state.cinematicMode) {
          clusterSnapshot = null;
          return;
        }

        const animCfg = SCRATCHBONES_GAME.layout.animation;
        const base = animCfg.baseDurationMs;
        const DIM_MS = base;
        const UNDIM_MS = base;
        const FADE_IN_MS = Math.round(base / animCfg.fadeInSpeed);
        const FADE_OUT_MS = Math.round(base / animCfg.fadeOutSpeed);
        const PREVIEW_DARK_MS = base;

        const myGen = ++genId;
        const prev = trackedActorId;
        const next = actorFromState();
        trackedActorId = next;

        if (prev === next) {
          if (next !== null) {
            const sc = seatCanvas(next);
            if (sc) { sc.style.transition = 'none'; sc.style.filter = 'brightness(0)'; }
            const cc = clusterCanvas();
            if (cc) { cc.style.transition = 'none'; cc.style.opacity = '1'; }
          }
          clusterSnapshot = null;
          return;
        }

        // Set initial states synchronously before first paint
        if (prev !== null) {
          const sc = seatCanvas(prev);
          if (sc) { sc.style.transition = 'none'; sc.style.filter = 'brightness(0)'; }
        }
        if (next !== null) {
          const sc = seatCanvas(next);
          if (sc) { sc.style.transition = 'none'; sc.style.filter = ''; }
          const cc = clusterCanvas();
          if (cc) { cc.style.transition = 'none'; cc.style.opacity = '0'; }
        }

        // Spawn fade-out clone of old cluster canvas
        let cloneEl = null;
        if (clusterSnapshot) {
          cloneEl = document.createElement('img');
          cloneEl.src = clusterSnapshot.src;
          const r = clusterSnapshot.rect;
          cloneEl.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;pointer-events:none;z-index:9998;border-radius:10px;object-fit:cover;opacity:1;transition:none;`;
          document.body.appendChild(cloneEl);
          activeClone = cloneEl;
        }
        clusterSnapshot = null;

        // Spawn darkening clones for opponent's played hand-preview cards
        const playedPreviewClones = [];
        if (next !== null && next !== 0) {
          const oldCards = seatPreviewCaptures.get(next) || [];
          const newCount = state.players[next]?.hand.length ?? 0;
          const playedCount = Math.max(0, oldCards.length - newCount);
          for (let i = 0; i < playedCount; i++) {
            const cd = oldCards[oldCards.length - 1 - i];
            if (!cd) continue;
            const dc = document.createElement('img');
            dc.src = cd.src;
            const r = cd.rect;
            dc.style.cssText = `position:fixed;left:${r.left}px;top:${r.top}px;width:${r.width}px;height:${r.height}px;pointer-events:none;z-index:9997;object-fit:contain;opacity:1;transition:none;`;
            document.body.appendChild(dc);
            activeDarkClones.push(dc);
            playedPreviewClones.push({ el: dc, delay: i * CARD_STAGGER_MS });
          }
        }

        requestAnimationFrame(() => {
          if (genId !== myGen) {
            if (cloneEl) cloneEl.remove();
            playedPreviewClones.forEach(({ el }) => el.remove());
            return;
          }

          if (cloneEl) {
            cloneEl.style.transition = `opacity ${FADE_OUT_MS}ms ease`;
            cloneEl.style.opacity = '0';
            const rm = () => { cloneEl.remove(); if (activeClone === cloneEl) activeClone = null; };
            cloneEl.addEventListener('transitionend', rm, { once: true });
            setTimeout(rm, FADE_OUT_MS + 50);
          }
          if (prev !== null) {
            const sc = seatCanvas(prev);
            if (sc) { sc.style.transition = `filter ${UNDIM_MS}ms ease`; sc.style.filter = ''; }
          }
          if (next !== null) {
            const sc = seatCanvas(next);
            if (sc) { sc.style.transition = `filter ${DIM_MS}ms ease`; sc.style.filter = 'brightness(0)'; }
            const cc = clusterCanvas();
            if (cc) { cc.style.transition = `opacity ${FADE_IN_MS}ms ease`; cc.style.opacity = '1'; }
          }

          playedPreviewClones.forEach(({ el, delay }) => {
            setTimeout(() => {
              requestAnimationFrame(() => {
                el.style.transition = `filter ${PREVIEW_DARK_MS}ms ease, opacity ${PREVIEW_DARK_MS}ms ease`;
                el.style.filter = 'brightness(0)';
                el.style.opacity = '0';
                const rm = () => { el.remove(); activeDarkClones = activeDarkClones.filter(c => c !== el); };
                el.addEventListener('transitionend', rm, { once: true });
                setTimeout(rm, PREVIEW_DARK_MS + 50);
              });
            }, delay);
          });
        });
      }

      return { capturePreRender, animatePostRender, getPreRenderClusterRect };
    })();

    const cardAnimator = (() => {
      const OPPONENT_STAGGER_MS = 40;
      const snapshots = new Map();
      const activeClones = new Map();

      function getContainerType(el) {
        if (el.closest('.handScroll')) return 'hand';
        if (el.closest('.tableViewCards')) return 'table';
        if (el.closest('.claimHandBar')) return 'claim';
        if (el.closest('.tableDeckPlaceholder')) return 'deck';
        return 'other';
      }
      function capturePreRender() {
        snapshots.clear();
        document.querySelectorAll('[data-card-id]').forEach(el => {
          const id = el.dataset.cardId;
          const img = el.querySelector('img.cardArt') || el.querySelector('img');
          if (!img) return;
          snapshots.set(id, {
            rect: img.getBoundingClientRect(),
            src: img.src,
            containerType: getContainerType(el),
          });
        });
      }
      function animatePostRender() {
        if (state.cinematicMode) {
          snapshots.clear();
          return;
        }

        const animCfg = SCRATCHBONES_GAME.layout.animation;
        const base = animCfg.baseDurationMs;
        const FLY_MS = base;
        const FADE_MS = Math.round(base / animCfg.fadeInSpeed);

        // Determine if an opponent just played (for avatar-origin card flights)
        const latestPlay = state.betting?.play || state.challengeWindow?.lastPlay || state.pile.at(-1) || null;
        const actorIsOpponent = !!(latestPlay && latestPlay.playerIndex !== 0);
        const actorRect = actorIsOpponent ? seatAvatarAnim.getPreRenderClusterRect() : null;
        const deckRect = document.querySelector('.tableDeckPlaceholder')?.getBoundingClientRect() || null;

        const newCards = [];
        document.querySelectorAll('[data-card-id]').forEach(el => {
          const id = el.dataset.cardId;
          const img = el.querySelector('img.cardArt') || el.querySelector('img');
          if (img) newCards.push({ id, img, containerType: getContainerType(el) });
        });

        requestAnimationFrame(() => requestAnimationFrame(() => {
          let opponentCardIdx = 0;
          const lerpCompleteScheduledIds = new Set();
          const scheduleLerpComplete = (cardId, opts) => {
            if (lerpCompleteScheduledIds.has(cardId)) return;
            lerpCompleteScheduledIds.add(cardId);
            SCRATCHBONES_AUDIO.playLerpComplete(opts);
          };

          newCards.forEach(({ id, img, containerType }) => {
            const snapshot = snapshots.get(id);
            const newRect = img.getBoundingClientRect();

            if (!snapshot) {
              const isClaimOrTable = containerType === 'claim' || containerType === 'table';
              if (deckRect && containerType === 'hand') {
                SCRATCHBONES_AUDIO.playMovement('handToTable');
                const existing = activeClones.get(id);
                if (existing) existing.remove();
                const deckCx = deckRect.left + deckRect.width / 2;
                const deckCy = deckRect.top + deckRect.height / 2;
                const cardCx = newRect.left + newRect.width / 2;
                const cardCy = newRect.top + newRect.height / 2;
                const dx = deckCx - cardCx;
                const dy = deckCy - cardCy;
                const clone = document.createElement('img');
                clone.src = img.src;
                clone.dataset.candleLerpClone = '1';
                clone.style.cssText = [
                  'position:fixed',
                  `left:${newRect.left}px`, `top:${newRect.top}px`,
                  `width:${newRect.width}px`, `height:${newRect.height}px`,
                  'object-fit:contain', 'pointer-events:none', 'z-index:9999',
                  'transform-origin:center center',
                  `transform:translate(${dx}px,${dy}px) scale(0.14)`,
                  'transition:none',
                ].join(';');
                document.body.appendChild(clone);
                activeClones.set(id, clone);
                img.style.opacity = '0';
                requestAnimationFrame(() => {
                  clone.style.transition = `transform ${FLY_MS}ms cubic-bezier(0.4,0,0.2,1)`;
                  clone.style.transform = 'none';
                  const done = () => {
                    clone.remove();
                    if (activeClones.get(id) === clone) activeClones.delete(id);
                    img.style.opacity = '';
                  };
                  clone.addEventListener('transitionend', done, { once: true });
                  setTimeout(done, FLY_MS + 100);
                });
              } else if (actorRect && isClaimOrTable) {
                // Opponent card: fly from cluster avatar center, start tiny
                SCRATCHBONES_AUDIO.playMovement('opponentToTable');
                const staggerDelay = opponentCardIdx * OPPONENT_STAGGER_MS;
                scheduleLerpComplete(id, {
                  durationMs: FLY_MS,
                  cardIndex: opponentCardIdx,
                  staggerMs: OPPONENT_STAGGER_MS,
                });
                opponentCardIdx++;
                const existing = activeClones.get(id);
                if (existing) existing.remove();
                const avatarCx = actorRect.left + actorRect.width / 2;
                const avatarCy = actorRect.top + actorRect.height / 2;
                const cardCx = newRect.left + newRect.width / 2;
                const cardCy = newRect.top + newRect.height / 2;
                const dx = avatarCx - cardCx;
                const dy = avatarCy - cardCy;
                const clone = document.createElement('img');
                clone.src = img.src;
                clone.dataset.candleLerpClone = '1';
                clone.style.cssText = [
                  'position:fixed',
                  `left:${newRect.left}px`, `top:${newRect.top}px`,
                  `width:${newRect.width}px`, `height:${newRect.height}px`,
                  'object-fit:contain', 'pointer-events:none', 'z-index:9999',
                  'transform-origin:center center',
                  `transform:translate(${dx}px,${dy}px) scale(0.08)`,
                  'transition:none',
                ].join(';');
                document.body.appendChild(clone);
                activeClones.set(id, clone);
                img.style.opacity = '0';
                setTimeout(() => {
                  requestAnimationFrame(() => {
                    clone.style.transition = `transform ${FLY_MS}ms cubic-bezier(0.4,0,0.2,1)`;
                    clone.style.transform = 'none';
                    const done = () => {
                      clone.remove();
                      if (activeClones.get(id) === clone) activeClones.delete(id);
                      img.style.opacity = '';
                    };
                    clone.addEventListener('transitionend', done, { once: true });
                    setTimeout(done, FLY_MS + 100);
                  });
                }, staggerDelay);
              } else {
                // Normal fade-in for new cards with no prior position
                SCRATCHBONES_AUDIO.playMovement('fadeIn');
                img.style.opacity = '0';
                requestAnimationFrame(() => {
                  img.style.transition = `opacity ${FADE_MS}ms ease`;
                  img.style.opacity = '';
                  img.addEventListener('transitionend', () => { img.style.transition = ''; }, { once: true });
                });
              }
              return;
            }

            if (snapshot.containerType === containerType) return;
            const movementType =
              snapshot.containerType === 'hand' && (containerType === 'table' || containerType === 'claim')
                ? 'handToTable'
                : (snapshot.containerType === 'table' && containerType === 'claim')
                  ? 'tableToClaim'
                  : ((snapshot.containerType === 'claim' || snapshot.containerType === 'table') && containerType === 'hand')
                    ? 'claimToHand'
                    : 'fadeIn';
            SCRATCHBONES_AUDIO.playMovement(movementType);
            scheduleLerpComplete(id, { durationMs: FLY_MS });
            const existing = activeClones.get(id);
            if (existing) existing.remove();
            const dx = snapshot.rect.left - newRect.left;
            const dy = snapshot.rect.top - newRect.top;
            const scaleX = snapshot.rect.width / (newRect.width || 1);
            const scaleY = snapshot.rect.height / (newRect.height || 1);
            if (Math.abs(dx) < 2 && Math.abs(dy) < 2 && Math.abs(scaleX - 1) < 0.05) return;
            const clone = document.createElement('img');
            clone.src = snapshot.src;
            clone.dataset.candleLerpClone = '1';
            clone.style.cssText = [
              'position:fixed',
              `left:${newRect.left}px`, `top:${newRect.top}px`,
              `width:${newRect.width}px`, `height:${newRect.height}px`,
              'object-fit:contain', 'pointer-events:none', 'z-index:9999',
              'transform-origin:top left',
              `transform:translate(${dx}px,${dy}px) scale(${scaleX},${scaleY})`,
              'transition:none',
            ].join(';');
            document.body.appendChild(clone);
            activeClones.set(id, clone);
            img.style.opacity = '0';
            requestAnimationFrame(() => {
              clone.style.transition = `transform ${FLY_MS}ms cubic-bezier(0.4,0,0.2,1)`;
              clone.style.transform = 'none';
              const done = () => {
                clone.remove();
                if (activeClones.get(id) === clone) activeClones.delete(id);
                img.style.opacity = '';
              };
              clone.addEventListener('transitionend', done, { once: true });
              setTimeout(done, FLY_MS + 100);
            });
          });
          snapshots.clear();
        }));
      }
      return { capturePreRender, animatePostRender };
    })();

    function syncClaimClusterCardSizeFromHand(app) {
      if (!app) return;
      const cssTargets = [document.documentElement, app];
      const handCardArt = app.querySelector('.handScroll .card .cardArt');
      if (!handCardArt) {
        for (const target of cssTargets) {
          target.style.removeProperty('--layout-claim-card-width');
          target.style.removeProperty('--layout-claim-card-height');
        }
        return;
      }
      const rect = handCardArt.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const claimCardWidth = `${rect.width.toFixed(2)}px`;
      const claimCardHeight = `${rect.height.toFixed(2)}px`;
      for (const target of cssTargets) {
        target.style.setProperty('--layout-claim-card-width', claimCardWidth);
        target.style.setProperty('--layout-claim-card-height', claimCardHeight);
      }
    }

    function render() {
      SCRATCHBONES_LAYER_MANAGER.clear();
      seatAvatarAnim.capturePreRender();
      cardAnimator.capturePreRender();
      const app = document.getElementById('app');
      const layoutPolicy = applyLayoutContract(app);
      const player = state.players[0] || { hand: [], chips: 0, clears: 0 };
      const selected = selectedCards();
      const canHumanAct = !state.gameOver && state.currentTurn === 0 && !state.challengeWindow && !state.betting && !hasConcededThisRound(0);
      const declareOptions = Array.from({ length: RANK_COUNT }, (_, i) => i + 1)
        .map(rank => `<option value="${rank}" ${state.declaredRank === rank ? 'selected' : ''}>${rank}</option>`)
        .join('');
      const bettingActorHuman = !!state.betting && state.betting.currentActorId === 0;
      const humanCallAmount = state.betting ? amountToCall(0) : 0;
      const humanLegalActions = state.betting && bettingActorHuman ? legalBettingActionsFor(0) : [];
      const humanRaiseTierIds = state.betting && bettingActorHuman ? legalStakeTierIdsForPlayer(0) : [];
      const humanCanRaise = humanLegalActions.includes('raise-tier') && humanRaiseTierIds.length > 0;
      if (state.betting) {
        const bettingUiDebug = {
          phase: state.betting.phase,
          actorId: state.betting.currentActorId,
          actorName: seatLabel(state.betting.currentActorId),
          bettingActorHuman,
          currentTierId: state.betting.currentTierId,
          currentTierValue: state.betting.currentTierValue,
          legalActions: legalBettingActionsFor(state.betting.currentActorId),
          legalRaiseTierIds: legalStakeTierIdsForPlayer(state.betting.currentActorId),
          contributions: { ...state.betting.contributions },
          challengerHasRaised: !!state.betting.challengerHasRaised,
          challengedHasRaised: !!state.betting.challengedHasRaised,
        };
        const bettingUiDebugKey = JSON.stringify(bettingUiDebug);
        if (uiDebugState.bettingUiDebugKey !== bettingUiDebugKey) {
          uiDebugState.bettingUiDebugKey = bettingUiDebugKey;
          console.debug('[betting-ui-state]', bettingUiDebug);
        }
      } else {
        uiDebugState.bettingUiDebugKey = null;
      }
      const challengeWindow = state.challengeWindow;
      const humanCanDecideChallenge = !!(challengeWindow && !state.betting && !state.gameOver && challengeWindow.lastPlay.playerIndex !== 0);
      const challengePromptText = humanCanDecideChallenge ? formatChallengePrompt(challengeWindow.lastPlay) : '';
      const latestPilePlay = state.pile.at(-1) || null;
      const latestPlay = state.betting?.play || state.challengeWindow?.lastPlay || (state.challengeIntro ? latestPilePlay : null);
      const tableViewPolicy = layoutPolicy?.tableView || {};
      const regionsPolicy = layoutPolicy?.regions || getLayoutRegionsConfig();
      const claimClusterPolicy = layoutPolicy?.claimCluster || getClaimClusterConfig();
      const claimClusterEnabled = claimClusterPolicy.enabled;
      const contextBoxEnabled = regionsPolicy.contextBox?.enabled;
      const sharedContextBox = regionsPolicy.contextBox?.sharedDeclareAndChallengeSlot;
      const eventLogEnabled = regionsPolicy.log?.enabled === true;
      const legacyCinematicCompatEnabled = SCRATCHBONES_GAME.layout?.cinematic?.enableLegacyBoxedBranch === true;
      const showLegacyActionFocus = legacyCinematicCompatEnabled && !claimClusterEnabled && !regionsPolicy.actionFocus?.replaceWithFloatingClaimCluster && regionsPolicy.actionFocus?.enabled;
      const tableCardVisualMode = tableViewPolicy.cardVisualMode || 'facedown';
      const tableCardFaceDown = tableCardVisualMode !== 'faceup';
      ensureChallengeCinematic();
      const cinematicMode = isTableCinematicEnabled() ? state.cinematicMode : null;
      const cinematicPhase = cinematicMode?.mode || null;
      const cinematicFocusActorId = Number.isInteger(cinematicMode?.actorId) ? cinematicMode.actorId : null;
      const cinematicFocusReactorId = Number.isInteger(cinematicMode?.reactorId) ? cinematicMode.reactorId : null;
      const cinematicRevealPlay = cinematicMode?.play || null;
      const cinematicRevealActive = cinematicPhase === 'reveal' && !!cinematicRevealPlay;
      const challengeIntro = state.challengeIntro;
      const claimFocus = (() => {
        if (!latestPlay) {
          return {
            actorId: state.currentTurn,
            reactorId: null,
            declaredRank: state.declaredRank,
            cardCount: 0,
            cards: [],
            subtext: 'Select cards and declare a number to begin the next claim.'
          };
        }
        let actorId = (state.betting || state.challengeWindow || challengeIntro) ? latestPlay.playerIndex : state.currentTurn;
        let reactorId = null;
        if (state.betting) reactorId = latestPlay.playerIndex === state.betting.challengerId ? state.betting.challengedId : state.betting.challengerId;
        else if (challengeIntro) reactorId = challengeIntro.challengerId;
        const declaredRank = latestPlay.declaredRank ?? state.declaredRank;
        const cardCount = latestPlay.cards?.length || 0;
        const cards = latestPlay.cards || [];
        if (cinematicFocusActorId !== null) actorId = cinematicFocusActorId;
        if (cinematicFocusReactorId !== null) reactorId = cinematicFocusReactorId;
        return { actorId, reactorId, declaredRank, cardCount, cards };
      })();
      const focusActor = state.players[claimFocus.actorId];
      const focusReactor = claimFocus.reactorId !== null ? state.players[claimFocus.reactorId] : null;
      const claimRankText = claimFocus.declaredRank === null || claimFocus.declaredRank === undefined ? '—' : String(claimFocus.declaredRank);
      const claimCount = claimFocus.cards?.length || 0;
      const claimRankNumeric = Number(claimFocus.declaredRank);
      const claimRankGlyphSrc = Number.isFinite(claimRankNumeric)
        ? String(CONFIG.assets.claimRankGlyphTemplateSrc || '')
          .replace('{rank}', String(Math.min(Math.max(claimRankNumeric, 1), 10)))
        : '';
      const claimRankGlyphHtml = claimRankGlyphSrc
        ? `<img class="claimRankGlyph" src="${claimRankGlyphSrc}" alt="Declared rank ${claimRankNumeric}" loading="lazy">`
        : claimRankText;
      const claimClusterFontFamily = String(CONFIG.assets.claimClusterFontFamily || '"KhymeryyanRomanLetters+Numbers", serif').trim();
      const claimClusterFontSrc = String(CONFIG.assets.claimClusterFontSrc || '').trim();
      ensureClaimClusterFontFace({ family: claimClusterFontFamily, src: claimClusterFontSrc });
      const claimMultiplyGlyphSrc = String(CONFIG.assets.claimMultiplyGlyphSrc || '').trim();
      const claimMultiplyGlyphScaleRaw = Number(CONFIG.assets.claimMultiplyGlyphScale);
      const claimMultiplyGlyphScale = Number.isFinite(claimMultiplyGlyphScaleRaw) && claimMultiplyGlyphScaleRaw > 0 ? claimMultiplyGlyphScaleRaw : 0.5;
      const claimMultiplyGlyphInvert = CONFIG.assets.claimMultiplyGlyphInvert !== false;
      const claimMultiplyGlyphStyle = `width:${(claimMultiplyGlyphScale * 100).toFixed(1)}%;height:${(claimMultiplyGlyphScale * 100).toFixed(1)}%;object-fit:contain;${claimMultiplyGlyphInvert ? 'filter:invert(1);' : ''}`;
      const claimMultiplyGlyphHtml = claimMultiplyGlyphSrc
        ? `<img class="claimMultiplyGlyph" src="${claimMultiplyGlyphSrc}" alt="Multiply" loading="lazy" style="${claimMultiplyGlyphStyle}">`
        : '×';
      const claimHandCardsSource = cinematicRevealActive ? cinematicRevealPlay.cards : claimFocus.cards;
      const claimHandCardsHtml = (claimHandCardsSource?.length
        ? claimHandCardsSource.map((card) => {
            const revealCard = cinematicRevealActive;
            const art = resolveScratchbone2DAsset(card, { flipped: !revealCard });
            const cardAlt = revealCard
              ? (card.wild ? 'Revealed wild scratchbone card' : `Revealed scratchbone ${card.rank} card`)
              : 'Face-down scratchbone card';
            return `<div class="tableViewCard" style="--fd:0s;" data-card-id="${card.id}"><img src="${art.src}" data-fallback-src="${art.fallbackSrc}" alt="${cardAlt}"></div>`;
          }).join('')
        : '<div class="tiny">No claim yet.</div>');
      const claimClusterShellClass = claimClusterPolicy.transparentShells ? 'floatingTransparentShell' : '';
      const claimHandBarLayout = claimClusterPolicy.elements.claimHandBar || { xPct: 0.50, yPct: 0.52, wPct: 0.42, hPct: 0.30 };
      const tablePoolAnchorXPct = clampNumber(claimClusterPolicy.geometry.centerXPct, 0, 1);
      const tablePoolAnchorYPct = clampNumber((claimClusterPolicy.geometry.centerYPct - (claimClusterPolicy.geometry.heightPctOfTableView / 2)) + ((claimHandBarLayout.yPct + (claimHandBarLayout.hPct / 2)) * claimClusterPolicy.geometry.heightPctOfTableView), 0, 1);
      const tableCardsHtml = latestPlay?.cards?.length
        ? (claimClusterEnabled
          ? `<div class="tiny">Claim cluster visualization active.</div>`
          : latestPlay.cards.map(card => {
              const art = resolveScratchbone2DAsset(card, { flipped: tableCardFaceDown });
              return `<div class="tableViewCard" data-card-id="${card.id}"><img src="${art.src}" data-fallback-src="${art.fallbackSrc}" alt="${tableCardFaceDown ? 'Face-down scratchbone card' : (card.wild ? 'Wild scratchbone card' : `Scratchbone ${card.rank} card`)}"></div>`;
            }).join(''))
        : '<div class="tiny">No cards on the table yet.</div>';
      const recentLogs = eventLogEnabled ? state.logs.slice(0, 4) : [];
      const turnPlayer = state.players[state.currentTurn];
      const renderDeclareControls = () => `
        <div class="controls fit-target fit-0" data-proj-id="challenge-prompt" style="max-height:none;">
          <div class="controlsRow">
            <label>
              Declare number
              <select id="declareRank" ${!canHumanAct ? 'disabled' : ''}>
                ${declareOptions}
              </select>
            </label>
          </div>
          <div class="bottomActions">
            <button id="playBtn" ${!canHumanAct ? 'disabled' : ''}>Play Selected</button>
            <button class="secondary" id="concedeBtn" ${!canHumanAct || state.declaredRank === null ? 'disabled' : ''}>Concede Round</button>
          </div>
        </div>
      `;
      const renderChallengePrompt = () => `
        <div class="challengePromptPane fit-target fit-0" id="challengePromptPane" data-proj-id="challenge-prompt" style="padding:var(--layout-challenge-pane-padding-y,8px) var(--layout-challenge-pane-padding-x,10px);">
          <div class="challengeBoxHeader">
            <div class="sectionTitle" style="color:var(--danger);">Challenge window</div>
          </div>
          <div id="challengeBoxInfo" class="tiny challengePromptInfo">${challengePromptText}</div>
          <div class="challengePromptBtns">
            <button class="danger" id="challengeBtnFixed">⚔ Challenge</button>
            <button class="secondary" id="letPassBtnFixed">${escapeHtml(SCRATCHBONES_GAME.uiText.letStandButton)}</button>
          </div>
        </div>
      `;
      const renderTrickActionPrompt = () => {
        if (state.smuggleSelection) return `
          <div class="challengePromptPane fit-target fit-0" id="challengePromptPane" data-proj-id="challenge-prompt" style="padding:var(--layout-challenge-pane-padding-y,8px) var(--layout-challenge-pane-padding-x,10px);">
            <div class="sectionTitle" style="color:var(--warning);">Smuggle Bone</div>
            <div class="tiny challengePromptInfo">Choose an AI seat (highlighted white; selected yellow), then confirm.</div>
            <div class="challengePromptBtns"><button id="smuggleOffloadBtn">Offload Bones</button></div>
          </div>`;
        if (state.trapSelection) return `
          <div class="challengePromptPane fit-target fit-0" id="challengePromptPane" data-proj-id="challenge-prompt" style="padding:var(--layout-challenge-pane-padding-y,8px) var(--layout-challenge-pane-padding-x,10px);">
            <div class="sectionTitle" style="color:var(--danger);">Trap Bone</div>
            <div class="tiny challengePromptInfo">Select ${state.trapSelection.maxCount} card(s) from your hand, then confirm offload.</div>
            <div class="challengePromptBtns"><button id="trapOffloadBtn">Offload Bones</button></div>
          </div>`;
        return '';
      };
      const renderStakeTierButtons = (mode) => {
        const allowedTierIds = mode === 'open' ? legalStakeTierIdsForPlayer(0) : humanRaiseTierIds;
        const locked = !!state.betting?.actionInFlight;
        return `<div class="stakeTierBtnRow" data-proj-id="betting-tier-buttons">${STAKE_TIERS.map((tier) => {
          const enabled = allowedTierIds.includes(tier.id) && !locked;
          return `<button class="stakeTierBtn" data-stake-tier-btn="${tier.id}" data-stake-tier-action="${mode}" data-stake-tier-id="${tier.id}" ${!enabled ? 'disabled' : ''}><img src="${escapeHtml(stakeCoinSrcForTier(tier.id))}" data-fallback-src="${escapeHtml(stakeCoinSrcForTier(STAKE_COIN_FALLBACK_TIER_ID))}" alt="${escapeHtml(tier.id)} coin"><span>${escapeHtml(tier.id)} · ${tier.value}</span></button>`;
        }).join('')}</div>`;
      };
      const renderPunishToggleButton = (locked) => {
        if (!state.betting?.punishAvailable) return '';
        const punishArt = resolveScratchbone2DAsset({ trickType: 'punish', rank: null, wild: false }, { flipped: false });
        return `<button class="secondary" id="betPunishToggleBtn" ${locked ? 'disabled' : ''} style="display:inline-flex;align-items:center;gap:8px;border-color:${state.betting.punishArmed ? 'var(--warning)' : 'var(--line)'};background:${state.betting.punishArmed ? 'var(--warning)' : 'var(--bg-2)'};color:${state.betting.punishArmed ? 'var(--bg)' : 'var(--text)'};"><img src="${escapeHtml(punishArt.src)}" data-fallback-src="${escapeHtml(punishArt.fallbackSrc)}" alt="Punish Bone card" style="width:34px;height:48px;object-fit:contain;border-radius:4px;">${state.betting.punishArmed ? 'Punish Armed' : 'Arm Punish'}</button>`;
      };
      const renderStakeVisual = () => `
        <div class="stakeVisualPanel">
          <div class="stakeVisualHeader tiny">Current stake</div>
          <div class="stakeVisualRow">
            <div class="stakeContribCol">
              <div class="tiny">${seatLabel(state.betting.challengerId)} contribution</div>
              <div class="stakeAnchor" data-stake-contrib-anchor="${state.betting.challengerId}">${state.betting.currentTierId ? `<img src="${escapeHtml(stakeCoinSrcForTier(state.betting.currentTierId))}" data-fallback-src="${escapeHtml(stakeCoinSrcForTier(STAKE_COIN_FALLBACK_TIER_ID))}" alt="challenger coin">` : ''}</div>
              <div class="tiny">${getContribution(state.betting.challengerId)}</div>
            </div>
            <div class="stakeCenterCol">
              <div class="stakeAnchor stakeCurrent" data-stake-current-anchor>${state.betting.displayedTierId ? `<img data-stake-current-coin src="${escapeHtml(stakeCoinSrcForTier(state.betting.displayedTierId))}" data-fallback-src="${escapeHtml(stakeCoinSrcForTier(STAKE_COIN_FALLBACK_TIER_ID))}" alt="current stake coin">` : ''}</div>
              <div class="tiny">Stake: ${state.betting.currentTierId || '—'} (${state.betting.currentTierValue || 0})</div>
            </div>
            <div class="stakeContribCol">
              <div class="tiny">${seatLabel(state.betting.challengedId)} contribution</div>
              <div class="stakeAnchor" data-stake-contrib-anchor="${state.betting.challengedId}">${getContribution(state.betting.challengedId) > 0 && state.betting.currentTierId ? `<img src="${escapeHtml(stakeCoinSrcForTier(state.betting.currentTierId))}" data-fallback-src="${escapeHtml(stakeCoinSrcForTier(STAKE_COIN_FALLBACK_TIER_ID))}" alt="challenged coin">` : ''}</div>
              <div class="tiny">${getContribution(state.betting.challengedId)}</div>
            </div>
          </div>
        </div>
      `;
      const renderBettingControls = () => `
        <div class="controls fit-target fit-0" data-proj-id="controls">
          ${renderStakeVisual()}
          <div class="challengeBar">
            ${bettingActorHuman ? `
              ${state.betting.phase === 'opening'
                ? `${renderStakeTierButtons('open')}${renderPunishToggleButton(state.betting.actionInFlight)}`
                : `<button class="secondary" id="betCallBtn" ${state.betting.actionInFlight ? 'disabled' : ''}>Call ${humanCallAmount}</button>
                   ${humanCanRaise ? renderStakeTierButtons('raise') : ''}
                   ${renderPunishToggleButton(state.betting.actionInFlight)}
                   <button class="danger" id="betFoldBtn" ${state.betting.actionInFlight ? 'disabled' : ''}>Fold</button>`}
              ${state.betting.punishAvailable ? `<button class="secondary" id="betPunishToggleBtn" ${state.betting.actionInFlight ? 'disabled' : ''} style="border-color:${state.betting.punishArmed ? 'var(--warning)' : 'var(--line)'};background:${state.betting.punishArmed ? 'var(--warning)' : 'var(--bg-2)'};color:${state.betting.punishArmed ? 'var(--bg)' : 'var(--text)'};">Punish Bone ${state.betting.punishArmed ? 'Armed' : 'Off'}</button>` : ''}
            ` : `<div class="tiny">${seatLabel(state.betting.currentActorId)} is deciding the next betting action.</div>`}
            ${bettingActorHuman && state.betting.phase === 'opening' ? `<button class="danger" id="betFoldBtn" ${state.betting.actionInFlight ? 'disabled' : ''}>Fold</button>` : ''}
          </div>
        </div>
      `;
      const renderLegacyBoxedCinematic = (phase) => {
        console.debug('[cinematic-cluster-stage] legacy boxed cinematic branch enabled', { phase });
        return '';
      };
      const clusterCinematicActive = claimClusterEnabled && !!cinematicMode;
      const renderSmuggleTableOverlay = () => {
        if (!state.smuggleSelection) return '';
        const centerXPct = clampNumber(claimClusterPolicy.geometry.centerXPct, 0, 1) * 100;
        const clusterTopPct = (clampNumber(claimClusterPolicy.geometry.centerYPct, 0, 1) - (clampNumber(claimClusterPolicy.geometry.heightPctOfTableView, 0.05, 1) / 2)) * 100;
        const centerYPct = clusterTopPct - 2;
        return `<div class="fit-target fit-0" data-proj-id="table-view" style="z-index:72;pointer-events:none;"><div style="position:absolute;left:${centerXPct.toFixed(2)}%;top:${centerYPct.toFixed(2)}%;transform:translate(-50%,-100%);text-align:center;pointer-events:none;"><div class="fx-burst-shell"><div class="cin-action-burst burst-liar">SMUGGLE TARGET</div></div></div></div>`;
      };
      const renderCinematicPunishCenterButton = () => {
        if (!clusterCinematicActive || cinematicPhase !== 'betting' || !bettingActorHuman || !state.betting?.punishAvailable) return '';
        const punishArt = resolveScratchbone2DAsset({ trickType: 'punish', rank: null, wild: false }, { flipped: false });
        return `<div class="fit-target fit-0" data-proj-id="challenge-prompt" style="z-index:78;display:flex;align-items:center;justify-content:center;pointer-events:none;"><button class="secondary" id="betPunishToggleBtn" ${state.betting.actionInFlight ? 'disabled' : ''} style="pointer-events:auto;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;min-width:190px;min-height:210px;border-width:3px;border-color:${state.betting.punishArmed ? 'var(--warning)' : 'var(--line)'};background:${state.betting.punishArmed ? 'var(--warning)' : 'var(--bg-2)'};color:${state.betting.punishArmed ? 'var(--bg)' : 'var(--text)'};"><img src="${escapeHtml(punishArt.src)}" data-fallback-src="${escapeHtml(punishArt.fallbackSrc)}" alt="Punish Bone card" style="width:96px;height:136px;object-fit:contain;border-radius:6px;"><span style="font-weight:700;">${state.betting.punishArmed ? 'Punish Armed' : 'Arm Punish Bone'}</span></button></div>`;
      };
      app.innerHTML = `
        <div class="topbar" data-proj-id="topbar">
          <div class="titleRow">
            <h1>Madiao Mobile Challenge</h1>
            <button class="ghost" id="restartBtn">New Match</button>
          </div>
          <div class="chipRow">
            <div class="chip">Round ${state.round}</div>
            <div class="chip">Lead: ${state.players[state.leaderIndex]?.name || '-'}</div>
            <div class="chip">Turn: ${state.players[state.currentTurn]?.name || '-'}</div>
            <div class="chip">Pile Plays: ${state.pile.length}</div>
          </div>
        </div>
        <div id="aiSidebar" class="fit-target fit-0" data-proj-id="sidebar">
          <div class="sectionTitle" style="padding:6px 10px 2px;color:var(--accent-2);">Table</div>
          ${state.players.slice(1).map(p => `
            <div class="aiSeat ${p.eliminated ? 'eliminated' : ''}" data-proj-id="seat-${p.id}" data-ai-seat-id="${p.id}" style="${state.smuggleSelection ? `outline:2px solid ${state.smuggleSelection.selectedTargetId === p.id ? 'var(--warning)' : 'var(--text)'};cursor:pointer;` : (state.trapSelection && state.trapSelection.challengerId === p.id ? 'outline:2px solid var(--danger);' : '')}">
              <div class="seatInfo" data-proj-id="info-${p.id}" style="padding:var(--layout-seat-info-padding-y,8px) var(--layout-seat-info-padding-x,10px);">
                <div class="seatName">${seatLabel(p)}</div>
                <div class="seatMeta">Cards ${p.hand.length} · Chips ${p.chips} · Clears ${p.clears}</div>
                ${renderSeatCoinRow(p)}
                ${p.seed ? `<div class="seatSeed">${p.seed}</div>` : ''}
                ${p.personality ? `<div class="seatTags">${personalityTags(p.personality)}</div>` : ''}
                <div class="seatStatus">${p.lastAction}</div>
                ${!p.eliminated && p.hand.length > 0 ? `<div class="seatHandPreview" data-seat-id="${p.id}">${p.hand.map((card, i) => { const art = resolveScratchbone2DAsset(card, { flipped: true }); return `<div class="seatHandCard" data-seat-hand-id="${p.id}-${i}"><img src="${art.src}" data-fallback-src="${art.fallbackSrc}" alt="Hidden card"></div>`; }).join('')}</div>` : ''}
              </div>
              <div class="seatAvatarBox" data-proj-id="avatar-${p.id}">
                <canvas class="seatPortrait" data-seat-id="${p.id}" width="200" height="200"></canvas>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="humanSeatZone fit-target fit-0" data-proj-id="human-seat-zone">
          <div class="humanSeatCard ${player.eliminated ? 'eliminated' : ''}" data-proj-id="human-seat">
            <div class="seatInfo" data-proj-id="info-human" style="padding:var(--layout-seat-info-padding-y,8px) var(--layout-seat-info-padding-x,10px);">
              <div class="seatName">${seatLabel(player)}</div>
              <div class="seatMeta">Cards ${player.hand.length} · Chips ${player.chips} · Clears ${player.clears}</div>
              ${renderSeatCoinRow(player)}
              <div class="seatStatus">${player.lastAction}</div>
            </div>
            <div class="seatAvatarBox" data-proj-id="avatar-human">
              <canvas class="seatPortrait" data-seat-id="0" width="220" height="220"></canvas>
            </div>
          </div>
        </div>
        <div class="tableDeckPlaceholder fit-target fit-0" data-proj-id="turn-spotlight" data-deck-anchor="1" style="display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;pointer-events:none;z-index:3;">
          <div style="position:relative;width:68px;height:96px;">
            <img class="tableDeckCard" src="${escapeHtml(resolveScratchbone2DAsset({ wild: false, rank: null }, { flipped: true }).src)}" data-fallback-src="${escapeHtml(resolveScratchbone2DAsset({ wild: false, rank: null }, { flipped: true }).fallbackSrc)}" alt="Deck placeholder" style="position:absolute;left:10px;top:8px;width:58px;height:84px;opacity:.55;object-fit:contain;filter:brightness(.82);">
            <img class="tableDeckCard" src="${escapeHtml(resolveScratchbone2DAsset({ wild: false, rank: null }, { flipped: true }).src)}" data-fallback-src="${escapeHtml(resolveScratchbone2DAsset({ wild: false, rank: null }, { flipped: true }).fallbackSrc)}" alt="Deck placeholder" style="position:absolute;left:6px;top:4px;width:58px;height:84px;opacity:.75;object-fit:contain;filter:brightness(.9);">
            <img class="tableDeckCard" src="${escapeHtml(resolveScratchbone2DAsset({ wild: false, rank: null }, { flipped: true }).src)}" data-fallback-src="${escapeHtml(resolveScratchbone2DAsset({ wild: false, rank: null }, { flipped: true }).fallbackSrc)}" alt="Deck placeholder" style="position:absolute;left:2px;top:0;width:58px;height:84px;object-fit:contain;">
          </div>
          <div class="tiny" style="font-weight:700;letter-spacing:.08em;">DECK</div>
        </div>
        <div class="tableViewHeader">
          <div class="sectionTitle">Table View</div>
          <div class="tiny">${claimClusterEnabled ? 'Visual claim cluster active' : (latestPlay ? `Latest: ${seatLabel(latestPlay.playerIndex)} · ${latestPlay.cards?.length || 0} card(s)` : 'Waiting for opening play')}</div>
        </div>
        <div class="tableViewCards">${tableCardsHtml}</div>
        ${renderSmuggleTableOverlay()}
        ${claimClusterEnabled ? `
          <div class="claimCluster fit-target fit-0 ${claimClusterPolicy.mustStayVisible ? 'must-stay-visible' : ''}" data-proj-id="claim-cluster">
            <div class="claimRankAnchorTop" data-proj-id="claim-rank-anchor" style="${claimClusterElementStyle(claimClusterPolicy.elements.claimRankBox)}"></div>
            <div class="claimRankBox ${claimClusterShellClass}" data-proj-id="claim-rank-box" style="${claimClusterElementStyle(claimClusterPolicy.elements.claimRankBox)};font-family:${escapeHtml(claimClusterFontFamily)};">${claimRankGlyphHtml}</div>
            <div class="claimHandBar ${claimClusterShellClass}" data-proj-id="claim-hand-bar" style="${claimClusterElementStyle(claimClusterPolicy.elements.claimHandBar)}">${claimHandCardsHtml}</div>
            <div class="claimTimesBoxLeft ${claimClusterShellClass}" data-proj-id="claim-times-left" style="${claimClusterElementStyle(claimClusterPolicy.elements.claimTimesBoxLeft)};font-family:${escapeHtml(claimClusterFontFamily)};">${claimMultiplyGlyphHtml}</div>
            <div class="claimCountBoxLeft ${claimClusterShellClass}" data-proj-id="claim-count-left" style="${claimClusterElementStyle(claimClusterPolicy.elements.claimCountBoxLeft)};font-family:${escapeHtml(claimClusterFontFamily)};">${claimCount}</div>
            <div class="claimTimesBoxRight ${claimClusterShellClass}" data-proj-id="claim-times-right" style="${claimClusterElementStyle(claimClusterPolicy.elements.claimTimesBoxRight)};font-family:${escapeHtml(claimClusterFontFamily)};">${claimMultiplyGlyphHtml}</div>
            <div class="claimCountBoxRight ${claimClusterShellClass}" data-proj-id="claim-count-right" style="${claimClusterElementStyle(claimClusterPolicy.elements.claimCountBoxRight)};font-family:${escapeHtml(claimClusterFontFamily)};">${claimCount}</div>
            <div class="actorAvatarFloat ${claimClusterShellClass}" data-proj-id="claim-avatar-actor" style="${claimClusterElementStyle(claimClusterPolicy.elements.actorAvatarFloat)}" title="${seatLabel(focusActor || claimFocus.actorId)}">
              <div class="claimAvatarShell ${(challengeIntro && focusActor) ? 'alert-pulse' : ''}">
                <canvas class="seatPortrait" data-seat-id="${claimFocus.actorId}" width="220" height="220"></canvas>
              </div>
              ${focusActor ? `<div class="claimAvatarNameTag">${escapeHtml(seatFirstName(focusActor))}</div>` : ''}
              <div class="claimAvatarLocalOverlay" aria-hidden="true"></div>
            </div>
            <div class="reactorAvatarFloat ${claimClusterShellClass}" data-proj-id="claim-avatar-reactor" style="${claimClusterElementStyle(claimClusterPolicy.elements.reactorAvatarFloat)}" title="${focusReactor ? seatLabel(focusReactor) : 'No reactor'}">
              <div class="claimAvatarShell">
                ${focusReactor ? `<canvas class="seatPortrait" data-seat-id="${focusReactor.id}" width="220" height="220"></canvas>` : ''}
              </div>
              ${focusReactor ? `<div class="claimAvatarNameTag">${escapeHtml(seatFirstName(focusReactor))}</div>` : ''}
              ${(challengeIntro && focusReactor) ? `<div class="fx-burst-shell"><div class="cin-action-burst burst-liar">${escapeHtml(challengeIntro.burstText || 'LIAR!!!')}</div></div>` : ''}
              <div class="claimAvatarLocalOverlay" aria-hidden="true"></div>
            </div>
            <div class="claimClusterTextAnchor ${claimClusterShellClass}" data-proj-id="claim-cinematic-text" style="${claimClusterElementStyle(claimClusterPolicy.elements.cinematicPane)}"></div>
            <div class="claimClusterBettingLayer" data-proj-id="claim-cluster-betting-layer">
              <div class="bettingStatusAnchor" data-stake-betting-status-anchor data-proj-id="betting-status-anchor"></div>
              <div class="leftContributionAnchor" data-stake-left-contribution-anchor data-proj-id="betting-left-contribution-anchor"></div>
              <div class="rightContributionAnchor" data-stake-right-contribution-anchor data-proj-id="betting-right-contribution-anchor"></div>
              <div class="bettingChoiceAnchor" data-stake-betting-choice-anchor data-proj-id="betting-choice-anchor"></div>
            </div>
            </div>
        ` : ''}
        ${claimClusterEnabled ? renderTablePoolPile(state.tablePot, state.poolVisualSeed, tablePoolAnchorXPct, tablePoolAnchorYPct) : ''}
        ${renderCinematicPunishCenterButton()}
        ${showLegacyActionFocus ? `
          <div class="actionFocus fit-target fit-0">
            <div class="tiny">Legacy action focus mode enabled.</div>
          </div>
        ` : ''}
        <details class="debug">
          <summary>Debug tools</summary>
          <pre id="debugSnapshotData">${DEBUG_ENABLED ? escapeHtml(JSON.stringify(debugSnapshot(), null, 2)) : 'Debug disabled.'}</pre>
        </details>
        ${(clusterCinematicActive && (cinematicPhase === 'reveal' || cinematicPhase === 'fold'))
          ? (legacyCinematicCompatEnabled ? renderLegacyBoxedCinematic(cinematicPhase) : '')
          : ((clusterCinematicActive && cinematicPhase === 'betting')
            ? ''
            : (state.smuggleSelection || state.trapSelection)
            ? renderTrickActionPrompt()
            : state.betting
            ? renderBettingControls()
            : (sharedContextBox && humanCanDecideChallenge
              ? renderChallengePrompt()
              : renderDeclareControls()))}
        ${layoutPolicy?.handPanelVisible === false ? '' : `
        <div class="handWrap fit-target fit-0" data-proj-id="hand">
          <div class="handHeader">
            <div class="sectionTitle">Your hand</div>
            <div class="tiny">Selected: ${selected.length}</div>
          </div>
          <div class="handScroll">
              ${player.hand.map(card => {
                const art = resolveScratchbone2DAsset(card);
                const handCardLabel = card.wild ? 'Wild' : `Rank ${card.rank}`;
                const cardGlyph = card.wild ? 'W' : String(card.rank);
                return `
                <button class="card ${card.wild ? 'wild' : ''} ${state.selectedCardIds.has(card.id) ? 'selected' : ''}" data-card-id="${card.id}" title="${card.wild ? 'Wild card' : `Scratchbone ${card.rank}`}">
                  <img class="cardArt" src="${art.src}" data-fallback-src="${art.fallbackSrc}" alt="${card.wild ? 'Wild scratchbone card' : `Scratchbone ${card.rank} card`}">
                  <span class="cardLabel" aria-hidden="true"><span class="cardGlyph">${cardGlyph}</span><span class="cardText">${handCardLabel}</span></span>
                </button>
              `;
              }).join('')}
            </div>
          </div>
        </div>
        `}
        ${eventLogEnabled ? `
          <div class="eventLog fit-target fit-0" data-proj-id="log">
            <div class="sectionTitle">Recent events</div>
            ${recentLogs.map(item => `<div class="logItem">${escapeHtml(item.text)}</div>`).join('')}
          </div>
        ` : ''}
      `;
      if (state.declaredRank !== null) {
        const select = document.getElementById('declareRank');
        if (select) select.value = String(state.declaredRank);
      }
      document.getElementById('restartBtn')?.addEventListener('click', startGame);
      document.getElementById('playBtn')?.addEventListener('click', humanPlay);
      document.getElementById('concedeBtn')?.addEventListener('click', humanConcedeRound);
      document.getElementById('challengeBtnFixed')?.addEventListener('click', () => { clearChallengeTimer(); humanChallenge(); });
      document.getElementById('letPassBtnFixed')?.addEventListener('click', () => { clearChallengeTimer(); humanAcceptNoChallenge(); });
      app.querySelectorAll('.card[data-card-id]').forEach(el => {
        el.addEventListener('click', () => toggleSelect(Number(el.getAttribute('data-card-id'))));
      });
      wireScratchboneImageFallbacks(app);
      resolveChallengeLayoutPressure(app, layoutPolicy?.allowChallengeOverflow !== false);
      renderSeatPortraits();
      mountClaimClusterCinematicStage(app, { cinematicMode, cinematicPhase, cinematicRevealPlay, bettingActorHuman, humanCallAmount });
      document.getElementById('betCallBtn')?.addEventListener('click', () => humanBetAction('call'));
      document.getElementById('betFoldBtn')?.addEventListener('click', () => humanBetAction('fold'));
      document.getElementById('betPunishToggleBtn')?.addEventListener('click', () => {
        if (!state.betting || state.betting.currentActorId !== 0) return;
        state.betting.punishArmed = !state.betting.punishArmed;
        render();
      });
      app.querySelectorAll('[data-smuggle-seat]').forEach((button) => {
        button.addEventListener('click', () => {
          if (!state.smuggleSelection) return;
          state.smuggleSelection.selectedTargetId = Number(button.getAttribute('data-smuggle-seat'));
          render();
        });
      });
      document.getElementById('smuggleOffloadBtn')?.addEventListener('click', resolvePendingSmuggleSelection);
      app.querySelectorAll('[data-ai-seat-id]').forEach((seat) => {
        seat.addEventListener('click', () => {
          if (!state.smuggleSelection) return;
          const id = Number(seat.getAttribute('data-ai-seat-id'));
          if (!state.smuggleSelection.candidateIds.includes(id)) return;
          state.smuggleSelection.selectedTargetId = id;
          render();
        });
      });
      document.getElementById('trapOffloadBtn')?.addEventListener('click', resolvePendingTrapSelection);
      app.querySelectorAll('[data-stake-tier-action="open"]').forEach((btn) => {
        btn.addEventListener('click', () => humanOpenTierSelected(btn.getAttribute('data-stake-tier-id')));
      });
      app.querySelectorAll('[data-stake-tier-action="raise"]').forEach((btn) => {
        btn.addEventListener('click', () => humanRaiseTierSelected(btn.getAttribute('data-stake-tier-id')));
      });
      document.getElementById('cinContinueBtn')?.addEventListener('click', () => closeCinematic(true));
      const layoutMode = getScratchbonesLayoutMode();
      document.body.classList.toggle('layout-mode-authored', layoutMode === 'authored');
      if (layoutMode === 'authored') {
        applyAuthoredLayoutMode(app, getScratchbonesAuthoredConfig());
        resetLayoutDiagnosticsState(layoutDiagnostics);
      } else {
        app.style.width = '';
        app.style.height = '';
        app.style.transform = '';
        app.style.transformOrigin = '';
        applyResponsiveFit(app);
      }
      renderAuthoredOverlays();
      renderAuthoredInspector();
      updateTableCardAutoScale(app);
      syncClaimClusterCardSizeFromHand(app);
      enforceFitContainerBounds(app);
      if (state.pendingCinematicBetAction) {
        const actionFx = state.pendingCinematicBetAction;
        state.pendingCinematicBetAction = null;
        if (typeof window.requestAnimationFrame === 'function') {
          window.requestAnimationFrame(() => _announceCinematicBetAction(actionFx.playerId, actionFx.command));
        } else {
          setTimeout(() => _announceCinematicBetAction(actionFx.playerId, actionFx.command), 0);
        }
      }
      if (shouldRenderLayerManagedUi()) SCRATCHBONES_LAYER_MANAGER.sync(app);
      cardAnimator.animatePostRender();
      seatAvatarAnim.animatePostRender();
    }
    function debugSnapshot() {
      const regionsConfig = getLayoutRegionsConfig();
      const claimClusterConfig = getClaimClusterConfig();
      return {
        seed: state.seed,
        round: state.round,
        currentTurn: state.players[state.currentTurn]?.name,
        leader: state.players[state.leaderIndex]?.name,
        declaredRank: state.declaredRank,
        challengeOpen: !!state.challengeWindow,
        betting: state.betting ? {
          challenger: state.players[state.betting.challengerId]?.name,
          challenged: state.players[state.betting.challengedId]?.name,
          currentActor: state.players[state.betting.currentActorId]?.name,
          currentTier: state.betting.currentTierId,
          currentTierValue: state.betting.currentTierValue,
          legalActions: legalBettingActionsFor(state.betting.currentActorId),
          challengerHasRaised: !!state.betting.challengerHasRaised,
          challengedHasRaised: !!state.betting.challengedHasRaised,
          contributions: Object.fromEntries(Object.entries(state.betting.contributions).map(([id, value]) => [state.players[Number(id)]?.name || id, value])),
          playTruthful: state.betting.play.truthful,
        } : null,
        pile: state.pile.map(p => ({
          by: seatLabel(p.playerIndex),
          declaredRank: p.declaredRank,
          count: p.cards.length,
          truthful: p.truthful,
          actual: p.actualSummary,
        })),
        players: state.players.map(p => ({
          name: seatLabel(p),
          seed: p.seed || 'human',
          cards: p.hand.map((card) => (card.wild ? 'Wild' : String(card.rank))),
          chips: p.chips,
          clears: p.clears,
          eliminated: p.eliminated,
          concededThisRound: hasConcededThisRound(p.id),
          lastAction: p.lastAction,
          reads: Object.fromEntries(Object.entries(p.reads || {}).map(([id, read]) => [seatLabel(Number(id)), { truthfulCount: read.truthfulCount, bluffCount: read.bluffCount, repeatRankCount: read.repeatRankCount, quickJudgmentBias: Number(read.quickJudgmentBias.toFixed(2)), currentTruthStreak: read.currentTruthStreak, currentBluffStreak: read.currentBluffStreak, challengeWins: read.challengeWins, challengeLosses: read.challengeLosses }])),
        })),
        config: CONFIG,
        fitStages: layoutDiagnostics.fitStages,
        overlapDiagnostics: layoutDiagnostics.overlap,
        renderedScreenSpaceDelta: layoutDiagnostics.renderedScreenSpaceDelta,
        renderedScreenSpaceTopDrift: layoutDiagnostics.renderedScreenSpaceTopDrift,
        renderedScreenSpaceGroupDrift: layoutDiagnostics.renderedScreenSpaceGroupDrift,
        layoutNotes: {
          claimClusterEnabled: claimClusterConfig.enabled,
          turnSpotlightEnabled: regionsConfig.turnSpotlight.enabled,
          contextBoxMode: regionsConfig.contextBox.sharedDeclareAndChallengeSlot ? 'shared' : 'split',
        },
        stats: state.stats,
        uiDebug: {
          debugKeys: {
            bettingUiState: uiDebugState.bettingUiDebugKey,
          },
        },
      };
    }
    function escapeHtml(str) {
      return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
    }
    function ensureClaimClusterFontFace({ family, src }) {
      const trimmedFamily = String(family || '').trim().replace(/^['"]|['"]$/g, '');
      const trimmedSrc = String(src || '').trim();
      if (!trimmedFamily || !trimmedSrc) return;
      if (document.getElementById('scratchbones-claim-cluster-font-face')) return;
      const styleEl = document.createElement('style');
      styleEl.id = 'scratchbones-claim-cluster-font-face';
      styleEl.textContent = `@font-face{font-family:'${trimmedFamily.replaceAll("'", "\\'")}';src:url('${trimmedSrc.replaceAll("'", "\\'")}') format('truetype');font-display:swap;}`;
      document.head.appendChild(styleEl);
    }
    // ── Portrait generation ────────────────────────────────
    let _portraitCosmetics = null;
    if (window.setPortraitAssetBase && window.loadPortraitCosmetics) {
      const scratchbonesPortraitConfig = window.SCRATCHBONES_CONFIG?.game?.assets?.portrait || null;
      if (scratchbonesPortraitConfig && window.setPortraitConfig) {
        setPortraitConfig(scratchbonesPortraitConfig);
      }
      setPortraitAssetBase(scratchbonesPortraitConfig?.assetBase || './docs/assets/');
      loadPortraitCosmetics(scratchbonesPortraitConfig?.configBase || './docs/config/').then(cosmetics => {
        _portraitCosmetics = cosmetics;
        if (state.players.length) {
          for (const p of state.players) p.profile = generatePlayerProfile(p);
          applyAiNamesByPortraitCulture();
          renderSeatPortraits();
        }
      }).catch(e => console.warn('[game] portrait cosmetics failed to load', e));
    } else {
      console.warn('[game] portrait utils unavailable; falling back to initials.');
    }
    function generatePlayerProfile(player) {
      if (!_portraitCosmetics) return null;
      const { hairFrontOptions, hairBackOptions, hairSideOptions, eyesOptions, facialHairOptions, hatOptions, torsoPortraitOptions, armPortraitOptions, bodyColorRangesByGender, allowedCosmeticsByFighter, cosmeticWeightsByFighter, forcedCosmeticsByFighter, conditionalCosmeticsByFighter } = _portraitCosmetics;
      const seedStr = player.seed || `player-${player.id}`;
      const rng = mulberry32(hashStringToSeed(seedStr));
      const fighterGender = f => f.gender ?? (f.id === 'M' ? 'male' : f.id === 'F' ? 'female' : null);
      const fighterPool = player.gender === 'male'   ? FIGHTERS.filter(f => fighterGender(f) === 'male')
                        : player.gender === 'female' ? FIGHTERS.filter(f => fighterGender(f) === 'female')
                        : FIGHTERS;
      return randomProfileSeeded(rng, fighterPool.length ? fighterPool : FIGHTERS, hairFrontOptions, hairBackOptions, hairSideOptions, eyesOptions, facialHairOptions, bodyColorRangesByGender, allowedCosmeticsByFighter, hatOptions, cosmeticWeightsByFighter, torsoPortraitOptions, armPortraitOptions, forcedCosmeticsByFighter, conditionalCosmeticsByFighter);
    }
    function logPlayerPortraitXforms(player) {
      if (!player?.profile || !window.getProfileSpriteXforms) return;
      const rows = getProfileSpriteXforms(player.profile).map((entry, index) => {
        const xf = entry.xform || {};
        return {
          sprite: index + 1,
          part: entry.part || '',
          group: entry.group || '',
          id: entry.id || '',
          pos: entry.pos || '',
          renderOrder: entry.renderOrder || '',
          url: entry.url || '',
          ax: Number(xf.ax ?? 0).toFixed(3),
          ay: Number(xf.ay ?? 0).toFixed(3),
          sx: Number(xf.sx ?? 1).toFixed(3),
          sy: Number(xf.sy ?? 1).toFixed(3),
        };
      });
      console.debug(`[portrait-xform] ${seatLabel(player)} initial portrait sprites`, rows);
    }
    function renderSeatPortraits() {
      const root = document.getElementById('app');
      if (!root) return;
      for (const p of state.players) {
        if (!p.profile) continue;
        const canvases = root.querySelectorAll(`canvas[data-seat-id="${p.id}"]`);
        for (const canvas of canvases) {
          if (window.renderProfile) renderProfile(canvas, p.profile);
        }
      }
    }
    // ===== CHALLENGE CINEMATIC MODE =====
    function clearCinematicTimeout() {
      if (state.cinematicTimeout) {
        clearTimeout(state.cinematicTimeout);
        state.cinematicTimeout = null;
      }
    }
    function closeCinematic(invokeOnClose = true) {
      clearCinematicTimeout();
      const onClose = state.cinematicMode?.onClose;
      state.cinematicMode = null;
      if (invokeOnClose && typeof onClose === 'function') onClose();
      render();
    }
    function setCinematicMode(mode, payload = {}, options = {}) {
      clearCinematicTimeout();
      state.cinematicMode = {
        mode,
        ...payload,
        onClose: options.onClose || null,
      };
      if (options.durationMs && Number(options.durationMs) > 0) {
        state.cinematicTimeout = setTimeout(() => closeCinematic(true), Number(options.durationMs));
      }
      render();
    }
    function ensureChallengeCinematic() {
      const app = document.getElementById('app');
      if (!app) return;
      const bettingModeActive = !!(state.betting && !state.gameOver && isTableCinematicEnabled());
      if (bettingModeActive && !state.cinematicMode) {
        clearCinematicTimeout();
        state.cinematicMode = {
          mode: 'betting',
          actorId: state.betting.challengedId,
          reactorId: state.betting.challengerId,
          actorRole: 'Challenged',
          reactorRole: 'Challenger',
          headline: '⚔ Challenge betting',
          onClose: null,
        };
      }
      if (!bettingModeActive && state.cinematicMode?.mode === 'betting') {
        clearCinematicTimeout();
        state.cinematicMode = null;
      }
      const challengeFlowActive = !!(state.challengeWindow || state.betting || state.cinematicMode || state.challengeIntro);
      const challengeVisualsActive = !!(state.betting || state.cinematicMode || state.challengeIntro);
      const hadChallengeVisuals = app.classList.contains('challenge-visuals-active');
      app.classList.toggle('cinematic-mode-active', bettingModeActive || !!state.cinematicMode);
      app.classList.toggle('challenge-flow-active', challengeFlowActive);
      app.classList.toggle('challenge-visuals-active', challengeVisualsActive);
      app.classList.toggle('betting-overlay-active', bettingModeActive);
      if (hadChallengeVisuals !== challengeVisualsActive) {
        console.log(`[challenge-visuals] ${challengeVisualsActive ? 'activated' : 'deactivated'}`);
      }
    }
    function updateTableCardAutoScale(root = document.getElementById('app')) {
      const cardsContainer = root?.querySelector?.('.tableViewCards');
      const cards = cardsContainer ? Array.from(cardsContainer.querySelectorAll('.tableViewCard')) : [];
      if (!cardsContainer || !cards.length) {
        if (root) root.style.setProperty('--layout-table-card-auto-scale', '1');
        return;
      }
      // Reset to scale=1 first so we measure intrinsic card dimensions
      root.style.setProperty('--layout-table-card-auto-scale', '1');
      const firstCard = cards[0];
      const cardWidth = firstCard.offsetWidth || 1;
      const cardHeight = firstCard.offsetHeight || 1;
      const availableWidth = Math.max(1, cardsContainer.clientWidth);
      const availableHeight = Math.max(1, cardsContainer.clientHeight);
      const gap = Number.parseFloat(getComputedStyle(cardsContainer).gap) || 0;
      const cardCount = cards.length;
      let bestScale = 0;
      for (let rows = 1; rows <= cardCount; rows++) {
        const cols = Math.ceil(cardCount / rows);
        const requiredWidth = cols * cardWidth + Math.max(0, cols - 1) * gap;
        const requiredHeight = rows * cardHeight + Math.max(0, rows - 1) * gap;
        const candidate = Math.min(
          availableWidth / Math.max(1, requiredWidth),
          availableHeight / Math.max(1, requiredHeight)
        );
        if (candidate > bestScale) bestScale = candidate;
      }
      root.style.setProperty('--layout-table-card-auto-scale', clampNumber(bestScale, 0.35, 1).toFixed(3));
    }
    const clusterCinematicStageRuntime = {
      phaseKey: null,
      revealSpawnKey: null,
      bettingUiKey: null,
    };
    function clearAvatarCinematics(app = document.getElementById('app')) {
      if (!app) return;
      app.querySelectorAll('.actorAvatarFloat .claimAvatarLocalOverlay, .reactorAvatarFloat .claimAvatarLocalOverlay').forEach((overlay) => {
        overlay.innerHTML = '';
      });
    }
    function clearHandCinematics(app = document.getElementById('app')) {
      if (!app) return;
      const hand = app.querySelector('.claimHandBar');
      if (hand) hand.classList.remove('glow-green', 'glow-red');
      app.querySelectorAll('.claimHandBar .tableViewCard').forEach((card) => {
        card.classList.remove('cin-reveal-card');
        card.style.removeProperty('--fd');
        card.querySelector('.cin-reveal-label')?.remove();
      });
    }
    function clearHeadlineCinematics(app = document.getElementById('app')) {
      if (!app) return;
      const textAnchor = app.querySelector('.claimClusterTextAnchor');
      if (!textAnchor) return;
      textAnchor.innerHTML = '';
      textAnchor.classList.remove('claimClusterCinematicPane', 'cinematic-betting-pane', 'cinematic-resolution-pane');
      textAnchor.style.pointerEvents = 'none';
      clusterCinematicStageRuntime.bettingUiKey = null;
    }
    function clearClaimClusterBettingLayer(app = document.getElementById('app')) {
      if (!app) return;
      const bettingLayer = app.querySelector('.claimClusterBettingLayer');
      if (!bettingLayer) return;
      bettingLayer.querySelectorAll('[data-stake-betting-status-anchor], [data-stake-left-contribution-anchor], [data-stake-right-contribution-anchor], [data-stake-betting-choice-anchor]').forEach((node) => {
        node.innerHTML = '';
      });
      bettingLayer.style.pointerEvents = 'none';
    }
    function ensureAvatarOverlay(anchorEl) {
      if (!anchorEl) return null;
      let overlay = anchorEl.querySelector('.claimAvatarLocalOverlay');
      if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'claimAvatarLocalOverlay';
        overlay.setAttribute('aria-hidden', 'true');
        anchorEl.appendChild(overlay);
      }
      return overlay;
    }
    function mountAvatarCinematic(anchorEl, playerId, roleLabel) {
      const overlay = ensureAvatarOverlay(anchorEl);
      if (!overlay || !Number.isInteger(playerId)) return;
      const player = state.players[playerId];
      const name = player ? seatFirstName(player) : seatFirstName(playerId);
      const tags = player?.personality ? personalityTags(player.personality) : '';
      overlay.innerHTML = `
        <div class="claimAvatarCinRole">${escapeHtml(roleLabel)}</div>
        <div class="claimAvatarCinName">${escapeHtml(name || '')}</div>
        ${tags ? `<div class="claimAvatarCinTags">${escapeHtml(tags)}</div>` : ''}
      `;
    }
    function mountActorAvatarCinematic(app, cinematicMode) {
      const anchor = app?.querySelector('.actorAvatarFloat');
      if (!anchor) return;
      mountAvatarCinematic(anchor, cinematicMode?.actorId, cinematicMode?.actorRole || 'Challenger');
    }
    function mountReactorAvatarCinematic(app, cinematicMode) {
      const anchor = app?.querySelector('.reactorAvatarFloat');
      if (!anchor) return;
      mountAvatarCinematic(anchor, cinematicMode?.reactorId, cinematicMode?.reactorRole || 'Challenged');
    }
    function mountClaimHandCinematic(app, { cinematicPhase, cinematicMode, cinematicRevealPlay }) {
      const claimHandAnchor = app?.querySelector('.claimHandBar');
      if (!claimHandAnchor) return;
      clearHandCinematics(app);
      if (cinematicPhase !== 'reveal') return;
      const cards = cinematicRevealPlay?.cards || [];
      const declaredRank = cinematicRevealPlay?.declaredRank;
      if (!cards.length) return;
      claimHandAnchor.classList.add(cinematicMode?.winnerId === cinematicMode?.challengerId ? 'glow-green' : 'glow-red');
      const cardEls = Array.from(claimHandAnchor.querySelectorAll('.tableViewCard'));
      cardEls.forEach((cardEl, index) => {
        const card = cards[index];
        if (!card) return;
        cardEl.classList.add('cin-reveal-card');
        cardEl.style.setProperty('--fd', `${(index * 0.09).toFixed(2)}s`);
        const verdict = document.createElement('div');
        verdict.className = 'cin-reveal-label';
        verdict.textContent = card.wild ? 'Wild' : (Number(card.rank) === Number(declaredRank) ? 'Truth' : 'Lie');
        cardEl.appendChild(verdict);
      });
    }
    function mountClusterHeadlineCinematic(app, { cinematicMode, cinematicPhase, bettingActorHuman, humanCallAmount }) {
      const textAnchor = app?.querySelector('.claimClusterTextAnchor');
      if (!textAnchor || !cinematicMode) return;
      if (cinematicPhase === 'betting') {
        clearHeadlineCinematics(app);
        const bettingLayer = app.querySelector('.claimClusterBettingLayer');
        const statusAnchor = bettingLayer?.querySelector('[data-stake-betting-status-anchor]');
        const leftAnchor = bettingLayer?.querySelector('[data-stake-left-contribution-anchor]');
        const rightAnchor = bettingLayer?.querySelector('[data-stake-right-contribution-anchor]');
        const choiceAnchor = bettingLayer?.querySelector('[data-stake-betting-choice-anchor]');
        const bettingActorId = state.betting.currentActorId;
        const openingMode = state.betting.phase === 'opening';
        const legalActions = legalBettingActionsFor(bettingActorId);
        const legalTierIds = legalStakeTierIdsForPlayer(bettingActorId);
        const canRaise = legalActions.includes('raise-tier') && legalTierIds.length > 0;
        const actorCanAct = bettingActorHuman;
        const bettingLocked = !!state.betting.actionInFlight;
        const renderTierButtons = (mode) => `<div class="stakeTierBtnRow" data-proj-id="betting-tier-buttons">${STAKE_TIERS.map((tier) => {
          const enabled = legalTierIds.includes(tier.id) && !bettingLocked;
          const coinSrc = stakeCoinSrcForTier(tier.id);
          return `<button class="stakeTierBtn" data-stake-tier-btn="${tier.id}" data-stake-tier-action="${mode}" data-stake-tier-id="${tier.id}" ${!enabled ? 'disabled' : ''}><img src="${escapeHtml(coinSrc)}" data-fallback-src="${escapeHtml(stakeCoinSrcForTier(STAKE_COIN_FALLBACK_TIER_ID))}" alt="${escapeHtml(tier.id)} coin"><span>${tier.value}</span></button>`;
        }).join('')}</div>`;
        const punishToggleHtml = '';
        const bettingActionsHtml = actorCanAct
          ? (openingMode
            ? `${renderTierButtons('open')}${punishToggleHtml}<div class="duelChoiceControls"><button class="danger" id="betFoldBtn" ${bettingLocked ? 'disabled' : ''}>Fold</button></div>`
            : `${canRaise ? renderTierButtons('raise') : ''}${punishToggleHtml}<div class="duelChoiceControls"><button class="secondary" id="betCallBtn" ${bettingLocked ? 'disabled' : ''}>Call ${humanCallAmount}</button><button class="danger" id="betFoldBtn" ${bettingLocked ? 'disabled' : ''}>Fold</button></div>`)
          : `<div class="tiny">${seatLabel(bettingActorId)} is deciding the next betting action.</div>`;
        const challengerContributionTierId = tierIdForContributionValue(getContribution(state.betting.challengerId));
        const challengedContributionTierId = tierIdForContributionValue(getContribution(state.betting.challengedId));
        const bettingUiKey = JSON.stringify({
          actor: bettingActorId,
          openingMode,
          legalActions,
          legalTierIds,
          currentTierId: state.betting.currentTierId,
          currentTierValue: state.betting.currentTierValue,
          displayedTierId: state.betting.displayedTierId,
          contributions: state.betting.contributions,
          challengerHasRaised: state.betting.challengerHasRaised,
          challengedHasRaised: state.betting.challengedHasRaised,
          actionInFlight: bettingLocked,
        });
        if (clusterCinematicStageRuntime.bettingUiKey !== bettingUiKey) {
          if (!bettingLayer || !statusAnchor || !leftAnchor || !rightAnchor || !choiceAnchor) {
            console.warn('[betting-cluster] layer mount failed', { mounted: false });
            return;
          }
          bettingLayer.style.pointerEvents = 'auto';
          statusAnchor.innerHTML = `<div class="bettingStatusTitle" data-proj-id="betting-status-title">${escapeHtml(cinematicMode?.headline || 'Challenge betting')}</div><div class="bettingStatusLine" data-proj-id="betting-status-line">${escapeHtml(seatFirstName(state.betting.currentActorId))} to act · Stake ${escapeHtml(state.betting.currentTierId || 'pending')} (${state.betting.currentTierValue || 0})</div>`;
          leftAnchor.innerHTML = `<div class="stakeSlotLabel">Challenger</div><div class="stakeAnchor" data-stake-contrib-anchor="${state.betting.challengerId}">${challengerContributionTierId ? `<img data-stake-contrib-coin="${state.betting.challengerId}" src="${escapeHtml(stakeCoinSrcForTier(challengerContributionTierId))}" data-fallback-src="${escapeHtml(stakeCoinSrcForTier(STAKE_COIN_FALLBACK_TIER_ID))}" alt="challenger contribution coin">` : ''}</div><div class="stakeSlotValue">${getContribution(state.betting.challengerId)}</div>`;
          rightAnchor.innerHTML = `<div class="stakeSlotLabel">Challenged</div><div class="stakeAnchor" data-stake-contrib-anchor="${state.betting.challengedId}">${challengedContributionTierId ? `<img data-stake-contrib-coin="${state.betting.challengedId}" src="${escapeHtml(stakeCoinSrcForTier(challengedContributionTierId))}" data-fallback-src="${escapeHtml(stakeCoinSrcForTier(STAKE_COIN_FALLBACK_TIER_ID))}" alt="challenged contribution coin">` : ''}</div><div class="stakeSlotValue">${getContribution(state.betting.challengedId)}</div>`;
          choiceAnchor.innerHTML = bettingActionsHtml;
          const coinButtons = [...choiceAnchor.querySelectorAll('[data-stake-tier-btn] img')].map((img) => ({ src: img.getAttribute('src'), fallback: img.getAttribute('data-fallback-src') }));
          const slotRects = {
            left: contributionAnchorForPlayer(state.betting.challengerId)?.getBoundingClientRect() || null,
            right: contributionAnchorForPlayer(state.betting.challengedId)?.getBoundingClientRect() || null,
          };
          console.log('[betting-cluster] mounted successfully', { mounted: true, actorId: bettingActorId, currentTier: state.betting.currentTierId, legalTierIds, legalActions });
          console.log('[betting-cluster] contribution slot positions', {
            left: slotRects.left ? { x: Math.round(slotRects.left.left), y: Math.round(slotRects.left.top) } : null,
            right: slotRects.right ? { x: Math.round(slotRects.right.left), y: Math.round(slotRects.right.top) } : null,
          });
          console.log('[betting-coins] coin buttons mounted', { paths: coinButtons });
          clusterCinematicStageRuntime.bettingUiKey = bettingUiKey;
        }
        return;
      }
      clearClaimClusterBettingLayer(app);
      if (cinematicPhase === 'reveal' || cinematicPhase === 'fold') {
        if (clusterCinematicStageRuntime.bettingUiKey !== null) clearHeadlineCinematics(app);
        const challenger = state.players[cinematicMode.challengerId];
        const challenged = state.players[cinematicMode.challengedId];
        const winner = state.players[cinematicMode.winnerId];
        const loser = state.players[cinematicMode.loserId];
        const winnerName = winner?.isHuman ? 'You' : (winner?.name || 'Unknown');
        const loserName = loser?.isHuman ? 'You' : (loser?.name || 'Unknown');
        const resultToneClass = cinematicMode.winnerId === 0 ? 'res-good' : (cinematicMode.loserId === 0 ? 'res-warn' : 'res-neutral');
        const headlineClass = cinematicPhase === 'reveal' ? (cinematicMode.winnerId === cinematicMode.challengerId ? 'cin-caught' : 'cin-defended') : 'cin-fold';
        const subtitle = cinematicPhase === 'reveal' ? `${winnerName} wins the challenge.` : `${loserName} folds — ${winnerName} takes the pot.`;
        textAnchor.classList.add('claimClusterCinematicPane', 'cinematic-resolution-pane');
        textAnchor.style.pointerEvents = 'auto';
        textAnchor.innerHTML = `<div class="sectionTitle cinematic-pane-title cin-headline ${headlineClass}">${escapeHtml(cinematicMode.headline || 'Challenge result')}</div><div class="tiny cinematic-vs-line" style="margin-top:6px;">${escapeHtml((challenger?.isHuman ? 'You' : challenger?.name || '?'))} vs ${escapeHtml((challenged?.isHuman ? 'You' : challenged?.name || '?'))}</div><div class="cin-result-copy cin-result ${resultToneClass}">${escapeHtml(subtitle)}</div><div class="challengeBar" style="margin-top:8px;"><button id="cinContinueBtn">Continue →</button></div>`;
      }
    }
    function claimClusterAvatarAnchorForPlayer(playerId, root = document.getElementById('app')) {
      if (!root) return null;
      const actorCanvas = root.querySelector('.actorAvatarFloat canvas.seatPortrait');
      if (actorCanvas && Number(actorCanvas.getAttribute('data-seat-id')) === Number(playerId)) return actorCanvas.closest('.actorAvatarFloat');
      const reactorCanvas = root.querySelector('.reactorAvatarFloat canvas.seatPortrait');
      if (reactorCanvas && Number(reactorCanvas.getAttribute('data-seat-id')) === Number(playerId)) return reactorCanvas.closest('.reactorAvatarFloat');
      return null;
    }
    function mountClaimClusterCinematicStage(app, context = {}) {
      const { cinematicMode, cinematicPhase, cinematicRevealPlay, bettingActorHuman, humanCallAmount } = context;
      if (!cinematicMode) {
        if (clusterCinematicStageRuntime.phaseKey !== null) {
          clearAvatarCinematics(app);
          clearHandCinematics(app);
          clearHeadlineCinematics(app);
          clearClaimClusterBettingLayer(app);
          clusterCinematicStageRuntime.phaseKey = null;
          clusterCinematicStageRuntime.revealSpawnKey = null;
          clusterCinematicStageRuntime.bettingUiKey = null;
          console.debug('[cinematic-cluster-stage] anchor-local cinematic cleared');
        }
        return;
      }
      const phaseKey = `${cinematicPhase}:${cinematicMode?.actorId ?? 'na'}:${cinematicMode?.reactorId ?? 'na'}:${cinematicRevealPlay?.cards?.map(c => c.id).join('-') || 'none'}`;
      if (phaseKey !== clusterCinematicStageRuntime.phaseKey) {
        clearAvatarCinematics(app);
        clearHandCinematics(app);
        clearHeadlineCinematics(app);
        clearClaimClusterBettingLayer(app);
        clusterCinematicStageRuntime.phaseKey = phaseKey;
        clusterCinematicStageRuntime.revealSpawnKey = null;
        clusterCinematicStageRuntime.bettingUiKey = null;
        console.debug('[cinematic-cluster-stage] anchor-local cinematic phase reset');
      }
      mountActorAvatarCinematic(app, cinematicMode);
      mountReactorAvatarCinematic(app, cinematicMode);
      mountClusterHeadlineCinematic(app, { cinematicMode, cinematicPhase, bettingActorHuman, humanCallAmount });
      if (cinematicPhase === 'reveal') {
        const revealKey = phaseKey;
        if (revealKey !== clusterCinematicStageRuntime.revealSpawnKey) {
          mountClaimHandCinematic(app, { cinematicPhase, cinematicMode, cinematicRevealPlay });
          clusterCinematicStageRuntime.revealSpawnKey = revealKey;
        }
      } else {
        clearHandCinematics(app);
      }
    }
    // ── Cinematic bet-action announcement (avatar-local overlays) ──
    function _announceCinematicBetAction(playerId, command) {
      const app = document.getElementById('app');
      if (!app || !state.cinematicMode) return;
      const anchor = claimClusterAvatarAnchorForPlayer(playerId, app);
      if (!anchor) return;
      const label = command === 'call' ? 'Call!' : command === 'raise-tier' ? 'Raise!' : command === 'open-tier' ? 'Stake!' : 'Fold!';
      const overlay = ensureAvatarOverlay(anchor);
      if (!overlay) return;
      const burstShell = document.createElement('div');
      const cls = command === 'call' ? 'burst-call' : (command === 'raise-tier' || command === 'open-tier') ? 'burst-raise' : 'burst-fold';
      burstShell.className = 'fx-burst-shell';
      burstShell.innerHTML = `<div class="cin-action-burst ${cls}">${escapeHtml(label)}</div>`;
      overlay.appendChild(burstShell);
      if (shouldRenderLayerManagedUi()) SCRATCHBONES_LAYER_MANAGER.sync(app);
      setTimeout(() => burstShell.remove(), Math.max(1000, Math.round((Number(getComputedStyle(document.documentElement).getPropertyValue('--layout-cinematic-burst-duration').replace('s', '')) || 2.1) * 1400)));
    }
// Phase 2a: Reveal (no fold)
    function showRevealCinematic(challengerIndex, challengedIndex, play, success, onClose) {
      if (!isTableCinematicEnabled()) {
        onClose?.();
        return;
      }
      clusterCinematicStageRuntime.phaseKey = null;
      clusterCinematicStageRuntime.revealSpawnKey = null;
      const winnerId = success ? challengerIndex : challengedIndex;
      const loserId = success ? challengedIndex : challengerIndex;
      const headline = success ? '🎯 Bluff Caught!' : '✔ Truthful Play!';
      setCinematicMode('reveal', {
        challengerId: challengerIndex,
        challengedId: challengedIndex,
        actorId: challengedIndex,
        reactorId: challengerIndex,
        actorRole: 'Challenged',
        reactorRole: 'Challenger',
        winnerId,
        loserId,
        play,
        headline,
      }, {
        onClose,
        durationMs: Number(SCRATCHBONES_GAME.layout?.tableView?.cinematic?.revealDurationMs) || 4200,
      });
    }
    // Phase 2b: Fold resolution
    function showFoldCinematic(winnerId, loserId, onClose) {
      if (!isTableCinematicEnabled()) {
        onClose?.();
        return;
      }
      clusterCinematicStageRuntime.phaseKey = null;
      clusterCinematicStageRuntime.revealSpawnKey = null;
      setCinematicMode('fold', {
        winnerId,
        loserId,
        challengerId: state.betting?.challengerId ?? winnerId,
        challengedId: state.betting?.challengedId ?? loserId,
        actorId: state.betting?.challengedId ?? loserId,
        reactorId: state.betting?.challengerId ?? winnerId,
        actorRole: 'Challenged',
        reactorRole: 'Challenger',
        headline: '🏳 Fold',
      }, {
        onClose,
        durationMs: Number(SCRATCHBONES_GAME.layout?.tableView?.cinematic?.foldDurationMs) || 2600,
      });
    }
    // ── UI projection mapping mode ────────────────────────────────────────
    const projectionUiState = {
      active: false,
      varsPanelOpen: false,
      showUnlayeredPreview: false,
      lastSelectedProjId: null,
      lastSelectedSourceEl: null,
      editedVars: new Map(),
      ui: null,
    };
    function shouldRenderLayerManagedUi() {
      return !projectionUiState.showUnlayeredPreview;
    }
    function renderAuthoredOverlays() {
      const overlay = document.getElementById('authoredOverlay');
      const app = document.getElementById('app');
      if (!overlay || !app) return;
      const mode = getScratchbonesLayoutMode();
      const isActive = projectionUiState.active && mode === 'authored';
      overlay.classList.toggle('active', isActive);
      overlay.innerHTML = '';
      app.querySelectorAll('[data-proj-id]').forEach((el) => el.classList.remove('authored-box-selected'));
      if (!isActive) return;
      const authored = getScratchbonesAuthoredConfig();
      const root = document.getElementById('authoredRoot');
      const liveWidth = root?.clientWidth || window.innerWidth || authored.designWidthPx;
      const liveHeight = root?.clientHeight || window.innerHeight || authored.designHeightPx;
      const scale = computeAuthoredScale(liveWidth, liveHeight, authored.designWidthPx, authored.designHeightPx);
      const offsetX = (liveWidth - (authored.designWidthPx * scale)) / 2;
      const offsetY = (liveHeight - (authored.designHeightPx * scale)) / 2;
      const subMode = authoredEditorState.subLayerMode;
      // Major box overlays — always shown, dimmed (non-interactive) in sub-layer mode
      for (const [boxId, box] of Object.entries(authored.boxes)) {
        const node = document.createElement('div');
        const isSelected = !subMode && authoredEditorState.selectedId === boxId;
        node.className = `authoredBoxOverlay${isSelected ? ' selected' : ''}${subMode ? ' sub-mode-dimmed' : ''}`;
        node.dataset.boxId = boxId;
        node.style.left = `${Math.round(offsetX + (box.x * scale))}px`;
        node.style.top = `${Math.round(offsetY + (box.y * scale))}px`;
        node.style.width = `${Math.max(12, Math.round(box.width * scale))}px`;
        node.style.height = `${Math.max(12, Math.round(box.height * scale))}px`;
        if (!subMode) {
          node.innerHTML = `<div class="authoredBoxLabel">${escapeHtml(boxId)}</div><div class="authoredResizeHandle" data-resize-handle="se"></div>`;
        }
        overlay.appendChild(node);
      }
      // Sub-element overlays — only in sub-layer mode
      if (subMode) {
        app.querySelectorAll('[data-proj-id]').forEach((el) => {
          const projId = el.getAttribute('data-proj-id');
          if (AUTHORED_BOX_KEY_BY_PROJ_ID[projId]) return; // skip major boxes
          const rect = el.getBoundingClientRect();
          const rootRect = root.getBoundingClientRect();
          const node = document.createElement('div');
          const isSelected = authoredEditorState.selectedSubId === projId;
          node.className = `authoredSubOverlay${isSelected ? ' selected' : ''}`;
          node.dataset.subProjId = projId;
          node.style.left = `${Math.round(rect.left - rootRect.left)}px`;
          node.style.top = `${Math.round(rect.top - rootRect.top)}px`;
          node.style.width = `${Math.max(12, Math.round(rect.width))}px`;
          node.style.height = `${Math.max(12, Math.round(rect.height))}px`;
          node.innerHTML = `<div class="authoredSubLabel">${escapeHtml(projId)}</div><div class="authoredResizeHandle" data-resize-handle="se"></div>`;
          overlay.appendChild(node);
        });
      }
      if (!subMode && authoredEditorState.selectedId) {
        for (const [projId, boxId] of Object.entries(AUTHORED_BOX_KEY_BY_PROJ_ID)) {
          if (boxId !== authoredEditorState.selectedId) continue;
          const match = app.querySelector(`[data-proj-id="${projId}"]`);
          if (match) { match.classList.add('authored-box-selected'); break; }
        }
      }
    }
    function updateAuthoredSubOffset(projId, dx, dy) {
      const authored = getScratchbonesAuthoredConfig();
      if (!authored.subOffsets) authored.subOffsets = {};
      authored.subOffsets[projId] = { dx: Math.round(dx), dy: Math.round(dy) };
      const app = document.getElementById('app');
      if (app) {
        const el = app.querySelector(`[data-proj-id="${projId}"]`);
        if (el) el.style.transform = `translate(${Math.round(dx)}px, ${Math.round(dy)}px)`;
      }
      renderAuthoredOverlays();
    }
    function updateAuthoredSubSize(projId, width, height) {
      const authored = getScratchbonesAuthoredConfig();
      if (!authored.subSizes) authored.subSizes = {};
      authored.subSizes[projId] = {
        width: Math.max(12, Math.round(width)),
        height: Math.max(12, Math.round(height)),
      };
      const app = document.getElementById('app');
      if (app) {
        const el = app.querySelector(`[data-proj-id="${projId}"]`);
        if (el) {
          el.style.width = `${Math.max(12, Math.round(width))}px`;
          el.style.height = `${Math.max(12, Math.round(height))}px`;
        }
      }
      renderAuthoredOverlays();
    }
    function getLiveSubElementSize(projId) {
      const el = document.getElementById('app')?.querySelector?.(`[data-proj-id="${projId}"]`);
      return {
        width: Math.max(12, Math.round(el?.offsetWidth || 12)),
        height: Math.max(12, Math.round(el?.offsetHeight || 12)),
      };
    }
    function renderAuthoredInspector() {
      const varsPanelBody = projectionUiState.ui?.varsPanelBody;
      const varsPanelTitle = projectionUiState.ui?.varsPanelTitle;
      if (!varsPanelBody || !varsPanelTitle || !projectionUiState.varsPanelOpen) return;
      const projectionMapConfig = SCRATCHBONES_GAME.layout?.projectionMapping || {};
      const varsByProjId = projectionMapConfig.varsByProjId || projectionMapConfig.relatedVarsByProjId || {};
      const sharedVars = Array.isArray(projectionMapConfig.sharedVars) ? projectionMapConfig.sharedVars : [];
      const fallbackVars = Array.isArray(projectionMapConfig.fallbackVars) ? projectionMapConfig.fallbackVars : [];
      const matchesProjPattern = (pattern, projId) => (typeof pattern === 'string' && pattern.endsWith('*'))
        ? projId.startsWith(pattern.slice(0, -1))
        : pattern === projId;
      const resolveVarsForProjId = (projId) => {
        const result = new Set(sharedVars);
        for (const [pattern, vars] of Object.entries(varsByProjId)) {
          if (!matchesProjPattern(pattern, projId)) continue;
          for (const varName of (Array.isArray(vars) ? vars : [])) {
            if (String(varName).startsWith('--')) result.add(varName);
          }
        }
        if (!result.size) {
          for (const varName of fallbackVars) {
            if (String(varName).startsWith('--')) result.add(varName);
          }
        }
        return [...result];
      };
      const subMode = authoredEditorState.subLayerMode;
      if (subMode && authoredEditorState.selectedSubId) {
        const projId = authoredEditorState.selectedSubId;
        const authored = getScratchbonesAuthoredConfig();
        const offset = authored.subOffsets?.[projId] || { dx: 0, dy: 0 };
        const relatedVars = resolveVarsForProjId(projId);
        const computedRootStyles = getComputedStyle(document.documentElement);
        const varRows = relatedVars.map((varName) => {
          const rawValue = projectionUiState.editedVars.get(varName) ?? computedRootStyles.getPropertyValue(varName);
          const value = String(rawValue ?? '').trim();
          return `<label class="projVarRow"><span class="projVarLabel">${escapeHtml(varName)}</span><input class="projVarInput" data-proj-kind="text" data-proj-var="${escapeHtml(varName)}" type="text" value="${escapeHtml(value)}"></label>`;
        }).join('');
        varsPanelTitle.textContent = `Sub Element · ${projId}`;
        const subSize = authored.subSizes?.[projId] || { width: 0, height: 0 };
        const liveSize = getLiveSubElementSize(projId);
        const subImmuneState = (() => {
          const candleApi = window.__candleLight;
          if (!candleApi?.resolveSelectors || !candleApi?.getState) return null;
          const resolvedSelector = candleApi.resolveSelectors({ projId, role: 'sub' })[0] || null;
          if (!resolvedSelector) return null;
          return { selector: resolvedSelector, state: candleApi.getState(resolvedSelector) || { backlit: true, immune: false } };
        })();
        const field = (key, label, value) => `<label class="projVarRow sizePosVar"><span class="projVarLabel">${label}</span><input class="projVarInput" data-authored-sub-field="${key}" data-sub-proj-id="${escapeHtml(projId)}" type="number" step="1" value="${Math.round(value)}"><span class="projVarHint">px</span></label>`;
        varsPanelBody.innerHTML = `
          <div class="projVarHint">Sub-element offset (translate within parent).</div>
          ${field('dx', 'dx', offset.dx ?? 0)}
          ${field('dy', 'dy', offset.dy ?? 0)}
          ${field('width', 'width', subSize.width || liveSize.width)}
          ${field('height', 'height', subSize.height || liveSize.height)}
          ${subImmuneState ? `<label class="projVarRow" style="gap:8px;align-items:center"><span class="projVarLabel">immune (candlelight)</span><input type="checkbox" data-authored-sub-immune="true" data-sub-proj-id="${escapeHtml(projId)}" ${subImmuneState.state?.immune ? 'checked' : ''}></label><div class="projVarHint">${escapeHtml(subImmuneState.selector)}</div>` : ''}
          ${varRows ? `<div class="projVarHint" style="margin-top:8px;">Linked CSS vars for ${escapeHtml(projId)}.</div>${varRows}` : ''}
        `;
        return;
      }
      const selectedId = getSelectedAuthoredBox();
      if (!selectedId) return;
      const authored = getScratchbonesAuthoredConfig();
      const box = authored.boxes[selectedId];
      if (!box) return;
      varsPanelTitle.textContent = `Authored Box · ${selectedId}`;
      const field = (key) => `<label class="projVarRow sizePosVar"><span class="projVarLabel">${key}</span><input class="projVarInput" data-authored-field="${key}" type="number" step="1" value="${Math.round(box[key])}"><span class="projVarHint">px</span><span class="projVarHint">direct</span></label>`;
      varsPanelBody.innerHTML = `
        <div class="projVarHint">Selected authored box is the primary editor target.</div>
        ${field('x')}
        ${field('y')}
        ${field('width')}
        ${field('height')}
      `;
    }
    function bindAuthoredDragAndResize(event) {
      if (!projectionUiState.active || getScratchbonesLayoutMode() !== 'authored') return false;
      // Sub-layer mode: drag sub-element overlays
      if (authoredEditorState.subLayerMode) {
        const subOverlay = event.target.closest('.authoredSubOverlay');
        if (!subOverlay) return false;
        const projId = subOverlay.dataset.subProjId;
        if (!projId) return false;
        if (authoredEditorState.selectedSubId !== projId) {
          authoredEditorState.selectedSubId = projId;
          renderAuthoredOverlays();
          renderAuthoredInspector();
        }
        const authored = getScratchbonesAuthoredConfig();
        const current = authored.subOffsets?.[projId] || { dx: 0, dy: 0 };
        const currentSize = authored.subSizes?.[projId] || getLiveSubElementSize(projId);
        const root = document.getElementById('authoredRoot');
        const liveWidth = root?.clientWidth || window.innerWidth || authored.designWidthPx;
        const liveHeight = root?.clientHeight || window.innerHeight || authored.designHeightPx;
        const scale = computeAuthoredScale(liveWidth, liveHeight, authored.designWidthPx, authored.designHeightPx);
        const isResize = !!event.target.closest('[data-resize-handle]');
        authoredEditorState.pointerDrag = {
          subMode: true,
          mode: isResize ? 'resize' : 'move',
          projId,
          startX: event.clientX,
          startY: event.clientY,
          startDx: current.dx,
          startDy: current.dy,
          startWidth: currentSize.width,
          startHeight: currentSize.height,
          scale,
        };
        authoredEditorState.pointerCaptureTarget = subOverlay;
        authoredEditorState.pointerCaptureId = event.pointerId;
        if (typeof subOverlay.setPointerCapture === 'function') {
          try { subOverlay.setPointerCapture(event.pointerId); } catch { authoredEditorState.pointerCaptureTarget = null; authoredEditorState.pointerCaptureId = null; }
        }
        event.preventDefault();
        return true;
      }
      // Normal mode: drag major box overlays
      const overlay = event.target.closest('.authoredBoxOverlay');
      if (!overlay) return false;
      const boxId = overlay.dataset.boxId;
      if (!boxId) return false;
      if (authoredEditorState.selectedId !== boxId) selectAuthoredBox(boxId);
      const authored = getScratchbonesAuthoredConfig();
      const box = authored.boxes[boxId];
      if (!box) return false;
      const root = document.getElementById('authoredRoot');
      const liveWidth = root?.clientWidth || window.innerWidth || authored.designWidthPx;
      const liveHeight = root?.clientHeight || window.innerHeight || authored.designHeightPx;
      const scale = computeAuthoredScale(liveWidth, liveHeight, authored.designWidthPx, authored.designHeightPx);
      const isResize = !!event.target.closest('[data-resize-handle]');
      authoredEditorState.pointerDrag = {
        boxId,
        mode: isResize ? 'resize' : 'move',
        startX: event.clientX,
        startY: event.clientY,
        startBox: { ...box },
        scale,
      };
      authoredEditorState.pointerCaptureTarget = overlay;
      authoredEditorState.pointerCaptureId = event.pointerId;
      if (typeof overlay.setPointerCapture === 'function') {
        try {
          overlay.setPointerCapture(event.pointerId);
        } catch {
          authoredEditorState.pointerCaptureTarget = null;
          authoredEditorState.pointerCaptureId = null;
        }
      }
      event.preventDefault();
      return true;
    }
    function updateAuthoredPointer(event) {
      const drag = authoredEditorState.pointerDrag;
      if (!drag) return;
      if (drag.subMode) {
        const ddx = (event.clientX - drag.startX) / drag.scale;
        const ddy = (event.clientY - drag.startY) / drag.scale;
        if (drag.mode === 'resize') {
          const newWidth = Math.max(12, drag.startWidth + ddx);
          const newHeight = Math.max(12, drag.startHeight + ddy);
          updateAuthoredSubSize(drag.projId, newWidth, newHeight);
          updateEditorStatus(`Sub size ${drag.projId}: w=${Math.round(newWidth)} h=${Math.round(newHeight)}`);
        } else {
          const newDx = drag.startDx + ddx;
          const newDy = drag.startDy + ddy;
          updateAuthoredSubOffset(drag.projId, newDx, newDy);
          updateEditorStatus(`Sub offset ${drag.projId}: dx=${Math.round(newDx)} dy=${Math.round(newDy)}`);
        }
        if (projectionUiState.varsPanelOpen) renderAuthoredInspector();
        return;
      }
      const dx = (event.clientX - drag.startX) / drag.scale;
      const dy = (event.clientY - drag.startY) / drag.scale;
      const next = { ...drag.startBox };
      if (drag.mode === 'resize') {
        next.width = Math.max(24, drag.startBox.width + dx);
        next.height = Math.max(24, drag.startBox.height + dy);
      } else {
        next.x = drag.startBox.x + dx;
        next.y = drag.startBox.y + dy;
      }
      updateAuthoredBox(drag.boxId, next);
      updateEditorStatus(`Updated ${drag.boxId}: x=${Math.round(next.x)} y=${Math.round(next.y)} w=${Math.round(next.width)} h=${Math.round(next.height)}`);
    }
    function finishAuthoredPointer() {
      if (!authoredEditorState.pointerDrag) return;
      const captureTarget = authoredEditorState.pointerCaptureTarget;
      const captureId = authoredEditorState.pointerCaptureId;
      if (captureId != null && captureTarget?.hasPointerCapture?.(captureId)) captureTarget.releasePointerCapture(captureId);
      authoredEditorState.pointerDrag = null;
      authoredEditorState.pointerCaptureTarget = null;
      authoredEditorState.pointerCaptureId = null;
    }
    (function initProjMap() {
      const btn = document.getElementById('projMapBtn');
      const varsBtn = document.getElementById('projVarBtn');
      const exportBtn = document.getElementById('projExportBtn');
      const tip = document.getElementById('projMapTip');
      const varsPanel = document.getElementById('projVarPanel');
      const varsPanelTitle = document.getElementById('projVarPanelTitle');
      const varsPanelBody = document.getElementById('projVarPanelBody');
      const varsCopyBtn = document.getElementById('projVarCopyBtn');
      const varsCloseBtn = document.getElementById('projVarCloseBtn');
      const subBtn = document.getElementById('projSubBtn');
      if (!btn || !tip || !varsBtn || !exportBtn || !varsPanel || !varsPanelTitle || !varsPanelBody || !varsCopyBtn || !varsCloseBtn) return;
      projectionUiState.ui = { varsPanelBody, varsPanelTitle };
      let layerPreviewBtn = document.getElementById('projLayerPreviewBtn');
      let transformExportBtn = document.getElementById('projTransformExportBtn');
      if (!layerPreviewBtn) {
        layerPreviewBtn = document.createElement('button');
        layerPreviewBtn.id = 'projLayerPreviewBtn';
        layerPreviewBtn.type = 'button';
        layerPreviewBtn.className = 'ghost';
        layerPreviewBtn.style.marginRight = '6px';
        varsCopyBtn.parentElement?.insertBefore(layerPreviewBtn, varsCopyBtn);
      }
      if (!transformExportBtn) {
        transformExportBtn = document.createElement('button');
        transformExportBtn.id = 'projTransformExportBtn';
        transformExportBtn.type = 'button';
        transformExportBtn.className = 'ghost';
        transformExportBtn.style.display = 'inline-block';
        transformExportBtn.style.flexBasis = '100%';
        transformExportBtn.style.marginTop = '6px';
        transformExportBtn.style.setProperty('pointer-events', 'auto', 'important');
        layerPreviewBtn.parentElement?.insertBefore(transformExportBtn, varsCopyBtn);
      }
      if (layerPreviewBtn.parentElement) layerPreviewBtn.parentElement.style.flexWrap = 'wrap';
      const updateLayerPreviewButton = () => {
        const isUnlayered = projectionUiState.showUnlayeredPreview;
        layerPreviewBtn.textContent = isUnlayered ? 'Layered' : 'Original';
        layerPreviewBtn.title = isUnlayered
          ? 'Show current layer-manager promoted positions.'
          : 'Show UI at original positions before layer-manager promotion.';
      };
      updateLayerPreviewButton();
      const projectionMapConfig = SCRATCHBONES_GAME.layout?.projectionMapping || {};
      const projectionEditorConfig = projectionMapConfig.editor || {};
      const varStep = Number(projectionEditorConfig.step) || 0.01;
      const basePanelTitle = String(projectionEditorConfig.panelTitle || 'Projection Vars');
      const transformsExportButtonLabel = String(projectionEditorConfig.transformsExportButtonLabel || 'Toggle + Export Screen Space');
      const transformsExportButtonTitle = String(projectionEditorConfig.transformsExportButtonTitle || 'Toggle preview mode, then copy literal screen-space rectangles and transforms for the active mode.');
      const transformsExportBothButtonLabel = String(projectionEditorConfig.transformsExportBothButtonLabel || 'Export Both Screen Spaces');
      const transformsExportBothButtonTitle = String(projectionEditorConfig.transformsExportBothButtonTitle || 'Capture original and layered screen-space snapshots in one deterministic export.');
      transformExportBtn.textContent = transformsExportButtonLabel;
      transformExportBtn.title = transformsExportButtonTitle;
      let transformExportBothBtn = document.getElementById('projTransformExportBothBtn');
      if (!transformExportBothBtn) {
        transformExportBothBtn = document.createElement('button');
        transformExportBothBtn.id = 'projTransformExportBothBtn';
        transformExportBothBtn.type = 'button';
        transformExportBothBtn.className = 'ghost';
        transformExportBothBtn.style.display = 'inline-block';
        transformExportBothBtn.style.flexBasis = '100%';
        transformExportBothBtn.style.marginTop = '6px';
        transformExportBothBtn.style.setProperty('pointer-events', 'auto', 'important');
        transformExportBtn.parentElement?.insertBefore(transformExportBothBtn, varsCopyBtn);
      }
      transformExportBothBtn.textContent = transformsExportBothButtonLabel;
      transformExportBothBtn.title = transformsExportBothButtonTitle;
      const sliderClamp = projectionEditorConfig.sliderClamp || {};
      const multiplierVarHints = Array.isArray(projectionEditorConfig.multiplierVarHints) ? projectionEditorConfig.multiplierVarHints : ['scale', 'frac', 'ratio', 'multiplier'];
      const varsByProjId = projectionMapConfig.varsByProjId || projectionMapConfig.relatedVarsByProjId || {};
      const selectorVarsByProjId = projectionMapConfig.selectorVarsByProjId || {};
      const sharedVars = Array.isArray(projectionMapConfig.sharedVars) ? projectionMapConfig.sharedVars : [];
      const fallbackVars = Array.isArray(projectionMapConfig.fallbackVars) ? projectionMapConfig.fallbackVars : [];
      const DEFAULT_SLIDER_MIN = Number.isFinite(Number(sliderClamp.absoluteMin)) ? Number(sliderClamp.absoluteMin) : -2000;
      const DEFAULT_SLIDER_MAX = Number.isFinite(Number(sliderClamp.absoluteMax)) ? Number(sliderClamp.absoluteMax) : 2000;
      const MULTIPLIER_SLIDER_MIN = Number.isFinite(Number(sliderClamp.multiplierMin)) ? Number(sliderClamp.multiplierMin) : 0;
      const MULTIPLIER_SLIDER_MAX = Number.isFinite(Number(sliderClamp.multiplierMax)) ? Number(sliderClamp.multiplierMax) : 5;
      const matchesProjPattern = (pattern, projId) => (typeof pattern === 'string' && pattern.endsWith('*')) ? projId.startsWith(pattern.slice(0, -1)) : pattern === projId;
      const normalizeCssVarValue = (rawValue) => {
        const value = String(rawValue || '').trim();
        if (!value) return '';
        const parsed = Number.parseFloat(value);
        if (!Number.isFinite(parsed)) return value;
        if (/dvh$/i.test(value)) return `${parsed.toFixed(2)}dvh`;
        if (/px$/i.test(value)) return `${parsed.toFixed(2)}px`;
        return parsed.toFixed(3);
      };
      const parseNumericCssVar = (rawValue) => {
        const match = String(rawValue || '').trim().match(/-?\d+(\.\d+)?/);
        if (!match) return null;
        const value = Number.parseFloat(match[0]);
        return Number.isFinite(value) ? value : null;
      };
      const cssVarSuffix = (value) => (String(value ?? '').trim().match(/[a-z%]+$/i) || [])[0] || '';
      const isMultiplierVar = (varName, currentValue) => multiplierVarHints.some((hint) => String(varName || '').toLowerCase().includes(String(hint || '').toLowerCase())) || !cssVarSuffix(currentValue);
      const resolveSliderBounds = (varName, currentValue) => isMultiplierVar(varName, currentValue)
        ? { min: MULTIPLIER_SLIDER_MIN, max: MULTIPLIER_SLIDER_MAX }
        : { min: DEFAULT_SLIDER_MIN, max: DEFAULT_SLIDER_MAX };
      const resolveRelatedVars = (projId, sourceEl) => {
        if (!projId) return [];
        const result = new Set(sharedVars);
        for (const [pattern, vars] of Object.entries(varsByProjId)) {
          if (!matchesProjPattern(pattern, projId)) continue;
          for (const varName of (Array.isArray(vars) ? vars : [])) if (String(varName).startsWith('--')) result.add(varName);
        }
        if (sourceEl) {
          for (const [pattern, selectorMapping] of Object.entries(selectorVarsByProjId)) {
            if (!matchesProjPattern(pattern, projId) || !selectorMapping || typeof selectorMapping !== 'object') continue;
            for (const [selector, vars] of Object.entries(selectorMapping)) {
              if (!selector || !(sourceEl.matches(selector) || sourceEl.closest(selector))) continue;
              for (const varName of (Array.isArray(vars) ? vars : [])) if (String(varName).startsWith('--')) result.add(varName);
            }
          }
        }
        if (!result.size) for (const varName of fallbackVars) if (String(varName).startsWith('--')) result.add(varName);
        return [...result];
      };
      const renderVarEditor = () => {
        if (getScratchbonesLayoutMode() === 'authored' && (getSelectedAuthoredBox() || authoredEditorState.subLayerMode)) {
          renderAuthoredInspector();
          return;
        }
        varsPanelTitle.textContent = projectionUiState.lastSelectedProjId
          ? `${basePanelTitle} · ${projectionUiState.lastSelectedProjId}`
          : basePanelTitle;
        if (!projectionUiState.lastSelectedProjId) {
          varsPanelBody.innerHTML = '<div class="projVarHint">Select an outlined element in map mode, then open Vars.</div>';
          return;
        }
        const relatedVars = resolveRelatedVars(projectionUiState.lastSelectedProjId, projectionUiState.lastSelectedSourceEl);
        if (!relatedVars.length) {
          varsPanelBody.innerHTML = '<div class="projVarHint">No configured variables for this element yet.</div>';
          return;
        }
        const computedRootStyles = getComputedStyle(document.documentElement);
        varsPanelBody.innerHTML = relatedVars.map((varName) => {
          const value = normalizeCssVarValue(projectionUiState.editedVars.get(varName) ?? computedRootStyles.getPropertyValue(varName));
          const numericValue = parseNumericCssVar(value);
          const bounds = resolveSliderBounds(varName, value);
          return `<label class="projVarRow"><span class="projVarLabel">${escapeHtml(varName)}</span><input class="projVarInput" data-proj-kind="text" data-proj-var="${escapeHtml(varName)}" type="text" value="${escapeHtml(value)}"><input class="projVarInput" data-proj-kind="number" data-proj-var="${escapeHtml(varName)}" type="number" step="${varStep}" value="${numericValue ?? ''}"><input class="projVarInput" data-proj-kind="range" data-proj-var="${escapeHtml(varName)}" type="range" min="${bounds.min}" max="${bounds.max}" step="${varStep}" value="${numericValue ?? bounds.min}"></label>`;
        }).join('');
      };
      btn.addEventListener('click', () => {
        projectionUiState.active = !projectionUiState.active;
        document.body.classList.toggle('proj-mapping', projectionUiState.active);
        btn.classList.toggle('active', projectionUiState.active);
        varsBtn.style.display = projectionUiState.active ? 'block' : 'none';
        exportBtn.style.display = projectionUiState.active ? 'block' : 'none';
        if (subBtn) subBtn.style.display = projectionUiState.active ? 'block' : 'none';
        if (!projectionUiState.active) {
          tip.style.display = 'none';
          varsPanel.classList.remove('open');
          varsBtn.classList.remove('active');
          projectionUiState.varsPanelOpen = false;
          projectionUiState.showUnlayeredPreview = false;
          updateLayerPreviewButton();
          authoredEditorState.subLayerMode = false;
          authoredEditorState.selectedSubId = null;
          if (subBtn) subBtn.classList.remove('active');
        }
        render();
        renderAuthoredOverlays();
      });
      if (subBtn) {
        subBtn.style.display = 'none';
        subBtn.addEventListener('click', () => {
          if (!projectionUiState.active) return;
          authoredEditorState.subLayerMode = !authoredEditorState.subLayerMode;
          if (!authoredEditorState.subLayerMode) authoredEditorState.selectedSubId = null;
          subBtn.classList.toggle('active', authoredEditorState.subLayerMode);
          renderAuthoredOverlays();
          renderAuthoredInspector();
          updateEditorStatus(authoredEditorState.subLayerMode ? 'Sub-layer mode: drag nested elements.' : 'Sub-layer mode off.');
        });
      }
      varsBtn.addEventListener('click', () => {
        if (!projectionUiState.active) return;
        projectionUiState.varsPanelOpen = !varsPanel.classList.contains('open');
        varsPanel.classList.toggle('open', projectionUiState.varsPanelOpen);
        varsBtn.classList.toggle('active', projectionUiState.varsPanelOpen);
        if (projectionUiState.varsPanelOpen) renderVarEditor();
      });
      varsCloseBtn.addEventListener('click', () => {
        varsPanel.classList.remove('open');
        varsBtn.classList.remove('active');
        projectionUiState.varsPanelOpen = false;
      });
      layerPreviewBtn.addEventListener('click', () => {
        projectionUiState.showUnlayeredPreview = !projectionUiState.showUnlayeredPreview;
        updateLayerPreviewButton();
        render();
        updateEditorStatus(projectionUiState.showUnlayeredPreview
          ? 'Showing original UI positions (layer manager disabled).'
          : 'Showing layer-managed UI positions.');
      });
      transformExportBtn.addEventListener('click', () => {
        projectionUiState.showUnlayeredPreview = !projectionUiState.showUnlayeredPreview;
        render();
        copyTextToClipboard(buildRenderedTransformsExport());
        updateLayerPreviewButton();
        updateEditorStatus(projectionUiState.showUnlayeredPreview
          ? 'Switched to original preview and copied literal screen-space data.'
          : 'Switched to layered preview and copied literal screen-space data.');
      });
      transformExportBothBtn.addEventListener('click', async () => {
        try {
          const exportPayload = await buildRenderedTransformsDualModeExport();
          await copyTextToClipboard(exportPayload);
          updateLayerPreviewButton();
          updateEditorStatus('Captured original + layered previews and copied combined screen-space export.');
        } catch (error) {
          console.error('Dual-mode screen-space export failed.', normalizeErrorForLogging(error));
          updateLayerPreviewButton();
          updateEditorStatus('Dual-mode export failed. Check console for details.');
        }
      });
      exportBtn.addEventListener('click', () => {
        copyTextToClipboard(buildAuthoredLayoutExport());
        updateEditorStatus('Copied authored layout export JSON.');
      });
      document.addEventListener('pointerdown', (event) => {
        if (bindAuthoredDragAndResize(event)) return;
      });
      document.addEventListener('pointermove', (event) => {
        if (authoredEditorState.pointerDrag) {
          updateAuthoredPointer(event);
          return;
        }
        if (!projectionUiState.active) return;
        const el = event.target.closest('[data-proj-id]');
        if (el) {
          tip.textContent = el.getAttribute('data-proj-id');
          tip.style.display = 'block';
          tip.style.left = (event.clientX + 16) + 'px';
          tip.style.top = Math.max(8, event.clientY - 42) + 'px';
        } else tip.style.display = 'none';
      });
      document.addEventListener('pointerup', finishAuthoredPointer);
      document.addEventListener('pointercancel', finishAuthoredPointer);
      document.addEventListener('click', (event) => {
        if (!projectionUiState.active) return;
        if (event.target.closest('#projMapBtn,#projVarBtn,#projVarPanel,#projExportBtn,#projSubBtn,#projLayerPreviewBtn')) return;
        // Sub-layer mode: select sub overlays
        if (authoredEditorState.subLayerMode) {
          const subOverlay = event.target.closest('.authoredSubOverlay');
          if (subOverlay) {
            const projId = subOverlay.dataset.subProjId;
            if (projId && authoredEditorState.selectedSubId !== projId) {
              authoredEditorState.selectedSubId = projId;
              renderAuthoredOverlays();
              if (projectionUiState.varsPanelOpen) renderAuthoredInspector();
              updateEditorStatus(`Selected sub ${projId}.`);
            }
            event.preventDefault();
            event.stopImmediatePropagation();
            return;
          }
          return;
        }
        const el = event.target.closest('[data-proj-id]');
        if (!el) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const id = el.getAttribute('data-proj-id');
        projectionUiState.lastSelectedProjId = id;
        projectionUiState.lastSelectedSourceEl = event.target instanceof Element ? event.target : el;
        const authoredBoxId = AUTHORED_BOX_KEY_BY_PROJ_ID[id];
        if (getScratchbonesLayoutMode() === 'authored' && authoredBoxId) {
          selectAuthoredBox(authoredBoxId);
          updateEditorStatus(`Selected ${authoredBoxId}.`);
        }
        if (projectionUiState.varsPanelOpen) renderVarEditor();
      }, true);
      varsPanelBody.addEventListener('input', (event) => {
        const authoredSubImmuneToggle = event.target.getAttribute('data-authored-sub-immune');
        if (authoredSubImmuneToggle) {
          const projId = event.target.getAttribute('data-sub-proj-id');
          if (!projId || !window.__candleLight?.setProjectionImmune) return;
          window.__candleLight.setProjectionImmune(projId, Boolean(event.target.checked), 'sub');
          updateEditorStatus(`Sub candlelight immunity ${projId}=${event.target.checked ? 'on' : 'off'}.`);
          return;
        }
        const authoredSubField = event.target.getAttribute('data-authored-sub-field');
        if (authoredSubField) {
          const projId = event.target.getAttribute('data-sub-proj-id');
          if (!projId) return;
          const numeric = Number(event.target.value);
          if (!Number.isFinite(numeric)) return;
          const authored = getScratchbonesAuthoredConfig();
          const current = authored.subOffsets?.[projId] || { dx: 0, dy: 0 };
          const currentSize = authored.subSizes?.[projId] || getLiveSubElementSize(projId);
          if (authoredSubField === 'dx' || authoredSubField === 'dy') {
            updateAuthoredSubOffset(projId, authoredSubField === 'dx' ? numeric : current.dx, authoredSubField === 'dy' ? numeric : current.dy);
            updateEditorStatus(`Sub offset ${projId}.${authoredSubField}=${Math.round(numeric)}.`);
            return;
          }
          if (authoredSubField === 'width' || authoredSubField === 'height') {
            updateAuthoredSubSize(projId, authoredSubField === 'width' ? numeric : currentSize.width, authoredSubField === 'height' ? numeric : currentSize.height);
            updateEditorStatus(`Sub size ${projId}.${authoredSubField}=${Math.round(numeric)}.`);
          }
          return;
        }
        const authoredField = event.target.getAttribute('data-authored-field');
        if (authoredField && getSelectedAuthoredBox()) {
          const numeric = Number(event.target.value);
          if (!Number.isFinite(numeric)) return;
          updateAuthoredBox(getSelectedAuthoredBox(), { [authoredField]: numeric });
          updateEditorStatus(`Inspector updated ${getSelectedAuthoredBox()}.${authoredField}=${Math.round(numeric)}.`);
          return;
        }
        const input = event.target.closest('.projVarInput');
        if (!input) return;
        const varName = input.getAttribute('data-proj-var');
        if (!varName) return;
        const kind = input.getAttribute('data-proj-kind');
        let nextValue = String(input.value ?? '').trim();
        if (kind === 'range' || kind === 'number') {
          const suffix = cssVarSuffix(projectionUiState.editedVars.get(varName) ?? getComputedStyle(document.documentElement).getPropertyValue(varName));
          const numeric = Number.parseFloat(nextValue);
          if (!Number.isFinite(numeric)) return;
          nextValue = `${numeric.toFixed(2)}${suffix}`;
        }
        projectionUiState.editedVars.set(varName, nextValue);
        document.documentElement.style.setProperty(varName, nextValue);
      });
      varsCopyBtn.addEventListener('click', () => {
        if (getScratchbonesLayoutMode() === 'authored') {
          copyTextToClipboard(buildAuthoredLayoutExport());
          updateEditorStatus('Copied authored layout export JSON.');
        } else {
          const entries = [...projectionUiState.editedVars.entries()];
          const payload = entries.length ? [':root {', ...entries.map(([k,v]) => `  ${k}: ${v};`), '}'].join('\n') : '/* No projection variable overrides yet. */';
          copyTextToClipboard(payload);
          updateEditorStatus('Copied variable overrides.');
        }
      });
      document.addEventListener('keydown', (event) => {
        if (!projectionUiState.active || getScratchbonesLayoutMode() !== 'authored') return;
        if (authoredEditorState.subLayerMode) {
          const projId = authoredEditorState.selectedSubId;
          if (!projId) return;
          const delta = event.shiftKey ? 10 : 1;
          const authored = getScratchbonesAuthoredConfig();
          const cur = authored.subOffsets?.[projId] || { dx: 0, dy: 0 };
          let ndx = cur.dx, ndy = cur.dy;
          if (event.key === 'ArrowLeft') ndx -= delta;
          else if (event.key === 'ArrowRight') ndx += delta;
          else if (event.key === 'ArrowUp') ndy -= delta;
          else if (event.key === 'ArrowDown') ndy += delta;
          else return;
          event.preventDefault();
          updateAuthoredSubOffset(projId, ndx, ndy);
          if (projectionUiState.varsPanelOpen) renderAuthoredInspector();
          updateEditorStatus(`Nudged sub ${projId}: dx=${Math.round(ndx)} dy=${Math.round(ndy)}`);
          return;
        }
        const selected = getSelectedAuthoredBox();
        if (!selected) return;
        const delta = event.shiftKey ? 10 : 1;
        const patch = {};
        if (event.key === 'ArrowLeft') patch.x = getScratchbonesAuthoredConfig().boxes[selected].x - delta;
        else if (event.key === 'ArrowRight') patch.x = getScratchbonesAuthoredConfig().boxes[selected].x + delta;
        else if (event.key === 'ArrowUp') patch.y = getScratchbonesAuthoredConfig().boxes[selected].y - delta;
        else if (event.key === 'ArrowDown') patch.y = getScratchbonesAuthoredConfig().boxes[selected].y + delta;
        else return;
        event.preventDefault();
        updateAuthoredBox(selected, patch);
        updateEditorStatus(`Nudged ${selected} by ${delta}px.`);
      });
    })();
    let fitReflowHandle = null;
    function scheduleResponsiveFitPass() {
      if (fitReflowHandle) clearTimeout(fitReflowHandle);
      const fitDebounceMs = Math.max(0, Number(SCRATCHBONES_GAME.layout?.fitter?.reflowDebounceMs) || 120);
      fitReflowHandle = setTimeout(() => {
        fitReflowHandle = null;
        const app = document.getElementById('app');
        if (!app) return;
        applyLayoutContract(app);
        if (getScratchbonesLayoutMode() === 'authored') {
          applyAuthoredLayoutMode(app, getScratchbonesAuthoredConfig());
          renderAuthoredOverlays();
        } else {
          applyResponsiveFit(app);
        }
        updateTableCardAutoScale(app);
        syncClaimClusterCardSizeFromHand(app);
      }, fitDebounceMs);
    }
    window.addEventListener('resize', scheduleResponsiveFitPass, { passive: true });
    window.addEventListener('orientationchange', scheduleResponsiveFitPass, { passive: true });
    window.addEventListener('pointerdown', () => SCRATCHBONES_AUDIO.startPlaylist(), { once: true, passive: true });
    window.addEventListener('keydown', () => SCRATCHBONES_AUDIO.startPlaylist(), { once: true, passive: true });
    startGame();
    try {
      initCandleLight({ gameConfig: SCRATCHBONES_GAME, debugLog: traceCandlelight });
    } catch (error) {
      const initFailure = { error: String(error?.message || error) };
      traceEvent('error', 'candlelight.init-failed', initFailure);
      console.error('[scratchbones:candlelight.init-failed]', initFailure, error);
    }
