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

  // ── Helpers ────────────────────────────────────────────────

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function cap(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

  function overlay() { return document.getElementById('sb-lobby'); }

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

  // ── Render & bind ──────────────────────────────────────────

  function render() {
    const el = overlay();
    if (!el) return;
    if (_screen === 'create')     el.innerHTML = renderCreate();
    else if (_screen === 'shop')  el.innerHTML = renderShop();
    else                          el.innerHTML = renderMain();
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
      btn.addEventListener('click', () => { _selectedPlayerCount = parseInt(btn.dataset.count); render(); });
    });

    // Shop screen
    document.getElementById('sb-back-btn')?.addEventListener('click', () => { _screen = 'main'; render(); });

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

  function init() {
    window.ScratchbonesAccount?.load();

    // Bootstrap may finish loading before or after this script runs.
    if (window.scratchbonesStartGame) {
      _scratchbonesReady = true;
      show();
    } else {
      window.addEventListener('scratchbones:ready', () => {
        _scratchbonesReady = true;
        show();
      }, { once: true });
    }

    // Tick passive income every minute while the page is open.
    setInterval(() => window.ScratchbonesAccount?.tickPassiveIncome(), 60_000);
  }

  window.ScratchbonesLobby = { init, show, hide, onGameEnd };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
