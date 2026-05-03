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
