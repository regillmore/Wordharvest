import { describe, expect, it } from 'vitest';
import {
  cropCatalog,
  cropCountsWith,
  cropDefinition,
  emptyCropCounts,
  shopWordForCrop,
  stageForCropGrowth,
  starterCropId,
  validateCropCatalog,
} from './crops';

describe('crop catalog', () => {
  it('passes catalog validation', () => {
    expect(validateCropCatalog()).toEqual({ ok: true, errors: [] });
  });

  it('defines the first Spring crop data set', () => {
    expect(cropCatalog.map((definition) => definition.id)).toEqual(['turnip', 'radish', 'pea', 'strawberry']);
    expect(cropCatalog.every((definition) => definition.season === 'spring')).toBe(true);
    expect(cropDefinition(starterCropId)).toMatchObject({
      id: 'turnip',
      growthDays: 3,
      sellPrice: 12,
      seedPacketPrice: 6,
      seedPacketQuantity: 3,
    });
  });

  it('maps crop growth to content-defined stages', () => {
    expect(stageForCropGrowth('turnip', 0)).toBe('seed');
    expect(stageForCropGrowth('turnip', 1)).toBe('sprout');
    expect(stageForCropGrowth('turnip', 2)).toBe('leaf');
    expect(stageForCropGrowth('turnip', 3)).toBe('ripe');
    expect(stageForCropGrowth('radish', 3)).toBe('leaf');
    expect(stageForCropGrowth('radish', 4)).toBe('ripe');
  });

  it('provides primary shop words from crop tags', () => {
    expect(cropCatalog.map((definition) => shopWordForCrop(definition.id))).toEqual([
      'turnip',
      'radish',
      'pea',
      'strawberry',
    ]);
  });

  it('creates count records for every crop id', () => {
    expect(emptyCropCounts()).toEqual({
      turnip: 0,
      radish: 0,
      pea: 0,
      strawberry: 0,
    });
    expect(cropCountsWith('turnip', 3)).toEqual({
      turnip: 3,
      radish: 0,
      pea: 0,
      strawberry: 0,
    });
  });
});
