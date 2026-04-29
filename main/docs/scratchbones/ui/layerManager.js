function normalizeSelectorList(value) {
  if (Array.isArray(value)) return value.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim());
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}
function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim());
}

function selectorMatchesElement(element, selectors) {
  if (!element || !(element instanceof Element) || !Array.isArray(selectors) || !selectors.length) return false;
  return selectors.some((selector) => {
    try {
      return element.matches(selector);
    } catch {
      return false;
    }
  });
}

function isTransformSensitivePromotionTarget(element) {
  if (!element) return false;
  const marker = [
    element.id,
    element.className,
    element.getAttribute?.('data-proj-id'),
    element.getAttribute?.('data-ui-role'),
    element.getAttribute?.('data-node-type'),
    element.getAttribute?.('data-cinematic'),
  ]
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLowerCase();
  return /avatar|portrait|cinematic|cutscene/.test(marker);
}


function shouldPreservePromotionTransform(element, { preserveSelectors = [], disableSelectors = [] } = {}) {
  if (!element) return false;
  const projId = String(element.getAttribute?.('data-proj-id') || '').trim().toLowerCase();
  const selectorMatch = (selectors) => selectorMatchesElement(element, selectors);
  if (selectorMatch(disableSelectors)) return false;
  if (selectorMatch(preserveSelectors)) return true;
  if (!projId) return false;
  if (projId === 'avatar-human' || projId.startsWith('avatar-')) return true;
  if (projId.startsWith('claim-avatar-')) return true;
  if (projId.startsWith('claim-') && (projId.includes('anchor') || projId.includes('text'))) return true;
  return false;
}

function canSafelyNormalizePromotedBox(element, computedStyle) {
  if (!element || !computedStyle) return false;
  if (isTransformSensitivePromotionTarget(element)) return false;
  if (computedStyle.transform && computedStyle.transform !== 'none') return false;
  const width = computedStyle.width;
  const height = computedStyle.height;
  if (!width || !height || width === 'auto' || height === 'auto') return false;
  return true;
}
function snapshotManagedElementStyle(element) {
  if (!element) return null;
  return {
    margin: element.style.margin,
    width: element.style.width,
    height: element.style.height,
    position: element.style.position,
    left: element.style.left,
    top: element.style.top,
    right: element.style.right,
    bottom: element.style.bottom,
    transform: element.style.transform,
    transformOrigin: element.style.transformOrigin,
  };
}

function hasInlineTransform(element) {
  if (!element) return false;
  const inlineValue = element.style.transform;
  return typeof inlineValue === 'string' && inlineValue.trim().length > 0;
}

function readSizingToken(inlineValue, computedValue, fallbackPx) {
  if (typeof inlineValue === 'string' && inlineValue.trim()) return inlineValue.trim();
  if (typeof computedValue === 'string' && computedValue.trim() && computedValue !== 'auto') return computedValue.trim();
  return `${Math.max(1, Number(fallbackPx) || 1).toFixed(4)}px`;
}

function restoreManagedElementStyle(element, styleSnapshot) {
  if (!element || !styleSnapshot) return;
  element.style.margin = styleSnapshot.margin;
  element.style.width = styleSnapshot.width;
  element.style.height = styleSnapshot.height;
  element.style.position = styleSnapshot.position;
  element.style.left = styleSnapshot.left;
  element.style.top = styleSnapshot.top;
  element.style.right = styleSnapshot.right;
  element.style.bottom = styleSnapshot.bottom;
  element.style.transform = styleSnapshot.transform;
  element.style.transformOrigin = styleSnapshot.transformOrigin;
}

export function createLayerManager({ gameConfig = null, debugLog = null } = {}) {
  const managerConfig = gameConfig?.layout?.layerManager || {};
  const enabled = managerConfig.enabled !== false;
  const hostZIndex = Number.isFinite(Number(managerConfig.hostZIndex)) ? Number(managerConfig.hostZIndex) : 45;
  const defaultPreserveSpace = managerConfig.defaultPreserveSpace !== false;
  const normalizePromotedElementBox = managerConfig.normalizePromotedElementBox === true;
  const assignments = Array.isArray(managerConfig.assignments) ? managerConfig.assignments : [];
  const promoteByRootSelectors = normalizeSelectorList(managerConfig.promoteByRootSelectors);
  const excludeDescendantSelectors = normalizeSelectorList(managerConfig.excludeDescendantSelectors);
  const configuredLayerOrder = normalizeStringList(managerConfig.layerOrder);
  const normalizeBoxGuard = managerConfig.normalizeBoxGuard && typeof managerConfig.normalizeBoxGuard === 'object'
    ? managerConfig.normalizeBoxGuard
    : {};
  const normalizeBoxAllowlistSelectors = normalizeSelectorList(normalizeBoxGuard.allowlistSelectors);
  const normalizeBoxDenylistSelectors = normalizeSelectorList(normalizeBoxGuard.denylistSelectors);
  const normalizeMarginGuard = normalizeBoxGuard.marginReset && typeof normalizeBoxGuard.marginReset === 'object'
    ? normalizeBoxGuard.marginReset
    : {};
  const normalizeMarginAllowlistSelectors = normalizeSelectorList(normalizeMarginGuard.allowlistSelectors);
  const normalizeMarginDenylistSelectors = normalizeSelectorList(normalizeMarginGuard.denylistSelectors);
  const normalizeFillSizeGuard = normalizeBoxGuard.fillSize && typeof normalizeBoxGuard.fillSize === 'object'
    ? normalizeBoxGuard.fillSize
    : {};
  const normalizeFillSizeAllowlistSelectors = normalizeSelectorList(normalizeFillSizeGuard.allowlistSelectors);
  const normalizeFillSizeDenylistSelectors = normalizeSelectorList(normalizeFillSizeGuard.denylistSelectors);
  const preservePromotionTransformSelectors = normalizeSelectorList(managerConfig.preservePromotionTransformSelectors);
  const disablePreservePromotionTransformSelectors = normalizeSelectorList(managerConfig.disablePreservePromotionTransformSelectors);
  const typographyBaselineRootSelector = typeof managerConfig.typographyBaselineRootSelector === 'string' && managerConfig.typographyBaselineRootSelector.trim()
    ? managerConfig.typographyBaselineRootSelector.trim()
    : '#app';
  const typographyBaselineFields = normalizeStringList(managerConfig.typographyBaselineFields).length
    ? normalizeStringList(managerConfig.typographyBaselineFields)
    : ['font-size', 'line-height', 'font-family', 'letter-spacing', 'font-weight'];
  const assignmentList = assignments
    .map((entry, index) => {
      const selectors = normalizeSelectorList(entry?.selectors);
      if (!selectors.length) return null;
      return {
        id: String(entry?.id || `assignment-${index}`),
        layer: String(entry?.layer || 'overlay'),
        selectors,
        preserveSpace: entry?.preserveSpace !== false,
      };
    })
    .filter(Boolean);
  const discoveredLayerNames = Array.from(new Set(assignmentList.map((entry) => entry.layer)));
  const layerNames = [
    ...configuredLayerOrder.filter((layerName) => discoveredLayerNames.includes(layerName)),
    ...discoveredLayerNames.filter((layerName) => !configuredLayerOrder.includes(layerName)),
  ];

  const state = {
    app: null,
    host: null,
    roots: new Map(),
    promoted: [],
    resizeObserver: null,
    windowResizeHandler: null,
  };
  const log = (level, event, payload = {}) => {
    if (typeof debugLog !== 'function') return;
    debugLog(level, `layer-manager.${event}`, payload);
  };

  function ensureHost(app) {
    if (!enabled || !app) return null;
    if (state.host && state.host.isConnected && state.app === app) return state.host;
    state.app = app;
    const host = document.createElement('div');
    host.id = 'uiLayerManagerHost';
    host.setAttribute('aria-hidden', 'true');
    host.style.cssText = [
      'position:fixed',
      'inset:0',
      'overflow:visible',
      'pointer-events:none',
      `z-index:${hostZIndex}`,
    ].join(';');
    const roots = new Map();
    layerNames.forEach((layerName, layerIndex) => {
      const root = document.createElement('div');
      root.className = `ui-layer ui-layer-${layerName}`;
      root.dataset.layerName = layerName;
      root.style.cssText = `position:fixed;inset:0;overflow:visible;pointer-events:none;z-index:${layerIndex};`;
      host.appendChild(root);
      applyTypographyBaselineToRoot(root, app);
      roots.set(layerName, root);
    });
    document.body.appendChild(host);
    state.host = host;
    state.roots = roots;
    if (!state.windowResizeHandler) {
      state.windowResizeHandler = () => {
        for (const entry of state.promoted) updatePortalRect(entry);
      };
      window.addEventListener('resize', state.windowResizeHandler);
    }
    if (!state.resizeObserver) {
      state.resizeObserver = new ResizeObserver(() => {
        for (const entry of state.promoted) updatePortalRect(entry);
      });
    }
    state.resizeObserver.observe(app);
    log('debug', 'host-created', { layerCount: roots.size, hostZIndex });
    return host;
  }

  function captureTypographyBaseline(app) {
    const baselineRoot = (typographyBaselineRootSelector && app?.matches?.(typographyBaselineRootSelector))
      ? app
      : app?.querySelector?.(typographyBaselineRootSelector);
    const source = baselineRoot || app || document.documentElement;
    if (!source) return null;
    const computed = window.getComputedStyle(source);
    const baseline = {};
    for (const field of typographyBaselineFields) baseline[field] = computed.getPropertyValue(field);
    return baseline;
  }

  function applyTypographyBaselineToRoot(root, app) {
    if (!root) return;
    const baseline = captureTypographyBaseline(app);
    if (!baseline) return;
    for (const [field, value] of Object.entries(baseline)) {
      if (value) root.style.setProperty(field, value);
    }
  }

  function clearPromoted() {
    for (const entry of state.promoted) {
      if (state.resizeObserver) {
        state.resizeObserver.unobserve(entry.placeholder);
        state.resizeObserver.unobserve(entry.element);
      }
      restoreManagedElementStyle(entry.element, entry.originalElementStyle);
      if (entry.placeholder?.isConnected && entry.element?.isConnected) {
        entry.placeholder.parentNode?.insertBefore(entry.element, entry.placeholder);
      } else {
        entry.element?.remove();
      }
      entry.placeholder?.remove();
      entry.portal?.remove();
    }
    state.promoted = [];
  }

  function updatePortalRect(entry) {
    if (!entry?.portal || !entry.placeholder?.isConnected || entry.placeholder.style.display === 'none') return;
    const capture = capturePortalPlacementFrame(entry);
    if (!capture) return;
    const { sourceRect } = capture;
    entry.portal.style.position = 'fixed';
    entry.portal.style.right = 'auto';
    entry.portal.style.bottom = 'auto';
    entry.portal.style.transform = 'none';
    entry.portal.style.transformOrigin = '0 0';
    entry.portal.style.left = `${sourceRect.left.toFixed(4)}px`;
    entry.portal.style.top = `${sourceRect.top.toFixed(4)}px`;
    entry.portal.style.width = `${Math.max(1, sourceRect.width).toFixed(4)}px`;
    entry.portal.style.height = `${Math.max(1, sourceRect.height).toFixed(4)}px`;
  }

  function capturePortalPlacementFrame(entry) {
    if (!entry?.placeholder?.isConnected) return null;
    const sourceRect = entry.placeholder.getBoundingClientRect();
    return { sourceRect };
  }

  function promoteElementToLayer(element, assignment) {
    if (!state.app || !state.host || !element || !(element instanceof Element) || element.closest('#uiLayerManagerHost')) return false;
    const layerRoot = state.roots.get(assignment.layer);
    if (!layerRoot) return false;
    const rect = element.getBoundingClientRect();
    const layoutWidth = element.offsetWidth || element.clientWidth || rect.width;
    const layoutHeight = element.offsetHeight || element.clientHeight || rect.height;
    if (layoutWidth < 1 || layoutHeight < 1) return false;
    const computed = window.getComputedStyle(element);
    const originalElementStyle = snapshotManagedElementStyle(element);
    const placeholder = document.createElement('div');
    placeholder.dataset.layerPlaceholderFor = assignment.id;
    if (assignment.preserveSpace ?? defaultPreserveSpace) {
      placeholder.style.display = computed.display === 'inline' ? 'inline-block' : computed.display;
      placeholder.style.width = readSizingToken(element.style.width, computed.width, layoutWidth);
      placeholder.style.height = readSizingToken(element.style.height, computed.height, layoutHeight);
      placeholder.style.marginTop = computed.marginTop;
      placeholder.style.marginRight = computed.marginRight;
      placeholder.style.marginBottom = computed.marginBottom;
      placeholder.style.marginLeft = computed.marginLeft;
      placeholder.style.flex = computed.flex;
      placeholder.style.position = computed.position;
      placeholder.style.left = computed.left;
      placeholder.style.top = computed.top;
      placeholder.style.right = computed.right;
      placeholder.style.bottom = computed.bottom;
      placeholder.style.transform = '';
      placeholder.style.transformOrigin = '';
      placeholder.style.pointerEvents = 'none';
    } else {
      placeholder.style.display = 'none';
    }
    element.parentNode?.insertBefore(placeholder, element);

    const portal = document.createElement('div');
    portal.className = `ui-layer-portal ui-layer-portal-${assignment.layer}`;
    portal.style.cssText = 'position:fixed;pointer-events:auto;';
    layerRoot.appendChild(portal);
    portal.appendChild(element);

    const isTransformSensitive = isTransformSensitivePromotionTarget(element);
    const isNormalizeBoxDenied = selectorMatchesElement(element, normalizeBoxDenylistSelectors);
    const isNormalizeBoxAllowed = !normalizeBoxAllowlistSelectors.length || selectorMatchesElement(element, normalizeBoxAllowlistSelectors);
    const shouldNormalizeBox = normalizePromotedElementBox
      && canSafelyNormalizePromotedBox(element, computed)
      && isNormalizeBoxAllowed
      && !isNormalizeBoxDenied;
    const isNormalizeMarginDenied = selectorMatchesElement(element, normalizeMarginDenylistSelectors);
    const isNormalizeMarginAllowed = !normalizeMarginAllowlistSelectors.length || selectorMatchesElement(element, normalizeMarginAllowlistSelectors);
    const shouldNormalizeMargin = shouldNormalizeBox && isNormalizeMarginAllowed && !isNormalizeMarginDenied;
    const isNormalizeFillSizeDenied = selectorMatchesElement(element, normalizeFillSizeDenylistSelectors);
    const isNormalizeFillSizeAllowed = !normalizeFillSizeAllowlistSelectors.length || selectorMatchesElement(element, normalizeFillSizeAllowlistSelectors);
    const shouldNormalizeFillSize = shouldNormalizeBox && isNormalizeFillSizeAllowed && !isNormalizeFillSizeDenied;
    if (shouldNormalizeMargin) {
      element.style.margin = '0';
    }
    element.style.position = 'absolute';
    element.style.left = '0';
    element.style.top = '0';
    element.style.right = 'auto';
    element.style.bottom = 'auto';
    if (shouldNormalizeFillSize) {
      element.style.width = '100%';
      element.style.height = '100%';
    }
    const preservePromotionTransform = shouldPreservePromotionTransform(element, {
      preserveSelectors: preservePromotionTransformSelectors,
      disableSelectors: disablePreservePromotionTransformSelectors,
    });
    const disablePreservePromotionTransform = selectorMatchesElement(element, disablePreservePromotionTransformSelectors);
    const shouldRetainComputedTransform = !disablePreservePromotionTransform && (preservePromotionTransform || isTransformSensitive);
    if (shouldRetainComputedTransform && !hasInlineTransform(element) && computed.transform && computed.transform !== 'none') {
      element.style.transform = computed.transform;
      if (computed.transformOrigin) element.style.transformOrigin = computed.transformOrigin;
    }

    const promotedEntry = {
      assignment,
      element,
      placeholder,
      portal,
      originalElementStyle,
      placementCapture: capturePortalPlacementFrame({ placeholder }),
    };
    state.promoted.push(promotedEntry);
    state.resizeObserver?.observe(placeholder);
    state.resizeObserver?.observe(element);
    updatePortalRect(promotedEntry);
    log('debug', 'promoted', {
      assignmentId: assignment.id,
      layer: assignment.layer,
      selectorName: element.id ? `#${element.id}` : element.className,
      retainedTransform: element.style.transform || 'none',
      originalPosition: computed.position,
      normalizePromotedElementBox: shouldNormalizeBox,
      normalizeBoxAllowlistHit: isNormalizeBoxAllowed,
      normalizeBoxDenylistHit: isNormalizeBoxDenied,
      normalizeMarginAllowlistHit: isNormalizeMarginAllowed,
      normalizeMarginDenylistHit: isNormalizeMarginDenied,
      normalizeFillSizeAllowlistHit: isNormalizeFillSizeAllowed,
      normalizeFillSizeDenylistHit: isNormalizeFillSizeDenied,
      transformSensitive: isTransformSensitive,
      preservePromotionTransform,
      disablePreservePromotionTransform,
      shouldRetainComputedTransform,
      reanchoredAbsolutePosition: true,
      placementMode: 'screen-space',
    });
    return true;
  }

  function sync(app = document.getElementById('app')) {
    if (!enabled || !app || !assignmentList.length) return;
    ensureHost(app);
    if (!state.host) return;
    for (const root of state.roots.values()) applyTypographyBaselineToRoot(root, app);
    clearPromoted();

    const nodeAssignments = new Map();
    assignmentList.forEach((assignment, assignmentIndex) => {
      assignment.selectors.forEach((selector, selectorIndex) => {
        app.querySelectorAll(selector).forEach((node) => {
          if (!(node instanceof Element)) return;
          const existing = nodeAssignments.get(node);
          const priority = assignmentIndex * 1000 + selectorIndex;
          if (!existing || priority < existing.priority) {
            nodeAssignments.set(node, { assignment, priority });
          }
        });
      });
    });

    const candidates = Array.from(nodeAssignments.entries())
      .map(([node, data]) => ({
        node,
        assignment: data.assignment,
        priority: data.priority,
        depth: (() => {
          let depth = 0;
          let current = node.parentElement;
          while (current) {
            depth += 1;
            current = current.parentElement;
          }
          return depth;
        })(),
      }))
      .sort((a, b) => (a.depth - b.depth) || (a.priority - b.priority));

    const isPromotionRoot = (element) =>
      !!element && promoteByRootSelectors.some((selector) => {
        try { return element.matches(selector); } catch { return false; }
      });
    const isExcludedDescendant = (element, promotedRoot) =>
      !!element && !!promotedRoot && excludeDescendantSelectors.some((selector) => {
        try { return element !== promotedRoot && element.matches(selector) && promotedRoot.contains(element); } catch { return false; }
      });

    const promotedAncestors = [];
    for (const candidate of candidates) {
      if (promotedAncestors.some((ancestor) => {
        if (!ancestor.contains(candidate.node)) return false;
        if (!isPromotionRoot(ancestor)) return true;
        return isExcludedDescendant(candidate.node, ancestor);
      })) continue;
      if (promoteElementToLayer(candidate.node, candidate.assignment)) promotedAncestors.push(candidate.node);
    }

    for (const entry of state.promoted) updatePortalRect(entry);
    log('debug', 'sync-complete', { promotedCount: state.promoted.length });
  }

  function clear() {
    if (!enabled) return;
    clearPromoted();
    if (state.resizeObserver) {
      state.resizeObserver.disconnect();
      state.resizeObserver = null;
    }
    if (state.windowResizeHandler) {
      window.removeEventListener('resize', state.windowResizeHandler);
      state.windowResizeHandler = null;
    }
    if (state.host) {
      state.host.remove();
      state.host = null;
    }
    state.roots.clear();
    state.app = null;
  }

  return {
    enabled,
    sync,
    clear,
  };
}
