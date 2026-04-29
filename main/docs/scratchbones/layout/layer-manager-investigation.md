# Layer Manager Investigation: Position/Scale Drift Between Pre/Post Promotion

Date: 2026-04-29

## Scope traced end-to-end
- `config/normalizeScratchbonesGameConfig.js` normalization of `layout.layerManager` defaults and allowed placement mode values.
- `ui/layerManager.js` host/root/portal creation, placement computation, and promoted-node normalization behavior.
- `bootstrap.js` render flow, projection preview mode switching, deterministic dual-mode capture, and export payload assembly.
- `layout/diagnostics.js` rendered-screen-space delta computation and top-drift ranking.

## Variable path walkthrough (authoritative)
1. Raw config is normalized by `normalizeScratchbonesGameConfig()`.
   - `layout.layerManager.placementMode` is normalized, but parity-test layer promotion now runs in forced `"screen-space"` mode.
2. `createLayerManager({ gameConfig, debugLog })` reads:
   - `placementMode`
   - `normalizePromotedElementBox`
3. During `sync(app)` in `ui/layerManager.js`, promoted nodes are moved under per-layer portal roots.
4. `updatePortalRect()` now always copies placeholder viewport geometry directly to `position: fixed` portal fields (`left/top/width/height`).
5. Render/export path in `bootstrap.js`:
   - Single-mode export (`buildRenderedTransformsExport`) captures whichever preview mode is currently active.
   - Dual-mode export (`buildRenderedTransformsDualModeExport`) deterministically captures both `original` and `layered` by temporarily toggling preview state in a fixed order, awaiting a render frame each time, then restoring prior UI state.
6. Drift artifacts are computed from `renderedScreenSpace` in two places:
   - immediately in dual-mode export serialization (`buildRenderedTransformsDualModeExport`) so export payload always includes fresh comparison fields.
   - `updateLayoutDiagnosticsState()` for the live diagnostics state shown in-editor.
   Both produce:
   - `renderedScreenSpaceDelta`
   - `renderedScreenSpaceTopDrift`

## Current behavior corrections

### Placement is now fixed to screen-space in this parity-test path
Current behavior:
- Promotion host/layer roots/portals use `position: fixed`.
- Portal geometry is derived from placeholder `getBoundingClientRect()` only.
- App-local inverse mapping is disabled for this path.

### Export no longer requires manual mode toggling for complete comparison
Outdated assumption: users must manually toggle preview modes and export each mode separately.

Current behavior:
- A deterministic dual-mode export path captures both modes in one run (`projectionPreviewMode: "both"`).
- Capture order is fixed (`original` then `layered`) and includes a frame wait after each render, reducing race conditions and making drift reports reproducible.
- Manual single-mode export still exists for spot checks, but it is not required for drift baselining.

## Screen-space placement mechanics (detailed)
In the active parity-test path:
- Host is appended to `document.body` instead of `#app`.
- Host/layer roots/portals use `position: fixed` + `overflow: visible`.
- Portal rects are set directly from placeholder viewport rect fields (`left`, `top`, `width`, `height`).

Practical effect:
- Promotion no longer inherits app-local transform scaling/translation math for geometry placement.
- This minimizes authored-transform-induced drift and clipping interactions with app-local stacking/transform containers.

## Deterministic dual-mode export workflow (recommended)
1. In projection UI, run the dual-mode rendered transforms export action (the one that emits `projectionPreviewMode: "both"`).
2. Re-run dual-mode export after code/config changes.
3. Compare `layout.renderedScreenSpaceDelta` / `layout.renderedScreenSpaceTopDrift` between exports.

Notes:
- Dual-mode export compares `original` vs `layered` within one deterministic capture session.
- To compare placement strategies, run two dual-mode exports (one per `placementMode`) and diff their drift sections.

## How to interpret drift output fields

### `layout.renderedScreenSpace`
Raw snapshots keyed by mode (`original`, `layered`) and then by `data-proj-id` (with `#2`, `#3`, etc. suffixes for duplicates). Each entry includes:
- `transform`: computed CSS transform string.
- `rect`: rounded viewport-space geometry.

Use this for forensic per-element inspection.

### `layout.renderedScreenSpaceDelta`
Structured mode-to-mode deltas:
- `modeA` / `modeB`: compared mode names (typically `original` and `layered`).
- `deltas[]`: one entry per matched element key containing:
  - `id`
  - `modeA`, `modeB` rect snapshots
  - `rectDelta` (`dx`, `dy`, `dw`, `dh`, plus edge deltas)

Use this for exact numeric regression checks and automated diff tooling.

### `layout.renderedScreenSpaceTopDrift`
Ranked summary for quick triage:
- Pre-sorted highest-to-lowest by drift magnitude.
- Contains per-id magnitude and threshold-classification hints from diagnostics summary.

Use this as the first stop to find the worst offenders before drilling into raw deltas.

## Updated conclusion
The core tradeoff remains: DOM reparenting can still be semantically lossy for context-dependent layout. Reliability in this test path now comes from fixed screen-space placement plus deterministic dual-mode export capture.

`normalizePromotedElementBox` remains opt-in and should only be enabled when intentional `100%` fill coercion is desired for promoted nodes.
