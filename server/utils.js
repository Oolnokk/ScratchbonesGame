'use strict';

/**
 * Normalizes a player loadout array: trims each ID string, removes blanks,
 * and caps the result at 12 entries. Non-array input returns [].
 */
function normalizePlayerLoadout(loadout) {
  return Array.isArray(loadout)
    ? loadout.map(id => String(id || '').trim()).filter(Boolean).slice(0, 12)
    : [];
}

/**
 * Normalizes an incoming Khymeryyan payload from a network message.
 * Returns null for falsy or non-object input.
 */
function normalizeKhymeryyanPayload(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const name = String(payload.name || '').trim().slice(0, 32);
  return {
    id: payload.id ? String(payload.id).slice(0, 64) : null,
    name: name || null,
    appearance: payload.appearance && typeof payload.appearance === 'object' ? payload.appearance : null,
    equippedCosmetics: Array.isArray(payload.equippedCosmetics) ? payload.equippedCosmetics.map(String).slice(0, 24) : [],
    appliedDyes: payload.appliedDyes && typeof payload.appliedDyes === 'object' && !Array.isArray(payload.appliedDyes) ? payload.appliedDyes : {},
    trickBoneLoadout: normalizePlayerLoadout(payload.trickBoneLoadout || payload.playerLoadout),
  };
}

/**
 * Builds the occupant descriptor sent to the host when a player joins.
 */
function occupantPayload(seatId, name, appearance, playerLoadout, khymeryyan) {
  return {
    seatId,
    name,
    appearance: appearance ?? khymeryyan?.appearance ?? null,
    playerLoadout: playerLoadout || khymeryyan?.trickBoneLoadout || [],
    khymeryyan: khymeryyan ?? null,
  };
}

/**
 * Filters a full game state object for a specific seat:
 * - hides the cards in all other players' hands
 * - hides cards on the pile
 * - hides the lastPlay cards inside any active challengeWindow
 * - injects humanSeat and clears selectedCardIds
 */
function filterStateForSeat(fullState, seatId) {
  if (!fullState) return fullState;
  return {
    ...fullState,
    humanSeat: seatId,
    selectedCardIds: [],
    players: fullState.players.map(p =>
      p.id === seatId
        ? p
        : { ...p, hand: (p.hand || []).map(() => ({ hidden: true })) }
    ),
    pile: (fullState.pile || []).map(play => ({
      ...play,
      cards: (play.cards || []).map(() => ({ hidden: true })),
    })),
    challengeWindow: fullState.challengeWindow ? {
      ...fullState.challengeWindow,
      lastPlay: fullState.challengeWindow.lastPlay ? {
        ...fullState.challengeWindow.lastPlay,
        cards: (fullState.challengeWindow.lastPlay.cards || []).map(() => ({ hidden: true })),
      } : null,
    } : null,
  };
}

module.exports = {
  normalizePlayerLoadout,
  normalizeKhymeryyanPayload,
  occupantPayload,
  filterStateForSeat,
};
