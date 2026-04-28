export function validateScratchbonesGameConfig(rootConfig, { reportError, debugEnabled = true } = {}) {
  const hasGameConfig = rootConfig && typeof rootConfig.game === 'object' && rootConfig.game !== null;
  if (hasGameConfig) return true;
  const fallback = (message) => `[scratchbones config] ${message}`;
  const message = (reportError || fallback)('Missing required window.SCRATCHBONES_CONFIG.game object from docs/config/scratchbones-config.js.');
  if (debugEnabled) throw new Error(message);
  return false;
}

export function normalizeScratchbonesGameConfig(rawGameConfig = {}) {
  return {
    deck: {
      rankCount: rawGameConfig.deck?.rankCount ?? 10,
      copiesPerRank: rawGameConfig.deck?.copiesPerRank ?? 4,
      handSize: rawGameConfig.deck?.handSize ?? 10,
      wildCount: rawGameConfig.deck?.wildCount ?? 10,
      playerCount: rawGameConfig.deck?.playerCount ?? 4,
      humanNames: rawGameConfig.deck?.humanNames ?? ['You'],
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
      challengeStakeTiers: rawGameConfig.chips?.challengeStake?.tiers ?? [{ id: 'sun', value: 1 }, { id: 'tinmoon', value: 5 }, { id: 'eclipse', value: 20 }],
      challengeStakeAnimation: {
        openMs: rawGameConfig.chips?.challengeStake?.animation?.openMs ?? 280,
        callMs: rawGameConfig.chips?.challengeStake?.animation?.callMs ?? 280,
        raiseOutMs: rawGameConfig.chips?.challengeStake?.animation?.raiseOutMs ?? 190,
        raiseInMs: rawGameConfig.chips?.challengeStake?.animation?.raiseInMs ?? 300,
      },
      clearBonusBase: rawGameConfig.chips?.clearReward?.base ?? 1,
      clearBonusIncrement: rawGameConfig.chips?.clearReward?.increment ?? 1,
    },
    timers: {
      challengeTimerSecs: rawGameConfig.timers?.challengeSeconds ?? 6,
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
    ai: {
      challengeThreshold: rawGameConfig.ai?.challengeThreshold ?? 0.52,
      challengeRandomNudgeMax: rawGameConfig.ai?.challengeRandomNudgeMax ?? 0.16,
      bettingConfidenceSuspicionWeight: rawGameConfig.ai?.bettingConfidenceSuspicionWeight ?? 0.55,
    },
    layout: {
      ...(rawGameConfig.layout || {}),
      mode: String(rawGameConfig.layout?.mode || 'responsive').toLowerCase(),
      authored: {
        enabled: rawGameConfig.layout?.authored?.enabled !== false,
        designWidthPx: Number(rawGameConfig.layout?.authored?.designWidthPx) || 1920,
        designHeightPx: Number(rawGameConfig.layout?.authored?.designHeightPx) || 1080,
        scaleMode: String(rawGameConfig.layout?.authored?.scaleMode || 'contain').toLowerCase(),
        boxes: rawGameConfig.layout?.authored?.boxes || {},
      },
      lighting: {
        ...(rawGameConfig.layout?.lighting || {}),
        candlelight: { ...(rawGameConfig.layout?.lighting?.candlelight || {}) },
      },
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
      cardHudBasePath: rawGameConfig.assets?.cards?.hudBasePath ?? './docs/assets/hud/',
      wildCardSrc: rawGameConfig.assets?.cards?.wild?.src ?? '2DScratchBoneWild.png',
      wildCardFallbackSrc: rawGameConfig.assets?.cards?.wild?.fallbackSrc ?? '2DScratchBoneWild.png',
      flippedCardSrc: rawGameConfig.assets?.cards?.flipped?.src ?? '2DScratchboneFlipped.png',
      flippedCardFallbackSrc: rawGameConfig.assets?.cards?.flipped?.fallbackSrc ?? '2DScratchBoneFlipped.png',
      rankCardTemplateSrc: rawGameConfig.assets?.cards?.rankTemplate?.src ?? '2DScratchbone{rank}.png',
      rankCardTemplateFallbackSrc: rawGameConfig.assets?.cards?.rankTemplate?.fallbackSrc ?? '2DScratchbones{rank}.png',
      claimRankGlyphTemplateSrc: rawGameConfig.assets?.symbols?.claimRankGlyphTemplateSrc ?? './docs/assets/symbols/boneglyph{rank}.png',
      cinematicTokenIconSrc: rawGameConfig.assets?.hud?.cinematicTokenIconSrc ?? './docs/assets/hud/coin_tinmoon.png',
      stakeTierCoinSrc: rawGameConfig.assets?.hud?.stakeTierCoinSrc ?? { sun: './docs/assets/hud/coin_sun.png', tinmoon: './docs/assets/hud/coin_tinmoon.png', eclipse: './docs/assets/hud/coin_eclipse.png' },
      audio: {
        enabled: rawGameConfig.assets?.audio?.enabled !== false,
        sfxVolume: rawGameConfig.assets?.audio?.sfxVolume ?? 0.92,
        bgmVolume: rawGameConfig.assets?.audio?.bgmVolume ?? 0.48,
        musicFadeMs: rawGameConfig.assets?.audio?.musicFadeMs ?? 280,
        movement: rawGameConfig.assets?.audio?.movement || {},
        challenge: rawGameConfig.assets?.audio?.challenge || {},
        bgm: {
          playlist: Array.isArray(rawGameConfig.assets?.audio?.bgm?.playlist) ? rawGameConfig.assets.audio.bgm.playlist : [],
          challenge: rawGameConfig.assets?.audio?.bgm?.challenge || '',
        },
      },
    },
  };
}

export function getScratchbonesGameConfig({ rootConfig, reportError, debugEnabled = true }) {
  validateScratchbonesGameConfig(rootConfig, { reportError, debugEnabled });
  return normalizeScratchbonesGameConfig(rootConfig?.game || {});
}
