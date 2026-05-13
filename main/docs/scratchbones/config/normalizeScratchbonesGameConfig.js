const DEFAULT_PORTRAIT_EXPRESSION_DURATION_MS = 10000;
const DEFAULT_RESTING_CHIP_NEUTRAL_BAND_RATIO = 0.15;
const DEFAULT_TRICK_SUMMARY_SEAT_AMOUNT_FONT_SIZE = '160%';
const DEFAULT_TRICK_SUMMARY_DECK_AMOUNT_FONT_SIZE = '250%';
const DEFAULT_TRICK_SUMMARY_AMOUNT_FONT_FAMILY = "'Khymeryyanroman4', Inter, system-ui, sans-serif";
const CSS_LENGTH_OR_PERCENT_PATTERN = /^(?:\d+|\d*\.\d+)(?:px|rem|em|%)$/i;
const DEFAULT_PORTRAIT_LAUGH_EMOTE_CONFIG = {
  puffCount: 3,
  inflateDurationSeconds: 0.12,
  deflateDurationSeconds: 0.14,
  pauseDurationSeconds: 0.18,
  mouthLaughMs: 1140,
  mouthRestExpression: 'smile',
};

const DEFAULT_AUTHORED_BOXES = {
  topbar: { x: -2, y: 11, width: 1123, height: 106 },
  sidebar: { x: 1354, y: 14, width: 251, height: 681 },
  humanSeat: { x: 1260, y: 701, width: 373, height: 187 },
  hand: { x: 469, y: 701, width: 508, height: 199 },
  log: { x: 7, y: 680, width: 477, height: 220 },
  turnSpotlight: { x: 1122, y: 12, width: 230, height: 200 },
  claimCluster: { x: 187, y: 290, width: 1037, height: 275 },
  challengePrompt: { x: 960, y: 760, width: 280, height: 140 },
};

const DEFAULT_PUNISH_BONE_SPIN_CONFIG = {
  spinDurationMs: 720,
  reducedMotionSpinDurationMs: 7200,
  rotationTurns: 1,
  blurPx: 1.4,
  scaleXMin: 0.56,
  shadowBlurPx: 12,
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
  '--layout-trick-info-seat-amount-column-min-em': '1.2em',
  '--layout-trick-info-deck-amount-column-min-em': '1.5em',
  '--layout-trick-symbol-filter': 'drop-shadow(0 1px 2px rgba(0,0,0,0.55))',
  '--layout-punish-button-card-width': '34px',
  '--layout-punish-button-card-height': '48px',
  '--layout-cinematic-punish-button-card-width': '96px',
  '--layout-cinematic-punish-button-card-height': '136px',
};


const DEFAULT_UI_WOBBLY_OUTLINES_CONFIG = {
  enabled: true,
  autoColoredBackgrounds: true,
  minBackgroundAlpha: 0.02,
  coloredBackgroundSelectors: [
    '.topbar',
    '.chip',
    '.turnSpotlight',
    '.turnSpotlightAvatar',
    '.turnSpotlightNameBar',
    '.aiSeat',
    '.humanSeatCard',
    '.humanSeatCard .seatAvatarBox',
    '.controls',
    '.controls select',
    '.controls button',
    '.chatLogBody',
    '.handWrap',
    '.handArrow',
    '.cardLabel',
    '.cardGlyph',
    '.eventLog',
    '.chatComposerInput',
    '.chatSendBtn',
    '.stakeTierBtn',
    '.challengePromptPane',
    '.timerTrack',
    '.timerFill',
    'details.debug',
    '.cin-result',
    '.emojiReactionPanel',
    '.emojiReactionBtn',
  ],
  backgroundOptionalSelectors: [
    '.chatLogBody',
  ],
  activeButtonSelectors: [
    'button:not(:disabled):not([aria-disabled="true"])',
  ],
  excludedColoredBackgroundSelectors: [
    'canvas',
    'img',
    'svg',
    '[data-wobbly-outline]',
    '.emojiReactionGlyph',
    '.emojiFxGlyph',
    '.shockGlyph',
  ],
  defaultStyle: { color: '#000000', lineWidth: 7.2, step: 23, wobble: 1.25, seed: 101, outset: 4 },
  styleRules: [
    { selector: '[data-ui-wobbly-outline="challenge-prompt"], [data-ui-wobbly-outline="control-panel"], [data-ui-wobbly-outline="betting-controls"]', style: { lineWidth: 7.4, step: 25, wobble: 1.35, seed: 29, outset: 4 } },
    { selector: '.humanSeatCard', style: { lineWidth: 8.0, step: 25, wobble: 1.35, seed: 59, outset: 4 } },
    { selector: '.eventLog', style: { lineWidth: 7.2, step: 23, wobble: 1.25, seed: 71, outset: 4 } },
    { selector: '.chatLogBody', style: { lineWidth: 4.2, step: 16, wobble: 1.0, seed: 79, outset: 2 } },
    { selector: '.aiSeat, .topbar, .controls, .challengePromptPane', style: { lineWidth: 7.4, step: 25, wobble: 1.35, seed: 83, outset: 4 } },
    { selector: 'button, select, .chip, .stakeTierBtn, .cardLabel, .cardGlyph, .handArrow, .chatComposerInput', style: { lineWidth: 3.2, step: 12, wobble: 0.95, seed: 107, outset: 2 } },
  ],
};


const DEFAULT_AI_DIFFICULTY_RANK = 'normal';
const DEFAULT_AI_DIFFICULTY_PROFILES = {
  easy: {
    challengeThreshold: 0.64,
    challengeThresholdModifier: 0,
    challengeRandomNudgeMax: 0.22,
    challengeKnownCardWeight: 0.22,
    challengeReadMemoryWeight: 0.65,
    challengeHumanTargetBias: 0.06,
    cardCountingAccuracy: 0.35,
    bettingConfidenceSuspicionWeight: 0.42,
    bettingConfidenceRandomNudgeMax: 0.10,
    bettingFoldFloorAdjustment: -0.03,
    bettingRaiseDriveAdjustment: 0.03,
    bettingOpponentFoldPressureWeight: 0.8,
    bettingRaiseScoreGate: -0.08,
    bettingRaiseMistakeChance: 0.28,
  },
  normal: {
    challengeThreshold: 0.52,
    challengeThresholdModifier: 0,
    challengeRandomNudgeMax: 0.16,
    challengeKnownCardWeight: 0.27,
    challengeReadMemoryWeight: 1,
    challengeHumanTargetBias: 0.1,
    cardCountingAccuracy: 0.65,
    bettingConfidenceSuspicionWeight: 0.55,
    bettingConfidenceRandomNudgeMax: 0.06,
    bettingFoldFloorAdjustment: 0,
    bettingRaiseDriveAdjustment: 0,
    bettingOpponentFoldPressureWeight: 1,
    bettingRaiseScoreGate: 0,
    bettingRaiseMistakeChance: 0.08,
  },
  hard: {
    challengeThreshold: 0.44,
    challengeThresholdModifier: 0,
    challengeRandomNudgeMax: 0.08,
    challengeKnownCardWeight: 0.32,
    challengeReadMemoryWeight: 1.25,
    challengeHumanTargetBias: 0.12,
    cardCountingAccuracy: 0.9,
    bettingConfidenceSuspicionWeight: 0.68,
    bettingConfidenceRandomNudgeMax: 0.025,
    bettingFoldFloorAdjustment: 0.02,
    bettingRaiseDriveAdjustment: -0.02,
    bettingOpponentFoldPressureWeight: 1.18,
    bettingRaiseScoreGate: 0.08,
    bettingRaiseMistakeChance: 0,
  },
};

const DEFAULT_AI_RENOWN_DISPLAY = {
  enabled: true,
  separator: ' · ',
  fallbackLabel: 'Renown',
  levels: {
    easy: { label: 'Renown I', title: 'Greenhorn', ariaLabel: 'AI difficulty: Renown I, Greenhorn' },
    normal: { label: 'Renown II', title: 'Seasoned', ariaLabel: 'AI difficulty: Renown II, Seasoned' },
    hard: { label: 'Renown III', title: 'Notorious', ariaLabel: 'AI difficulty: Renown III, Notorious' },
  },
};


const DEFAULT_AI_DECISION_CONFIG = {
  readProfile: {
    neutralBluffRate: 0.5,
    bluffRateWeight: 0.42,
    repeatRankCountWeight: 0.05,
    repeatedCountWeight: 0.015,
    repeatPressureMax: 0.18,
    currentBluffStreakWeight: 0.09,
    bluffStreakPressureMax: 0.22,
    currentTruthStreakWeight: 0.05,
    truthStreakPressureMax: 0.16,
    challengeWinWeight: 0.08,
    challengeWinPressureMax: 0.2,
    challengeLossWeight: 0.05,
    challengeLossPressureMax: 0.14,
    snapWeight: 0.1,
    overSuspectSnapWeight: 0.16,
    repeatClaimBiasIncrease: 0.06,
    claimSizeBiasFreeCards: 2,
    claimSizeBiasWeight: 0.015,
    truthBiasDampenMultiplier: 0.55,
    truthBiasDecrease: 0.1,
    bluffBiasDampenMultiplier: 0.55,
    bluffBiasIncrease: 0.14,
    challengeWinBiasIncrease: 0.18,
    challengeLossBiasDecrease: 0.14,
    quickJudgmentBiasMin: -1,
    quickJudgmentBiasMax: 1,
  },
  challenge: {
    cardCountSoftThreshold: 3,
    cardCountSoftBonus: 0.1,
    cardCountHardThreshold: 5,
    cardCountHardBonus: 0.08,
    lowChipThreshold: 2,
    lowChipSuspicionAdjustment: -0.18,
    highChipThreshold: 8,
    highChipSuspicionAdjustment: 0.05,
    personalitySuspicionWeight: 0.34,
    personalityAggressionWeight: 0.08,
    overSuspectBonus: 0.1,
    cardCountingSuspicionWeight: 0.35,
    cardCountingImpossibleWeight: 0.22,
    cardCountingDeckPressureWeight: 0.08,
    cardCountingAbundanceReliefWeight: 0.12,
  },
  delays: {
    turnComplexityBase: 0.22,
    turnHandSizeWeight: 0.32,
    turnOpeningRankWeight: 0.18,
    turnTargetRankWeight: 0.12,
    turnFewMatchWeight: 0.15,
    turnMatchWeight: 0.05,
    turnOpponentWeight: 0.04,
    turnPaceComplexityWeight: 0.7,
    turnPaceStyleWeight: 0.3,
    turnRandomWeight: 0.12,
    turnCourageTempoWeight: 0.4,
    turnAggressionTempoWeight: 0.3,
    turnHonestyTempoWeight: 0.3,
    challengeUncertaintyBase: 0.45,
    challengeImpossibleOverageWeight: 0.14,
    challengeReadCertaintyBase: 0.18,
    challengeReadCertaintyWeight: 0.6,
    challengeOpeningHandPressure: 0.08,
    challengeHandPressureBase: 0.2,
    challengeMatchPressureWeight: 0.05,
    challengeRandomWeight: 0.08,
    challengePaceUncertaintyWeight: 0.72,
    challengePaceStyleWeight: 0.28,
    challengeCourageTempoWeight: 0.46,
    challengeSuspicionTempoWeight: 0.34,
    challengeAggressionTempoWeight: 0.2,
    bettingNeutralConfidence: 0.5,
    bettingDefaultFoldFloor: 0.32,
    bettingConfidenceGapWeight: 0.6,
    bettingStakePressureMax: 0.25,
    bettingStakePressureWeight: 0.03,
    bettingCallPressureMax: 0.2,
    bettingCallPressureWeight: 0.05,
    bettingRandomWeight: 0.08,
    bettingUncertaintyBase: 0.42,
    bettingPaceUncertaintyWeight: 0.66,
    bettingPaceStyleWeight: 0.34,
    bettingCourageTempoWeight: 0.5,
    bettingAggressionTempoWeight: 0.3,
    bettingGreedTempoWeight: 0.2,
    bettingDecisiveConfidenceGap: 0.42,
    bettingDecisiveDelayFraction: 0.12,
    bettingDecisiveDelayMinOffsetMs: 20,
  },
  play: {
    naiveOpeningTruthChance: 0.82,
    naiveOpeningBestRankChance: 0.7,
    naiveWildTruthBaseChance: 0.38,
    naiveWildTruthHonestyWeight: 0.18,
    naiveBluffChanceMax: 0.92,
    naiveBluffChanceBase: 0.42,
    naiveBluffHonestyWeight: 0.28,
    naiveLowHandBluffBonus: 0.18,
    naiveBrokeBluffChance: 0.5,
    heuristicHugeTruthCount: 5,
    heuristicTruthBaitHonesty: 0.68,
    heuristicTruthBaitMaxCount: 6,
    heuristicMultiPlayMinCount: 2,
    heuristicMultiPlayMaxCount: 4,
    heuristicOpeningNaturalThreshold: 3,
    heuristicOpeningNaturalChanceBase: 0.52,
    heuristicOpeningNaturalGreedWeight: 0.22,
    heuristicOpeningTruthfulThreshold: 3,
    heuristicOpeningTruthfulChanceBase: 0.32,
    heuristicOpeningTruthfulGreedWeight: 0.2,
    heuristicSaveWildHonesty: 0.62,
    heuristicNaturalMultiThreshold: 3,
    heuristicNaturalMultiChanceBase: 0.42,
    heuristicNaturalMultiGreedWeight: 0.22,
    heuristicLowHandSize: 3,
    heuristicHighHonestyWildThreshold: 0.74,
    heuristicLowChipThreshold: 2,
    heuristicMidChipThreshold: 5,
    heuristicHighHonestyLowChipBluffBase: 0.1,
    heuristicHighHonestyLowChipBluffWeight: 0.4,
    heuristicHighHonestyMidChipBluffBase: 0.18,
    heuristicHighHonestyMidChipBluffWeight: 0.45,
    heuristicHighHonestyHighChipBluffBase: 0.28,
    heuristicHighHonestyHighChipBluffWeight: 0.5,
    heuristicWildUseLowHandSize: 2,
    heuristicWildUseChanceBase: 0.18,
    heuristicWildUseHonestyWeight: 0.38,
    heuristicAggressiveBluffThreshold: 0.74,
    heuristicModerateBluffThreshold: 0.52,
    heuristicAggressiveBluffCap: 4,
    heuristicModerateBluffCap: 3,
    heuristicCautiousBluffCap: 2,
    heuristicBluffExtraChanceBase: 0.4,
    heuristicBluffExtraGreedWeight: 0.2,
    heuristicLowHonestyThreshold: 0.32,
    heuristicMidHonestyThreshold: 0.68,
    heuristicLowChipBluffBase: 0.12,
    heuristicLowChipBluffAggressionWeight: 0.45,
    heuristicMidChipBluffBase: 0.24,
    heuristicMidChipBluffAggressionWeight: 0.58,
    heuristicHighChipBluffBase: 0.4,
    heuristicHighChipBluffAggressionWeight: 0.72,
    heuristicHighChipBluffMax: 0.95,
    heuristicTrickyRateMax: 0.7,
    heuristicTrickyRateBase: 0.18,
    heuristicTrickyAggressionWeight: 0.34,
    heuristicTrickyGreedWeight: 0.16,
    heuristicFallbackBluffRiskMultiplier: 0.72,
    scoredBluffCandidateMaxCount: 4,
    riskThresholdPressureBase: 0.5,
    riskThresholdPressureWeight: 1.8,
    riskReadPressureBase: 0.5,
    riskReadPressureWeight: 1.6,
    riskThresholdBlend: 0.72,
    riskReadBlend: 0.28,
    riskBluffExposureBase: 0.26,
    riskBluffExposureMaxBonus: 0.24,
    riskBluffExposureCardWeight: 0.06,
    riskDifficultyNoiseMax: 0.12,
    riskDifficultyNoiseWeight: 0.35,
    scoreConcedeBase: 0.08,
    scoreConcedeAffordableBonus: 0.08,
    scoreConcedeBrokePenalty: -0.28,
    scoreConcedeNoTruthBase: 0.28,
    scoreConcedeNoTruthHonestyWeight: 0.18,
    scoreConcedeTruthAvailablePenalty: -0.35,
    scoreConcedeAggressionPenaltyWeight: 0.16,
    scoreTruthBase: 0.62,
    scoreTruthHonestyWeight: 0.36,
    scoreBluffBase: 0.2,
    scoreBluffAggressionWeight: 0.44,
    scoreBluffGreedWeight: 0.18,
    scoreTruthCountBase: 0.16,
    scoreTruthCountGreedWeight: 0.06,
    scoreBluffCountBase: 0.08,
    scoreBluffCountAggressionWeight: 0.04,
    scoreLowHandAfterThreshold: 2,
    scoreLowHandAfterOpportunity: 0.35,
    scoreClearOpportunityBase: 0.72,
    scoreClearOpportunityGreedWeight: 0.22,
    scoreClearOpportunityLowChipThreshold: 3,
    scoreClearOpportunityLowChipBonus: 0.18,
    scoreLowChipTruthThreshold: 2,
    scoreLowChipTruthBonus: 0.14,
    scoreHighChipBluffThreshold: 8,
    scoreHighChipBluffBaseBonus: 0.08,
    scoreHighChipBluffAggressionBonusWeight: 0.06,
    scoreTruthLimitedRankBonus: 0.12,
    scoreTruthWildLowHandAfterThreshold: 1,
    scoreTruthWildLowHandPenalty: 0.02,
    scoreTruthWildPenaltyBase: 0.11,
    scoreTruthWildHonestyPenaltyWeight: 0.08,
    scoreBluffWildPenalty: 0.2,
    scoreTruthRiskPenaltyWeight: 0.28,
    scoreBluffRiskPenaltyBase: 0.88,
    scoreBluffRiskHonestyPenaltyWeight: 0.3,
    scoreLargeBluffCountThreshold: 3,
    scoreLargeBluffPenalty: 0.08,
    scoreAllWildsVisibleBluffPenalty: 0.06,
    scoreRandomBonusMax: 0.035,
  },
  foldPressure: {
    base: 0.5,
    challengeWinWeight: 0.06,
    challengeWinMaxPenalty: 0.2,
    challengeLossWeight: 0.04,
    challengeLossMaxBonus: 0.12,
    courageWeight: 0.32,
    suspicionWeight: 0.12,
    overSuspectPenalty: 0.06,
    lowChipThreshold: 2,
    lowChipBonus: 0.08,
    highChipThreshold: 8,
    highChipPenalty: 0.04,
    stakePressureMax: 0.14,
    stakePressureWeight: 0.05,
    min: 0.05,
    max: 0.95,
  },
  betting: {
    neutralConfidence: 0.5,
    defaultFoldFloor: 0.32,
    bankrollBoostMax: 0.18,
    bankrollBoostDivisor: 40,
    couragePushWeight: 0.22,
    randomNudgeMultiplier: 2,
    foldFloorCourageWeight: 0.18,
    readSuspicionWeight: 0.18,
    challengerFoldPressureWeight: 0.45,
    bluffStreakRaiseDriveMax: 0.12,
    bluffStreakRaiseDriveWeight: 0.05,
    negativeSuspicionRaisePenaltyMax: 0.14,
    negativeSuspicionRaisePenaltyWeight: 0.2,
    defenderTruthFoldPressureWeight: 0.34,
    defenderTruthAggressionWeight: 0.12,
    defenderTruthStakePressureMax: 0.12,
    defenderTruthStakePressureWeight: 0.04,
    defenderTruthConfidenceBonus: 0.06,
    defenderBluffFoldPressureWeight: 0.58,
    defenderBluffSteadinessPenaltyWeight: 0.2,
    defenderBluffCourageWeight: 0.16,
    defenderBluffFoldFloorBonus: 0.06,
    confidenceMin: 0.05,
    confidenceMax: 0.95,
    raiseDriveMin: 0.05,
    raiseDriveMax: 0.98,
    foldFloorMin: 0.08,
    foldFloorMax: 0.7,
    raiseThresholdBase: 0.68,
    raiseThresholdCourageWeight: 0.18,
    hardRaiseThresholdBonus: 0.08,
    raiseCandidateConfidenceWeight: 0.18,
    underRaiseMistakeMultiplier: 0.75,
  },
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
  materialTags: {
    cloth: 'cloth',
  },
  clothHoodColorSourceSlots: ['armCosmetic', 'torsoCosmetic'],
  npcRequiredClothingPaletteKeys: ['B', 'C'],
  clothingFallbackTintSlotsBySlot: {
    hat: 'HAT',
    hood: 'HOOD',
    torsoCosmetic: 'CLOTH',
    armCosmetic: 'CLOTH',
  },
};

function normalizeStringArray(value, fallback) {
  const source = Array.isArray(value) ? value : fallback;
  return source.map((item) => String(item || '').trim()).filter(Boolean);
}

function normalizeFiniteNumber(value, fallback, { min = -Infinity, max = Infinity } = {}) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, numeric));
}


function normalizeAiDifficultyRankKey(value) {
  return String(value || '').trim().toLowerCase();
}

function normalizeAiDifficultyRankName(value, fallback = DEFAULT_AI_DIFFICULTY_RANK, rankProfiles = DEFAULT_AI_DIFFICULTY_PROFILES) {
  const normalized = normalizeAiDifficultyRankKey(value);
  return normalized && rankProfiles[normalized] ? normalized : fallback;
}

function normalizeAiDecisionSection(rawSection = {}, fallbackSection = {}) {
  const source = rawSection && typeof rawSection === 'object' && !Array.isArray(rawSection) ? rawSection : {};
  const fallback = fallbackSection && typeof fallbackSection === 'object' && !Array.isArray(fallbackSection) ? fallbackSection : {};
  const normalized = {};
  for (const [key, fallbackValue] of Object.entries(fallback)) {
    normalized[key] = normalizeFiniteNumber(source[key], fallbackValue, { min: -10000, max: 10000 });
  }
  return normalized;
}

function normalizeAiDecisionConfig(rawDecision = {}, fallbackDecision = DEFAULT_AI_DECISION_CONFIG) {
  const source = rawDecision && typeof rawDecision === 'object' && !Array.isArray(rawDecision) ? rawDecision : {};
  const fallback = fallbackDecision && typeof fallbackDecision === 'object' && !Array.isArray(fallbackDecision) ? fallbackDecision : DEFAULT_AI_DECISION_CONFIG;
  const normalized = {};
  for (const [sectionName, fallbackSection] of Object.entries(fallback)) {
    normalized[sectionName] = normalizeAiDecisionSection(source[sectionName], fallbackSection);
  }
  return normalized;
}

function normalizeAiRenownDisplayConfig(rawDisplay = {}, rankProfiles = DEFAULT_AI_DIFFICULTY_PROFILES) {
  const source = rawDisplay && typeof rawDisplay === 'object' && !Array.isArray(rawDisplay) ? rawDisplay : {};
  const fallback = DEFAULT_AI_RENOWN_DISPLAY;
  const rawLevels = source.levels && typeof source.levels === 'object' && !Array.isArray(source.levels) ? source.levels : {};
  const levels = {};
  for (const rank of Object.keys(rankProfiles)) {
    const fallbackLevel = fallback.levels[rank] || {};
    const rawLevel = rawLevels[rank] && typeof rawLevels[rank] === 'object' && !Array.isArray(rawLevels[rank]) ? rawLevels[rank] : {};
    const label = String(rawLevel.label ?? fallbackLevel.label ?? fallback.fallbackLabel).trim();
    const title = String(rawLevel.title ?? fallbackLevel.title ?? rank).trim();
    const ariaLabel = String(rawLevel.ariaLabel ?? fallbackLevel.ariaLabel ?? `${fallback.fallbackLabel}: ${label}${title ? fallback.separator + title : ''}`).trim();
    levels[rank] = {
      label: label || fallback.fallbackLabel,
      title,
      ariaLabel: ariaLabel || `${fallback.fallbackLabel}: ${label || rank}`,
    };
  }
  return {
    enabled: source.enabled !== false,
    separator: String(source.separator ?? fallback.separator).trim() || fallback.separator,
    fallbackLabel: String(source.fallbackLabel ?? fallback.fallbackLabel).trim() || fallback.fallbackLabel,
    levels,
  };
}

function normalizeAiDifficultyProfile(rawProfile = {}, fallbackProfile = DEFAULT_AI_DIFFICULTY_PROFILES.normal) {
  const source = rawProfile && typeof rawProfile === 'object' && !Array.isArray(rawProfile) ? rawProfile : {};
  return {
    challengeThreshold: normalizeFiniteNumber(source.challengeThreshold, fallbackProfile.challengeThreshold, { min: 0, max: 1 }),
    challengeThresholdModifier: normalizeFiniteNumber(source.challengeThresholdModifier, fallbackProfile.challengeThresholdModifier, { min: -1, max: 1 }),
    challengeRandomNudgeMax: normalizeFiniteNumber(source.challengeRandomNudgeMax, fallbackProfile.challengeRandomNudgeMax, { min: 0, max: 1 }),
    challengeKnownCardWeight: normalizeFiniteNumber(source.challengeKnownCardWeight, fallbackProfile.challengeKnownCardWeight, { min: 0, max: 2 }),
    challengeReadMemoryWeight: normalizeFiniteNumber(source.challengeReadMemoryWeight, fallbackProfile.challengeReadMemoryWeight, { min: 0, max: 3 }),
    challengeHumanTargetBias: normalizeFiniteNumber(source.challengeHumanTargetBias, fallbackProfile.challengeHumanTargetBias, { min: -1, max: 1 }),
    cardCountingAccuracy: normalizeFiniteNumber(source.cardCountingAccuracy, fallbackProfile.cardCountingAccuracy, { min: 0, max: 1 }),
    bettingConfidenceSuspicionWeight: normalizeFiniteNumber(source.bettingConfidenceSuspicionWeight, fallbackProfile.bettingConfidenceSuspicionWeight, { min: 0, max: 2 }),
    bettingConfidenceRandomNudgeMax: normalizeFiniteNumber(source.bettingConfidenceRandomNudgeMax, fallbackProfile.bettingConfidenceRandomNudgeMax, { min: 0, max: 1 }),
    bettingFoldFloorAdjustment: normalizeFiniteNumber(source.bettingFoldFloorAdjustment, fallbackProfile.bettingFoldFloorAdjustment, { min: -1, max: 1 }),
    bettingRaiseDriveAdjustment: normalizeFiniteNumber(source.bettingRaiseDriveAdjustment, fallbackProfile.bettingRaiseDriveAdjustment, { min: -1, max: 1 }),
    bettingOpponentFoldPressureWeight: normalizeFiniteNumber(source.bettingOpponentFoldPressureWeight, fallbackProfile.bettingOpponentFoldPressureWeight, { min: 0, max: 3 }),
    bettingRaiseScoreGate: normalizeFiniteNumber(source.bettingRaiseScoreGate, fallbackProfile.bettingRaiseScoreGate, { min: -1, max: 1 }),
    bettingRaiseMistakeChance: normalizeFiniteNumber(source.bettingRaiseMistakeChance, fallbackProfile.bettingRaiseMistakeChance, { min: 0, max: 1 }),
  };
}

function normalizeAiConfig(rawAi = {}) {
  const source = rawAi && typeof rawAi === 'object' && !Array.isArray(rawAi) ? rawAi : {};
  const decision = normalizeAiDecisionConfig(source.decision, DEFAULT_AI_DECISION_CONFIG);
  const migratedNormalProfile = normalizeAiDifficultyProfile(source, DEFAULT_AI_DIFFICULTY_PROFILES.normal);
  const rawRanks = source.difficultyRanks && typeof source.difficultyRanks === 'object' && !Array.isArray(source.difficultyRanks)
    ? source.difficultyRanks
    : {};
  const rawRankEntriesByKey = {};
  for (const [rawRank, rawProfile] of Object.entries(rawRanks)) {
    const normalizedRank = normalizeAiDifficultyRankKey(rawRank);
    if (normalizedRank) rawRankEntriesByKey[normalizedRank] = rawProfile;
  }
  const difficultyRanks = {};
  for (const rank of Object.keys(DEFAULT_AI_DIFFICULTY_PROFILES)) {
    const fallbackProfile = rank === DEFAULT_AI_DIFFICULTY_RANK ? migratedNormalProfile : DEFAULT_AI_DIFFICULTY_PROFILES[rank];
    difficultyRanks[rank] = normalizeAiDifficultyProfile(rawRankEntriesByKey[rank], fallbackProfile);
  }
  for (const [rank, rawProfile] of Object.entries(rawRankEntriesByKey)) {
    if (difficultyRanks[rank]) continue;
    const profileSource = rawProfile && typeof rawProfile === 'object' && !Array.isArray(rawProfile) ? rawProfile : {};
    const requestedFallbackRank = normalizeAiDifficultyRankName(profileSource.extends, DEFAULT_AI_DIFFICULTY_RANK, difficultyRanks);
    const fallbackProfile = difficultyRanks[requestedFallbackRank] || difficultyRanks[DEFAULT_AI_DIFFICULTY_RANK] || migratedNormalProfile;
    difficultyRanks[rank] = normalizeAiDifficultyProfile(profileSource, fallbackProfile);
  }
  const defaultDifficultyRank = normalizeAiDifficultyRankName(source.defaultDifficultyRank, DEFAULT_AI_DIFFICULTY_RANK, difficultyRanks);
  const seatDifficultyRanks = {};
  const rawSeatDifficultyRanks = source.seatDifficultyRanks && typeof source.seatDifficultyRanks === 'object' && !Array.isArray(source.seatDifficultyRanks)
    ? source.seatDifficultyRanks
    : {};
  for (const [key, value] of Object.entries(rawSeatDifficultyRanks)) {
    const normalizedKey = String(key || '').trim();
    if (!normalizedKey) continue;
    seatDifficultyRanks[normalizedKey] = normalizeAiDifficultyRankName(value, defaultDifficultyRank, difficultyRanks);
  }
  return {
    challengeThreshold: migratedNormalProfile.challengeThreshold,
    challengeThresholdModifier: migratedNormalProfile.challengeThresholdModifier,
    challengeRandomNudgeMax: migratedNormalProfile.challengeRandomNudgeMax,
    challengeKnownCardWeight: migratedNormalProfile.challengeKnownCardWeight,
    challengeReadMemoryWeight: migratedNormalProfile.challengeReadMemoryWeight,
    challengeHumanTargetBias: migratedNormalProfile.challengeHumanTargetBias,
    bettingConfidenceSuspicionWeight: migratedNormalProfile.bettingConfidenceSuspicionWeight,
    bettingConfidenceRandomNudgeMax: migratedNormalProfile.bettingConfidenceRandomNudgeMax,
    bettingFoldFloorAdjustment: migratedNormalProfile.bettingFoldFloorAdjustment,
    bettingRaiseDriveAdjustment: migratedNormalProfile.bettingRaiseDriveAdjustment,
    bettingOpponentFoldPressureWeight: migratedNormalProfile.bettingOpponentFoldPressureWeight,
    bettingRaiseScoreGate: migratedNormalProfile.bettingRaiseScoreGate,
    bettingRaiseMistakeChance: migratedNormalProfile.bettingRaiseMistakeChance,
    decision,
    defaultDifficultyRank,
    difficultyRanks,
    seatDifficultyRanks,
    renownDisplay: normalizeAiRenownDisplayConfig(source.renownDisplay, difficultyRanks),
  };
}

function normalizePunishBoneSpinConfig(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    spinDurationMs: normalizeFiniteNumber(source.spinDurationMs, DEFAULT_PUNISH_BONE_SPIN_CONFIG.spinDurationMs, { min: 40 }),
    reducedMotionSpinDurationMs: normalizeFiniteNumber(source.reducedMotionSpinDurationMs, DEFAULT_PUNISH_BONE_SPIN_CONFIG.reducedMotionSpinDurationMs, { min: 40 }),
    rotationTurns: normalizeFiniteNumber(source.rotationTurns, DEFAULT_PUNISH_BONE_SPIN_CONFIG.rotationTurns, { min: 0.25 }),
    blurPx: normalizeFiniteNumber(source.blurPx, DEFAULT_PUNISH_BONE_SPIN_CONFIG.blurPx, { min: 0 }),
    scaleXMin: normalizeFiniteNumber(source.scaleXMin, DEFAULT_PUNISH_BONE_SPIN_CONFIG.scaleXMin, { min: 0.05, max: 1 }),
    shadowBlurPx: normalizeFiniteNumber(source.shadowBlurPx, DEFAULT_PUNISH_BONE_SPIN_CONFIG.shadowBlurPx, { min: 0 }),
  };
}

function normalizeStringMap(value, fallback) {
  const source = value && typeof value === 'object' && !Array.isArray(value)
    ? { ...fallback, ...value }
    : fallback;
  return Object.fromEntries(Object.entries(source)
    .map(([key, mapValue]) => [String(key || '').trim(), String(mapValue || '').trim()])
    .filter(([key, mapValue]) => key && mapValue));
}


const DEFAULT_GAMEPLAY_SHORTCUTS_CONFIG = {
  focusChat: {
    enabled: true,
    key: 'Enter',
    selectExistingText: true,
  },
};

const DEFAULT_CHAT_CONFIG = {
  messageMaxLength: 180,
  inputFocusFontSizePx: 16,
  blurInputOnSubmit: true,
  resetMobileZoomOnSubmit: true,
  mobileZoomResetDelayMs: 60,
  mobileZoomResetViewportContent: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover',
  messageBubbleSpawnAfterZoomResetMs: 1500,
  messageAnimationSpawnAfterZoomResetMs: 2500,
  laughPhrases: ['lol', 'ha', 'haha', 'hahaha'],
  bubbleMaxLength: 36,
  bubbleDurationMs: 2000,
  bubbleOverlayZIndex: 10030,
};

function normalizeChatConfig(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    messageMaxLength: Math.max(1, Math.floor(normalizeFiniteNumber(source.messageMaxLength, DEFAULT_CHAT_CONFIG.messageMaxLength))),
    inputFocusFontSizePx: Math.max(16, Math.floor(normalizeFiniteNumber(source.inputFocusFontSizePx, DEFAULT_CHAT_CONFIG.inputFocusFontSizePx))),
    blurInputOnSubmit: source.blurInputOnSubmit !== false,
    resetMobileZoomOnSubmit: source.resetMobileZoomOnSubmit !== false,
    mobileZoomResetDelayMs: normalizeFiniteNumber(source.mobileZoomResetDelayMs, DEFAULT_CHAT_CONFIG.mobileZoomResetDelayMs, { min: 0 }),
    mobileZoomResetViewportContent: String(source.mobileZoomResetViewportContent || DEFAULT_CHAT_CONFIG.mobileZoomResetViewportContent).trim() || DEFAULT_CHAT_CONFIG.mobileZoomResetViewportContent,
    messageBubbleSpawnAfterZoomResetMs: normalizeFiniteNumber(source.messageBubbleSpawnAfterZoomResetMs ?? source.messageFxSpawnAfterZoomResetMs ?? source.bubbleSpawnAfterZoomResetMs, DEFAULT_CHAT_CONFIG.messageBubbleSpawnAfterZoomResetMs, { min: 0 }),
    messageAnimationSpawnAfterZoomResetMs: normalizeFiniteNumber(source.messageAnimationSpawnAfterZoomResetMs ?? source.messageFxSpawnAfterZoomResetMs, DEFAULT_CHAT_CONFIG.messageAnimationSpawnAfterZoomResetMs, { min: 0 }),
    laughPhrases: normalizeStringArray(source.laughPhrases, DEFAULT_CHAT_CONFIG.laughPhrases),
    bubbleMaxLength: Math.max(1, Math.floor(normalizeFiniteNumber(source.bubbleMaxLength, DEFAULT_CHAT_CONFIG.bubbleMaxLength))),
    bubbleDurationMs: normalizeFiniteNumber(source.bubbleDurationMs, DEFAULT_CHAT_CONFIG.bubbleDurationMs, { min: 40 }),
    bubbleOverlayZIndex: Math.floor(normalizeFiniteNumber(source.bubbleOverlayZIndex, DEFAULT_CHAT_CONFIG.bubbleOverlayZIndex)),
  };
}

function normalizeGameplayShortcutsConfig(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  const rawFocusChat = source.focusChat && typeof source.focusChat === 'object' && !Array.isArray(source.focusChat)
    ? source.focusChat
    : {};
  const key = String(rawFocusChat.key || DEFAULT_GAMEPLAY_SHORTCUTS_CONFIG.focusChat.key).trim() || DEFAULT_GAMEPLAY_SHORTCUTS_CONFIG.focusChat.key;
  return {
    focusChat: {
      enabled: rawFocusChat.enabled !== false,
      key,
      selectExistingText: rawFocusChat.selectExistingText !== false,
    },
  };
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
      text: 'Glowing cards are Trick Bones — special cards with unique powers.\n\nSmuggle Bone: when your claim passes without challenge, every non-Smuggle claimed card leaves the table and goes into another player\'s hand; human Smuggle users choose the target seat.\nTrap Bone: if your challenged Trap claim is truthful and the challenge fails, transfer up to the claim size from your hand to the challenger; human defenders choose cards with the Trap selection.\nPunish Bone: wild. During challenge betting, the challenger may arm Punish before opening, raising, or calling. Arming consumes one Punish card; if the challenge succeeds, the challenger gives claim-size cards to the challenged player.',
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

function normalizeOneOf(value, fallback, allowedValues, aliases = {}) {
  const normalized = String(value || '').trim().toLowerCase();
  const aliased = aliases[normalized] || normalized;
  return allowedValues.includes(aliased) ? aliased : fallback;
}

function normalizeStringList(value, fallback = []) {
  const source = Array.isArray(value) ? value : fallback;
  return source.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim());
}

function normalizeWobblyOutlineStyle(rawStyle, fallbackStyle = {}) {
  const source = rawStyle && typeof rawStyle === 'object' && !Array.isArray(rawStyle) ? rawStyle : {};
  const fallback = fallbackStyle && typeof fallbackStyle === 'object' ? fallbackStyle : {};
  return {
    color: typeof source.color === 'string' && source.color.trim() ? source.color : (fallback.color || '#000000'),
    lineWidth: finiteNumberOrDefault(source.lineWidth, finiteNumberOrDefault(fallback.lineWidth, 7.2)),
    step: finiteNumberOrDefault(source.step, finiteNumberOrDefault(fallback.step, 23)),
    wobble: finiteNumberOrDefault(source.wobble, finiteNumberOrDefault(fallback.wobble, 1.25)),
    seed: finiteNumberOrDefault(source.seed, finiteNumberOrDefault(fallback.seed, 101)),
    outset: finiteNumberOrDefault(source.outset, finiteNumberOrDefault(fallback.outset, 4)),
  };
}

function normalizeWobblyOutlineStyleRules(rawRules, fallbackRules, defaultStyle) {
  const source = Array.isArray(rawRules) ? rawRules : fallbackRules;
  return source.map((rule) => {
    if (!rule || typeof rule !== 'object' || typeof rule.selector !== 'string' || !rule.selector.trim()) return null;
    return {
      selector: rule.selector.trim(),
      style: normalizeWobblyOutlineStyle(rule.style, defaultStyle),
    };
  }).filter(Boolean);
}

function normalizeUiWobblyOutlinesConfig(rawConfig = {}) {
  const raw = rawConfig && typeof rawConfig === 'object' && !Array.isArray(rawConfig) ? rawConfig : {};
  const defaultStyle = normalizeWobblyOutlineStyle(raw.defaultStyle, DEFAULT_UI_WOBBLY_OUTLINES_CONFIG.defaultStyle);
  return {
    enabled: raw.enabled !== false,
    autoColoredBackgrounds: raw.autoColoredBackgrounds !== false,
    minBackgroundAlpha: Math.min(1, Math.max(0, finiteNumberOrDefault(raw.minBackgroundAlpha, DEFAULT_UI_WOBBLY_OUTLINES_CONFIG.minBackgroundAlpha))),
    coloredBackgroundSelectors: normalizeStringList(raw.coloredBackgroundSelectors, DEFAULT_UI_WOBBLY_OUTLINES_CONFIG.coloredBackgroundSelectors),
    backgroundOptionalSelectors: normalizeStringList(raw.backgroundOptionalSelectors, DEFAULT_UI_WOBBLY_OUTLINES_CONFIG.backgroundOptionalSelectors),
    activeButtonSelectors: normalizeStringList(raw.activeButtonSelectors, DEFAULT_UI_WOBBLY_OUTLINES_CONFIG.activeButtonSelectors),
    excludedColoredBackgroundSelectors: normalizeStringList(raw.excludedColoredBackgroundSelectors, DEFAULT_UI_WOBBLY_OUTLINES_CONFIG.excludedColoredBackgroundSelectors),
    defaultStyle,
    styleRules: normalizeWobblyOutlineStyleRules(raw.styleRules, DEFAULT_UI_WOBBLY_OUTLINES_CONFIG.styleRules, defaultStyle),
  };
}

const DEFAULT_TYPOGRAPHY_BASELINE_FIELDS = ['font-size', 'line-height', 'font-family', 'letter-spacing', 'font-weight'];
const DEFAULT_PROMOTED_TEXT_METRIC_FIELDS = [
  'font-size',
  'line-height',
  'font-family',
  'font-weight',
  'letter-spacing',
  'text-align',
  'white-space',
  'max-width',
  'box-sizing',
  'padding-top',
  'padding-right',
  'padding-bottom',
  'padding-left',
];
const DEFAULT_PROMOTED_TEXT_METRIC_ASSIGNMENT_IDS = ['ui-text-over-lighting'];
const DEFAULT_PROMOTE_BY_ROOT_SELECTORS = [
  '#aiSidebar',
  '.humanSeatZone',
  '.claimCluster',
  '.stakeVisualPanel',
  '.challengePromptPane',
];
const DEFAULT_EXCLUDE_DESCENDANT_SELECTORS = [
  '.seatName',
  '.seatMeta',
  '.seatChipBadge',
  '.seatChipBadgeIcon',
  '.seatSeed',
  '.seatTags',
  '.seatCoinRow',
  '.seatStatus',
  '.seatHandPreview',
  '.seatTrickLoadoutInfo',
  '.seatTrickLoadoutInfoItem',
  '.seatAvatarBox',
  '.claimAvatarNameTag',
  '.claimAvatarCinRole',
  '.claimAvatarCinName',
  '.claimAvatarCinTags',
];
const DEFAULT_TRANSFORM_SENSITIVE_MARKER_ATTRIBUTES = [
  'id',
  'class',
  'data-proj-id',
  'data-ui-role',
  'data-node-type',
  'data-cinematic',
];
const DEFAULT_TRANSFORM_SENSITIVE_MARKER_TERMS = ['avatar', 'portrait', 'cinematic', 'cutscene'];
const DEFAULT_PRESERVE_TRANSFORM_PROJECT_ID_CONTAINS_RULES = [
  { prefix: 'claim-', contains: ['anchor', 'text'] },
];

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
  typographyBaselineFields: DEFAULT_TYPOGRAPHY_BASELINE_FIELDS,
  promotedTextMetricFields: DEFAULT_PROMOTED_TEXT_METRIC_FIELDS,
  promotedTextMetricAssignmentIds: DEFAULT_PROMOTED_TEXT_METRIC_ASSIGNMENT_IDS,
  transformSensitiveMarkerAttributes: DEFAULT_TRANSFORM_SENSITIVE_MARKER_ATTRIBUTES,
  transformSensitiveMarkerTerms: DEFAULT_TRANSFORM_SENSITIVE_MARKER_TERMS,
  preservePromotionTransformProjectIds: ['avatar-human'],
  preservePromotionTransformProjectIdPrefixes: ['avatar-', 'claim-avatar-'],
  preservePromotionTransformProjectIdContainsRules: DEFAULT_PRESERVE_TRANSFORM_PROJECT_ID_CONTAINS_RULES,
  placementMode: 'authored-space',
  placementCoordinateSpace: 'app',
  roundToPixels: false,
  portalScaleStrategy: 'portal-transform',
  screenSpaceUseFixed: true,
  screenSpaceRoundToPixels: false,
  updateOnScroll: true,
  promoteByRootSelectors: DEFAULT_PROMOTE_BY_ROOT_SELECTORS,
  excludeDescendantSelectors: DEFAULT_EXCLUDE_DESCENDANT_SELECTORS,
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
        '.seatSeed',
        '.seatTags',
        '.seatCoinRow',
        '.seatStatus',
        '.seatHandPreview',
        '.seatTrickLoadoutInfo',
        '.seatTrickLoadoutInfoItem',
        '.seatTrickLoadoutGlyph',
        '.seatTrickLoadoutMultiplyGlyph',
        '.turnSpotlightNameBar',
        '.cin-name',
        '.cin-action-burst',
        '.challengePromptInfo',
        '.stakeVisualHeader',
        '.stakeSlotLabel',
        '.stakeSlotValue',
        '.bettingStatusTitle',
        '.bettingStatusLine',
        '.claimAvatarNameTag',
        '.claimAvatarCinRole',
        '.claimAvatarCinName',
        '.claimAvatarCinTags',
        '.claimClusterTextAnchor',
        '.trickDeckInfo',
        '.trickDeckInfoItem',
        '.trickDeckInfoGlyph',
        '.trickDeckInfoMultiplyGlyph',
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
        '.eventLog',
        '.stakeVisualPanel',
        '.challengePromptPane',
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


const DEFAULT_TRICK_GLYPH_SRC = {
  smuggle: './docs/assets/symbols/boneglyph_smuggle.png',
  trap: './docs/assets/symbols/boneglyph_trap.png',
  punish: './docs/assets/symbols/boneglyph_punish.png',
};

const DEFAULT_TRICK_BONE_DEFINITIONS = {
  smuggle: { id: 'smuggle', label: 'Smuggle Bone', description: 'When your Smuggle claim passes without challenge, its non-Smuggle claimed cards leave the table and go into another player\'s hand; human Smuggle users choose the target seat.', wild: false },
  trap: { id: 'trap', label: 'Trap Bone', description: 'If your challenged Trap claim is truthful and the challenge fails, transfer up to the claim size from your hand to the challenger; human defenders choose cards with state.trapSelection.', wild: true },
  punish: { id: 'punish', label: 'Punish Bone', description: 'Wild. During challenge betting, the challenger may arm Punish before opening, raising, or calling. Arming consumes one Punish card; if the challenge succeeds, the challenger gives claim-size cards to the challenged player.', wild: true },
};

function repeatIdsFromCounts(counts = {}) {
  const result = [];
  for (const [id, count] of Object.entries(counts || {})) {
    const safeCount = Math.max(0, Math.floor(Number(count) || 0));
    for (let i = 0; i < safeCount; i += 1) result.push(id);
  }
  return result;
}


function normalizeLayerManagerGuard(rawGuard = {}, fallbackGuard = {}) {
  return {
    allowlistSelectors: normalizeStringList(rawGuard.allowlistSelectors, fallbackGuard.allowlistSelectors),
    denylistSelectors: normalizeStringList(rawGuard.denylistSelectors, fallbackGuard.denylistSelectors),
    marginReset: {
      allowlistSelectors: normalizeStringList(rawGuard.marginReset?.allowlistSelectors, fallbackGuard.marginReset?.allowlistSelectors),
      denylistSelectors: normalizeStringList(rawGuard.marginReset?.denylistSelectors, fallbackGuard.marginReset?.denylistSelectors),
    },
    fillSize: {
      allowlistSelectors: normalizeStringList(rawGuard.fillSize?.allowlistSelectors, fallbackGuard.fillSize?.allowlistSelectors),
      denylistSelectors: normalizeStringList(rawGuard.fillSize?.denylistSelectors, fallbackGuard.fillSize?.denylistSelectors),
    },
  };
}

function normalizeLayerManagerContainsRules(rawRules, fallbackRules) {
  const source = Array.isArray(rawRules) ? rawRules : fallbackRules;
  return (source || [])
    .map((rule) => ({
      prefix: String(rule?.prefix || '').trim().toLowerCase(),
      contains: normalizeStringList(rule?.contains || rule?.terms, []).map((entry) => entry.toLowerCase()),
    }))
    .filter((rule) => rule.prefix && rule.contains.length);
}

function normalizeLayerManagerAssignments(rawAssignments, fallbackAssignments) {
  const source = Array.isArray(rawAssignments) ? rawAssignments : fallbackAssignments;
  return (source || [])
    .map((entry, index) => {
      const selectors = normalizeStringList(entry?.selectors, []);
      if (!selectors.length) return null;
      return {
        id: String(entry?.id || `assignment-${index}`).trim() || `assignment-${index}`,
        layer: String(entry?.layer || 'overlay').trim() || 'overlay',
        selectors,
        preserveSpace: entry?.preserveSpace !== false,
        keepOriginal: entry?.keepOriginal === true,
        promotedOpacity: Math.min(1, Math.max(0, finiteNumberOrDefault(entry?.promotedOpacity, 1))),
        ...(entry?.capturePromotedTextMetrics === true ? { capturePromotedTextMetrics: true } : {}),
      };
    })
    .filter(Boolean);
}

function normalizeLayerManagerConfig(rawLayerManager = {}) {
  const placementMode = normalizeOneOf(
    rawLayerManager.placementMode,
    DEFAULT_LAYER_MANAGER_CONFIG.placementMode,
    ['authored-space', 'screen-space'],
    { 'authored-coordinate': 'authored-space' },
  );
  const placementCoordinateSpace = normalizeOneOf(
    rawLayerManager.placementCoordinateSpace,
    DEFAULT_LAYER_MANAGER_CONFIG.placementCoordinateSpace,
    ['app', 'viewport'],
  );
  const portalScaleStrategy = normalizeOneOf(
    rawLayerManager.portalScaleStrategy,
    DEFAULT_LAYER_MANAGER_CONFIG.portalScaleStrategy,
    ['portal-transform', 'dimensions', 'none', 'legacy-screen-space'],
  );
  return {
    ...DEFAULT_LAYER_MANAGER_CONFIG,
    ...rawLayerManager,
    enabled: rawLayerManager.enabled !== false,
    hostZIndex: finiteNumberOrDefault(rawLayerManager.hostZIndex, DEFAULT_LAYER_MANAGER_CONFIG.hostZIndex),
    defaultPreserveSpace: rawLayerManager.defaultPreserveSpace !== false,
    normalizePromotedElementBox: rawLayerManager.normalizePromotedElementBox === true,
    normalizeBoxGuard: normalizeLayerManagerGuard(rawLayerManager.normalizeBoxGuard || {}, DEFAULT_LAYER_MANAGER_CONFIG.normalizeBoxGuard),
    preservePromotionTransformSelectors: normalizeStringList(rawLayerManager.preservePromotionTransformSelectors, DEFAULT_LAYER_MANAGER_CONFIG.preservePromotionTransformSelectors),
    disablePreservePromotionTransformSelectors: normalizeStringList(rawLayerManager.disablePreservePromotionTransformSelectors, DEFAULT_LAYER_MANAGER_CONFIG.disablePreservePromotionTransformSelectors),
    typographyBaselineRootSelector: String(rawLayerManager.typographyBaselineRootSelector || DEFAULT_LAYER_MANAGER_CONFIG.typographyBaselineRootSelector).trim() || DEFAULT_LAYER_MANAGER_CONFIG.typographyBaselineRootSelector,
    typographyBaselineFields: normalizeStringList(rawLayerManager.typographyBaselineFields, DEFAULT_LAYER_MANAGER_CONFIG.typographyBaselineFields),
    promotedTextMetricFields: normalizeStringList(rawLayerManager.promotedTextMetricFields, DEFAULT_LAYER_MANAGER_CONFIG.promotedTextMetricFields),
    promotedTextMetricAssignmentIds: normalizeStringList(rawLayerManager.promotedTextMetricAssignmentIds, DEFAULT_LAYER_MANAGER_CONFIG.promotedTextMetricAssignmentIds),
    transformSensitiveMarkerAttributes: normalizeStringList(rawLayerManager.transformSensitiveMarkerAttributes, DEFAULT_LAYER_MANAGER_CONFIG.transformSensitiveMarkerAttributes),
    transformSensitiveMarkerTerms: normalizeStringList(rawLayerManager.transformSensitiveMarkerTerms, DEFAULT_LAYER_MANAGER_CONFIG.transformSensitiveMarkerTerms).map((entry) => entry.toLowerCase()),
    preservePromotionTransformProjectIds: normalizeStringList(rawLayerManager.preservePromotionTransformProjectIds, DEFAULT_LAYER_MANAGER_CONFIG.preservePromotionTransformProjectIds).map((entry) => entry.toLowerCase()),
    preservePromotionTransformProjectIdPrefixes: normalizeStringList(rawLayerManager.preservePromotionTransformProjectIdPrefixes, DEFAULT_LAYER_MANAGER_CONFIG.preservePromotionTransformProjectIdPrefixes).map((entry) => entry.toLowerCase()),
    preservePromotionTransformProjectIdContainsRules: normalizeLayerManagerContainsRules(rawLayerManager.preservePromotionTransformProjectIdContainsRules, DEFAULT_LAYER_MANAGER_CONFIG.preservePromotionTransformProjectIdContainsRules),
    placementMode,
    placementCoordinateSpace,
    roundToPixels: rawLayerManager.roundToPixels === true || rawLayerManager.screenSpaceRoundToPixels === true,
    portalScaleStrategy: portalScaleStrategy === 'none' ? 'dimensions' : portalScaleStrategy,
    screenSpaceUseFixed: rawLayerManager.screenSpaceUseFixed !== false,
    screenSpaceRoundToPixels: rawLayerManager.screenSpaceRoundToPixels === true,
    updateOnScroll: rawLayerManager.updateOnScroll !== false,
    promoteByRootSelectors: normalizeStringList(rawLayerManager.promoteByRootSelectors, DEFAULT_LAYER_MANAGER_CONFIG.promoteByRootSelectors),
    excludeDescendantSelectors: normalizeStringList(rawLayerManager.excludeDescendantSelectors, DEFAULT_LAYER_MANAGER_CONFIG.excludeDescendantSelectors),
    layerOrder: normalizeStringList(rawLayerManager.layerOrder, DEFAULT_LAYER_MANAGER_CONFIG.layerOrder),
    assignments: normalizeLayerManagerAssignments(rawLayerManager.assignments, DEFAULT_LAYER_MANAGER_CONFIG.assignments),
  };
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
      wild: id === 'punish' ? true : rawDefinition?.wild === true,
    };
  }
  return definitions;
}

function normalizeSimpleCssLengthOrPercentage(rawValue, fallback) {
  const value = String(rawValue ?? '').trim();
  if (!value || !CSS_LENGTH_OR_PERCENT_PATTERN.test(value)) return fallback;
  const numericValue = Number.parseFloat(value);
  return Number.isFinite(numericValue) && numericValue > 0 ? value : fallback;
}

function normalizeFontFamily(rawValue, fallback) {
  const value = String(rawValue ?? '').trim();
  return value || fallback;
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
    gameplayShortcuts: normalizeGameplayShortcutsConfig(rawGameConfig.gameplayShortcuts),
    chat: normalizeChatConfig(rawGameConfig.chat),
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
      summaryDisplay: {
        glyphSizePx: Math.max(8, Number(rawGameConfig.trickBones?.summaryDisplay?.glyphSizePx) || 14),
        multiplyGlyphScale: Math.max(0.1, Math.min(1, Number(rawGameConfig.trickBones?.summaryDisplay?.multiplyGlyphScale) || 0.75)),
        gapPx: Math.max(0, Number(rawGameConfig.trickBones?.summaryDisplay?.gapPx) || 6),
        rowGapPx: Math.max(0, Number(rawGameConfig.trickBones?.summaryDisplay?.rowGapPx) || 4),
        marginTopPx: Math.max(0, Number(rawGameConfig.trickBones?.summaryDisplay?.marginTopPx) || 6),
        maxWidthPx: Math.max(1, Number(rawGameConfig.trickBones?.summaryDisplay?.maxWidthPx) || 220),
        fontSizeRem: Math.max(0.1, Number(rawGameConfig.trickBones?.summaryDisplay?.fontSizeRem) || 0.68),
        letterSpacingEm: Math.max(0, Number(rawGameConfig.trickBones?.summaryDisplay?.letterSpacingEm) || 0.05),
        seatAmountFontSize: normalizeSimpleCssLengthOrPercentage(rawGameConfig.trickBones?.summaryDisplay?.seatAmountFontSize, DEFAULT_TRICK_SUMMARY_SEAT_AMOUNT_FONT_SIZE),
        deckAmountFontSize: normalizeSimpleCssLengthOrPercentage(rawGameConfig.trickBones?.summaryDisplay?.deckAmountFontSize, DEFAULT_TRICK_SUMMARY_DECK_AMOUNT_FONT_SIZE),
        seatAmountColumnMinEm: Math.max(0.1, Number(rawGameConfig.trickBones?.summaryDisplay?.seatAmountColumnMinEm) || 1.2),
        deckAmountColumnMinEm: Math.max(0.1, Number(rawGameConfig.trickBones?.summaryDisplay?.deckAmountColumnMinEm) || 1.5),
        amountFontFamily: normalizeFontFamily(rawGameConfig.trickBones?.summaryDisplay?.amountFontFamily, DEFAULT_TRICK_SUMMARY_AMOUNT_FONT_FAMILY),
        seatColor: String(rawGameConfig.trickBones?.summaryDisplay?.seatColor || '#fff'),
        deckColor: String(rawGameConfig.trickBones?.summaryDisplay?.deckColor || '#fff'),
        arrowText: String(rawGameConfig.trickBones?.summaryDisplay?.arrowText || '\u00A0'),
        glyphFilter: String(rawGameConfig.trickBones?.summaryDisplay?.glyphFilter || 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.55))'),
        deckGlyphFilter: String(rawGameConfig.trickBones?.summaryDisplay?.deckGlyphFilter || 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.55))'),
        multiplyGlyphFilter: String(rawGameConfig.trickBones?.summaryDisplay?.multiplyGlyphFilter || 'brightness(0) invert(1) drop-shadow(0 1px 2px rgba(0,0,0,0.55))'),
      },
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
      expressions: {
        ...(rawGameConfig.portrait?.expressions || {}),
        durationMs: Math.max(1, Number(rawGameConfig.portrait?.expressions?.durationMs) || DEFAULT_PORTRAIT_EXPRESSION_DURATION_MS),
        restingChipNeutralBandRatio: (() => {
          const rawNeutralBandRatio = Number(rawGameConfig.portrait?.expressions?.restingChipNeutralBandRatio);
          return Number.isFinite(rawNeutralBandRatio)
            ? Math.max(0, rawNeutralBandRatio)
            : DEFAULT_RESTING_CHIP_NEUTRAL_BAND_RATIO;
        })(),
      },
      emotes: {
        ...(rawGameConfig.portrait?.emotes || {}),
        laugh: (() => {
          const rawLaugh = rawGameConfig.portrait?.emotes?.laugh || {};
          return {
            ...rawLaugh,
            puffCount: Math.max(1, Math.floor(Number(rawLaugh.puffCount) || DEFAULT_PORTRAIT_LAUGH_EMOTE_CONFIG.puffCount)),
            inflateDurationSeconds: Math.max(0, Number(rawLaugh.inflateDurationSeconds) || DEFAULT_PORTRAIT_LAUGH_EMOTE_CONFIG.inflateDurationSeconds),
            deflateDurationSeconds: Math.max(0, Number(rawLaugh.deflateDurationSeconds) || DEFAULT_PORTRAIT_LAUGH_EMOTE_CONFIG.deflateDurationSeconds),
            pauseDurationSeconds: Math.max(0, Number(rawLaugh.pauseDurationSeconds) || DEFAULT_PORTRAIT_LAUGH_EMOTE_CONFIG.pauseDurationSeconds),
            mouthLaughMs: Math.max(1, Number(rawLaugh.mouthLaughMs) || DEFAULT_PORTRAIT_LAUGH_EMOTE_CONFIG.mouthLaughMs),
            mouthRestExpression: String(rawLaugh.mouthRestExpression || DEFAULT_PORTRAIT_LAUGH_EMOTE_CONFIG.mouthRestExpression),
          };
        })(),
        emojiOutlineEnabled: rawGameConfig.portrait?.emotes?.emojiOutlineEnabled !== false,
      },
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
          materialTags: normalizeStringMap(rawRandomization.materialTags, DEFAULT_PORTRAIT_RANDOMIZATION_CONFIG.materialTags),
          clothHoodColorSourceSlots: normalizeStringArray(rawRandomization.clothHoodColorSourceSlots, DEFAULT_PORTRAIT_RANDOMIZATION_CONFIG.clothHoodColorSourceSlots),
          npcRequiredClothingPaletteKeys: normalizeStringArray(rawRandomization.npcRequiredClothingPaletteKeys, DEFAULT_PORTRAIT_RANDOMIZATION_CONFIG.npcRequiredClothingPaletteKeys),
          clothingFallbackTintSlotsBySlot: normalizeStringMap(rawRandomization.clothingFallbackTintSlotsBySlot, DEFAULT_PORTRAIT_RANDOMIZATION_CONFIG.clothingFallbackTintSlotsBySlot),
        };
      })(),
    },
    ai: normalizeAiConfig(rawGameConfig.ai),
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
      punishBoneSpin: normalizePunishBoneSpinConfig(rawGameConfig.layout?.punishBoneSpin),
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
      seats: {
        responsiveScale: {
          enabled: rawGameConfig.layout?.seats?.responsiveScale?.enabled !== false,
          minScale: Math.max(0.35, Math.min(1, Number(rawGameConfig.layout?.seats?.responsiveScale?.minScale) || 0.56)),
          maxScale: Math.max(0.5, Math.min(1.5, Number(rawGameConfig.layout?.seats?.responsiveScale?.maxScale) || 1)),
          sidebarReferenceWidthPx: Math.max(1, Number(rawGameConfig.layout?.seats?.responsiveScale?.sidebarReferenceWidthPx) || 251),
          sidebarReferenceHeightPx: Math.max(1, Number(rawGameConfig.layout?.seats?.responsiveScale?.sidebarReferenceHeightPx) || 681),
          sidebarReferenceSeatCount: Math.max(1, Number(rawGameConfig.layout?.seats?.responsiveScale?.sidebarReferenceSeatCount) || 3),
          humanReferenceWidthPx: Math.max(1, Number(rawGameConfig.layout?.seats?.responsiveScale?.humanReferenceWidthPx) || 373),
          humanReferenceHeightPx: Math.max(1, Number(rawGameConfig.layout?.seats?.responsiveScale?.humanReferenceHeightPx) || 187),
        },
        typography: {
          nameFontRem: Math.max(0.1, Number(rawGameConfig.layout?.seats?.typography?.nameFontRem) || 0.78),
          metaFontRem: Math.max(0.1, Number(rawGameConfig.layout?.seats?.typography?.metaFontRem) || 0.68),
          statusFontRem: Math.max(0.1, Number(rawGameConfig.layout?.seats?.typography?.statusFontRem) || 0.68),
          titleFontRem: Math.max(0.1, Number(rawGameConfig.layout?.seats?.typography?.titleFontRem) || 0.95),
          letterSpacingEm: Math.max(0, Number(rawGameConfig.layout?.seats?.typography?.letterSpacingEm) || 0.10),
          lineHeight: Math.max(0.5, Number(rawGameConfig.layout?.seats?.typography?.lineHeight) || 1.25),
        },
        spacing: {
          sidebarGapPx: Math.max(0, Number(rawGameConfig.layout?.seats?.spacing?.sidebarGapPx) || 8),
          seatGapPx: Math.max(0, Number(rawGameConfig.layout?.seats?.spacing?.seatGapPx) || 8),
          seatPaddingPx: Math.max(0, Number(rawGameConfig.layout?.seats?.spacing?.seatPaddingPx) || 9),
          seatMetaMarginTopPx: Math.max(0, Number(rawGameConfig.layout?.seats?.spacing?.seatMetaMarginTopPx) || 4),
          seatStatusMarginTopPx: Math.max(0, Number(rawGameConfig.layout?.seats?.spacing?.seatStatusMarginTopPx) || 6),
          handPreviewGapPx: Math.max(0, Number(rawGameConfig.layout?.seats?.spacing?.handPreviewGapPx) || 2),
          handPreviewMarginTopPx: Math.max(0, Number(rawGameConfig.layout?.seats?.spacing?.handPreviewMarginTopPx) || 5),
          handPreviewCardWidthPx: Math.max(1, Number(rawGameConfig.layout?.seats?.spacing?.handPreviewCardWidthPx) || 10),
          titlePaddingTopScale: Math.max(0, Number(rawGameConfig.layout?.seats?.spacing?.titlePaddingTopScale) || 0.67),
          titlePaddingXScale: Math.max(0, Number(rawGameConfig.layout?.seats?.spacing?.titlePaddingXScale) || 1.11),
          titlePaddingBottomScale: Math.max(0, Number(rawGameConfig.layout?.seats?.spacing?.titlePaddingBottomScale) || 0.22),
          humanPaddingScale: Math.max(0, Number(rawGameConfig.layout?.seats?.spacing?.humanPaddingScale) || 1.33),
          humanGapScale: Math.max(0, Number(rawGameConfig.layout?.seats?.spacing?.humanGapScale) || 1.25),
          avatarMaxWidthPct: Math.max(1, Math.min(100, Number(rawGameConfig.layout?.seats?.spacing?.avatarMaxWidthPct) || 52)),
        },
      },
      layerManager: normalizeLayerManagerConfig(rawGameConfig.layout?.layerManager || {}),
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
    uiWobblyOutlines: normalizeUiWobblyOutlinesConfig(rawGameConfig.uiWobblyOutlines),
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
    cssRootVars: (() => {
      const punishBoneSpin = normalizePunishBoneSpinConfig(rawGameConfig.layout?.punishBoneSpin);
      return {
        ...DEFAULT_CSS_ROOT_VARS,
        ...(rawGameConfig.cssRootVars || {}),
        '--punish-bone-spin-duration': `${punishBoneSpin.spinDurationMs}ms`,
        '--punish-bone-spin-reduced-motion-duration': `${punishBoneSpin.reducedMotionSpinDurationMs}ms`,
        '--punish-bone-spin-start-rotation': '0turn',
        '--punish-bone-spin-mid-rotation': `${punishBoneSpin.rotationTurns / 2}turn`,
        '--punish-bone-spin-end-rotation': `${punishBoneSpin.rotationTurns}turn`,
        '--punish-bone-spin-blur': `${punishBoneSpin.blurPx}px`,
        '--punish-bone-spin-scale-x-min': String(punishBoneSpin.scaleXMin),
        '--punish-bone-spin-shadow-blur': `${punishBoneSpin.shadowBlurPx}px`,
      };
    })(),
  };
}

export function getScratchbonesGameConfig({ rootConfig, reportError, debugEnabled = true }) {
  validateScratchbonesGameConfig(rootConfig, { reportError, debugEnabled });
  const normalizedGameConfig = normalizeScratchbonesGameConfig(rootConfig?.game || {});
  if (rootConfig && typeof rootConfig === 'object') {
    rootConfig.game = normalizedGameConfig;
  }
  return normalizedGameConfig;
}
