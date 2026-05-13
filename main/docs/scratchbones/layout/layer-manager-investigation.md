# Layer Manager Investigation: Position/Scale Drift Between Pre/Post Promotion

Date: 2026-04-29

## Scope traced end-to-end
- `config/normalizeScratchbonesGameConfig.js` normalization of `layout.layerManager` defaults and allowed placement mode values.
- `ui/layerManager.js` host/root/portal creation, placement computation, and promoted-node normalization behavior.
- `bootstrap.js` render flow, projection preview mode switching, deterministic dual-mode capture, and export payload assembly.
- `layout/diagnostics.js` rendered-screen-space delta computation and top-drift ranking.

## Variable path walkthrough (authoritative)
1. Raw config is normalized by `normalizeScratchbonesGameConfig()`.
   - `layout.layerManager.placementMode` is normalized to either `"authored-space"` or `"screen-space"`, with legacy `"authored-coordinate"` treated as `"authored-space"`.
2. `createLayerManager({ gameConfig, debugLog })` reads layer assignment + preservation config once, resolves the normalized placement mode, and dispatches portal geometry through authored-space or screen-space helpers.
3. During `sync(app)` in `ui/layerManager.js`, promoted nodes are moved under per-layer portal roots.
4. `updatePortalRect()` captures placeholder + app viewport rects in one measurement frame, then applies mode-specific geometry to `position: fixed` portal fields (`left/top/width/height`).
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

### Placement now follows the normalized layer-manager mode
Current behavior:
- Promotion host/layer roots/portals use `position: fixed`.
- Portal geometry is derived from a single capture frame (`placeholder.getBoundingClientRect()` plus app rect metadata for traceability/debug).
- `"screen-space"` placement copies viewport-space portal geometry directly.
- `"authored-space"` placement maps captured app-local authored coordinates back through the app rect and app scale, using the configured portal scale strategy.

### Export no longer requires manual mode toggling for complete comparison
Outdated assumption: users must manually toggle preview modes and export each mode separately.

Current behavior:
- A deterministic dual-mode export path captures both modes in one run (`projectionPreviewMode: "both"`).
- Capture order is fixed (`original` then `layered`) and includes a frame wait after each render, reducing race conditions and making drift reports reproducible.
- Manual single-mode export still exists for spot checks, but it is not required for drift baselining.

## Placement mechanics (detailed)
Shared mechanics:
- Host is appended to `document.body` instead of `#app`.
- Host/layer roots/portals use `position: fixed` + `overflow: visible`.
- A single capture frame records placeholder viewport rects, app viewport rects, and derived app scale.

Mode-specific mechanics:
- `"screen-space"`: portal rects are set directly from placeholder viewport rect fields (`left`, `top`, `width`, `height`).
- `"authored-space"`: portal `left`/`top` are rebuilt from app viewport origin plus authored coordinates multiplied by app scale; width/height either remain authored and move scale into the portal transform (`portalScaleStrategy: "portal-transform"`) or are multiplied into dimensions.

Practical effect:
- Screen-space mode minimizes authored-transform-induced drift and clipping interactions with app-local stacking/transform containers.
- Authored-space mode preserves the app-local coordinate model while still promoting nodes into fixed body-level layer roots.

## Deterministic dual-mode export workflow (recommended)
1. In projection UI, run the dual-mode rendered transforms export action (the one that emits `projectionPreviewMode: "both"`).
2. Re-run dual-mode export after code/config changes.
3. Compare `layout.renderedScreenSpaceDelta` / `layout.renderedScreenSpaceTopDrift` between exports.

Notes:
- Dual-mode export compares `original` vs `layered` within one deterministic capture session.
- Placement strategy A/B by `placementMode` is valid again: compare `"authored-space"` and `"screen-space"` by changing `layout.layerManager.placementMode` in config and re-running the deterministic dual-mode export.

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
The core tradeoff remains: DOM reparenting can still be semantically lossy for context-dependent layout. Reliability in this test path now comes from explicit placement-mode selection plus deterministic dual-mode export capture.

Promoted nodes are re-anchored inside their fixed portal (`position:absolute; left/top:0`), and eligible normalized boxes fill the portal (`width/height:100%`) so portal geometry remains the placement source for those elements.

## 2026-05-11 candlelight layer follow-up

### Variable path traced
1. `docs/config/scratchbones-config.js` defines two candlelight sources under `layout.lighting.candlelight.sources`; both are consumed by `initCandleLight()` in `fx/candlelight.js` and rendered into the shared glow work canvas.
2. The normal in-app candlelight canvases (`candleShadowCanvas`, `candleDarknessCanvas`, `candleGlowCanvas`) are appended inside `#app`, while `thevmenuCandlelightLayer` is intentionally appended under `document.body` so it can sit above promoted layer-manager UI.
3. `#app` is positioned by authored layout through a CSS transform, so its viewport-space `getBoundingClientRect()` can change on rotation even when a `ResizeObserver` does not report a new untransformed content size.
4. The body-hosted `thevmenuCandlelightLayer` therefore must poll the current `#app` viewport rect before drawing. If left/top/width/height changed, candlelight resizes its drawing buffers and restamps the fixed canvas to the live app rect.
5. The body-hosted layer no longer punches out `#aiSidebar`, `.humanSeatZone`, `.turnSpotlight`, or `.claimCluster`; those destination-out masks were the source of the visible element-shaped cutouts above the candlelight layer and are not needed now that promoted UI already owns its stacking order.

## Projection map debug/edit split
Current behavior:
- The `Map` button now opens a debug-first projection view: every body element receives a generation-colored outline, cycling red, orange, yellow, green, blue, indigo, and violet from outer to deeper nesting.
- Touching or hovering an outlined element reports a prompt-friendly element reference in the editor status/tooltip, preferring `data-proj-id` when present.
- Moving or resizing authored boxes/sub-elements requires enabling the separate `Edit` button while Map is active. The `Sub` overlay button is only exposed in this edit mode so accidental debug touches cannot mutate layout config.
- Debug color and button/status labels live under `layout.projectionMapping.debug` in `docs/config/scratchbones-config.js`.

## 2026-05-13 challenge Tankanscript column layout QA

### Variable path traced
1. `docs/config/scratchbones-config.js` owns the challenge Tankanscript layout constants under `layout.tableView.cinematic.tankanColumns`; `edgeInsetPx` is also mirrored into `--layout-tankan-edge-inset` for runtime CSS overrides.
2. `mountChallengeTankanColumns()` receives the challenge label text, strips terminal punctuation, and clears `.cin-tankan` nodes when no text remains.
3. The actor and reactor anchor rects come from `.actorAvatarFloat .claimAvatarShell` / `.reactorAvatarFloat .claimAvatarShell`, with `.actorAvatarFloat` / `.reactorAvatarFloat` as anchor fallbacks.
4. If either anchor is hidden or missing, the column uses the configured fallback avatar half-width and center-y offset around the measured `#app` center; this preserves the previous missing-anchor behavior.
5. After each column is appended or updated, `getBoundingClientRect()` is read from the rendered `.cin-tankan` node and compared against the live `#app` rect plus the configured edge inset. Any overflow shifts the node's app-local `left` / `top` values back inside the allowed rect.

### Manual QA notes
- Trigger a challenge reveal at a narrow viewport and verify both vertical Tankanscript columns are visible without crossing the `#app` edge inset.
- Repeat at the authored-layout reference size and a wide desktop viewport; the columns should remain tight to the actor/reactor sides unless the rendered text would overflow.
- Temporarily hide either cinematic avatar anchor in DevTools and retrigger the reveal; the fallback positions should still render columns inside `#app` instead of clearing them.
- Inspect the injected `#scratchbones-challenge-tankan-layout-overrides` style to confirm the legacy monolith `.cin-tankan.right { right: ... }` rule is neutralized at runtime rather than edited in `ScratchbonesBluffGame.html`.
