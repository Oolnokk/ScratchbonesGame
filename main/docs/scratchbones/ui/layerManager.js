function normalizeSelectorList(value) {
  if (Array.isArray(value)) return value.filter((entry) => typeof entry === 'string' && entry.trim()).map((entry) => entry.trim());
  if (typeof value === 'string' && value.trim()) return [value.trim()];
  return [];
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
    log('debug', 'host-created', { layerCount: roots.size, hostZIndex });
    return host;
  }

  function clearPromoted() {
    for (const entry of state.promoted) {
      entry.element.remove();
      entry.placeholder.remove();
      entry.portal.remove();
    }
    state.promoted = [];
  }

  function updatePortalRect(entry) {
    if (!state.app || !entry?.placeholder || !entry?.portal) return;
    const appRect = state.app.getBoundingClientRect();
    const phRect = entry.placeholder.getBoundingClientRect();
    entry.portal.style.left = `${Math.round(phRect.left - appRect.left)}px`;
    entry.portal.style.top = `${Math.round(phRect.top - appRect.top)}px`;
    entry.portal.style.width = `${Math.max(1, Math.round(phRect.width))}px`;
    entry.portal.style.height = `${Math.max(1, Math.round(phRect.height))}px`;
  }

  function promoteElementToLayer(element, assignment) {
    if (!state.app || !state.host || !element || !(element instanceof Element) || element.closest('#uiLayerManagerHost')) return;
    const layerRoot = state.roots.get(assignment.layer);
    if (!layerRoot) return;
    const rect = element.getBoundingClientRect();
    if (rect.width < 1 || rect.height < 1) return;
    const computed = window.getComputedStyle(element);
    const placeholder = document.createElement('div');
    placeholder.dataset.layerPlaceholderFor = assignment.id;
    if (assignment.preserveSpace ?? defaultPreserveSpace) {
      placeholder.style.display = computed.display === 'inline' ? 'inline-block' : computed.display;
      placeholder.style.width = `${Math.max(1, Math.round(rect.width))}px`;
      placeholder.style.height = `${Math.max(1, Math.round(rect.height))}px`;
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

    const promotedEntry = { assignment, element, placeholder, portal };
    state.promoted.push(promotedEntry);
    updatePortalRect(promotedEntry);
  }

  function sync(app = document.getElementById('app')) {
    if (!enabled || !app || !assignmentList.length) return;
    ensureHost(app);
    if (!state.host) return;
    clearPromoted();
    const seen = new Set();
    for (const assignment of assignmentList) {
      for (const selector of assignment.selectors) {
        app.querySelectorAll(selector).forEach((node) => {
          if (!(node instanceof Element) || seen.has(node)) return;
          seen.add(node);
          promoteElementToLayer(node, assignment);
        });
      }
    }
    for (const entry of state.promoted) updatePortalRect(entry);
    log('debug', 'sync-complete', { promotedCount: state.promoted.length });
  }

  function clear() {
    if (!enabled) return;
    clearPromoted();
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
