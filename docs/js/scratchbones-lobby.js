(function () {
  'use strict';

  const LOBBY_CONFIG = window.SCRATCHBONES_CONFIG?.game?.lobby || {};
  const AI_CONFIG = window.SCRATCHBONES_CONFIG?.game?.ai || {};
  const PVE_SUBMENU_CONFIG = AI_CONFIG.pveSubmenu || {};
  const DEFAULT_MODES = [
    { id: 'pvpve', label: 'PvPvE', desc: 'Online: 1+ Human + AI fill', humanRange: null },
    { id: 'pve',   label: 'PvE',   desc: 'Offline vs AI',              humanRange: null },
    { id: 'pvp',   label: 'PvP',   desc: 'Online: All Human players',  humanRange: [2, 4] },
  ];
  const MODES = Array.isArray(LOBBY_CONFIG.modes) && LOBBY_CONFIG.modes.length
    ? LOBBY_CONFIG.modes
    : DEFAULT_MODES;

  // ── Species UI data ────────────────────────────────────────
  // colorOptions: shared preset list for both A and B selectors.
  // C is auto-derived from A (slightly lighter).
  const BASE_SPECIES_DATA = {
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
          { slot: 'hairBack', label: 'Back Hair', options: [
            { id: null,                                                   label: 'None' },
            { id: 'appearance::Mao-ao_M::mao-ao_splayedknot_medium',     label: 'Splayed Knot' },
            { id: 'appearance::Mao-ao_M::mao-ao_long_ponytail',          label: 'Long Ponytail' },
          ]},
          { slot: 'hairSide', label: 'Side Hair (R)', options: [
            { id: null,                                                     label: 'None' },
            { id: 'appearance::Mao-ao_M::mao-ao_shoulder_length_drape',    label: 'Shoulder Drape' },
            { id: 'appearance::Mao-ao_M::mao-ao_braid-R',                  label: 'Braid (Right)' },
            { id: 'appearance::Mao-ao_M::mao-ao_braidcluster-R',           label: 'Braid Cluster (Right)' },
          ]},
          { slot: 'hairSideL', label: 'Side Hair (L)', options: [
            { id: null,                                                     label: 'None' },
            { id: 'appearance::Mao-ao_M::mao-ao_braid-L',                  label: 'Braid (Left)' },
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
          { label: 'Earth',   h:-70, s:-0.80, v:-0.55 },
          { label: 'Olive',   h:-40, s:-0.70, v:-0.45 },
          { label: 'Sage',    h:  0, s:-0.70, v:-0.30 },
          { label: 'Seafoam', h: 30, s:-0.60, v:-0.15 },
          { label: 'Ash',     h: 10, s:-0.90, v: 0.25 },
          { label: 'Onyx',    h:  0, s:-0.90, v:-0.85 },
          { label: 'Brown',   h:-113, s:-0.45, v:-0.45 },
          { label: 'Rust',    h:-143, s:-0.40, v:-0.40 },
          { label: 'Amber',   h:-113, s:-0.35, v:-0.25 },
          { label: 'Ochre',   h: -83, s:-0.45, v:-0.20 },
          { label: 'Lichen',  h: -23, s:-0.55, v:-0.25 },
          { label: 'Slate',   h:  77, s:-0.75, v:-0.20 },
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
          { slot: 'hairSide', label: 'Side Hair (R)', options: [
            { id: null,                                                     label: 'None' },
            { id: 'appearance::Mao-ao_F::mao-ao_shoulder_length_drape',    label: 'Shoulder Drape' },
            { id: 'appearance::Mao-ao_F::mao-ao_braid-R',                  label: 'Braid (Right)' },
            { id: 'appearance::Mao-ao_F::mao-ao_braidcluster-R',           label: 'Braid Cluster (Right)' },
          ]},
          { slot: 'hairSideL', label: 'Side Hair (L)', options: [
            { id: null,                                                     label: 'None' },
            { id: 'appearance::Mao-ao_F::mao-ao_braid-L',                  label: 'Braid (Left)' },
          ]},
          { slot: 'eyes', label: 'Eyes', options: [
            { id: null,                                              label: 'Default' },
            { id: 'appearance::Mao-ao_F::mao-ao_circled_eyes',      label: 'Circled Eyes' },
            { id: 'appearance::Mao-ao_F::mao-ao_circled_eyes_f',    label: 'Circled Eyes F' },
            { id: 'appearance::Mao-ao_F::mao-ao_circled_eye_L',     label: 'Circled Eye (L)' },
          ]},
        ],
        colorOptions: [
          { label: 'Earth',   h:-70, s:-0.80, v:-0.55 },
          { label: 'Olive',   h:-40, s:-0.70, v:-0.45 },
          { label: 'Sage',    h:  0, s:-0.70, v:-0.30 },
          { label: 'Seafoam', h: 30, s:-0.60, v:-0.15 },
          { label: 'Ash',     h: 10, s:-0.90, v: 0.25 },
          { label: 'Onyx',    h:  0, s:-0.90, v:-0.85 },
          { label: 'Brown',   h:-113, s:-0.45, v:-0.45 },
          { label: 'Rust',    h:-143, s:-0.40, v:-0.40 },
          { label: 'Amber',   h:-113, s:-0.35, v:-0.25 },
          { label: 'Ochre',   h: -83, s:-0.45, v:-0.20 },
          { label: 'Lichen',  h: -23, s:-0.55, v:-0.25 },
          { label: 'Slate',   h:  77, s:-0.75, v:-0.20 },
        ],
      },
    },
    'tletingan': {
      label: 'Tletingan', genders: ['male'], swatchBase: '#7dc89a',
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
          { slot: 'hairSide', label: 'Side Hair (R)', options: [
            { id: null, label: 'None' },
            { id: 'appearance::Tletingan_M::tl_braid-R',              label: 'Braid (Right)' },
            { id: 'appearance::Tletingan_M::tl_braidcluster-R',       label: 'Braid Cluster (Right)' },
          ]},
          { slot: 'hairSideL', label: 'Side Hair (L)', options: [
            { id: null, label: 'None' },
            { id: 'appearance::Tletingan_M::tl_braid-L',              label: 'Braid (Left)' },
          ]},
          { slot: 'facialHair', label: 'Facial Hair', options: [
            { id: null,                                                label: 'None' },
            { id: 'appearance::Tletingan_M::tl_wildbeard',            label: 'Wild Beard' },
          ]},
        ],
        colorOptions: [
          { label: 'Umber',  h:-85, s:-0.30, v:-0.40 },
          { label: 'Khaki',  h:-60, s:-0.20, v:-0.35 },
          { label: 'Olive',  h:-40, s:-0.10, v:-0.30 },
          { label: 'Forest', h:-20, s: 0.00, v:-0.20 },
          { label: 'Fern',   h:  0, s: 0.10, v:-0.15 },
          { label: 'Ash',    h:-80, s:-0.40, v:-0.45 },
          { label: 'Brown',  h:-113, s:-0.30, v:-0.42 },
          { label: 'Rust',   h:-143, s:-0.20, v:-0.35 },
          { label: 'Amber',  h:-113, s:-0.20, v:-0.28 },
          { label: 'Ochre',  h: -83, s:-0.35, v:-0.20 },
          { label: 'Lichen', h: -23, s:-0.45, v:-0.25 },
          { label: 'Slate',  h:  77, s:-0.60, v:-0.22 },
        ],
      },
    },
    'kenkari': {
      label: 'Kenkari', genders: ['male', 'female'], swatchBase: '#7dc89a',
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
          { slot: 'hairSide', label: 'Side Hair (R)', options: [
            { id: null, label: 'None' },
            { id: 'appearance::Kenkari_M::kenk_braid-R_m',            label: 'Braid (Right)' },
            { id: 'appearance::Kenkari_M::kenk_braidcluster-R_m',     label: 'Braid Cluster (Right)' },
          ]},
          { slot: 'hairSideL', label: 'Side Hair (L)', options: [
            { id: null, label: 'None' },
            { id: 'appearance::Kenkari_M::kenk_braid-L_m',            label: 'Braid (Left)' },
          ]},
          { slot: 'facialHair', label: 'Facial Hair', options: [
            { id: null,                                                  label: 'None' },
            { id: 'appearance::Kenkari_M::kenk_wildbeard',              label: 'Wild Beard' },
          ]},
        ],
        colorOptions: [
          { label: 'Jade',        h: -20, s:0.80, v: 0.00 },
          { label: 'Lime',        h: -80, s:0.90, v: 0.00 },
          { label: 'Teal',        h:  40, s:1.00, v: 0.10 },
          { label: 'Amethyst',    h: 120, s:0.90, v: 0.00 },
          { label: 'Fuchsia',     h: 160, s:0.80, v:-0.10 },
          { label: 'Ember',       h:-120, s:0.80, v:-0.10 },
          { label: 'Chartreuse',  h: -40, s:0.70, v: 0.10 },
          { label: 'Azure',       h:  60, s:0.90, v: 0.10 },
          { label: 'Red',         h:-143, s:1.00, v: 0.00 },
          { label: 'Orange',      h:-113, s:1.00, v: 0.10 },
          { label: 'Yellow',      h: -83, s:1.20, v: 0.25 },
          { label: 'Green',       h: -23, s:1.00, v: 0.05 },
          { label: 'Blue',        h:  77, s:1.00, v: 0.00 },
          { label: 'Brown',       h:-113, s: 0.10, v:-0.38 },
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
          { slot: 'hairSide', label: 'Side Hair (R)', options: [
            { id: null, label: 'None' },
            { id: 'appearance::Kenkari_F::kenk_braid-R_f',            label: 'Braid (Right)' },
            { id: 'appearance::Kenkari_F::kenk_braidcluster-R_f',     label: 'Braid Cluster (Right)' },
          ]},
          { slot: 'hairSideL', label: 'Side Hair (L)', options: [
            { id: null, label: 'None' },
            { id: 'appearance::Kenkari_F::kenk_braid-L_f',            label: 'Braid (Left)' },
          ]},
        ],
        colorOptions: [
          { label: 'Ember',       h: -115, s: 0.20, v: 0.05 },
          { label: 'Copper',      h: -105, s: 0.25, v: 0.10 },
          { label: 'Gold',        h: -92,  s: 0.40, v: 0.15 },
          { label: 'Honey',       h: -80,  s: 0.45, v: 0.20 },
          { label: 'Yellow',      h: -75,  s: 0.50, v: 0.20 },
          { label: 'Saffron',     h: -65,  s: 0.52, v: 0.15 },
          { label: 'Chartreuse',  h: -53,  s: 0.58, v: 0.05 },
          { label: 'Lime',        h: -42,  s: 0.62, v: 0.00 },
          { label: 'Spring',      h: -32,  s: 0.68, v: 0.05 },
          { label: 'Umber',       h: -100, s: -0.30, v: -0.40 },
          { label: 'Ochre',       h: -80,  s: -0.20, v: -0.25 },
          { label: 'Straw',       h: -65,  s: -0.10, v: -0.15 },
        ],
      },
    },
  };

  const CONFIG_SPECIES_DATA = window.SCRATCHBONES_CONFIG?.game?.appearanceEditor?.species || {};
  const CONFIG_SPECIES_AVAILABILITY = window.SCRATCHBONES_CONFIG?.game?.appearanceEditor?.availability || {};

  function normalizeSpeciesKey(speciesId) {
    return String(speciesId || '').trim().toLowerCase().replace(/_/g, '-');
  }

  function withConfiguredSpeciesAvailability(speciesData) {
    const result = { ...speciesData };
    for (const [speciesId, availability] of Object.entries(CONFIG_SPECIES_AVAILABILITY)) {
      const key = normalizeSpeciesKey(speciesId);
      const existing = result[key] || result[speciesId];
      if (!existing || !Array.isArray(availability?.genders) || !availability.genders.length) continue;
      result[key] = {
        ...existing,
        genders: availability.genders.map(g => String(g).toLowerCase()).filter(Boolean),
      };
    }
    return result;
  }

  const SPECIES_DATA = withConfiguredSpeciesAvailability({ ...BASE_SPECIES_DATA, ...CONFIG_SPECIES_DATA });

  // ── Lobby state ────────────────────────────────────────────
  const NPC_NAMES = ['Rook', 'Sable', 'Grim', 'Vex'];

  let _screen = 'create';
  let _selectedMode = 'pve';
  let _selectedPveMode = String(PVE_SUBMENU_CONFIG.defaultMode || 'regular');
  let _selectedPveMinDifficulty = String(PVE_SUBMENU_CONFIG.defaultMinRank || 'easy');
  let _selectedPveMaxDifficulty = String(PVE_SUBMENU_CONFIG.defaultMaxRank || 'hard');
  let _selectedPlayerCount = 2;
  let _postGameMessage = '';
  let _scratchbonesReady = false;

  // Appearance editor working state
  let _editAppearance = null;   // { speciesId, gender, cosmetics, bodyColors }
  let _editAIdx = 0;            // index into current species/gender colorOptions for A
  let _editBIdx = 0;            // index into current species/gender colorOptions for B
  let _editName = '';           // name field being edited in appearance editor
  let _editNameFormat = 'nickname'; // which name format to display: 'nickname' | 'loreName' | 'combined'
  let _nameSuggestions = [];    // cached name suggestions for the advisor chips (legacy, unused)
  let _loreState = null;        // { sp, births, married } for embedded lore name creator

  // Online state
  let _onlinePlayerCount = 2;
  let _roomCode = '';
  let _onlineOccupants = [];        // [{seatId, name}]
  let _onlineOccupantAppearances = {}; // { seatId: appearance }
  let _onlineOccupantLoadouts = {}; // { seatId: [trickId, ...] }
  let _myOnlineSeat = null;
  let _fillWithNpcs = false;        // true when PvPvE mode routes through online flow with NPC fill

  // Portrait preview
  let _lobbyPortraitCosmetics = null;
  let _lobbyPortraitLoading = false;

  // Collections: which slot's dye panel is open (null | 'hat' | 'torso' | 'overwear')
  let _activeDyeSlot = null;
  let _lastMysteryDyeResult = null;

  // ── Helpers ────────────────────────────────────────────────

  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function cap(str) { return String(str).charAt(0).toUpperCase() + String(str).slice(1); }

  function overlay() { return document.getElementById('sb-lobby'); }

  function getPveSubmenuOptions() {
    const configuredOptions = Array.isArray(PVE_SUBMENU_CONFIG.options) ? PVE_SUBMENU_CONFIG.options : [];
    return configuredOptions.length ? configuredOptions : [
      { id: 'regular', label: 'Regular Play', desc: 'Use configured NPC difficulty.' },
      { id: 'difficulty-test', label: 'NPC Difficulty Test', desc: 'Randomize NPC difficulty in the selected range.' },
    ];
  }

  function getDifficultyRankOrder() {
    const configuredOrder = Array.isArray(PVE_SUBMENU_CONFIG.rankOrder) ? PVE_SUBMENU_CONFIG.rankOrder : [];
    const configuredRanks = AI_CONFIG.difficultyRanks && typeof AI_CONFIG.difficultyRanks === 'object'
      ? Object.keys(AI_CONFIG.difficultyRanks)
      : [];
    const merged = [...configuredOrder, ...configuredRanks]
      .map(rank => String(rank || '').trim().toLowerCase())
      .filter(Boolean);
    return [...new Set(merged)];
  }

  function difficultyRankLabel(rank) {
    const display = AI_CONFIG.renownDisplay?.levels?.[rank];
    if (!display) return cap(rank);
    return [display.label, display.title].filter(Boolean).join(AI_CONFIG.renownDisplay?.separator || ' · ');
  }

  function normalizeSelectedPveDifficultyRange() {
    const ranks = getDifficultyRankOrder();
    if (!ranks.length) return [];
    if (!ranks.includes(_selectedPveMinDifficulty)) _selectedPveMinDifficulty = ranks[0];
    if (!ranks.includes(_selectedPveMaxDifficulty)) _selectedPveMaxDifficulty = ranks[ranks.length - 1];
    let minIndex = ranks.indexOf(_selectedPveMinDifficulty);
    let maxIndex = ranks.indexOf(_selectedPveMaxDifficulty);
    if (minIndex > maxIndex) {
      const swap = minIndex;
      minIndex = maxIndex;
      maxIndex = swap;
      _selectedPveMinDifficulty = ranks[minIndex];
      _selectedPveMaxDifficulty = ranks[maxIndex];
    }
    return ranks.slice(minIndex, maxIndex + 1);
  }

  function randomPveDifficultyRank() {
    const ranks = normalizeSelectedPveDifficultyRange();
    if (!ranks.length) return null;
    return ranks[Math.floor(Math.random() * ranks.length)];
  }

  function wsUrl() {
    return (window.SCRATCHBONES_CONFIG && window.SCRATCHBONES_CONFIG.wsUrl)
      || 'ws://localhost:8080';
  }


  function trickBoneLabel(id) {
    const definitions = window.ScratchbonesAccount?.getTrickBoneDefinitions?.() || window.SCRATCHBONES_CONFIG?.game?.trickBones?.definitions || {};
    return definitions[id]?.label || cap(id);
  }

  function renderTrickLoadoutEditor() {
    const acc = window.ScratchbonesAccount;
    const definitions = acc?.getTrickBoneDefinitions?.() || {};
    const unlocked = acc?.getUnlockedTrickBones?.() || [];
    const loadout = acc?.getTrickBoneLoadout?.() || [];
    const slots = loadout.map((id, index) => `
      <div class="sb-field" style="margin-bottom:8px;">
        <label for="sb-trick-slot-${index}">Slot ${index + 1}</label>
        <select id="sb-trick-slot-${index}" data-trick-slot="${index}">
          ${unlocked.map(optionId => `<option value="${esc(optionId)}"${optionId === id ? ' selected' : ''}>${esc(trickBoneLabel(optionId))}</option>`).join('')}
        </select>
      </div>`).join('');
    const unlockedList = unlocked.map(id => {
      const def = definitions[id] || {};
      return `<li><strong>${esc(trickBoneLabel(id))}</strong>${def.wild ? ' · Wild' : ''}${def.description ? `<br><span class="sb-muted">${esc(def.description)}</span>` : ''}</li>`;
    }).join('');
    return `
      <div class="sb-card sb-wide-card">
        <div class="sb-header">
          <button class="sb-btn-ghost" id="sb-back-btn">← Back</button>
          <div class="sb-title">Trick Bone Loadout</div>
        </div>
        <div class="sb-muted" style="margin-bottom:10px;">Choose your six trick bones. Duplicates are allowed; your loadout is shuffled into the shared deck before play.</div>
        ${slots || '<div class="sb-muted">No trick bones unlocked.</div>'}
        <div class="sb-label" style="margin-top:10px;">Unlocked Trick Bones</div>
        <ul style="margin:6px 0 0 18px;padding:0;">${unlockedList}</ul>
      </div>`;
  }

  function swatchStyle(base, h, s, v) {
    const hueOffset   = (window.SCRATCHBONES_CONFIG?.clothingHueOffset)   ?? 0;
    const satOffset   = (window.SCRATCHBONES_CONFIG?.clothingSatOffset)   ?? 0;
    const lightOffset = (window.SCRATCHBONES_CONFIG?.clothingLightOffset) ?? 0;
    const sat = Math.max(0, 1 + (Number(s) || 0) + satOffset).toFixed(3);
    const bri = Math.max(0, 1 + (Number(v) || 0) + lightOffset).toFixed(3);
    const finalH = (Number(h) || 0) + hueOffset;
    return `background:${base};filter:hue-rotate(${finalH}deg) saturate(${sat}) brightness(${bri})`;
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

  function defaultCosmeticsFor(speciesId, gender) {
    const genderData = SPECIES_DATA[speciesId]?.[gender];
    if (!genderData) return {};
    const cosmetics = { ...(genderData.defaultCosmetics || {}) };
    for (const slotDef of genderData.slots || []) {
      if (cosmetics[slotDef.slot] !== undefined) continue;
      const hasNoneOption = (slotDef.options || []).some(option => option.id == null || option.id === '');
      if (!hasNoneOption && slotDef.options?.[0]?.id) cosmetics[slotDef.slot] = slotDef.options[0].id;
    }
    return cosmetics;
  }

  // ── Lore name creator (embedded) ──────────────────────────

  function _advisorSp(speciesId) {
    return window.SCRATCHBONES_NAME_ADVISOR?.lobbySpeciesToAdvisorKey(speciesId, SPECIES_DATA) || 'mao';
  }

  function _loreCtx() {
    if (!_loreState) return { gender: 'male', married: false, births: {} };
    return { gender: _editAppearance?.gender || 'male', married: !!_loreState.married, births: _loreState.births || {} };
  }

  function _initLoreState(speciesId, gender) {
    const sp = _advisorSp(speciesId);
    if (_loreState && _loreState.sp === sp) return;
    _loreState = { sp, births: {}, married: false };
  }

  function refreshNameSuggestions() { /* no-op, kept for compat */ }

  function _buildDisplayNamePreview() {
    if (!_editAppearance || !_loreState) return '';
    const adv = window.SCRATCHBONES_NAME_ADVISOR;
    const nickname = _editName || 'Nickname';
    const sp = _loreState.sp;
    const births = _loreState.births || {};
    const ctx = _loreCtx();
    let preview = '';
    let warning = '';
    if (_editNameFormat === 'nickname') {
      preview = nickname;
    } else if (adv) {
      const { first, conn, second } = adv.birthNameParts(sp, births, ctx);
      if (_editNameFormat === 'loreName') {
        preview = [first, conn, second].filter(Boolean).join(' ') || '';
        if (!preview) warning = 'Set a lore name below first.';
      } else if (_editNameFormat === 'combined') {
        const parts = [first, `"${nickname}"`, conn, second].filter(Boolean);
        preview = parts.join(' ');
        if (!first && !second) warning = 'Set a lore name below first.';
        else if (!second) warning = 'Surname/second slot is empty — only first name will show.';
      }
    }
    const previewHtml = preview
      ? `<span style="font-style:italic;opacity:0.85;">${esc(preview)}</span>`
      : `<span style="opacity:0.4;">—</span>`;
    const warnHtml = warning
      ? `<div style="font-size:0.72em;color:rgba(242,180,80,0.75);margin-top:2px;">${esc(warning)}</div>`
      : '';
    return `<div style="margin-top:4px;margin-bottom:2px;font-size:0.82em;padding:4px 6px;background:rgba(242,208,143,0.06);border-radius:5px;border:1px solid rgba(200,153,82,0.2);">${previewHtml}${warnHtml}</div>`;
  }

  function _buildLorePreviewHtml(sp, births, ctx) {
    const adv = window.SCRATCHBONES_NAME_ADVISOR;
    if (!adv) return '';
    const { first, conn, second } = adv.birthNameParts(sp, births, ctx);
    const faint = s => `<span class="nd-faint">${adv.esc(s)}</span>`;
    const connHtml = conn ? `<span class="nd-conn">${adv.esc(conn)}</span>` : '';
    const parts = [];
    parts.push(first ? adv.esc(first) : faint('—'));
    if (connHtml) parts.push(connHtml);
    parts.push(second ? adv.esc(second) : faint('—'));
    return parts.join(' ');
  }

  // Engh-sho slot-specific placeholders
  function _slotPlaceholder(sp, slot) {
    if (sp === 'engh' && slot === 'first')   return 'small handheld object';
    if (sp === 'engh' && slot === 'surname') return 'clan name';
    return window.SCRATCHBONES_NAME_ADVISOR?.slotLabel(sp, slot) || slot;
  }

  function _buildTankanPillars(sp, births, ctx) {
    const adv = window.SCRATCHBONES_NAME_ADVISOR;
    if (!adv) return '';
    const { first, conn, second } = adv.birthNameParts(sp, births, ctx);
    const words = [first, conn, second].filter(Boolean);
    if (!words.length) return '';
    const pillars = words.map(w =>
      `<span style="writing-mode:vertical-rl;text-orientation:mixed;font-family:'TankanScript','KhymeryyanRomanLetters+Numbers',sans-serif;font-size:0.55em;line-height:1;color:rgba(242,208,143,0.45);letter-spacing:0.05em;display:inline-block;">${adv.esc(w)}</span>`
    ).join('');
    return `<div style="display:flex;gap:4px;align-items:flex-start;justify-content:center;margin-top:4px;">${pillars}</div>`;
  }

  function _buildLoreSectionHtml() {
    const adv = window.SCRATCHBONES_NAME_ADVISOR;
    if (!adv || !_loreState || !_editAppearance) return '';
    const sp = _loreState.sp;
    const births = _loreState.births || {};
    const ctx = _loreCtx();
    const species = adv.getSpecies();
    const slots = species[sp]?.slots || ['first', 'surname'];
    const previewHtml = _buildLorePreviewHtml(sp, births, ctx);
    const tankanHtml = _buildTankanPillars(sp, births, ctx);

    let marriedRow = '';
    if (sp === 'mao' && ctx.gender === 'female') {
      marriedRow = `<div class="sb-lore-married-row">
        <label style="display:flex;align-items:center;gap:5px;cursor:pointer;">
          <input type="checkbox" id="sb-lore-married" ${_loreState.married ? 'checked' : ''} style="accent-color:#c89952;"/>
          <span>Married</span>
        </label>
      </div>`;
    }

    const slotsHtml = slots.map(slot => {
      const val = births[slot] || '';
      const label = adv.slotLabel(sp, slot);
      const placeholder = _slotPlaceholder(sp, slot);

      if (sp === 'slagothim' && slot === 'surname') {
        const current = val.replace(/^tley\s*/i, '') || species.slagothim.locations[0];
        const btns = species.slagothim.locations.map(loc =>
          `<button class="sb-lore-place-btn${current === loc ? ' active' : ''}" data-lore-place="${adv.esc(loc)}">${adv.esc(loc)}-Doro</button>`
        ).join('');
        return `<div class="sb-lore-slot">
          <div class="sb-cosmetic-label" style="text-align:left;min-width:0;margin-bottom:4px;letter-spacing:0.07em;">${adv.esc(label)}</div>
          <div class="sb-lore-place-grid">${btns}</div>
        </div>`;
      }

      const { html: valHtml, msgs } = adv.validateSlot(sp, slot, val, ctx);
      const msgsHtml = `<div class="sb-lore-msgs">${adv.esc(msgs[0] || '')}</div>`;
      const opts = val ? adv.makeIdeaOptions(sp, slot, val, ctx) : [];
      const suggHtml = `<div class="sb-lore-suggs">${
        opts.map((o, i) => `<button class="sb-lore-sugg" data-lore-slot="${adv.esc(slot)}" data-lore-idx="${i}">${adv.esc(o.label)}</button>`).join('')
      }</div>`;

      return `<div class="sb-lore-slot">
        <div class="sb-cosmetic-label" style="text-align:left;min-width:0;margin-bottom:4px;letter-spacing:0.07em;">${adv.esc(label)}</div>
        <div class="sb-lore-input-row">
          <input class="sb-lore-input" id="sb-lore-${adv.esc(slot)}" type="text" value="${adv.esc(val)}"
                 data-lore-slot="${adv.esc(slot)}" autocomplete="off" spellcheck="false" placeholder="${adv.esc(placeholder)}" />
          <button class="sb-lore-apply" data-lore-slot="${adv.esc(slot)}"${msgs.length > 0 ? ' disabled' : ''}>✓</button>
        </div>
        <div class="sb-lore-val">${valHtml || ''}</div>
        ${msgsHtml}
        ${suggHtml}
      </div>`;
    }).join('');

    return `<div class="sb-lore-section">
      <div class="sb-label" style="margin-bottom:6px;">Lore Name
        <span style="font-size:0.72em;font-weight:400;opacity:0.5;text-transform:none;letter-spacing:0;margin-left:6px;">(${adv.esc(species[sp]?.label || sp)})</span>
      </div>
      <div class="sb-lore-preview" id="sb-lore-preview">${previewHtml || '<span class="nd-faint">—</span>'}</div>
      ${tankanHtml ? `<div id="sb-lore-tankan">${tankanHtml}</div>` : ''}
      ${marriedRow}
      ${slotsHtml}
      <div class="sb-lore-actions">
        <button id="sb-lore-random-btn" style="font-size:0.75em;padding:3px 10px;border:1px solid rgba(200,153,82,0.35);border-radius:5px;background:rgba(242,208,143,0.06);color:rgba(242,208,143,0.7);cursor:pointer;font-family:inherit;letter-spacing:0.08em;">↺ Random</button>
        <button id="sb-lore-copy-btn" style="font-size:0.75em;padding:3px 10px;border:1px solid rgba(200,153,82,0.35);border-radius:5px;background:rgba(242,208,143,0.06);color:rgba(242,208,143,0.7);cursor:pointer;font-family:inherit;letter-spacing:0.08em;">Copy Name</button>
      </div>
    </div>`;
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
    const { optionCache, hairFrontOptions, hairBackOptions, hairSideOptions, hairSideLOptions, eyesOptions, upperFaceOptions, facialHairOptions,
            hatOptions, hoodOptions, torsoPortraitOptions, armPortraitOptions, bodyColorRangesByGender,
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
      hairSideOptions, hairSideLOptions, eyesOptions, upperFaceOptions, facialHairOptions, bodyColorRangesByGender,
      allowedCosmeticsByFighter, hatOptions, hoodOptions, cosmeticWeightsByFighter, torsoPortraitOptions,
      armPortraitOptions, forcedCosmeticsByFighter, conditionalCosmeticsByFighter);
    if (!profile) return null;

    // Apply saved cosmetics (skip forced slots)
    const lookup = id => id ? (optionCache?.get(id) ?? null) : null;
    if (savedCosmetics) {
      if (savedCosmetics.hairFront  !== undefined && !forcedSlots.has('hairFront'))  profile.hairFront  = lookup(savedCosmetics.hairFront);
      if (savedCosmetics.hairBack   !== undefined && !forcedSlots.has('hairBack'))   profile.hairBack   = lookup(savedCosmetics.hairBack);
      if (savedCosmetics.hairSide   !== undefined && !forcedSlots.has('hairSide'))   profile.hairSide   = lookup(savedCosmetics.hairSide);
      if (savedCosmetics.hairSideL  !== undefined && !forcedSlots.has('hairSideL'))  profile.hairSideL  = lookup(savedCosmetics.hairSideL);
      if (savedCosmetics.eyes       !== undefined && !forcedSlots.has('eyes'))       profile.eyes       = lookup(savedCosmetics.eyes);
      if (savedCosmetics.upperFace  !== undefined && !forcedSlots.has('upperFace'))  profile.upperFace  = lookup(savedCosmetics.upperFace);
      if (savedCosmetics.facialHair !== undefined && !forcedSlots.has('facialHair')) profile.facialHair = lookup(savedCosmetics.facialHair);
    }
    if (bodyColors) profile.bodyColors = { ...(profile.bodyColors || {}), ...bodyColors };

    // Apply equipped shop items and dyes
    const acc = window.ScratchbonesAccount;
    if (acc) {
      const none = { id: 'none', tintSlot: null, layers: [] };
      const equippedFromAppearance = Array.isArray(appearance?.equippedCosmetics) ? appearance.equippedCosmetics : null;
      const appliedDyesFromAppearance = appearance && Object.prototype.hasOwnProperty.call(appearance, 'appliedDyes')
        ? (appearance.appliedDyes || {})
        : null;
      const resolveVariantId = (category, equippedId) => {
        if (!equippedId) return null;
        const shopCatalog = acc.getShopCatalog ? acc.getShopCatalog() : [];
        const base = shopCatalog.find(i => i.id === equippedId);
        if (!base) return equippedId;
        const candidates = shopCatalog.filter(i =>
          i.category === category &&
          i.label === base.label &&
          (i.material || null) === (base.material || null) &&
          i.species === speciesId &&
          (!i.gender || i.gender === gender)
        );
        const ids = [equippedId, ...candidates.map(i => i.id)];
        return ids.find(id => optionCache?.has(id)) ?? equippedId;
      };
      const applyEquip = (cat, key, noneOpt) => {
        let id = null;
        if (equippedFromAppearance) {
          const shopCatalog = acc.getShopCatalog ? acc.getShopCatalog() : [];
          id = shopCatalog.find(i => i.category === cat && equippedFromAppearance.includes(i.id))?.id ?? null;
        } else {
          id = acc.getEquippedForCategory(cat);
        }
        const resolvedId = resolveVariantId(cat, id);
        profile[key] = (resolvedId && optionCache?.has(resolvedId)) ? optionCache.get(resolvedId) : (noneOpt ?? none);
      };
      applyEquip('hat', 'hat', hatOptions[0]);
      applyEquip('hood', 'hood', hoodOptions[0]);
      applyEquip('torso', 'torsoCosmetic', torsoPortraitOptions[0]);
      applyEquip('overwear', 'armCosmetic', armPortraitOptions[0]);
      const collaredTag = window.SCRATCHBONES_CONFIG?.game?.portrait?.cosmetics?.collaredTag || 'collared';
      const collarLockedFacialHairIds = window.SCRATCHBONES_CONFIG?.game?.portrait?.cosmetics?.collarLockedFacialHairIds
        || window.SCRATCHBONES_CONFIG?.game?.portrait?.cosmetics?.shirtbeardIds
        || ['kenk_shirtbeard', 'kenk_shirtbeard_f'];
      const hasCollaredClothing = [profile.torsoCosmetic, profile.armCosmetic].some(c => c?.tags?.includes(collaredTag));
      if (!hasCollaredClothing && collarLockedFacialHairIds.includes(profile.facialHair?.id)) {
        profile.facialHair = optionCache?.get('none') || { id: 'none', label: 'No Facial Hair', tintSlot: null, layers: [] };
      }
      const defaultTintColors = window.SCRATCHBONES_CONFIG?.game?.portrait?.cosmetics?.defaultTintColors || {};
      for (const option of [profile.upperFace]) {
        const defaults = option?.id ? defaultTintColors[option.id] : null;
        if (!defaults) continue;
        for (const [tintKey, color] of Object.entries(defaults)) {
          profile.bodyColors = { ...(profile.bodyColors || {}), [tintKey]: { ...color } };
        }
      }
      // Apply clothing/accessory dyes (keys are tintSlot names: HAT, UPPER_FACE, TORSO, CLOTH, ...)
      const dyeIds = appliedDyesFromAppearance ?? (acc.getAppliedDyes ? acc.getAppliedDyes() : {});
      const catalog = acc.getDyeCatalog ? acc.getDyeCatalog() : [];
      for (const [tintKey, dyeId] of Object.entries(dyeIds)) {
        if (dyeId) {
          const dye = catalog.find(d => d.id === dyeId);
          if (dye) profile.bodyColors = { ...(profile.bodyColors || {}), [tintKey]: { ...dye.color } };
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
        <div class="sb-subtitle">Create your Khymeryyan to begin</div>
        <div class="sb-field">
          <label for="sb-name">Your Name</label>
          <input id="sb-name" type="text" maxlength="24" placeholder="Enter name…" autocomplete="off" spellcheck="false" />
        </div>
        <div class="sb-actions">
          <button class="sb-btn-primary" id="sb-create-btn">Create Khymeryyan</button>
        </div>
      </div>`;
  }

  function _getBossEncounterConfig(bossLevel) {
    const encounters = window.SCRATCHBONES_CONFIG?.game?.ai?.bossEncounters || [];
    return encounters[bossLevel - 1] || encounters[encounters.length - 1] || null;
  }

  function renderMain() {
    const acc = window.ScratchbonesAccount;
    const bronze = acc ? acc.getBronze() : 0;
    const activeKhymeryyan = acc?.getActiveKhymeryyan?.() || null;
    const username = acc ? (acc.getDisplayName?.() || acc.getUsername()) : 'Player';
    const renown = acc?.getRenown?.() || 0;
    const atCap = acc?.isAtRenownCap?.() || false;
    const bossLevel = acc?.getBossLevel?.() || 0;
    const bossCfg = atCap ? _getBossEncounterConfig(bossLevel) : null;
    const khymeryyans = acc?.getKhymeryyans?.() || [];
    const canDeleteKhymeryyan = khymeryyans.length > 1;
    const khymeryyanOptions = khymeryyans.map(kh =>
      `<option value="${esc(kh.id)}"${kh.id === activeKhymeryyan?.id ? ' selected' : ''}>${esc(kh.name)}</option>`
    ).join('');
    const canEarnPassive = acc && bronze < acc.BRONZE_PASSIVE_MAX;

    const modeButtons = MODES.map(m => `
      <button class="sb-mode-btn${_selectedMode === m.id ? ' selected' : ''}" data-mode="${m.id}">
        <span class="sb-mode-label">${m.label}</span>
        <span class="sb-mode-desc">${esc(m.desc)}</span>
      </button>`).join('');

    const pveSubmenu = _selectedMode === 'pve' ? (() => {
      normalizeSelectedPveDifficultyRange();
      const options = getPveSubmenuOptions();
      const ranks = getDifficultyRankOrder();
      const rankOptions = ranks.map(rank =>
        `<option value="${esc(rank)}">${esc(difficultyRankLabel(rank))}</option>`
      ).join('');
      const rangePicker = _selectedPveMode === 'difficulty-test' ? `
        <div class="sb-player-row" style="margin-top:6px;gap:8px;align-items:center;">
          <span>${esc(PVE_SUBMENU_CONFIG.rangeLabel || 'Random difficulty range:')}</span>
          <select id="sb-pve-min-difficulty" style="flex:1;min-width:0;">
            ${rankOptions.replace(`value="${esc(_selectedPveMinDifficulty)}"`, `value="${esc(_selectedPveMinDifficulty)}" selected`)}
          </select>
          <span>${esc(PVE_SUBMENU_CONFIG.rangeSeparator || 'to')}</span>
          <select id="sb-pve-max-difficulty" style="flex:1;min-width:0;">
            ${rankOptions.replace(`value="${esc(_selectedPveMaxDifficulty)}"`, `value="${esc(_selectedPveMaxDifficulty)}" selected`)}
          </select>
        </div>` : '';
      return `
        <div class="sb-pve-submenu" style="margin:8px 0 10px 12px;padding:10px;border:1px solid rgba(242,208,143,0.22);border-radius:12px;background:rgba(22,16,14,0.34);">
          <div class="sb-label" style="margin-top:0;">${esc(PVE_SUBMENU_CONFIG.label || 'PvE Options')}</div>
          <div class="sb-mode-picker">
            ${options.map(option => `
              <button class="sb-mode-btn${_selectedPveMode === option.id ? ' selected' : ''}" data-pve-mode="${esc(option.id)}">
                <span class="sb-mode-label">${esc(option.label)}</span>
                <span class="sb-mode-desc">${esc(option.desc)}</span>
              </button>`).join('')}
          </div>
          ${rangePicker}
        </div>`;
    })() : '';

    const playerPicker = _selectedMode === 'pvp' ? `
      <div class="sb-player-row">
        <span>Human players:</span>
        <div class="sb-count-group">
          ${[2, 3, 4].map(n =>
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
        <div style="display:flex;align-items:center;gap:10px;margin:4px 0 6px;font-size:0.82em;opacity:0.8;">
          <span>Renown ${renown}</span>
          ${atCap ? `<span style="color:rgba(242,180,80,0.9);font-weight:600;">— Cap reached</span>` : ''}
        </div>
        ${atCap ? `<button class="sb-btn-primary" id="sb-boss-btn" style="width:100%;margin-bottom:10px;">⚔ Boss Challenge${bossCfg ? ` — ${esc(bossCfg.boss.name)}` : ''}</button>` : ''}
        <div class="sb-label">Khymeryyan</div>
        <div class="sb-player-row">
          <select id="sb-khymeryyan-select" style="flex:1;min-width:0;">${khymeryyanOptions}</select>
          <div class="sb-count-group">
            <button class="sb-count-btn" id="sb-new-khymeryyan-btn" title="Create Khymeryyan">New</button>
            <button class="sb-count-btn" id="sb-duplicate-khymeryyan-btn" title="Duplicate active Khymeryyan">Duplicate</button>
            <button class="sb-count-btn${canDeleteKhymeryyan ? '' : ' disabled'}" id="sb-delete-khymeryyan-btn"${canDeleteKhymeryyan ? '' : ' disabled'} title="Delete active Khymeryyan">Delete</button>
          </div>
        </div>
        <div class="sb-label">Game Mode</div>
        <div class="sb-mode-picker">${modeButtons}</div>
        ${pveSubmenu}
        ${playerPicker}
        <div class="sb-actions">
          <button class="sb-btn-ghost" id="sb-appearance-btn">Edit Khymeryyan</button>
          <button class="sb-btn-ghost" id="sb-collections-btn">Collections</button>
          <button class="sb-btn-ghost" id="sb-trick-loadout-btn">Trick Loadout</button>
          <button class="sb-btn-ghost" id="sb-shop-btn">Shop</button>
          <button class="sb-btn-ghost" id="sb-online-btn">Play Online</button>
          ${adBtn}
          <button class="sb-btn-ghost" id="sb-tutorial-btn">Tutorial</button>
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

    // Build parent->children map for sub-species
    const subSpeciesMap = {};
    for (const [sid, sd] of Object.entries(SPECIES_DATA)) {
      if (sd.parentSpecies) {
        if (!subSpeciesMap[sd.parentSpecies]) subSpeciesMap[sd.parentSpecies] = [];
        subSpeciesMap[sd.parentSpecies].push(sid);
      }
    }
    const effectiveParentId = SPECIES_DATA[speciesId]?.parentSpecies || speciesId;

    // Species picker (exclude sub-species from top-level buttons)
    const speciesBtns = Object.entries(SPECIES_DATA)
      .filter(([sid, sd]) => !sd.parentSpecies)
      .map(([sid, sd]) =>
        `<button class="sb-sel-btn${effectiveParentId === sid ? ' selected' : ''}" data-species="${sid}">${esc(sd.label)}</button>`
      ).join('');

    // Sub-species toggle (shown below species picker when the parent has variants)
    const subSpeciesIds = subSpeciesMap[effectiveParentId] || [];
    const subSpeciesHtml = subSpeciesIds.length
      ? `<div class="sb-label" style="margin-top:4px;">Variant</div><div class="sb-sel-group">${
          subSpeciesIds.map(childId => {
            const childData = SPECIES_DATA[childId];
            const isActive = speciesId === childId;
            return `<button class="sb-sel-btn sb-subspecies-btn${isActive ? ' selected' : ''}" data-subspecies="${childId}" data-parent-species="${effectiveParentId}">${esc(childData?.label || childId)}</button>`;
          }).join('')
        }</div>`
      : '';

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
          <div class="sb-title">Khymeryyan</div>
          <div class="sb-bronze"><span class="sb-coin">🪙</span>${bronze}&nbsp;Bronze</div>
        </div>
        <div class="sb-ap-layout">
          <div class="sb-ap-preview">
            <canvas id="sb-ap-canvas" width="200" height="200" class="sb-portrait-canvas"></canvas>
          </div>
          <div class="sb-ap-controls">
            <div class="sb-label">Nickname</div>
            <div class="sb-field">
              <input id="sb-edit-name" type="text" maxlength="48" value="${esc(_editName || '')}"
                     autocomplete="off" spellcheck="false" style="width:100%;box-sizing:border-box;" />
            </div>
            <div class="sb-label" style="margin-top:6px;">Display Name</div>
            <div class="sb-sel-group">
              <button class="sb-sel-btn${_editNameFormat === 'nickname' ? ' selected' : ''}" data-name-format="nickname">Nickname</button>
              <button class="sb-sel-btn${_editNameFormat === 'loreName' ? ' selected' : ''}" data-name-format="loreName">Lore Name</button>
              <button class="sb-sel-btn${_editNameFormat === 'combined' ? ' selected' : ''}" data-name-format="combined">First "Nick" Last</button>
            </div>
            ${_buildDisplayNamePreview()}
            ${_buildLoreSectionHtml()}
            <div class="sb-label" style="margin-top:8px;">Species</div>
            <div class="sb-sel-group">${speciesBtns}</div>
            ${subSpeciesHtml}
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
          <button class="sb-btn-ghost" id="sb-export-khymeryyan-btn" title="Copy Khymeryyan JSON to clipboard">Export JSON</button>
        </div>
      </div>`;
  }

  function renderCollections() {
    const acc = window.ScratchbonesAccount;
    const fullCatalog = acc ? acc.getShopCatalog() : [];
    const dyes = acc ? acc.getDyeCatalog() : [];
    const dyeCategories = acc?.getDyeCategories ? acc.getDyeCategories() : [];
    const appliedDyes = acc ? acc.getAppliedDyes() : {};

    // tintKeys: A = primary clothing tintSlot, B/C = future sub-channels
    const CLOTHING_SLOTS = [
      { key: 'hat',      label: 'Hat',      category: 'hat',      tintKeys: ['HAT',   'HAT_B',   'HAT_C'] },
      { key: 'hood',     label: 'Hood',     category: 'hood',     tintKeys: ['HOOD',  'HOOD_B',  'HOOD_C'] },
      { key: 'torso',    label: 'Torso',    category: 'torso',    tintKeys: ['TORSO', 'TORSO_B', 'TORSO_C'] },
      { key: 'overwear', label: 'Overwear', category: 'overwear', tintKeys: ['CLOTH', 'CLOTH_B', 'CLOTH_C'] },
    ];
    const DYE_SWATCH_BASE = window.SCRATCHBONES_CONFIG?.game?.dyes?.swatchBase;

    const ownedDyes = dyes.filter(d => acc && acc.isDyeOwned(d.id));
    const appearance = acc ? acc.getAppearance() : { speciesId: 'mao-ao', gender: 'male', cosmetics: {} };
    const appearanceSlotDefs = window.SCRATCHBONES_CONFIG?.game?.collections?.appearanceSlots || [];
    const genderData = SPECIES_DATA[appearance.speciesId]?.[appearance.gender] || null;
    const appearanceSlots = appearanceSlotDefs
      .filter(slot => !Array.isArray(slot.species) || slot.species.includes(appearance.speciesId))
      .map(slot => ({ ...slot, options: (genderData?.slots || []).find(def => def.slot === slot.slot)?.options || [] }))
      .filter(slot => slot.options.length);
    const entitlementKey = (item) => [item.category || '', item.label || '', item.material || ''].join('::');

    let slotsHtml = '';
    for (const slot of appearanceSlots) {
      const equippedId = appearance.cosmetics?.[slot.slot] || slot.options[0]?.id || '';
      const opts = slot.options.map(item =>
        `<option value="${esc(item.id || '')}"${(item.id || '') === equippedId ? ' selected' : ''}>${esc(item.label)}</option>`
      ).join('');
      const isDyeOpen = _activeDyeSlot === slot.key;
      slotsHtml += `
        <div class="sb-slot-row">
          <span class="sb-slot-label">${esc(slot.label)}</span>
          <select class="sb-cosmetic-select sb-slot-select" data-appearance-slot="${esc(slot.slot)}">${opts}</select>
          <button class="sb-btn-ghost sb-dye-toggle${isDyeOpen ? ' active' : ''}" data-toggle-dye="${esc(slot.key)}">Dye ▾</button>
        </div>`;
      if (isDyeOpen) {
        const tintKeys = slot.tintKeys || [];
        const dyesForSlot = ownedDyes.filter(d => (d.group || 'cloth') === (slot.dyeGroup || 'cloth'));
        const dyeRowHtml = (d) => {
          const color = d.color || { h: 0, s: 0, v: 0 };
          const style = swatchStyle(DYE_SWATCH_BASE, color.h, color.s, color.v);
          return `
            <div class="sb-dye-row">
              <span class="sb-dye-dot" style="${style}"></span>
              <span class="sb-dye-name">${esc(d.label)}</span>
              ${tintKeys.map((key, index) => `<button class="sb-apply-btn${appliedDyes[key] === d.id ? ' applied' : ''}" data-apply-dye="${esc(d.id)}" data-tint-key="${esc(key)}">${['A','B','C'][index] || index + 1}</button>`).join('')}
            </div>`;
        };
        const sortDyes = (list) => [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        const dyeRows = sortDyes(dyesForSlot).map(dyeRowHtml).join('') || '<div class="sb-muted" style="font-size:0.8em;">No dyes owned.</div>';
        const clearBtns = tintKeys.filter(k => appliedDyes[k]).map((k, i) =>
          `<button class="sb-btn-ghost sb-apply-btn" data-clear-channel="${esc(k)}">Clear ${['A','B','C'][i] || i + 1}</button>`
        ).join('');
        slotsHtml += `
          <div class="sb-dye-panel">
            <div class="sb-muted" style="font-size:0.74em;margin-bottom:5px;">Color this upper-face item in Collections.</div>
            ${dyeRows}
            ${clearBtns ? `<div class="sb-dye-clears">${clearBtns}</div>` : ''}
          </div>`;
      }
    }
    for (const slot of CLOTHING_SLOTS) {
      const equippedId = acc ? acc.getEquippedForCategory(slot.category) : null;
      const ownedByCategory = fullCatalog.filter(item => item.category === slot.category && acc && acc.isUnlocked(item.id));
      const ownedMap = new Map();
      for (const item of ownedByCategory) {
        const key = entitlementKey(item);
        const prev = ownedMap.get(key);
        if (!prev) {
          ownedMap.set(key, item);
          continue;
        }
        const score = (x) => (x.species === appearance.speciesId ? 2 : 0) + (x.gender === appearance.gender ? 1 : 0);
        const prevIsEquipped = prev.id === equippedId;
        const itemIsEquipped = item.id === equippedId;
        if ((itemIsEquipped && !prevIsEquipped) || (itemIsEquipped === prevIsEquipped && score(item) > score(prev))) {
          ownedMap.set(key, item);
        }
      }
      const ownedItems = [...ownedMap.values()];
      const equippedItem = fullCatalog.find(c => c.id === equippedId);
      const equippedMaterial = equippedItem?.material || 'cloth';
      const opts = [
        `<option value="">None</option>`,
        ...ownedItems.map(item =>
          `<option value="${esc(item.id)}"${item.id === equippedId ? ' selected' : ''}>${esc(item.label)}</option>`
        ),
      ].join('');
      const slotEmpty = !ownedItems.length && !equippedId;
      const isDyeOpen = _activeDyeSlot === slot.key;
      slotsHtml += `
        <div class="sb-slot-row">
          <span class="sb-slot-label">${esc(slot.label)}</span>
          <select class="sb-cosmetic-select sb-slot-select" data-slot-cat="${slot.category}"${slotEmpty ? ' disabled' : ''}>${opts}</select>
          <button class="sb-btn-ghost sb-dye-toggle${isDyeOpen ? ' active' : ''}" data-toggle-dye="${slot.key}"${slotEmpty ? ' disabled' : ''}>Dye ▾</button>
        </div>`;
      if (isDyeOpen) {
        const [keyA, keyB, keyC] = slot.tintKeys;
        const dyesForSlot = ownedDyes.filter(d => (d.group || 'cloth') === equippedMaterial);
        const dyeRowHtml = (d) => {
          const color = d.color || { h: 0, s: 0, v: 0 };
          const style = swatchStyle(DYE_SWATCH_BASE, color.h, color.s, color.v);
          return `
            <div class="sb-dye-row">
              <span class="sb-dye-dot" style="${style}"></span>
              <span class="sb-dye-name">${esc(d.label)}</span>
              <button class="sb-apply-btn${appliedDyes[keyA] === d.id ? ' applied' : ''}" data-apply-dye="${esc(d.id)}" data-tint-key="${keyA}">A</button>
              <button class="sb-apply-btn${appliedDyes[keyB] === d.id ? ' applied' : ''}" data-apply-dye="${esc(d.id)}" data-tint-key="${keyB}">B</button>
              <button class="sb-apply-btn${appliedDyes[keyC] === d.id ? ' applied' : ''}" data-apply-dye="${esc(d.id)}" data-tint-key="${keyC}">C</button>
            </div>`;
        };
        let dyeRows = '';
        const categoriesById = new Map(dyeCategories.map(category => [category.id, category]));
        const sortDyes = (list) => [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
        if (equippedMaterial === 'cloth' && dyeCategories.length) {
          dyeRows = dyeCategories.map(category => {
            const categoryDyes = sortDyes(dyesForSlot.filter(d => d.dyeCategory === category.id));
            if (!categoryDyes.length) return '';
            return `
              <div class="sb-dye-category" style="margin:7px 0 3px;font-size:0.74em;letter-spacing:0.08em;text-transform:uppercase;color:var(--muted);">${esc(category.label)}</div>
              ${categoryDyes.map(dyeRowHtml).join('')}`;
          }).join('');
          const uncategorizedDyes = sortDyes(dyesForSlot.filter(d => !d.dyeCategory || !categoriesById.has(d.dyeCategory)));
          if (uncategorizedDyes.length) dyeRows += uncategorizedDyes.map(dyeRowHtml).join('');
        } else {
          dyeRows = sortDyes(dyesForSlot).map(dyeRowHtml).join('');
        }
        if (!dyeRows) dyeRows = '<div class="sb-muted" style="font-size:0.8em;">No dyes owned.</div>';
        const clearBtns = slot.tintKeys.filter(k => appliedDyes[k]).map((k, i) =>
          `<button class="sb-btn-ghost sb-apply-btn" data-clear-channel="${k}">Clear ${['A','B','C'][i]}</button>`
        ).join('');
        slotsHtml += `
          <div class="sb-dye-panel">
            <div class="sb-muted" style="font-size:0.74em;margin-bottom:5px;">Color this item — A: primary · B/C: sub-channels (future)</div>
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
            <canvas id="sb-col-canvas" width="200" height="200" class="sb-portrait-canvas"></canvas>
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
    const fullCatalog = acc && acc.getShopCatalog ? acc.getShopCatalog() : [];
    const scopedCatalog = acc ? acc.getShopCatalogForAppearance(appearance.speciesId, appearance.gender) : [];
    const entitlementKey = (item) => [item.category || '', item.label || '', item.material || ''].join('::');
    const dedupedMap = new Map();
    for (const item of scopedCatalog) {
      const key = entitlementKey(item);
      const prev = dedupedMap.get(key);
      if (!prev) {
        dedupedMap.set(key, item);
        continue;
      }
      const score = (x) => (x.species === appearance.speciesId ? 2 : 0) + (x.gender === appearance.gender ? 1 : 0);
      if (score(item) > score(prev)) dedupedMap.set(key, item);
    }
    const catalog = [...dedupedMap.values()];
    const mysteryCatalog = acc?.getMysteryDyeShopCatalog ? acc.getMysteryDyeShopCatalog() : [];
    const categories = [...new Set(catalog.map(c => c.category))];
    const equippedIds = new Set(acc?.getEquippedCosmetics?.() || []);
    const isEquippedGroup = (item) => {
      const key = entitlementKey(item);
      for (const equippedId of equippedIds) {
        const equippedItem = fullCatalog.find(c => c.id === equippedId);
        if (equippedItem && entitlementKey(equippedItem) === key) return true;
      }
      return false;
    };

    let rows = '';
    if (mysteryCatalog.length) {
      rows += `<div class="sb-shop-cat">Mystery Dyes</div>`;
      if (_lastMysteryDyeResult) {
        const cls = _lastMysteryDyeResult.ok ? 'sb-shop-note' : 'sb-error';
        const msg = _lastMysteryDyeResult.ok
          ? `Received ${_lastMysteryDyeResult.dye?.label || _lastMysteryDyeResult.dyeId}!`
          : _lastMysteryDyeResult.error;
        rows += `<div class="${cls}" style="font-size:0.82em;margin:4px 0 8px;">${esc(msg)}</div>`;
      }
      for (const item of mysteryCatalog) {
        const status = acc?.getMysteryDyePoolStatus ? acc.getMysteryDyePoolStatus(item.poolId) : null;
        const remaining = status?.remaining ?? 0;
        const complete = !!status?.complete;
        const can = !complete && bronze >= item.price;
        const btn = complete
          ? `<button class="sb-shop-action equipped" disabled>Complete ✓</button>`
          : `<button class="sb-shop-action buy${can ? '' : ' cant'}" data-action="buy-mystery-dye" data-pool-id="${esc(item.poolId)}"${can ? '' : ' disabled'}><span class="sb-coin">🪙</span>${item.price}</button>`;
        rows += `
          <div class="sb-shop-item">
            <div class="sb-shop-info">
              <div class="sb-shop-name">${esc(item.label)}</div>
              <div class="sb-shop-desc">${esc(item.description)} ${remaining} remaining.</div>
            </div>
            ${btn}
          </div>`;
      }
    }
    for (const cat of categories) {
      rows += `<div class="sb-shop-cat">${cap(cat)}</div>`;
      for (const item of catalog.filter(c => c.category === cat)) {
        const owned = acc && acc.isUnlocked(item.id);
        const equipped = acc && isEquippedGroup(item);
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
            <canvas id="sb-shop-canvas" width="200" height="200" class="sb-portrait-canvas"></canvas>
          </div>
          <div style="flex:1;min-width:0;">
            <div class="sb-shop-note sb-muted" style="font-size:0.8em;padding-bottom:6px;">
              Showing items for ${esc(SPECIES_DATA[appearance.speciesId]?.label || appearance.speciesId)} (${esc(cap(appearance.gender))})
            </div>
            <div class="sb-shop-list" style="max-height:52dvh;display:flex;flex-direction:column;gap:6px;">${rows || '<div class="sb-muted">No items available.</div>'}</div>
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
    const ready = _fillWithNpcs ? have >= 1 : have >= needed;
    const npcSlots = _fillWithNpcs ? needed - have : 0;
    const seats = _onlineOccupants.map(o =>
      `<div class="sb-online-seat">Seat ${o.seatId + 1} · ${esc(o.name)}</div>`
    ).join('');
    const npcNote = npcSlots > 0
      ? `<div class="sb-muted" style="margin-top:4px;">${npcSlots} empty seat${npcSlots > 1 ? 's' : ''} will be filled with NPCs</div>`
      : '';
    return `
      <div class="sb-card">
        <div class="sb-title">Waiting for players…</div>
        <div class="sb-online-code-row">
          <span class="sb-online-label">Room Code</span>
          <strong class="sb-online-code">${esc(_roomCode)}</strong>
        </div>
        <div class="sb-online-seats">${seats || '<div class="sb-muted">No one else has joined yet</div>'}</div>
        <div class="sb-online-hint">${have}/${needed} players connected</div>
        ${npcNote}
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
    else if (_screen === 'trick-loadout')     el.innerHTML = renderTrickLoadoutEditor();
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
    _editName = acc ? (acc.getUsername() || 'Player') : 'Player';
    const saved = acc ? acc.getAppearance() : null;
    const speciesId = saved?.speciesId || 'mao-ao';
    const specData = SPECIES_DATA[speciesId];
    let gender = saved?.gender || 'male';
    // Guard: if saved gender is unavailable for this species (e.g. after a data migration),
    // fall back to the first valid gender so the UI is never left in a disabled+selected state.
    if (specData && !specData.genders.includes(gender)) {
      gender = specData.genders[0];
    }
    _editAppearance = {
      speciesId,
      gender,
      cosmetics: { ...defaultCosmeticsFor(speciesId, gender), ...(saved?.cosmetics || {}) },
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
    _editNameFormat = acc?.getNameFormat?.() || 'nickname';
    const savedLore = acc?.getLoreName?.() || null;
    _initLoreState(speciesId, gender);
    if (savedLore) {
      _loreState.births = { ...savedLore };
      if ('married' in savedLore) _loreState.married = !!savedLore.married;
    }
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
    document.getElementById('sb-boss-btn')?.addEventListener('click', startBossGame);
    document.getElementById('sb-tutorial-btn')?.addEventListener('click', startTutorialGame);
    document.getElementById('sb-appearance-btn')?.addEventListener('click', openAppearanceEditor);
    document.getElementById('sb-collections-btn')?.addEventListener('click', () => { _screen = 'collections'; render(); });
    document.getElementById('sb-trick-loadout-btn')?.addEventListener('click', () => { _screen = 'trick-loadout'; render(); });
    document.getElementById('sb-shop-btn')?.addEventListener('click', () => { _screen = 'shop'; render(); });
    document.getElementById('sb-online-btn')?.addEventListener('click', () => { _fillWithNpcs = false; _screen = 'online'; render(); });
    document.getElementById('sb-ad-btn')?.addEventListener('click', () => {
      window.ScratchbonesAccount?.watchAd(); render();
    });

    document.getElementById('sb-khymeryyan-select')?.addEventListener('change', e => {
      window.ScratchbonesAccount?.setActiveKhymeryyan?.(e.target.value);
      _activeDyeSlot = null;
      render();
    });

    document.getElementById('sb-new-khymeryyan-btn')?.addEventListener('click', () => {
      const acc = window.ScratchbonesAccount;
      if (!acc?.createKhymeryyan) return;
      const defaultName = `Khymeryyan ${(acc.getKhymeryyans?.() || []).length + 1}`;
      const name = (window.prompt?.('Name this Khymeryyan:', defaultName) || '').trim();
      acc.createKhymeryyan(name || defaultName);
      _activeDyeSlot = null;
      render();
    });

    document.getElementById('sb-duplicate-khymeryyan-btn')?.addEventListener('click', () => {
      const acc = window.ScratchbonesAccount;
      const active = acc?.getActiveKhymeryyan?.();
      if (!acc?.createKhymeryyan || !active) return;
      const defaultName = `${active.name || 'Khymeryyan'} Copy`;
      const name = (window.prompt?.('Name the duplicate Khymeryyan:', defaultName) || '').trim();
      acc.createKhymeryyan(name || defaultName, { sourceKhymeryyan: active });
      _activeDyeSlot = null;
      render();
    });

    document.getElementById('sb-delete-khymeryyan-btn')?.addEventListener('click', () => {
      const acc = window.ScratchbonesAccount;
      const active = acc?.getActiveKhymeryyan?.();
      if (!acc?.deleteKhymeryyan || !active) return;
      if (window.confirm && !window.confirm(`Delete ${active.name || 'this Khymeryyan'}?`)) return;
      acc.deleteKhymeryyan(active.id);
      _activeDyeSlot = null;
      render();
    });

    el.querySelectorAll('.sb-mode-btn[data-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        _selectedMode = btn.dataset.mode;
        if (_selectedMode === 'pvp' && _selectedPlayerCount < 2) _selectedPlayerCount = 2;
        render();
      });
    });

    el.querySelectorAll('.sb-mode-btn[data-pve-mode]').forEach(btn => {
      btn.addEventListener('click', () => {
        _selectedPveMode = btn.dataset.pveMode;
        render();
      });
    });

    document.getElementById('sb-pve-min-difficulty')?.addEventListener('change', (event) => {
      _selectedPveMinDifficulty = event.target.value;
      normalizeSelectedPveDifficultyRange();
      render();
    });
    document.getElementById('sb-pve-max-difficulty')?.addEventListener('change', (event) => {
      _selectedPveMaxDifficulty = event.target.value;
      normalizeSelectedPveDifficultyRange();
      render();
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
        _editAppearance.cosmetics = defaultCosmeticsFor(sid, _editAppearance.gender);
        const gData = specData && specData[_editAppearance.gender];
        const opts = gData ? gData.colorOptions : [];
        _editAIdx = 0; _editBIdx = 0;
        if (opts[0]) {
          _editAppearance.bodyColors.A = { h: opts[0].h, s: opts[0].s, v: opts[0].v };
          _editAppearance.bodyColors.B = { h: opts[0].h, s: opts[0].s, v: opts[0].v };
          _editAppearance.bodyColors.C = deriveCFromA(opts[0]);
        }
        _initLoreState(sid, _editAppearance.gender);
        render();
      });
    });

    el.querySelectorAll('[data-subspecies]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!_editAppearance) return;
        const childId = btn.dataset.subspecies;
        const parentId = btn.dataset.parentSpecies;
        const wasActive = _editAppearance.speciesId === childId;
        const newSpeciesId = wasActive ? parentId : childId;
        const newGenderData = SPECIES_DATA[newSpeciesId]?.[_editAppearance.gender];
        const validSlots = new Set((newGenderData?.slots || []).map(s => s.slot));
        const oldCosmetics = { ..._editAppearance.cosmetics };
        const newCosmetics = defaultCosmeticsFor(newSpeciesId, _editAppearance.gender);
        for (const [slot, val] of Object.entries(oldCosmetics)) {
          if (validSlots.has(slot)) newCosmetics[slot] = val;
        }
        _editAppearance.speciesId = newSpeciesId;
        _editAppearance.cosmetics = newCosmetics;
        render();
      });
    });

    el.querySelectorAll('[data-gender]:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!_editAppearance) return;
        _editAppearance.gender = btn.dataset.gender;
        _editAppearance.cosmetics = defaultCosmeticsFor(_editAppearance.speciesId, _editAppearance.gender);
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

    el.querySelectorAll('.sb-cosmetic-select[data-slot]').forEach(sel => {
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

    // ── Name format selector ───────────────────────────────────

    el.querySelectorAll('[data-name-format]').forEach(btn => {
      btn.addEventListener('click', () => {
        _editNameFormat = btn.dataset.nameFormat;
        el.querySelectorAll('[data-name-format]').forEach(b => b.classList.toggle('selected', b.dataset.nameFormat === _editNameFormat));
      });
    });

    // ── Lore name creator handlers ─────────────────────────────

    if (_loreState) {
      const adv = window.SCRATCHBONES_NAME_ADVISOR;

      el.querySelectorAll('.sb-lore-input').forEach(input => {
        input.addEventListener('input', () => {
          if (!_loreState) return;
          const slot = input.dataset.loreSlot;
          const ctx = _loreCtx();
          const sp = _loreState.sp;
          const val = input.value;
          const slotEl = input.closest('.sb-lore-slot');
          // live validation
          const { html: valHtml, msgs } = adv ? adv.validateSlot(sp, slot, val, ctx) : { html: '', msgs: [] };
          const vd = slotEl?.querySelector('.sb-lore-val');
          if (vd) vd.innerHTML = valHtml || '';
          const msgEl = slotEl?.querySelector('.sb-lore-msgs');
          if (msgEl) msgEl.textContent = msgs[0] || '';
          // enable/disable apply button
          const applyBtn = slotEl?.querySelector('.sb-lore-apply');
          if (applyBtn) applyBtn.disabled = msgs.length > 0;
          // live suggestions (dynamically attached so they update birth state when clicked)
          const sg = slotEl?.querySelector('.sb-lore-suggs');
          if (sg && adv) {
            const opts = val ? adv.makeIdeaOptions(sp, slot, val, ctx) : [];
            sg.innerHTML = opts.map((o, i) =>
              `<button class="sb-lore-sugg" data-lore-slot="${adv.esc(slot)}" data-lore-idx="${i}">${adv.esc(o.label)}</button>`
            ).join('');
            sg.querySelectorAll('[data-lore-idx]').forEach(btn => {
              btn.addEventListener('click', () => {
                if (!_loreState || !adv) return;
                const opt = opts[Number(btn.dataset.loreIdx)];
                if (opt) {
                  _loreState.births = adv.applyOption(sp, slot, opt, _loreState.births);
                  render();
                }
              });
            });
          }
        });
      });

      el.querySelectorAll('.sb-lore-apply').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!_loreState || !adv) return;
          const slot = btn.dataset.loreSlot;
          const input = document.getElementById(`sb-lore-${slot}`);
          if (!input) return;
          const val = input.value;
          const sp = _loreState.sp;
          const ctx = _loreCtx();
          const { msgs } = adv.validateSlot(sp, slot, val, ctx);
          if (msgs.length > 0) return;
          _loreState.births[slot] = val.toLowerCase();
          const preview = document.getElementById('sb-lore-preview');
          if (preview) preview.innerHTML = _buildLorePreviewHtml(sp, _loreState.births, ctx) || '<span class="nd-faint">—</span>';
          const tankanEl = document.getElementById('sb-lore-tankan');
          if (tankanEl) tankanEl.innerHTML = _buildTankanPillars(sp, _loreState.births, ctx) || '';
        });
      });

      el.querySelectorAll('[data-lore-idx]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!_loreState || !adv) return;
          const sp = _loreState.sp;
          const slot = btn.dataset.loreSlot;
          const births = _loreState.births;
          const opts = adv.makeIdeaOptions(sp, slot, births[slot] || '', _loreCtx());
          const opt = opts[Number(btn.dataset.loreIdx)];
          if (opt) { _loreState.births = adv.applyOption(sp, slot, opt, births); render(); }
        });
      });

      el.querySelectorAll('[data-lore-place]').forEach(btn => {
        btn.addEventListener('click', () => {
          if (!_loreState) return;
          _loreState.births.surname = 'tley ' + btn.dataset.lorePlace;
          render();
        });
      });

      document.getElementById('sb-lore-married')?.addEventListener('change', e => {
        if (_loreState) { _loreState.married = e.target.checked; render(); }
      });

      document.getElementById('sb-lore-random-btn')?.addEventListener('click', () => {
        if (!_loreState || !adv) return;
        _loreState.births = adv.randomizeName(_loreState.sp, _loreCtx());
        render();
      });

      document.getElementById('sb-lore-copy-btn')?.addEventListener('click', () => {
        if (!_loreState || !adv) return;
        const name = adv.formatFullName(_loreState.sp, _loreState.births, _loreCtx());
        navigator.clipboard?.writeText(name).catch(() => {});
      });
    }

    document.getElementById('sb-export-khymeryyan-btn')?.addEventListener('click', () => {
      const acc = window.ScratchbonesAccount;
      const active = acc?.getActiveKhymeryyan?.();
      if (!active) return;
      const exported = {
        name: active.name,
        appearance: active.appearance ? { ...active.appearance } : null,
        loreName: active.loreName ? { ...active.loreName } : null,
        nameFormat: active.nameFormat || 'nickname',
        equippedCosmetics: [...(active.equippedCosmetics || [])],
        appliedDyes: { ...(active.appliedDyes || {}) },
        trickBoneLoadout: [...(active.trickBoneLoadout || [])],
      };
      const json = JSON.stringify(exported, null, 2);
      navigator.clipboard?.writeText(json).then(() => {
        const btn = document.getElementById('sb-export-khymeryyan-btn');
        if (btn) { const prev = btn.textContent; btn.textContent = 'Copied!'; setTimeout(() => { btn.textContent = prev; }, 1400); }
      }).catch(() => { window.prompt?.('Copy this JSON:', json); });
    });

    document.getElementById('sb-save-appearance-btn')?.addEventListener('click', () => {
      const acc = window.ScratchbonesAccount;
      const nameVal = (document.getElementById('sb-edit-name')?.value || '').trim();
      if (nameVal) acc?.renameKhymeryyan?.(acc?.getActiveKhymeryyan?.()?.id, nameVal) || acc?.setUsername(nameVal);
      if (_loreState) acc?.setLoreName?.({ ..._loreState.births, married: !!_loreState.married });
      acc?.setNameFormat?.(_editNameFormat);
      acc?.setAppearance(_editAppearance);
      _screen = 'main';
      render();
    });

    // ── Collections ────────────────────────────────────────────

    el.querySelectorAll('[data-appearance-slot]').forEach(sel => {
      sel.addEventListener('change', () => {
        const acc = window.ScratchbonesAccount;
        if (!acc) return;
        const appearance = acc.getAppearance();
        appearance.cosmetics = { ...(appearance.cosmetics || {}), [sel.dataset.appearanceSlot]: sel.value || null };
        acc.setAppearance(appearance);
        render();
      });
    });

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
        render();
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
        window.ScratchbonesAccount?.applyDye(btn.dataset.applyDye, btn.dataset.tintKey);
        render();
      });
    });

    el.querySelectorAll('[data-clear-channel]').forEach(btn => {
      btn.addEventListener('click', () => {
        window.ScratchbonesAccount?.removeDye(btn.dataset.clearChannel);
        render();
      });
    });

    el.querySelectorAll('[data-trick-slot]').forEach(select => {
      select.addEventListener('change', () => {
        window.ScratchbonesAccount?.setTrickBoneLoadoutSlot(Number(select.dataset.trickSlot), select.value);
        render();
      });
    });

    // ── Shop ───────────────────────────────────────────────────

    el.querySelectorAll('.sb-shop-action').forEach(btn => {
      btn.addEventListener('click', () => {
        const { action, id } = btn.dataset;
        const acc = window.ScratchbonesAccount;
        if (!acc) return;
        if (action === 'buy') { _lastMysteryDyeResult = null; acc.buyCosmetic(id); }
        else if (action === 'equip') { _lastMysteryDyeResult = null; acc.equipCosmetic(id); }
        else if (action === 'unequip') { _lastMysteryDyeResult = null; acc.unequipCosmetic(id); }
        else if (action === 'buy-mystery-dye') _lastMysteryDyeResult = acc.buyMysteryDye(btn.dataset.poolId);
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
      const MIN_BRONZE = acc?.BRONZE_PASSIVE_MAX ?? window.SCRATCHBONES_CONFIG?.game?.account?.bronzePassiveMax;
      if (!acc || acc.getBronze() < MIN_BRONZE) {
        alert(`You need at least ${MIN_BRONZE} Bronze to host a game.`);
        return;
      }
      const selectedKhymeryyan = getFullKhymeryyan();
      const username = selectedKhymeryyan?.name || acc.getDisplayName?.() || acc.getUsername() || 'Host';
      const appearance = getFullAppearance();
      const playerLoadout = getLocalPlayerLoadout();
      _onlineOccupants = [{ seatId: 0, name: username }];
      _onlineOccupantAppearances = { 0: appearance };
      _onlineOccupantLoadouts = { 0: playerLoadout };
      net.createRoom(wsUrl(), username, _onlinePlayerCount, appearance, playerLoadout, selectedKhymeryyan)
        .then(code => {
          _roomCode = code;
          _myOnlineSeat = 0;
          _screen = 'online-waiting';
          net.on('player-joined', msg => {
            _onlineOccupants = (msg.occupants || []).map(o => ({ seatId: o.seatId, name: o.name }));
            // Store per-seat appearances from the relay
            for (const o of (msg.occupants || [])) {
              if (o.appearance) _onlineOccupantAppearances[o.seatId] = o.appearance;
              if (Array.isArray(o.playerLoadout)) _onlineOccupantLoadouts[o.seatId] = o.playerLoadout;
            }
            render();
          });
          net.on('player-left', msg => {
            _onlineOccupants = _onlineOccupants.filter(o => o.seatId !== msg.seatId);
            delete _onlineOccupantAppearances[msg.seatId];
            delete _onlineOccupantLoadouts[msg.seatId];
            render();
          });
          render();
        })
        .catch(err => { alert('Could not create room: ' + err.message); });
    });

    document.getElementById('sb-start-online-btn')?.addEventListener('click', () => {
      if (!_fillWithNpcs && _onlineOccupants.length < _onlinePlayerCount) return;
      if (_fillWithNpcs && _onlineOccupants.length < 1) return;
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
        const MIN_BRONZE = acc?.BRONZE_PASSIVE_MAX ?? window.SCRATCHBONES_CONFIG?.game?.account?.bronzePassiveMax;
        if (!acc || acc.getBronze() < MIN_BRONZE) {
          showJoinError(`You need at least ${MIN_BRONZE} Bronze to join a game.`);
          return;
        }
        const selectedKhymeryyan = getFullKhymeryyan();
        const username = selectedKhymeryyan?.name || acc.getDisplayName?.() || acc.getUsername() || 'Player';
        const appearance = getFullAppearance();
        const playerLoadout = getLocalPlayerLoadout();
        doJoinBtn.disabled = true;
        net.joinRoom(wsUrl(), code, username, appearance, playerLoadout, selectedKhymeryyan)
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


  function logCosmeticVarsError(message, details = null) {
    if (details != null) console.error('[lobby][cosmetic-vars] ' + message, details);
    else console.error('[lobby][cosmetic-vars] ' + message);
  }

  function showJoinError(msg) {
    const el = document.getElementById('sb-join-error');
    if (el) { el.textContent = msg; el.style.display = ''; }
  }

  // ── Session helpers ────────────────────────────────────────

  function getFullKhymeryyan() {
    const acc = window.ScratchbonesAccount;
    if (!acc) return null;
    const active = acc.getActiveKhymeryyan?.();
    if (!active) return null;
    const trickBoneLoadout = [...(active.trickBoneLoadout || acc.getTrickBoneLoadout?.() || [])];
    return {
      id: active.id,
      name: acc.getDisplayName?.() || active.name || acc.getUsername?.() || 'Player',
      appearance: { ...active.appearance },
      equippedCosmetics: [...(active.equippedCosmetics || [])],
      appliedDyes: { ...(active.appliedDyes || {}) },
      trickBoneLoadout,
      playerLoadout: trickBoneLoadout,
      unlockedTrickBones: [...(acc.getUnlockedTrickBones?.() || [])],
      loreName: active.loreName ? { ...active.loreName } : null,
      nameFormat: active.nameFormat || 'nickname',
    };
  }

  function getFullAppearance() {
    const khymeryyan = getFullKhymeryyan();
    return khymeryyan ? {
      ...khymeryyan.appearance,
      name: khymeryyan.name,
      equippedCosmetics: [...khymeryyan.equippedCosmetics],
      appliedDyes: { ...khymeryyan.appliedDyes },
      trickBoneLoadout: [...khymeryyan.trickBoneLoadout],
    } : null;
  }

  function getLocalPlayerLoadout() {
    return getFullKhymeryyan()?.trickBoneLoadout ?? [];
  }

  function show(screen) {
    window.ScratchbonesAccount?.tickPassiveIncome();
    _screen = screen || (window.ScratchbonesAccount?.isCreated() ? 'main' : 'create');
    render();
    const el = overlay();
    if (el) el.style.display = 'flex';
    // In lobby: swap Map button for Cosmetic Vars button
    const mapBtn = document.getElementById('projMapBtn');
    const cvBtn  = document.getElementById('cosmeticVarsBtn');
    if (mapBtn) mapBtn.style.display = 'none';
    if (cvBtn)  cvBtn.style.display = '';
    else if (mapBtn) logCosmeticVarsError('Map button hidden but Cosmetic Vars button is missing during lobby show().');
  }

  function hide() {
    const el = overlay();
    if (el) el.style.display = 'none';
    // Restore Map button, hide Cosmetic Vars button and its panel
    const mapBtn  = document.getElementById('projMapBtn');
    const cvBtn   = document.getElementById('cosmeticVarsBtn');
    const cvPanel = document.getElementById('cosmeticVarsPanel');
    if (mapBtn)  mapBtn.style.display = '';
    if (cvBtn)   { cvBtn.style.display = 'none'; cvBtn.classList.remove('active'); }
    if (cvPanel) cvPanel.classList.remove('open');
  }

  function onGameEnd(chipCount, humanWon = false) {
    window.ScratchbonesNetwork?.disconnect();
    const acc = window.ScratchbonesAccount;
    const msgs = [];
    if (acc) {
      const earned = Math.max(0, Math.floor(chipCount));
      if (earned > 0) { acc.addBronze(earned); msgs.push(`You earned ${earned} Bronze!`); }
      if (humanWon && !acc.isAtRenownCap?.()) {
        const newRenown = acc.addRenown?.(1);
        if (newRenown != null) msgs.push(`Renown ${newRenown}!`);
        if (acc.isAtRenownCap?.()) msgs.push('Boss challenge unlocked!');
      }
    }
    _postGameMessage = msgs.join(' ');
    show('main');
  }

  function onBossGameEnd(passed, chipCount) {
    window.ScratchbonesNetwork?.disconnect();
    const acc = window.ScratchbonesAccount;
    if (passed) {
      acc?.clearRenownCap?.();
      const newRenown = acc?.addRenown?.(1);
      _postGameMessage = `Boss defeated! Renown ${newRenown ?? ''}!`;
    } else {
      const earned = Math.max(0, Math.floor(chipCount));
      if (earned > 0) acc?.addBronze(earned);
      _postGameMessage = 'Boss defeated you. Train up and try again.';
    }
    show('main');
  }

  function startGame() {
    if (!window.ScratchbonesAccount?.isCreated()) return;
    if (_selectedMode === 'pve') {
      // True offline play: skip the online lobby entirely
      startOfflineGame();
      return;
    }
    // PvPvE routes through online lobby with NPC fill for empty seats
    _fillWithNpcs = (_selectedMode === 'pvpve');
    _screen = 'online';
    render();
  }

  function buildSingleHumanPveSession(startMode = 'pve', options = {}) {
    const khymeryyan = getFullKhymeryyan();
    const username = khymeryyan?.name || 'Player';
    const ap = getFullAppearance();
    const totalPlayers = Math.max(1, Number(window.SCRATCHBONES_CONFIG?.game?.deck?.playerCount) || 4);
    const humanSeat = 0;
    const playerNames = { [humanSeat]: username };
    const playerAppearances = { [humanSeat]: ap };
    const playerLoadouts = { [humanSeat]: getLocalPlayerLoadout() };
    const playerDifficultyRanks = {};
    const useDifficultyTest = options.useDifficultyTest ?? (startMode === 'pve' && _selectedPveMode === 'difficulty-test');
    let npcIndex = 0;
    for (let seat = 0; seat < totalPlayers; seat++) {
      if (seat !== humanSeat) {
        playerNames[seat] = NPC_NAMES[npcIndex % NPC_NAMES.length];
        if (useDifficultyTest) {
          const rank = randomPveDifficultyRank();
          if (rank) playerDifficultyRanks[seat] = rank;
        }
        npcIndex++;
      }
    }
    window.SCRATCHBONES_SESSION = {
      mode: startMode,
      humanSeats: [humanSeat],
      playerNames,
      playerAppearances,
      playerLoadouts,
      playerDifficultyRanks,
      pveMode: _selectedPveMode,
    };
  }

  function buildBossSession() {
    const acc = window.ScratchbonesAccount;
    const bossLevel = acc?.getBossLevel?.() || 1;
    const encounter = _getBossEncounterConfig(bossLevel) || {};
    const boss = encounter.boss || {};
    const ads = encounter.ads || [];
    const khymeryyan = getFullKhymeryyan();
    const username = khymeryyan?.name || 'Player';
    const ap = getFullAppearance();
    window.SCRATCHBONES_SESSION = {
      mode: 'pve',
      humanSeats: [0],
      playerNames: {
        0: username,
        1: boss.name || 'The Bone Collector',
        2: ads[0]?.name || null,
        3: ads[1]?.name || null,
      },
      playerAppearances: {
        0: ap,
        1: boss.appearance || null,
      },
      playerLoadouts: {
        0: getLocalPlayerLoadout(),
        1: Array.isArray(boss.trickBoneLoadout) && boss.trickBoneLoadout.length ? boss.trickBoneLoadout : undefined,
      },
      playerDifficultyRanks: {
        1: boss.difficultyRank || 'boss',
        2: ads[0]?.difficultyRank || 'easy',
        3: ads[1]?.difficultyRank || 'easy',
      },
      bossMode: true,
      bossSeat: 1,
      adSeats: [2, 3],
    };
  }

  function startBossGame() {
    if (!window.ScratchbonesAccount?.isCreated()) return;
    buildBossSession();
    _postGameMessage = '';
    hide();
    if (_scratchbonesReady && window.scratchbonesStartGame) {
      void window.scratchbonesStartGame().catch(e => console.error('[lobby] startBossGame error', e));
    }
  }

  function startOfflineGame() {
    buildSingleHumanPveSession('pve');
    _postGameMessage = '';
    hide();
    if (_scratchbonesReady && window.scratchbonesStartGame) {
      void window.scratchbonesStartGame().catch(e => console.error('[lobby] startOfflineGame error', e));
    }
  }

  function startTutorialGame() {
    if (!window.ScratchbonesAccount?.isCreated()) return;
    buildSingleHumanPveSession('pve', { useDifficultyTest: false });
    _postGameMessage = '';
    hide();
    if (_scratchbonesReady && window.scratchbonesStartTutorial) {
      void window.scratchbonesStartTutorial().catch(e => console.error('[lobby] startTutorialGame error', e));
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
    const playerLoadouts = { ..._onlineOccupantLoadouts };

    // In PvPvE (NPC fill) mode, fill any remaining seats with AI players
    if (_fillWithNpcs) {
      let npcIndex = 0;
      for (let seat = 0; seat < _onlinePlayerCount; seat++) {
        if (!humanSeats.includes(seat)) {
          playerNames[seat] = NPC_NAMES[npcIndex % NPC_NAMES.length] || `NPC ${seat + 1}`;
          npcIndex++;
        }
      }
    }

    const mode = _fillWithNpcs ? 'pve' : 'pvp';
    window.SCRATCHBONES_SESSION = { mode, humanSeats, playerNames, playerAppearances, playerLoadouts };
    _postGameMessage = '';
    net.broadcastStart();
    hide();
    if (_scratchbonesReady && window.scratchbonesStartGame) {
      void window.scratchbonesStartGame().catch(e => console.error('[lobby] startOnlineGame error', e));
    }
  }

  function startOnlineClient() {
    hide();
    const khymeryyan = getFullKhymeryyan();
    const username = khymeryyan?.name || 'Player';
    const ap = getFullAppearance();
    window.SCRATCHBONES_SESSION = {
      mode: 'online-client',
      humanSeats: [_myOnlineSeat],
      playerNames: { [_myOnlineSeat]: username },
      playerAppearances: { [_myOnlineSeat]: ap },
      playerLoadouts: { [_myOnlineSeat]: getLocalPlayerLoadout() },
    };
    if (_scratchbonesReady && window.scratchbonesStartClient) {
      void window.scratchbonesStartClient().catch(e => console.error('[lobby] startOnlineClient error', e));
    }
  }

  // ── Cosmetic Vars Panel ───────────────────────────────────
  function _ensureCosmeticVarsDom() {
    if (document.getElementById('cosmeticVarsBtn') && document.getElementById('cosmeticVarsPanel')) return;
    const root = document.body || document.documentElement;
    if (!root) {
      logCosmeticVarsError('Cannot create Cosmetic Vars UI because document root is missing.');
      return;
    }
    if (!document.getElementById('cosmeticVarsBtn')) {
      const btn = document.createElement('button');
      btn.id = 'cosmeticVarsBtn';
      btn.title = 'Edit portrait xform presets';
      btn.textContent = 'Cosmetic Vars';
      btn.style.display = 'none';
      root.appendChild(btn);
    }
    if (!document.getElementById('cosmeticVarsPanel')) {
      const panel = document.createElement('div');
      panel.id = 'cosmeticVarsPanel';
      panel.setAttribute('aria-live', 'polite');
      panel.innerHTML = `
        <div class="cvpHead">
          <span class="cvpTitle">Portrait Xform Presets</span>
          <button class="cvpCloseBtn" id="cosmeticVarsCloseBtn">Close</button>
        </div>
        <div class="cvpBody" id="cosmeticVarsBody">
          ${['A', 'B', 'C', 'D'].map((name) => `
            <div class="cvpPreset" data-preset="${name}">
              <div class="cvpPresetLabel">Preset ${name}</div>
              <div class="cvpFields">
                <div class="cvpField"><label>ax</label><input class="cvpFieldInput" id="cvp-${name}-ax" type="number" step="0.001" value="0"></div>
                <div class="cvpField"><label>ay</label><input class="cvpFieldInput" id="cvp-${name}-ay" type="number" step="0.001" value="0"></div>
                <div class="cvpField"><label>scaleX</label><input class="cvpFieldInput" id="cvp-${name}-scaleX" type="number" step="0.01" value="1"></div>
                <div class="cvpField"><label>scaleY</label><input class="cvpFieldInput" id="cvp-${name}-scaleY" type="number" step="0.01" value="1"></div>
                <div class="cvpField"><label>rotDeg</label><input class="cvpFieldInput" id="cvp-${name}-rotDeg" type="number" step="0.1" value="0"></div>
              </div>
            </div>`).join('')}
        </div>
        <div class="cvpActions">
          <button class="cvpApplyBtn" id="cosmeticVarsApplyBtn">Apply Live</button>
        </div>`;
      root.appendChild(panel);
    }
    if (!document.getElementById('cosmeticVarsBtn') || !document.getElementById('cosmeticVarsPanel')) {
      logCosmeticVarsError('Cosmetic Vars UI creation incomplete after _ensureCosmeticVarsDom().', {
        hasButton: !!document.getElementById('cosmeticVarsBtn'),
        hasPanel: !!document.getElementById('cosmeticVarsPanel'),
      });
    }
  }

  function _syncCosmeticVarsInputs() {
    const cfg = window.SCRATCHBONES_CONFIG?.game?.portrait?.xformPresets || {};
    for (const name of ['A', 'B', 'C', 'D']) {
      const p = cfg[name] || {};
      const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val ?? 0; };
      set(`cvp-${name}-ax`,     p.ax     ?? 0);
      set(`cvp-${name}-ay`,     p.ay     ?? 0);
      set(`cvp-${name}-scaleX`, p.scaleX ?? p.sx ?? 1);
      set(`cvp-${name}-scaleY`, p.scaleY ?? p.sy ?? 1);
      set(`cvp-${name}-rotDeg`, p.rotDeg ?? 0);
    }
  }

  function _applyCosmeticVarsPresets() {
    if (!window.SCRATCHBONES_CONFIG) window.SCRATCHBONES_CONFIG = {};
    if (!window.SCRATCHBONES_CONFIG.game) window.SCRATCHBONES_CONFIG.game = {};
    if (!window.SCRATCHBONES_CONFIG.game.portrait) window.SCRATCHBONES_CONFIG.game.portrait = {};
    const presets = {};
    for (const name of ['A', 'B', 'C', 'D']) {
      const get = (id) => parseFloat(document.getElementById(id)?.value) || 0;
      presets[name] = {
        ax:     get(`cvp-${name}-ax`),
        ay:     get(`cvp-${name}-ay`),
        scaleX: get(`cvp-${name}-scaleX`) || 1,
        scaleY: get(`cvp-${name}-scaleY`) || 1,
        rotDeg: get(`cvp-${name}-rotDeg`),
      };
    }
    window.SCRATCHBONES_CONFIG.game.portrait.xformPresets = presets;
    // Re-render all visible portrait canvases
    const acc = window.ScratchbonesAccount;
    const ap = _editAppearance || (acc ? acc.getAppearance() : null);
    for (const id of ['sb-ap-canvas', 'sb-col-canvas', 'sb-shop-canvas']) {
      const canvas = document.getElementById(id);
      if (canvas && ap && window.renderProfile) renderPreviewCanvas(id, ap);
    }
  }

  function _initCosmeticVarsPanel() {
    _ensureCosmeticVarsDom();
    const btn   = document.getElementById('cosmeticVarsBtn');
    const panel = document.getElementById('cosmeticVarsPanel');
    const closeBtn = document.getElementById('cosmeticVarsCloseBtn');
    const applyBtn = document.getElementById('cosmeticVarsApplyBtn');
    if (!btn || !panel) {
      logCosmeticVarsError('Cosmetic Vars UI failed to initialize (missing button or panel).', { hasButton: !!btn, hasPanel: !!panel });
      return;
    }
    btn.addEventListener('click', () => {
      const open = panel.classList.toggle('open');
      btn.classList.toggle('active', open);
      if (open) _syncCosmeticVarsInputs();
    });
    closeBtn?.addEventListener('click', () => {
      panel.classList.remove('open');
      btn.classList.remove('active');
    });
    applyBtn?.addEventListener('click', _applyCosmeticVarsPresets);
  }

  function init() {
    window.ScratchbonesAccount?.load();
    // Pre-load portrait cosmetics for preview
    ensurePortraitCosmetics();
    _initCosmeticVarsPanel();

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

  window.ScratchbonesLobby = { init, show, hide, onGameEnd, onBossGameEnd };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
