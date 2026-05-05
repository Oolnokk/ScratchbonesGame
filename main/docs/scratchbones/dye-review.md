# Collection / Shop / Appearance Dye Review

## Scope reviewed
- `docs/config/scratchbones-config.js`
- `docs/js/scratchbones-account.js`
- `docs/js/scratchbones-lobby.js`
- `main/docs/scratchbones/bootstrap.js`
- `docs/js/scratchbones-network.js`
- `server/index.js`
- `docs/js/portrait-utils.js`

## Direct answer: do avatars match across surfaces?

Short answer: **mostly yes for your own character, conditionally yes for other players, with specific mismatch edge cases**.

### Match matrix
- **Appearance editor preview ↔ collections/shop preview (local player):** usually matches for species/gender, cosmetics, base body colors, equipped cosmetics, and dyes.
- **Lobby previews ↔ in-game local avatar:** usually matches when account state is consistent.
- **Host view of remote players in multiplayer:** matches when each join payload includes `appearance` with `equippedCosmetics` and `appliedDyes`.
- **Client view of other players in multiplayer:** depends on host-generated state updates; generally matches what host generated.

### Known mismatch edge cases
1. **Multiplayer fallback behavior for missing dye/cosmetic payload fields**
   - In game bootstrap, if `player.appearance.appliedDyes` is `undefined`, code falls back to local account dyes.
   - Same pattern exists for equipped cosmetics fallback.
   - Result: if a remote appearance payload is partial, another player can be rendered with the viewer's own dyes/cosmetics.

2. **Preview helper uses live account equips/dyes, not appearance object equips/dyes**
   - `buildPreviewProfile(appearance)` applies cosmetics/bodyColors from `appearance`, but equips/dyes are always pulled from local account (`ScratchbonesAccount`), not from `appearance.equippedCosmetics`/`appearance.appliedDyes`.
   - Result: previewing any non-local snapshot appearance (or future spectator/inspect UI) can diverge.

3. **Dye catalog ID/name semantic drift risk**
   - Some legacy `dye:CLOTH:*` IDs encode one color-name token while labels describe another.
   - The authoritative catalog now lives in `docs/config/scratchbones-config.js`, and each cloth dye carries a display `dyeCategory` (`reds`, `oranges`, `yellows`, `greens`, `blues`, or `purples`) so UI grouping no longer depends on legacy ID names.

## End-to-end dye/avatar variable path

1. `docs/config/scratchbones-config.js` defines the dye catalog, swatch base, and cloth dye category ordering.
2. `ScratchbonesAccount` reads that config catalog and persists:
   - `appearance` (`speciesId`, `gender`, `cosmetics`, `bodyColors`)
   - `equippedCosmetics`
   - `appliedDyes` (tint key -> dye id)
3. Collections UI reads account state and config dye categories:
   - shows equipped-by-category and owned/filterable dyes
   - writes via `applyDye(dyeId, tintKey)` and `removeDye(tintKey)`
4. Lobby preview (`buildPreviewProfile`) builds a profile from species/gender + saved cosmetics/body colors, then overlays account equip/dyes.
5. Multiplayer join/create sends `getFullKhymeryyan()` session data: appearance details (`equippedCosmetics` + `appliedDyes`) plus the player's trick-bone loadout through the websocket payload.
6. Relay stores per-seat `appearance` and `playerLoadout`, then forwards occupants to host.
7. Host injects per-seat appearances into `SCRATCHBONES_SESSION.playerAppearances` and per-seat trick loadouts into `SCRATCHBONES_SESSION.playerLoadouts`.
8. In game bootstrap:
   - creates human base profile from `player.appearance`
   - applies equipped cosmetics from `player.appearance.equippedCosmetics` (or local fallback)
   - resolves dye ids to colors from catalog and writes into `player.profile.bodyColors` (or local fallback)
9. Host broadcasts rendered game state to clients; clients display that state.

## Follow-up hardening plan
1. Remove local fallback for remote-player missing fields in multiplayer render path (treat missing as empty map/list for remote humans).
2. Teach `buildPreviewProfile` to optionally consume `appearance.equippedCosmetics` and `appearance.appliedDyes` when provided.
3. Add domain-layer validation in `applyDye` so invalid group/slot combinations cannot be persisted even if UI filtering is bypassed.
4. Normalize dye IDs/labels and add deterministic migration mapping.

