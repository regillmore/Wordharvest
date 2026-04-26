import { describe, expect, it } from 'vitest';
import { applyTypedWord, createFarmState, type FarmState } from './gameState';
import { listWorldTargets, townShopPosition } from './worldTargets';

describe('world targets', () => {
  it('shows house from range and door only when near the farmhouse', () => {
    const distant = createFarmState();
    expect(listWorldTargets(distant).map((target) => target.word)).toContain('house');
    expect(listWorldTargets(distant).map((target) => target.word)).not.toContain('door');

    const nearby: FarmState = {
      ...distant,
      player: { x: 0, y: 1.7 },
    };

    expect(listWorldTargets(nearby).map((target) => target.word)).toContain('door');
    expect(listWorldTargets(nearby).map((target) => target.word)).not.toContain('house');
  });

  it('assigns synonyms across multiple nearby crops with the same action', () => {
    const state: FarmState = {
      ...createFarmState(),
      plots: createFarmState().plots.map((plot) =>
        plot.id === 4 || plot.id === 5
          ? { ...plot, crop: 'turnip', stage: 'seed', wateredToday: false, growth: 0 }
          : plot,
      ),
    };

    const words = listWorldTargets(state).map((target) => target.word);

    expect(words).toContain('water');
    expect(words).toContain('sprinkle');
  });

  it('shows a shipping bin target near the player', () => {
    expect(listWorldTargets(createFarmState()).map((target) => target.word)).toContain('bin');
  });

  it('shows a seed source target near the player', () => {
    expect(listWorldTargets(createFarmState()).map((target) => target.word)).toContain('seeds');
  });

  it('shows the town boundary on the farm and a farm return target in town', () => {
    const farmWords = listWorldTargets(createFarmState()).map((target) => target.word);
    expect(farmWords).toContain('town');
    expect(farmWords).toEqual(expect.arrayContaining(['journal', 'pack', 'options']));

    const townState: FarmState = {
      ...createFarmState(),
      location: 'town',
      player: { x: 0, y: 5.6 },
    };

    expect(listWorldTargets(townState).map((target) => target.word)).toEqual([
      'farm',
      'shop',
      'hello',
      'journal',
      'pack',
      'options',
    ]);
  });

  it('shows crop purchase words when the player is at the town shop shelf', () => {
    const shopState: FarmState = {
      ...createFarmState(),
      location: 'town',
      player: townShopPosition,
    };
    const targets = listWorldTargets(shopState);
    const words = targets.map((target) => target.word);
    const radishTarget = targets.find((target) => target.word === 'radish');

    expect(words).toEqual(expect.arrayContaining(['turnip', 'radish', 'pea', 'strawberry']));
    expect(radishTarget?.action).toEqual({
      kind: 'buy-seeds',
      crop: 'radish',
      destination: townShopPosition,
    });
  });

  it('hides target labels while an action is already queued', () => {
    const state = applyTypedWord(createFarmState(), 'house');

    expect(state.pendingAction?.label).toBe('house');
    expect(listWorldTargets(state)).toEqual([]);
  });
});
