function normalizeSelectorList(value) {
  if (Array.isArray(value)) return value.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim());
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
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
  const assignments = Array.isArray(managerConfig.assignments) ? managerConfig.assignments : [];
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
  const layerNames = Array.from(new Set(assignmentList.map((entry) => entry.layer)));

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
      'position:absolute',
      'inset:0',
      'pointer-events:none',
      `z-index:${hostZIndex}`,
    ].join(';');
    const roots = new Map();
    for (const layerName of layerNames) {
      const root = document.createElement('div');
      root.className = `ui-layer ui-layer-${layerName}`;
      root.dataset.layerName = layerName;
      root.style.cssText = 'position:absolute;inset:0;pointer-events:none;';
      host.appendChild(root);
      roots.set(layerName, root);
    }
    app.appendChild(host);
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
    if (!state.app || !entry?.placeholder || !entry?.portal) return;
    const appRect = state.app.getBoundingClientRect();
    const phRect = entry.placeholder.getBoundingClientRect();
    const appLayoutWidth = Math.max(1, state.app.offsetWidth || state.app.clientWidth || appRect.width || 1);
    const appLayoutHeight = Math.max(1, state.app.offsetHeight || state.app.clientHeight || appRect.height || 1);
    const scaleX = appRect.width / appLayoutWidth || 1;
    const scaleY = appRect.height / appLayoutHeight || 1;
    const localLeft = (phRect.left - appRect.left) / scaleX;
    const localTop = (phRect.top - appRect.top) / scaleY;
    const localWidth = phRect.width / scaleX;
    const localHeight = phRect.height / scaleY;
    entry.portal.style.left = `${localLeft.toFixed(4)}px`;
    entry.portal.style.top = `${localTop.toFixed(4)}px`;
    entry.portal.style.width = `${Math.max(1, localWidth).toFixed(4)}px`;
    entry.portal.style.height = `${Math.max(1, localHeight).toFixed(4)}px`;
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
      placeholder.style.width = `${Math.max(1, layoutWidth).toFixed(4)}px`;
      placeholder.style.height = `${Math.max(1, layoutHeight).toFixed(4)}px`;
      placeholder.style.marginTop = computed.marginTop;
      placeholder.style.marginRight = computed.marginRight;
      placeholder.style.marginBottom = computed.marginBottom;
      placeholder.style.marginLeft = computed.marginLeft;
      placeholder.style.flex = computed.flex;
    } else {
      placeholder.style.display = 'none';
    }
    element.parentNode?.insertBefore(placeholder, element);

    const portal = document.createElement('div');
    portal.className = `ui-layer-portal ui-layer-portal-${assignment.layer}`;
    portal.style.cssText = 'position:absolute;pointer-events:auto;';
    layerRoot.appendChild(portal);
    portal.appendChild(element);

    element.style.margin = '0';
    element.style.width = '100%';
    element.style.height = '100%';
    if (computed.position === 'absolute' || computed.position === 'fixed') {
      element.style.position = 'absolute';
      element.style.left = '0';
      element.style.top = '0';
      element.style.right = 'auto';
      element.style.bottom = 'auto';
    }

    const promotedEntry = { assignment, element, placeholder, portal, originalElementStyle };
    state.promoted.push(promotedEntry);
    updatePortalRect(promotedEntry);
    log('debug', 'promoted', {
      assignmentId: assignment.id,
      layer: assignment.layer,
      selectorName: element.id ? `#${element.id}` : element.className,
      retainedTransform: element.style.transform || 'none',
      originalPosition: computed.position,
      placeholderRect: { width: layoutWidth, height: layoutHeight },
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
