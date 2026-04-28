import { describe, expect, it } from 'vitest';
import {
  farmReturnPosition,
  townArrivalPosition,
  townRequestBoardPosition,
  townShopPosition,
  townVillagerPosition,
} from '../core/worldTargets';
import { isTownTileKind, townMapBounds, townTileAt, townTiles } from './townMap';

describe('town map', () => {
  it('has one tile for every coordinate inside the map bounds', () => {
    expect(townTiles).toHaveLength(townMapBounds.width * townMapBounds.height);
  });

  it('places important town targets on walkable grid tiles', () => {
    expect(townTileAt(townArrivalPosition)?.kind).toBe('path');
    expect(townTileAt(farmReturnPosition)?.kind).toBe('path');
    expect(townTileAt(townShopPosition)?.kind).toBe('path');
    expect(townTileAt(townRequestBoardPosition)?.kind).toBe('plaza');
    expect(townTileAt(townVillagerPosition)?.kind).toBe('path');
  });

  it('keeps old town-edge save positions on walkable tiles', () => {
    expect(townTileAt({ x: -2, y: 5.1 })?.kind).toBe('path');
    expect(townTileAt({ x: -0.82, y: 5.08 })?.kind).toBe('path');
    expect(townTileAt({ x: 2, y: 5.15 })?.kind).toBe('path');
  });

  it('authors blocked foundations and fenced edges around the town grid', () => {
    expect(townTiles.filter((tile) => tile.kind === 'foundation').length).toBeGreaterThan(0);
    expect(townTiles.filter((tile) => tile.kind === 'fence').length).toBeGreaterThan(0);
    expect(townTileAt({ x: -4, y: 3 })?.kind).toBe('fence');
    expect(townTileAt({ x: -2, y: 1 })?.kind).toBe('foundation');
  });

  it('recognizes all authored town tile kinds', () => {
    expect(isTownTileKind('grass')).toBe(true);
    expect(isTownTileKind('path')).toBe(true);
    expect(isTownTileKind('plaza')).toBe(true);
    expect(isTownTileKind('foundation')).toBe(true);
    expect(isTownTileKind('flower')).toBe(true);
    expect(isTownTileKind('fence')).toBe(true);
    expect(isTownTileKind('bog')).toBe(false);
  });
});
