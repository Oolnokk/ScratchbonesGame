ScratchbonesBluffGame culled bundle
Generated at: 2026-04-28T18:06:43.281Z
Command: node main/docs/scratchbones/tools/audit-deps.js

Updated entrypoint list:
- ScratchbonesBluffGame.html
- docs/config/scratchbones-config.js
- docs/js/portrait-utils.js
- docs/js/scratchbones-name-generator.js
- main/docs/scratchbones/bootstrap.js

Module dependency graph (ES modules):
- main/docs/scratchbones/bootstrap.js ->
  - main/docs/scratchbones/config/normalizeScratchbonesGameConfig.js
  - main/docs/scratchbones/debug/metadata.js
  - main/docs/scratchbones/debug/panel.js
  - main/docs/scratchbones/fx/audio.js
  - main/docs/scratchbones/fx/candlelight.js
  - main/docs/scratchbones/layout/authoredLayout.js
  - main/docs/scratchbones/layout/diagnostics.js
  - main/docs/scratchbones/state/createInitialState.js
- main/docs/scratchbones/config/normalizeScratchbonesGameConfig.js -> (no local module imports)
- main/docs/scratchbones/debug/metadata.js -> (no local module imports)
- main/docs/scratchbones/debug/panel.js -> (no local module imports)
- main/docs/scratchbones/fx/audio.js -> (no local module imports)
- main/docs/scratchbones/fx/candlelight.js -> (no local module imports)
- main/docs/scratchbones/layout/authoredLayout.js -> (no local module imports)
- main/docs/scratchbones/layout/diagnostics.js -> (no local module imports)
- main/docs/scratchbones/state/createInitialState.js -> (no local module imports)

Runtime asset/config dependencies:
- docs/config/cosmetics/index.json
- docs/config/scratchbones-config.js
- docs/config/species/index.json
- docs/assets/audio/bgm/tankan_nocturne.mp3
- docs/assets/audio/scratchbones/bgm/challenge-loop.mp3
- docs/assets/audio/scratchbones/sfx/card-fade.mp3
- docs/assets/audio/scratchbones/sfx/challenge-end.mp3
- docs/assets/audio/scratchbones/sfx/challenge-start.mp3
- docs/assets/audio/scratchbones/sfx/claim-to-hand.mp3
- docs/assets/audio/scratchbones/sfx/hand-to-table.mp3
- docs/assets/audio/scratchbones/sfx/opponent-to-table.mp3
- docs/assets/audio/scratchbones/sfx/table-to-claim.mp3
- docs/assets/audio/sfx/tablesounds/boneclack1.m4a
- docs/assets/hud/coin_eclipse.png
- docs/assets/hud/coin_sun.png
- docs/assets/hud/coin_tinmoon.png
- docs/assets/hud/Khymeryyanroman4.otf
- docs/assets/hud/tabletop.png
- docs/assets/hud/tankanscript_rotated_flipped_horiz.otf
- docs/assets/symbols/boneglyph{rank}.png

Missing runtime files referenced by these dependencies:
- docs/assets/audio/scratchbones/bgm/challenge-loop.mp3
- docs/assets/audio/scratchbones/sfx/card-fade.mp3
- docs/assets/audio/scratchbones/sfx/challenge-end.mp3
- docs/assets/audio/scratchbones/sfx/challenge-start.mp3
- docs/assets/audio/scratchbones/sfx/claim-to-hand.mp3
- docs/assets/audio/scratchbones/sfx/hand-to-table.mp3
- docs/assets/audio/scratchbones/sfx/opponent-to-table.mp3
- docs/assets/audio/scratchbones/sfx/table-to-claim.mp3

Notes:
- `docs/js/portrait-utils.js` dynamically fetches docs/config indexes and species/cosmetics manifests at runtime; those JSON paths and image files are runtime dependencies even when not imported as ES modules.
- Paths with `{rank}` are templates expanded at runtime.
