# Collection / Shop / Appearance Dye Review

## Current dye system summary
- `docs/config/scratchbones-config.js` is the dye source of truth.
- `window.SCRATCHBONES_CONFIG.game.dyes.catalog` is now generated deterministically from the 13 hue families, 9 chromatic variants, and 6 neutrals.
- Catalog total: **123 dyes**.
  - Chromatic dyes: **117** (`13 hue families × 9 variants`).
  - Neutral dyes: **6** (`White`, `Silver`, `Gray`, `Charcoal`, `Cream`, `Brown`).
- There is no `Black`, `Onyx`, or black-equivalent dye ID in the active catalog.
- `White` and `Charcoal` exist for future achievement paths and are excluded from mystery dye pools.
- Each generated dye keeps an intended `hex` reference color, and its runtime `color` offsets are precomputed fitted values for the actual `hue-rotate(...) saturate(...) brightness(...)` CSS/canvas filter pipeline used by portraits and swatches. The offsets are intentionally not simple HSV deltas from the mint swatch base, and config loading does not rerun the optimizer.

## End-to-end dye/avatar variable path

1. `docs/config/scratchbones-config.js` defines:
   - systematic hue family and variant metadata,
   - the mint `swatchBase` (`#7dc89a`),
   - the generated dye catalog, whose `hex` targets reference precomputed fitted `{ h, s, v }` filter offsets,
   - starter dye IDs,
   - mystery dye pool definitions,
   - the mystery dye price,
   - legacy dye ID migrations.
2. `docs/js/scratchbones-account.js` reads that config and persists:
   - `ownedDyes` as unique, currently valid systematic dye IDs,
   - per-Khymeryyan `appliedDyes` as tint key -> dye ID,
   - account `bronze` for mystery dye purchases.
3. New and migrated accounts receive exactly the configured starter dyes:
   - all 13 chromatic `Dusty` dyes,
   - `Silver`, `Gray`, `Cream`, and `Brown`.
4. Legacy dye IDs are migrated through `legacyDyeMigrations`; invalid/removed IDs are dropped.
   - Legacy starter hue IDs (`red`, `orange`, `yellow`, `green`, `blue`, `purple`) map to their corresponding `Dusty` starter dyes instead of to non-starter prefixed variants.
   - Legacy starter neutral IDs map into the starter neutral set: `brown` stays `Brown`, `black` falls back to `Gray`, `white` falls back to `Silver`, and `grey` maps to `Gray`.
   - New and migrated players do not receive or purchase `White` or `Charcoal`; those remain future-achievement metadata.
5. Collections UI (`docs/js/scratchbones-lobby.js`) reads only owned dyes for normal dye selection, sorts by hue family and variant, and renders swatches from the mint base plus each dye's fitted `color` offsets.
6. Shop UI reads `ScratchbonesAccount.getMysteryDyeShopCatalog()` and shows seven mobile-visible mystery dye items.
7. `buyMysteryDye(poolId)` deducts the configured bronze price, grants exactly one unowned eligible chromatic dye from that pool, and returns the granted dye.
8. Multiplayer appearance payloads continue to pass `appliedDyes` as dye IDs; game bootstrap resolves those IDs against the same catalog and applies the fitted `dye.color` offsets to portrait/body color slots, where `docs/js/portrait-utils.js` turns them into the same `hue-rotate(...) saturate(...) brightness(...)` filter chain.

## Mystery dye pools

- **Red Mystery Dye:** Red, Red-Orange.
- **Orange Mystery Dye:** Red-Orange, Orange, Yellow-Orange.
- **Yellow Mystery Dye:** Yellow-Orange, Yellow, Yellow-Green.
- **Green Mystery Dye:** Yellow-Green, Green, Green-Blue.
- **Blue Mystery Dye:** Green-Blue, Blue, Blue-Indigo.
- **Indigo Mystery Dye:** Blue-Indigo, Indigo, Indigo-Violet.
- **Violet Mystery Dye:** Indigo-Violet, Violet.

Pools intentionally overlap on in-between hue families. Pools include Dusty chromatic dyes, but starter ownership means normal new accounts already own those entries and cannot receive them as duplicates.

## Validation coverage

`tests/account.test.js` validates:
- catalog size and chromatic/neutral counts,
- no Black/Onyx active catalog entries,
- unique dye IDs and labels,
- required chromatic/neutral metadata and rendering fields,
- precomputed generated dye offsets against the actual CSS filter pipeline,
- exact starter dye ownership,
- legacy dye migration/removal behavior,
- mystery pool overlap and exclusions,
- mystery purchase success/failure behavior,
- duplicate prevention,
- `applyDye` acceptance for owned systematic dyes and rejection for unowned dyes.

## Remaining avatar consistency notes

1. Multiplayer still has historical local fallback paths when remote payload fields are missing. That behavior is unrelated to the dye catalog replacement, but it can still make partial remote payloads render with viewer-local cosmetics/dyes.
2. Preview helper behavior should continue to be reviewed if future UI previews non-local snapshots.
3. Future achievement implementation should award `White`/`Charcoal` through the account layer without adding them to mystery pools.
