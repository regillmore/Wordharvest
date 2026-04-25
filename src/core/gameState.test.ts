import { describe, expect, it } from 'vitest';
import { advanceDay, applyTypedWord, createFarmState } from './gameState';

describe('farm state', () => {
  it('plants, waters, grows, and harvests a crop', () => {
    let state = createFarmState();

    state = applyTypedWord(state, 'seed');
    expect(state.coins).toBe(20);
    expect(state.plots[0].stage).toBe('seed');

    state = applyTypedWord(state, 'water');
    state = advanceDay(state);
    state = applyTypedWord(state, 'water');
    state = advanceDay(state);
    state = applyTypedWord(state, 'water');
    state = advanceDay(state);

    expect(state.plots[0].stage).toBe('ripe');

    state = applyTypedWord(state, 'pick');
    expect(state.coins).toBe(32);
    expect(state.plots[0].stage).toBe('empty');
  });

  it('moves plot focus with typed direction words', () => {
    const state = applyTypedWord(createFarmState(), 'right');

    expect(state.selectedPlotId).toBe(2);
  });
});
