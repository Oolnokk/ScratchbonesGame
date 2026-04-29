export function createLayoutDiagnosticsState() {
  return {
    fitStages: {},
    overlap: { overlaps: [], stage: 'none', snapshot: [] },
    renderedScreenSpaceDelta: { modeA: null, modeB: null, deltas: [] },
    renderedScreenSpaceTopDrift: [],
    renderedScreenSpaceGroupDrift: [],
    renderedScreenSpaceParity: { policy: null, thresholds: {}, summary: { pass: true, failing: [], warnings: [] } },
  };
}

const PROMOTED_SUBTREE_GROUP_RULES = [
  { group: 'sidebar seats', test: (id) => id === 'sidebar' || id.startsWith('seat-') || id.startsWith('seat-avatar-') },
  { group: 'claim cluster', test: (id) => id.startsWith('claim-') || id === 'claim-cluster' },
  { group: 'betting anchors', test: (id) => id.startsWith('betting-') || id.startsWith('stake-') },
  { group: 'avatars', test: (id) => id.startsWith('avatar-') || id.includes('avatar') },
];

function toFiniteNumber(value) {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function rectDelta(aRect, bRect) {
  const fields = ['x', 'y', 'width', 'height', 'left', 'top', 'right', 'bottom'];
  const delta = {};
  for (const field of fields) {
    const a = toFiniteNumber(aRect?.[field]);
    const b = toFiniteNumber(bRect?.[field]);
    delta[field] = a == null || b == null ? null : Number((b - a).toFixed(3));
  }
  return delta;
}

export function compareRenderedScreenSpaceModes(renderedScreenSpace, modeA = 'original', modeB = 'layered') {
  const aEntries = renderedScreenSpace?.[modeA] || {};
  const bEntries = renderedScreenSpace?.[modeB] || {};
  const keys = Array.from(new Set([...Object.keys(aEntries), ...Object.keys(bEntries)])).sort();
  return keys.map((key) => {
    const a = aEntries[key] || null;
    const b = bEntries[key] || null;
    return {
      id: key,
      inModeA: Boolean(a),
      inModeB: Boolean(b),
      transformA: a?.transform || null,
      transformB: b?.transform || null,
      rectDelta: rectDelta(a?.rect, b?.rect),
    };
  });
}

function driftMagnitude(rectDelta) {
  if (!rectDelta || typeof rectDelta !== 'object') return 0;
  const components = ['x', 'y', 'width', 'height']
    .map((field) => Math.abs(Number(rectDelta[field]) || 0));
  return Number(components.reduce((total, value) => total + value, 0).toFixed(3));
}

export function summarizeRenderedScreenSpaceDrift(deltas, { minMagnitude = 1, topN = 8 } = {}) {
  const numericMinMagnitude = Math.max(0, Number(minMagnitude) || 0);
  const numericTopN = Math.max(1, Number(topN) || 1);
  return (Array.isArray(deltas) ? deltas : [])
    .map((entry) => ({
      ...entry,
      magnitude: driftMagnitude(entry?.rectDelta),
    }))
    .filter((entry) => entry.inModeA && entry.inModeB && entry.magnitude >= numericMinMagnitude)
    .sort((a, b) => b.magnitude - a.magnitude)
    .slice(0, numericTopN);
}

function classifyPromotedSubtreeGroup(id) {
  const normalizedId = String(id || '').trim().toLowerCase();
  if (!normalizedId) return null;
  const match = PROMOTED_SUBTREE_GROUP_RULES.find((rule) => rule.test(normalizedId));
  return match ? match.group : null;
}

export function summarizeRenderedScreenSpaceDriftByPromotedSubtree(deltas) {
  const grouped = new Map();
  for (const entry of Array.isArray(deltas) ? deltas : []) {
    if (!entry?.inModeA || !entry?.inModeB) continue;
    const group = classifyPromotedSubtreeGroup(entry.id);
    if (!group) continue;
    const magnitude = driftMagnitude(entry.rectDelta);
    if (!grouped.has(group)) grouped.set(group, { count: 0, totalMagnitude: 0, maxMagnitude: 0 });
    const bucket = grouped.get(group);
    bucket.count += 1;
    bucket.totalMagnitude += magnitude;
    bucket.maxMagnitude = Math.max(bucket.maxMagnitude, magnitude);
  }
  return Array.from(grouped.entries())
    .map(([group, bucket]) => ({
      group,
      count: bucket.count,
      averageMagnitude: Number((bucket.totalMagnitude / Math.max(1, bucket.count)).toFixed(3)),
      maxMagnitude: Number(bucket.maxMagnitude.toFixed(3)),
    }))
    .sort((a, b) => b.maxMagnitude - a.maxMagnitude);
}


function evaluateRenderedScreenSpaceParity(deltas, parityConfig = {}) {
  const thresholds = {
    maxAbsDx: Math.max(0, Number(parityConfig.maxAbsDx) || 0),
    maxAbsDy: Math.max(0, Number(parityConfig.maxAbsDy) || 0),
    maxAbsDw: Math.max(0, Number(parityConfig.maxAbsDw) || 0),
    maxAbsDh: Math.max(0, Number(parityConfig.maxAbsDh) || 0),
  };
  const policy = String(parityConfig.transformMismatchPolicy || 'warn').toLowerCase();
  const transformMismatchPolicy = policy === 'fail' || policy === 'ignore' ? policy : 'warn';
  const failing = [];
  const warnings = [];
  for (const entry of Array.isArray(deltas) ? deltas : []) {
    if (!entry?.inModeA || !entry?.inModeB) continue;
    const rectDelta = entry.rectDelta || {};
    const checks = [
      ['dx', Math.abs(Number(rectDelta.x) || 0), thresholds.maxAbsDx],
      ['dy', Math.abs(Number(rectDelta.y) || 0), thresholds.maxAbsDy],
      ['dw', Math.abs(Number(rectDelta.width) || 0), thresholds.maxAbsDw],
      ['dh', Math.abs(Number(rectDelta.height) || 0), thresholds.maxAbsDh],
    ];
    for (const [field, magnitude, maxAllowed] of checks) {
      if (magnitude > maxAllowed) failing.push({ id: entry.id, field, magnitude, maxAllowed });
    }
    const hasTransformMismatch = entry.transformA !== entry.transformB;
    if (!hasTransformMismatch || transformMismatchPolicy === 'ignore') continue;
    const payload = { id: entry.id, transformA: entry.transformA, transformB: entry.transformB };
    if (transformMismatchPolicy === 'fail') failing.push({ ...payload, field: 'transformMismatch' });
    if (transformMismatchPolicy === 'warn') warnings.push(payload);
  }
  return {
    policy: transformMismatchPolicy,
    thresholds,
    summary: {
      pass: failing.length === 0,
      failing,
      warnings,
    },
  };
}

export function updateLayoutDiagnosticsState(layoutDiagnostics, layoutResult) {
  if (!layoutDiagnostics || !layoutResult) return layoutDiagnostics;
  layoutDiagnostics.fitStages = layoutResult.fitSummary || {};
  layoutDiagnostics.overlap = layoutResult.overlap || { overlaps: [], stage: 'none', snapshot: [] };
  if (layoutResult.renderedScreenSpace) {
    const modeA = String(layoutResult.renderedScreenSpaceBaselineMode || 'original');
    const modeB = String(layoutResult.renderedScreenSpaceCompareMode || 'layered');
    const driftSummary = layoutResult.renderedScreenSpaceDriftSummary || {};
    const deltas = compareRenderedScreenSpaceModes(layoutResult.renderedScreenSpace, modeA, modeB);
    layoutDiagnostics.renderedScreenSpaceDelta = {
      modeA,
      modeB,
      deltas,
    };
    layoutDiagnostics.renderedScreenSpaceTopDrift = summarizeRenderedScreenSpaceDrift(deltas, driftSummary);
    layoutDiagnostics.renderedScreenSpaceGroupDrift = summarizeRenderedScreenSpaceDriftByPromotedSubtree(deltas);
    layoutDiagnostics.renderedScreenSpaceParity = evaluateRenderedScreenSpaceParity(deltas, layoutResult.renderedScreenSpaceParity);
  }
  return layoutDiagnostics;
}

export function resetLayoutDiagnosticsState(layoutDiagnostics) {
  if (!layoutDiagnostics) return layoutDiagnostics;
  layoutDiagnostics.fitStages = {};
  layoutDiagnostics.overlap = { overlaps: [], stage: 'none', snapshot: [] };
  layoutDiagnostics.renderedScreenSpaceDelta = { modeA: null, modeB: null, deltas: [] };
  layoutDiagnostics.renderedScreenSpaceTopDrift = [];
  layoutDiagnostics.renderedScreenSpaceGroupDrift = [];
  layoutDiagnostics.renderedScreenSpaceParity = { policy: null, thresholds: {}, summary: { pass: true, failing: [], warnings: [] } };
  return layoutDiagnostics;
}
