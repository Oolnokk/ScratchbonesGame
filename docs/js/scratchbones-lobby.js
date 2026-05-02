(function () {
  'use strict';

  const MODES = [
    { id: 'pve',   label: 'PvE',   desc: '1 Human + AI opponents',    humanRange: null },
    { id: 'pvp',   label: 'PvP',   desc: 'All Human players',        humanRange: [2, 4] },
    { id: 'pvpve', label: 'PvPvE', desc: 'Human + AI mix',            humanRange: [2, 3] },
  ];

  // ── Species/cosmetics data for character creation ──────────
  // Each slot option stores the full cosmetic ID (for optionCache lookup) or null for 'none'.
  const HAT_OPTS = [
    { id: null,                                       label: 'None' },
    { id: 'appearance::hat::basic_headband',          label: 'Headband' },
    { id: 'appearance::hat::riverlandskasa_low',      label: 'Kasa (Low)' },
    { id: 'appearance::hat::riverlandskasa_wide',     label: 'Kasa (Wide)' },
  ];

  const SPECIES_DATA = {
    'mao-ao': {
      label: 'Mao-ao',
      genders: ['male', 'female'],
      swatchBase: '#7dc89a',
      male: {
        slots: [
          { slot: 'hairFront', label: 'Front Hair', options: [
            { id: null,                                                label: 'None' },
            { id: 'appearance::Mao-ao_M::mao-ao_smooth_striped',      label: 'Smooth Striped' },
            { id: 'appearance::Mao-ao_M::mao-ao_tuft',                label: 'Tuft' },
            { id: 'appearance::Mao-ao_M::mao-ao_forwardtuft_short',   label: 'Forward Tuft (Short)' },
            { id: 'appearance::Mao-ao_M::mao-ao_forwardtuft_long',    label: 'Forward Tuft (Long)' },
          ]},
          { slot: 'hairSide', label: 'Side Hair', options: [
            { id: null,                                                label: 'None' },
            { id: 'appearance::Mao-ao_M::mao-ao_shoulder_length_drape', label: 'Shoulder Drape' },
          ]},
          { slot: 'eyes', label: 'Eyes', options: [
            { id: null,                                                label: 'Default' },
            { id: 'appearance::Mao-ao_M::mao-ao_circled_eyes',        label: 'Circled Eyes' },
            { id: 'appearance::Mao-ao_M::mao-ao_circled_eye_L',       label: 'Circled Eye (L)' },
          ]},
          { slot: 'facialHair', label: 'Facial Hair', options: [
            { id: null,                                                label: 'None' },
            { id: 'appearance::Mao-ao_M::mao-ao_wildbeard',           label: 'Wild Beard' },
          ]},
        ],
        colorPresets: [
          { label: 'Storm Gray',  A:{h:-70,s:-0.80,v:-0.70}, B:{h:-70,s:-0.80,v:-0.85}, C:{h:-70,s:-0.90,v:-0.60} },
          { label: 'Dusk Brown',  A:{h:-40,s:-0.70,v:-0.50}, B:{h:-40,s:-0.70,v:-0.65}, C:{h:-40,s:-0.80,v:-0.40} },
          { label: 'Stone',       A:{h:  0,s:-0.70,v:-0.30}, B:{h:  0,s:-0.70,v:-0.50}, C:{h:  0,s:-0.80,v:-0.20} },
          { label: 'Warm Sand',   A:{h: 30,s:-0.60,v:-0.10}, B:{h: 30,s:-0.65,v:-0.30}, C:{h: 30,s:-0.70,v: 0.00} },
          { label: 'Pale',        A:{h: 10,s:-0.90,v: 0.30}, B:{h: 10,s:-0.90,v: 0.10}, C:{h: 10,s:-0.95,v: 0.40} },
          { label: 'Obsidian',    A:{h:  0,s:-0.90,v:-0.85}, B:{h:  0,s:-0.95,v:-0.90}, C:{h:  0,s:-0.90,v:-0.80} },
        ],
      },
      female: {
        slots: [
          { slot: 'hairFront', label: 'Front Hair', options: [
            { id: null,                                                label: 'None' },
            { id: 'appearance::Mao-ao_F::mao-ao_smooth_striped',      label: 'Smooth Striped' },
            { id: 'appearance::Mao-ao_F::mao-ao_tuft',                label: 'Tuft' },
            { id: 'appearance::Mao-ao_F::mao-ao_forwardtuft_short',   label: 'Forward Tuft (Short)' },
            { id: 'appearance::Mao-ao_F::mao-ao_forwardtuft_long',    label: 'Forward Tuft (Long)' },
          ]},
          { slot: 'hairBack', label: 'Back Hair', options: [
            { id: null,                                                label: 'None' },
            { id: 'appearance::Mao-ao_F::mao-ao_splayedknot_medium',  label: 'Splayed Knot' },
            { id: 'appearance::Mao-ao_F::mao-ao_long_ponytail',       label: 'Long Ponytail' },
          ]},
          { slot: 'hairSide', label: 'Side Hair', options: [
            { id: null,                                                label: 'None' },
            { id: 'appearance::Mao-ao_F::mao-ao_shoulder_length_drape', label: 'Shoulder Drape' },
          ]},
          { slot: 'eyes', label: 'Eyes', options: [
            { id: null,                                                label: 'Default' },
            { id: 'appearance::Mao-ao_F::mao-ao_circled_eyes',        label: 'Circled Eyes' },
            { id: 'appearance::Mao-ao_F::mao-ao_circled_eyes_f',      label: 'Circled Eyes F' },
            { id: 'appearance::Mao-ao_F::mao-ao_circled_eye_L',       label: 'Circled Eye (L)' },
          ]},
        ],
        colorPresets: [
          { label: 'Storm Gray',  A:{h:-70,s:-0.80,v:-0.70}, B:{h:-70,s:-0.80,v:-0.85}, C:{h:-70,s:-0.90,v:-0.60} },
          { label: 'Dusk Brown',  A:{h:-40,s:-0.70,v:-0.50}, B:{h:-40,s:-0.70,v:-0.65}, C:{h:-40,s:-0.80,v:-0.40} },
          { label: 'Stone',       A:{h:  0,s:-0.70,v:-0.30}, B:{h:  0,s:-0.70,v:-0.50}, C:{h:  0,s:-0.80,v:-0.20} },
          { label: 'Warm Sand',   A:{h: 30,s:-0.60,v:-0.10}, B:{h: 30,s:-0.65,v:-0.30}, C:{h: 30,s:-0.70,v: 0.00} },
          { label: 'Pale',        A:{h: 10,s:-0.90,v: 0.30}, B:{h: 10,s:-0.90,v: 0.10}, C:{h: 10,s:-0.95,v: 0.40} },
          { label: 'Obsidian',    A:{h:  0,s:-0.90,v:-0.85}, B:{h:  0,s:-0.95,v:-0.90}, C:{h:  0,s:-0.90,v:-0.80} },
        ],
      },
    },
    'tletingan': {
      label: 'Tletingan',
      genders: ['male'],
      swatchBase: '#80a060',
      male: {
        slots: [
          { slot: 'hairFront', label: 'Front Hair', options: [
            { id: null,                                                  label: 'None' },
            { id: 'appearance::Tletingan_M::tl_forwardtuft_short',      label: 'Forward Tuft (Short)' },
            { id: 'appearance::Tletingan_M::tl_forwardtuft_long',       label: 'Forward Tuft (Long)' },
          ]},
          { slot: 'hairBack', label: 'Back Hair', options: [
            { id: null,                                                  label: 'None' },
            { id: 'appearance::Tletingan_M::tl_longponytail',           label: 'Long Ponytail' },
            { id: 'appearance::Tletingan_M::tl_splayedknot',            label: 'Splayed Knot' },
          ]},
          { slot: 'facialHair', label: 'Facial Hair', options: [
            { id: null,                                                  label: 'None' },
            { id: 'appearance::Tletingan_M::tl_wildbeard',              label: 'Wild Beard' },
          ]},
        ],
        colorPresets: [
          { label: 'Night Forest', A:{h:-85,s:-0.30,v:-0.40}, B:{h:-85,s:-0.30,v:-0.50}, C:{h:-85,s:-0.40,v:-0.35} },
          { label: 'Dark Fern',    A:{h:-60,s:-0.20,v:-0.35}, B:{h:-60,s:-0.20,v:-0.45}, C:{h:-60,s:-0.30,v:-0.30} },
          { label: 'Swamp Olive',  A:{h:-40,s:-0.10,v:-0.30}, B:{h:-40,s:-0.10,v:-0.40}, C:{h:-40,s:-0.20,v:-0.25} },
          { label: 'Dark Earth',   A:{h:-20,s: 0.00,v:-0.20}, B:{h:-20,s: 0.00,v:-0.35}, C:{h:-20,s:-0.10,v:-0.15} },
          { label: 'Rust',         A:{h:  0,s: 0.10,v:-0.15}, B:{h:  0,s: 0.10,v:-0.30}, C:{h:  0,s: 0.05,v:-0.10} },
          { label: 'Ash Black',    A:{h:-80,s:-0.40,v:-0.45}, B:{h:-80,s:-0.40,v:-0.50}, C:{h:-80,s:-0.40,v:-0.40} },
        ],
      },
    },
    'kenkari': {
      label: 'Kenkari',
      genders: ['male', 'female'],
      swatchBase: '#d0b060',
      male: {
        forcedCosmetics: { eyes: 'kenk_eyedisks' },
        slots: [
          { slot: 'hairFront', label: 'Front Hair', options: [
            { id: null,                                                  label: 'None' },
            { id: 'appearance::Kenkari_M::kenk_forwardtuft_long',       label: 'Forward Tuft (Long)' },
            { id: 'appearance::Kenkari_M::kenk_fowardtuft',             label: 'Forward Tuft' },
          ]},
          { slot: 'hairBack', label: 'Back Hair', options: [
            { id: null,                                                  label: 'None' },
            { id: 'appearance::Kenkari_M::kenk_splayedknot_high_m',     label: 'Splayed Knot (High)' },
            { id: 'appearance::Kenkari_M::kenk_splayedknot_low_m',      label: 'Splayed Knot (Low)' },
          ]},
          { slot: 'facialHair', label: 'Facial Hair', options: [
            { id: null,                                                  label: 'None' },
            { id: 'appearance::Kenkari_M::kenk_wildbeard',              label: 'Wild Beard' },
          ]},
        ],
        colorPresets: [
          { label: 'Crimson',  A:{h: -20,s:0.80,v: 0.00}, B:{h: -20,s:0.80,v:-0.15}, C:{h: -20,s:0.90,v: 0.10} },
          { label: 'Indigo',   A:{h: -80,s:0.90,v: 0.00}, B:{h: -80,s:0.90,v:-0.15}, C:{h: -80,s:1.00,v: 0.10} },
          { label: 'Amber',    A:{h:  40,s:1.00,v: 0.10}, B:{h:  40,s:1.00,v:-0.10}, C:{h:  40,s:1.10,v: 0.15} },
          { label: 'Forest',   A:{h: 120,s:0.90,v: 0.00}, B:{h: 120,s:0.90,v:-0.15}, C:{h: 120,s:1.00,v: 0.10} },
          { label: 'Azure',    A:{h: 160,s:0.80,v:-0.10}, B:{h: 160,s:0.80,v:-0.20}, C:{h: 160,s:0.90,v: 0.00} },
          { label: 'Violet',   A:{h:-120,s:0.80,v:-0.10}, B:{h:-120,s:0.80,v:-0.20}, C:{h:-120,s:0.90,v: 0.00} },
          { label: 'Rose',     A:{h: -40,s:0.70,v: 0.10}, B:{h: -40,s:0.70,v:-0.05}, C:{h: -40,s:0.80,v: 0.15} },
          { label: 'Gold',     A:{h:  60,s:0.90,v: 0.10}, B:{h:  60,s:0.90,v:-0.10}, C:{h:  60,s:1.00,v: 0.15} },
        ],
      },
      female: {
        forcedCosmetics: { eyes: 'none' },
        slots: [
          { slot: 'hairBack', label: 'Back Hair', options: [
            { id: null,                                                   label: 'None' },
            { id: 'appearance::Kenkari_F::kenk_longponytail_f',          label: 'Long Ponytail' },
            { id: 'appearance::Kenkari_F::kenk_splayedknot_high_f',      label: 'Splayed Knot (High)' },
            { id: 'appearance::Kenkari_F::kenk_splayedknot_low_f',       label: 'Splayed Knot (Low)' },
          ]},
        ],
        colorPresets: [
          { label: 'Crimson',  A:{h: -20,s:0.80,v: 0.00}, B:{h: -20,s:0.80,v:-0.15}, C:{h: -20,s:0.90,v: 0.10} },
          { label: 'Indigo',   A:{h: -80,s:0.90,v: 0.00}, B:{h: -80,s:0.90,v:-0.15}, C:{h: -80,s:1.00,v: 0.10} },
          { label: 'Amber',    A:{h:  40,s:1.00,v: 0.10}, B:{h:  40,s:1.00,v:-0.10}, C:{h:  40,s:1.10,v: 0.15} },
          { label: 'Forest',   A:{h: 120,s:0.90,v: 0.00}, B:{h: 120,s:0.90,v:-0.15}, C:{h: 120,s:1.00,v: 0.10} },
          { label: 'Azure',    A:{h: 160,s:0.80,v:-0.10}, B:{h: 160,s:0.80,v:-0.20}, C:{h: 160,s:0.90,v: 0.00} },
          { label: 'Violet',   A:{h:-120,s:0.80,v:-0.10}, B:{h:-120,s:0.80,v:-0.20}, C:{h:-120,s:0.90,v: 0.00} },
          { label: 'Rose',     A:{h: -40,s:0.70,v: 0.10}, B:{h: -40,s:0.70,v:-0.05}, C:{h: -40,s:0.80,v: 0.15} },
          { label: 'Gold',     A:{h:  60,s:0.90,v: 0.10}, B:{h:  60,s:0.90,v:-0.10}, C:{h:  60,s:1.00,v: 0.15} },
        ],
      },
    },
  };

  // ── State ──────────────────────────────────────────────────
  let _screen = 'create';
  let _selectedMode = 'pve';
  let _selectedPlayerCount = 2;
  let _postGameMessage = '';
  let _scratchbonesReady = false;

  // Appearance editor working state (mutated before save)
  let _editAppearance = null;
  let _editColorPresetIdx = 0;

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

  function swatchStyle(base, h, s, v) {
    const sat = Math.max(0, 1 + s).toFixed(3);
    const bri = Math.max(0, 1 + v).toFixed(3);
    return `background:${base};filter:hue-rotate(${h}deg) saturate(${sat}) brightness(${bri})`;
  }

  // Find closest color preset index by comparing A channel hue
  function findClosestPresetIdx(presets, bodyColors) {
    if (!bodyColors || !bodyColors.A) return 0;
    const h = bodyColors.A.h;
    let best = 0, bestDist = Infinity;
    presets.forEach((p, i) => {
      const d = Math.abs(p.A.h - h);
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
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
          <button class="sb-btn-ghost" id="sb-appearance-btn">Edit Appearance</button>
          <button class="sb-btn-ghost" id="sb-shop-btn">Shop</button>
          <button class="sb-btn-ghost" id="sb-online-btn">Play Online</button>
          ${adBtn}
          <button class="sb-btn-primary" id="sb-start-btn">Start Game</button>
        </div>
      </div>`;
  }

  function renderAppearance() {
    const acc = window.ScratchbonesAccount;
    const bronze = acc ? acc.getBronze() : 0;
    const ap = _editAppearance;
    const speciesId = ap.speciesId || 'mao-ao';
    const gender = ap.gender || 'male';
    const specData = SPECIES_DATA[speciesId];
    const genderData = specData && specData[gender];
    const cosmetics = ap.cosmetics || {};
    const bodyColors = ap.bodyColors || {};

    // Species picker
    const speciesBtns = Object.entries(SPECIES_DATA).map(([sid, sd]) => `
      <button class="sb-species-btn${speciesId === sid ? ' selected' : ''}" data-species="${sid}">
        ${esc(sd.label)}
      </button>`).join('');

    // Gender picker
    const availableGenders = specData ? specData.genders : ['male'];
    const genderBtns = ['male', 'female'].map(g => {
      const available = availableGenders.includes(g);
      return `<button class="sb-gender-btn${gender === g ? ' selected' : ''}${!available ? ' disabled' : ''}"
        data-gender="${g}"${!available ? ' disabled' : ''}>${cap(g)}</button>`;
    }).join('');

    // Hat selector (always shown)
    const hatVal = cosmetics.hat || '';
    const hatOpts = HAT_OPTS.map(o =>
      `<option value="${esc(o.id || '')}"${hatVal === (o.id || '') ? ' selected' : ''}>${esc(o.label)}</option>`
    ).join('');
    let slotsHtml = `
      <div class="sb-cosmetic-row">
        <label class="sb-cosmetic-label">Hat</label>
        <select class="sb-cosmetic-select" data-slot="hat">${hatOpts}</select>
      </div>`;

    // Species+gender specific slots
    if (genderData && genderData.slots) {
      for (const slotDef of genderData.slots) {
        const currentVal = cosmetics[slotDef.slot] || '';
        const opts = slotDef.options.map(o =>
          `<option value="${esc(o.id || '')}"${currentVal === (o.id || '') ? ' selected' : ''}>${esc(o.label)}</option>`
        ).join('');
        slotsHtml += `
          <div class="sb-cosmetic-row">
            <label class="sb-cosmetic-label">${esc(slotDef.label)}</label>
            <select class="sb-cosmetic-select" data-slot="${slotDef.slot}">${opts}</select>
          </div>`;
      }
    }

    // Color presets
    const base = specData ? specData.swatchBase : '#a09070';
    const presets = genderData ? genderData.colorPresets : [];
    const presetIdx = _editColorPresetIdx;
    const colorSwatches = presets.map((p, i) => {
      const sel = i === presetIdx ? ' selected' : '';
      const triStyle = [
        `background:${base};filter:hue-rotate(${p.A.h}deg) saturate(${Math.max(0,1+p.A.s).toFixed(3)}) brightness(${Math.max(0,1+p.A.v).toFixed(3)})`,
        `background:${base};filter:hue-rotate(${p.B.h}deg) saturate(${Math.max(0,1+p.B.s).toFixed(3)}) brightness(${Math.max(0,1+p.B.v).toFixed(3)})`,
        `background:${base};filter:hue-rotate(${p.C.h}deg) saturate(${Math.max(0,1+p.C.s).toFixed(3)}) brightness(${Math.max(0,1+p.C.v).toFixed(3)})`,
      ];
      return `<button class="sb-color-preset${sel}" data-preset="${i}" title="${esc(p.label)}">
        <span class="sb-swatch-a" style="${triStyle[0]}"></span>
        <span class="sb-swatch-b" style="${triStyle[1]}"></span>
        <span class="sb-swatch-c" style="${triStyle[2]}"></span>
        <span class="sb-swatch-lbl">${esc(p.label)}</span>
      </button>`;
    }).join('');

    return `
      <div class="sb-card sb-appearance-card">
        <div class="sb-header">
          <button class="sb-btn-ghost" id="sb-back-btn">← Back</button>
          <div class="sb-title">Appearance</div>
          <div class="sb-bronze"><span class="sb-coin">🪙</span>${bronze}&nbsp;Bronze</div>
        </div>
        <div class="sb-label">Species</div>
        <div class="sb-species-picker">${speciesBtns}</div>
        <div class="sb-label" style="margin-top:10px;">Gender</div>
        <div class="sb-gender-picker">${genderBtns}</div>
        <div class="sb-label" style="margin-top:10px;">Cosmetics</div>
        <div class="sb-cosmetics-list">${slotsHtml}</div>
        <div class="sb-label" style="margin-top:10px;">Body Color</div>
        <div class="sb-color-presets">${colorSwatches || '<div class="sb-muted">No presets available</div>'}</div>
        <div class="sb-actions" style="margin-top:14px;">
          <button class="sb-btn-primary" id="sb-save-appearance-btn">Save</button>
        </div>
      </div>`;
  }

  function renderShop() {
    const acc = window.ScratchbonesAccount;
    const bronze = acc ? acc.getBronze() : 0;
    const appearance = acc ? acc.getAppearance() : { speciesId: 'mao-ao', gender: 'male' };
    const catalog = acc ? acc.getShopCatalogForAppearance(appearance.speciesId, appearance.gender) : [];
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
        <div class="sb-shop-note sb-muted" style="padding:4px 0 8px;font-size:0.82em;">
          Showing items for ${esc(SPECIES_DATA[appearance.speciesId]?.label || appearance.speciesId)} (${esc(cap(appearance.gender))})
        </div>
        <div class="sb-shop-list">${rows || '<div class="sb-muted">No items available for your species.</div>'}</div>
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
    else if (_screen === 'appearance')          el.innerHTML = renderAppearance();
    else if (_screen === 'shop')                el.innerHTML = renderShop();
    else if (_screen === 'online')              el.innerHTML = renderOnline();
    else if (_screen === 'online-host-setup')   el.innerHTML = renderOnlineHostSetup();
    else if (_screen === 'online-waiting')      el.innerHTML = renderOnlineWaiting();
    else if (_screen === 'online-join')         el.innerHTML = renderOnlineJoin();
    else if (_screen === 'online-joined')       el.innerHTML = renderOnlineJoined();
    else                                        el.innerHTML = renderMain();
    bind();
  }

  function openAppearanceEditor() {
    const acc = window.ScratchbonesAccount;
    const saved = acc ? acc.getAppearance() : null;
    // Deep-copy for editing
    _editAppearance = {
      speciesId: saved?.speciesId || 'mao-ao',
      gender:    saved?.gender    || 'male',
      cosmetics: { ...(saved?.cosmetics || {}) },
      bodyColors: {
        A: { ...(saved?.bodyColors?.A || { h:0,s:-0.7,v:-0.3 }) },
        B: { ...(saved?.bodyColors?.B || { h:0,s:-0.7,v:-0.5 }) },
        C: { ...(saved?.bodyColors?.C || { h:0,s:-0.8,v:-0.2 }) },
      },
    };
    const specData = SPECIES_DATA[_editAppearance.speciesId];
    const gData = specData && specData[_editAppearance.gender];
    _editColorPresetIdx = gData ? findClosestPresetIdx(gData.colorPresets, _editAppearance.bodyColors) : 0;
    _screen = 'appearance';
    render();
  }

  function bind() {
    const el = overlay();
    if (!el) return;

    // ── Create screen ──
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

    // ── Main screen ──
    document.getElementById('sb-start-btn')?.addEventListener('click', startGame);
    document.getElementById('sb-appearance-btn')?.addEventListener('click', openAppearanceEditor);
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

    // ── Back button (shared) ──
    document.getElementById('sb-back-btn')?.addEventListener('click', () => {
      if (_screen === 'appearance' || _screen === 'shop' || _screen === 'online') _screen = 'main';
      else if (_screen === 'online-host-setup' || _screen === 'online-join') _screen = 'online';
      else _screen = 'main';
      render();
    });

    // ── Appearance editor ──
    el.querySelectorAll('.sb-species-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const sid = btn.dataset.species;
        _editAppearance.speciesId = sid;
        const specData = SPECIES_DATA[sid];
        // If current gender not available for new species, switch to first available
        if (specData && !specData.genders.includes(_editAppearance.gender)) {
          _editAppearance.gender = specData.genders[0];
        }
        // Reset cosmetics when species changes
        _editAppearance.cosmetics = {};
        const gData = specData && specData[_editAppearance.gender];
        _editColorPresetIdx = 0;
        if (gData && gData.colorPresets.length) {
          const p = gData.colorPresets[0];
          _editAppearance.bodyColors = { A:{...p.A}, B:{...p.B}, C:{...p.C} };
        }
        render();
      });
    });

    el.querySelectorAll('.sb-gender-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        _editAppearance.gender = btn.dataset.gender;
        // Reset cosmetics when gender changes
        _editAppearance.cosmetics = {};
        const specData = SPECIES_DATA[_editAppearance.speciesId];
        const gData = specData && specData[_editAppearance.gender];
        _editColorPresetIdx = 0;
        if (gData && gData.colorPresets.length) {
          const p = gData.colorPresets[0];
          _editAppearance.bodyColors = { A:{...p.A}, B:{...p.B}, C:{...p.C} };
        }
        render();
      });
    });

    el.querySelectorAll('.sb-cosmetic-select').forEach(sel => {
      sel.addEventListener('change', () => {
        const slot = sel.dataset.slot;
        const val = sel.value || null;
        _editAppearance.cosmetics[slot] = val || null;
      });
    });

    el.querySelectorAll('.sb-color-preset').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.preset);
        const specData = SPECIES_DATA[_editAppearance.speciesId];
        const gData = specData && specData[_editAppearance.gender];
        if (gData && gData.colorPresets[idx]) {
          _editColorPresetIdx = idx;
          const p = gData.colorPresets[idx];
          _editAppearance.bodyColors = { A:{...p.A}, B:{...p.B}, C:{...p.C} };
          // Re-render just the presets area to show selection change
          const presetsEl = el.querySelector('.sb-color-presets');
          if (presetsEl) {
            presetsEl.querySelectorAll('.sb-color-preset').forEach((b, i) => {
              b.classList.toggle('selected', i === idx);
            });
          }
        }
      });
    });

    document.getElementById('sb-save-appearance-btn')?.addEventListener('click', () => {
      window.ScratchbonesAccount?.setAppearance(_editAppearance);
      _screen = 'main';
      render();
    });

    // ── Shop screen ──
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

    // ── Online lobby ──
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
            net.on('start-game', () => { startOnlineClient(); });
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

  // ── Build playerAppearances for session ────────────────────

  function buildPlayerAppearances(humanSeats) {
    const acc = window.ScratchbonesAccount;
    const appearance = acc ? acc.getAppearance() : null;
    if (!appearance) return {};
    const result = {};
    // Seat 0 is always the local player; other human seats in hot-seat use same appearance
    for (const seat of humanSeats) {
      result[seat] = appearance;
    }
    return result;
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

    window.SCRATCHBONES_SESSION = {
      mode,
      humanSeats,
      playerNames,
      playerAppearances: buildPlayerAppearances(humanSeats),
    };
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

    window.SCRATCHBONES_SESSION = {
      mode: 'pvp',
      humanSeats,
      playerNames,
      playerAppearances: buildPlayerAppearances([0]),
    };
    _postGameMessage = '';

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
      playerAppearances: buildPlayerAppearances([_myOnlineSeat]),
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
