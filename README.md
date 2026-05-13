# ScratchbonesGame

A digital implementation of the Scratchbones bluff card game.

## Running the Game

Open `ScratchbonesBluffGame.html` in a browser (or serve it with any static file server).

## Online Multiplayer (WebSocket Relay)

The multiplayer lobby connects to a WebSocket relay server.  The URL is
configured in **`docs/config/scratchbones-config.js`** via the `wsUrl` property
at the top of `window.SCRATCHBONES_CONFIG`.

### Changing the ngrok (or other public) URL

1. Open `docs/config/scratchbones-config.js`.
2. Find the line:
   ```js
   wsUrl: 'wss://mustang-walk-schematic.ngrok-free.dev',
   ```
3. Replace the URL with your new ngrok address (or any public WebSocket server
   address).  Use `wss://` for secure connections and `ws://` for plain ones.

### Using localhost (local development only)

To connect to a local relay server instead of the public ngrok address, either:

* **Comment out** the `wsUrl` line in `docs/config/scratchbones-config.js`:
  ```js
  // wsUrl: 'wss://mustang-walk-schematic.ngrok-free.dev',
  ```
* **Or delete** the `wsUrl` property entirely.

When `wsUrl` is absent the lobby falls back to `ws://localhost:8080`.

### Starting the relay server locally

```bash
cd server
npm install
node index.js
```

The server listens on port 8080 by default (override with the `PORT`
environment variable).

## Scratchbones Portrait Configuration

NPC portrait randomization is configured under `game.portrait.randomization` in
`docs/config/scratchbones-config.js`. The `minimumNpcClothingArticles` setting
defaults to `1`, and the configured `clothingSlots`/repair preference ensure
NPC-generated portraits are guaranteed at least one visible clothing article.
This guard only applies to NPC profile generation; human portraits continue to
use their saved or selected appearance without forced clothing. Cloth hood color
inheritance is also configured there: `clothHoodColorSourceSlots` checks
`armCosmetic` (overwear) before `torsoCosmetic`, and cloth hoods reuse the first
visible cloth source colors found.

## Trick bone loadouts

Scratchbones now builds trick bones from player loadouts instead of a fixed deck-wide trick count. Each player brings a configured six-slot trick bone loadout; duplicates are allowed. At the start of each fresh deck, every active player's loadout is added to the shared deck before shuffling and dealing. Trick bones are not placed directly into their owner's hand, so any player can be dealt another player's preferred Smuggle, Trap, or Punish bones.

The default trick-bone unlocks, six-slot default loadout, per-trick metadata, and NPC trick archetype weights live in `docs/config/scratchbones-config.js` under `game.trickBones`.

## AI difficulty ranks

Scratchbones AI difficulty is configured under `game.ai` in `docs/config/scratchbones-config.js` and normalized by `main/docs/scratchbones/config/normalizeScratchbonesGameConfig.js`. The normalized field names are `defaultDifficultyRank`, `difficultyRanks`, `seatDifficultyRanks`, and `renownDisplay`.

The built-in rank IDs are `easy`, `normal`, and `hard`, and the config can also define custom rank IDs such as `boss`. If `defaultDifficultyRank` is missing or unknown, the normalizer falls back to `normal`; if a per-seat rank is unknown, that seat falls back to the normalized default rank. Per-seat overrides can target absolute seat IDs such as `"1"`, `"2"`, and `"3"`, or NPC-order aliases such as `"0"`, `"npc:0"`, `"npc0"`, `"ai:0"`, and `"ai0"`.

AI decision flow is intentionally layered rather than omniscient:

1. **Turn choice** first checks personality-neutral opportunity overrides, then selects a playbook from the resolved rank. Those overrides make every archetype willing to tell a large/round-clearing truth, spend a Trap Bone truthfully, fire a high-value Smuggle bluff, or bluff with a last/trick/non-matching bone instead of conceding when there is no truthful active line. After that, `easy` uses a naive habit loop, `normal` uses the heuristic playbook, and `hard` or any custom higher rank uses scored candidate selection.
2. **Challenge choice** computes suspicion from visible rank counts, remembered reads, personality, human-target bias, and a rank-specific random nudge, then compares it with the rank's resolved challenge threshold.
3. **Betting choice** turns challenge suspicion, bankroll pressure, courage, remembered reads, perceived opponent fold pressure, and rank-specific raise/fold tuning into fold/call/raise intent.
4. **Timing** stays separate from skill: actual turn/challenge/betting wait times come from `game.timers.aiDecisionDelays` plus `game.ai.decision.delays`, while rank random nudge fields control uncertainty.

Boss-capable gaps to watch:

- Custom ranks must survive normalization; otherwise `seatDifficultyRanks: { "3": "boss" }` silently falls back to the default rank before gameplay sees it.
- A custom rank can set `extends: "hard"` to inherit every hard-profile field and override only the boss deltas.
- `renownDisplay.levels` should include each custom rank so the UI has an authored player-facing label instead of a generic fallback.
- Extremely low challenge thresholds and zero betting mistakes can feel unfair quickly; tune `challengeRandomNudgeMax`, `bettingConfidenceRandomNudgeMax`, and `bettingRaiseMistakeChance` deliberately to keep bosses readable.

Minimal override example:

```js
game: {
  ai: {
    defaultDifficultyRank: 'hard',
    seatDifficultyRanks: { '2': 'easy', '3': 'boss' },
    difficultyRanks: {
      hard: { challengeThresholdModifier: -0.04 },
      boss: { extends: 'hard', challengeThresholdModifier: -0.08 }
    },
    renownDisplay: {
      levels: {
        boss: { label: 'Renown IV', title: 'Bone Boss' }
      }
    }
  }
}
```

## Account and Khymeryyans

Scratchbones stores one browser-local account in `localStorage` under `sb_account_v1`. Account-wide Bronze, cosmetic unlocks, dye ownership, and unlocked trick bones are shared across the account. Playable identities are Khymeryyans: each Khymeryyan has its own name, species/gender appearance, equipped cosmetics, applied dyes, and trick bone loadout. The lobby lets players select, create, duplicate, delete, and edit Khymeryyans before offline or online play.
