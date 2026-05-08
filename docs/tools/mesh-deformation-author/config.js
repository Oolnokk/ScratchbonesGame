'use strict';
window.MESH_DEFORMATION_AUTHOR_CONFIG = {
  speciesIndexUrl: '../../config/species/index.json',
  configBase: '../../config/species/',
  assetsBase: '../../assets/',
  canvasSize: 512,
  pointClickThreshold: 18,
  grid: {
    min: 2,
    max: 16,
    defaultCols: 4,
    defaultRows: 4
  },
  animation: {
    defaultSpeedSeconds: 0.8,
    defaultPoseCount: 4,
    minPoseCount: 2,
    maxPoseCount: 12,
    defaultPoseDurationSeconds: 0.8,
    minPoseDurationSeconds: 0.1,
    maxPoseDurationSeconds: 10
  },
  avatarPreview: {
    defaultMode: 'avatar',
    randomSeedDefault: 'mesh-author-seed',
    contentFitEnabled: true,
    contentFitPaddingPx: 24,
    contentAlphaThreshold: 8,
    omitHeadSpriteAndCosmeticsDefault: false
  }
};
