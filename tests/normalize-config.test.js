'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

async function loadNormalizer() {
  const sourcePath = path.resolve(__dirname, '../main/docs/scratchbones/config/normalizeScratchbonesGameConfig.js');
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'scratchbones-normalizer-'));
  const modulePath = path.join(tempDir, 'normalizeScratchbonesGameConfig.mjs');
  await fs.copyFile(sourcePath, modulePath);
  return import(modulePath);
}

describe('normalizeScratchbonesGameConfig AI difficulty ranks', () => {
  it('preserves custom boss ranks and lets seats resolve to them', async () => {
    const { normalizeScratchbonesGameConfig } = await loadNormalizer();
    const config = normalizeScratchbonesGameConfig({
      ai: {
        defaultDifficultyRank: 'boss',
        difficultyRanks: {
          boss: {
            extends: 'hard',
            challengeThresholdModifier: -0.08,
            challengeRandomNudgeMax: 0.035,
          },
        },
        seatDifficultyRanks: { 3: 'boss' },
      },
    });

    assert.equal(config.ai.defaultDifficultyRank, 'boss');
    assert.equal(config.ai.seatDifficultyRanks['3'], 'boss');
    assert.equal(config.ai.difficultyRanks.boss.challengeThreshold, config.ai.difficultyRanks.hard.challengeThreshold);
    assert.equal(config.ai.difficultyRanks.boss.challengeThresholdModifier, -0.08);
    assert.equal(config.ai.difficultyRanks.boss.challengeRandomNudgeMax, 0.035);
  });


  it('normalizes card-counting accuracy by difficulty rank', async () => {
    const { normalizeScratchbonesGameConfig } = await loadNormalizer();
    const config = normalizeScratchbonesGameConfig({
      ai: {
        difficultyRanks: {
          easy: { cardCountingAccuracy: -1 },
          hard: { cardCountingAccuracy: 1.25 },
          boss: { extends: 'hard', cardCountingAccuracy: 0.98 },
        },
      },
    });

    assert.equal(config.ai.difficultyRanks.easy.cardCountingAccuracy, 0);
    assert.equal(config.ai.difficultyRanks.normal.cardCountingAccuracy, 0.65);
    assert.equal(config.ai.difficultyRanks.hard.cardCountingAccuracy, 1);
    assert.equal(config.ai.difficultyRanks.boss.cardCountingAccuracy, 0.98);
  });

  it('falls unknown custom rank inheritance back to normal safely', async () => {
    const { normalizeScratchbonesGameConfig } = await loadNormalizer();
    const config = normalizeScratchbonesGameConfig({
      ai: {
        difficultyRanks: {
          boss: {
            extends: 'missing-rank',
            bettingRaiseMistakeChance: 0,
          },
        },
        seatDifficultyRanks: { 2: 'missing-rank' },
      },
    });

    assert.equal(config.ai.defaultDifficultyRank, 'normal');
    assert.equal(config.ai.seatDifficultyRanks['2'], 'normal');
    assert.equal(config.ai.difficultyRanks.boss.challengeThreshold, config.ai.difficultyRanks.normal.challengeThreshold);
    assert.equal(config.ai.difficultyRanks.boss.bettingRaiseMistakeChance, 0);
  });
});

describe('normalizeScratchbonesGameConfig portrait randomization', () => {
  it('defaults NPC clothing palette repair to B and C tint slots', async () => {
    const { normalizeScratchbonesGameConfig } = await loadNormalizer();
    const config = normalizeScratchbonesGameConfig({});

    assert.deepEqual(config.portrait.randomization.npcRequiredClothingPaletteKeys, ['B', 'C']);
    assert.deepEqual(config.portrait.randomization.clothingFallbackTintSlotsBySlot, {
      hat: 'HAT',
      hood: 'HOOD',
      torsoCosmetic: 'CLOTH',
      armCosmetic: 'CLOTH',
    });
  });

  it('normalizes custom NPC clothing palette repair settings', async () => {
    const { normalizeScratchbonesGameConfig } = await loadNormalizer();
    const config = normalizeScratchbonesGameConfig({
      portrait: {
        randomization: {
          npcRequiredClothingPaletteKeys: [' B ', '', 'C', null, 'D'],
          clothingFallbackTintSlotsBySlot: {
            hat: ' CUSTOM_HAT ',
            bad: '',
          },
        },
      },
    });

    assert.deepEqual(config.portrait.randomization.npcRequiredClothingPaletteKeys, ['B', 'C', 'D']);
    assert.equal(config.portrait.randomization.clothingFallbackTintSlotsBySlot.hat, 'CUSTOM_HAT');
    assert.equal(config.portrait.randomization.clothingFallbackTintSlotsBySlot.hood, 'HOOD');
    assert.equal(config.portrait.randomization.clothingFallbackTintSlotsBySlot.bad, undefined);
  });
});


describe('getScratchbonesGameConfig window config write-back', () => {
  it('stores normalized defaults back on the root config for legacy window readers', async () => {
    const { getScratchbonesGameConfig } = await loadNormalizer();
    const rootConfig = { game: {} };
    const config = getScratchbonesGameConfig({
      rootConfig,
      reportError: (message) => message,
      debugEnabled: true,
    });

    assert.equal(rootConfig.game, config);
    assert.deepEqual(rootConfig.game.portrait.randomization.npcRequiredClothingPaletteKeys, ['B', 'C']);
    assert.deepEqual(rootConfig.game.portrait.randomization.clothingFallbackTintSlotsBySlot, {
      hat: 'HAT',
      hood: 'HOOD',
      torsoCosmetic: 'CLOTH',
      armCosmetic: 'CLOTH',
    });
  });
});

describe('normalizeScratchbonesGameConfig trick bones', () => {
  it('keeps Punish Bones wild even when raw config marks them non-wild', async () => {
    const { normalizeScratchbonesGameConfig } = await loadNormalizer();
    const config = normalizeScratchbonesGameConfig({
      trickBones: {
        definitions: {
          punish: { wild: false },
        },
      },
    });

    assert.equal(config.trickBones.definitions.punish.wild, true);
  });

  it('normalizes configurable trick summary count typography', async () => {
    const { normalizeScratchbonesGameConfig } = await loadNormalizer();
    const config = normalizeScratchbonesGameConfig({
      trickBones: {
        summaryDisplay: {
          seatAmountFontSize: ' 1.2rem ',
          deckAmountFontSize: '14px',
          seatAmountColumnMinEm: 0,
          deckAmountColumnMinEm: 2.4,
          amountFontFamily: ' CustomCountFont, sans-serif ',
        },
      },
    });

    assert.equal(config.trickBones.summaryDisplay.seatAmountFontSize, '1.2rem');
    assert.equal(config.trickBones.summaryDisplay.deckAmountFontSize, '14px');
    assert.equal(config.trickBones.summaryDisplay.seatAmountColumnMinEm, 1.2);
    assert.equal(config.trickBones.summaryDisplay.deckAmountColumnMinEm, 2.4);
    assert.equal(config.trickBones.summaryDisplay.amountFontFamily, 'CustomCountFont, sans-serif');
  });

  it('falls invalid trick summary font sizes and blank font families back to defaults', async () => {
    const { normalizeScratchbonesGameConfig } = await loadNormalizer();
    const config = normalizeScratchbonesGameConfig({
      trickBones: {
        summaryDisplay: {
          seatAmountFontSize: 'huge',
          deckAmountFontSize: '   ',
          amountFontFamily: '   ',
        },
      },
    });

    assert.equal(config.trickBones.summaryDisplay.seatAmountFontSize, '160%');
    assert.equal(config.trickBones.summaryDisplay.deckAmountFontSize, '250%');
    assert.equal(config.trickBones.summaryDisplay.amountFontFamily, "'Khymeryyanroman4', Inter, system-ui, sans-serif");
  });

  it('keeps percentage trick summary amount font sizes valid', async () => {
    const { normalizeScratchbonesGameConfig } = await loadNormalizer();
    const config = normalizeScratchbonesGameConfig({
      trickBones: {
        summaryDisplay: {
          seatAmountFontSize: '140%',
          deckAmountFontSize: '220%',
        },
      },
    });

    assert.equal(config.trickBones.summaryDisplay.seatAmountFontSize, '140%');
    assert.equal(config.trickBones.summaryDisplay.deckAmountFontSize, '220%');
  });
});
