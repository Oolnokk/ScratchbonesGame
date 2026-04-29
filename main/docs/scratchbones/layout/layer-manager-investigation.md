# Layer Manager Investigation: Position/Scale Drift Between Pre/Post Promotion

Date: 2026-04-29

## Scope traced
- `bootstrap.js` render pipeline and authored-mode application.
- `layout/authoredLayout.js` transform path (`translate + scale`).
- `ui/layerManager.js` promotion, placeholder sizing, portal rect mapping, and post-promotion style mutation.

## Variable path walkthrough
1. `render()` applies authored mode (`applyAuthoredLayoutMode`) which sets `#app` width/height and `transform: translate(...) scale(...)`.
2. In the same frame, `SCRATCHBONES_LAYER_MANAGER.sync(app)` runs (unless unlayered preview is active).
3. `sync()` scans assignment selectors, inserts a placeholder at original location, and moves target into a portal root under `#uiLayerManagerHost`.
4. `updatePortalRect()` maps placeholder viewport rect back to app-local coordinates using:
   - `scaleX = appRect.width / appLayoutWidth`
   - `localLeft = (phRect.left - appRect.left) / scaleX`
   - same for top/width/height.
5. Promoted element style is then mutated: margin reset, `width/height = 100%`, and position normalization for `absolute`/`fixed` entries.

## Findings
### 1) App-level authored transform compensation is not the primary fault
`updatePortalRect()` remaps viewport-space placeholder geometry back into app-local coordinates via `scaleX/scaleY`. For authored mode (`transform: translate(...) scale(...)` on `#app`), this conversion is mathematically correct for left/top/width/height.

### 2) Promotion is inherently lossy for context-dependent layout
Promoted nodes are physically reparented into `#uiLayerManagerHost`, so they lose original ancestor context (containing block relationships, inherited layout constraints, stacking/transform context). Placeholder geometry restores outer placement, but not all internal layout semantics.

### 3) Large post-promotion scale drift is amplified by forced box normalization
The previous default always set promoted elements to:
- `margin: 0`
- `width: 100%`
- `height: 100%`

That is convenient for some components, but it can significantly alter sizing for intrinsic/content-driven elements and for elements whose dimensions were previously controlled by non-portal ancestors. This is a major contributor to the observed pre/post discrepancy.

### 4) Absolute/fixed normalization remains necessary but is not sufficient
Keeping `absolute|fixed` promoted elements pinned at `left/top=0` in the portal is still needed to avoid immediate positional jumps, but this does not solve semantic drift caused by reparenting and forced box fills.

## Change made during investigation
- Added a new layer-manager config flag: `normalizePromotedElementBox` (default `false`).
- Promotion now only forces `margin:0; width:100%; height:100%` when that flag is explicitly enabled.
- Kept existing absolute/fixed normalization and added debug payload field `normalizePromotedElementBox` so traces clearly show when coercive sizing is active.
- Added post-placement transform composition in the portal (`translate + scale`) based on live `placeholderRect` vs promoted `elementRect` deltas. This compensates for transform/context drift introduced by reparenting, instead of assuming direct coordinate remap is sufficient in all cases.

## Interim conclusion
There is a fundamental tradeoff in the current promotion approach: DOM reparenting will always risk semantic drift for elements that rely on ancestor layout context. The previous always-on forced sizing made this much worse. The new default removes that forced coercion so promotion behavior is closer to authored/original rendering by default.

## Notes on regular UI + aspect ratio/resolution sync
- `#app` authored scaling remains a separate transform application (`translate + uniform scale`), while promoted nodes can also carry their own local transforms.
- The new compensation step explicitly composes those effects at the portal level, reducing mismatch when aspect ratio or resolution causes subtle scale/position drift.
- Responsive mode and authored mode both flow through `updatePortalRect()` because rects are taken from live DOM metrics; this keeps sync tied to real rendered geometry, not assumptions.

## Remaining risk areas to validate in runtime
- Nodes that intentionally depended on fixed positioning semantics.
- Nodes whose dimensions are primarily intrinsic/content-driven.
- Nested promoted/unpromoted boundary components with transform-heavy ancestors.
