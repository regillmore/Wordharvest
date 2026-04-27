import { describe, expect, it } from 'vitest';
import {
  advanceDay,
  advanceFarmTime,
  applyTypedWord,
  createFarmState,
  cropInventorySummary,
  packInventorySummary,
  seedInventorySummary,
  type FarmState,
} from './gameState';

describe('farm state', () => {
  it('starts with current weather and a next-day forecast', () => {
    const state = createFarmState();

    expect(state.weather).toBe('sunny');
    expect(state.forecast).toBe('sunny');
    expect(state.upgrades.wateringCan).toBe(false);
    expect(state.seasonObjective.id).toBe('springBasket');
    expect(state.seasonObjective.completed).toBe(false);
    expect(state.weekGoals.plantFirstSeeds).toBe(false);
    expect(state.collectionLog.discoveredCrops.turnip).toBe(true);
    expect(state.collectionLog.shippedCrops.turnip).toBe(false);
  });

  it('summarizes seeds and harvested crops across the crop catalog', () => {
    const state: FarmState = {
      ...createFarmState(),
      seeds: {
        ...createFarmState().seeds,
        radish: 2,
        carrot: 1,
      },
      inventory: {
        ...createFarmState().inventory,
        turnip: 1,
        pea: 2,
      },
    };

    expect(seedInventorySummary(state)).toBe('3 turnip seeds, 2 radish seeds, 1 carrot seed');
    expect(cropInventorySummary(state)).toBe('1 turnip, 2 snap peas');
    expect(packInventorySummary(state)).toBe(
      'Pack: Seeds: 3 turnip seeds, 2 radish seeds, 1 carrot seed. Crops: 1 turnip, 2 snap peas. Collection: 1/10 found, 0/10 shipped. Found: turnip. Shipped: none.',
    );
  });

  it('queues a visible typed target before completing it on arrival', () => {
    let state = createFarmState();

    state = applyTypedWord(state, 'seed');
    expect(state.pendingAction?.label).toBe('seed');
    expect(state.pendingAction?.path.length).toBeGreaterThan(0);
    expect(state.coins).toBe(25);

    state = settleAction(state);
    expect(state.coins).toBe(28);
    expect(state.seeds.turnip).toBe(2);
    expect(state.plots[4].stage).toBe('seed');
    expect(state.weekGoals.plantFirstSeeds).toBe(true);
    expect(state.log[1]).toBe('Day 1 goal complete: first seeds planted. Reward: 3 coins.');
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

    expect(state.weather).toBe('rain');
    expect(state.plots[4].wateredToday).toBe(true);

    state = advanceDay(state);

    expect(state.plots[4].stage).toBe('ripe');

    state = applyTypedWord(state, 'pick');
    state = settleAction(state);
    expect(state.coins).toBe(32);
    expect(state.inventory.turnip).toBe(1);
    expect(state.plots[4].stage).toBe('empty');

    state = applyTypedWord(state, 'bin');
    state = settleAction(state);
    expect(state.coins).toBe(50);
    expect(state.inventory.turnip).toBe(0);
    expect(state.seasonObjective.shipped.turnip).toBe(1);
    expect(state.seasonObjective.completed).toBe(false);
    expect(state.weekGoals.shipFirstCrop).toBe(true);
    expect(state.collectionLog.shippedCrops.turnip).toBe(true);
    expect(state.log[0]).toBe('Shipped 1 turnip for 12 coins.');
  });

  it('buys turnip seeds from the visible seed source', () => {
    let state: FarmState = {
      ...createFarmState(),
      seeds: { ...createFarmState().seeds, turnip: 0 },
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
      seeds: { ...createFarmState().seeds, turnip: 0 },
    };

    state = settleAction(applyTypedWord(state, 'seed'));

    expect(state.plots[4].stage).toBe('empty');
    expect(state.seeds.turnip).toBe(0);
    expect(state.log[0]).toBe('No turnip seeds in your bag.');
  });

  it('plants non-turnip seed packets from typed crop labels', () => {
    let state: FarmState = {
      ...createFarmState(),
      seeds: {
        ...createFarmState().seeds,
        carrot: 1,
      },
    };

    state = applyTypedWord(state, 'carrot');
    expect(state.pendingAction?.label).toBe('carrot');

    state = settleAction(state);
    expect(state.plots[4].crop).toBe('carrot');
    expect(state.plots[4].stage).toBe('seed');
    expect(state.seeds.carrot).toBe(0);
    expect(state.seeds.turnip).toBe(3);
    expect(state.weekGoals.plantFirstSeeds).toBe(true);
    expect(state.collectionLog.discoveredCrops.carrot).toBe(true);
    expect(state.log[0]).toBe('Planted carrot seeds.');
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

  it('travels through the farm boundary to town and back', () => {
    let state = applyTypedWord(createFarmState(), 'town');

    expect(state.pendingAction?.label).toBe('town');
    state = settleAction(state);
    expect(state.location).toBe('town');
    expect(state.log[0]).toBe('Followed the south path toward town.');

    state = applyTypedWord(state, 'farm');
    expect(state.pendingAction?.label).toBe('farm');
    state = settleAction(state);
    expect(state.location).toBe('farm');
    expect(state.log[0]).toBe('Walked back up the lane to the farm.');
  });

  it('supports town shop and villager targets', () => {
    let state = settleAction(applyTypedWord(createFarmState(), 'town'));

    state = settleAction(applyTypedWord(state, 'shop'));
    expect(state.location).toBe('town');
    expect(state.weekGoals.visitTownShop).toBe(true);
    expect(state.log[0]).toMatch(/^The shop shelf is open:/);
    expect(state.log[0]).toContain('turnip');
    expect(state.log[0]).toContain('spinach');
    expect(state.log[0]).toContain('can');

    state = settleAction(applyTypedWord(state, 'hello'));
    expect(state.location).toBe('town');
    expect(state.log[0]).toBe('Mira says hello and asks how the turnips are growing.');
  });

  it('buys catalog seed packets from town shop crop words', () => {
    let state = settleAction(applyTypedWord(createFarmState(), 'town'));

    state = settleAction(applyTypedWord(state, 'shop'));
    state = applyTypedWord(state, 'radish');

    expect(state.pendingAction).toBeNull();
    expect(state.coins).toBe(26);
    expect(state.seeds.radish).toBe(2);
    expect(state.weekGoals.buySpringSeeds).toBe(true);
    expect(state.collectionLog.discoveredCrops.radish).toBe(true);
    expect(state.log[0]).toBe('Bought 2 radish seeds for 8 coins.');
    expect(state.log[1]).toBe('Day 4 goal complete: a new seed packet is in the bag. Reward: 5 coins.');

    state = applyTypedWord(state, 'carrot');

    expect(state.coins).toBe(19);
    expect(state.seeds.carrot).toBe(2);
    expect(state.collectionLog.discoveredCrops.carrot).toBe(true);
    expect(state.log[0]).toBe('Bought 2 carrot seeds for 7 coins.');

    state = applyTypedWord({ ...state, coins: 0 }, 'strawberry');

    expect(state.coins).toBe(0);
    expect(state.seeds.strawberry).toBe(0);
    expect(state.log[0]).toBe('Strawberry starts cost 16 coins.');
  });

  it('buys the watering can upgrade and removes watering stamina cost', () => {
    let state = settleAction(applyTypedWord(createFarmState(), 'town'));

    state = settleAction(applyTypedWord(state, 'shop'));
    state = applyTypedWord(state, 'can');

    expect(state.coins).toBe(25);
    expect(state.upgrades.wateringCan).toBe(true);
    expect(state.weekGoals.buyTinCan).toBe(true);
    expect(state.log[0]).toBe('Bought the tin watering can for 12 coins.');
    expect(state.log[1]).toBe('Day 6 goal complete: the tin watering can is ready. Reward: 8 coins.');

    state = applyTypedWord(state, 'can');

    expect(state.coins).toBe(25);
    expect(state.log[0]).toBe('The tin watering can is already yours.');

    state = settleAction(applyTypedWord(state, 'farm'));
    state = settleAction(applyTypedWord(state, 'seed'));
    state = settleAction(applyTypedWord(state, 'water'));

    expect(state.stamina).toBe(9);
    expect(state.plots[4].wateredToday).toBe(true);
    expect(state.weekGoals.waterFirstCrop).toBe(true);
  });

  it('opens menu targets without queuing a walk', () => {
    const state = applyTypedWord(createFarmState(), 'journal');

    expect(state.pendingAction).toBeNull();
    expect(state.log[0]).toBe(
      'Journal: Day 1, Sunny today, sunny tomorrow, 25 coins, 3 turnip seeds, basic can. Spring Basket: 0/3 crops shipped (turnip 0/1, radish 0/1, carrot 0/1). First Week: 0/7 goals done. Today: Plant first seeds - Plant any seed in a farm plot. Reward: 3 coins.',
    );

    const packState = applyTypedWord(
      {
        ...createFarmState(),
        seeds: {
          ...createFarmState().seeds,
          radish: 2,
        },
        inventory: {
          ...createFarmState().inventory,
          carrot: 1,
        },
      },
      'pack',
    );

    expect(packState.pendingAction).toBeNull();
    expect(packState.log[0]).toBe(
      'Pack: Seeds: 3 turnip seeds, 2 radish seeds. Crops: 1 carrot. Collection: 1/10 found, 0/10 shipped. Found: turnip. Shipped: none.',
    );
  });

  it('advances weather and lets rain water planted crops at dawn', () => {
    let state = settleAction(applyTypedWord(createFarmState(), 'seed'));

    state = advanceDay(state);
    expect(state.day).toBe(2);
    expect(state.weather).toBe('sunny');
    expect(state.forecast).toBe('rain');
    expect(state.plots[4].wateredToday).toBe(false);
    expect(state.log[0]).toBe(
      'Day 2 dawns sunny. Tomorrow: rain. Goal: Water a growing crop. Water any planted crop before ending the day. Reward: 4 coins.',
    );

    state = advanceDay(state);
    expect(state.day).toBe(3);
    expect(state.weather).toBe('rain');
    expect(state.forecast).toBe('sunny');
    expect(state.plots[4].wateredToday).toBe(true);
    expect(state.log[0]).toBe(
      'Day 3 dawns with rain. Rain watered planted crops. Tomorrow: sunny. Goal: Visit the town shop. Type shop in town to inspect the seed shelf. Reward: 4 coins.',
    );
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

  it('ships every harvested crop using catalog prices', () => {
    let state = applyTypedWord(
      {
        ...createFarmState(),
        inventory: {
          ...createFarmState().inventory,
          radish: 2,
          pea: 1,
        },
      },
      'bin',
    );

    state = settleAction(state);

    expect(state.coins).toBe(89);
    expect(state.inventory.radish).toBe(0);
    expect(state.inventory.pea).toBe(0);
    expect(state.seasonObjective.shipped.radish).toBe(2);
    expect(state.weekGoals.shipFirstCrop).toBe(true);
    expect(state.collectionLog.discoveredCrops.pea).toBe(true);
    expect(state.collectionLog.shippedCrops.radish).toBe(true);
    expect(state.collectionLog.shippedCrops.pea).toBe(true);
    expect(state.log[0]).toBe('Shipped 2 radishes and 1 snap pea for 58 coins.');
  });

  it('completes the Spring Basket objective from required shipments', () => {
    let state = applyTypedWord(
      {
        ...createFarmState(),
        coins: 0,
        inventory: {
          ...createFarmState().inventory,
          turnip: 1,
          radish: 1,
          carrot: 1,
        },
      },
      'bin',
    );

    state = settleAction(state);

    expect(state.coins).toBe(87);
    expect(state.inventory.turnip).toBe(0);
    expect(state.inventory.radish).toBe(0);
    expect(state.inventory.carrot).toBe(0);
    expect(state.seasonObjective.completed).toBe(true);
    expect(state.weekGoals.completeSpringBasket).toBe(true);
    expect(state.collectionLog.shippedCrops.turnip).toBe(true);
    expect(state.collectionLog.shippedCrops.radish).toBe(true);
    expect(state.collectionLog.shippedCrops.carrot).toBe(true);
    expect(state.log[0]).toBe('Spring Basket complete! Mira added 25 coins for the market table.');
    expect(state.log[1]).toBe('Shipped 1 turnip and 1 radish and 1 carrot for 46 coins.');
    expect(state.log[2]).toBe('Day 5 goal complete: the first crop shipment went out. Reward: 6 coins.');
    expect(state.log[3]).toBe('Day 7 goal complete: Spring Basket is finished. Reward: 10 coins.');

    const journalState = applyTypedWord(state, 'journal');

    expect(journalState.log[0]).toContain(
      "Spring Basket: complete. Mira's market table is stocked for spring. Reward received: 25 coins.",
    );
    expect(journalState.log[0]).toContain(
      "Market Encore: 3/5 crop varieties shipped. 2 more varieties will broaden Mira's market stall.",
    );
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
