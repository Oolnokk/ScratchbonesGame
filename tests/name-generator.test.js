'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');

// ── Loader helper ─────────────────────────────────────────────────────────────

const ROOT = path.resolve(__dirname, '..');

/**
 * Loads a browser-targeted JS file inside a vm sandbox.
 * Returns the sandbox, which acts as the global/window object.
 */
function loadBrowserModule(relPath, existingSandbox) {
  const src = fs.readFileSync(path.join(ROOT, relPath), 'utf8');
  const sandbox = existingSandbox || {};
  if (!sandbox.window) sandbox.window = sandbox;
  vm.runInNewContext(src, sandbox);
  return sandbox;
}

function makeSandboxWithConfig() {
  const sandbox = {};
  sandbox.window = sandbox;
  loadBrowserModule('docs/config/scratchbones-config.js', sandbox);
  return sandbox;
}

// ── Test setup ────────────────────────────────────────────────────────────────

let ng; // SCRATCHBONES_NAME_GENERATOR public API

{
  const sandbox = makeSandboxWithConfig();
  loadBrowserModule('docs/js/scratchbones-name-generator.js', sandbox);
  ng = sandbox.SCRATCHBONES_NAME_GENERATOR;
}

// ── hashStringToSeed ──────────────────────────────────────────────────────────

describe('hashStringToSeed', () => {
  it('returns a non-negative integer', () => {
    const h = ng.hashStringToSeed('hello');
    assert.ok(Number.isInteger(h), 'should be an integer');
    assert.ok(h >= 0, 'should be non-negative');
  });

  it('is deterministic — same input always produces same output', () => {
    assert.equal(ng.hashStringToSeed('hello'), ng.hashStringToSeed('hello'));
    assert.equal(ng.hashStringToSeed(''), ng.hashStringToSeed(''));
    assert.equal(ng.hashStringToSeed('player-99'), ng.hashStringToSeed('player-99'));
  });

  it('returns expected value for empty string (FNV-1a offset basis)', () => {
    assert.equal(ng.hashStringToSeed(''), 2166136261);
  });

  it('returns expected value for known inputs', () => {
    assert.equal(ng.hashStringToSeed('hello'), 1335831723);
    assert.equal(ng.hashStringToSeed('12345'), 1136836824);
    assert.equal(ng.hashStringToSeed('a'), 3826002220);
  });

  it('produces different hashes for different inputs', () => {
    const inputs = ['', 'a', 'b', 'ab', 'ba', 'hello', 'world', 'player-1'];
    const hashes = inputs.map(s => ng.hashStringToSeed(s));
    assert.equal(new Set(hashes).size, hashes.length, 'all hashes should be unique');
  });

  it('coerces null/undefined to empty string', () => {
    assert.equal(ng.hashStringToSeed(null), ng.hashStringToSeed(''));
    assert.equal(ng.hashStringToSeed(undefined), ng.hashStringToSeed(''));
  });

  it('coerces numeric input to string', () => {
    assert.equal(ng.hashStringToSeed(42), ng.hashStringToSeed('42'));
  });
});

// ── generateIdentityFromSeed — general contract ───────────────────────────────

describe('generateIdentityFromSeed — general contract', () => {
  it('returns a non-empty string', () => {
    const name = ng.generateIdentityFromSeed('test', 'male', 'mao_ao');
    assert.equal(typeof name, 'string');
    assert.ok(name.length > 0);
  });

  it('is deterministic — same seed/gender/culture always produces the same name', () => {
    assert.equal(
      ng.generateIdentityFromSeed('test-seed-001', 'male', 'mao_ao'),
      ng.generateIdentityFromSeed('test-seed-001', 'male', 'mao_ao')
    );
    assert.equal(
      ng.generateIdentityFromSeed('abc', 'female', 'kenkari'),
      ng.generateIdentityFromSeed('abc', 'female', 'kenkari')
    );
  });

  it('produces different names for different seeds', () => {
    const a = ng.generateIdentityFromSeed('seed-A', 'male', 'mao_ao');
    const b = ng.generateIdentityFromSeed('seed-B', 'male', 'mao_ao');
    assert.notEqual(a, b);
  });

  it('produces different names for male vs female genders', () => {
    const male   = ng.generateIdentityFromSeed('abc', 'male',   'mao_ao');
    const female = ng.generateIdentityFromSeed('abc', 'female', 'mao_ao');
    assert.notEqual(male, female);
  });

  it('defaults to male gender when gender is not provided', () => {
    const withMale    = ng.generateIdentityFromSeed('test', 'male', 'mao_ao');
    const withDefault = ng.generateIdentityFromSeed('test', undefined, 'mao_ao');
    assert.equal(withDefault, withMale);
  });

  it('defaults to mao_ao culture when cultureId is not provided', () => {
    const explicit = ng.generateIdentityFromSeed('test', 'male', 'mao_ao');
    const implicit = ng.generateIdentityFromSeed('test', 'male');
    assert.equal(implicit, explicit);
  });

  it('falls back to default culture for an unknown cultureId', () => {
    const fallback  = ng.generateIdentityFromSeed('test', 'male', 'nonexistent_xyz_culture');
    const defaultCt = ng.generateIdentityFromSeed('test', 'male', 'mao_ao');
    assert.equal(fallback, defaultCt);
  });

  it('throws when SCRATCHBONES_CONFIG is missing', () => {
    const noConfigSandbox = {};
    noConfigSandbox.window = noConfigSandbox;
    noConfigSandbox.window.SCRATCHBONES_CONFIG = null;
    loadBrowserModule('docs/js/scratchbones-name-generator.js', noConfigSandbox);
    const ng2 = noConfigSandbox.SCRATCHBONES_NAME_GENERATOR;
    assert.throws(
      () => ng2.generateIdentityFromSeed('x', 'male', 'mao_ao'),
      /Missing scratchbones name generation culture configuration/
    );
  });
});

// ── mao_ao culture ────────────────────────────────────────────────────────────

describe('generateIdentityFromSeed — mao_ao culture', () => {
  it('produces a two-part title-cased name', () => {
    const name = ng.generateIdentityFromSeed('test-seed-001', 'male', 'mao_ao');
    const parts = name.split(' ');
    assert.equal(parts.length, 2, `Expected 2 parts, got: ${JSON.stringify(parts)}`);
    for (const part of parts) {
      assert.ok(/^[A-Z]/.test(part), `"${part}" should start with uppercase`);
    }
  });

  it('known output for seed "test-seed-001" male', () => {
    assert.equal(ng.generateIdentityFromSeed('test-seed-001', 'male', 'mao_ao'), 'Sangtirwe Saore');
  });

  it('known output for seed "test-seed-001" female', () => {
    assert.equal(ng.generateIdentityFromSeed('test-seed-001', 'female', 'mao_ao'), 'Antinwa Saore');
  });

  it('known output for seed "abc" male', () => {
    assert.equal(ng.generateIdentityFromSeed('abc', 'male', 'mao_ao'), 'Worperwo Wonggu');
  });

  it('known output for seed "abc" female', () => {
    assert.equal(ng.generateIdentityFromSeed('abc', 'female', 'mao_ao'), 'Ongpenwi Wonggu');
  });

  it('male and female from same seed share the same surname', () => {
    for (const seed of ['abc', 'xyz', 'player-1']) {
      const male   = ng.generateIdentityFromSeed(seed, 'male',   'mao_ao');
      const female = ng.generateIdentityFromSeed(seed, 'female', 'mao_ao');
      const maleSurname   = male.split(' ')[1];
      const femaleSurname = female.split(' ')[1];
      assert.equal(maleSurname, femaleSurname, `Surname mismatch for seed "${seed}"`);
    }
  });

  it('mao_ao male first name initial matches surname initial (birth rule)', () => {
    for (let i = 0; i < 20; i++) {
      const name = ng.generateIdentityFromSeed(`seed-${i}`, 'male', 'mao_ao');
      const parts = name.split(' ');
      const firstInitial   = parts[0][0].toLowerCase();
      const surnameInitial = parts[1][0].toLowerCase();
      assert.equal(
        firstInitial,
        surnameInitial,
        `Male first-name initial should match surname initial in "${name}"`
      );
    }
  });
});

// ── kenkari culture ───────────────────────────────────────────────────────────

describe('generateIdentityFromSeed — kenkari culture', () => {
  it('produces a given-name and a two-word patronymic surname', () => {
    const name = ng.generateIdentityFromSeed('abc', 'male', 'kenkari');
    const parts = name.split(' ');
    // Format: "Firstname prefix Patronym" — always 3 space-separated tokens
    assert.equal(parts.length, 3, `Expected "Firstname prefix Patronym": got ${JSON.stringify(parts)}`);
  });

  it('known output for seed "test-seed-001" male', () => {
    assert.equal(ng.generateIdentityFromSeed('test-seed-001', 'male', 'kenkari'), "O'amu ao Ga'i");
  });

  it('known output for seed "test-seed-001" female', () => {
    assert.equal(ng.generateIdentityFromSeed('test-seed-001', 'female', 'kenkari'), "O'amu u Ga'i");
  });

  it('male surname starts with "ao" prefix', () => {
    for (const seed of ['abc', 'xyz', 'player-2']) {
      const name = ng.generateIdentityFromSeed(seed, 'male', 'kenkari');
      const surname = name.split(' ').slice(1).join(' ');
      assert.ok(surname.startsWith('ao '), `Male kenkari surname should start with "ao ": "${name}"`);
    }
  });

  it('female surname starts with "u" prefix', () => {
    for (const seed of ['abc', 'xyz', 'player-2']) {
      const name = ng.generateIdentityFromSeed(seed, 'female', 'kenkari');
      const surname = name.split(' ').slice(1).join(' ');
      assert.ok(surname.startsWith('u '), `Female kenkari surname should start with "u ": "${name}"`);
    }
  });

  it('uses provided fatherFirstName in the patronymic surname', () => {
    const name = ng.generateIdentityFromSeed('test-seed-001', 'female', 'kenkari', { fatherFirstName: 'Kato' });
    assert.equal(name, "O'amu u Kato");
  });

  it('fatherFirstName is title-cased in the surname', () => {
    const name = ng.generateIdentityFromSeed('abc', 'female', 'kenkari', { fatherFirstName: 'rino' });
    const surname = name.split(' ').slice(1).join(' ');
    // surname = "u Rino" — the father name should be title-cased
    assert.ok(/u [A-Z]/.test(surname), `Surname should be title-cased: "${surname}"`);
  });
});

// ── slagothim culture ─────────────────────────────────────────────────────────

describe('generateIdentityFromSeed — slagothim culture', () => {
  it('produces a three-part name (firstname tley location)', () => {
    const name = ng.generateIdentityFromSeed('abc', 'male', 'slagothim');
    const parts = name.split(' ');
    assert.equal(parts.length, 3, `Expected "X tley Y": got ${JSON.stringify(parts)}`);
  });

  it('surname always contains "tley"', () => {
    for (const seed of ['abc', 'xyz', 'player-1', 'player-2']) {
      for (const gender of ['male', 'female']) {
        const name = ng.generateIdentityFromSeed(seed, gender, 'slagothim');
        assert.ok(name.toLowerCase().includes('tley'), `"${name}" should contain "tley"`);
      }
    }
  });

  it('known output for seed "test-seed-001" male', () => {
    assert.equal(ng.generateIdentityFromSeed('test-seed-001', 'male', 'slagothim'), 'Slemno tley Ikinga');
  });

  it('known output for seed "test-seed-001" female', () => {
    assert.equal(ng.generateIdentityFromSeed('test-seed-001', 'female', 'slagothim'), 'Slemna tley Ikinga');
  });

  it('produces title-cased first name and location', () => {
    const name = ng.generateIdentityFromSeed('abc', 'male', 'slagothim');
    const parts = name.split(' ');
    assert.ok(/^[A-Z]/.test(parts[0]), 'first name should be title-cased');
    assert.ok(/^[A-Z]/.test(parts[2]), 'location should be title-cased');
  });

  it('throws a clear error when slagothim phonology cannot produce a valid name', () => {
    const sandbox = {};
    sandbox.window = sandbox;
    sandbox.window.SCRATCHBONES_CONFIG = {
      game: {
        nameGeneration: {
          defaultCultureId: 'slagothim',
          cultures: {
            slagothim: {
              id: 'slagothim',
              casing: 'title',
              slagothimRules: {
                startWithSlChance: 1,
                slNameUsesSuffixChance: 0,
                mnClusterChance: 0,
                firstConsonants: ['b'],
                vowels: ['a'],
                secondConsonants: ['k'],
                rareSecondConsonantCluster: 'mn',
                optionalBridgeVowelChance: 0,
                maleSuffix: 'o',
                femaleSuffix: 'a',
                maleSlOnlyEndings: [],
                femaleSlOnlyEndings: [],
                locations: ['ikinga'],
              },
            },
          },
        },
      },
    };
    loadBrowserModule('docs/js/scratchbones-name-generator.js', sandbox);
    const ngBroken = sandbox.SCRATCHBONES_NAME_GENERATOR;
    assert.throws(
      () => ngBroken.generateIdentityFromSeed('seed', 'male', 'slagothim'),
      /Could not generate a Slagothim name within the current phonology rules/
    );
  });
});

// ── engh_sho culture ──────────────────────────────────────────────────────────

describe('generateIdentityFromSeed — engh_sho culture', () => {
  const FINAL_PLOSIVES = ['p', 't', 'k', 'q', 'b', 'd', 'g', 'pp', 'tt', 'kk', 'qq', 'mp', 'nt', 'nk', 'lk', 'rk'];
  const WORD_LIST = [
    'acorn', 'ael', 'aestel', 'amber', 'amethyst', 'awl', 'bar', 'barb', 'bead', 'bean',
    'bell', 'beryl', 'billet', 'bit', 'blade', 'bladelet', 'blank', 'block', 'bodkin', 'bone',
    'borer', 'boss', 'brad', 'brooch', 'buckle', 'bud', 'burin', 'burr', 'button', 'cake',
    'carnelian', 'catch', 'catchplate', 'chalcedony', 'chape', 'chisel', 'chip', 'clasp',
    'coil', 'coin', 'comb', 'cone', 'core', 'counter', 'cramp', 'crucible', 'crystal', 'cube',
    'cup', 'cupel', 'cylinder', 'die', 'disc', 'dowel', 'drop', 'dyse', 'earring', 'emerald',
    'eyelet', 'farthing', 'ferrule', 'file', 'firestone', 'flan', 'flint', 'fork', 'garnet',
    'gem', 'gim', 'gimstan', 'gouge', 'grain', 'graver', 'hasp', 'hinge', 'hobnail', 'hone',
    'hook', 'hring', 'husk', 'hwirfel', 'ingot', 'jasper', 'jewel', 'kernel', 'key', 'knife',
    'knob', 'knucklebone', 'lamp', 'leaf', 'link', 'lock', 'lodestone', 'loop', 'matrix',
    'mirror', 'mount', 'naegl', 'nail', 'needle', 'nut', 'obol', 'onyx', 'opal', 'peg',
    'pendant', 'pening', 'penny', 'pin', 'pinhead', 'pip', 'pit', 'plaque', 'plug', 'pod',
    'point', 'preon', 'probe', 'punch', 'quartz', 'reed', 'rind', 'ring', 'rivet', 'rod',
    'root', 'roundel', 'ruby', 'sapphire', 'sceat', 'sceatt', 'scraper', 'seed', 'shell',
    'sherd', 'shuttle', 'sliver', 'socket', 'spatula', 'spindle', 'spinel', 'spool', 'spoon',
    'sprig', 'stalk', 'stan', 'stem', 'sticca', 'stone', 'stud', 'styca', 'stylus', 'tablet',
    'tack', 'tag', 'tally', 'terminal', 'tessera', 'thimble', 'thorn', 'tip', 'toggle',
    'token', 'tooth', 'tube', 'twig', 'wedge', 'weight', 'whetstone', 'whorl', 'wire',
  ];

  it('produces a non-empty string', () => {
    const name = ng.generateIdentityFromSeed('test-seed-001', 'male', 'engh_sho');
    assert.equal(typeof name, 'string');
    assert.ok(name.length > 0);
  });

  it('is deterministic — same seed always produces the same name', () => {
    assert.equal(
      ng.generateIdentityFromSeed('test-seed-001', 'male', 'engh_sho'),
      ng.generateIdentityFromSeed('test-seed-001', 'male', 'engh_sho')
    );
  });

  it('produces a two-part title-cased name', () => {
    const name = ng.generateIdentityFromSeed('test-seed-001', 'male', 'engh_sho');
    const parts = name.split(' ');
    assert.equal(parts.length, 2, `Expected 2 parts, got: ${JSON.stringify(parts)}`);
    for (const part of parts) {
      assert.ok(/^[A-Z]/.test(part), `"${part}" should start with uppercase`);
    }
  });

  it('first name is always drawn from the word list', () => {
    for (let i = 0; i < 40; i++) {
      const name = ng.generateIdentityFromSeed(`seed-${i}`, 'male', 'engh_sho');
      const firstName = name.split(' ')[0].toLowerCase();
      assert.ok(WORD_LIST.includes(firstName), `"${firstName}" is not in the word list (full name: "${name}")`);
    }
  });

  it('surname always ends with a valid plosive', () => {
    for (let i = 0; i < 40; i++) {
      const name = ng.generateIdentityFromSeed(`seed-${i}`, 'male', 'engh_sho');
      const surname = name.split(' ')[1].toLowerCase();
      const endsWithPlosive = FINAL_PLOSIVES.some(p => surname.endsWith(p));
      assert.ok(endsWithPlosive, `Surname "${surname}" does not end with a valid plosive (full name: "${name}")`);
    }
  });

  it('produces variety across seeds', () => {
    const surnames = new Set();
    for (let i = 0; i < 20; i++) {
      const name = ng.generateIdentityFromSeed(`seed-${i}`, 'male', 'engh_sho');
      surnames.add(name.split(' ')[1]);
    }
    assert.ok(surnames.size >= 10, `Expected at least 10 distinct surnames from 20 seeds, got ${surnames.size}`);
  });

  it('gender does not affect the name (Engh-sho names are genderless)', () => {
    const male   = ng.generateIdentityFromSeed('abc', 'male',   'engh_sho');
    const female = ng.generateIdentityFromSeed('abc', 'female', 'engh_sho');
    assert.equal(male, female);
  });

  it('known output for seed "test-seed-001"', () => {
    assert.equal(ng.generateIdentityFromSeed('test-seed-001', 'male', 'engh_sho'), 'Cone Pansasak');
  });

  it('known output for seed "abc"', () => {
    assert.equal(ng.generateIdentityFromSeed('abc', 'male', 'engh_sho'), 'Knucklebone Nutungaq');
  });
});

// ── Cross-culture variety ─────────────────────────────────────────────────────

describe('generateIdentityFromSeed — cross-culture variety', () => {
  it('all four cultures produce distinct names for the same seed and gender', () => {
    const names = ['mao_ao', 'kenkari', 'slagothim', 'engh_sho'].map(c =>
      ng.generateIdentityFromSeed('same-seed', 'male', c)
    );
    assert.equal(new Set(names).size, 4, `All culture names should be unique: ${names}`);
  });

  it('produces names for multiple seeds without throwing', () => {
    const seeds = ['alpha', 'beta', 'gamma', 'delta', 'epsilon'];
    const cultures = ['mao_ao', 'kenkari', 'slagothim', 'engh_sho'];
    const genders = ['male', 'female'];
    for (const seed of seeds) {
      for (const gender of genders) {
        for (const culture of cultures) {
          assert.doesNotThrow(() => ng.generateIdentityFromSeed(seed, gender, culture));
        }
      }
    }
  });
});
