'use strict';

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  normalizePlayerLoadout,
  normalizeKhymeryyanPayload,
  occupantPayload,
  filterStateForSeat,
} = require('../server/utils.js');

// ── normalizePlayerLoadout ────────────────────────────────────────────────────

describe('normalizePlayerLoadout', () => {
  it('returns empty array for non-array input', () => {
    assert.deepEqual(normalizePlayerLoadout(null), []);
    assert.deepEqual(normalizePlayerLoadout(undefined), []);
    assert.deepEqual(normalizePlayerLoadout('string'), []);
    assert.deepEqual(normalizePlayerLoadout(42), []);
    assert.deepEqual(normalizePlayerLoadout({}), []);
  });

  it('returns empty array for empty array input', () => {
    assert.deepEqual(normalizePlayerLoadout([]), []);
  });

  it('trims whitespace from ID strings', () => {
    assert.deepEqual(normalizePlayerLoadout(['  trap  ', '  smuggle']), ['trap', 'smuggle']);
  });

  it('filters out blank entries', () => {
    assert.deepEqual(normalizePlayerLoadout(['trap', '', '  ', null, undefined, 'punish']), ['trap', 'punish']);
  });

  it('coerces non-string values to strings', () => {
    assert.deepEqual(normalizePlayerLoadout([1, 2, 3]), ['1', '2', '3']);
  });

  it('caps at 12 entries', () => {
    const input = Array.from({ length: 20 }, (_, i) => `id${i}`);
    const result = normalizePlayerLoadout(input);
    assert.equal(result.length, 12);
    assert.deepEqual(result, input.slice(0, 12));
  });

  it('preserves exactly 12 entries', () => {
    const input = Array.from({ length: 12 }, (_, i) => `id${i}`);
    assert.deepEqual(normalizePlayerLoadout(input), input);
  });
});

// ── normalizeKhymeryyanPayload ────────────────────────────────────────────────

describe('normalizeKhymeryyanPayload', () => {
  it('returns null for falsy input', () => {
    assert.equal(normalizeKhymeryyanPayload(null), null);
    assert.equal(normalizeKhymeryyanPayload(undefined), null);
    assert.equal(normalizeKhymeryyanPayload(0), null);
    assert.equal(normalizeKhymeryyanPayload(''), null);
  });

  it('returns null for non-object primitives', () => {
    assert.equal(normalizeKhymeryyanPayload('hello'), null);
    assert.equal(normalizeKhymeryyanPayload(42), null);
    assert.equal(normalizeKhymeryyanPayload(true), null);
  });

  it('returns an object for a valid payload', () => {
    const result = normalizeKhymeryyanPayload({ name: 'Ringo', id: 'abc-123' });
    assert.equal(typeof result, 'object');
    assert.notEqual(result, null);
  });

  it('trims and caps name at 32 characters', () => {
    const long = 'A'.repeat(50);
    const result = normalizeKhymeryyanPayload({ name: '  ' + long + '  ' });
    assert.equal(result.name.length, 32);
  });

  it('sets name to null when name is blank', () => {
    const result = normalizeKhymeryyanPayload({ name: '   ' });
    assert.equal(result.name, null);
  });

  it('caps id at 64 characters', () => {
    const longId = 'x'.repeat(100);
    const result = normalizeKhymeryyanPayload({ id: longId });
    assert.equal(result.id.length, 64);
  });

  it('sets id to null when not provided', () => {
    const result = normalizeKhymeryyanPayload({});
    assert.equal(result.id, null);
  });

  it('preserves object appearance', () => {
    const appearance = { speciesId: 'mao-ao', gender: 'female' };
    const result = normalizeKhymeryyanPayload({ appearance });
    assert.deepEqual(result.appearance, appearance);
  });

  it('sets appearance to null for non-object appearance', () => {
    assert.equal(normalizeKhymeryyanPayload({ appearance: 'string' }).appearance, null);
    assert.equal(normalizeKhymeryyanPayload({ appearance: 123 }).appearance, null);
    assert.equal(normalizeKhymeryyanPayload({ appearance: null }).appearance, null);
  });

  it('normalizes equippedCosmetics as an array of strings capped at 24', () => {
    const input = Array.from({ length: 30 }, (_, i) => i); // numbers, not strings
    const result = normalizeKhymeryyanPayload({ equippedCosmetics: input });
    assert.equal(result.equippedCosmetics.length, 24);
    assert.ok(result.equippedCosmetics.every(v => typeof v === 'string'));
  });

  it('sets equippedCosmetics to [] when not an array', () => {
    assert.deepEqual(normalizeKhymeryyanPayload({}).equippedCosmetics, []);
    assert.deepEqual(normalizeKhymeryyanPayload({ equippedCosmetics: null }).equippedCosmetics, []);
  });

  it('preserves appliedDyes object', () => {
    const dyes = { CLOTH: 'dye:CLOTH:red' };
    const result = normalizeKhymeryyanPayload({ appliedDyes: dyes });
    assert.deepEqual(result.appliedDyes, dyes);
  });

  it('sets appliedDyes to {} for non-object', () => {
    assert.deepEqual(normalizeKhymeryyanPayload({ appliedDyes: 'bad' }).appliedDyes, {});
    assert.deepEqual(normalizeKhymeryyanPayload({ appliedDyes: null }).appliedDyes, {});
  });

  it('normalizes trickBoneLoadout from trickBoneLoadout field', () => {
    const result = normalizeKhymeryyanPayload({ trickBoneLoadout: ['trap', '  smuggle  ', ''] });
    assert.deepEqual(result.trickBoneLoadout, ['trap', 'smuggle']);
  });

  it('normalizes trickBoneLoadout from legacy playerLoadout field', () => {
    const result = normalizeKhymeryyanPayload({ playerLoadout: ['punish'] });
    assert.deepEqual(result.trickBoneLoadout, ['punish']);
  });

  it('trickBoneLoadout prefers trickBoneLoadout over playerLoadout', () => {
    const result = normalizeKhymeryyanPayload({ trickBoneLoadout: ['trap'], playerLoadout: ['punish'] });
    assert.deepEqual(result.trickBoneLoadout, ['trap']);
  });
});

// ── occupantPayload ───────────────────────────────────────────────────────────

describe('occupantPayload', () => {
  it('returns correct shape with all explicit values', () => {
    const khymeryyan = { appearance: { speciesId: 'kenkari' }, trickBoneLoadout: ['trap'] };
    const result = occupantPayload(1, 'Alice', { speciesId: 'kenkari' }, ['trap'], khymeryyan);
    assert.equal(result.seatId, 1);
    assert.equal(result.name, 'Alice');
    assert.deepEqual(result.appearance, { speciesId: 'kenkari' });
    assert.deepEqual(result.playerLoadout, ['trap']);
    assert.deepEqual(result.khymeryyan, khymeryyan);
  });

  it('falls back to khymeryyan appearance when appearance is null', () => {
    const khymeryyan = { appearance: { speciesId: 'mao-ao' }, trickBoneLoadout: [] };
    const result = occupantPayload(0, 'Bob', null, [], khymeryyan);
    assert.deepEqual(result.appearance, { speciesId: 'mao-ao' });
  });

  it('falls back to khymeryyan appearance when appearance is undefined', () => {
    const khymeryyan = { appearance: { speciesId: 'mao-ao' }, trickBoneLoadout: [] };
    const result = occupantPayload(0, 'Bob', undefined, [], khymeryyan);
    assert.deepEqual(result.appearance, { speciesId: 'mao-ao' });
  });

  it('sets appearance to null when both appearance and khymeryyan are null', () => {
    const result = occupantPayload(2, 'Eve', null, [], null);
    assert.equal(result.appearance, null);
  });

  it('uses playerLoadout when provided, even if khymeryyan has one', () => {
    const khymeryyan = { trickBoneLoadout: ['smuggle'] };
    const result = occupantPayload(0, 'Host', null, ['punish'], khymeryyan);
    assert.deepEqual(result.playerLoadout, ['punish']);
  });

  it('falls back to khymeryyan trickBoneLoadout when playerLoadout is falsy', () => {
    const khymeryyan = { trickBoneLoadout: ['trap', 'punish'] };
    const result = occupantPayload(0, 'Host', null, null, khymeryyan);
    assert.deepEqual(result.playerLoadout, ['trap', 'punish']);
  });

  it('falls back to empty array when both playerLoadout and khymeryyan trickBoneLoadout are missing', () => {
    const result = occupantPayload(0, 'Host', null, null, null);
    assert.deepEqual(result.playerLoadout, []);
  });

  it('sets khymeryyan to null when not provided', () => {
    const result = occupantPayload(3, 'NPC', null, [], null);
    assert.equal(result.khymeryyan, null);
  });
});

// ── filterStateForSeat ────────────────────────────────────────────────────────

describe('filterStateForSeat', () => {
  it('returns the value unchanged for falsy input', () => {
    assert.equal(filterStateForSeat(null, 0), null);
    assert.equal(filterStateForSeat(undefined, 0), undefined);
  });

  it('injects humanSeat matching seatId', () => {
    const state = { players: [], pile: [], challengeWindow: null };
    const result = filterStateForSeat(state, 2);
    assert.equal(result.humanSeat, 2);
  });

  it('clears selectedCardIds', () => {
    const state = { players: [], pile: [], challengeWindow: null, selectedCardIds: ['c1', 'c2'] };
    const result = filterStateForSeat(state, 0);
    assert.deepEqual(result.selectedCardIds, []);
  });

  it("keeps own player's hand intact", () => {
    const hand = [{ rank: 3 }, { rank: 7 }];
    const state = {
      players: [{ id: 0, hand }],
      pile: [],
      challengeWindow: null,
    };
    const result = filterStateForSeat(state, 0);
    assert.deepEqual(result.players[0].hand, hand);
  });

  it("hides other players' hand cards", () => {
    const state = {
      players: [
        { id: 0, hand: [{ rank: 3 }] },
        { id: 1, hand: [{ rank: 5 }, { rank: 9 }] },
      ],
      pile: [],
      challengeWindow: null,
    };
    const result = filterStateForSeat(state, 0);
    // Seat 1's cards should be hidden
    assert.deepEqual(result.players[1].hand, [{ hidden: true }, { hidden: true }]);
    // Seat 0's hand should be untouched
    assert.deepEqual(result.players[0].hand, [{ rank: 3 }]);
  });

  it('hides pile cards', () => {
    const state = {
      players: [{ id: 0, hand: [] }],
      pile: [
        { rank: 4, cards: [{ rank: 4 }, { rank: 4 }] },
      ],
      challengeWindow: null,
    };
    const result = filterStateForSeat(state, 0);
    assert.deepEqual(result.pile[0].cards, [{ hidden: true }, { hidden: true }]);
  });

  it('handles empty pile', () => {
    const state = { players: [], pile: [], challengeWindow: null };
    const result = filterStateForSeat(state, 0);
    assert.deepEqual(result.pile, []);
  });

  it('hides cards in challengeWindow.lastPlay', () => {
    const state = {
      players: [{ id: 0, hand: [] }],
      pile: [],
      challengeWindow: {
        challenger: 1,
        lastPlay: { rank: 5, cards: [{ rank: 5 }, { rank: 5 }, { rank: 5 }] },
      },
    };
    const result = filterStateForSeat(state, 0);
    assert.deepEqual(result.challengeWindow.lastPlay.cards, [
      { hidden: true }, { hidden: true }, { hidden: true },
    ]);
  });

  it('handles challengeWindow with null lastPlay', () => {
    const state = {
      players: [],
      pile: [],
      challengeWindow: { challenger: 1, lastPlay: null },
    };
    const result = filterStateForSeat(state, 0);
    assert.equal(result.challengeWindow.lastPlay, null);
  });

  it('handles null challengeWindow', () => {
    const state = { players: [], pile: [], challengeWindow: null };
    const result = filterStateForSeat(state, 0);
    assert.equal(result.challengeWindow, null);
  });

  it('preserves other top-level state fields', () => {
    const state = {
      players: [],
      pile: [],
      challengeWindow: null,
      round: 3,
      ante: 4,
      currentTurn: 2,
    };
    const result = filterStateForSeat(state, 1);
    assert.equal(result.round, 3);
    assert.equal(result.ante, 4);
    assert.equal(result.currentTurn, 2);
  });

  it('does not mutate the original state', () => {
    const hand = [{ rank: 7 }];
    const state = {
      players: [{ id: 0, hand }, { id: 1, hand: [{ rank: 3 }] }],
      pile: [{ cards: [{ rank: 1 }] }],
      challengeWindow: null,
    };
    filterStateForSeat(state, 0);
    // Original hand still has rank 3
    assert.deepEqual(state.players[1].hand, [{ rank: 3 }]);
    // Original pile card still visible
    assert.deepEqual(state.pile[0].cards, [{ rank: 1 }]);
  });
});
