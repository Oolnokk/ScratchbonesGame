function normalizeSelectorList(value) {
  if (Array.isArray(value)) return value.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim());
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}
function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim());
}

function normalizeAssignmentIdList(value) {
  return new Set(normalizeStringList(value).map((entry) => entry.toLowerCase()));
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

function readElementMarkerValue(element, attributeName) {
  const normalizedName = String(attributeName || '').trim();
  if (!normalizedName) return '';
  if (normalizedName === 'id') return element.id;
  if (normalizedName === 'class') return element.className;
  return element.getAttribute?.(normalizedName);
}

function buildElementMarker(element, markerAttributes) {
  if (!element) return '';
  return normalizeStringList(markerAttributes)
    .map((attributeName) => readElementMarkerValue(element, attributeName))
    .filter((value) => typeof value === 'string' && value.trim())
    .join(' ')
    .toLowerCase();
}

function isTransformSensitivePromotionTarget(element, { markerAttributes = [], markerTerms = [] } = {}) {
  const marker = buildElementMarker(element, markerAttributes);
  if (!marker) return false;
  return normalizeStringList(markerTerms)
    .map((term) => term.toLowerCase())
    .some((term) => marker.includes(term));
}

function shouldPreservePromotionTransform(element, {
  preserveSelectors = [],
  disableSelectors = [],
  projectIds = [],
  projectIdPrefixes = [],
  projectIdContainsRules = [],
} = {}) {
  if (!element) return false;
  const projId = String(element.getAttribute?.('data-proj-id') || '').trim().toLowerCase();
  const selectorMatch = (selectors) => selectorMatchesElement(element, selectors);
  if (selectorMatch(disableSelectors)) return false;
  if (selectorMatch(preserveSelectors)) return true;
  if (!projId) return false;
  if (normalizeStringList(projectIds).map((entry) => entry.toLowerCase()).includes(projId)) return true;
  if (normalizeStringList(projectIdPrefixes).some((prefix) => projId.startsWith(prefix.toLowerCase()))) return true;
  return (Array.isArray(projectIdContainsRules) ? projectIdContainsRules : []).some((rule) => {
    const prefix = String(rule?.prefix || '').trim().toLowerCase();
    const contains = normalizeStringList(rule?.contains).map((entry) => entry.toLowerCase());
    return prefix && contains.length && projId.startsWith(prefix) && contains.some((term) => projId.includes(term));
  });
}

function canSafelyNormalizePromotedBox(element, computedStyle, transformSensitiveRules) {
  if (!element || !computedStyle) return false;
  if (isTransformSensitivePromotionTarget(element, transformSensitiveRules)) return false;
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
  return typeof inlineValue === 'string' && inlineValue.trim().length > 0 && inlineValue.trim() !== 'none';
}

function readSizingToken(inlineValue, computedValue, fallbackPx) {
  if (typeof inlineValue === 'string' && inlineValue.trim()) return inlineValue.trim();
  if (typeof computedValue === 'string' && computedValue.trim() && computedValue !== 'auto') return computedValue.trim();
  return `${Math.max(1, Number(fallbackPx) || 1).toFixed(4)}px`;
}

function roundPlacementValue(value, shouldRound) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return shouldRound ? Math.round(numeric) : numeric;
}

function toCssPx(value, shouldRound) {
  return `${roundPlacementValue(value, shouldRound).toFixed(shouldRound ? 0 : 4)}px`;
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
  const hostZIndex = Number(managerConfig.hostZIndex);
  const defaultPreserveSpace = managerConfig.defaultPreserveSpace !== false;
  const normalizePromotedElementBox = managerConfig.normalizePromotedElementBox === true;
  const updateOnScroll = managerConfig.updateOnScroll !== false;
  const placementMode = managerConfig.placementMode;
  const placementCoordinateSpace = managerConfig.placementCoordinateSpace;
  const roundToPixels = managerConfig.roundToPixels === true;
  const portalScaleStrategy = managerConfig.portalScaleStrategy;
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
  const transformSensitiveRules = {
    markerAttributes: normalizeStringList(managerConfig.transformSensitiveMarkerAttributes),
    markerTerms: normalizeStringList(managerConfig.transformSensitiveMarkerTerms),
  };
  const preservePromotionTransformProjectIds = normalizeStringList(managerConfig.preservePromotionTransformProjectIds);
  const preservePromotionTransformProjectIdPrefixes = normalizeStringList(managerConfig.preservePromotionTransformProjectIdPrefixes);
  const preservePromotionTransformProjectIdContainsRules = Array.isArray(managerConfig.preservePromotionTransformProjectIdContainsRules)
    ? managerConfig.preservePromotionTransformProjectIdContainsRules
    : [];
  const typographyBaselineRootSelector = managerConfig.typographyBaselineRootSelector;
  const typographyBaselineFields = normalizeStringList(managerConfig.typographyBaselineFields);
  const promotedTextMetricFields = normalizeStringList(managerConfig.promotedTextMetricFields);
  const promotedTextMetricAssignmentIds = normalizeAssignmentIdList(managerConfig.promotedTextMetricAssignmentIds);
  const buildAssignmentList = () => assignments
    .map((entry) => {
      const selectors = normalizeSelectorList(entry?.selectors);
      if (!selectors.length) return null;
      const id = String(entry.id);
      return {
        id,
        layer: String(entry.layer),
        selectors,
        preserveSpace: entry.preserveSpace === true,
        keepOriginal: entry.keepOriginal === true,
        promotedOpacity: Number(entry.promotedOpacity),
        capturePromotedTextMetrics: entry?.capturePromotedTextMetrics === true || promotedTextMetricAssignmentIds.has(id.toLowerCase()),
      };
    })
    .filter(Boolean);
  const assignmentList = buildAssignmentList();
  let cachedSyncAssignmentList = assignmentList;
  let assignmentListDirty = false;
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
    documentScrollHandler: null,
    scrollRaf: 0,
    syncRafId: 0,
    syncPendingApp: null,
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
    log('debug', 'host-created', { layerCount: roots.size, hostZIndex, placementMode });
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

  function captureTextMetricSnapshot(element, fields = promotedTextMetricFields) {
    if (!element || !fields.length) return null;
    const computed = window.getComputedStyle(element);
    const snapshot = {};
    for (const field of fields) {
      const value = computed.getPropertyValue(field);
      if (value) snapshot[field] = value;
    }
    return Object.keys(snapshot).length ? snapshot : null;
  }

  function applyStyleSnapshot(target, snapshot) {
    if (!target || !snapshot) return;
    for (const [field, value] of Object.entries(snapshot)) {
      if (value) target.style.setProperty(field, value);
    }
  }

  function applyTypographyBaselineToRoot(root, app) {
    if (!root) return;
    applyStyleSnapshot(root, captureTypographyBaseline(app));
  }

  function clearPromoted() {
    for (const entry of state.promoted) {
      if (state.resizeObserver) {
        if (entry.placeholder) state.resizeObserver.unobserve(entry.placeholder);
        state.resizeObserver.unobserve(entry.element);
        if (entry.sourceElement && entry.sourceElement !== entry.element) state.resizeObserver.unobserve(entry.sourceElement);
      }
      if (!entry.assignment?.keepOriginal && entry.sourceElement) {
        restoreManagedElementStyle(entry.sourceElement, entry.originalElementStyle);
        if (entry.placeholder?.isConnected && entry.sourceElement?.isConnected) {
          entry.placeholder.parentNode?.insertBefore(entry.sourceElement, entry.placeholder);
        } else {
          entry.sourceElement?.remove();
        }
      } else {
        entry.element?.remove();
      }
      entry.placeholder?.remove();
      entry.portal?.remove();
    }
    state.promoted = [];
  }

  function getPortalAnchorElement(entry) {
    if (entry?.placeholder?.isConnected && entry.placeholder.style.display !== 'none') return entry.placeholder;
    if (entry?.sourceElement?.isConnected) return entry.sourceElement;
    return null;
  }

  function applyPortalPlacement(portal, placement) {
    portal.style.position = 'fixed';
    portal.style.right = 'auto';
    portal.style.bottom = 'auto';
    portal.style.transform = (placement.transformScaleX === 1 && placement.transformScaleY === 1)
      ? 'none'
      : `scale(${placement.transformScaleX.toFixed(6)}, ${placement.transformScaleY.toFixed(6)})`;
    portal.style.transformOrigin = '0 0';
    portal.style.left = toCssPx(placement.left, roundToPixels);
    portal.style.top = toCssPx(placement.top, roundToPixels);
    portal.style.width = toCssPx(placement.width, roundToPixels);
    portal.style.height = toCssPx(placement.height, roundToPixels);
  }

  function buildScreenSpacePortalPlacement({ viewportRect, appScaleX, appScaleY }) {
    const resolvedScaleX = Number.isFinite(appScaleX) && appScaleX > 0 ? appScaleX : 1;
    const resolvedScaleY = Number.isFinite(appScaleY) && appScaleY > 0 ? appScaleY : 1;
    const useLegacyScreenSpaceScale = portalScaleStrategy === 'legacy-screen-space';
    return {
      left: viewportRect.left,
      top: viewportRect.top,
      width: Math.max(1, useLegacyScreenSpaceScale ? viewportRect.width / resolvedScaleX : viewportRect.width),
      height: Math.max(1, useLegacyScreenSpaceScale ? viewportRect.height / resolvedScaleY : viewportRect.height),
      transformScaleX: useLegacyScreenSpaceScale ? resolvedScaleX : 1,
      transformScaleY: useLegacyScreenSpaceScale ? resolvedScaleY : 1,
    };
  }

  function buildAuthoredSpacePortalPlacement({ authoredRect, appRect, appScaleX, appScaleY }) {
    const resolvedScaleX = Number.isFinite(appScaleX) && appScaleX > 0 ? appScaleX : 1;
    const resolvedScaleY = Number.isFinite(appScaleY) && appScaleY > 0 ? appScaleY : 1;
    const usePortalTransformScale = portalScaleStrategy === 'portal-transform';
    return {
      left: appRect.left + (authoredRect.left * resolvedScaleX),
      top: appRect.top + (authoredRect.top * resolvedScaleY),
      width: Math.max(1, usePortalTransformScale ? authoredRect.width : authoredRect.width * resolvedScaleX),
      height: Math.max(1, usePortalTransformScale ? authoredRect.height : authoredRect.height * resolvedScaleY),
      transformScaleX: usePortalTransformScale ? resolvedScaleX : 1,
      transformScaleY: usePortalTransformScale ? resolvedScaleY : 1,
    };
  }

  function buildPortalPlacement(capture) {
    if (placementMode === 'screen-space') return buildScreenSpacePortalPlacement(capture);
    return buildAuthoredSpacePortalPlacement(capture);
  }

  function updatePortalRect(entry) {
    if (!entry?.portal) return;
    const capture = capturePortalPlacementFrame(entry);
    if (!capture) return;
    applyPortalPlacement(entry.portal, buildPortalPlacement(capture));
  }

  function updateAllPortalRects() {
    for (const entry of state.promoted) updatePortalRect(entry);
  }

  function scheduleScrollPortalUpdate() {
    if (!updateOnScroll || state.scrollRaf) return;
    state.scrollRaf = window.requestAnimationFrame(() => {
      state.scrollRaf = 0;
      updateAllPortalRects();
    });
  }

  function ensureScrollTracking() {
    if (!updateOnScroll || state.documentScrollHandler) return;
    state.documentScrollHandler = scheduleScrollPortalUpdate;
    document.addEventListener('scroll', state.documentScrollHandler, { capture: true, passive: true });
  }

  function capturePortalPlacementFrame(entry) {
    const anchorElement = getPortalAnchorElement(entry);
    if (!anchorElement) return null;
    const viewportRect = anchorElement.getBoundingClientRect();
    const appRect = state.app?.getBoundingClientRect?.();
    if (!appRect) return null;
    const appLayoutWidth = state.app?.offsetWidth || state.app?.clientWidth || appRect.width || 0;
    const appLayoutHeight = state.app?.offsetHeight || state.app?.clientHeight || appRect.height || 0;
    const appScaleX = appLayoutWidth > 0 ? (appRect.width / appLayoutWidth) : 1;
    const appScaleY = appLayoutHeight > 0 ? (appRect.height / appLayoutHeight) : 1;
    const resolvedScaleX = Number.isFinite(appScaleX) && appScaleX > 0 ? appScaleX : 1;
    const resolvedScaleY = Number.isFinite(appScaleY) && appScaleY > 0 ? appScaleY : 1;
    const authoredRect = {
      x: (viewportRect.x - appRect.left) / resolvedScaleX,
      y: (viewportRect.y - appRect.top) / resolvedScaleY,
      left: (viewportRect.left - appRect.left) / resolvedScaleX,
      top: (viewportRect.top - appRect.top) / resolvedScaleY,
      right: (viewportRect.right - appRect.left) / resolvedScaleX,
      bottom: (viewportRect.bottom - appRect.top) / resolvedScaleY,
      width: viewportRect.width / resolvedScaleX,
      height: viewportRect.height / resolvedScaleY,
    };
    return { authoredRect, viewportRect, appRect, appScaleX: resolvedScaleX, appScaleY: resolvedScaleY };
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
    const textMetricSnapshot = assignment.capturePromotedTextMetrics ? captureTextMetricSnapshot(element) : null;
    const originalElementStyle = snapshotManagedElementStyle(element);
    const usePlaceholder = !assignment.keepOriginal;
    let placeholder = null;
    if (usePlaceholder) {
      placeholder = document.createElement('div');
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
        placeholder.style.transform = 'none';
        placeholder.style.transformOrigin = '';
        placeholder.style.pointerEvents = 'none';
      } else {
        placeholder.style.display = 'none';
      }
      element.parentNode?.insertBefore(placeholder, element);
    }

    const portal = document.createElement('div');
    portal.className = `ui-layer-portal ui-layer-portal-${assignment.layer}`;
    portal.style.cssText = 'position:fixed;pointer-events:auto;';
    portal.style.opacity = `${assignment.promotedOpacity}`;
    layerRoot.appendChild(portal);
    const promotedNode = assignment.keepOriginal ? element.cloneNode(true) : element;
    portal.appendChild(promotedNode);
    applyStyleSnapshot(promotedNode, textMetricSnapshot);

    const isTransformSensitive = isTransformSensitivePromotionTarget(promotedNode, transformSensitiveRules);
    const isNormalizeBoxDenied = selectorMatchesElement(element, normalizeBoxDenylistSelectors);
    const isNormalizeBoxAllowed = !normalizeBoxAllowlistSelectors.length || selectorMatchesElement(element, normalizeBoxAllowlistSelectors);
    const shouldNormalizeBox = normalizePromotedElementBox
      && canSafelyNormalizePromotedBox(element, computed, transformSensitiveRules)
      && isNormalizeBoxAllowed
      && !isNormalizeBoxDenied;
    const isNormalizeMarginDenied = selectorMatchesElement(element, normalizeMarginDenylistSelectors);
    const isNormalizeMarginAllowed = !normalizeMarginAllowlistSelectors.length || selectorMatchesElement(element, normalizeMarginAllowlistSelectors);
    const shouldNormalizeMargin = shouldNormalizeBox && isNormalizeMarginAllowed && !isNormalizeMarginDenied;
    const isNormalizeFillSizeDenied = selectorMatchesElement(element, normalizeFillSizeDenylistSelectors);
    const isNormalizeFillSizeAllowed = !normalizeFillSizeAllowlistSelectors.length || selectorMatchesElement(element, normalizeFillSizeAllowlistSelectors);
    const shouldNormalizeFillSize = shouldNormalizeBox && isNormalizeFillSizeAllowed && !isNormalizeFillSizeDenied;
    if (shouldNormalizeMargin) {
      promotedNode.style.margin = '0';
    }
    promotedNode.style.position = 'absolute';
    promotedNode.style.left = '0';
    promotedNode.style.top = '0';
    promotedNode.style.right = 'auto';
    promotedNode.style.bottom = 'auto';
    if (shouldNormalizeFillSize) {
      promotedNode.style.width = '100%';
      promotedNode.style.height = '100%';
    } else {
      // Stamp resolved px dimensions so percentage values (e.g. width:50%)
      // don't misresolve against the portal's width instead of the original container.
      // This applies to both moved elements and clones leaving their ancestor CSS context.
      const resolvedW = computed.width;
      const resolvedH = computed.height;
      if (resolvedW && resolvedW !== 'auto') promotedNode.style.width = resolvedW;
      if (resolvedH && resolvedH !== 'auto') promotedNode.style.height = resolvedH;
    }
    const preservePromotionTransform = shouldPreservePromotionTransform(promotedNode, {
      preserveSelectors: preservePromotionTransformSelectors,
      disableSelectors: disablePreservePromotionTransformSelectors,
      projectIds: preservePromotionTransformProjectIds,
      projectIdPrefixes: preservePromotionTransformProjectIdPrefixes,
      projectIdContainsRules: preservePromotionTransformProjectIdContainsRules,
    });
    const disablePreservePromotionTransform = selectorMatchesElement(promotedNode, disablePreservePromotionTransformSelectors);
    const shouldRetainComputedTransform = !disablePreservePromotionTransform && (preservePromotionTransform || isTransformSensitive);
    if (shouldRetainComputedTransform && !hasInlineTransform(promotedNode) && computed.transform && computed.transform !== 'none') {
      promotedNode.style.transform = computed.transform;
      if (computed.transformOrigin) promotedNode.style.transformOrigin = computed.transformOrigin;
    }

    const promotedEntry = {
      assignment,
      element: promotedNode,
      sourceElement: element,
      placeholder,
      portal,
      originalElementStyle,
    };
    state.promoted.push(promotedEntry);
    if (placeholder) state.resizeObserver?.observe(placeholder);
    state.resizeObserver?.observe(promotedNode);
    if (element !== promotedNode) state.resizeObserver?.observe(element);
    updatePortalRect(promotedEntry);
    log('debug', 'promoted', {
      assignmentId: assignment.id,
      layer: assignment.layer,
      selectorName: element.id ? `#${element.id}` : element.className,
      retainedTransform: promotedNode.style.transform || 'none',
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
      placementMode,
      placementCoordinateSpace,
      portalScaleStrategy,
      appliedTextMetricFields: textMetricSnapshot ? Object.keys(textMetricSnapshot) : [],
    });
    return true;
  }

  function _runSyncNow(app) {
    if (assignmentListDirty) {
      cachedSyncAssignmentList = buildAssignmentList();
      assignmentListDirty = false;
    }
    if (!enabled || !app || !cachedSyncAssignmentList.length) return;
    ensureHost(app);
    if (!state.host) return;
    ensureScrollTracking();
    for (const root of state.roots.values()) applyTypographyBaselineToRoot(root, app);
    clearPromoted();

    const nodeAssignments = new Map();
    cachedSyncAssignmentList.forEach((assignment, assignmentIndex) => {
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
      }))
      .sort((a, b) => {
        const pos = a.node.compareDocumentPosition(b.node);
        if (pos & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
        if (pos & Node.DOCUMENT_POSITION_PRECEDING) return 1;
        return a.priority - b.priority;
      });

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

  function sync(app = document.getElementById('app')) {
    if (!enabled || !app) return;
    // Collapse rapid sync() calls (e.g. 30 per deal burst) into one RAF callback.
    // Card selection feedback is handled immediately in toggleSelect before render() fires,
    // so the one-frame RAF delay is not perceptible for user interactions.
    state.syncPendingApp = app;
    if (state.syncRafId) return;
    state.syncRafId = requestAnimationFrame(() => {
      state.syncRafId = 0;
      const pendingApp = state.syncPendingApp || document.getElementById('app');
      state.syncPendingApp = null;
      _runSyncNow(pendingApp);
    });
  }

  function realign(app = document.getElementById('app')) {
    if (!enabled || !state.host || !state.promoted.length) return;
    if (app && state.app !== app) state.app = app;
    updateAllPortalRects();
  }

  function clear() {
    if (!enabled) return;
    if (state.syncRafId) {
      cancelAnimationFrame(state.syncRafId);
      state.syncRafId = 0;
      state.syncPendingApp = null;
    }
    clearPromoted();
    if (state.resizeObserver) {
      state.resizeObserver.disconnect();
      state.resizeObserver = null;
    }
    if (state.windowResizeHandler) {
      window.removeEventListener('resize', state.windowResizeHandler);
      state.windowResizeHandler = null;
    }
    if (state.documentScrollHandler) {
      document.removeEventListener('scroll', state.documentScrollHandler, { capture: true });
      state.documentScrollHandler = null;
    }
    if (state.scrollRaf) {
      window.cancelAnimationFrame(state.scrollRaf);
      state.scrollRaf = 0;
    }
    if (state.host) {
      state.host.remove();
      state.host = null;
    }
    state.roots.clear();
    state.app = null;
  }

  function setAssignmentOptions(assignmentId, options = {}) {
    if (!assignmentId || !options || typeof options !== 'object') return false;
    const target = assignments.find((entry) => String(entry?.id || '') === String(assignmentId));
    if (!target) return false;
    if (Object.prototype.hasOwnProperty.call(options, 'keepOriginal')) target.keepOriginal = options.keepOriginal === true;
    if (Object.prototype.hasOwnProperty.call(options, 'promotedOpacity')) {
      const value = Number(options.promotedOpacity);
      if (Number.isFinite(value)) target.promotedOpacity = Math.min(1, Math.max(0, value));
    }
    assignmentListDirty = true;
    return true;
  }

  return {
    enabled,
    sync,
    realign,
    clear,
    setAssignmentOptions,
  };
}
