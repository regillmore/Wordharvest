import { describe, expect, it } from 'vitest';
import {
  cropCatalog,
  type CropCounts,
  cropCountsWith,
  cropDefinition,
  emptyCropCounts,
  shopWordForCrop,
  stageForCropGrowth,
  starterCropId,
  validateCropCatalog,
} from './crops';

const springCropIds = [
  'turnip',
  'radish',
  'pea',
  'strawberry',
  'carrot',
  'lettuce',
  'potato',
  'onion',
  'tulip',
  'spinach',
] as const;

const emptyCounts: CropCounts = {
  turnip: 0,
  radish: 0,
  pea: 0,
  strawberry: 0,
  carrot: 0,
  lettuce: 0,
  potato: 0,
  onion: 0,
  tulip: 0,
  spinach: 0,
};

describe('crop catalog', () => {
  it('passes catalog validation', () => {
    expect(validateCropCatalog()).toEqual({ ok: true, errors: [] });
  });

  it('defines the Spring crop roster', () => {
    expect(cropCatalog.map((definition) => definition.id)).toEqual(springCropIds);
    expect(cropCatalog).toHaveLength(10);
    expect(cropCatalog.every((definition) => definition.season === 'spring')).toBe(true);
    expect(cropDefinition(starterCropId)).toMatchObject({
      id: 'turnip',
      growthDays: 3,
      sellPrice: 12,
      seedPacketPrice: 6,
      seedPacketQuantity: 3,
    });
  });

  it('keeps seed packets profitable after harvest', () => {
    expect(
      cropCatalog.every(
        (definition) => definition.seedPacketPrice < definition.sellPrice * definition.seedPacketQuantity,
      ),
    ).toBe(true);
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
    expect(cropCatalog.map((definition) => shopWordForCrop(definition.id))).toEqual(springCropIds);
  });

  it('creates count records for every crop id', () => {
    expect(emptyCropCounts()).toEqual(emptyCounts);
    expect(cropCountsWith('turnip', 3)).toEqual({
      ...emptyCounts,
      turnip: 3,
    });
  });
});
