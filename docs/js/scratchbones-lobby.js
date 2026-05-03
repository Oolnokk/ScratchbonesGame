(function () {
  'use strict';

  const MODES = [
    { id: 'pve',   label: 'PvE',   desc: '1 Human + AI opponents',   humanRange: null },
    { id: 'pvp',   label: 'PvP',   desc: 'All Human players',        humanRange: [2, 4] },
    { id: 'pvpve', label: 'PvPvE', desc: 'Human + AI mix',           humanRange: [2, 3] },
  ];

  // ── Species UI data ────────────────────────────────────────
  // colorOptions: shared preset list for both A and B selectors.
  // C is auto-derived from A (slightly lighter).
  const HAT_OPTS = [
    { id: null,                                       label: 'None' },
    { id: 'appearance::hat::basic_headband',          label: 'Headband' },
    { id: 'appearance::hat::riverlandskasa_low',      label: 'Kasa (Low)' },
    { id: 'appearance::hat::riverlandskasa_wide',     label: 'Kasa (Wide)' },
  ];

  const SPECIES_DATA = {
    'mao-ao': {
      label: 'Mao-ao', genders: ['male', 'female'], swatchBase: '#7dc89a',
      male: {
        slots: [
          { slot: 'hairFront', label: 'Front Hair', options: [
            { id: null,                                              label: 'None' },
            { id: 'appearance::Mao-ao_M::mao-ao_smooth_striped',    label: 'Smooth Striped' },
            { id: 'appearance::Mao-ao_M::mao-ao_tuft',              label: 'Tuft' },
            { id: 'appearance::Mao-ao_M::mao-ao_forwardtuft_short', label: 'Forward Tuft (Short)' },
            { id: 'appearance::Mao-ao_M::mao-ao_forwardtuft_long',  label: 'Forward Tuft (Long)' },
          ]},
          { slot: 'hairSide', label: 'Side Hair', options: [
            { id: null,                                                     label: 'None' },
            { id: 'appearance::Mao-ao_M::mao-ao_shoulder_length_drape',    label: 'Shoulder Drape' },
          ]},
          { slot: 'eyes', label: 'Eyes', options: [
            { id: null,                                              label: 'Default' },
            { id: 'appearance::Mao-ao_M::mao-ao_circled_eyes',      label: 'Circled Eyes' },
            { id: 'appearance::Mao-ao_M::mao-ao_circled_eye_L',     label: 'Circled Eye (L)' },
          ]},
          { slot: 'facialHair', label: 'Facial Hair', options: [
            { id: null,                                              label: 'None' },
            { id: 'appearance::Mao-ao_M::mao-ao_wildbeard',         label: 'Wild Beard' },
          ]},
        ],
        colorOptions: [
          { label: 'Cool',   h:-70, s:-0.80, v:-0.55 },
          { label: 'Dusk',   h:-40, s:-0.70, v:-0.45 },
          { label: 'Stone',  h:  0, s:-0.70, v:-0.30 },
          { label: 'Sand',   h: 30, s:-0.60, v:-0.15 },
          { label: 'Pale',   h: 10, s:-0.90, v: 0.25 },
          { label: 'Raven',  h:  0, s:-0.90, v:-0.85 },
        ],
      },
      female: {
        slots: [
          { slot: 'hairFront', label: 'Front Hair', options: [
            { id: null,                                              label: 'None' },
            { id: 'appearance::Mao-ao_F::mao-ao_smooth_striped',    label: 'Smooth Striped' },
            { id: 'appearance::Mao-ao_F::mao-ao_tuft',              label: 'Tuft' },
            { id: 'appearance::Mao-ao_F::mao-ao_forwardtuft_short', label: 'Forward Tuft (Short)' },
            { id: 'appearance::Mao-ao_F::mao-ao_forwardtuft_long',  label: 'Forward Tuft (Long)' },
          ]},
          { slot: 'hairBack', label: 'Back Hair', options: [
            { id: null,                                                   label: 'None' },
            { id: 'appearance::Mao-ao_F::mao-ao_splayedknot_medium',     label: 'Splayed Knot' },
            { id: 'appearance::Mao-ao_F::mao-ao_long_ponytail',          label: 'Long Ponytail' },
          ]},
          { slot: 'hairSide', label: 'Side Hair', options: [
            { id: null,                                                     label: 'None' },
            { id: 'appearance::Mao-ao_F::mao-ao_shoulder_length_drape',    label: 'Shoulder Drape' },
          ]},
          { slot: 'eyes', label: 'Eyes', options: [
            { id: null,                                              label: 'Default' },
            { id: 'appearance::Mao-ao_F::mao-ao_circled_eyes',      label: 'Circled Eyes' },
            { id: 'appearance::Mao-ao_F::mao-ao_circled_eyes_f',    label: 'Circled Eyes F' },
            { id: 'appearance::Mao-ao_F::mao-ao_circled_eye_L',     label: 'Circled Eye (L)' },
          ]},
        ],
        colorOptions: [
          { label: 'Cool',   h:-70, s:-0.80, v:-0.55 },
          { label: 'Dusk',   h:-40, s:-0.70, v:-0.45 },
          { label: 'Stone',  h:  0, s:-0.70, v:-0.30 },
          { label: 'Sand',   h: 30, s:-0.60, v:-0.15 },
          { label: 'Pale',   h: 10, s:-0.90, v: 0.25 },
          { label: 'Raven',  h:  0, s:-0.90, v:-0.85 },
        ],
      },
    },
    'tletingan': {
      label: 'Tletingan', genders: ['male'], swatchBase: '#80a060',
      male: {
        slots: [
          { slot: 'hairFront', label: 'Front Hair', options: [
            { id: null,                                                label: 'None' },
            { id: 'appearance::Tletingan_M::tl_forwardtuft_short',    label: 'Forward Tuft (Short)' },
            { id: 'appearance::Tletingan_M::tl_forwardtuft_long',     label: 'Forward Tuft (Long)' },
          ]},
          { slot: 'hairBack', label: 'Back Hair', options: [
            { id: null,                                                label: 'None' },
            { id: 'appearance::Tletingan_M::tl_longponytail',         label: 'Long Ponytail' },
            { id: 'appearance::Tletingan_M::tl_splayedknot',          label: 'Splayed Knot' },
          ]},
          { slot: 'facialHair', label: 'Facial Hair', options: [
            { id: null,                                                label: 'None' },
            { id: 'appearance::Tletingan_M::tl_wildbeard',            label: 'Wild Beard' },
          ]},
        ],
        colorOptions: [
          { label: 'Forest', h:-85, s:-0.30, v:-0.40 },
          { label: 'Fern',   h:-60, s:-0.20, v:-0.35 },
          { label: 'Olive',  h:-40, s:-0.10, v:-0.30 },
          { label: 'Earth',  h:-20, s: 0.00, v:-0.20 },
          { label: 'Rust',   h:  0, s: 0.10, v:-0.15 },
          { label: 'Ash',    h:-80, s:-0.40, v:-0.45 },
        ],
      },
    },
    'kenkari': {
      label: 'Kenkari', genders: ['male', 'female'], swatchBase: '#d0b060',
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
        colorOptions: [
          { label: 'Crimson', h: -20, s:0.80, v: 0.00 },
          { label: 'Indigo',  h: -80, s:0.90, v: 0.00 },
          { label: 'Amber',   h:  40, s:1.00, v: 0.10 },
          { label: 'Forest',  h: 120, s:0.90, v: 0.00 },
          { label: 'Azure',   h: 160, s:0.80, v:-0.10 },
          { label: 'Violet',  h:-120, s:0.80, v:-0.10 },
          { label: 'Rose',    h: -40, s:0.70, v: 0.10 },
          { label: 'Gold',    h:  60, s:0.90, v: 0.10 },
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
        colorOptions: [
          { label: 'Crimson', h: -20, s:0.80, v: 0.00 },
          { label: 'Indigo',  h: -80, s:0.90, v: 0.00 },
          { label: 'Amber',   h:  40, s:1.00, v: 0.10 },
          { label: 'Forest',  h: 120, s:0.90, v: 0.00 },
          { label: 'Azure',   h: 160, s:0.80, v:-0.10 },
          { label: 'Violet',  h:-120, s:0.80, v:-0.10 },
          { label: 'Rose',    h: -40, s:0.70, v: 0.10 },
          { label: 'Gold',    h:  60, s:0.90, v: 0.10 },
        ],
      },
    },
  };

  // ── Lobby state ────────────────────────────────────────────
  let _screen = 'create';
  let _selectedMode = 'pve';
  let _selectedPlayerCount = 2;
  let _postGameMessage = '';
  let _scratchbonesReady = false;

  // Appearance editor working state
  let _editAppearance = null;   // { speciesId, gender, cosmetics, bodyColors }
  let _editAIdx = 0;            // index into current species/gender colorOptions for A
  let _editBIdx = 0;            // index into current species/gender colorOptions for B

  // Online state
  let _onlinePlayerCount = 2;
  let _roomCode = '';
  let _onlineOccupants = [];        // [{seatId, name}]
  let _onlineOccupantAppearances = {}; // { seatId: appearance }
  let _myOnlineSeat = null;

  // Portrait preview
  let _lobbyPortraitCosmetics = null;
  let _lobbyPortraitLoading = false;

  // Collections: which slot's dye panel is open (null | 'hat' | 'torso' | 'overwear')
  let _activeDyeSlot = null;

  // ── Helpers ────────────────────────────────────────────────

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function cap(str) { return String(str).charAt(0).toUpperCase() + String(str).slice(1); }

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

  // Derive C from A: slightly lighter and less saturated (highlight/marking)
  function deriveCFromA(a) {
    return {
      h: a.h,
      s: Math.max(-1, Math.min(1, a.s + 0.05)),
      v: Math.max(-1, Math.min(1, a.v + 0.18)),
    };
  }

  // Find closest index in colorOptions by comparing h and v distance
  function closestColorIdx(options, target) {
    if (!options || !options.length || !target) return 0;
    let best = 0, bestDist = Infinity;
    options.forEach((o, i) => {
      const dh = Math.abs(o.h - target.h);
      const dv = Math.abs(o.v - target.v);
      const d = dh * 0.5 + dv * 100;
      if (d < bestDist) { bestDist = d; best = i; }
    });
    return best;
  }

  function currentSpeciesGenderData() {
    if (!_editAppearance) return null;
    const specData = SPECIES_DATA[_editAppearance.speciesId];
    return specData ? specData[_editAppearance.gender] : null;
  }

  // ── Portrait preview ───────────────────────────────────────

  function _previewRng() {
    let s = 0x9e3779b9;
    return function() {
      s = (Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0);
      s = (Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0);
      return (s >>> 0) / 0x100000000;
    };
  }

  async function ensurePortraitCosmetics() {
    if (_lobbyPortraitCosmetics) return _lobbyPortraitCosmetics;
    if (_lobbyPortraitLoading) return null;
    _lobbyPortraitLoading = true;
    try {
      if (window.setPortraitAssetBase) window.setPortraitAssetBase('./docs/assets/');
      if (window.loadPortraitCosmetics) {
        _lobbyPortraitCosmetics = await window.loadPortraitCosmetics('./docs/config/');
      }
    } catch (e) {
      console.warn('[lobby] portrait load failed', e);
    }
    _lobbyPortraitLoading = false;
    return _lobbyPortraitCosmetics;
  }

  function buildPreviewProfile(appearance) {
    const cosmetics = _lobbyPortraitCosmetics;
    if (!cosmetics || !window.getPortraitFighters || !window.randomProfileSeeded) return null;
    const { optionCache, hairFrontOptions, hairBackOptions, hairSideOptions, eyesOptions, facialHairOptions,
            hatOptions, torsoPortraitOptions, armPortraitOptions, bodyColorRangesByGender,
            allowedCosmeticsByFighter, cosmeticWeightsByFighter, forcedCosmeticsByFighter,
            conditionalCosmeticsByFighter } = cosmetics;
    const fighters = window.getPortraitFighters();
    if (!fighters || !fighters.length) return null;

    const { speciesId, gender, cosmetics: savedCosmetics, bodyColors } = appearance;
    const normalize = s => s.replace(/-/g, '_');
    const fighterGender = f => f.gender ?? (f.id === 'M' ? 'male' : f.id === 'F' ? 'female' : null);
    const fighter = fighters.find(f =>
      (f.speciesId === speciesId || f.speciesId === normalize(speciesId)) &&
      fighterGender(f) === gender
    ) || fighters[0];
    if (!fighter) return null;

    const rng = _previewRng();
    const forced = forcedCosmeticsByFighter?.[fighter.id] ?? {};
    const forcedSlots = new Set(Object.keys(forced));

    const profile = window.randomProfileSeeded(rng, [fighter], hairFrontOptions, hairBackOptions,
      hairSideOptions, eyesOptions, facialHairOptions, bodyColorRangesByGender,
      allowedCosmeticsByFighter, hatOptions, cosmeticWeightsByFighter, torsoPortraitOptions,
      armPortraitOptions, forcedCosmeticsByFighter, conditionalCosmeticsByFighter);
    if (!profile) return null;

    // Apply saved cosmetics (skip forced slots)
    const lookup = id => id ? (optionCache?.get(id) ?? null) : null;
    if (savedCosmetics) {
      if (savedCosmetics.hairFront  !== undefined && !forcedSlots.has('hairFront'))  profile.hairFront  = lookup(savedCosmetics.hairFront);
      if (savedCosmetics.hairBack   !== undefined && !forcedSlots.has('hairBack'))   profile.hairBack   = lookup(savedCosmetics.hairBack);
      if (savedCosmetics.hairSide   !== undefined && !forcedSlots.has('hairSide'))   profile.hairSide   = lookup(savedCosmetics.hairSide);
      if (savedCosmetics.eyes       !== undefined && !forcedSlots.has('eyes'))       profile.eyes       = lookup(savedCosmetics.eyes);
      if (savedCosmetics.facialHair !== undefined && !forcedSlots.has('facialHair')) profile.facialHair = lookup(savedCosmetics.facialHair);
    }
    if (bodyColors) profile.bodyColors = { ...(profile.bodyColors || {}), ...bodyColors };

    // Apply equipped shop items and dyes
    const acc = window.ScratchbonesAccount;
    if (acc) {
      const applyEquip = (cat, key) => {
        const id = acc.getEquippedForCategory(cat);
        if (id && optionCache?.has(id)) profile[key] = optionCache.get(id);
      };
      applyEquip('hat', 'hat');
      applyEquip('torso', 'torsoCosmetic');
      applyEquip('overwear', 'armCosmetic');
      const dyeIds = acc.getAppliedDyes ? acc.getAppliedDyes() : {};
      const catalog = acc.getDyeCatalog ? acc.getDyeCatalog() : [];
      for (const ch of ['A', 'B', 'C']) {
        const id = dyeIds[ch];
        if (id) {
          const dye = catalog.find(d => d.id === id);
          if (dye) profile.bodyColors = { ...(profile.bodyColors || {}), [ch]: { ...dye.color } };
        }
      }
    }
    return profile;
  }

  function renderPreviewCanvas(canvasId, appearance) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    if (!_lobbyPortraitCosmetics) {
      ensurePortraitCosmetics().then(() => {
        const c2 = document.getElementById(canvasId);
        if (!c2) return;
        const profile = buildPreviewProfile(appearance);
        if (profile && window.renderProfile) window.renderProfile(c2, profile);
      });
      return;
    }
    const profile = buildPreviewProfile(appearance);
    if (profile && window.renderProfile) window.renderProfile(canvas, profile);
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
          <div class="sb-bronze"><span class="sb-coin">🪙</span><span id="sb-bronze-val">${bronze}</span>&nbsp;Bronze</div>
        </div>
        ${postMsg}
        <div class="sb-welcome">Welcome back, ${esc(username)}!</div>
        <div class="sb-label">Game Mode</div>
        <div class="sb-mode-picker">${modeButtons}</div>
        ${playerPicker}
        <div class="sb-actions">
          <button class="sb-btn-ghost" id="sb-appearance-btn">Edit Appearance</button>
          <button class="sb-btn-ghost" id="sb-collections-btn">Collections</button>
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
    const base = specData ? specData.swatchBase : '#a09070';
    const colorOpts = genderData ? genderData.colorOptions : [];

    // Species picker
    const speciesBtns = Object.entries(SPECIES_DATA).map(([sid, sd]) =>
      `<button class="sb-sel-btn${speciesId === sid ? ' selected' : ''}" data-species="${sid}">${esc(sd.label)}</button>`
    ).join('');

    // Gender picker
    const availGenders = specData ? specData.genders : ['male'];
    const genderBtns = ['male', 'female'].map(g => {
      const avail = availGenders.includes(g);
      return `<button class="sb-sel-btn${gender === g ? ' selected' : ''}${!avail ? ' disabled' : ''}" data-gender="${g}"${!avail ? ' disabled' : ''}>${cap(g)}</button>`;
    }).join('');

    let slotsHtml = '';
    if (genderData && genderData.slots) {
      for (const slotDef of genderData.slots) {
        const cur = cosmetics[slotDef.slot] || '';
        const opts = slotDef.options.map(o =>
          `<option value="${esc(o.id || '')}"${cur === (o.id || '') ? ' selected' : ''}>${esc(o.label)}</option>`
        ).join('');
        slotsHtml += `
          <div class="sb-cosmetic-row">
            <label class="sb-cosmetic-label">${esc(slotDef.label)}</label>
            <select class="sb-cosmetic-select" data-slot="${slotDef.slot}">${opts}</select>
          </div>`;
      }
    }

    // Color rows (A and B separate, C hidden)
    function colorRow(label, selectedIdx, dataAttr) {
      const swatches = colorOpts.map((o, i) =>
        `<button class="sb-swatch-btn${i === selectedIdx ? ' selected' : ''}" ${dataAttr}="${i}"
           style="${swatchStyle(base, o.h, o.s, o.v)}" title="${esc(o.label)}"></button>`
      ).join('');
      return `
        <div class="sb-color-row">
          <span class="sb-color-row-lbl">${label}</span>
          <div class="sb-swatch-strip">${swatches}</div>
        </div>`;
    }

    return `
      <div class="sb-card sb-wide-card">
        <div class="sb-header">
          <button class="sb-btn-ghost" id="sb-back-btn">← Back</button>
          <div class="sb-title">Appearance</div>
          <div class="sb-bronze"><span class="sb-coin">🪙</span>${bronze}&nbsp;Bronze</div>
        </div>
        <div class="sb-ap-layout">
          <div class="sb-ap-preview">
            <canvas id="sb-ap-canvas" width="160" height="160" class="sb-portrait-canvas"></canvas>
          </div>
          <div class="sb-ap-controls">
            <div class="sb-label">Species</div>
            <div class="sb-sel-group">${speciesBtns}</div>
            <div class="sb-label" style="margin-top:8px;">Gender</div>
            <div class="sb-sel-group">${genderBtns}</div>
            <div class="sb-label" style="margin-top:8px;">Cosmetics</div>
            <div class="sb-cosmetics-list">${slotsHtml}</div>
            <div class="sb-label" style="margin-top:8px;">Primary Color</div>
            ${colorRow('A', _editAIdx, 'data-a-idx')}
            <div class="sb-label" style="margin-top:4px;">Secondary Color</div>
            ${colorRow('B', _editBIdx, 'data-b-idx')}
          </div>
        </div>
        <div class="sb-actions" style="margin-top:12px;">
          <button class="sb-btn-primary" id="sb-save-appearance-btn">Save</button>
        </div>
      </div>`;
  }

  function renderCollections() {
    const acc = window.ScratchbonesAccount;
    const fullCatalog = acc ? acc.getShopCatalog() : [];
    const dyes = acc ? acc.getDyeCatalog() : [];
    const appliedDyes = acc ? acc.getAppliedDyes() : {};

    const CLOTHING_SLOTS = [
      { key: 'hat',      label: 'Hat',      category: 'hat' },
      { key: 'torso',    label: 'Torso',    category: 'torso' },
      { key: 'overwear', label: 'Overwear', category: 'overwear' },
    ];

    const ownedDyes = dyes.filter(d => acc && acc.isDyeOwned(d.id));

    let slotsHtml = '';
    for (const slot of CLOTHING_SLOTS) {
      const ownedItems = fullCatalog.filter(item => item.category === slot.category && acc && acc.isUnlocked(item.id));
      const equippedId = acc ? acc.getEquippedForCategory(slot.category) : null;
      const opts = [
        `<option value="">None</option>`,
        ...ownedItems.map(item =>
          `<option value="${esc(item.id)}"${item.id === equippedId ? ' selected' : ''}>${esc(item.label)}</option>`
        ),
      ].join('');
      const isDyeOpen = _activeDyeSlot === slot.key;
      slotsHtml += `
        <div class="sb-slot-row">
          <span class="sb-slot-label">${esc(slot.label)}</span>
          <select class="sb-cosmetic-select sb-slot-select" data-slot-cat="${slot.category}"${!ownedItems.length && !equippedId ? ' disabled' : ''}>${opts}</select>
          <button class="sb-btn-ghost sb-dye-toggle${isDyeOpen ? ' active' : ''}" data-toggle-dye="${slot.key}">Dye ▾</button>
        </div>`;
      if (isDyeOpen) {
        let dyeRows = ownedDyes.map(d => {
          const style = swatchStyle('#c0a060', d.color.h, d.color.s, d.color.v);
          return `
            <div class="sb-dye-row">
              <span class="sb-dye-dot" style="${style}"></span>
              <span class="sb-dye-name">${esc(d.label)}</span>
              <button class="sb-apply-btn${appliedDyes.A === d.id ? ' applied' : ''}" data-apply-dye="${esc(d.id)}" data-channel="A">A</button>
              <button class="sb-apply-btn${appliedDyes.B === d.id ? ' applied' : ''}" data-apply-dye="${esc(d.id)}" data-channel="B">B</button>
              <button class="sb-apply-btn${appliedDyes.C === d.id ? ' applied' : ''}" data-apply-dye="${esc(d.id)}" data-channel="C">C</button>
            </div>`;
        }).join('');
        if (!dyeRows) dyeRows = '<div class="sb-muted" style="font-size:0.8em;">No dyes owned.</div>';
        const clearBtns = ['A', 'B', 'C'].filter(ch => appliedDyes[ch]).map(ch =>
          `<button class="sb-btn-ghost sb-apply-btn" data-clear-channel="${ch}">Clear ${ch}</button>`
        ).join('');
        slotsHtml += `
          <div class="sb-dye-panel">
            <div class="sb-muted" style="font-size:0.74em;margin-bottom:5px;">Apply dye to body color — A: primary · B: secondary · C: highlight</div>
            ${dyeRows}
            ${clearBtns ? `<div class="sb-dye-clears">${clearBtns}</div>` : ''}
          </div>`;
      }
    }

    return `
      <div class="sb-card sb-wide-card">
        <div class="sb-header">
          <button class="sb-btn-ghost" id="sb-back-btn">← Back</button>
          <div class="sb-title">Collections</div>
        </div>
        <div class="sb-col-layout">
          <div class="sb-col-preview">
            <canvas id="sb-col-canvas" width="160" height="160" class="sb-portrait-canvas"></canvas>
          </div>
          <div class="sb-col-content">
            <div class="sb-label">Clothing</div>
            <div class="sb-slot-rows">${slotsHtml}</div>
          </div>
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
            <span class="sb-coin">🪙</span>${item.price}</button>`;
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
      <div class="sb-card sb-wide-card">
        <div class="sb-header">
          <button class="sb-btn-ghost" id="sb-back-btn">← Back</button>
          <div class="sb-title">Shop</div>
          <div class="sb-bronze"><span class="sb-coin">🪙</span><span id="sb-bronze-val">${bronze}</span>&nbsp;Bronze</div>
        </div>
        <div class="sb-ap-layout">
          <div class="sb-ap-preview">
            <canvas id="sb-shop-canvas" width="160" height="160" class="sb-portrait-canvas"></canvas>
          </div>
          <div style="flex:1;min-width:0;">
            <div class="sb-shop-note sb-muted" style="font-size:0.8em;padding-bottom:6px;">
              Showing items for ${esc(SPECIES_DATA[appearance.speciesId]?.label || appearance.speciesId)} (${esc(cap(appearance.gender))})
            </div>
            <div class="sb-shop-list" style="max-height:52dvh;">${rows || '<div class="sb-muted">No items available.</div>'}</div>
          </div>
        </div>
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
    if      (_screen === 'create')            el.innerHTML = renderCreate();
    else if (_screen === 'appearance')        el.innerHTML = renderAppearance();
    else if (_screen === 'collections')       el.innerHTML = renderCollections();
    else if (_screen === 'shop')              el.innerHTML = renderShop();
    else if (_screen === 'online')            el.innerHTML = renderOnline();
    else if (_screen === 'online-host-setup') el.innerHTML = renderOnlineHostSetup();
    else if (_screen === 'online-waiting')    el.innerHTML = renderOnlineWaiting();
    else if (_screen === 'online-join')       el.innerHTML = renderOnlineJoin();
    else if (_screen === 'online-joined')     el.innerHTML = renderOnlineJoined();
    else                                      el.innerHTML = renderMain();
    bind();

    // Kick off portrait preview after DOM is ready
    if (_screen === 'appearance' && _editAppearance) {
      renderPreviewCanvas('sb-ap-canvas', _editAppearance);
    } else if (_screen === 'collections' || _screen === 'shop') {
      const acc = window.ScratchbonesAccount;
      const ap = acc ? acc.getAppearance() : { speciesId: 'mao-ao', gender: 'male', cosmetics: {}, bodyColors: {} };
      renderPreviewCanvas(_screen === 'collections' ? 'sb-col-canvas' : 'sb-shop-canvas', ap);
    }
  }

  // ── Open appearance editor ─────────────────────────────────

  function openAppearanceEditor() {
    const acc = window.ScratchbonesAccount;
    const saved = acc ? acc.getAppearance() : null;
    _editAppearance = {
      speciesId: saved?.speciesId || 'mao-ao',
      gender:    saved?.gender    || 'male',
      cosmetics: { ...(saved?.cosmetics || {}) },
      bodyColors: {
        A: { ...(saved?.bodyColors?.A || { h:0, s:-0.70, v:-0.30 }) },
        B: { ...(saved?.bodyColors?.B || { h:0, s:-0.70, v:-0.50 }) },
        C: { ...(saved?.bodyColors?.C || { h:0, s:-0.65, v:-0.15 }) },
      },
    };
    const gData = currentSpeciesGenderData();
    const opts = gData ? gData.colorOptions : [];
    _editAIdx = closestColorIdx(opts, _editAppearance.bodyColors.A);
    _editBIdx = closestColorIdx(opts, _editAppearance.bodyColors.B);
    _screen = 'appearance';
    render();
  }

  // ── Bind event handlers ────────────────────────────────────

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
    document.getElementById('sb-appearance-btn')?.addEventListener('click', openAppearanceEditor);
    document.getElementById('sb-collections-btn')?.addEventListener('click', () => { _screen = 'collections'; render(); });
    document.getElementById('sb-shop-btn')?.addEventListener('click', () => { _screen = 'shop'; render(); });
    document.getElementById('sb-online-btn')?.addEventListener('click', () => { _screen = 'online'; render(); });
    document.getElementById('sb-ad-btn')?.addEventListener('click', () => {
      window.ScratchbonesAccount?.watchAd(); render();
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

    // Back button
    document.getElementById('sb-back-btn')?.addEventListener('click', () => {
      if (_screen === 'collections') _activeDyeSlot = null;
      if (['appearance', 'collections', 'shop', 'online'].includes(_screen)) _screen = 'main';
      else if (['online-host-setup', 'online-join'].includes(_screen)) _screen = 'online';
      else _screen = 'main';
      render();
    });

    // ── Appearance editor ──────────────────────────────────────

    el.querySelectorAll('[data-species]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!_editAppearance) return;
        const sid = btn.dataset.species;
        _editAppearance.speciesId = sid;
        const specData = SPECIES_DATA[sid];
        if (specData && !specData.genders.includes(_editAppearance.gender)) {
          _editAppearance.gender = specData.genders[0];
        }
        _editAppearance.cosmetics = {};
        const gData = specData && specData[_editAppearance.gender];
        const opts = gData ? gData.colorOptions : [];
        _editAIdx = 0; _editBIdx = 0;
        if (opts[0]) {
          _editAppearance.bodyColors.A = { h: opts[0].h, s: opts[0].s, v: opts[0].v };
          _editAppearance.bodyColors.B = { h: opts[0].h, s: opts[0].s, v: opts[0].v };
          _editAppearance.bodyColors.C = deriveCFromA(opts[0]);
        }
        render();
      });
    });

    el.querySelectorAll('[data-gender]:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!_editAppearance) return;
        _editAppearance.gender = btn.dataset.gender;
        _editAppearance.cosmetics = {};
        const gData = currentSpeciesGenderData();
        const opts = gData ? gData.colorOptions : [];
        _editAIdx = 0; _editBIdx = 0;
        if (opts[0]) {
          _editAppearance.bodyColors.A = { h: opts[0].h, s: opts[0].s, v: opts[0].v };
          _editAppearance.bodyColors.B = { h: opts[0].h, s: opts[0].s, v: opts[0].v };
          _editAppearance.bodyColors.C = deriveCFromA(opts[0]);
        }
        render();
      });
    });

    el.querySelectorAll('.sb-cosmetic-select').forEach(sel => {
      sel.addEventListener('change', () => {
        if (!_editAppearance) return;
        _editAppearance.cosmetics[sel.dataset.slot] = sel.value || null;
        renderPreviewCanvas('sb-ap-canvas', _editAppearance);
      });
    });

    el.querySelectorAll('[data-a-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!_editAppearance) return;
        const idx = parseInt(btn.dataset.aIdx);
        const gData = currentSpeciesGenderData();
        const o = gData && gData.colorOptions[idx];
        if (!o) return;
        _editAIdx = idx;
        _editAppearance.bodyColors.A = { h: o.h, s: o.s, v: o.v };
        _editAppearance.bodyColors.C = deriveCFromA(o);
        // Update selected state without full re-render
        el.querySelectorAll('[data-a-idx]').forEach((b, i) => b.classList.toggle('selected', i === idx));
        renderPreviewCanvas('sb-ap-canvas', _editAppearance);
      });
    });

    el.querySelectorAll('[data-b-idx]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!_editAppearance) return;
        const idx = parseInt(btn.dataset.bIdx);
        const gData = currentSpeciesGenderData();
        const o = gData && gData.colorOptions[idx];
        if (!o) return;
        _editBIdx = idx;
        _editAppearance.bodyColors.B = { h: o.h, s: o.s, v: o.v };
        el.querySelectorAll('[data-b-idx]').forEach((b, i) => b.classList.toggle('selected', i === idx));
        renderPreviewCanvas('sb-ap-canvas', _editAppearance);
      });
    });

    document.getElementById('sb-save-appearance-btn')?.addEventListener('click', () => {
      window.ScratchbonesAccount?.setAppearance(_editAppearance);
      _screen = 'main';
      render();
    });

    // ── Collections ────────────────────────────────────────────

    el.querySelectorAll('[data-slot-cat]').forEach(sel => {
      sel.addEventListener('change', () => {
        const acc = window.ScratchbonesAccount;
        if (!acc) return;
        const cat = sel.dataset.slotCat;
        const id = sel.value;
        if (!id) {
          const equipped = acc.getEquippedForCategory(cat);
          if (equipped) acc.unequipCosmetic(equipped);
        } else {
          acc.equipCosmetic(id);
        }
        renderPreviewCanvas('sb-col-canvas', acc.getAppearance());
      });
    });

    el.querySelectorAll('[data-toggle-dye]').forEach(btn => {
      btn.addEventListener('click', () => {
        const key = btn.dataset.toggleDye;
        _activeDyeSlot = (_activeDyeSlot === key) ? null : key;
        render();
      });
    });

    el.querySelectorAll('[data-apply-dye]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.ScratchbonesAccount?.applyDye(btn.dataset.applyDye, btn.dataset.channel);
        render();
      });
    });

    el.querySelectorAll('[data-clear-channel]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.ScratchbonesAccount?.removeDye(btn.dataset.clearChannel);
        render();
      });
    });

    // ── Shop ───────────────────────────────────────────────────

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

    // ── Online lobby ───────────────────────────────────────────

    document.getElementById('sb-host-btn')?.addEventListener('click', () => { _screen = 'online-host-setup'; render(); });
    document.getElementById('sb-join-btn')?.addEventListener('click', () => { _screen = 'online-join'; render(); });

    document.getElementById('sb-create-room-btn')?.addEventListener('click', () => {
      const net = window.ScratchbonesNetwork;
      if (!net) { alert('Network module not loaded'); return; }
      const acc = window.ScratchbonesAccount;
      const username = acc?.getUsername() || 'Host';
      const appearance = acc?.getAppearance() ?? null;
      _onlineOccupants = [{ seatId: 0, name: username }];
      _onlineOccupantAppearances = { 0: appearance };
      net.createRoom(wsUrl(), username, _onlinePlayerCount, appearance)
        .then(code => {
          _roomCode = code;
          _myOnlineSeat = 0;
          _screen = 'online-waiting';
          net.on('player-joined', msg => {
            _onlineOccupants = (msg.occupants || []).map(o => ({ seatId: o.seatId, name: o.name }));
            // Store per-seat appearances from the relay
            for (const o of (msg.occupants || [])) {
              if (o.appearance) _onlineOccupantAppearances[o.seatId] = o.appearance;
            }
            render();
          });
          net.on('player-left', msg => {
            _onlineOccupants = _onlineOccupants.filter(o => o.seatId !== msg.seatId);
            delete _onlineOccupantAppearances[msg.seatId];
            render();
          });
          render();
        })
        .catch(err => { alert('Could not create room: ' + err.message); });
    });

    document.getElementById('sb-start-online-btn')?.addEventListener('click', () => {
      if (_onlineOccupants.length < _onlinePlayerCount) return;
      startOnlineGame();
    });
    document.getElementById('sb-cancel-online-btn')?.addEventListener('click', () => {
      window.ScratchbonesNetwork?.disconnect();
      _screen = 'online';
      render();
    });

    const doJoinBtn = document.getElementById('sb-do-join-btn');
    if (doJoinBtn) {
      const attemptJoin = () => {
        const code = (document.getElementById('sb-room-code-input')?.value || '').trim().toUpperCase();
        if (code.length < 4) { showJoinError('Enter a 4-character room code'); return; }
        const net = window.ScratchbonesNetwork;
        if (!net) { showJoinError('Network module not loaded'); return; }
        const acc = window.ScratchbonesAccount;
        const username = acc?.getUsername() || 'Player';
        const appearance = acc?.getAppearance() ?? null;
        doJoinBtn.disabled = true;
        net.joinRoom(wsUrl(), code, username, appearance)
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

  // ── Session helpers ────────────────────────────────────────

  function getLocalAppearance() {
    return window.ScratchbonesAccount?.getAppearance() ?? null;
  }

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

    // All human seats share the local player's appearance in local/hot-seat modes
    const ap = getLocalAppearance();
    const playerAppearances = {};
    for (const seat of humanSeats) playerAppearances[seat] = ap;

    window.SCRATCHBONES_SESSION = { mode, humanSeats, playerNames, playerAppearances };
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

    // Use per-seat appearances collected from player-joined events
    const playerAppearances = { ..._onlineOccupantAppearances };

    window.SCRATCHBONES_SESSION = { mode: 'pvp', humanSeats, playerNames, playerAppearances };
    _postGameMessage = '';
    net.broadcastStart();
    hide();
    if (_scratchbonesReady && window.scratchbonesStartGame) {
      void window.scratchbonesStartGame().catch(e => console.error('[lobby] startOnlineGame error', e));
    }
  }

  function startOnlineClient() {
    hide();
    const acc = window.ScratchbonesAccount;
    const username = acc?.getUsername() || 'Player';
    const ap = getLocalAppearance();
    window.SCRATCHBONES_SESSION = {
      mode: 'online-client',
      humanSeats: [_myOnlineSeat],
      playerNames: { [_myOnlineSeat]: username },
      playerAppearances: { [_myOnlineSeat]: ap },
    };
    if (_scratchbonesReady && window.scratchbonesStartClient) {
      void window.scratchbonesStartClient().catch(e => console.error('[lobby] startOnlineClient error', e));
    }
  }

  function init() {
    window.ScratchbonesAccount?.load();
    // Pre-load portrait cosmetics for preview
    ensurePortraitCosmetics();

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
