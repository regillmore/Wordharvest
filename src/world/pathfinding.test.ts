import { describe, expect, it } from 'vitest';
import { doorPosition, shippingBinPosition } from '../core/worldTargets';
import { findFarmPath, isWalkableFarmTile, pointToTilePoint, walkableFarmTileKinds } from './pathfinding';
import { farmTileAt } from './farmMap';

describe('farm pathfinding', () => {
  it('finds a tile route between the starting farm area and important targets', () => {
    const toDoor = findFarmPath({ x: 0, y: 5 }, doorPosition);
    const toBin = findFarmPath({ x: 0, y: 5 }, shippingBinPosition);

    expect(toDoor.ok).toBe(true);
    expect(toDoor.path.length).toBeGreaterThan(0);
    expect(toBin.ok).toBe(true);
    expect(toBin.path.at(-1)).toEqual(shippingBinPosition);
  });

  it('rejects blocked destination tiles', () => {
    const blockedPath = findFarmPath({ x: 0, y: 5 }, { x: 3, y: 5 });

    expect(farmTileAt({ x: 3, y: 5 })?.kind).toBe('water');
    expect(blockedPath).toEqual({ ok: false, path: [] });
  });

  it('treats authored fence tiles as blockers', () => {
    const blockedPath = findFarmPath({ x: 0, y: 5 }, { x: -4, y: 2 });
    const fenceTile = farmTileAt({ x: -4, y: 2 });

    expect(fenceTile?.kind).toBe('fence');
    expect(isWalkableFarmTile(fenceTile)).toBe(false);
    expect(blockedPath).toEqual({ ok: false, path: [] });
  });

  it('rounds world points to tile coordinates for path lookup', () => {
    expect(pointToTilePoint({ x: 2, y: 4.4 })).toEqual({ x: 2, y: 4 });
  });

  it('defines walkable and blocked tile kinds', () => {
    expect(walkableFarmTileKinds()).toEqual(['grass', 'meadow', 'path', 'soil']);
    expect(isWalkableFarmTile(farmTileAt({ x: 0, y: 5 }))).toBe(true);
    expect(isWalkableFarmTile(farmTileAt({ x: 0, y: 0 }))).toBe(false);
  });
});
