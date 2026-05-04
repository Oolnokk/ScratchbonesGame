# Collection / Shop / Appearance Dye Review

## Scope reviewed
- `docs/js/scratchbones-account.js`
- `docs/js/scratchbones-lobby.js`
- `main/docs/scratchbones/bootstrap.js`
- `docs/js/portrait-utils.js`

## End-to-end dye data path

1. **Catalog + ownership source of truth** lives in `ScratchbonesAccount`:
   - `DYE_CATALOG` defines all dye/material options and tint offsets.
   - `ownedDyes` / `appliedDyes` are persisted in account save data.
2. **Collections UI rendering** (`renderCollections`) pulls:
   - equipped items from `getEquippedForCategory`
   - dyes from `getDyeCatalog`
   - ownership from `isDyeOwned`
   - active mapping from `getAppliedDyes`
3. **Apply/clear actions** in collections call:
   - `applyDye(dyeId, tintKey)`
   - `removeDye(tintKey)`
4. **Preview path** (`buildPreviewProfile`) reads `appliedDyes`, looks up each dye in `DYE_CATALOG`, and writes the tint into `profile.bodyColors[tintKey]`.
5. **In-match render path** (`bootstrap.js`) repeats the same mapping for each human player using `player.appearance.appliedDyes` (or local account fallback), then applies resulting `bodyColors` in portrait/composite rendering.

## Key findings

### 1) Dye IDs are semantically mismatched from labels
Several `dye:CLOTH:*` IDs encode one color name while the visible `label` is a different color (example: `dye:CLOTH:red` has label `Jade`).

Impact:
- Not immediately user-visible in the collections list (labels are shown), but risky for analytics, debugging, future server sync, and migration logic because IDs imply different meanings than UI names.

### 2) `applyDye` does not validate compatibility of dye group and tint target
`applyDye(dyeId, tintKey)` only checks ownership and dye existence. It does **not** enforce that a selected dye's `group` matches the equipped item material for the slot being dyed.

Current mitigation:
- Collections UI filters candidate dyes by equipped material before rendering.

Risk:
- Any future caller (or malformed/manual state) can assign incompatible combinations (e.g., metal dye to cloth tint slot) because business validation is only in UI, not domain/API layer.

### 3) Dual write targets for tint are intentional but easy to drift
Dyes are tracked by `appliedDyes` (ID mapping), while final tint values are rendered through `bodyColors` after resolving IDs against the catalog.

Risk:
- If `DYE_CATALOG` entries are renamed/removed, existing `appliedDyes` can silently no-op and previews/matches revert to base colors.

### 4) Bootstrap fallback behavior can leak local account dyes into remote renders
When `player.appearance.appliedDyes` is `undefined`, bootstrap falls back to local account dyes. This is fine for single-player/local flows but can misrepresent remote players if payloads are partially shaped.

## Recommended follow-up plan
1. Normalize CLOTH dye IDs to match their user-facing labels (or vice versa), then add migration mapping from old IDs.
2. Add compatibility validation inside `ScratchbonesAccount.applyDye`:
   - optional context parameter for slot/material, or
   - helper that checks `tintKey` family vs dye `group`.
3. Add explicit schema/version field in saved account data and perform deterministic dye migrations by version.
4. In multiplayer rendering, prefer explicit empty-object semantics over local fallback for remote player `appliedDyes`.

