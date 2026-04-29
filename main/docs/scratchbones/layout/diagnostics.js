export function createLayoutDiagnosticsState() {
  return {
    fitStages: {},
    overlap: { overlaps: [], stage: 'none', snapshot: [] },
    renderedScreenSpaceDelta: { modeA: null, modeB: null, deltas: [] },
    renderedScreenSpaceTopDrift: [],
  };
}

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
  }
  return layoutDiagnostics;
}

export function resetLayoutDiagnosticsState(layoutDiagnostics) {
  if (!layoutDiagnostics) return layoutDiagnostics;
  layoutDiagnostics.fitStages = {};
  layoutDiagnostics.overlap = { overlaps: [], stage: 'none', snapshot: [] };
  layoutDiagnostics.renderedScreenSpaceDelta = { modeA: null, modeB: null, deltas: [] };
  layoutDiagnostics.renderedScreenSpaceTopDrift = [];
  return layoutDiagnostics;
}
