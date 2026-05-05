'use strict';

const { describe, it, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

// ── Loader helper ─────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');
const accountSrc = fs.readFileSync(path.join(ROOT, 'docs/js/scratchbones-account.js'), 'utf8');
const configSrc  = fs.readFileSync(path.join(ROOT, 'docs/config/scratchbones-config.js'), 'utf8');

/**
 * Converts a vm-context value (array or object) into a plain JS value so that
 * deepStrictEqual can compare it to an equivalent value from the host context.
 * Primitive values pass through unchanged.
 */
function toPlain(value) {
  if (value === null || value === undefined) return value;
  if (typeof value !== 'object') return value;
  return JSON.parse(JSON.stringify(value));
}

/**
 * Creates a fresh isolated sandbox with a local localStorage stub,
 * then loads the config and account module inside it.
 */
function makeSandbox() {
  const localStore = {};
  const sandbox = {
    Date,
    Math,
    Number,
    String,
    Array,
    Object,
    Set,
    JSON,
    console,
    localStorage: {
      getItem:    (k) => localStore[k] ?? null,
      setItem:    (k, v) => { localStore[k] = v; },
      removeItem: (k) => { delete localStore[k]; },
      _store:     localStore,
    },
    crypto: {
      randomUUID: (() => {
        let counter = 0;
        return () => `test-uuid-${++counter}`;
      })(),
    },
  };
  sandbox.window = sandbox;
  vm.runInNewContext(configSrc, sandbox);
  vm.runInNewContext(accountSrc, sandbox);
  return sandbox;
}

// ── Account creation ──────────────────────────────────────────────────────────

describe('account creation', () => {
  it('isCreated returns false before createAccount is called', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    assert.equal(acc.isCreated(), false);
  });

  it('createAccount makes isCreated return true', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('Player1');
    assert.equal(acc.isCreated(), true);
  });

  it('sets the username to the provided name', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('Takara');
    assert.equal(acc.getUsername(), 'Takara');
  });

  it('starts with BRONZE_PASSIVE_MAX bronze', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    assert.equal(acc.getBronze(), acc.BRONZE_PASSIVE_MAX);
  });

  it('starts with one khymeryyan matching the provided name', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('Nori');
    const chars = acc.getKhymeryyans();
    assert.equal(chars.length, 1);
    assert.equal(chars[0].name, 'Nori');
  });

  it('truncates long usernames to 24 characters', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('A'.repeat(50));
    assert.equal(acc.getUsername().length, 24);
  });

  it('uses "Player" as fallback when name is blank', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('');
    assert.equal(acc.getUsername(), 'Player');
  });
});

// ── setUsername ───────────────────────────────────────────────────────────────

describe('setUsername', () => {
  it('updates the active khymeryyan name', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('Old');
    acc.setUsername('New');
    assert.equal(acc.getUsername(), 'New');
  });

  it('ignores blank names', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('Keep');
    acc.setUsername('');
    assert.equal(acc.getUsername(), 'Keep');
  });

  it('truncates to 24 characters', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    acc.setUsername('B'.repeat(50));
    assert.equal(acc.getUsername().length, 24);
  });
});

// ── Bronze economy ────────────────────────────────────────────────────────────

describe('bronze economy', () => {
  it('addBronze increases the balance by the given amount', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const before = acc.getBronze();
    acc.addBronze(5);
    assert.equal(acc.getBronze(), before + 5);
  });

  it('addBronze floors fractional amounts', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const before = acc.getBronze();
    acc.addBronze(2.9);
    assert.equal(acc.getBronze(), before + 2);
  });

  it('addBronze clamps to zero for negative amounts', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const current = acc.getBronze();
    acc.addBronze(-1000);
    assert.equal(acc.getBronze(), 0);
  });

  it('spendBronze deducts the amount and returns true when sufficient', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    acc.addBronze(10);
    const before = acc.getBronze();
    const ok = acc.spendBronze(3);
    assert.equal(ok, true);
    assert.equal(acc.getBronze(), before - 3);
  });

  it('spendBronze returns false and does not deduct when insufficient', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const current = acc.getBronze();
    const ok = acc.spendBronze(current + 1);
    assert.equal(ok, false);
    assert.equal(acc.getBronze(), current);
  });

  it('watchAd sets bronze to at least BRONZE_PASSIVE_MAX', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    acc.spendBronze(acc.getBronze()); // drain all bronze
    assert.equal(acc.getBronze(), 0);
    acc.watchAd();
    assert.equal(acc.getBronze(), acc.BRONZE_PASSIVE_MAX);
  });

  it('watchAd does not decrease bronze above BRONZE_PASSIVE_MAX', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    acc.addBronze(100); // well above max
    const before = acc.getBronze();
    acc.watchAd();
    assert.equal(acc.getBronze(), before);
  });
});

// ── Cosmetic shop ─────────────────────────────────────────────────────────────

describe('cosmetic shop', () => {
  it('getShopCatalog returns a non-empty array', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const catalog = acc.getShopCatalog();
    assert.ok(Array.isArray(catalog));
    assert.ok(catalog.length > 0);
  });

  it('getShopCatalogForAppearance filters by species and gender', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const kenkariMale = acc.getShopCatalogForAppearance('kenkari', 'male');
    // Should include universal items AND kenkari-male specific ones, but not kenkari-female
    const hasFemaleSpecific = kenkariMale.some(i => i.species === 'kenkari' && i.gender === 'female');
    assert.equal(hasFemaleSpecific, false);
  });

  it('buyCosmetic returns ok:false for unknown item', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const result = acc.buyCosmetic('nonexistent_item');
    assert.equal(result.ok, false);
    assert.equal(result.error, 'Unknown cosmetic');
  });

  it('buyCosmetic returns ok:false when bronze is insufficient', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    acc.spendBronze(acc.getBronze()); // drain all bronze
    const result = acc.buyCosmetic('appearance::hat::basic_headband'); // costs 5
    assert.equal(result.ok, false);
    assert.equal(result.error, 'Not enough Bronze');
  });

  it('buyCosmetic deducts price and marks item as unlocked', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const before = acc.getBronze();
    const item = acc.getShopCatalog().find(c => c.id === 'appearance::hat::basic_headband');
    assert.ok(item, 'test item should exist in catalog');
    const result = acc.buyCosmetic(item.id);
    assert.equal(result.ok, true);
    assert.equal(acc.getBronze(), before - item.price);
    assert.equal(acc.isUnlocked(item.id), true);
  });

  it('buyCosmetic returns ok:false when already owned', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    acc.buyCosmetic('appearance::hat::basic_headband');
    const result = acc.buyCosmetic('appearance::hat::basic_headband');
    assert.equal(result.ok, false);
    assert.equal(result.error, 'Already owned');
  });

  it('equipCosmetic returns false when cosmetic is not owned', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const ok = acc.equipCosmetic('appearance::hat::basic_headband');
    assert.equal(ok, false);
  });

  it('equipCosmetic equips a purchased item', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    acc.buyCosmetic('appearance::hat::basic_headband');
    const ok = acc.equipCosmetic('appearance::hat::basic_headband');
    assert.equal(ok, true);
    assert.equal(acc.isEquipped('appearance::hat::basic_headband'), true);
  });

  it('equipping a new item in the same category replaces the old one', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    acc.addBronze(50);
    acc.buyCosmetic('appearance::hat::basic_headband');    // hat, price 5
    acc.buyCosmetic('appearance::hat::riverlandskasa_low'); // hat, price 10
    acc.equipCosmetic('appearance::hat::basic_headband');
    acc.equipCosmetic('appearance::hat::riverlandskasa_low');
    assert.equal(acc.isEquipped('appearance::hat::basic_headband'), false);
    assert.equal(acc.isEquipped('appearance::hat::riverlandskasa_low'), true);
    assert.equal(acc.getEquippedForCategory('hat'), 'appearance::hat::riverlandskasa_low');
  });

  it('unequipCosmetic removes the item from the equipped list', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    acc.buyCosmetic('appearance::hat::basic_headband');
    acc.equipCosmetic('appearance::hat::basic_headband');
    acc.unequipCosmetic('appearance::hat::basic_headband');
    assert.equal(acc.isEquipped('appearance::hat::basic_headband'), false);
  });

  it('unequipCosmetic returns false for an unknown item', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const ok = acc.unequipCosmetic('nonexistent_item');
    assert.equal(ok, false);
  });
});

// ── Appearance ────────────────────────────────────────────────────────────────

describe('appearance', () => {
  it('getAppearance returns a default appearance on a fresh account', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const app = acc.getAppearance();
    assert.equal(typeof app, 'object');
    assert.ok(app.speciesId);
    assert.ok(app.gender);
    assert.ok(app.bodyColors);
  });

  it('setAppearance updates the active khymeryyan appearance', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    acc.setAppearance({ speciesId: 'kenkari', gender: 'female', cosmetics: {}, bodyColors: {} });
    const app = acc.getAppearance();
    assert.equal(app.speciesId, 'kenkari');
    assert.equal(app.gender, 'female');
  });

  it('setAppearance fills in missing bodyColors from defaults', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    acc.setAppearance({ speciesId: 'mao-ao', gender: 'male' });
    const app = acc.getAppearance();
    assert.ok(app.bodyColors.A, 'slot A should have a value');
    assert.ok(app.bodyColors.B, 'slot B should have a value');
  });
});

// ── Trick-bone loadout ────────────────────────────────────────────────────────

describe('trick-bone loadout', () => {
  it('getTrickBoneLoadoutSize returns the configured loadout size', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    assert.equal(acc.getTrickBoneLoadoutSize(), 6);
  });

  it('getTrickBoneLoadout returns an array of loadoutSize length', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const loadout = acc.getTrickBoneLoadout();
    assert.equal(loadout.length, acc.getTrickBoneLoadoutSize());
  });

  it('all loadout entries are valid unlocked trick-bone IDs', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const unlocked = new Set(acc.getUnlockedTrickBones());
    for (const id of acc.getTrickBoneLoadout()) {
      assert.ok(unlocked.has(id), `Loadout entry "${id}" should be in unlocked list`);
    }
  });

  it('isTrickBoneUnlocked returns true for a default unlocked bone', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    assert.equal(acc.isTrickBoneUnlocked('smuggle'), true);
    assert.equal(acc.isTrickBoneUnlocked('trap'), true);
    assert.equal(acc.isTrickBoneUnlocked('punish'), true);
  });

  it('isTrickBoneUnlocked returns false for an unknown bone', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    assert.equal(acc.isTrickBoneUnlocked('nonexistent_bone'), false);
  });

  it('setTrickBoneLoadout updates the loadout when valid', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const newLoadout = ['punish', 'punish', 'trap', 'trap', 'smuggle', 'smuggle'];
    const ok = acc.setTrickBoneLoadout(newLoadout);
    assert.equal(ok, true);
    assert.deepEqual(toPlain(acc.getTrickBoneLoadout()), newLoadout);
  });

  it('setTrickBoneLoadoutSlot returns false for out-of-range slot', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    assert.equal(acc.setTrickBoneLoadoutSlot(-1, 'smuggle'), false);
    assert.equal(acc.setTrickBoneLoadoutSlot(6,  'smuggle'), false);
    assert.equal(acc.setTrickBoneLoadoutSlot(100, 'smuggle'), false);
  });

  it('setTrickBoneLoadoutSlot returns false for a non-unlocked bone', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    assert.equal(acc.setTrickBoneLoadoutSlot(0, 'nonexistent_bone'), false);
  });

  it('setTrickBoneLoadoutSlot updates the specific slot', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    acc.setTrickBoneLoadoutSlot(0, 'punish');
    assert.equal(acc.getTrickBoneLoadout()[0], 'punish');
  });
});

// ── Dye API ───────────────────────────────────────────────────────────────────

describe('dye API', () => {
  it('getDyeCatalog returns a non-empty array', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const catalog = acc.getDyeCatalog();
    assert.ok(Array.isArray(catalog));
    assert.ok(catalog.length > 0);
  });

  it('all starter dyes are owned by default', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    for (const dye of acc.getDyeCatalog()) {
      assert.equal(acc.isDyeOwned(dye.id), true, `Starter dye "${dye.id}" should be owned`);
    }
  });

  it('applyDye sets the dye for the given tint key', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const ok = acc.applyDye('dye:CLOTH:red', 'CLOTH');
    assert.equal(ok, true);
    assert.equal(acc.getAppliedDyes().CLOTH, 'dye:CLOTH:red');
  });

  it('applyDye returns false for an unowned dye', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const ok = acc.applyDye('nonexistent_dye', 'CLOTH');
    assert.equal(ok, false);
  });

  it('applyDye returns false for a missing tintKey', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const ok = acc.applyDye('dye:CLOTH:red', '');
    assert.equal(ok, false);
  });

  it('removeDye removes the dye from the applied slot', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    acc.applyDye('dye:CLOTH:red', 'CLOTH');
    acc.removeDye('CLOTH');
    assert.equal(acc.getAppliedDyes().CLOTH, undefined);
  });
});

// ── Khymeryyan CRUD ───────────────────────────────────────────────────────────

describe('khymeryyan CRUD', () => {
  it('createKhymeryyan adds a new character to the list', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('First');
    acc.createKhymeryyan('Second');
    assert.equal(acc.getKhymeryyans().length, 2);
  });

  it('createKhymeryyan with makeActive:true makes it the active character', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('First');
    const created = acc.createKhymeryyan('Second', { makeActive: true });
    assert.equal(acc.getActiveKhymeryyan().id, created.id);
  });

  it('createKhymeryyan with makeActive:false does not change active', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('First');
    const originalActive = acc.getActiveKhymeryyan().id;
    acc.createKhymeryyan('Second', { makeActive: false });
    assert.equal(acc.getActiveKhymeryyan().id, originalActive);
  });

  it('setActiveKhymeryyan switches the active character', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('First');
    const second = acc.createKhymeryyan('Second', { makeActive: false });
    acc.setActiveKhymeryyan(second.id);
    assert.equal(acc.getActiveKhymeryyan().id, second.id);
  });

  it('setActiveKhymeryyan returns false for non-existent id', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('First');
    assert.equal(acc.setActiveKhymeryyan('nonexistent-id'), false);
  });

  it('deleteKhymeryyan removes the character', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('First');
    const second = acc.createKhymeryyan('Second', { makeActive: false });
    const ok = acc.deleteKhymeryyan(second.id);
    assert.equal(ok, true);
    assert.equal(acc.getKhymeryyans().length, 1);
  });

  it('deleteKhymeryyan returns false when only one character exists', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('Only');
    const [only] = acc.getKhymeryyans();
    const ok = acc.deleteKhymeryyan(only.id);
    assert.equal(ok, false);
    assert.equal(acc.getKhymeryyans().length, 1);
  });

  it('deleteKhymeryyan moves active to another character when active is deleted', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('First');
    const second = acc.createKhymeryyan('Second', { makeActive: true });
    acc.deleteKhymeryyan(second.id);
    const active = acc.getActiveKhymeryyan();
    assert.notEqual(active.id, second.id);
    assert.equal(active.name, 'First');
  });

  it('renameKhymeryyan updates the name', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('OldName');
    const [kh] = acc.getKhymeryyans();
    acc.renameKhymeryyan(kh.id, 'NewName');
    assert.equal(acc.getKhymeryyans()[0].name, 'NewName');
  });

  it('renameKhymeryyan returns false for blank name', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('OldName');
    const [kh] = acc.getKhymeryyans();
    const ok = acc.renameKhymeryyan(kh.id, '');
    assert.equal(ok, false);
    assert.equal(acc.getKhymeryyans()[0].name, 'OldName');
  });

  it('renameKhymeryyan returns false for non-existent id', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    assert.equal(acc.renameKhymeryyan('nonexistent-id', 'Foo'), false);
  });

  it('setKhymeryyanAppearance updates the appearance of the given character', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('X');
    const [kh] = acc.getKhymeryyans();
    const ok = acc.setKhymeryyanAppearance(kh.id, { speciesId: 'kenkari', gender: 'male', cosmetics: {}, bodyColors: {} });
    assert.equal(ok, true);
    const updated = acc.getKhymeryyans()[0];
    assert.equal(updated.appearance.speciesId, 'kenkari');
  });

  it('getKhymeryyans returns clones, not references', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    acc.createAccount('Original');
    const [clone] = acc.getKhymeryyans();
    clone.name = 'Mutated';
    assert.equal(acc.getUsername(), 'Original');
  });
});

// ── Persistence (localStorage) ────────────────────────────────────────────────

describe('persistence', () => {
  it('save and load round-trips the account state', () => {
    const sandbox = makeSandbox();
    const acc = sandbox.ScratchbonesAccount;
    acc.createAccount('Persistent');
    acc.addBronze(7);
    acc.save();

    // Simulate a fresh page load by loading from the same localStorage
    acc.load();
    assert.equal(acc.getUsername(), 'Persistent');
  });

  it('load returns default account when localStorage is empty', () => {
    const { ScratchbonesAccount: acc } = makeSandbox();
    // No createAccount call — localStorage is empty
    acc.load();
    assert.equal(acc.isCreated(), false);
  });

  it('load handles corrupt JSON gracefully', () => {
    const sandbox = makeSandbox();
    const acc = sandbox.ScratchbonesAccount;
    sandbox.localStorage._store['sb_account_v1'] = '{not valid json!!}';
    assert.doesNotThrow(() => acc.load());
  });
});

// ── Legacy migration ──────────────────────────────────────────────────────────

describe('legacy account migration', () => {
  it('migrates a v1 account with top-level username/appearance into a khymeryyan', () => {
    const sandbox = makeSandbox();
    const acc = sandbox.ScratchbonesAccount;
    const legacyData = {
      bronze: 20,
      bronzePassiveLastMs: Date.now(),
      unlockedCosmetics: ['tankantunic_mao-ao_m'],
      ownedDyes: [],
      username: 'LegacyPlayer',
      appearance: { speciesId: 'mao-ao', gender: 'male', cosmetics: {}, bodyColors: {} },
      equippedCosmetics: [],
      appliedDyes: {},
      trickBoneLoadout: [],
    };
    sandbox.localStorage.setItem('sb_account_v1', JSON.stringify(legacyData));
    acc.load();
    // Should have migrated into a khymeryyan
    assert.equal(acc.isCreated(), true);
    assert.equal(acc.getUsername(), 'LegacyPlayer');
  });

  it('migrates legacy per-variant cosmetic IDs to consolidated IDs', () => {
    const sandbox = makeSandbox();
    const acc = sandbox.ScratchbonesAccount;
    const legacyData = {
      bronze: 10,
      bronzePassiveLastMs: Date.now(),
      unlockedCosmetics: ['tankantunic_mao-ao_m', 'bandolier1_mao-ao_f'],
      ownedDyes: [],
      khymeryyans: [],
    };
    sandbox.localStorage.setItem('sb_account_v1', JSON.stringify(legacyData));
    acc.load();
    const unlocked = acc.getUnlockedCosmetics();
    assert.ok(unlocked.includes('tankan_tunic'), 'should migrate tankantunic_mao-ao_m → tankan_tunic');
    assert.ok(unlocked.includes('bandolier1'),   'should migrate bandolier1_mao-ao_f → bandolier1');
    assert.ok(!unlocked.includes('tankantunic_mao-ao_m'), 'old ID should not remain');
  });
});
