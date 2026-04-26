import { describe, expect, it } from 'vitest';
import { advanceDay, advanceFarmTime, applyTypedWord, createFarmState, type FarmState } from './gameState';

describe('farm state', () => {
  it('queues a visible typed target before completing it on arrival', () => {
    let state = createFarmState();

    state = applyTypedWord(state, 'seed');
    expect(state.pendingAction?.label).toBe('seed');
    expect(state.coins).toBe(25);

    state = settleAction(state);
    expect(state.coins).toBe(20);
    expect(state.plots[4].stage).toBe('seed');
    expect(state.pendingAction).toBeNull();
    expect(state.player).toEqual(state.plots[4].position);
  });

  it('plants, waters, grows, and harvests a visible crop target', () => {
    let state = settleAction(applyTypedWord(createFarmState(), 'seed'));

    state = applyTypedWord(state, 'water');
    state = settleAction(state);
    state = advanceDay(state);
    state = applyTypedWord(state, 'water');
    state = settleAction(state);
    state = advanceDay(state);
    state = applyTypedWord(state, 'water');
    state = settleAction(state);
    state = advanceDay(state);

    expect(state.plots[4].stage).toBe('ripe');

    state = applyTypedWord(state, 'pick');
    state = settleAction(state);
    expect(state.coins).toBe(32);
    expect(state.plots[4].stage).toBe('empty');
  });

  it('uses distant and near labels to approach and enter the farmhouse', () => {
    let state = createFarmState();

    state = applyTypedWord(state, 'house');
    expect(state.pendingAction?.label).toBe('house');
    state = settleAction(state);
    expect(state.location).toBe('farm');
    expect(state.log[0]).toContain('farmhouse');

    state = applyTypedWord(state, 'door');
    state = settleAction(state);
    expect(state.location).toBe('house');

    state = applyTypedWord(state, 'outside');
    state = settleAction(state);
    expect(state.location).toBe('farm');
  });

  it('rejects words that are not visible from the player position', () => {
    const state = applyTypedWord(createFarmState(), 'door');

    expect(state.location).toBe('farm');
    expect(state.log[0]).toBe('No visible target named "door".');
  });

  it('waits for the current walk before accepting another target or ending the day', () => {
    let state = applyTypedWord(createFarmState(), 'house');

    state = applyTypedWord(state, 'seed');
    expect(state.log[0]).toBe('Finish walking to house first.');

    state = advanceDay(state);
    expect(state.day).toBe(1);
    expect(state.log[0]).toBe('Finish walking to house before ending the day.');
  });
});

function settleAction(state: FarmState): FarmState {
  let settled = state;

  for (let step = 0; step < 10 && settled.pendingAction; step += 1) {
    settled = advanceFarmTime(settled, 0.25);
  }

  return settled;
}
