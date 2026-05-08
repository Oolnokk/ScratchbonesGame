'use strict';

const WebSocket = require('ws');
const crypto = require('crypto');
const { normalizePlayerLoadout, normalizeKhymeryyanPayload, occupantPayload, filterStateForSeat } = require('./utils');

const PORT = process.env.PORT || 8080;
const MAX_MESSAGE_BYTES = 64 * 1024;
const JOIN_FAIL_WINDOW_MS = 15_000;
const MAX_JOIN_FAILS_PER_WINDOW = 8;
const wss = new WebSocket.Server({ port: PORT, maxPayload: MAX_MESSAGE_BYTES });

// rooms: Map<code, { host, hostSeatId, hostName, hostKhymeryyan, hostAppearance, hostLoadout, clients: Map<seatId, {ws, name, khymeryyan, appearance, playerLoadout}>, lastState }>
const rooms = new Map();

function makeCode() {
  let code;
  do {
    code = crypto.randomBytes(2).toString('hex').toUpperCase();
  } while (rooms.has(code));
  return code;
}

function send(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

wss.on('connection', ws => {
  let roomCode = null;
  let role = null;    // 'host' | 'client'
  let seatId = null;
  let joinFailWindowStartMs = 0;
  let joinFailCount = 0;

  function registerJoinFailure(reason) {
    const now = Date.now();
    if ((now - joinFailWindowStartMs) > JOIN_FAIL_WINDOW_MS) {
      joinFailWindowStartMs = now;
      joinFailCount = 0;
    }
    joinFailCount += 1;
    send(ws, { type: 'error', reason });
    if (joinFailCount >= MAX_JOIN_FAILS_PER_WINDOW) {
      ws.close(1008, 'Too many failed join attempts');
    }
  }

  ws.on('message', raw => {
    const messageSize = Buffer.isBuffer(raw) ? raw.length : Buffer.byteLength(String(raw || ''), 'utf8');
    if (messageSize > MAX_MESSAGE_BYTES) {
      ws.close(1009, 'Message too large');
      return;
    }

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
      if (!room) { registerJoinFailure('Room not found'); return; }
      if (room.clients.size >= room.totalSeats - 1) {
        registerJoinFailure('Room is full'); return;
      }
      // Auto-assign lowest available seat
      const taken = new Set([room.hostSeatId, ...room.clients.keys()]);
      let seat = null;
      for (let i = 0; i < room.totalSeats; i++) {
        if (!taken.has(i)) { seat = i; break; }
      }
      if (seat === null) { registerJoinFailure('No seats available'); return; }

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
      const { type: actionType, seatId: _ignoredSeatId, ...actionData } = msg.payload || {};
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
