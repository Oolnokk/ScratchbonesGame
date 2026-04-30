(function () {
  'use strict';

  const MODES = [
    { id: 'pve',   label: 'PvE',   desc: '1 Human + AI opponents',        humanRange: null },
    { id: 'pvp',   label: 'PvP',   desc: 'All Human players (hot-seat)',  humanRange: [2, 4] },
    { id: 'pvpve', label: 'PvPvE', desc: 'Human + AI mix (hot-seat)',     humanRange: [2, 3] },
  ];

  let _screen = 'create';
  let _selectedMode = 'pve';
  let _selectedPlayerCount = 2;
  let _postGameMessage = '';
  let _scratchbonesReady = false;

  // Online state
  let _onlinePlayerCount = 2;
  let _roomCode = '';
  let _onlineOccupants = []; // [{seatId, name}]
  let _myOnlineSeat = null;

  // ── Helpers ────────────────────────────────────────────────

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function cap(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

  function overlay() { return document.getElementById('sb-lobby'); }

  function wsUrl() {
    return (window.SCRATCHBONES_CONFIG && window.SCRATCHBONES_CONFIG.wsUrl)
      || 'ws://localhost:8080';
  }

  // ── Screen renderers ───────────────────────────────────────

  function renderCreate() {
    return `
      <div class="sb-card">
        <div class="sb-title">SCRATCHBONES!</div>
        <div class="sb-subtitle">Create your character to begin</div>
        <div class="sb-field">
          <label for="sb-name">Your Name</label>
          <input id="sb-name" type="text" maxlength="24" placeholder="Enter name…" autocomplete="off" spellcheck="false" />
        </div>
        <div class="sb-actions">
          <button class="sb-btn-primary" id="sb-create-btn">Create Character</button>
        </div>
      </div>`;
  }

  function renderMain() {
    const acc = window.ScratchbonesAccount;
    const bronze = acc ? acc.getBronze() : 0;
    const username = acc ? acc.getUsername() : 'Player';
    const canEarnPassive = acc && bronze < acc.BRONZE_PASSIVE_MAX;

    const modeButtons = MODES.map(m => `
      <button class="sb-mode-btn${_selectedMode === m.id ? ' selected' : ''}" data-mode="${m.id}">
        <span class="sb-mode-label">${m.label}</span>
        <span class="sb-mode-desc">${esc(m.desc)}</span>
      </button>`).join('');

    const maxHumans = _selectedMode === 'pvpve' ? 3 : 4;
    const playerPicker = _selectedMode !== 'pve' ? `
      <div class="sb-player-row">
        <span>Human players:</span>
        <div class="sb-count-group">
          ${[2, 3, 4].filter(n => n <= maxHumans).map(n =>
            `<button class="sb-count-btn${_selectedPlayerCount === n ? ' selected' : ''}" data-count="${n}">${n}</button>`
          ).join('')}
        </div>
      </div>` : '';

    const postMsg = _postGameMessage
      ? `<div class="sb-post-msg">${esc(_postGameMessage)}</div>` : '';

    const adBtn = canEarnPassive
      ? `<button class="sb-btn-ghost" id="sb-ad-btn">Watch Ad (Fill Bronze)</button>` : '';

    return `
      <div class="sb-card">
        <div class="sb-header">
          <div class="sb-title">SCRATCHBONES!</div>
          <div class="sb-bronze">
            <span class="sb-coin">🪙</span>
            <span id="sb-bronze-val">${bronze}</span>&nbsp;Bronze
          </div>
        </div>
        ${postMsg}
        <div class="sb-welcome">Welcome back, ${esc(username)}!</div>
        <div class="sb-label">Game Mode</div>
        <div class="sb-mode-picker">${modeButtons}</div>
        ${playerPicker}
        <div class="sb-actions">
          <button class="sb-btn-ghost" id="sb-shop-btn">Shop</button>
          <button class="sb-btn-ghost" id="sb-online-btn">Play Online</button>
          ${adBtn}
          <button class="sb-btn-primary" id="sb-start-btn">Start Game</button>
        </div>
      </div>`;
  }

  function renderShop() {
    const acc = window.ScratchbonesAccount;
    const bronze = acc ? acc.getBronze() : 0;
    const catalog = acc ? acc.getShopCatalog() : [];
    const categories = [...new Set(catalog.map(c => c.category))];

    let rows = '';
    for (const cat of categories) {
      rows += `<div class="sb-shop-cat">${cap(cat)}</div>`;
      for (const item of catalog.filter(c => c.category === cat)) {
        const owned = acc && acc.isUnlocked(item.id);
        const equipped = acc && acc.isEquipped(item.id);
        let btn;
        if (owned) {
          btn = equipped
            ? `<button class="sb-shop-action equipped" data-action="unequip" data-id="${esc(item.id)}">Equipped ✓</button>`
            : `<button class="sb-shop-action" data-action="equip" data-id="${esc(item.id)}">Equip</button>`;
        } else {
          const can = bronze >= item.price;
          btn = `<button class="sb-shop-action buy${can ? '' : ' cant'}" data-action="buy" data-id="${esc(item.id)}"${can ? '' : ' disabled'}>
            <span class="sb-coin">🪙</span>${item.price}
          </button>`;
        }
        rows += `
          <div class="sb-shop-item">
            <div class="sb-shop-info">
              <div class="sb-shop-name">${esc(item.label)}</div>
              <div class="sb-shop-desc">${esc(item.description)}</div>
            </div>
            ${btn}
          </div>`;
      }
    }

    return `
      <div class="sb-card sb-shop-card">
        <div class="sb-header">
          <button class="sb-btn-ghost" id="sb-back-btn">← Back</button>
          <div class="sb-title">Shop</div>
          <div class="sb-bronze">
            <span class="sb-coin">🪙</span>
            <span id="sb-bronze-val">${bronze}</span>&nbsp;Bronze
          </div>
        </div>
        <div class="sb-shop-list">${rows}</div>
      </div>`;
  }

  function renderOnline() {
    return `
      <div class="sb-card">
        <div class="sb-header">
          <button class="sb-btn-ghost" id="sb-back-btn">← Back</button>
          <div class="sb-title">Play Online</div>
        </div>
        <div class="sb-subtitle">Host a game or join a friend's room</div>
        <div class="sb-actions" style="flex-direction:column;gap:10px;margin-top:16px;">
          <button class="sb-btn-primary" id="sb-host-btn">Host a Game</button>
          <button class="sb-btn-ghost"   id="sb-join-btn">Join a Game</button>
        </div>
      </div>`;
  }

  function renderOnlineHostSetup() {
    return `
      <div class="sb-card">
        <div class="sb-header">
          <button class="sb-btn-ghost" id="sb-back-btn">← Back</button>
          <div class="sb-title">Host Game</div>
        </div>
        <div class="sb-label">Players at the table</div>
        <div class="sb-player-row">
          <div class="sb-count-group">
            ${[2, 3, 4].map(n =>
              `<button class="sb-count-btn${_onlinePlayerCount === n ? ' selected' : ''}" data-count="${n}">${n}</button>`
            ).join('')}
          </div>
        </div>
        <div class="sb-actions" style="margin-top:16px;">
          <button class="sb-btn-primary" id="sb-create-room-btn">Create Room</button>
        </div>
      </div>`;
  }

  function renderOnlineWaiting() {
    const needed = _onlinePlayerCount;
    const have = _onlineOccupants.length;
    const ready = have >= needed;
    const seats = _onlineOccupants.map(o =>
      `<div class="sb-online-seat">Seat ${o.seatId + 1} · ${esc(o.name)}</div>`
    ).join('');
    return `
      <div class="sb-card">
        <div class="sb-title">Waiting for players…</div>
        <div class="sb-online-code-row">
          <span class="sb-online-label">Room Code</span>
          <strong class="sb-online-code">${esc(_roomCode)}</strong>
        </div>
        <div class="sb-online-seats">${seats || '<div class="sb-muted">No one else has joined yet</div>'}</div>
        <div class="sb-online-hint">${have}/${needed} players connected</div>
        <div class="sb-actions" style="margin-top:16px;">
          <button class="sb-btn-ghost" id="sb-cancel-online-btn">Cancel</button>
          <button class="sb-btn-primary" id="sb-start-online-btn"${ready ? '' : ' disabled'}>
            Start Game (${have}/${needed})
          </button>
        </div>
      </div>`;
  }

  function renderOnlineJoin() {
    return `
      <div class="sb-card">
        <div class="sb-header">
          <button class="sb-btn-ghost" id="sb-back-btn">← Back</button>
          <div class="sb-title">Join Game</div>
        </div>
        <div class="sb-field">
          <label for="sb-room-code-input">Room Code</label>
          <input id="sb-room-code-input" type="text" maxlength="4" placeholder="e.g. A1B2"
                 autocomplete="off" spellcheck="false" style="text-transform:uppercase;letter-spacing:.15em;" />
        </div>
        <div id="sb-join-error" class="sb-error" style="display:none;"></div>
        <div class="sb-actions" style="margin-top:12px;">
          <button class="sb-btn-primary" id="sb-do-join-btn">Join</button>
        </div>
      </div>`;
  }

  function renderOnlineJoined() {
    return `
      <div class="sb-card">
        <div class="sb-title">Joined!</div>
        <div class="sb-online-code-row">
          <span class="sb-online-label">Room</span>
          <strong class="sb-online-code">${esc(_roomCode)}</strong>
        </div>
        <div class="sb-welcome">You are Seat ${(_myOnlineSeat ?? 0) + 1}</div>
        <div class="sb-muted" style="margin-top:8px;">Waiting for the host to start the game…</div>
        <div class="sb-actions" style="margin-top:16px;">
          <button class="sb-btn-ghost" id="sb-cancel-online-btn">Leave</button>
        </div>
      </div>`;
  }

  // ── Render & bind ──────────────────────────────────────────

  function render() {
    const el = overlay();
    if (!el) return;
    if      (_screen === 'create')              el.innerHTML = renderCreate();
    else if (_screen === 'shop')                el.innerHTML = renderShop();
    else if (_screen === 'online')              el.innerHTML = renderOnline();
    else if (_screen === 'online-host-setup')   el.innerHTML = renderOnlineHostSetup();
    else if (_screen === 'online-waiting')      el.innerHTML = renderOnlineWaiting();
    else if (_screen === 'online-join')         el.innerHTML = renderOnlineJoin();
    else if (_screen === 'online-joined')       el.innerHTML = renderOnlineJoined();
    else                                        el.innerHTML = renderMain();
    bind();
  }

  function bind() {
    const el = overlay();
    if (!el) return;

    // Create screen
    const createBtn = document.getElementById('sb-create-btn');
    if (createBtn) {
      createBtn.addEventListener('click', () => {
        const val = (document.getElementById('sb-name')?.value || '').trim();
        if (!val) { document.getElementById('sb-name')?.focus(); return; }
        window.ScratchbonesAccount?.createAccount(val);
        _screen = 'main';
        render();
      });
      document.getElementById('sb-name')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') createBtn.click();
      });
    }

    // Main screen
    document.getElementById('sb-start-btn')?.addEventListener('click', startGame);
    document.getElementById('sb-shop-btn')?.addEventListener('click', () => { _screen = 'shop'; render(); });
    document.getElementById('sb-online-btn')?.addEventListener('click', () => { _screen = 'online'; render(); });
    document.getElementById('sb-ad-btn')?.addEventListener('click', () => {
      window.ScratchbonesAccount?.watchAd();
      render();
    });

    el.querySelectorAll('.sb-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _selectedMode = btn.dataset.mode;
        if (_selectedMode === 'pve') _selectedPlayerCount = 1;
        else if (_selectedPlayerCount < 2) _selectedPlayerCount = 2;
        const maxH = _selectedMode === 'pvpve' ? 3 : 4;
        if (_selectedPlayerCount > maxH) _selectedPlayerCount = maxH;
        render();
      });
    });

    el.querySelectorAll('.sb-count-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const n = parseInt(btn.dataset.count);
        if (_screen === 'online-host-setup') _onlinePlayerCount = n;
        else _selectedPlayerCount = n;
        render();
      });
    });

    // Back button (shared)
    document.getElementById('sb-back-btn')?.addEventListener('click', () => {
      if (_screen === 'shop' || _screen === 'online') _screen = 'main';
      else if (_screen === 'online-host-setup' || _screen === 'online-join') _screen = 'online';
      else _screen = 'main';
      render();
    });

    // Shop screen
    el.querySelectorAll('.sb-shop-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const { action, id } = btn.dataset;
        const acc = window.ScratchbonesAccount;
        if (!acc) return;
        if (action === 'buy') acc.buyCosmetic(id);
        else if (action === 'equip') acc.equipCosmetic(id);
        else if (action === 'unequip') acc.unequipCosmetic(id);
        render();
      });
    });

    // Online lobby
    document.getElementById('sb-host-btn')?.addEventListener('click', () => { _screen = 'online-host-setup'; render(); });
    document.getElementById('sb-join-btn')?.addEventListener('click', () => { _screen = 'online-join'; render(); });

    // Host setup — create room
    document.getElementById('sb-create-room-btn')?.addEventListener('click', () => {
      const net = window.ScratchbonesNetwork;
      if (!net) { alert('Network module not loaded'); return; }
      const username = window.ScratchbonesAccount?.getUsername() || 'Host';
      _onlineOccupants = [{ seatId: 0, name: username }];
      net.createRoom(wsUrl(), username, _onlinePlayerCount)
        .then(code => {
          _roomCode = code;
          _myOnlineSeat = 0;
          _screen = 'online-waiting';
          // Listen for players joining
          net.on('player-joined', msg => {
            _onlineOccupants = (msg.occupants || []);
            render();
          });
          net.on('player-left', msg => {
            _onlineOccupants = _onlineOccupants.filter(o => o.seatId !== msg.seatId);
            render();
          });
          render();
        })
        .catch(err => {
          alert('Could not create room: ' + err.message);
        });
    });

    // Online waiting — start / cancel
    document.getElementById('sb-start-online-btn')?.addEventListener('click', () => {
      if (_onlineOccupants.length < _onlinePlayerCount) return;
      startOnlineGame();
    });
    document.getElementById('sb-cancel-online-btn')?.addEventListener('click', () => {
      window.ScratchbonesNetwork?.disconnect();
      _screen = 'online';
      render();
    });

    // Join screen
    const doJoinBtn = document.getElementById('sb-do-join-btn');
    if (doJoinBtn) {
      const attemptJoin = () => {
        const code = (document.getElementById('sb-room-code-input')?.value || '').trim().toUpperCase();
        if (code.length < 4) { showJoinError('Enter a 4-character room code'); return; }
        const net = window.ScratchbonesNetwork;
        if (!net) { showJoinError('Network module not loaded'); return; }
        const username = window.ScratchbonesAccount?.getUsername() || 'Player';
        doJoinBtn.disabled = true;
        net.joinRoom(wsUrl(), code, username)
          .then(seatId => {
            _myOnlineSeat = seatId;
            _roomCode = code;
            _screen = 'online-joined';
            // Listen for host starting the game
            net.on('start-game', () => {
              startOnlineClient();
            });
            net.on('disconnect', () => {
              alert('Disconnected from room');
              _screen = 'online';
              render();
            });
            render();
          })
          .catch(err => {
            doJoinBtn.disabled = false;
            showJoinError(err.message || 'Could not join room');
          });
      };
      doJoinBtn.addEventListener('click', attemptJoin);
      document.getElementById('sb-room-code-input')?.addEventListener('keydown', e => {
        if (e.key === 'Enter') attemptJoin();
      });
    }
  }

  function showJoinError(msg) {
    const el = document.getElementById('sb-join-error');
    if (el) { el.textContent = msg; el.style.display = ''; }
  }

  // ── Public API ─────────────────────────────────────────────

  function show(screen) {
    window.ScratchbonesAccount?.tickPassiveIncome();
    _screen = screen || (window.ScratchbonesAccount?.isCreated() ? 'main' : 'create');
    render();
    const el = overlay();
    if (el) el.style.display = 'flex';
  }

  function hide() {
    const el = overlay();
    if (el) el.style.display = 'none';
  }

  function onGameEnd(chipCount) {
    window.ScratchbonesNetwork?.disconnect();
    if (window.ScratchbonesAccount) {
      const earned = Math.max(0, Math.floor(chipCount));
      if (earned > 0) {
        window.ScratchbonesAccount.addBronze(earned);
        _postGameMessage = `You earned ${earned} Bronze!`;
      } else {
        _postGameMessage = '';
      }
    }
    show('main');
  }

  function startGame() {
    if (!window.ScratchbonesAccount?.isCreated()) return;
    const mode = _selectedMode;
    const humanCount = mode === 'pve' ? 1 : _selectedPlayerCount;
    const humanSeats = Array.from({ length: humanCount }, (_, i) => i);
    const playerNames = {};
    playerNames[0] = window.ScratchbonesAccount.getUsername();
    for (let i = 1; i < humanCount; i++) playerNames[i] = `Player ${i + 1}`;

    window.SCRATCHBONES_SESSION = { mode, humanSeats, playerNames };
    _postGameMessage = '';
    hide();

    if (_scratchbonesReady && window.scratchbonesStartGame) {
      void window.scratchbonesStartGame().catch(e => console.error('[lobby] startGame error', e));
    }
  }

  function startOnlineGame() {
    if (!window.ScratchbonesAccount?.isCreated()) return;
    const net = window.ScratchbonesNetwork;
    if (!net?.isHost()) return;

    const humanSeats = _onlineOccupants.map(o => o.seatId);
    const playerNames = {};
    _onlineOccupants.forEach(o => { playerNames[o.seatId] = o.name; });

    window.SCRATCHBONES_SESSION = { mode: 'pvp', humanSeats, playerNames };
    _postGameMessage = '';

    // Tell all clients the game is starting
    net.broadcastStart();
    hide();

    if (_scratchbonesReady && window.scratchbonesStartGame) {
      void window.scratchbonesStartGame().catch(e => console.error('[lobby] startOnlineGame error', e));
    }
  }

  function startOnlineClient() {
    hide();
    const username = window.ScratchbonesAccount?.getUsername() || 'Player';
    window.SCRATCHBONES_SESSION = {
      mode: 'online-client',
      humanSeats: [_myOnlineSeat],
      playerNames: { [_myOnlineSeat]: username },
    };
    if (_scratchbonesReady && window.scratchbonesStartClient) {
      void window.scratchbonesStartClient().catch(e => console.error('[lobby] startOnlineClient error', e));
    }
  }

  function init() {
    window.ScratchbonesAccount?.load();

    if (window.scratchbonesStartGame) {
      _scratchbonesReady = true;
      show();
    } else {
      window.addEventListener('scratchbones:ready', () => {
        _scratchbonesReady = true;
        show();
      }, { once: true });
    }

    setInterval(() => window.ScratchbonesAccount?.tickPassiveIncome(), 60_000);
  }

  window.ScratchbonesLobby = { init, show, hide, onGameEnd };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
