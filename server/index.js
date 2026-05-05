const WebSocket = require('ws');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

// rooms: Map<code, { host, hostSeatId, hostName, hostKhymeryyan, hostAppearance, hostLoadout, clients: Map<seatId, {ws, name, khymeryyan, appearance, playerLoadout}>, lastState }>
const rooms = new Map();

function makeCode() {
  return crypto.randomBytes(2).toString('hex').toUpperCase();
}

function send(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

function normalizePlayerLoadout(loadout) {
  return Array.isArray(loadout) ? loadout.map(id => String(id || '').trim()).filter(Boolean).slice(0, 12) : [];
}

function normalizeKhymeryyanPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const name = String(payload.name || '').trim().slice(0, 32);
  return {
    id: payload.id ? String(payload.id).slice(0, 64) : null,
    name: name || null,
    appearance: payload.appearance && typeof payload.appearance === 'object' ? payload.appearance : null,
    equippedCosmetics: Array.isArray(payload.equippedCosmetics) ? payload.equippedCosmetics.map(String).slice(0, 24) : [],
    appliedDyes: payload.appliedDyes && typeof payload.appliedDyes === 'object' ? payload.appliedDyes : {},
    trickBoneLoadout: normalizePlayerLoadout(payload.trickBoneLoadout || payload.playerLoadout),
  };
}

function occupantPayload(seatId, name, appearance, playerLoadout, khymeryyan) {
  return {
    seatId,
    name,
    appearance: appearance ?? khymeryyan?.appearance ?? null,
    playerLoadout: playerLoadout || khymeryyan?.trickBoneLoadout || [],
    khymeryyan: khymeryyan ?? null,
  };
}

function filterStateForSeat(fullState, seatId) {
  if (!fullState) return fullState;
  return {
    ...fullState,
    humanSeat: seatId,
    selectedCardIds: [],
    players: fullState.players.map(p =>
      p.id === seatId
        ? p
        : { ...p, hand: (p.hand || []).map(() => ({ hidden: true })) }
    ),
    pile: (fullState.pile || []).map(play => ({
      ...play,
      cards: (play.cards || []).map(() => ({ hidden: true })),
    })),
    challengeWindow: fullState.challengeWindow ? {
      ...fullState.challengeWindow,
      lastPlay: fullState.challengeWindow.lastPlay ? {
        ...fullState.challengeWindow.lastPlay,
        cards: (fullState.challengeWindow.lastPlay.cards || []).map(() => ({ hidden: true })),
      } : null,
    } : null,
  };
}

wss.on('connection', ws => {
  let roomCode = null;
  let role = null;    // 'host' | 'client'
  let seatId = null;

  ws.on('message', raw => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    // ── Host: create room ───────────────────────────────────────────────────
    if (msg.type === 'create-room') {
      if (roomCode) return; // already in a room
      roomCode = makeCode();
      seatId = 0;
      role = 'host';
      const hostKhymeryyan = normalizeKhymeryyanPayload(msg.selectedKhymeryyan);
      const hostName = String(msg.playerName || hostKhymeryyan?.name || 'Player 1').slice(0, 32);
      rooms.set(roomCode, {
        host: ws,
        hostSeatId: 0,
        hostName,
        hostKhymeryyan,
        hostAppearance: msg.playerAppearance ?? hostKhymeryyan?.appearance ?? null,
        hostLoadout: normalizePlayerLoadout(msg.playerLoadout || hostKhymeryyan?.trickBoneLoadout),
        clients: new Map(),
        lastState: null,
        totalSeats: Math.max(2, Math.min(4, Number(msg.totalSeats) || 2)),
      });
      send(ws, { type: 'room-created', code: roomCode });
      return;
    }

    // ── Client: join room ───────────────────────────────────────────────────
    if (msg.type === 'join-room') {
      if (roomCode) return;
      const code = String(msg.code || '').toUpperCase().trim();
      const room = rooms.get(code);
      if (!room) { send(ws, { type: 'error', reason: 'Room not found' }); return; }
      if (room.clients.size >= room.totalSeats - 1) {
        send(ws, { type: 'error', reason: 'Room is full' }); return;
      }
      // Auto-assign lowest available seat
      const taken = new Set([room.hostSeatId, ...room.clients.keys()]);
      let seat = null;
      for (let i = 0; i < room.totalSeats; i++) {
        if (!taken.has(i)) { seat = i; break; }
      }
      if (seat === null) { send(ws, { type: 'error', reason: 'No seats available' }); return; }

      const playerKhymeryyan = normalizeKhymeryyanPayload(msg.selectedKhymeryyan);
      const playerName = String(msg.playerName || playerKhymeryyan?.name || `Player ${seat + 1}`).slice(0, 32);
      const playerAppearance = msg.playerAppearance ?? playerKhymeryyan?.appearance ?? null;
      const playerLoadout = normalizePlayerLoadout(msg.playerLoadout || playerKhymeryyan?.trickBoneLoadout);
      room.clients.set(seat, { ws, name: playerName, khymeryyan: playerKhymeryyan, appearance: playerAppearance, playerLoadout });
      roomCode = code;
      role = 'client';
      seatId = seat;

      send(ws, { type: 'joined', code, seatId });

      // Catch up if game already started
      if (room.lastState) {
        send(ws, { type: 'state-update', state: filterStateForSeat(room.lastState, seatId) });
      }

      // Notify host — include per-seat appearances so host can pass them into the session
      const occupants = [
        occupantPayload(room.hostSeatId, room.hostName, room.hostAppearance, room.hostLoadout, room.hostKhymeryyan),
        ...[...room.clients.entries()].map(([s, { name, khymeryyan, appearance, playerLoadout }]) => occupantPayload(s, name, appearance, playerLoadout, khymeryyan)),
      ];
      send(room.host, { type: 'player-joined', seatId, playerName, occupants });
      return;
    }

    // ── Host: broadcast state to all clients ────────────────────────────────
    if (msg.type === 'state-update' && role === 'host') {
      const room = rooms.get(roomCode);
      if (!room) return;
      room.lastState = msg.state;
      for (const [clientSeat, { ws: clientWs }] of room.clients) {
        send(clientWs, { type: 'state-update', state: filterStateForSeat(msg.state, clientSeat) });
      }
      return;
    }

    // ── Client: send action to host ─────────────────────────────────────────
    if (msg.type === 'action' && role === 'client') {
      const room = rooms.get(roomCode);
      if (!room) return;
      const { type: actionType, ...actionData } = msg.payload || {};
      send(room.host, { type: 'action', seatId, actionType, ...actionData });
      return;
    }

    // ── Host: start the game ────────────────────────────────────────────────
    if (msg.type === 'start-game' && role === 'host') {
      const room = rooms.get(roomCode);
      if (!room) return;
      for (const { ws: clientWs, khymeryyan, appearance, playerLoadout } of room.clients.values()) {
        send(clientWs, { type: 'start-game', khymeryyan: khymeryyan ?? null, appearance: appearance ?? null, playerLoadout: playerLoadout || [] });
      }
      return;
    }
  });

  ws.on('close', () => {
    if (!roomCode) return;
    const room = rooms.get(roomCode);
    if (!room) return;
    if (role === 'host') {
      for (const { ws: clientWs } of room.clients.values()) {
        send(clientWs, { type: 'disconnected', reason: 'host-left' });
      }
      rooms.delete(roomCode);
    } else if (role === 'client') {
      room.clients.delete(seatId);
      send(room.host, { type: 'player-left', seatId });
    }
  });
});

console.log(`[scratchbones-relay] listening on ws://localhost:${PORT}`);
