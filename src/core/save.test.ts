import { describe, expect, it } from 'vitest';
import { advanceFarmTime, applyTypedWord, createFarmState } from './gameState';
import { deserializeSave, SAVE_SCHEMA_VERSION, serializeSave } from './save';

describe('save codec', () => {
  it('round-trips a farm state with schema metadata', () => {
    let state = createFarmState();
    state = applyTypedWord(state, 'seed');
    state = advanceFarmTime(state, 2);

    const rawSave = serializeSave(state, '2026-04-25T00:00:00.000Z');
    const parsed = JSON.parse(rawSave) as { schemaVersion: number; savedAt: string };

    expect(parsed.schemaVersion).toBe(SAVE_SCHEMA_VERSION);
    expect(parsed.savedAt).toBe('2026-04-25T00:00:00.000Z');

    const result = deserializeSave(rawSave);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.state.day).toBe(state.day);
      expect(result.state.coins).toBe(state.coins);
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
      expect(result.state.inventory.turnip).toBe(0);
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
