(function () {
  'use strict';

  let _ws = null;
  let _role = null;      // 'host' | 'client'
  let _seatId = null;
  let _roomCode = null;
  const _handlers = Object.create(null);

  function _send(obj) {
    if (_ws && _ws.readyState === WebSocket.OPEN) {
      _ws.send(JSON.stringify(obj));
    }
  }

  function _dispatch(msg) {
    const h = _handlers[msg.type];
    if (typeof h === 'function') h(msg);
  }

  function _open(url) {
    return new Promise((resolve, reject) => {
      _ws = new WebSocket(url);
      _ws.addEventListener('open', () => resolve(), { once: true });
      _ws.addEventListener('error', (e) => reject(new Error('WebSocket connection failed: ' + url)), { once: true });
      _ws.addEventListener('close', () => _dispatch({ type: 'disconnect' }));
      _ws.addEventListener('message', ({ data }) => {
        try { _dispatch(JSON.parse(data)); } catch {}
      });
    });
  }

  // Wait for one specific message type (e.g. 'room-created', 'joined').
  function _awaitReply(type) {
    return new Promise((resolve, reject) => {
      const prevOk = _handlers[type];
      const prevErr = _handlers['error'];
      function restore() {
        _handlers[type] = prevOk;
        _handlers['error'] = prevErr;
      }
      _handlers[type] = (msg) => { restore(); resolve(msg); };
      _handlers['error'] = (msg) => { restore(); reject(new Error(msg.reason || 'Server error')); };
    });
  }

  async function createRoom(url, hostName, totalSeats, playerAppearance) {
    await _open(url);
    _send({ type: 'create-room', playerName: hostName, totalSeats, playerAppearance: playerAppearance ?? null });
    const reply = await _awaitReply('room-created');
    _role = 'host';
    _seatId = 0;
    _roomCode = reply.code;
    return reply.code;
  }

  async function joinRoom(url, code, playerName, playerAppearance) {
    await _open(url);
    _send({ type: 'join-room', code, playerName, playerAppearance: playerAppearance ?? null });
    const reply = await _awaitReply('joined');
    _role = 'client';
    _seatId = reply.seatId;
    _roomCode = reply.code;
    return reply.seatId;
  }

  function sendState(state) {
    if (_role === 'host') _send({ type: 'state-update', state });
  }

  function sendAction(payload) {
    if (_role === 'client') _send({ type: 'action', payload });
  }

  function broadcastStart() {
    if (_role === 'host') _send({ type: 'start-game' });
  }

  function disconnect() {
    _ws && _ws.close();
    _ws = null;
    _role = null;
    _seatId = null;
    _roomCode = null;
  }

  window.ScratchbonesNetwork = {
    createRoom,
    joinRoom,
    sendState,
    sendAction,
    broadcastStart,
    disconnect,
    on(event, cb) { _handlers[event] = cb; },
    isHost()    { return _role === 'host'; },
    isClient()  { return _role === 'client'; },
    getSeatId() { return _seatId; },
    getRoomCode() { return _roomCode; },
  };
})();
