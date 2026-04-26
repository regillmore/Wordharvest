import { describe, expect, it } from 'vitest';
import { advanceDay, advanceFarmTime, applyTypedWord, createFarmState, type FarmState } from './gameState';

describe('farm state', () => {
  it('queues a visible typed target before completing it on arrival', () => {
    let state = createFarmState();

    state = applyTypedWord(state, 'seed');
    expect(state.pendingAction?.label).toBe('seed');
    expect(state.pendingAction?.path.length).toBeGreaterThan(0);
    expect(state.coins).toBe(25);

    state = settleAction(state);
    expect(state.coins).toBe(25);
    expect(state.seeds.turnip).toBe(2);
    expect(state.plots[4].stage).toBe('seed');
    expect(state.pendingAction).toBeNull();
    expect(state.player).toEqual(state.plots[4].position);
  });

  it('plants, waters, grows, harvests into inventory, and ships crops for coins', () => {
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
    expect(state.coins).toBe(25);
    expect(state.inventory.turnip).toBe(1);
    expect(state.plots[4].stage).toBe('empty');

    state = applyTypedWord(state, 'bin');
    state = settleAction(state);
    expect(state.coins).toBe(37);
    expect(state.inventory.turnip).toBe(0);
    expect(state.log[0]).toBe('Shipped 1 turnip for 12 coins.');
  });

  it('buys turnip seeds from the visible seed source', () => {
    let state: FarmState = {
      ...createFarmState(),
      seeds: { turnip: 0 },
    };

    state = applyTypedWord(state, 'seeds');
    expect(state.pendingAction?.label).toBe('seeds');

    state = settleAction(state);
    expect(state.coins).toBe(19);
    expect(state.seeds.turnip).toBe(3);
    expect(state.log[0]).toBe('Bought 3 turnip seeds for 6 coins.');
  });

  it('does not plant when the seed bag is empty', () => {
    let state: FarmState = {
      ...createFarmState(),
      seeds: { turnip: 0 },
    };

    state = settleAction(applyTypedWord(state, 'seed'));

    expect(state.plots[4].stage).toBe('empty');
    expect(state.seeds.turnip).toBe(0);
    expect(state.log[0]).toBe('No turnip seeds in your bag.');
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

  it('keeps coins unchanged when the shipping bin is empty', () => {
    let state = applyTypedWord(createFarmState(), 'bin');

    expect(state.pendingAction?.label).toBe('bin');

    state = settleAction(state);
    expect(state.coins).toBe(25);
    expect(state.log[0]).toBe('The shipping bin is empty.');
  });

  it('rejects visible targets when no walkable tile path exists', () => {
    const state = applyTypedWord(
      {
        ...createFarmState(),
        player: { x: 3, y: 5 },
      },
      'bin',
    );

    expect(state.pendingAction).toBeNull();
    expect(state.log[0]).toBe('No clear path to bin.');
  });
});

function settleAction(state: FarmState): FarmState {
  let settled = state;

  for (let step = 0; step < 30 && settled.pendingAction; step += 1) {
    settled = advanceFarmTime(settled, 0.25);
  }

  return settled;
}
