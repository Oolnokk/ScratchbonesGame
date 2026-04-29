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
### 1) App-level authored transform is correctly compensated
`updatePortalRect()` divides viewport-space placeholder values by app transform scale, which is necessary because portal coordinates are app-local and app is transformed. This part is mathematically consistent.

### 2) Promotion mutates containing-block semantics
Before this change, promoted elements with computed `position: absolute|fixed` were forced to `position: relative` with `left/top=0` in the portal. That can alter descendant layout and sizing behavior (especially if children rely on absolute positioning against the promoted element’s containing block behavior).

### 3) Promotion drops ancestor positioning context by design
A promoted node exits its original DOM chain and loses inherited containing context from non-promoted ancestors. Placeholder geometry preserves outer box placement, but internal layout may still diverge if descendants relied on upstream positioning context.

### 4) Scale drift can be compounded by width/height coercion
Forced `width/height: 100%` is useful for many cards/panels, but if original sizing depended on intrinsic or content-driven sizing, post-promotion scale can deviate.

## Change made during investigation
- Normalized promoted `absolute|fixed` elements to `position: absolute` (not `relative`) inside the portal so containing-block behavior is less distorted.
- Added richer promotion debug payload (`originalPosition`, placeholder width/height) to improve root-cause visibility in debug streams.

## Remaining risk areas to validate in runtime
- Nodes that intentionally depended on fixed positioning semantics.
- Nodes whose dimensions are primarily intrinsic/content-driven.
- Nested promoted/unpromoted boundary components with transform-heavy ancestors.
