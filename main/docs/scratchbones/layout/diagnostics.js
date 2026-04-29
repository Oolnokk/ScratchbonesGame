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
  { group: 'claim avatars', test: (id) => id.startsWith('claim-avatar') || id.includes('claim') && id.includes('avatar') },
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
      rectA: a?.rect || null,
      rectB: b?.rect || null,
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

function parseMatrixTransform(transformValue) {
  const value = String(transformValue || '').trim();
  if (!value || value === 'none') return null;
  const match = value.match(/^matrix\(([^)]+)\)$/i);
  if (!match) return null;
  const parts = match[1].split(',').map((part) => Number(part.trim()));
  if (parts.length !== 6 || parts.some((part) => !Number.isFinite(part))) return null;
  return parts;
}

function transformsEquivalent(transformA, transformB, epsilon = 0.001) {
  if (transformA === transformB) return true;
  const matrixA = parseMatrixTransform(transformA);
  const matrixB = parseMatrixTransform(transformB);
  if (!matrixA || !matrixB) return false;
  for (let index = 0; index < matrixA.length; index += 1) {
    if (Math.abs(matrixA[index] - matrixB[index]) > epsilon) return false;
  }
  return true;
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

function parseSidebarSeatId(id) {
  const match = String(id || '').trim().toLowerCase().match(/^seat-(\d+)$/);
  return match ? Number(match[1]) : null;
}

function assertSidebarSeatLayoutParity(entries, thresholds) {
  const maxSpacingInflation = Number(thresholds.maxSidebarSeatSpacingInflation);
  if (!(maxSpacingInflation > 0)) return;
  const seats = entries
    .map((entry) => {
      const seatId = parseSidebarSeatId(entry.id);
      if (seatId == null) return null;
      const aTop = toFiniteNumber(entry.rectA?.top);
      const aBottom = toFiniteNumber(entry.rectA?.bottom);
      const bTop = toFiniteNumber(entry.rectB?.top);
      const bBottom = toFiniteNumber(entry.rectB?.bottom);
      if (aTop == null || aBottom == null || bTop == null || bBottom == null) return null;
      return { seatId, centerA: (aTop + aBottom) / 2, centerB: (bTop + bBottom) / 2 };
    })
    .filter(Boolean)
    .sort((a, b) => a.seatId - b.seatId);
  if (seats.length < 2) return;
  for (let index = 1; index < seats.length; index += 1) {
    const previous = seats[index - 1];
    const current = seats[index];
    const originalGap = current.centerA - previous.centerA;
    const layeredGap = current.centerB - previous.centerB;
    if (!(originalGap > 0) || !(layeredGap > 0)) {
      throw new Error(`[layout diagnostics] sidebar seat order mismatch between original/layered for seat-${previous.seatId}→seat-${current.seatId}: originalGap=${originalGap.toFixed(3)}, layeredGap=${layeredGap.toFixed(3)}.`);
    }
    const inflation = layeredGap / originalGap;
    if (inflation > maxSpacingInflation) {
      throw new Error(`[layout diagnostics] sidebar seat vertical spacing inflation exceeded threshold for seat-${previous.seatId}→seat-${current.seatId}: inflation=${inflation.toFixed(3)} threshold=${maxSpacingInflation.toFixed(3)}.`);
    }
  }
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


function matchesProtectedIdPattern(id, pattern) {
  const normalizedId = String(id || '').trim().toLowerCase();
  const normalizedPattern = String(pattern || '').trim().toLowerCase();
  if (!normalizedId || !normalizedPattern) return false;
  if (!normalizedPattern.includes('*')) return normalizedId === normalizedPattern;
  const segments = normalizedPattern.split('*');
  let cursor = 0;
  for (let index = 0; index < segments.length; index += 1) {
    const segment = segments[index];
    if (!segment) continue;
    const next = normalizedId.indexOf(segment, cursor);
    if (next === -1) return false;
    if (index === 0 && !normalizedPattern.startsWith('*') && next !== 0) return false;
    cursor = next + segment.length;
  }
  if (!normalizedPattern.endsWith('*')) {
    const tail = segments[segments.length - 1] || '';
    return normalizedId.endsWith(tail);
  }
  return true;
}

function evaluateRenderedScreenSpaceParity(deltas, parityConfig = {}) {
  const thresholds = {
    maxAbsDx: Math.max(0, Number(parityConfig.maxAbsDx) || 0),
    maxAbsDy: Math.max(0, Number(parityConfig.maxAbsDy) || 0),
    maxAbsDw: Math.max(0, Number(parityConfig.maxAbsDw) || 0),
    maxAbsDh: Math.max(0, Number(parityConfig.maxAbsDh) || 0),
    maxElementMagnitude: Math.max(0, Number(parityConfig.maxElementMagnitude) || 0),
    maxGroupAverageMagnitude: Math.max(0, Number(parityConfig.maxGroupAverageMagnitude) || 0),
    maxGroupMagnitude: Math.max(0, Number(parityConfig.maxGroupMagnitude) || 0),
    maxSidebarSeatSpacingInflation: Math.max(0, Number(parityConfig.maxSidebarSeatSpacingInflation) || 0),
    requireTransformMatchFor: Array.isArray(parityConfig.requireTransformMatchFor)
      ? parityConfig.requireTransformMatchFor.map((group) => String(group || '').trim().toLowerCase()).filter(Boolean)
      : [],
    requireTransformMatchForSelectors: Array.isArray(parityConfig.requireTransformMatchForSelectors)
      ? parityConfig.requireTransformMatchForSelectors.map((selector) => String(selector || '').trim().toLowerCase()).filter(Boolean)
      : [],
  };
  const policy = String(parityConfig.transformMismatchPolicy || 'warn').toLowerCase();
  const transformMismatchPolicy = policy === 'fail' || policy === 'ignore' ? policy : 'warn';
  const failing = [];
  const warnings = [];
  const trackedDeltas = [];
  assertSidebarSeatLayoutParity(deltas, thresholds);

  for (const entry of Array.isArray(deltas) ? deltas : []) {
    if (!entry?.inModeA || !entry?.inModeB) continue;
    const magnitude = driftMagnitude(entry.rectDelta);
    trackedDeltas.push({ ...entry, magnitude });
    const rectDelta = entry.rectDelta || {};
    const checks = [
      ['dx', Math.abs(Number(rectDelta.x) || 0), thresholds.maxAbsDx],
      ['dy', Math.abs(Number(rectDelta.y) || 0), thresholds.maxAbsDy],
      ['dw', Math.abs(Number(rectDelta.width) || 0), thresholds.maxAbsDw],
      ['dh', Math.abs(Number(rectDelta.height) || 0), thresholds.maxAbsDh],
    ];
    for (const [field, measured, maxAllowed] of checks) {
      if (measured > maxAllowed) failing.push({ id: entry.id, field, magnitude: measured, maxAllowed });
    }
    if (magnitude > thresholds.maxElementMagnitude) {
      failing.push({ id: entry.id, field: 'elementMagnitude', magnitude, maxAllowed: thresholds.maxElementMagnitude });
    }
    const strictTransformMismatch = entry.transformA !== entry.transformB;
    const matrixEquivalent = transformsEquivalent(entry.transformA, entry.transformB);
    const hasTransformMismatch = !matrixEquivalent;
    const isProtectedSelector = thresholds.requireTransformMatchForSelectors.some((pattern) => matchesProtectedIdPattern(entry.id, pattern));
    if (isProtectedSelector && strictTransformMismatch) {
      failing.push({ id: entry.id, field: 'transformMismatchStrict', transformA: entry.transformA, transformB: entry.transformB });
      continue;
    }
    if (!hasTransformMismatch || transformMismatchPolicy === 'ignore') continue;
    const payload = { id: entry.id, transformA: entry.transformA, transformB: entry.transformB, matrixEquivalent };
    if (transformMismatchPolicy === 'fail') failing.push({ ...payload, field: 'transformMismatch' });
    if (transformMismatchPolicy === 'warn') warnings.push(payload);
  }

  const groupSummaries = summarizeRenderedScreenSpaceDriftByPromotedSubtree(trackedDeltas).map((groupEntry) => {
    const groupKey = String(groupEntry.group || '').toLowerCase();
    const failAverage = groupEntry.averageMagnitude > thresholds.maxGroupAverageMagnitude;
    const failMax = groupEntry.maxMagnitude > thresholds.maxGroupMagnitude;
    const groupWarnings = [];
    const groupFailing = [];
    if (failAverage) groupFailing.push({ field: 'groupAverageMagnitude', magnitude: groupEntry.averageMagnitude, maxAllowed: thresholds.maxGroupAverageMagnitude });
    if (failMax) groupFailing.push({ field: 'groupMaxMagnitude', magnitude: groupEntry.maxMagnitude, maxAllowed: thresholds.maxGroupMagnitude });
    const requiresTransformMatch = thresholds.requireTransformMatchFor.includes(groupKey);
    if (requiresTransformMatch) {
      const mismatches = trackedDeltas.filter((entry) => classifyPromotedSubtreeGroup(entry.id) === groupEntry.group && entry.transformA !== entry.transformB);
      if (mismatches.length > 0) {
        groupFailing.push({ field: 'transformMismatchRequired', count: mismatches.length });
      }
    }
    return {
      ...groupEntry,
      pass: groupFailing.length === 0,
      failing: groupFailing,
      warnings: groupWarnings,
    };
  });

  return {
    policy: transformMismatchPolicy,
    thresholds,
    summary: {
      pass: failing.length === 0 && groupSummaries.every((group) => group.pass),
      failing,
      warnings,
      groups: groupSummaries,
      overall: {
        pass: failing.length === 0 && groupSummaries.every((group) => group.pass),
      },
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
