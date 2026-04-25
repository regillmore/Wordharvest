import { describe, expect, it } from 'vitest';
import { advanceDay, applyTypedWord, createFarmState } from './gameState';

describe('farm state', () => {
  it('plants, waters, grows, and harvests a visible crop target', () => {
    let state = createFarmState();

    state = applyTypedWord(state, 'seed');
    expect(state.coins).toBe(20);
    expect(state.plots[4].stage).toBe('seed');
    expect(state.player).toEqual(state.plots[4].position);

    state = applyTypedWord(state, 'water');
    state = advanceDay(state);
    state = applyTypedWord(state, 'water');
    state = advanceDay(state);
    state = applyTypedWord(state, 'water');
    state = advanceDay(state);

    expect(state.plots[4].stage).toBe('ripe');

    state = applyTypedWord(state, 'pick');
    expect(state.coins).toBe(32);
    expect(state.plots[4].stage).toBe('empty');
  });

  it('uses distant and near labels to approach and enter the farmhouse', () => {
    let state = createFarmState();

    state = applyTypedWord(state, 'house');
    expect(state.location).toBe('farm');
    expect(state.log[0]).toContain('farmhouse');

    state = applyTypedWord(state, 'door');
    expect(state.location).toBe('house');

    state = applyTypedWord(state, 'outside');
    expect(state.location).toBe('farm');
  });

  it('rejects words that are not visible from the player position', () => {
    const state = applyTypedWord(createFarmState(), 'door');

    expect(state.location).toBe('farm');
    expect(state.log[0]).toBe('No visible target named "door".');
  });
});
