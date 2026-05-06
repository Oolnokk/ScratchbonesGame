const DEFAULT_AUTHORED_BOXES = {
  topbar: { x: -2, y: 11, width: 1123, height: 106 },
  sidebar: { x: 1354, y: 14, width: 251, height: 681 },
  humanSeat: { x: 1260, y: 701, width: 373, height: 187 },
  hand: { x: 109, y: 698, width: 853, height: 144 },
  log: { x: 20, y: 850, width: 1240, height: 40 },
  turnSpotlight: { x: 1122, y: 12, width: 230, height: 200 },
  claimCluster: { x: 187, y: 290, width: 1037, height: 275 },
  challengePrompt: { x: 960, y: 699, width: 280, height: 140 },
};

const DEFAULT_TRICK_GLYPH_SRC = {
  smuggle: './docs/assets/symbols/smuggleglyph.png',
  trap: './docs/assets/symbols/trapglyph.png',
  punish: './docs/assets/symbols/punishglyph.png',
};

const DEFAULT_CSS_ROOT_VARS = {
  '--bg': '#15110f',
  '--bg2': '#221917',
  '--panel': 'rgba(46, 34, 30, 0.95)',
  '--panel-soft': 'rgba(67, 49, 43, 0.9)',
  '--accent': '#c89952',
  '--accent-2': '#f2d08f',
  '--danger': '#c85a5a',
  '--ok': '#66b17c',
  '--text': '#f4e8d0',
  '--muted': '#cdbb9f',
  '--card': '#f8f1df',
  '--card-text': '#32231d',
  '--wild': '#f1d347',
  '--shadow': '0 10px 24px rgba(0,0,0,0.28)',
  '--radius': '18px',
  '--layout-viewport-width': '1920px',
  '--layout-viewport-height': '1080px',
  '--layout-hand-min-height': '160px',
  '--layout-hand-max-height': '360px',
  '--layout-sidebar-width': '280px',
  '--layout-app-gap': '8px',
  '--layout-app-padding': '8px',
  '--layout-seat-avatar-size': '132px',
  '--layout-human-seat-avatar-size': '204px',
  '--layout-cinematic-avatar-size': '132px',
  '--layout-hand-card-min-width': '74px',
  '--layout-hand-card-max-width': '104px',
  '--layout-hand-card-min-height': '146px',
  '--layout-hand-card-max-height': '186px',
  '--layout-hand-card-gap-min': '8px',
  '--layout-hand-card-gap-max': '12px',
  '--layout-event-log-max-height': '78px',
  '--layout-controls-padding-y': '12px',
  '--layout-controls-padding-x': '12px',
  '--layout-controls-gap': '10px',
  '--layout-hand-wrap-padding-y': '8px',
  '--layout-hand-wrap-padding-x': '12px',
  '--layout-hand-wrap-gap': '6px',
  '--layout-hand-card-shell-width-offset': '4px',
  '--layout-hand-card-label-inset-left': '2px',
  '--layout-hand-card-label-inset-bottom': '2px',
  '--layout-hand-panel-background': 'transparent',
  '--layout-hand-panel-border': '0',
  '--layout-hand-panel-outline': 'none',
  '--layout-hand-panel-shadow': 'none',
  '--layout-event-log-padding-y': '8px',
  '--layout-event-log-padding-x': '12px',
  '--layout-event-log-gap': '6px',
  '--layout-log-item-padding-y': '9px',
  '--layout-log-item-padding-x': '10px',
  '--layout-table-view-min-height': '260px',
  '--layout-table-view-max-height': '680px',
  '--layout-table-dominance-frac': '0.56',
  '--layout-turn-spotlight-avatar-size': '180px',
  '--layout-claim-cluster-center-x': '0.5',
  '--layout-claim-cluster-center-y': '0.54',
  '--layout-claim-cluster-width': '78',
  '--layout-claim-cluster-height': '48',
  '--layout-table-card-container-scale': '1.25',
  '--layout-table-card-content-scale': '0.8',
  '--layout-claim-avatar-size': '270px',
  '--layout-claim-avatar-zoom': '1.2',
  '--layout-claim-avatar-border-radius': '12px',
  '--layout-claim-avatar-border-color': 'rgba(242,208,143,0.28)',
  '--layout-claim-avatar-background': 'rgba(22,16,14,0.72)',
  '--layout-claim-title-offset-y': '-150px',
  '--layout-claim-bet-controls-offset-y': '150px',
  '--layout-claim-title-scale': '1.5',
  '--layout-betting-title-offset-y': '-80%',
  '--layout-betting-choice-offset-y': '115%',
  '--layout-betting-left-slot-offset-x': '260px',
  '--layout-betting-left-slot-offset-y': '150px',
  '--layout-betting-right-slot-offset-x': '-260px',
  '--layout-betting-right-slot-offset-y': '150px',
  '--layout-betting-coin-button-size': 'clamp(58px, 8.6vw, 86px)',
  '--layout-betting-contribution-coin-size': 'clamp(48px, 6.7vw, 72px)',
  '--layout-betting-tier-gap': 'clamp(10px, 2.2vw, 20px)',
  '--layout-turn-spotlight-offset-x': '10px',
  '--layout-turn-spotlight-offset-y': '10px',
  '--layout-cinematic-player-info-offset': '12px',
  '--layout-cinematic-player-info-font': '1.05rem',
  '--layout-cinematic-burst-font': '2rem',
  '--layout-cinematic-burst-duration': '2.1s',
  '--layout-liar-burst-font': '3.2rem',
  '--layout-liar-burst-duration': '3.2s',
  '--layout-liar-burst-end-y': '-180%',
  '--layout-flame-x': '50%',
  '--layout-flame-y': '14%',
  '--layout-flame-core-alpha': '0.4',
  '--layout-flame-mid-alpha': '0.27',
  '--layout-flame-far-alpha': '0.14',
  '--layout-flame-flicker-seconds': '2.9s',
  '--layout-flame-enabled': '1',
  '--layout-card-shadow-offset-x': '1.5px',
  '--layout-card-shadow-offset-y': '9px',
  '--layout-card-shadow-blur': '12px',
  '--layout-card-shadow-spread': '-2px',
  '--layout-card-shadow-alpha': '0.34',
  '--layout-card-contact-alpha': '0.2',
  '--layout-trick-info-glyph-size': '28px',
  '--layout-trick-info-gap': '6px',
  '--layout-trick-info-item-gap': '4px',
  '--layout-trick-info-margin-top': '6px',
  '--layout-trick-info-letter-spacing': '0.05em',
  '--layout-trick-info-max-width': '220px',
  '--layout-trick-symbol-filter': 'drop-shadow(0 1px 2px rgba(0,0,0,0.55))',
  '--layout-punish-button-card-width': '34px',
  '--layout-punish-button-card-height': '48px',
  '--layout-cinematic-punish-button-card-width': '96px',
  '--layout-cinematic-punish-button-card-height': '136px',
};

const DEFAULT_PORTRAIT_RANDOMIZATION_CONFIG = {
  minimumNpcClothingArticles: 1,
  clothingSlots: ['hat', 'hood', 'torsoCosmetic', 'armCosmetic'],
  clothingRepairSlotPreference: ['torsoCosmetic', 'armCosmetic', 'hat', 'hood'],
  clothingOptionPoolsBySlot: {
    hat: 'hatOptions',
    hood: 'hoodOptions',
    torsoCosmetic: 'torsoPortraitOptions',
    armCosmetic: 'armPortraitOptions',
  },
};

function normalizeStringArray(value, fallback) {
  const source = Array.isArray(value) ? value : fallback;
  return source.map((item) => String(item || '').trim()).filter(Boolean);
}

function normalizeStringMap(value, fallback) {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? { ...fallback, ...value }
    : fallback;
  return Object.fromEntries(Object.entries(source)
    .map(([key, mapValue]) => [String(key || '').trim(), String(mapValue || '').trim()])
    .filter(([key, mapValue]) => key && mapValue));
}

const DEFAULT_TUTORIAL_CONFIG = {
  ringPadPx: 9,
  minVisibleAreaRatio: 0.55,
  panelEdgePaddingPx: 20,
  steps: {
    welcome: {
      title: 'Welcome to Scratchbones!',
      text: 'This walkthrough will introduce you to the board before your first move. Use the arrows below to step back and forward through each element.',
    },
    hand: {
      title: 'Your Hand',
      text: '{summary} Tap a card to select it — you can select multiple — then choose a declared rank and press Play.',
    },
    'trick-bones': {
      title: 'Trick Bone Cards',
      text: 'Glowing cards are Trick Bones — special cards with unique powers.\n\nSmuggle Bone: when your claim passes without challenge, every non-Smuggle claimed card leaves the table and goes into another player\'s hand; human Smuggle users choose the target seat.\nTrap Bone: if your challenged Trap claim is truthful and the challenge fails, transfer up to the claim size from your hand to the challenger; human defenders choose cards with the Trap selection.\nPunish Bone: during challenge betting, the challenger may arm Punish before opening, raising, or calling. Arming consumes one Punish card; if the challenge succeeds, the challenger gives claim-size cards to the challenged player.',
    },
    claim: {
      title: 'The Claim Display',
      text: '{summary}',
    },
    chips: {
      title: 'Chips & The Pot',
      text: 'Chips are how you win. Everyone antes up at the start of each round, growing the pot. Winning a challenge earns you chips from your opponent — but calling a wrong bluff costs you.',
    },
    opponents: {
      title: 'Your Opponents',
      text: 'Your AI opponents sit in the sidebar. Watch their chip counts and hand sizes. If you believe the last player was bluffing their declared rank, challenge them before you pass your turn!',
    },
    controls: {
      title: 'Your Actions',
      text: 'Select cards from your hand, choose a declared rank, and press Play. You can Concede (costs 1 chip) to skip without playing. During a challenge window, press Challenge if you think the last claim was a bluff, or Let Pass to accept it.',
    },
    log: {
      title: 'Event Log',
      text: 'Recent game events appear here. Use it to track what everyone has been playing and spot bluffing patterns over the course of a match.',
    },
    ready: {
      title: "You're Ready!",
      text: 'You know the board — the tutorial pauses are now off. Good luck, and may the bones favour you.',
    },
  },
};

function normalizeTutorialStepCopy(rawStep, defaultStep) {
  const raw = rawStep && typeof rawStep === 'object' && !Array.isArray(rawStep) ? rawStep : {};
  return {
    title: typeof raw.title === 'string' ? raw.title : defaultStep.title,
    text: typeof raw.text === 'string' ? raw.text : defaultStep.text,
  };
}

function normalizeTutorialSteps(rawSteps) {
  const raw = rawSteps && typeof rawSteps === 'object' && !Array.isArray(rawSteps) ? rawSteps : {};
  return Object.fromEntries(Object.entries(DEFAULT_TUTORIAL_CONFIG.steps).map(([stepId, defaultStep]) => [
    stepId,
    normalizeTutorialStepCopy(raw[stepId], defaultStep),
  ]));
}

function finiteNumberOrDefault(value, fallback) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
}

const DEFAULT_LAYER_MANAGER_CONFIG = {
  enabled: true,
  hostZIndex: 45,
  defaultPreserveSpace: true,
  normalizePromotedElementBox: false,
  normalizeBoxGuard: {
    allowlistSelectors: [],
    denylistSelectors: [],
    marginReset: {
      allowlistSelectors: [],
      denylistSelectors: [],
    },
    fillSize: {
      allowlistSelectors: [],
      denylistSelectors: [],
    },
  },
  preservePromotionTransformSelectors: [
    '.seatAvatarBox',
    '.turnSpotlightAvatar',
    '.cin-avatar',
    '.claimClusterTextAnchor',
    '.claimAvatarNameTag',
    '.claimAvatarCinRole',
    '.claimAvatarCinName',
    '.claimAvatarCinTags',
  ],
  disablePreservePromotionTransformSelectors: [],
  typographyBaselineRootSelector: '#app',
  typographyBaselineFields: ['font-size', 'line-height', 'font-family', 'letter-spacing', 'font-weight'],
  placementMode: 'screen-space',
  layerOrder: ['above-lighting-shell', 'above-lighting-content'],
  assignments: [
    {
      id: 'ui-text-over-lighting',
      layer: 'above-lighting-content',
      selectors: [
        '.seatName',
        '.seatMeta',
        '.seatChipBadge',
        '.seatChipBadgeIcon',
        '.seatStatus',
        '.turnSpotlightNameBar',
        '.cin-name',
        '.cin-action-burst',
        '.seatHandPreview',
        '.seatHandCard',
        '.seatHandCard img',
      ],
      preserveSpace: true,
    },
    {
      id: 'ui-avatars-over-lighting',
      layer: 'above-lighting-content',
      selectors: [
        '.seatAvatarBox',
        '.turnSpotlightAvatar',
        '.cin-avatar',
        '.actorAvatarFloat',
        '.reactorAvatarFloat',
      ],
      preserveSpace: true,
      keepOriginal: true,
      promotedOpacity: 0.72,
    },
    {
      id: 'ui-shell-over-lighting',
      layer: 'above-lighting-shell',
      selectors: [
        '#aiSidebar',
        '.humanSeatZone',
        '.topbar',
        '.tableViewHeader',
        '.seatInfo',
        '.seatSeed',
        '.seatTags',
        '.humanSeatChipBadge',
        '.claimRankBox',
        '.claimTimesBoxLeft',
        '.claimCountBoxLeft',
        '.claimTimesBoxRight',
        '.claimCountBoxRight',
        '.claimClusterTextAnchor',
        '.controls',
        '.challengePromptPane',
        '.eventLog',
        '.stakeVisualPanel',
        '.challengeBar',
        '.bettingStatusAnchor',
        '.leftContributionAnchor',
        '.rightContributionAnchor',
        '.bettingChoiceAnchor',
      ],
      preserveSpace: true,
    },
  ],
};


const DEFAULT_TRICK_BONE_DEFINITIONS = {
  smuggle: { id: 'smuggle', label: 'Smuggle Bone', description: 'When your Smuggle claim passes without challenge, its non-Smuggle claimed cards leave the table and go into another player\'s hand; human Smuggle users choose the target seat.', wild: false },
  trap: { id: 'trap', label: 'Trap Bone', description: 'If your challenged Trap claim is truthful and the challenge fails, transfer up to the claim size from your hand to the challenger; human defenders choose cards with state.trapSelection.', wild: true },
  punish: { id: 'punish', label: 'Punish Bone', description: 'During challenge betting, the challenger may arm Punish before opening, raising, or calling. Arming consumes one Punish card; if the challenge succeeds, the challenger gives claim-size cards to the challenged player.', wild: false },
};

function repeatIdsFromCounts(counts = {}) {
  const result = [];
  for (const [id, count] of Object.entries(counts || {})) {
    const safeCount = Math.max(0, Math.floor(Number(count) || 0));
    for (let i = 0; i < safeCount; i += 1) result.push(id);
  }
  return result;
}

function normalizeTrickBoneDefinitions(rawDefinitions = {}) {
  const merged = { ...DEFAULT_TRICK_BONE_DEFINITIONS, ...(rawDefinitions || {}) };
  const definitions = {};
  for (const [rawId, rawDefinition] of Object.entries(merged)) {
    const id = String(rawDefinition?.id || rawId || '').trim();
    if (!id) continue;
    definitions[id] = {
      id,
      label: String(rawDefinition?.label || id),
      description: String(rawDefinition?.description || ''),
      wild: rawDefinition?.wild === true,
    };
  }
  return definitions;
}

function normalizeTrickIdArray(rawIds, { definitions, fallback = [], size = null, allowShort = false } = {}) {
  const validIds = new Set(Object.keys(definitions || {}));
  const source = Array.isArray(rawIds) ? rawIds : fallback;
  const result = [];
  for (const rawId of source || []) {
    const id = String(rawId || '').trim();
    if (validIds.has(id)) result.push(id);
  }
  if (!allowShort && size != null && result.length < size) {
    const fillIds = (fallback || []).map(rawId => String(rawId || '').trim()).filter(id => validIds.has(id));
    while (fillIds.length && result.length < size) {
      for (const id of fillIds) {
        if (result.length >= size) break;
        result.push(id);
      }
    }
  }
  return size == null ? result : result.slice(0, size);
}

function normalizeNpcTrickArchetypes(rawArchetypes, definitions) {
  const validIds = new Set(Object.keys(definitions || {}));
  const fallbackWeights = Object.fromEntries([...validIds].map(id => [id, 1]));
  const source = Array.isArray(rawArchetypes) && rawArchetypes.length
    ? rawArchetypes
    : [{ id: 'balanced', weight: 1, loadoutWeights: fallbackWeights }];
  return source.map((raw, index) => {
    const loadoutWeights = {};
    for (const [rawId, rawWeight] of Object.entries(raw?.loadoutWeights || fallbackWeights)) {
      const id = String(rawId || '').trim();
      const weight = Math.max(0, Number(rawWeight) || 0);
      if (validIds.has(id) && weight > 0) loadoutWeights[id] = weight;
    }
    if (!Object.keys(loadoutWeights).length) Object.assign(loadoutWeights, fallbackWeights);
    return {
      id: String(raw?.id || `archetype-${index + 1}`),
      weight: Math.max(0, Number(raw?.weight) || 0),
      loadoutWeights,
    };
  }).filter(archetype => archetype.weight > 0);
}

export function validateScratchbonesGameConfig(rootConfig, { reportError, debugEnabled = true } = {}) {
  const hasGameConfig = rootConfig && typeof rootConfig.game === 'object' && rootConfig.game !== null;
  if (hasGameConfig) return true;
  const fallback = (message) => `[scratchbones config] ${message}`;
  const message = (reportError || fallback)('Missing required window.SCRATCHBONES_CONFIG.game object from docs/config/scratchbones-config.js.');
  if (debugEnabled) throw new Error(message);
  return false;
}

export function normalizeScratchbonesGameConfig(rawGameConfig = {}) {
  const trickBoneDefinitions = normalizeTrickBoneDefinitions(rawGameConfig.trickBones?.definitions);
  const trickBoneDefinitionIds = Object.keys(trickBoneDefinitions);
  const migratedDefaultLoadout = repeatIdsFromCounts(rawGameConfig.deck?.trickCardCounts);
  const trickBoneLoadoutSize = Math.max(1, Number(rawGameConfig.trickBones?.loadoutSize) || migratedDefaultLoadout.length || 6);
  const defaultTrickLoadoutFallback = migratedDefaultLoadout.length ? migratedDefaultLoadout : trickBoneDefinitionIds;
  const defaultTrickLoadout = normalizeTrickIdArray(rawGameConfig.trickBones?.defaultLoadout, {
    definitions: trickBoneDefinitions,
    fallback: defaultTrickLoadoutFallback,
    size: trickBoneLoadoutSize,
  });
  const defaultUnlockedTrickBones = normalizeTrickIdArray(rawGameConfig.trickBones?.defaultUnlocked, {
    definitions: trickBoneDefinitions,
    fallback: trickBoneDefinitionIds,
    allowShort: true,
  });
  return {
    debug: {
      enabled: rawGameConfig.debug?.enabled !== false,
      includeConsoleDebug: rawGameConfig.debug?.includeConsoleDebug !== false,
      eventLogLimit: Math.max(50, Number(rawGameConfig.debug?.eventLogLimit) || 300),
      trace: {
        gameplayFlow: rawGameConfig.debug?.trace?.gameplayFlow !== false,
        layerPromotion: rawGameConfig.debug?.trace?.layerPromotion !== false,
        audio: rawGameConfig.debug?.trace?.audio !== false,
        candlelight: rawGameConfig.debug?.trace?.candlelight !== false,
        actions: rawGameConfig.debug?.trace?.actions !== false,
      },
    },
    deck: {
      rankCount: rawGameConfig.deck?.rankCount ?? 10,
      copiesPerRank: rawGameConfig.deck?.copiesPerRank ?? 4,
      handSize: rawGameConfig.deck?.handSize ?? 10,
      wildCount: rawGameConfig.deck?.wildCount ?? 10,
      playerCount: rawGameConfig.deck?.playerCount ?? 4,
      humanNames: rawGameConfig.deck?.humanNames ?? ['You'],
    },
    tutorial: {
      ringPadPx: Math.max(0, finiteNumberOrDefault(rawGameConfig.tutorial?.ringPadPx, DEFAULT_TUTORIAL_CONFIG.ringPadPx)),
      minVisibleAreaRatio: Math.min(1, Math.max(0, finiteNumberOrDefault(rawGameConfig.tutorial?.minVisibleAreaRatio, DEFAULT_TUTORIAL_CONFIG.minVisibleAreaRatio))),
      panelEdgePaddingPx: Math.max(0, finiteNumberOrDefault(rawGameConfig.tutorial?.panelEdgePaddingPx, DEFAULT_TUTORIAL_CONFIG.panelEdgePaddingPx)),
      steps: normalizeTutorialSteps(rawGameConfig.tutorial?.steps),
    },
    trickBones: {
      defaultUnlocked: defaultUnlockedTrickBones,
      defaultLoadout: defaultTrickLoadout,
      loadoutSize: trickBoneLoadoutSize,
      definitions: trickBoneDefinitions,
      definitionIds: trickBoneDefinitionIds,
      npcArchetypes: normalizeNpcTrickArchetypes(rawGameConfig.trickBones?.npcArchetypes, trickBoneDefinitions),
      migratedDeckTrickCardCounts: rawGameConfig.deck?.trickCardCounts || null,
    },
    nameGeneration: {
      defaultCultureId: rawGameConfig.nameGeneration?.defaultCultureId ?? 'mao_ao',
      seedPrefix: rawGameConfig.nameGeneration?.seedPrefix ?? 'madiao-player',
      aiCultureSelection: {
        usePortraitSpeciesCulture: rawGameConfig.nameGeneration?.aiCultureSelection?.usePortraitSpeciesCulture ?? true,
        fallbackCultureId: rawGameConfig.nameGeneration?.aiCultureSelection?.fallbackCultureId ?? (rawGameConfig.nameGeneration?.defaultCultureId ?? 'mao_ao'),
        speciesToCultureId: rawGameConfig.nameGeneration?.aiCultureSelection?.speciesToCultureId ?? { mao_ao: 'mao_ao', 'mao-ao': 'mao_ao', kenkari: 'kenkari' },
      },
      cultures: rawGameConfig.nameGeneration?.cultures ?? {},
    },
    chips: {
      startingChips: rawGameConfig.chips?.starting ?? 30,
      challengeBaseTransfer: rawGameConfig.chips?.challengeBaseTransfer ?? 1,
      concedeRoundChipLoss: rawGameConfig.chips?.concedeRoundChipLoss ?? 1,
      walletDisplay: {
        tiers: rawGameConfig.chips?.walletDisplay?.tiers ?? rawGameConfig.chips?.challengeStake?.tiers ?? [{ id: 'sun', value: 1 }, { id: 'tinmoon', value: 5 }, { id: 'eclipse', value: 20 }],
        maxIconsPerSeat: Math.max(1, Number(rawGameConfig.chips?.walletDisplay?.maxIconsPerSeat) || 18),
        seatChipBadge: {
          coinTierId: String(rawGameConfig.chips?.walletDisplay?.seatChipBadge?.coinTierId || 'tinmoon'),
          iconSizePx: Math.max(12, Number(rawGameConfig.chips?.walletDisplay?.seatChipBadge?.iconSizePx) || 22),
          gapPx: Math.max(0, Number(rawGameConfig.chips?.walletDisplay?.seatChipBadge?.gapPx) || 6),
          fontSizeRem: Math.max(0.5, Number(rawGameConfig.chips?.walletDisplay?.seatChipBadge?.fontSizeRem) || 0.82),
          color: String(rawGameConfig.chips?.walletDisplay?.seatChipBadge?.color || 'var(--text)'),
        },
      },
      poolDisplay: {
        maxIcons: Math.max(1, Number(rawGameConfig.chips?.poolDisplay?.maxIcons) || 28),
        widthPx: Math.max(100, Number(rawGameConfig.chips?.poolDisplay?.widthPx) || 220),
        heightPx: Math.max(60, Number(rawGameConfig.chips?.poolDisplay?.heightPx) || 96),
        coinSizePx: Math.max(16, Number(rawGameConfig.chips?.poolDisplay?.coinSizePx) || 30),
        spreadXPx: Math.max(10, Number(rawGameConfig.chips?.poolDisplay?.spreadXPx) || 84),
        spreadYPx: Math.max(8, Number(rawGameConfig.chips?.poolDisplay?.spreadYPx) || 28),
        offsetXPx: Number(rawGameConfig.chips?.poolDisplay?.offsetXPx) || 0,
        offsetYPx: Number(rawGameConfig.chips?.poolDisplay?.offsetYPx) || 2,
        totalLabel: {
          rightPx: Math.max(0, Number(rawGameConfig.chips?.poolDisplay?.totalLabel?.rightPx) || 8),
          bottomPx: Math.max(0, Number(rawGameConfig.chips?.poolDisplay?.totalLabel?.bottomPx) || 4),
          fontSizePx: Math.max(10, Number(rawGameConfig.chips?.poolDisplay?.totalLabel?.fontSizePx) || 24),
          lineHeight: Math.max(0.5, Number(rawGameConfig.chips?.poolDisplay?.totalLabel?.lineHeight) || 1),
          color: String(rawGameConfig.chips?.poolDisplay?.totalLabel?.color || '#ffffff'),
        },
      },
      challengeStakeTiers: rawGameConfig.chips?.challengeStake?.tiers ?? [{ id: 'sun', value: 1 }, { id: 'tinmoon', value: 5 }, { id: 'eclipse', value: 20 }],
      challengeStakeAnimation: {
        openMs: rawGameConfig.chips?.challengeStake?.animation?.openMs ?? 280,
        callMs: rawGameConfig.chips?.challengeStake?.animation?.callMs ?? 280,
        raiseOutMs: rawGameConfig.chips?.challengeStake?.animation?.raiseOutMs ?? 190,
        raiseInMs: rawGameConfig.chips?.challengeStake?.animation?.raiseInMs ?? 300,
      },
      transferAnimation: {
        clusterMoveMs: Math.max(120, Number(rawGameConfig.chips?.transferAnimation?.clusterMoveMs) || 320),
        anteMs: Math.max(120, Number(rawGameConfig.chips?.transferAnimation?.anteMs) || 300),
        clearPayoutMs: Math.max(120, Number(rawGameConfig.chips?.transferAnimation?.clearPayoutMs) || 360),
        multiAnteSettleDelayMs: Math.max(0, Number(rawGameConfig.chips?.transferAnimation?.multiAnteSettleDelayMs) || 120),
        easing: String(rawGameConfig.chips?.transferAnimation?.easing || 'ease'),
        coinSizePx: Math.max(16, Number(rawGameConfig.chips?.transferAnimation?.coinSizePx) || 24),
        maxIconsPerCluster: Math.max(1, Number(rawGameConfig.chips?.transferAnimation?.maxIconsPerCluster) || 10),
      },
      cards: {
        transferAnimation: {
          baseMs: Math.max(120, Number(rawGameConfig.chips?.cards?.transferAnimation?.baseMs) || Number(rawGameConfig.chips?.cardTransferAnimation?.durationMs) || 360),
          staggerMs: Math.max(0, Number(rawGameConfig.chips?.cards?.transferAnimation?.staggerMs) || Number(rawGameConfig.chips?.cardTransferAnimation?.staggerMs) || 40),
          aiToAiArcLiftPx: Math.max(0, Number(rawGameConfig.chips?.cards?.transferAnimation?.aiToAiArcLiftPx) || 48),
          aiToAiArcPerPx: Math.max(0, Number(rawGameConfig.chips?.cards?.transferAnimation?.aiToAiArcPerPx) || 0.12),
          deckDealMs: Math.max(80, Number(rawGameConfig.chips?.cards?.transferAnimation?.deckDealMs) || Number(rawGameConfig.chips?.dealAnimation?.perCardFlightMs) || 260),
          deckDealStaggerMs: Math.max(0, Number.isFinite(Number(rawGameConfig.chips?.cards?.transferAnimation?.deckDealStaggerMs))
            ? Number(rawGameConfig.chips?.cards?.transferAnimation?.deckDealStaggerMs)
            : Number.isFinite(Number(rawGameConfig.chips?.dealAnimation?.perCardStaggerMs))
              ? Number(rawGameConfig.chips?.dealAnimation?.perCardStaggerMs)
              : 50),
          deckDealInterPlayerDelayMs: Math.max(0, Number(rawGameConfig.chips?.cards?.transferAnimation?.deckDealInterPlayerDelayMs) || Number(rawGameConfig.chips?.dealAnimation?.interPlayerDelayMs) || 0),
          transferEasing: String(rawGameConfig.chips?.cards?.transferAnimation?.transferEasing || rawGameConfig.chips?.cardTransferAnimation?.easing || 'cubic-bezier(0.22, 0.61, 0.36, 1)'),
          deckDealEasing: String(rawGameConfig.chips?.cards?.transferAnimation?.deckDealEasing || 'cubic-bezier(0.4,0,0.2,1)'),
          dealSpeedMultiplier: Math.max(0.1, Number(rawGameConfig.chips?.cards?.transferAnimation?.dealSpeedMultiplier) || 1),
        },
      },
      clearBonusBase: rawGameConfig.chips?.clearReward?.base ?? 1,
      clearBonusIncrement: rawGameConfig.chips?.clearReward?.increment ?? 1,
      anteStart: rawGameConfig.chips?.ante?.start ?? 1,
      anteIncrement: rawGameConfig.chips?.ante?.increment ?? 1,
    },
    timers: {
      challengeTimerSecs: rawGameConfig.timers?.challengeSeconds ?? 3,
      challengeIntroMs: rawGameConfig.timers?.challengeIntroMs ?? 2200,
      aiThinkMs: rawGameConfig.timers?.aiThinkMs ?? 650,
      aiDecisionDelays: {
        turnMinMs: rawGameConfig.timers?.aiDecisionDelays?.turnMinMs ?? 420,
        turnMaxMs: rawGameConfig.timers?.aiDecisionDelays?.turnMaxMs ?? 1300,
        challengeMinMs: rawGameConfig.timers?.aiDecisionDelays?.challengeMinMs ?? 360,
        challengeMaxMs: rawGameConfig.timers?.aiDecisionDelays?.challengeMaxMs ?? 2200,
        bettingMinMs: rawGameConfig.timers?.aiDecisionDelays?.bettingMinMs ?? 200,
        bettingMaxMs: rawGameConfig.timers?.aiDecisionDelays?.bettingMaxMs ?? 650,
        challengeStaggerMs: rawGameConfig.timers?.aiDecisionDelays?.challengeStaggerMs ?? 220,
      },
    },
    portrait: {
      ...(rawGameConfig.portrait || {}),
      randomization: (() => {
        const rawRandomization = rawGameConfig.portrait?.randomization || {};
        const minimumNpcClothingArticles = Number(rawRandomization.minimumNpcClothingArticles);
        return {
          ...rawRandomization,
          minimumNpcClothingArticles: Number.isFinite(minimumNpcClothingArticles)
            ? Math.max(0, Math.floor(minimumNpcClothingArticles))
            : DEFAULT_PORTRAIT_RANDOMIZATION_CONFIG.minimumNpcClothingArticles,
          clothingSlots: normalizeStringArray(rawRandomization.clothingSlots, DEFAULT_PORTRAIT_RANDOMIZATION_CONFIG.clothingSlots),
          clothingRepairSlotPreference: normalizeStringArray(rawRandomization.clothingRepairSlotPreference, DEFAULT_PORTRAIT_RANDOMIZATION_CONFIG.clothingRepairSlotPreference),
          clothingOptionPoolsBySlot: normalizeStringMap(rawRandomization.clothingOptionPoolsBySlot, DEFAULT_PORTRAIT_RANDOMIZATION_CONFIG.clothingOptionPoolsBySlot),
        };
      })(),
    },
    ai: {
      challengeThreshold: rawGameConfig.ai?.challengeThreshold ?? 0.52,
      challengeRandomNudgeMax: rawGameConfig.ai?.challengeRandomNudgeMax ?? 0.16,
      bettingConfidenceSuspicionWeight: rawGameConfig.ai?.bettingConfidenceSuspicionWeight ?? 0.55,
    },
    layout: {
      ...(rawGameConfig.layout || {}),
      animation: {
        baseDurationMs: Math.max(40, Number(rawGameConfig.layout?.animation?.baseDurationMs) || 320),
        fadeInSpeed: Math.max(0.1, Number(rawGameConfig.layout?.animation?.fadeInSpeed) || 1.8),
        fadeOutSpeed: Math.max(0.1, Number(rawGameConfig.layout?.animation?.fadeOutSpeed) || 1.8),
        cardCloneLayering: {
          belowLightingZIndex: Number.isFinite(Number(rawGameConfig.layout?.animation?.cardCloneLayering?.belowLightingZIndex))
            ? Number(rawGameConfig.layout?.animation?.cardCloneLayering?.belowLightingZIndex)
            : 44,
          aboveLightingZIndex: Number.isFinite(Number(rawGameConfig.layout?.animation?.cardCloneLayering?.aboveLightingZIndex))
            ? Number(rawGameConfig.layout?.animation?.cardCloneLayering?.aboveLightingZIndex)
            : 9999,
          sidebarBoundarySelector: String(rawGameConfig.layout?.animation?.cardCloneLayering?.sidebarBoundarySelector || '#aiSidebar'),
        },
      },
      mode: String(rawGameConfig.layout?.mode || 'responsive').toLowerCase(),
      diagnostics: {
        renderedScreenSpaceParity: (() => {
          const rawParity = rawGameConfig.layout?.diagnostics?.renderedScreenSpaceParity || {};
          const normalizeThreshold = (value, fallback) => {
            const numeric = Number(value);
            return Number.isFinite(numeric) ? Math.max(0, numeric) : fallback;
          };
          const rawTransformPolicy = String(rawParity.transformMismatchPolicy || "warn").toLowerCase();
          const transformMismatchPolicy = ["ignore", "warn", "fail"].includes(rawTransformPolicy)
            ? rawTransformPolicy
            : "warn";
          return {
            maxAbsDx: normalizeThreshold(rawParity.maxAbsDx, 1),
            maxAbsDy: normalizeThreshold(rawParity.maxAbsDy, 1),
            maxAbsDw: normalizeThreshold(rawParity.maxAbsDw, 1),
            maxAbsDh: normalizeThreshold(rawParity.maxAbsDh, 1),
            maxElementMagnitude: normalizeThreshold(rawParity.maxElementMagnitude, 3),
            maxGroupAverageMagnitude: normalizeThreshold(rawParity.maxGroupAverageMagnitude, 2),
            maxGroupMagnitude: normalizeThreshold(rawParity.maxGroupMagnitude, 5),
            maxSidebarSeatSpacingInflation: normalizeThreshold(rawParity.maxSidebarSeatSpacingInflation, 1.2),
            requireTransformMatchFor: Array.isArray(rawParity.requireTransformMatchFor)
              ? rawParity.requireTransformMatchFor.map((group) => String(group || '').trim().toLowerCase()).filter(Boolean)
              : ['avatars', 'claim avatars'],
            requireTransformMatchForSelectors: Array.isArray(rawParity.requireTransformMatchForSelectors)
              ? rawParity.requireTransformMatchForSelectors.map((selector) => String(selector || '').trim().toLowerCase()).filter(Boolean)
              : ['avatar-*', 'claim-avatar-*', 'claim-text-*'],
            transformMismatchPolicy,
          };
        })(),
      },
      cinematic: {
        enableLegacyBoxedBranch: rawGameConfig.layout?.cinematic?.enableLegacyBoxedBranch === true,
      },
      authored: {
        enabled: rawGameConfig.layout?.authored?.enabled !== false,
        designWidthPx: Number(rawGameConfig.layout?.authored?.designWidthPx) || 1600,
        designHeightPx: Number(rawGameConfig.layout?.authored?.designHeightPx) || 900,
        scaleMode: String(rawGameConfig.layout?.authored?.scaleMode || 'contain').toLowerCase(),
        boxes: rawGameConfig.layout?.authored?.boxes || DEFAULT_AUTHORED_BOXES,
        subOffsets: rawGameConfig.layout?.authored?.subOffsets || {},
        subSizes: rawGameConfig.layout?.authored?.subSizes || {},
      },
      lighting: {
        ...(rawGameConfig.layout?.lighting || {}),
        candlelight: { ...(rawGameConfig.layout?.lighting?.candlelight || {}) },
      },
      layerManager: (() => {
        const rawLayerManager = rawGameConfig.layout?.layerManager || {};
        return {
          ...DEFAULT_LAYER_MANAGER_CONFIG,
          ...rawLayerManager,
          placementMode: 'screen-space',
        };
      })(),
    },
    uiText: {
      initialBanner: rawGameConfig.uiText?.initialBanner ?? 'Open a round by selecting one or more cards, then declare a number.',
      yourLeadBanner: rawGameConfig.uiText?.yourLeadBanner ?? 'Your lead. Select cards and declare any number.',
      pickCardWarning: rawGameConfig.uiText?.pickCardWarning ?? 'Pick at least one card before playing.',
      challengeTimerLabel: rawGameConfig.uiText?.challengeTimerLabel ?? 'Auto: let it stand',
      challengePromptTemplate: rawGameConfig.uiText?.challengePromptTemplate ?? '{seat} declared {count} × {rank}. Challenge before the timer runs out, or let it stand.',
      challengeBurstText: rawGameConfig.uiText?.challengeBurstText ?? 'LIAR!!!',
      letStandButton: rawGameConfig.uiText?.letStandButton ?? 'Let it stand',
    },
    assets: {
      preloadCards: rawGameConfig.assets?.cards?.preload?.enabled !== false,
      cardHudBasePath: rawGameConfig.assets?.cards?.hudBasePath ?? './docs/assets/hud/',
      wildCardSrc: rawGameConfig.assets?.cards?.wild?.src ?? '2DScratchBoneWild.png',
      wildCardFallbackSrc: rawGameConfig.assets?.cards?.wild?.fallbackSrc ?? '2DScratchBoneWild.png',
      flippedCardSrc: rawGameConfig.assets?.cards?.flipped?.src ?? '2DScratchboneFlipped.png',
      flippedCardFallbackSrc: rawGameConfig.assets?.cards?.flipped?.fallbackSrc ?? '2DScratchBoneFlipped.png',
      rankCardTemplateSrc: rawGameConfig.assets?.cards?.rankTemplate?.src ?? '2DScratchbone{rank}.png',
      rankCardTemplateFallbackSrc: rawGameConfig.assets?.cards?.rankTemplate?.fallbackSrc ?? '2DScratchbones{rank}.png',
      trickCardSrc: {
        smuggle: rawGameConfig.assets?.cards?.trick?.smuggle?.src ?? '2DScratchboneSmuggle.png',
        trap: rawGameConfig.assets?.cards?.trick?.trap?.src ?? '2DScratchboneTrap.png',
        punish: rawGameConfig.assets?.cards?.trick?.punish?.src ?? '2DScratchbonePunish.png',
      },
      trickCardFallbackSrc: {
        smuggle: rawGameConfig.assets?.cards?.trick?.smuggle?.fallbackSrc ?? '2DScratchboneSmuggle.png',
        trap: rawGameConfig.assets?.cards?.trick?.trap?.fallbackSrc ?? '2DScratchboneTrap.png',
        punish: rawGameConfig.assets?.cards?.trick?.punish?.fallbackSrc ?? '2DScratchbonePunish.png',
      },
      claimRankGlyphTemplateSrc: rawGameConfig.assets?.symbols?.claimRankGlyphTemplateSrc ?? './docs/assets/symbols/boneglyph{rank}.png',
      claimMultiplyGlyphSrc: rawGameConfig.assets?.symbols?.claimMultiplyGlyphSrc ?? './docs/assets/symbols/multglyph.png',
      trickGlyphSrc: normalizeStringMap(rawGameConfig.assets?.symbols?.trickGlyphSrc, DEFAULT_TRICK_GLYPH_SRC),
      cinematicTokenIconSrc: rawGameConfig.assets?.hud?.cinematicTokenIconSrc ?? './docs/assets/hud/coin_tinmoon.png',
      stakeTierCoinSrc: rawGameConfig.assets?.hud?.stakeTierCoinSrc ?? { sun: './docs/assets/hud/coin_sun.png', tinmoon: './docs/assets/hud/coin_tinmoon.png', eclipse: './docs/assets/hud/coin_eclipse.png' },
      claimClusterFontFamily: rawGameConfig.assets?.hud?.claimClusterFontFamily ?? '"KhymeryyanRomanLetters+Numbers", serif',
      claimClusterFontSrc: rawGameConfig.assets?.hud?.claimClusterFontSrc ?? './docs/assets/hud/KhymeryyanRomanLetters+Numbers.otf.ttf',
      claimMultiplyGlyphScale: Number(rawGameConfig.assets?.hud?.claimMultiplyGlyphScale ?? 0.5),
      claimMultiplyGlyphInvert: rawGameConfig.assets?.hud?.claimMultiplyGlyphInvert ?? true,
      audio: {
        enabled: rawGameConfig.assets?.audio?.enabled !== false,
        sfxVolume: rawGameConfig.assets?.audio?.sfxVolume ?? 0.92,
        bgmVolume: rawGameConfig.assets?.audio?.bgmVolume ?? 0.48,
        musicFadeMs: rawGameConfig.assets?.audio?.musicFadeMs ?? 280,
        movement: rawGameConfig.assets?.audio?.movement || {},
        challenge: rawGameConfig.assets?.audio?.challenge || {},
        payoutBurst: {
          enabled: rawGameConfig.assets?.audio?.payoutBurst?.enabled !== false,
          jingles: Array.isArray(rawGameConfig.assets?.audio?.payoutBurst?.jingles) ? rawGameConfig.assets.audio.payoutBurst.jingles : [],
          spacingMinMs: rawGameConfig.assets?.audio?.payoutBurst?.spacingMinMs ?? 30,
          spacingMaxMs: rawGameConfig.assets?.audio?.payoutBurst?.spacingMaxMs ?? 70,
          pitchCountMode: rawGameConfig.assets?.audio?.payoutBurst?.pitchCountMode === 'postIncrement' ? 'postIncrement' : 'preIncrement',
        },
        bgm: {
          playlist: Array.isArray(rawGameConfig.assets?.audio?.bgm?.playlist) ? rawGameConfig.assets.audio.bgm.playlist : [],
          challenge: rawGameConfig.assets?.audio?.bgm?.challenge || '',
        },
      },
      coinFallbackTierId: rawGameConfig.assets?.hud?.coinFallbackTierId ?? 'tinmoon',
    },
    cssRootVars: {
      ...DEFAULT_CSS_ROOT_VARS,
      ...(rawGameConfig.cssRootVars || {}),
    },
  };
}

export function getScratchbonesGameConfig({ rootConfig, reportError, debugEnabled = true }) {
  validateScratchbonesGameConfig(rootConfig, { reportError, debugEnabled });
  return normalizeScratchbonesGameConfig(rootConfig?.game || {});
}
