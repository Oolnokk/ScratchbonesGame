function normalizeSelectorList(value) {
  if (Array.isArray(value)) return value.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim());
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
}
function normalizeStringList(value) {
  if (!Array.isArray(value)) return [];
  return value.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim());
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
  const placementMode = 'screen-space';
  const assignments = Array.isArray(managerConfig.assignments) ? managerConfig.assignments : [];
  const configuredLayerOrder = normalizeStringList(managerConfig.layerOrder);
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
    const sourceRect = entry.placeholder.getBoundingClientRect();
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
    const shouldNormalizeBox = normalizePromotedElementBox && canSafelyNormalizePromotedBox(element, computed);
    if (shouldNormalizeBox) {
      element.style.margin = '0';
    }
    element.style.position = 'absolute';
    element.style.left = '0';
    element.style.top = '0';
    element.style.right = 'auto';
    element.style.bottom = 'auto';
    element.style.width = '100%';
    element.style.height = '100%';

    const promotedEntry = { assignment, element, placeholder, portal, originalElementStyle };
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
      transformSensitive: isTransformSensitive,
      reanchoredAbsolutePosition: true,
      placementMode,
    });
    return true;
  }

  function sync(app = document.getElementById('app')) {
    if (!enabled || !app || !assignmentList.length) return;
    ensureHost(app);
    if (!state.host) return;
    clearPromoted();
    const seen = new Set();
    const promotedAncestors = [];
    for (const assignment of assignmentList) {
      for (const selector of assignment.selectors) {
        app.querySelectorAll(selector).forEach((node) => {
          if (!(node instanceof Element) || seen.has(node)) return;
          if (promotedAncestors.some((ancestor) => ancestor.contains(node))) return;
          seen.add(node);
          if (promoteElementToLayer(node, assignment)) promotedAncestors.push(node);
        });
      }
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
