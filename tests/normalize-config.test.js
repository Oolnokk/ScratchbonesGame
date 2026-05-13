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
