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
use their saved or selected appearance without forced clothing.
## Trick bone loadouts

Scratchbones now builds trick bones from player loadouts instead of a fixed deck-wide trick count. Each player brings a configured six-slot trick bone loadout; duplicates are allowed. At the start of each fresh deck, every active player's loadout is added to the shared deck before shuffling and dealing. Trick bones are not placed directly into their owner's hand, so any player can be dealt another player's preferred Smuggle, Trap, or Punish bones.

The default trick-bone unlocks, six-slot default loadout, per-trick metadata, and NPC trick archetype weights live in `docs/config/scratchbones-config.js` under `game.trickBones`.

## Account and Khymeryyans

Scratchbones stores one browser-local account in `localStorage` under `sb_account_v1`. Account-wide Bronze, cosmetic unlocks, dye ownership, and unlocked trick bones are shared across the account. Playable identities are Khymeryyans: each Khymeryyan has its own name, species/gender appearance, equipped cosmetics, applied dyes, and trick bone loadout. The lobby lets players select, create, duplicate, delete, and edit Khymeryyans before offline or online play.
