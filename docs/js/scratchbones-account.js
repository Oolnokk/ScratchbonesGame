(function () {
  'use strict';

  const SAVE_KEY = 'sb_account_v1';
  const BRONZE_PASSIVE_MAX = 30;
  const BRONZE_PASSIVE_RATE_MS = 5 * 60 * 1000; // 1 bronze per 5 minutes

  // NPC-usable cosmetics available for purchase.
  // Items tagged species/gender are only shown when the player matches.
  const SHOP_CATALOG = [
    // Hats — universal
    { id: 'appearance::hat::basic_headband',      label: 'Basic Headband',       price: 5,  category: 'hat',     description: 'A simple cloth headband.' },
    { id: 'appearance::hat::riverlandskasa_low',  label: 'Riverland Kasa (Low)', price: 10, category: 'hat',     description: 'Traditional riverland hat, worn low.' },
    { id: 'appearance::hat::riverlandskasa_wide', label: 'Riverland Kasa (Wide)',price: 10, category: 'hat',     description: 'Traditional riverland hat, wide brim.' },
    // Torso — species+gender specific
    { id: 'tankantunic_mao-ao_m',  label: 'Tankan Tunic',  price: 12, category: 'torso',   species: 'mao-ao',    gender: 'male',   description: 'A fitted tankan-style tunic.' },
    { id: 'tankantunic_mao-ao_f',  label: 'Tankan Tunic',  price: 12, category: 'torso',   species: 'mao-ao',    gender: 'female', description: 'A fitted tankan-style tunic.' },
    { id: 'tankantunic_tl_m',      label: 'Tankan Tunic',  price: 12, category: 'torso',   species: 'tletingan', gender: 'male',   description: 'A fitted tankan-style tunic.' },
    { id: 'tankantunic_kenk_m',    label: 'Tankan Tunic',  price: 12, category: 'torso',   species: 'kenkari',   gender: 'male',   description: 'A fitted tankan-style tunic.' },
    { id: 'tankantunic_kenk_f',    label: 'Tankan Tunic',  price: 12, category: 'torso',   species: 'kenkari',   gender: 'female', description: 'A fitted tankan-style tunic.' },
    { id: 'bandolier1_mao-ao_m',   label: 'Bandolier',     price: 8,  category: 'torso',   species: 'mao-ao',    gender: 'male',   description: 'A rugged leather bandolier.' },
    { id: 'bandolier1_mao-ao_f',   label: 'Bandolier',     price: 8,  category: 'torso',   species: 'mao-ao',    gender: 'female', description: 'A rugged leather bandolier.' },
    { id: 'bandolier1_tl_m',       label: 'Bandolier',     price: 8,  category: 'torso',   species: 'tletingan', gender: 'male',   description: 'A rugged leather bandolier.' },
    { id: 'bandolier1_kenk_m',     label: 'Bandolier',     price: 8,  category: 'torso',   species: 'kenkari',   gender: 'male',   description: 'A rugged leather bandolier.' },
    { id: 'bandolier1_kenk_f',     label: 'Bandolier',     price: 8,  category: 'torso',   species: 'kenkari',   gender: 'female', description: 'A rugged leather bandolier.' },
    // Overwear — species+gender specific
    { id: 'tankanbodywrap_mao-ao', label: 'Tankan Bodywrap',price: 15, category: 'overwear', species: 'mao-ao',   gender: null,     description: 'A wrapped ceremonial bodywrap.' },
    { id: 'tankanbodywrap_tl_m',   label: 'Tankan Bodywrap',price: 15, category: 'overwear', species: 'tletingan',gender: 'male',   description: 'A wrapped ceremonial bodywrap.' },
    { id: 'tankanbodywrap_kenk_m', label: 'Tankan Bodywrap',price: 15, category: 'overwear', species: 'kenkari',  gender: 'male',   description: 'A wrapped ceremonial bodywrap.' },
    { id: 'tankanwrap_kenk_f',     label: 'Tankan Wrap',    price: 15, category: 'overwear', species: 'kenkari',  gender: 'female', description: 'A wrapped ceremonial garment.' },
  ];

  // Dyes set a bodyColor slot (CLOTH or HAT) to a specific tint.
  const DYE_CATALOG = [
    { id: 'dye:CLOTH:red',    label: 'Jade',      dyeSlot: 'CLOTH', color: { h: -20, s:  0.50, v: -0.30 } },
    { id: 'dye:CLOTH:orange', label: 'Teal',      dyeSlot: 'CLOTH', color: { h:  20, s:  0.80, v: -0.20 } },
    { id: 'dye:CLOTH:yellow', label: 'Azure',     dyeSlot: 'CLOTH', color: { h:  55, s:  0.70, v:  0.00 } },
    { id: 'dye:CLOTH:green',  label: 'Amethyst',  dyeSlot: 'CLOTH', color: { h: 120, s:  0.60, v: -0.30 } },
    { id: 'dye:CLOTH:blue',   label: 'Crimson',   dyeSlot: 'CLOTH', color: { h:-160, s:  0.70, v: -0.25 } },
    { id: 'dye:CLOTH:purple', label: 'Amber',     dyeSlot: 'CLOTH', color: { h:-100, s:  0.60, v: -0.25 } },
    { id: 'dye:CLOTH:brown',  label: 'Moss',      dyeSlot: 'CLOTH', color: { h: -30, s:  0.10, v: -0.50 } },
    { id: 'dye:CLOTH:black',  label: 'Onyx',      dyeSlot: 'CLOTH', color: { h:   0, s: -0.50, v: -0.80 } },
    { id: 'dye:CLOTH:white',  label: 'Mist',      dyeSlot: 'CLOTH', color: { h:   0, s: -0.80, v:  0.50 } },
    { id: 'dye:CLOTH:grey',   label: 'Sage',      dyeSlot: 'CLOTH', color: { h:   0, s: -0.70, v: -0.10 } },
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

  function defaultAccount() {
    return {
      username: null,
      bronze: BRONZE_PASSIVE_MAX,
      bronzePassiveLastMs: Date.now(),
      unlockedCosmetics: [],
      equippedCosmetics: [],
      ownedDyes: [...STARTER_DYE_IDS],
      appliedDyes: {},
      appearance: defaultAppearance(),
      createdAt: Date.now(),
    };
  }

  let _account = null;

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      const base = defaultAccount();
      if (raw) {
        const parsed = JSON.parse(raw);
        _account = { ...base, ...parsed };
        _account.appearance = { ...base.appearance, ...(parsed.appearance || {}) };
        _account.appearance.cosmetics = { ...(parsed.appearance?.cosmetics || {}) };
        _account.appearance.bodyColors = { ...base.appearance.bodyColors, ...(parsed.appearance?.bodyColors || {}) };
        // Migrate old color-object format and intermediate A/B/C-channel format
        const rawDyes = parsed.appliedDyes || {};
        const dyeValuesAreObjects = Object.values(rawDyes).some(v => v !== null && typeof v === 'object');
        const hasBodyChannels = ['A', 'B', 'C'].some(ch => ch in rawDyes);
        _account.appliedDyes = (dyeValuesAreObjects || hasBodyChannels) ? {} : { ...rawDyes };
        // Grant starter dyes to existing accounts that don't have them yet
        if (!_account.ownedDyes || !_account.ownedDyes.length) {
          _account.ownedDyes = [...STARTER_DYE_IDS];
        }
      } else {
        _account = base;
      }
    } catch (_) {
      _account = defaultAccount();
    }
    tickPassiveIncome();
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

  function isCreated() { return !!(getAccount().username); }

  function createAccount(username) {
    _account = defaultAccount();
    _account.username = String(username || '').trim().slice(0, 24) || 'Player';
    save();
    return _account;
  }

  function getUsername() { return getAccount().username || 'Player'; }
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
  function getEquippedCosmetics() { return [...(getAccount().equippedCosmetics || [])]; }
  function isUnlocked(id) { return getAccount().unlockedCosmetics.includes(id); }
  function isEquipped(id) { return getAccount().equippedCosmetics.includes(id); }

  function getEquippedForCategory(category) {
    for (const id of getAccount().equippedCosmetics) {
      const entry = SHOP_CATALOG.find(c => c.id === id);
      if (entry && entry.category === category) return id;
    }
    return null;
  }

  function getAppearance() {
    const acc = getAccount();
    return acc.appearance || defaultAppearance();
  }

  function setAppearance(appearance) {
    const acc = getAccount();
    acc.appearance = {
      speciesId: appearance.speciesId || 'mao-ao',
      gender:    appearance.gender    || 'male',
      cosmetics: { ...(appearance.cosmetics || {}) },
      bodyColors: {
        ...defaultAppearance().bodyColors,
        ...(appearance.bodyColors || {}),
      },
    };
    save();
  }

  function buyCosmetic(cosmeticId) {
    const item = SHOP_CATALOG.find(c => c.id === cosmeticId);
    if (!item) return { ok: false, error: 'Unknown cosmetic' };
    const acc = getAccount();
    if (acc.unlockedCosmetics.includes(cosmeticId)) return { ok: false, error: 'Already owned' };
    if (acc.bronze < item.price) return { ok: false, error: 'Not enough Bronze' };
    acc.bronze -= item.price;
    acc.unlockedCosmetics.push(cosmeticId);
    save();
    return { ok: true };
  }

  function equipCosmetic(cosmeticId) {
    const acc = getAccount();
    if (!acc.unlockedCosmetics.includes(cosmeticId)) return false;
    const item = SHOP_CATALOG.find(c => c.id === cosmeticId);
    if (!item) return false;
    acc.equippedCosmetics = acc.equippedCosmetics.filter(id => {
      const e = SHOP_CATALOG.find(c => c.id === id);
      return !e || e.category !== item.category;
    });
    acc.equippedCosmetics.push(cosmeticId);
    save();
    return true;
  }

  function unequipCosmetic(cosmeticId) {
    const acc = getAccount();
    acc.equippedCosmetics = acc.equippedCosmetics.filter(id => id !== cosmeticId);
    save();
    return true;
  }

  // ── Dye API ────────────────────────────────────────────────

  function getDyeCatalog() { return DYE_CATALOG; }
  function getOwnedDyes()  { return [...(getAccount().ownedDyes || [])]; }
  function isDyeOwned(id)  { return (getAccount().ownedDyes || []).includes(id); }

  function getAppliedDyes() {
    return getAccount().appliedDyes || {};
  }

  function applyDye(dyeId, tintKey) {
    if (!tintKey || typeof tintKey !== 'string') return false;
    const acc = getAccount();
    if (!(acc.ownedDyes || []).includes(dyeId)) return false;
    if (!DYE_CATALOG.find(d => d.id === dyeId)) return false;
    acc.appliedDyes = { ...(acc.appliedDyes || {}), [tintKey]: dyeId };
    save();
    return true;
  }

  function removeDye(dyeSlot) {
    const acc = getAccount();
    acc.appliedDyes = { ...(acc.appliedDyes || {}) };
    delete acc.appliedDyes[dyeSlot];
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
    getUsername,
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
