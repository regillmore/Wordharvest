import { describe, expect, it } from 'vitest';
import { farmMapBounds, farmTileAt, farmTiles, isFarmTileKind } from './farmMap';

describe('farm map', () => {
  it('has one tile for every coordinate inside the map bounds', () => {
    expect(farmTiles).toHaveLength(farmMapBounds.width * farmMapBounds.height);
  });

  it('places important gameplay areas on matching tile types', () => {
    expect(farmTileAt({ x: 0, y: 1 })?.kind).toBe('path');
    expect(farmTileAt({ x: 0, y: 3 })?.kind).toBe('soil');
    expect(farmTileAt({ x: 2, y: 4.4 })?.kind).toBe('path');
  });

  it('recognizes all authored tile kinds', () => {
    expect(isFarmTileKind('grass')).toBe(true);
    expect(isFarmTileKind('soil')).toBe(true);
    expect(isFarmTileKind('bog')).toBe(false);
  });
});
