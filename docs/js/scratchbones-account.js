(function () {
  'use strict';

  const SAVE_KEY = 'sb_account_v1';
  const BRONZE_PASSIVE_MAX = 30;
  const BRONZE_PASSIVE_RATE_MS = 5 * 60 * 1000; // 1 bronze per 5 minutes

  // Cosmetics available in the shop. IDs match the cosmetics/index.json entries.
  const SHOP_CATALOG = [
    { id: 'appearance::hat::basic_headband',      label: 'Basic Headband',          price: 5,  category: 'hat',        description: 'A simple cloth headband.' },
    { id: 'appearance::hat::riverlandskasa_low',  label: 'Riverland Kasa (Low)',    price: 10, category: 'hat',        description: 'Traditional riverland hat, worn low.' },
    { id: 'appearance::hat::riverlandskasa_tight',label: 'Riverland Kasa (Tight)',  price: 10, category: 'hat',        description: 'Traditional riverland hat, tight fit.' },
    { id: 'appearance::hat::riverlandskasa_wide', label: 'Riverland Kasa (Wide)',   price: 10, category: 'hat',        description: 'Traditional riverland hat, wide brim.' },
    { id: 'citywatch_helmet',                     label: 'City Watch Helmet',        price: 25, category: 'hat',        description: 'Official helmet of the city watch.' },
    { id: 'simple_poncho',                        label: 'Simple Poncho',            price: 8,  category: 'overwear',   description: 'A plain woven poncho.' },
    { id: 'anuri_poncho',                         label: 'Anuri Poncho',             price: 15, category: 'overwear',   description: 'Colorful poncho from Anuri traders.' },
    { id: 'anuri_hood',                           label: 'Anuri Hood',               price: 15, category: 'overwear',   description: 'Hooded cloak from Anuri traders.' },
    { id: 'layered_travel_cloak',                 label: 'Travel Cloak',             price: 20, category: 'overwear',   description: 'Layered cloak for long journeys.' },
    { id: 'bronze_armbands',                      label: 'Bronze Armbands',          price: 12, category: 'accessory',  description: 'Polished bronze armbands.' },
    { id: 'bronze_footbands',                     label: 'Bronze Footbands',         price: 12, category: 'accessory',  description: 'Polished bronze footbands.' },
  ];

  function defaultAccount() {
    return {
      username: null,
      bronze: BRONZE_PASSIVE_MAX,
      bronzePassiveLastMs: Date.now(),
      unlockedCosmetics: [],
      equippedCosmetics: [],
      createdAt: Date.now(),
    };
  }

  let _account = null;

  function load() {
    try {
      const raw = localStorage.getItem(SAVE_KEY);
      _account = raw ? { ...defaultAccount(), ...JSON.parse(raw) } : defaultAccount();
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

  // Placeholder: instantly fill Bronze up to passive max.
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

  function getShopCatalog() { return SHOP_CATALOG; }

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
    isUnlocked,
    isEquipped,
    buyCosmetic,
    equipCosmetic,
    unequipCosmetic,
    getShopCatalog,
    BRONZE_PASSIVE_MAX,
    BRONZE_PASSIVE_RATE_MS,
  };
})();
