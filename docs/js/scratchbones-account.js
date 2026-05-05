(function () {
  'use strict';

  const SAVE_KEY = 'sb_account_v1';
  const BRONZE_PASSIVE_MAX = 30;
  const BRONZE_PASSIVE_RATE_MS = 5 * 60 * 1000; // 1 bronze per 5 minutes

  // NPC-usable cosmetics available for purchase.
  // Items tagged species/gender are only shown when the player matches.
  const SHOP_CATALOG = [
    // Hats — universal
    { id: 'appearance::hat::basic_headband',       label: 'Basic Headband',        price: 5,  category: 'hat', description: 'A simple cloth headband.' },
    { id: 'appearance::hat::leather_headband',     label: 'Leather Headband',      price: 8,  category: 'hat', description: 'A sturdy leather headband.', material: 'leather' },
    { id: 'appearance::hat::riverlandskasa_low',   label: 'Riverland Kasa (Low)',  price: 10, category: 'hat', description: 'Traditional riverland hat, worn low.', material: 'rigid_fiber' },
    { id: 'appearance::hat::riverlandskasa_tight', label: 'Riverland Kasa (Tight)', price: 10, category: 'hat', description: 'Traditional riverland hat, tight fit.', material: 'rigid_fiber' },
    { id: 'appearance::hat::riverlandskasa_wide',  label: 'Riverland Kasa (Wide)', price: 10, category: 'hat', description: 'Traditional riverland hat, wide brim.', material: 'rigid_fiber' },
    // Hats — Kenkari specific
    { id: 'appearance::Kenkari_M::kenk_riverlandskasa_low',  label: 'Kenkari Kasa (Low)',  price: 10, category: 'hat', species: 'kenkari', gender: 'male',   description: 'Kenkari riverland hat, worn low.', material: 'rigid_fiber' },
    { id: 'appearance::Kenkari_F::kenk_riverlandskasa_low',  label: 'Kenkari Kasa (Low)',  price: 10, category: 'hat', species: 'kenkari', gender: 'female', description: 'Kenkari riverland hat, worn low.', material: 'rigid_fiber' },
    { id: 'appearance::Kenkari_M::kenk_riverlandskasa_wide', label: 'Kenkari Kasa (Wide)', price: 10, category: 'hat', species: 'kenkari', gender: 'male',   description: 'Kenkari riverland hat, wide brim.', material: 'rigid_fiber' },
    { id: 'appearance::Kenkari_F::kenk_riverlandskasa_wide', label: 'Kenkari Kasa (Wide)', price: 10, category: 'hat', species: 'kenkari', gender: 'female', description: 'Kenkari riverland hat, wide brim.', material: 'rigid_fiber' },
    // Torso
    { id: 'tankan_tunic',   label: 'Tankan Tunic',    price: 12, category: 'torso',   description: 'A fitted tankan-style tunic.' },
    { id: 'bandolier1',     label: 'Bandolier',       price: 8,  category: 'torso',   description: 'A rugged leather bandolier.', material: 'leather' },
    // Overwear
    { id: 'tankan_bodywrap', label: 'Tankan Body Wrap', price: 15, category: 'overwear', description: 'A wrapped ceremonial bodywrap.' },
    // Hoods
    { id: 'fine_hood',      label: 'Fine Hood',       price: 15, category: 'hood',    description: 'A finely crafted hood with trim.' },
  ];

  // Migration map: old per-variant cosmetic IDs → new consolidated IDs.
  const _COSMETIC_ID_MIGRATIONS = {
    'tankantunic_mao-ao_m': 'tankan_tunic',
    'tankantunic_mao-ao_f': 'tankan_tunic',
    'tankantunic_tl_m':     'tankan_tunic',
    'tankantunic_kenk_m':   'tankan_tunic',
    'tankantunic_kenk_f':   'tankan_tunic',
    'bandolier1_mao-ao_m':  'bandolier1',
    'bandolier1_mao-ao_f':  'bandolier1',
    'bandolier1_tl_m':      'bandolier1',
    'bandolier1_kenk_m':    'bandolier1',
    'bandolier1_kenk_f':    'bandolier1',
    'tankanbodywrap_mao-ao': 'tankan_bodywrap',
    'tankanbodywrap_tl_m':  'tankan_bodywrap',
    'tankanbodywrap_kenk_m':'tankan_bodywrap',
    'tankanwrap_kenk_f':    'tankan_bodywrap',
    'fine_hood_mao-ao_m':   'fine_hood',
    'fine_hood_mao-ao_f':   'fine_hood',
    'fine_hood_kenk_m':     'fine_hood',
    'fine_hood_kenk_f':     'fine_hood',
    'fine_hood_tl':         'fine_hood',
  };

  function migrateId(id) { return _COSMETIC_ID_MIGRATIONS[id] || id; }

  function migrateIdArray(arr) {
    if (!Array.isArray(arr)) return arr;
    const seen = new Set();
    const result = [];
    for (const id of arr) {
      const mapped = migrateId(id);
      if (!seen.has(mapped)) { seen.add(mapped); result.push(mapped); }
    }
    return result;
  }
  function cosmeticEntitlementKey(item) {
    if (!item) return null;
    return [item.category || '', item.label || '', item.material || ''].join('::');
  }
  function findShopItem(id) {
    return SHOP_CATALOG.find(c => c.id === id) || null;
  }
  function ownsCosmeticGroup(acc, cosmeticId) {
    const target = findShopItem(cosmeticId);
    if (!target) return false;
    const targetKey = cosmeticEntitlementKey(target);
    return (acc.unlockedCosmetics || []).some(ownedId => {
      const owned = findShopItem(ownedId);
      return owned && cosmeticEntitlementKey(owned) === targetKey;
    });
  }

  // Dyes set a bodyColor slot (CLOTH, HAT, TORSO, …) to a specific tint.
  // Colors are offsets applied to the mint base (#7dc89a) via hue-rotate/saturate/brightness.
  // Hex values are the standard reference colors from the color name; offsets are computed
  // from the mint base (H=143°, S_hsv=0.375, V_hsv=0.784).
  const DYE_CATALOG = [
    // ── Cloth dyes — full range ─────────────────────────────────────────────
    { id: 'dye:CLOTH:red',       label: 'Jade',     group: 'cloth', dyeSlot: 'CLOTH', color: { h:  15, s:  1.67, v: -0.16 } }, // #00A86B
    { id: 'dye:CLOTH:orange',    label: 'Teal',     group: 'cloth', dyeSlot: 'CLOTH', color: { h:  37, s:  1.67, v: -0.36 } }, // #008080
    { id: 'dye:CLOTH:yellow',    label: 'Azure',    group: 'cloth', dyeSlot: 'CLOTH', color: { h:  67, s:  1.67, v:  0.27 } }, // #007FFF
    { id: 'dye:CLOTH:green',     label: 'Amethyst', group: 'cloth', dyeSlot: 'CLOTH', color: { h: 127, s:  0.33, v:  0.02 } }, // #9966CC
    { id: 'dye:CLOTH:blue',      label: 'Crimson',  group: 'cloth', dyeSlot: 'CLOTH', color: { h:-155, s:  1.42, v:  0.10 } }, // #DC143C
    { id: 'dye:CLOTH:purple',    label: 'Amber',    group: 'cloth', dyeSlot: 'CLOTH', color: { h: -98, s:  1.67, v:  0.27 } }, // #FFBF00
    { id: 'dye:CLOTH:brown',     label: 'Moss',     group: 'cloth', dyeSlot: 'CLOTH', color: { h: -68, s:  0.09, v: -0.23 } }, // #8A9A5B
    { id: 'dye:CLOTH:black',     label: 'Onyx',     group: 'cloth', dyeSlot: 'CLOTH', color: { h:  52, s: -0.81, v: -0.71 } }, // #353839
    { id: 'dye:CLOTH:white',     label: 'Mist',     group: 'cloth', dyeSlot: 'CLOTH', color: { h:  87, s: -0.85, v:  0.04 } }, // #C4C6D0
    { id: 'dye:CLOTH:grey',      label: 'Sage',     group: 'cloth', dyeSlot: 'CLOTH', color: { h: -35, s: -0.36, v: -0.23 } }, // #7D9B76
    { id: 'dye:CLOTH:navy',      label: 'Navy',     group: 'cloth', dyeSlot: 'CLOTH', color: { h:  97, s:  1.67, v: -0.36 } }, // #000080
    { id: 'dye:CLOTH:scarlet',   label: 'Scarlet',  group: 'cloth', dyeSlot: 'CLOTH', color: { h:-135, s:  1.67, v:  0.27 } }, // #FF2400
    { id: 'dye:CLOTH:gold',      label: 'Gold',     group: 'cloth', dyeSlot: 'CLOTH', color: { h: -93, s:  1.67, v:  0.27 } }, // #FFD700
    { id: 'dye:CLOTH:violet',    label: 'Violet',   group: 'cloth', dyeSlot: 'CLOTH', color: { h: 127, s:  1.67, v:  0.27 } }, // #8000FF
    { id: 'dye:CLOTH:forest',    label: 'Forest',   group: 'cloth', dyeSlot: 'CLOTH', color: { h: -23, s:  1.01, v: -0.31 } }, // #228B22
    { id: 'dye:CLOTH:ivory',     label: 'Ivory',    group: 'cloth', dyeSlot: 'CLOTH', color: { h: -83, s: -0.84, v:  0.27 } }, // #FFFFF0
    { id: 'dye:CLOTH:wine',      label: 'Wine',     group: 'cloth', dyeSlot: 'CLOTH', color: { h:-150, s:  0.57, v: -0.43 } }, // #722F37
    { id: 'dye:CLOTH:cobalt',    label: 'Cobalt',   group: 'cloth', dyeSlot: 'CLOTH', color: { h:  72, s:  1.67, v: -0.15 } }, // #0047AB
    // Earth & brown additions
    { id: 'dye:CLOTH:saddlebrown', label: 'Brown',  group: 'cloth', dyeSlot: 'CLOTH', color: { h:-118, s:  1.30, v: -0.31 } }, // #8B4513
    { id: 'dye:CLOTH:rust',      label: 'Rust',     group: 'cloth', dyeSlot: 'CLOTH', color: { h:-125, s:  1.46, v: -0.08 } }, // #B7410E
    { id: 'dye:CLOTH:sand',      label: 'Sand',     group: 'cloth', dyeSlot: 'CLOTH', color: { h:-109, s: -0.11, v:  0.05 } }, // #D2B48C
    { id: 'dye:CLOTH:sienna',    label: 'Sienna',   group: 'cloth', dyeSlot: 'CLOTH', color: { h:-124, s:  0.92, v: -0.20 } }, // #A0522D

    // ── Rigid fiber — natural plant-fiber tones (used by kasas) ─────────────
    { id: 'mat:rigid_fiber:straw',  label: 'Straw',        group: 'rigid_fiber', color: { h: -97, s: -0.03, v:  0.14 } }, // #E4D191
    { id: 'mat:rigid_fiber:reed',   label: 'Dried Reed',   group: 'rigid_fiber', color: { h:-106, s:  0.38, v: -0.04 } }, // #BF9A5C
    { id: 'mat:rigid_fiber:pale',   label: 'Pale Fiber',   group: 'rigid_fiber', color: { h:-100, s: -0.45, v:  0.06 } }, // #D4C8A8
    { id: 'mat:rigid_fiber:tawny',  label: 'Tawny Reed',   group: 'rigid_fiber', color: { h:-104, s:  0.64, v: -0.22 } }, // #9C7A3C
    { id: 'mat:rigid_fiber:shadow', label: 'Shadow Fiber', group: 'rigid_fiber', color: { h:-115, s: -0.21, v: -0.42 } }, // #736151
    { id: 'mat:rigid_fiber:marsh',  label: 'Marsh Reed',   group: 'rigid_fiber', color: { h: -60, s: -0.16, v: -0.21 } }, // #8B9E6C

    // ── Metal — pre-iron-age metals and alloys ───────────────────────────────
    { id: 'mat:metal:copper',    label: 'Copper',    group: 'metal', color: { h:-114, s:  0.93, v: -0.08 } }, // #B87333
    { id: 'mat:metal:bronze',    label: 'Bronze',    group: 'metal', color: { h:-113, s:  1.02, v:  0.03 } }, // #CD7F32
    { id: 'mat:metal:tin',       label: 'Tin',       group: 'metal', color: { h:   0, s: -1.00, v:  0.08 } }, // #D8D8D8
    { id: 'mat:metal:gold',      label: 'Gold',      group: 'metal', color: { h: -93, s:  1.67, v:  0.27 } }, // #FFD700
    { id: 'mat:metal:silver',    label: 'Silver',    group: 'metal', color: { h:   0, s: -1.00, v: -0.04 } }, // #C0C0C0
    { id: 'mat:metal:electrum',  label: 'Electrum',  group: 'metal', color: { h: -97, s:  0.97, v:  0.06 } }, // #D4AF37

    // ── Wood — natural and exotic timbers (bronzewood = ironwood) ────────────
    { id: 'mat:wood:oak',        label: 'Oak',         group: 'wood', color: { h:-102, s:  0.72, v:  0.06 } }, // #D4A84B
    { id: 'mat:wood:walnut',     label: 'Dark Walnut', group: 'wood', color: { h:-119, s:  1.00, v: -0.54 } }, // #5C3317
    { id: 'mat:wood:cedar',      label: 'Cedar',       group: 'wood', color: { h:-112, s:  1.20, v: -0.02 } }, // #C47722
    { id: 'mat:wood:ebony',      label: 'Ebony',       group: 'wood', color: { h:-116, s:  1.67, v: -0.69 } }, // #3E1C00
    { id: 'mat:wood:bronzewood', label: 'Bronzewood',  group: 'wood', color: { h:-111, s:  0.43, v: -0.20 } }, // #A0784A
    { id: 'mat:wood:birch',      label: 'Birch',       group: 'wood', color: { h:-103, s: -0.51, v:  0.23 } }, // #F5E6C8

    // ── Chitin — insect/crustacean carapace tones ────────────────────────────
    { id: 'mat:chitin:amber',    label: 'Amber',       group: 'chitin', color: { h:-108, s:  1.06, v:  0.06 } }, // #D49030
    { id: 'mat:chitin:horn',     label: 'Horn',        group: 'chitin', color: { h:-105, s:  0.16, v: -0.23 } }, // #9A8257
    { id: 'mat:chitin:dark',     label: 'Dark Chitin', group: 'chitin', color: { h:-119, s:  0.31, v: -0.70 } }, // #3D2B1F
    { id: 'mat:chitin:sandy',    label: 'Sandy',       group: 'chitin', color: { h:-106, s: -0.13, v:  0.03 } }, // #CDB38A
    { id: 'mat:chitin:night',    label: 'Night',       group: 'chitin', color: { h:  90, s: -0.53, v: -0.74 } }, // #2A2B33

    // ── Leather — tanned hide tones ──────────────────────────────────────────
    { id: 'mat:leather:tan',     label: 'Natural Tan',   group: 'leather', color: { h:-109, s: -0.11, v:  0.05 } }, // #D2B48C
    { id: 'mat:leather:saddle',  label: 'Saddle Brown',  group: 'leather', color: { h:-118, s:  1.30, v: -0.31 } }, // #8B4513
    { id: 'mat:leather:chestnut',label: 'Chestnut',      group: 'leather', color: { h:-133, s:  0.72, v: -0.25 } }, // #954535
    { id: 'mat:leather:dark',    label: 'Dark Leather',  group: 'leather', color: { h:-113, s:  0.49, v: -0.62 } }, // #4B3621
    { id: 'mat:leather:cognac',  label: 'Cognac',        group: 'leather', color: { h:-137, s:  0.61, v: -0.23 } }, // #9A463D
    { id: 'mat:leather:cream',   label: 'Cream Leather', group: 'leather', color: { h:-104, s: -0.28, v:  0.23 } }, // #F5DEB3
    { id: 'mat:leather:umber',   label: 'Umber',         group: 'leather', color: { h:-117, s:  0.72, v: -0.56 } }, // #6B4A2F
    { id: 'mat:leather:bark',    label: 'Bark Brown',    group: 'leather', color: { h:-121, s:  0.58, v: -0.64 } }, // #5A3D2B
    { id: 'mat:leather:peat',    label: 'Peat',          group: 'leather', color: { h:-126, s:  0.41, v: -0.72 } }, // #47362C
    { id: 'mat:leather:moss',    label: 'Mossed Hide',   group: 'leather', color: { h:-86,  s:  0.36, v: -0.60 } }, // #4E4A31

    // ── Fur — natural animal-pelt tones ─────────────────────────────────────
    { id: 'mat:fur:snow',     label: 'Snow White',   group: 'fur', color: { h:   0, s: -0.95, v:  0.27 } }, // #FFFAFA
    { id: 'mat:fur:cream',    label: 'Cream',        group: 'fur', color: { h: -95, s: -0.73, v:  0.23 } }, // #F5F0DC
    { id: 'mat:fur:tawny',    label: 'Tawny',        group: 'fur', color: { h:-118, s:  0.80, v:  0.00 } }, // #C87941
    { id: 'mat:fur:russet',   label: 'Russet',       group: 'fur', color: { h:-126, s:  1.06, v: -0.23 } }, // #9B4523
    { id: 'mat:fur:grey',     label: 'Wolf Grey',    group: 'fur', color: { h:   0, s: -1.00, v: -0.36 } }, // #808080
    { id: 'mat:fur:midnight', label: 'Midnight',     group: 'fur', color: { h:   0, s: -1.00, v: -0.86 } }, // #1C1C1C

    // ── Bamboo — cane tones ──────────────────────────────────────────────────
    { id: 'mat:bamboo:green',  label: 'Green Bamboo',  group: 'bamboo', color: { h: -23, s:  0.33, v: -0.39 } }, // #3D7A3D
    { id: 'mat:bamboo:aged',   label: 'Aged Bamboo',   group: 'bamboo', color: { h:-107, s:  0.02, v:  0.06 } }, // #D4B483
    { id: 'mat:bamboo:young',  label: 'Young Bamboo',  group: 'bamboo', color: { h: -55, s:  0.33, v: -0.08 } }, // #8DB85C
    { id: 'mat:bamboo:black',  label: 'Black Bamboo',  group: 'bamboo', color: { h: -68, s: -0.54, v: -0.77 } }, // #2C2E26
    { id: 'mat:bamboo:smoked', label: 'Smoked Bamboo', group: 'bamboo', color: { h:-110, s:  0.04, v: -0.31 } }, // #8B7355
  ];

  // Starter dyes given to every new account
  const STARTER_DYE_IDS = DYE_CATALOG.map(d => d.id);

  function defaultAppearance() {
    return {
      speciesId: 'mao-ao',
      gender: 'male',
      cosmetics: {},
      bodyColors: {
        A: { h: 0,   s: -0.70, v: -0.30 },
        B: { h: 0,   s: -0.70, v: -0.50 },
        C: { h: 0,   s: -0.65, v: -0.15 },
      },
    };
  }


  function trickBoneConfig() {
    const cfg = window.SCRATCHBONES_CONFIG?.game?.trickBones || {};
    const definitions = cfg.definitions || {};
    const ids = Object.keys(definitions);
    const loadoutSize = Math.max(1, Number(cfg.loadoutSize) || 6);
    const defaultUnlocked = Array.isArray(cfg.defaultUnlocked) && cfg.defaultUnlocked.length ? cfg.defaultUnlocked : ids;
    const defaultLoadout = Array.isArray(cfg.defaultLoadout) && cfg.defaultLoadout.length ? cfg.defaultLoadout : defaultUnlocked;
    return { definitions, ids, loadoutSize, defaultUnlocked, defaultLoadout };
  }

  function normalizeUnlockedTrickBones(ids) {
    const cfg = trickBoneConfig();
    const validIds = new Set(cfg.ids);
    const source = Array.isArray(ids) ? ids : cfg.defaultUnlocked;
    const result = [];
    for (const rawId of source) {
      const id = String(rawId || '').trim();
      if (validIds.has(id) && !result.includes(id)) result.push(id);
    }
    return result;
  }

  function normalizeTrickLoadout(loadout, unlocked = null) {
    const cfg = trickBoneConfig();
    const unlockedIds = normalizeUnlockedTrickBones(unlocked);
    const unlockedSet = new Set(unlockedIds);
    const source = Array.isArray(loadout) ? loadout : cfg.defaultLoadout;
    const result = [];
    for (const rawId of source) {
      const id = String(rawId || '').trim();
      if (unlockedSet.has(id)) result.push(id);
      if (result.length >= cfg.loadoutSize) break;
    }
    for (const rawId of cfg.defaultLoadout) {
      if (result.length >= cfg.loadoutSize) break;
      const id = String(rawId || '').trim();
      if (unlockedSet.has(id)) result.push(id);
    }
    for (const id of unlockedIds) {
      if (result.length >= cfg.loadoutSize) break;
      result.push(id);
    }
    return result.slice(0, cfg.loadoutSize);
  }

  function normalizeAppearance(appearance) {
    const base = defaultAppearance();
    const source = appearance || {};
    return {
      speciesId: source.speciesId || base.speciesId,
      gender:    source.gender    || base.gender,
      cosmetics: { ...(source.cosmetics || {}) },
      bodyColors: {
        ...base.bodyColors,
        ...(source.bodyColors || {}),
      },
    };
  }

  function normalizeAppliedDyes(rawDyes) {
    const source = rawDyes || {};
    const dyeValuesAreObjects = Object.values(source).some(v => v !== null && typeof v === 'object');
    const hasBodyChannels = ['A', 'B', 'C'].some(ch => ch in source);
    return (dyeValuesAreObjects || hasBodyChannels) ? {} : { ...source };
  }

  function migrateAppearanceCosmeticIds(appearance) {
    const normalized = normalizeAppearance(appearance);
    const migratedCosmetics = {};
    for (const [slot, id] of Object.entries(normalized.cosmetics || {})) {
      migratedCosmetics[slot] = id ? migrateId(id) : id;
    }
    normalized.cosmetics = migratedCosmetics;
    return normalized;
  }

  function makeKhymeryyanId() {
    if (window.crypto?.randomUUID) return window.crypto.randomUUID();
    return `khym-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  }

  function sanitizeName(name, fallback = 'Player') {
    return String(name || '').trim().slice(0, 24) || fallback;
  }

  function normalizeKhymeryyan(raw = {}, fallbackName = 'Player', unlockedTrickBones = null) {
    const unlocked = normalizeUnlockedTrickBones(unlockedTrickBones);
    return {
      id: String(raw.id || makeKhymeryyanId()),
      name: sanitizeName(raw.name ?? raw.username, fallbackName),
      appearance: migrateAppearanceCosmeticIds(raw.appearance),
      equippedCosmetics: migrateIdArray(raw.equippedCosmetics || []),
      appliedDyes: normalizeAppliedDyes(raw.appliedDyes || {}),
      trickBoneLoadout: normalizeTrickLoadout(raw.trickBoneLoadout, unlocked),
    };
  }

  function cloneKhymeryyan(k) {
    return k ? {
      id: k.id,
      name: k.name,
      appearance: normalizeAppearance(k.appearance),
      equippedCosmetics: [...(k.equippedCosmetics || [])],
      appliedDyes: { ...(k.appliedDyes || {}) },
      trickBoneLoadout: [...(k.trickBoneLoadout || [])],
    } : null;
  }

  function defaultAccount() {
    return {
      bronze: BRONZE_PASSIVE_MAX,
      bronzePassiveLastMs: Date.now(),
      unlockedCosmetics: [],
      ownedDyes: [...STARTER_DYE_IDS],
      unlockedTrickBones: normalizeUnlockedTrickBones(),
      khymeryyans: [],
      activeKhymeryyanId: null,
      createdAt: Date.now(),
    };
  }

  function accountWithStarterKhymeryyan(name = 'Player') {
    const acc = defaultAccount();
    const khymeryyan = normalizeKhymeryyan({ name }, name, acc.unlockedTrickBones);
    acc.khymeryyans = [khymeryyan];
    acc.activeKhymeryyanId = khymeryyan.id;
    return acc;
  }

  let _account = null;

  function normalizeAccount(parsed = null) {
    const base = defaultAccount();
    if (!parsed) return base;
    const acc = { ...base, ...parsed };

    acc.unlockedCosmetics = migrateIdArray(acc.unlockedCosmetics || []);
    acc.unlockedTrickBones = normalizeUnlockedTrickBones(acc.unlockedTrickBones);

    if (!acc.ownedDyes || !acc.ownedDyes.length) {
      acc.ownedDyes = [...STARTER_DYE_IDS];
    } else {
      const currentOwned = new Set(acc.ownedDyes);
      const newDyes = STARTER_DYE_IDS.filter(id => !currentOwned.has(id));
      if (newDyes.length) acc.ownedDyes = [...acc.ownedDyes, ...newDyes];
    }

    if (Array.isArray(parsed.khymeryyans)) {
      acc.khymeryyans = parsed.khymeryyans.map((kh, index) =>
        normalizeKhymeryyan(kh, index === 0 ? 'Player' : `Khymeryyan ${index + 1}`, acc.unlockedTrickBones)
      );
    } else {
      // Legacy sb_account_v1 migration: username/appearance/equips/dyes/loadout become one Khymeryyan.
      const legacyName = sanitizeName(parsed.username, 'Player');
      acc.khymeryyans = [normalizeKhymeryyan({
        id: parsed.activeKhymeryyanId,
        name: legacyName,
        appearance: parsed.appearance,
        equippedCosmetics: parsed.equippedCosmetics,
        appliedDyes: parsed.appliedDyes,
        trickBoneLoadout: parsed.trickBoneLoadout,
      }, legacyName, acc.unlockedTrickBones)];
    }

    const activeExists = acc.khymeryyans.some(kh => kh.id === acc.activeKhymeryyanId);
    acc.activeKhymeryyanId = activeExists ? acc.activeKhymeryyanId : (acc.khymeryyans[0]?.id || null);

    // Remove legacy per-profile top-level fields from the persisted shape.
    delete acc.username;
    delete acc.appearance;
    delete acc.equippedCosmetics;
    delete acc.appliedDyes;
    delete acc.trickBoneLoadout;

    return acc;
  }

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      _account = raw ? normalizeAccount(JSON.parse(raw)) : defaultAccount();
    } catch (_) {
      _account = defaultAccount();
    }
    tickPassiveIncome();
    save();
    return _account;
  }

  function save() {
    if (!_account) return;
    try { localStorage.setItem(SAVE_KEY, JSON.stringify(_account)); } catch (_) {}
  }

  function getAccount() {
    if (!_account) load();
    return _account;
  }

  function getActiveKhymeryyanRef() {
    const acc = getAccount();
    let active = acc.khymeryyans.find(kh => kh.id === acc.activeKhymeryyanId) || acc.khymeryyans[0] || null;
    if (!active && acc.khymeryyans.length === 0) return null;
    if (active && acc.activeKhymeryyanId !== active.id) {
      acc.activeKhymeryyanId = active.id;
      save();
    }
    return active;
  }

  function isCreated() { return getAccount().khymeryyans.length > 0; }

  function createAccount(username) {
    _account = accountWithStarterKhymeryyan(username);
    save();
    return _account;
  }

  function getKhymeryyans() {
    return getAccount().khymeryyans.map(cloneKhymeryyan);
  }

  function getActiveKhymeryyan() {
    return cloneKhymeryyan(getActiveKhymeryyanRef());
  }

  function setActiveKhymeryyan(id) {
    const acc = getAccount();
    const khymeryyan = acc.khymeryyans.find(kh => kh.id === id);
    if (!khymeryyan) return false;
    acc.activeKhymeryyanId = khymeryyan.id;
    save();
    return true;
  }

  function createKhymeryyan(name, options = {}) {
    const acc = getAccount();
    const source = options.sourceKhymeryyan || {};
    const fallbackName = `Khymeryyan ${acc.khymeryyans.length + 1}`;
    const khymeryyan = normalizeKhymeryyan({
      ...source,
      id: makeKhymeryyanId(),
      name: sanitizeName(name ?? source.name, fallbackName),
      appearance: options.appearance || source.appearance || defaultAppearance(),
      equippedCosmetics: options.equippedCosmetics || source.equippedCosmetics || [],
      appliedDyes: options.appliedDyes || source.appliedDyes || {},
      trickBoneLoadout: options.trickBoneLoadout || source.trickBoneLoadout,
    }, fallbackName, acc.unlockedTrickBones);
    acc.khymeryyans.push(khymeryyan);
    if (options.makeActive !== false) acc.activeKhymeryyanId = khymeryyan.id;
    save();
    return cloneKhymeryyan(khymeryyan);
  }

  function deleteKhymeryyan(id) {
    const acc = getAccount();
    if (acc.khymeryyans.length <= 1) return false;
    const index = acc.khymeryyans.findIndex(kh => kh.id === id);
    if (index < 0) return false;
    const [removed] = acc.khymeryyans.splice(index, 1);
    if (acc.activeKhymeryyanId === removed.id) {
      acc.activeKhymeryyanId = acc.khymeryyans[Math.max(0, index - 1)]?.id || acc.khymeryyans[0]?.id || null;
    }
    save();
    return true;
  }

  function renameKhymeryyan(id, name) {
    const acc = getAccount();
    const khymeryyan = acc.khymeryyans.find(kh => kh.id === id);
    if (!khymeryyan) return false;
    const trimmed = sanitizeName(name, '');
    if (!trimmed) return false;
    khymeryyan.name = trimmed;
    save();
    return true;
  }

  function setKhymeryyanAppearance(id, appearance) {
    const acc = getAccount();
    const khymeryyan = acc.khymeryyans.find(kh => kh.id === id);
    if (!khymeryyan) return false;
    khymeryyan.appearance = normalizeAppearance(appearance);
    save();
    return true;
  }

  function setKhymeryyanEquippedCosmetics(id, equippedCosmetics) {
    const acc = getAccount();
    const khymeryyan = acc.khymeryyans.find(kh => kh.id === id);
    if (!khymeryyan || !Array.isArray(equippedCosmetics)) return false;
    khymeryyan.equippedCosmetics = migrateIdArray(equippedCosmetics);
    save();
    return true;
  }

  function setKhymeryyanAppliedDyes(id, appliedDyes) {
    const acc = getAccount();
    const khymeryyan = acc.khymeryyans.find(kh => kh.id === id);
    if (!khymeryyan) return false;
    khymeryyan.appliedDyes = normalizeAppliedDyes(appliedDyes || {});
    save();
    return true;
  }

  function setKhymeryyanTrickBoneLoadout(id, loadout) {
    const acc = getAccount();
    const khymeryyan = acc.khymeryyans.find(kh => kh.id === id);
    if (!khymeryyan) return false;
    const normalized = normalizeTrickLoadout(loadout, acc.unlockedTrickBones);
    if (normalized.length !== trickBoneConfig().loadoutSize) return false;
    khymeryyan.trickBoneLoadout = normalized;
    save();
    return true;
  }

  function getUsername() { return getActiveKhymeryyanRef()?.name || 'Player'; }

  function setUsername(username) {
    const active = getActiveKhymeryyanRef();
    if (!active) return;
    const trimmed = sanitizeName(username, '');
    if (trimmed) { active.name = trimmed; save(); }
  }
  function getBronze()   { return getAccount().bronze; }

  function addBronze(amount) {
    const acc = getAccount();
    acc.bronze = Math.max(0, acc.bronze + Math.floor(amount));
    save();
    return acc.bronze;
  }

  function spendBronze(amount) {
    const acc = getAccount();
    if (acc.bronze < amount) return false;
    acc.bronze -= amount;
    save();
    return true;
  }

  function tickPassiveIncome() {
    const acc = getAccount();
    const now = Date.now();
    const elapsedMs = now - (acc.bronzePassiveLastMs || now);
    if (elapsedMs <= 0) return 0;
    const gained = Math.floor(elapsedMs / BRONZE_PASSIVE_RATE_MS);
    const deficit = Math.max(0, BRONZE_PASSIVE_MAX - acc.bronze);
    const toAdd = Math.min(gained, deficit);
    if (gained > 0) {
      acc.bronze += toAdd;
      acc.bronzePassiveLastMs = now - (elapsedMs % BRONZE_PASSIVE_RATE_MS);
      save();
    }
    return toAdd;
  }

  function watchAd() {
    const acc = getAccount();
    acc.bronze = Math.max(acc.bronze, BRONZE_PASSIVE_MAX);
    save();
    return acc.bronze;
  }

  function getUnlockedCosmetics() { return [...(getAccount().unlockedCosmetics || [])]; }
  function getEquippedCosmetics() { return [...(getActiveKhymeryyanRef()?.equippedCosmetics || [])]; }
  function isUnlocked(id) { return ownsCosmeticGroup(getAccount(), id); }
  function isEquipped(id) { return getEquippedCosmetics().includes(id); }

  function getEquippedForCategory(category) {
    for (const id of getEquippedCosmetics()) {
      const entry = SHOP_CATALOG.find(c => c.id === id);
      if (entry && entry.category === category) return id;
    }
    return null;
  }

  function getAppearance() {
    return getActiveKhymeryyanRef()?.appearance || defaultAppearance();
  }

  function setAppearance(appearance) {
    const active = getActiveKhymeryyanRef();
    if (!active) return;
    active.appearance = normalizeAppearance(appearance);
    save();
  }

  function buyCosmetic(cosmeticId) {
    const item = SHOP_CATALOG.find(c => c.id === cosmeticId);
    if (!item) return { ok: false, error: 'Unknown cosmetic' };
    const acc = getAccount();
    if (ownsCosmeticGroup(acc, cosmeticId)) return { ok: false, error: 'Already owned' };
    if (acc.bronze < item.price) return { ok: false, error: 'Not enough Bronze' };
    acc.bronze -= item.price;
    acc.unlockedCosmetics.push(cosmeticId);
    save();
    return { ok: true };
  }

  function equipCosmetic(cosmeticId) {
    const acc = getAccount();
    const active = getActiveKhymeryyanRef();
    if (!active) return false;
    if (!ownsCosmeticGroup(acc, cosmeticId)) return false;
    const item = SHOP_CATALOG.find(c => c.id === cosmeticId);
    if (!item) return false;
    active.equippedCosmetics = (active.equippedCosmetics || []).filter(id => {
      const e = SHOP_CATALOG.find(c => c.id === id);
      return !e || e.category !== item.category;
    });
    active.equippedCosmetics.push(cosmeticId);
    save();
    return true;
  }

  function unequipCosmetic(cosmeticId) {
    const active = getActiveKhymeryyanRef();
    if (!active) return false;
    const target = findShopItem(cosmeticId);
    if (!target) return false;
    const targetKey = cosmeticEntitlementKey(target);
    active.equippedCosmetics = (active.equippedCosmetics || []).filter(id => {
      const entry = findShopItem(id);
      return !entry || cosmeticEntitlementKey(entry) !== targetKey;
    });
    save();
    return true;
  }


  // ── Trick bone loadout API ─────────────────────────────────

  function getTrickBoneDefinitions() { return { ...trickBoneConfig().definitions }; }
  function getTrickBoneLoadoutSize() { return trickBoneConfig().loadoutSize; }
  function getUnlockedTrickBones() { return [...(getAccount().unlockedTrickBones || [])]; }
  function getTrickBoneLoadout() { return normalizeTrickLoadout(getActiveKhymeryyanRef()?.trickBoneLoadout, getAccount().unlockedTrickBones); }
  function isTrickBoneUnlocked(id) { return getUnlockedTrickBones().includes(id); }

  function unlockTrickBone(id) {
    const acc = getAccount();
    const normalized = normalizeUnlockedTrickBones([...(acc.unlockedTrickBones || []), id]);
    if (normalized.length === (acc.unlockedTrickBones || []).length) return false;
    acc.unlockedTrickBones = normalized;
    acc.khymeryyans.forEach(kh => { kh.trickBoneLoadout = normalizeTrickLoadout(kh.trickBoneLoadout, acc.unlockedTrickBones); });
    save();
    return true;
  }

  function setTrickBoneLoadout(loadout) {
    const active = getActiveKhymeryyanRef();
    return active ? setKhymeryyanTrickBoneLoadout(active.id, loadout) : false;
  }

  function setTrickBoneLoadoutSlot(slotIndex, trickId) {
    const index = Number(slotIndex);
    if (!Number.isInteger(index) || index < 0 || index >= trickBoneConfig().loadoutSize) return false;
    if (!isTrickBoneUnlocked(trickId)) return false;
    const loadout = getTrickBoneLoadout();
    loadout[index] = String(trickId);
    return setTrickBoneLoadout(loadout);
  }

  // ── Dye API ────────────────────────────────────────────────

  function getDyeCatalog() { return DYE_CATALOG; }
  function getOwnedDyes()  { return [...(getAccount().ownedDyes || [])]; }
  function isDyeOwned(id)  { return (getAccount().ownedDyes || []).includes(id); }

  function getAppliedDyes() {
    return getActiveKhymeryyanRef()?.appliedDyes || {};
  }

  function applyDye(dyeId, tintKey) {
    if (!tintKey || typeof tintKey !== 'string') return false;
    const acc = getAccount();
    const active = getActiveKhymeryyanRef();
    if (!active) return false;
    if (!(acc.ownedDyes || []).includes(dyeId)) return false;
    if (!DYE_CATALOG.find(d => d.id === dyeId)) return false;
    active.appliedDyes = { ...(active.appliedDyes || {}), [tintKey]: dyeId };
    save();
    return true;
  }

  function removeDye(dyeSlot) {
    const active = getActiveKhymeryyanRef();
    if (!active) return;
    active.appliedDyes = { ...(active.appliedDyes || {}) };
    delete active.appliedDyes[dyeSlot];
    save();
  }

  // ── Shop helpers ───────────────────────────────────────────

  function getShopCatalog() { return SHOP_CATALOG; }

  function getShopCatalogForAppearance(speciesId, gender) {
    return SHOP_CATALOG.filter(item => {
      if (!item.species) return true;
      if (item.species !== speciesId) return false;
      if (item.gender && item.gender !== gender) return false;
      return true;
    });
  }

  window.ScratchbonesAccount = {
    load,
    save,
    isCreated,
    createAccount,
    getKhymeryyans,
    getActiveKhymeryyan,
    setActiveKhymeryyan,
    createKhymeryyan,
    deleteKhymeryyan,
    renameKhymeryyan,
    setKhymeryyanAppearance,
    setKhymeryyanEquippedCosmetics,
    setKhymeryyanAppliedDyes,
    setKhymeryyanTrickBoneLoadout,
    getUsername,
    setUsername,
    getBronze,
    addBronze,
    spendBronze,
    tickPassiveIncome,
    watchAd,
    getUnlockedCosmetics,
    getEquippedCosmetics,
    getEquippedForCategory,
    getAppearance,
    setAppearance,
    isUnlocked,
    isEquipped,
    buyCosmetic,
    equipCosmetic,
    unequipCosmetic,
    getTrickBoneDefinitions,
    getTrickBoneLoadoutSize,
    getUnlockedTrickBones,
    getTrickBoneLoadout,
    isTrickBoneUnlocked,
    unlockTrickBone,
    setTrickBoneLoadout,
    setTrickBoneLoadoutSlot,
    getDyeCatalog,
    getOwnedDyes,
    isDyeOwned,
    getAppliedDyes,
    applyDye,
    removeDye,
    getShopCatalog,
    getShopCatalogForAppearance,
    BRONZE_PASSIVE_MAX,
    BRONZE_PASSIVE_RATE_MS,
  };
})();
