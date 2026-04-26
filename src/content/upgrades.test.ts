import { describe, expect, it } from 'vitest';
import {
  emptyUpgradeFlags,
  shopWordForUpgrade,
  upgradeCatalog,
  upgradeDefinition,
  validateUpgradeCatalog,
} from './upgrades';

describe('upgrade catalog', () => {
  it('passes catalog validation', () => {
    expect(validateUpgradeCatalog()).toEqual({ ok: true, errors: [] });
  });

  it('defines the first shop upgrade', () => {
    expect(upgradeCatalog.map((definition) => definition.id)).toEqual(['wateringCan']);
    expect(upgradeDefinition('wateringCan')).toMatchObject({
      name: 'Tin watering can',
      shopWord: 'can',
      cost: 12,
    });
    expect(shopWordForUpgrade('wateringCan')).toBe('can');
  });

  it('creates false flags for every upgrade', () => {
    expect(emptyUpgradeFlags()).toEqual({
      wateringCan: false,
    });
  });
});
