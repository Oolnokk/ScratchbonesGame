const WebSocket = require('ws');
const crypto = require('crypto');

const PORT = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port: PORT });

// rooms: Map<code, { host, hostSeatId, clients: Map<seatId, {ws, name}>, lastState }>
const rooms = new Map();

function makeCode() {
  return crypto.randomBytes(2).toString('hex').toUpperCase();
}

function send(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
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
      const hostName = String(msg.playerName || 'Player 1').slice(0, 32);
      rooms.set(roomCode, {
        host: ws,
        hostSeatId: 0,
        hostName,
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

      const playerName = String(msg.playerName || `Player ${seat + 1}`).slice(0, 32);
      room.clients.set(seat, { ws, name: playerName });
      roomCode = code;
      role = 'client';
      seatId = seat;

      send(ws, { type: 'joined', code, seatId });

      // Catch up if game already started
      if (room.lastState) {
        send(ws, { type: 'state-update', state: filterStateForSeat(room.lastState, seatId) });
      }

      // Notify host
      const occupants = [
        { seatId: room.hostSeatId, name: room.hostName },
        ...[...room.clients.entries()].map(([s, { name }]) => ({ seatId: s, name })),
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
      for (const { ws: clientWs } of room.clients.values()) {
        send(clientWs, { type: 'start-game' });
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
