import { describe, expect, it } from 'vitest';
import {
  doorPosition,
  houseInteriorEntryPosition,
  houseInteriorExitPosition,
  shippingBinPosition,
  townArrivalPosition,
  townRequestBoardPosition,
  townShopPosition,
  townVillagerPosition,
} from '../core/worldTargets';
import {
  findFarmPath,
  findPathForLocation,
  findTownPath,
  isWalkableFarmTile,
  isWalkableTownTile,
  pointToTilePoint,
  walkableFarmTileKinds,
  walkableTownTileKinds,
} from './pathfinding';
import { farmTileAt } from './farmMap';
import { townTileAt } from './townMap';

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

  it('finds a tile route through the authored town grid', () => {
    const toShop = findTownPath(townArrivalPosition, townShopPosition);
    const toBoard = findTownPath(townArrivalPosition, townRequestBoardPosition);
    const toVillager = findTownPath(townArrivalPosition, townVillagerPosition);

    expect(toShop.ok).toBe(true);
    expect(toShop.path.at(-1)).toEqual(townShopPosition);
    expect(toBoard.ok).toBe(true);
    expect(toBoard.path.at(-1)).toEqual(townRequestBoardPosition);
    expect(toVillager.ok).toBe(true);
    expect(toVillager.path.at(-1)).toEqual(townVillagerPosition);
  });

  it('selects the town grid for town path previews and actions', () => {
    const townOnlyDestination = { x: 3, y: 6 };
    const townPath = findPathForLocation('town', townArrivalPosition, townOnlyDestination);

    expect(townPath.ok).toBe(true);
    expect(townPath.path.at(-1)).toEqual(townOnlyDestination);
    expect(findPathForLocation('farm', townArrivalPosition, townOnlyDestination).ok).toBe(false);
  });

  it('rejects blocked town destination tiles', () => {
    const blockedPath = findTownPath(townArrivalPosition, { x: -2, y: 1 });

    expect(townTileAt({ x: -2, y: 1 })?.kind).toBe('foundation');
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

  it('walks directly to fractional destinations instead of overshooting the goal tile center', () => {
    const toHouseExit = findFarmPath(houseInteriorEntryPosition, houseInteriorExitPosition);

    expect(toHouseExit.ok).toBe(true);
    expect(toHouseExit.path).toEqual([houseInteriorExitPosition]);
  });

  it('defines walkable and blocked tile kinds', () => {
    expect(walkableFarmTileKinds()).toEqual(['grass', 'meadow', 'path', 'soil']);
    expect(walkableTownTileKinds()).toEqual(['grass', 'path', 'plaza']);
    expect(isWalkableFarmTile(farmTileAt({ x: 0, y: 5 }))).toBe(true);
    expect(isWalkableFarmTile(farmTileAt({ x: 0, y: 0 }))).toBe(false);
    expect(isWalkableTownTile(townTileAt(townArrivalPosition))).toBe(true);
    expect(isWalkableTownTile(townTileAt({ x: -2, y: 1 }))).toBe(false);
  });
});
