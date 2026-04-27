import { describe, expect, it } from 'vitest';
import { advanceFarmTime, applyTypedWord, createFarmState } from './gameState';
import { deserializeSave, SAVE_SCHEMA_VERSION, serializeSave } from './save';

describe('save codec', () => {
  it('round-trips a farm state with schema metadata', () => {
    let state = createFarmState();
    state = applyTypedWord(state, 'seed');
    state = advanceFarmTime(state, 2);
    state = { ...state, upgrades: { ...state.upgrades, wateringCan: true } };

    const rawSave = serializeSave(state, '2026-04-25T00:00:00.000Z');
    const parsed = JSON.parse(rawSave) as { schemaVersion: number; savedAt: string };

    expect(parsed.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(parsed.savedAt).toBe('2026-04-25T00:00:00.000Z');

    const result = deserializeSave(rawSave);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.day).toBe(state.day);
      expect(result.state.coins).toBe(state.coins);
      expect(result.state.seeds.turnip).toBe(state.seeds.turnip);
      expect(result.state.seeds.radish).toBe(0);
      expect(result.state.seeds.carrot).toBe(0);
      expect(result.state.weather).toBe(state.weather);
      expect(result.state.forecast).toBe(state.forecast);
      expect(result.state.upgrades.wateringCan).toBe(state.upgrades.wateringCan);
      expect(result.state.seasonObjective.id).toBe('springBasket');
      expect(result.state.seasonObjective.shipped.turnip).toBe(0);
      expect(result.state.weekGoals.plantFirstSeeds).toBe(true);
      expect(result.state.collectionLog.discoveredCrops.turnip).toBe(true);
      expect(result.state.collectionLog.shippedCrops.turnip).toBe(false);
      expect(result.state.plots).toEqual(state.plots);
      expect(result.state.pendingAction).toBeNull();
      expect(result.migrated).toBe(false);
    }
  });

  it('does not persist in-progress walking actions', () => {
    const state = applyTypedWord(createFarmState(), 'house');
    const result = deserializeSave(serializeSave(state));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.pendingAction).toBeNull();
      expect(result.state.player).toEqual(createFarmState().player);
    }
  });

  it('round-trips the town location', () => {
    const state = {
      ...createFarmState(),
      location: 'town' as const,
      player: { x: 0, y: 5.6 },
    };
    const result = deserializeSave(serializeSave(state));

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.location).toBe('town');
      expect(result.state.player).toEqual({ x: 0, y: 5.6 });
    }
  });

  it('migrates a version 6 save by adding inferred collection log progress', () => {
    const olderState = {
      ...createFarmState(),
      seeds: {
        ...createFarmState().seeds,
        radish: 2,
      },
      inventory: {
        ...createFarmState().inventory,
        carrot: 1,
      },
      seasonObjective: {
        ...createFarmState().seasonObjective,
        shipped: {
          ...createFarmState().seasonObjective.shipped,
          pea: 1,
        },
      },
      plots: createFarmState().plots.map((plot) => (plot.id === 1 ? { ...plot, crop: 'potato' as const } : plot)),
    };
    const result = deserializeSave(
      JSON.stringify({
        schemaVersion: 6,
        savedAt: '2026-04-20T00:00:00.000Z',
        state: {
          ...olderState,
          collectionLog: undefined,
          pendingAction: undefined,
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.collectionLog.discoveredCrops.turnip).toBe(true);
      expect(result.state.collectionLog.discoveredCrops.radish).toBe(true);
      expect(result.state.collectionLog.discoveredCrops.carrot).toBe(true);
      expect(result.state.collectionLog.discoveredCrops.pea).toBe(true);
      expect(result.state.collectionLog.discoveredCrops.potato).toBe(true);
      expect(result.state.collectionLog.shippedCrops.pea).toBe(true);
      expect(result.state.collectionLog.shippedCrops.radish).toBe(false);
      expect(result.migrated).toBe(true);
    }
  });

  it('migrates a version 5 save by adding first-week pacing goals', () => {
    const olderState = createFarmState();
    const result = deserializeSave(
      JSON.stringify({
        schemaVersion: 5,
        savedAt: '2026-04-15T00:00:00.000Z',
        state: {
          ...olderState,
          weekGoals: undefined,
          pendingAction: undefined,
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.weekGoals.plantFirstSeeds).toBe(false);
      expect(result.state.weekGoals.completeSpringBasket).toBe(false);
      expect(result.state.collectionLog.discoveredCrops.turnip).toBe(true);
      expect(result.migrated).toBe(true);
    }
  });

  it('migrates a version 4 save by adding the first-season objective', () => {
    const olderState = createFarmState();
    const result = deserializeSave(
      JSON.stringify({
        schemaVersion: 4,
        savedAt: '2026-04-01T00:00:00.000Z',
        state: {
          ...olderState,
          seasonObjective: undefined,
          weekGoals: undefined,
          pendingAction: undefined,
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.seasonObjective.id).toBe('springBasket');
      expect(result.state.seasonObjective.completed).toBe(false);
      expect(result.state.seasonObjective.shipped.carrot).toBe(0);
      expect(result.state.weekGoals.buyTinCan).toBe(false);
      expect(result.migrated).toBe(true);
    }
  });

  it('migrates a version 3 save by adding upgrade flags', () => {
    const olderState = createFarmState();
    const result = deserializeSave(
      JSON.stringify({
        schemaVersion: 3,
        savedAt: '2026-03-15T00:00:00.000Z',
        state: {
          ...olderState,
          upgrades: undefined,
          pendingAction: undefined,
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.upgrades.wateringCan).toBe(false);
      expect(result.migrated).toBe(true);
    }
  });

  it('migrates a version 2 save by adding weather and normalizing crop counts', () => {
    const olderState = createFarmState();
    const result = deserializeSave(
      JSON.stringify({
        schemaVersion: 2,
        savedAt: '2026-03-01T00:00:00.000Z',
        state: {
          ...olderState,
          weather: undefined,
          forecast: undefined,
          seeds: { turnip: 1 },
          inventory: { turnip: 2 },
          pendingAction: undefined,
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.seeds.turnip).toBe(1);
      expect(result.state.seeds.radish).toBe(0);
      expect(result.state.seeds.spinach).toBe(0);
      expect(result.state.inventory.turnip).toBe(2);
      expect(result.state.inventory.pea).toBe(0);
      expect(result.state.inventory.potato).toBe(0);
      expect(result.state.weather).toBe('sunny');
      expect(result.state.forecast).toBe('sunny');
      expect(result.state.upgrades.wateringCan).toBe(false);
      expect(result.migrated).toBe(true);
    }
  });

  it('migrates a version 1 save by adding seed inventory', () => {
    const olderState = createFarmState();
    const result = deserializeSave(
      JSON.stringify({
        schemaVersion: 1,
        savedAt: '2026-02-01T00:00:00.000Z',
        state: {
          ...olderState,
          seeds: undefined,
          pendingAction: undefined,
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.savedAt).toBe('2026-02-01T00:00:00.000Z');
      expect(result.state.seeds.turnip).toBe(3);
      expect(result.state.weather).toBe('sunny');
      expect(result.state.forecast).toBe('sunny');
      expect(result.state.upgrades.wateringCan).toBe(false);
      expect(result.state.pendingAction).toBeNull();
      expect(result.migrated).toBe(true);
    }
  });

  it('migrates a version 0 save into the current farm state shape', () => {
    const olderState = createFarmState();
    const result = deserializeSave(
      JSON.stringify({
        schemaVersion: 0,
        savedAt: '2026-01-01T00:00:00.000Z',
        state: {
          ...olderState,
          inventory: undefined,
          pendingAction: undefined,
        },
      }),
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.savedAt).toBe('2026-01-01T00:00:00.000Z');
      expect(result.state.seeds.turnip).toBe(3);
      expect(result.state.inventory.turnip).toBe(0);
      expect(result.state.weather).toBe('sunny');
      expect(result.state.forecast).toBe('sunny');
      expect(result.state.upgrades.wateringCan).toBe(false);
      expect(result.state.pendingAction).toBeNull();
      expect(result.migrated).toBe(true);
    }
  });

  it('rejects malformed and unsupported saves', () => {
    expect(deserializeSave('not json')).toEqual({ ok: false, error: 'Save data is not valid JSON.' });
    expect(deserializeSave(JSON.stringify({ schemaVersion: 999 }))).toEqual({
      ok: false,
      error: 'Save data uses an unsupported schema version.',
    });
  });
});
