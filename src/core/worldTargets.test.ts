import { describe, expect, it } from 'vitest';
import { cropCatalog, shopWordForCrop } from '../content/crops';
import { createDailyRequestProgress, markDailyRequestComplete } from '../content/dailyRequests';
import { markTownEventAttended } from '../content/townEvents';
import { applyTypedWord, createFarmState, type FarmState } from './gameState';
import { houseApproachPosition, houseBedPosition, listWorldTargets, townShopPosition } from './worldTargets';

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

  it('shows crop-specific planting choices when multiple seed packets are in the bag', () => {
    const base = createFarmState();
    const state: FarmState = {
      ...base,
      seeds: {
        ...base.seeds,
        radish: 2,
        carrot: 2,
        spinach: 2,
      },
    };
    const nearestPlot = state.plots[4];
    const targets = listWorldTargets(state);
    const words = targets.map((target) => target.word);
    const carrotTarget = targets.find((target) => target.word === 'carrot');

    expect(words).toEqual(expect.arrayContaining(['turnip', 'radish', 'carrot', 'spinach']));
    expect(carrotTarget?.position).not.toEqual(nearestPlot.position);
    expect(carrotTarget?.action).toEqual({
      kind: 'plant-plot',
      plotId: nearestPlot.id,
      crop: 'carrot',
      destination: nearestPlot.position,
    });
  });

  it('uses a crop word for a lone non-starter seed packet', () => {
    const base = createFarmState();
    const state: FarmState = {
      ...base,
      seeds: {
        ...base.seeds,
        turnip: 0,
        carrot: 1,
      },
    };
    const carrotTarget = listWorldTargets(state).find((target) => target.word === 'carrot');

    expect(carrotTarget?.action).toEqual({
      kind: 'plant-plot',
      plotId: 5,
      crop: 'carrot',
      destination: state.plots[4].position,
    });
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
      'board',
      'hello',
      'favor',
      'journal',
      'pack',
      'options',
    ]);
  });

  it('keeps the town landmark visible from the farmhouse approach', () => {
    const words = listWorldTargets({
      ...createFarmState(),
      player: houseApproachPosition,
    }).map((target) => target.word);

    expect(words).toEqual(expect.arrayContaining(['door', 'town']));
  });

  it('shows sleep labels over the farmhouse bed from inside the house', () => {
    const houseState: FarmState = {
      ...createFarmState(),
      location: 'house',
      player: { x: 0, y: 2.2 },
    };
    const targets = listWorldTargets(houseState);
    const words = targets.map((target) => target.word);
    const sleepTarget = targets.find((target) => target.word === 'sleep');
    const bedTarget = targets.find((target) => target.word === 'bed');

    expect(words).toEqual(expect.arrayContaining(['outside', 'farm', 'sleep', 'bed']));
    expect(sleepTarget?.action).toEqual({
      kind: 'sleep-bed',
      destination: houseBedPosition,
    });
    expect(bedTarget?.action).toEqual({
      kind: 'sleep-bed',
      destination: houseBedPosition,
    });
  });

  it('hides the daily request label after the current request is complete', () => {
    const completeRequest = markDailyRequestComplete(1, createDailyRequestProgress()).progress;
    const townState: FarmState = {
      ...createFarmState(),
      location: 'town',
      player: { x: 0, y: 5.6 },
      dailyRequests: completeRequest,
    };

    expect(listWorldTargets(townState).map((target) => target.word)).not.toContain('favor');
  });

  it('shows the festival target in town on event days until attended', () => {
    const eventState: FarmState = {
      ...createFarmState(),
      day: 7,
      location: 'town',
      player: { x: 0, y: 5.6 },
    };

    const eventTarget = listWorldTargets(eventState).find((target) => target.word === 'festival');

    expect(eventTarget?.action).toEqual({
      kind: 'join-town-event',
      event: 'springMarketDay',
      destination: { x: 0.78, y: 5.05 },
    });

    const attendedState: FarmState = {
      ...eventState,
      townEvents: markTownEventAttended(7, eventState.townEvents).progress,
    };

    expect(listWorldTargets(attendedState).map((target) => target.word)).not.toContain('festival');
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
    const canTarget = targets.find((target) => target.word === 'can');
    const seedTargets = targets.filter((target) => target.id.startsWith('town-shop-seeds-'));
    const seedPositions = new Set(seedTargets.map((target) => `${target.position.x},${target.position.y}`));

    expect(words).toEqual(
      expect.arrayContaining([...cropCatalog.map((crop) => shopWordForCrop(crop.id)), 'can']),
    );
    expect(seedTargets).toHaveLength(cropCatalog.length);
    expect(seedPositions.size).toBe(cropCatalog.length);
    expect(seedPositions.has(`${canTarget?.position.x},${canTarget?.position.y}`)).toBe(false);
    expect(radishTarget?.action).toEqual({
      kind: 'buy-seeds',
      crop: 'radish',
      destination: townShopPosition,
    });
    expect(canTarget?.action).toEqual({
      kind: 'buy-upgrade',
      upgrade: 'wateringCan',
      destination: townShopPosition,
    });
  });

  it('hides target labels while an action is already queued', () => {
    const state = applyTypedWord(createFarmState(), 'house');

    expect(state.pendingAction?.label).toBe('house');
    expect(listWorldTargets(state)).toEqual([]);
  });
});
