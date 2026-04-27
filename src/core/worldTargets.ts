import { nextWordForTargetRole, primaryWordForTargetRole, type TargetWordRole } from '../content/targetWords';
import { cropCatalog, shopWordForCrop, starterCropId, type CropId } from '../content/crops';
import { dailyRequestForDay, isDailyRequestComplete } from '../content/dailyRequests';
import { shopWordForUpgrade, upgradeCatalog, type UpgradeId } from '../content/upgrades';
import type { CropPlot, FarmState } from './gameState';
import { normalizeTypedWord } from './typing';

export interface WorldPoint {
  x: number;
  y: number;
}

export type MenuId = 'journal' | 'inventory' | 'options';

export type WorldTargetAction =
  | { kind: 'approach-house'; destination: WorldPoint }
  | { kind: 'enter-house' }
  | { kind: 'exit-house'; destination: WorldPoint }
  | { kind: 'enter-town'; destination: WorldPoint }
  | { kind: 'return-farm'; destination: WorldPoint }
  | { kind: 'visit-shop' }
  | { kind: 'talk-villager' }
  | { kind: 'complete-daily-request'; destination: WorldPoint }
  | { kind: 'open-menu'; menu: MenuId; destination: WorldPoint }
  | { kind: 'ship-inventory' }
  | { kind: 'buy-seeds'; crop: CropId; destination: WorldPoint }
  | { kind: 'buy-upgrade'; upgrade: UpgradeId; destination: WorldPoint }
  | { kind: 'plant-plot'; plotId: number; crop: CropId; destination: WorldPoint }
  | { kind: 'water-plot'; plotId: number }
  | { kind: 'harvest-plot'; plotId: number }
  | { kind: 'inspect-plot'; plotId: number };

export interface WorldTarget {
  id: string;
  word: string;
  label: string;
  position: WorldPoint;
  distance: number;
  action: WorldTargetAction;
}

export const housePosition: WorldPoint = { x: 0, y: 0 };
export const doorPosition: WorldPoint = { x: 0, y: 1 };
export const houseApproachPosition: WorldPoint = { x: 0, y: 1.7 };
export const houseExitPosition: WorldPoint = { x: 0, y: 1.9 };
export const shippingBinPosition: WorldPoint = { x: 2, y: 4.4 };
export const seedSourcePosition: WorldPoint = { x: -2, y: 2.4 };
export const townGatePosition: WorldPoint = { x: 0, y: 6 };
export const townArrivalPosition: WorldPoint = { x: 0, y: 5.6 };
export const farmReturnPosition: WorldPoint = { x: 0, y: 5.7 };
export const townShopPosition: WorldPoint = { x: -2, y: 5.1 };
export const townVillagerPosition: WorldPoint = { x: 2, y: 5.15 };

const houseSightRange = 7;
const doorActionRange = 2;
const cropActionRange = 2.15;
const shippingBinRange = 3.2;
const seedSourceRange = 4;
const townGateRange = 2.4;
const shopShelfRange = 1.2;

const shopUpgradeLabelOffsets: readonly WorldPoint[] = [{ x: 1.55, y: 0.21 }];

export function listWorldTargets(state: FarmState): WorldTarget[] {
  if (state.pendingAction) {
    return [];
  }

  if (state.location === 'house') {
    return withMenuTargets(state, [
      {
        id: 'house-exit',
        word: primaryWordForTargetRole('exit-outside'),
        label: primaryWordForTargetRole('exit-outside'),
        position: { x: 0, y: 2.4 },
        distance: 0,
        action: { kind: 'exit-house', destination: houseExitPosition },
      },
      {
        id: 'farm-exit',
        word: primaryWordForTargetRole('exit-farm'),
        label: primaryWordForTargetRole('exit-farm'),
        position: { x: 1.2, y: 2.1 },
        distance: 0,
        action: { kind: 'exit-house', destination: houseExitPosition },
      },
    ]);
  }

  if (state.location === 'town') {
    const dailyRequest = dailyRequestForDay(state.day);
    const townTargets: WorldTarget[] = [
      {
        id: 'town-farm-return',
        word: primaryWordForTargetRole('exit-farm'),
        label: primaryWordForTargetRole('exit-farm'),
        position: farmReturnPosition,
        distance: distanceBetween(state.player, farmReturnPosition),
        action: { kind: 'return-farm', destination: farmReturnPosition },
      },
      {
        id: 'town-shop',
        word: primaryWordForTargetRole('town-shop'),
        label: primaryWordForTargetRole('town-shop'),
        position: townShopPosition,
        distance: distanceBetween(state.player, townShopPosition),
        action: { kind: 'visit-shop' },
      },
      {
        id: 'town-villager',
        word: primaryWordForTargetRole('talk-villager'),
        label: primaryWordForTargetRole('talk-villager'),
        position: townVillagerPosition,
        distance: distanceBetween(state.player, townVillagerPosition),
        action: { kind: 'talk-villager' },
      },
    ];

    if (!isDailyRequestComplete(state.day, state.dailyRequests)) {
      townTargets.push({
        id: `town-request-${dailyRequest.id}`,
        word: dailyRequest.word,
        label: dailyRequest.word,
        position: { x: townVillagerPosition.x, y: townVillagerPosition.y - 0.62 },
        distance: distanceBetween(state.player, townVillagerPosition),
        action: { kind: 'complete-daily-request', destination: townVillagerPosition },
      });
    }

    if (distanceBetween(state.player, townShopPosition) <= shopShelfRange) {
      townTargets.push(...shopSeedTargets(state.player));
      townTargets.push(...shopUpgradeTargets(state.player));
    }

    return withMenuTargets(state, townTargets);
  }

  const targets: WorldTarget[] = [];
  const doorDistance = distanceBetween(state.player, doorPosition);
  const houseDistance = distanceBetween(state.player, housePosition);
  const shippingBinDistance = distanceBetween(state.player, shippingBinPosition);
  const seedSourceDistance = distanceBetween(state.player, seedSourcePosition);
  const townGateDistance = distanceBetween(state.player, townGatePosition);

  if (doorDistance <= doorActionRange) {
    targets.push({
      id: 'farmhouse-door',
      word: primaryWordForTargetRole('enter-house'),
      label: primaryWordForTargetRole('enter-house'),
      position: doorPosition,
      distance: doorDistance,
      action: { kind: 'enter-house' },
    });
  } else if (houseDistance <= houseSightRange) {
    targets.push({
      id: 'farmhouse',
      word: primaryWordForTargetRole('approach-house'),
      label: primaryWordForTargetRole('approach-house'),
      position: housePosition,
      distance: houseDistance,
      action: { kind: 'approach-house', destination: houseApproachPosition },
    });
  }

  if (shippingBinDistance <= shippingBinRange) {
    targets.push({
      id: 'shipping-bin',
      word: primaryWordForTargetRole('ship-bin'),
      label: primaryWordForTargetRole('ship-bin'),
      position: shippingBinPosition,
      distance: shippingBinDistance,
      action: { kind: 'ship-inventory' },
    });
  }

  if (seedSourceDistance <= seedSourceRange) {
    targets.push({
      id: 'seed-source',
      word: primaryWordForTargetRole('seed-source'),
      label: primaryWordForTargetRole('seed-source'),
      position: seedSourcePosition,
      distance: seedSourceDistance,
      action: { kind: 'buy-seeds', crop: starterCropId, destination: seedSourcePosition },
    });
  }

  if (townGateDistance <= townGateRange) {
    targets.push({
      id: 'town-gate',
      word: primaryWordForTargetRole('enter-town'),
      label: primaryWordForTargetRole('enter-town'),
      position: townGatePosition,
      distance: townGateDistance,
      action: { kind: 'enter-town', destination: townGatePosition },
    });
  }

  const visiblePlots = state.plots
    .map((plot) => ({
      plot,
      distance: distanceBetween(state.player, plot.position),
    }))
    .filter(({ distance }) => distance <= cropActionRange)
    .sort((left, right) => left.distance - right.distance || left.plot.id - right.plot.id);

  const actionWordIndexes: Partial<Record<TargetWordRole, number>> = {};

  targets.push(...plantTargetsForEmptyPlots(state, visiblePlots, actionWordIndexes));

  for (const { plot, distance } of visiblePlots.filter(({ plot }) => plot.crop)) {
    const target = targetForPlantedPlot(plot, distance, actionWordIndexes);

    if (target) {
      targets.push(target);
    }
  }

  return withMenuTargets(state, targets);
}

export function resolveWorldTarget(state: FarmState, typedWord: string): WorldTarget | undefined {
  const word = normalizeTypedWord(typedWord);

  if (!word) {
    return undefined;
  }

  return listWorldTargets(state).find((target) => target.word === word);
}

export function destinationForWorldTarget(target: WorldTarget): WorldPoint {
  if (
    target.action.kind === 'approach-house' ||
    target.action.kind === 'exit-house' ||
    target.action.kind === 'enter-town' ||
    target.action.kind === 'return-farm' ||
    target.action.kind === 'complete-daily-request' ||
    target.action.kind === 'open-menu' ||
    target.action.kind === 'buy-seeds' ||
    target.action.kind === 'buy-upgrade' ||
    target.action.kind === 'plant-plot'
  ) {
    return target.action.destination;
  }

  return target.position;
}

export function distanceBetween(left: WorldPoint, right: WorldPoint): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function withMenuTargets(state: FarmState, targets: WorldTarget[]): WorldTarget[] {
  const menuTargets = [
    menuTarget(state.player, 'open-journal', 'journal', -0.88),
    menuTarget(state.player, 'open-inventory', 'inventory', 0),
    menuTarget(state.player, 'open-options', 'options', 0.88),
  ];

  return [...targets, ...menuTargets];
}

function menuTarget(
  player: WorldPoint,
  role: Extract<TargetWordRole, 'open-journal' | 'open-inventory' | 'open-options'>,
  menu: MenuId,
  offsetX: number,
): WorldTarget {
  const position = { x: player.x + offsetX, y: player.y - 0.72 };

  return {
    id: `menu-${menu}`,
    word: primaryWordForTargetRole(role),
    label: primaryWordForTargetRole(role),
    position,
    distance: 0,
    action: { kind: 'open-menu', menu, destination: { ...player } },
  };
}

function shopSeedTargets(player: WorldPoint): WorldTarget[] {
  return cropCatalog.map((crop, index) => {
    const offset = shopSeedLabelOffset(index);
    const position = {
      x: townShopPosition.x + offset.x,
      y: townShopPosition.y + offset.y,
    };
    const word = shopWordForCrop(crop.id);

    return {
      id: `town-shop-seeds-${crop.id}`,
      word,
      label: word,
      position,
      distance: distanceBetween(player, townShopPosition),
      action: { kind: 'buy-seeds', crop: crop.id, destination: townShopPosition },
    };
  });
}

function shopSeedLabelOffset(index: number): WorldPoint {
  const columns = 3;
  const column = index % columns;
  const row = Math.floor(index / columns);

  return {
    x: -1.55 + column * 1.55,
    y: -1.35 + row * 0.52,
  };
}

function shopUpgradeTargets(player: WorldPoint): WorldTarget[] {
  return upgradeCatalog.map((upgrade, index) => {
    const offset = shopUpgradeLabelOffsets[index % shopUpgradeLabelOffsets.length] ?? { x: 0, y: 0 };
    const position = {
      x: townShopPosition.x + offset.x,
      y: townShopPosition.y + offset.y,
    };
    const word = shopWordForUpgrade(upgrade.id);

    return {
      id: `town-shop-upgrade-${upgrade.id}`,
      word,
      label: word,
      position,
      distance: distanceBetween(player, townShopPosition),
      action: { kind: 'buy-upgrade', upgrade: upgrade.id, destination: townShopPosition },
    };
  });
}

function plantTargetsForEmptyPlots(
  state: FarmState,
  visiblePlots: Array<{ plot: CropPlot; distance: number }>,
  actionWordIndexes: Partial<Record<TargetWordRole, number>>,
): WorldTarget[] {
  const emptyPlots = visiblePlots.filter(({ plot }) => !plot.crop);

  if (emptyPlots.length === 0) {
    return [];
  }

  const seedCrops = availableSeedCrops(state);

  if (seedCrops.length > 1) {
    const nearestPlot = emptyPlots[0];

    if (!nearestPlot) {
      return [];
    }

    return seedCrops.map((cropId, index) =>
      plantPlotTarget(
        nearestPlot.plot,
        nearestPlot.distance,
        shopWordForCrop(cropId),
        cropId,
        seedChoiceLabelPosition(nearestPlot.plot.position, index),
      ),
    );
  }

  const cropId = seedCrops[0] ?? starterCropId;

  return emptyPlots.map(({ plot, distance }, index) => {
    const word =
      index === 0 && cropId !== starterCropId
        ? shopWordForCrop(cropId)
        : nextWordForTargetRole('plant-crop', actionWordIndexes);

    return plantPlotTarget(plot, distance, word, cropId, plot.position);
  });
}

function availableSeedCrops(state: FarmState): CropId[] {
  return cropCatalog.filter((crop) => state.seeds[crop.id] > 0).map((crop) => crop.id);
}

function seedChoiceLabelPosition(plotPosition: WorldPoint, index: number): WorldPoint {
  const columns = 3;
  const column = index % columns;
  const row = Math.floor(index / columns);

  return {
    x: plotPosition.x - 1.45 + column * 1.45,
    y: plotPosition.y - 0.86 + row * 0.46,
  };
}

function plantPlotTarget(
  plot: CropPlot,
  distance: number,
  word: string,
  crop: CropId,
  labelPosition: WorldPoint,
): WorldTarget {
  return {
    id: `plot-${plot.id}-plant-${crop}`,
    word,
    label: word,
    position: labelPosition,
    distance,
    action: { kind: 'plant-plot', plotId: plot.id, crop, destination: plot.position },
  };
}

function targetForPlantedPlot(
  plot: CropPlot,
  distance: number,
  actionWordIndexes: Partial<Record<TargetWordRole, number>>,
): WorldTarget | undefined {
  if (plot.stage === 'ripe') {
    return plotTarget(plot, distance, nextWordForTargetRole('harvest-crop', actionWordIndexes), {
      kind: 'harvest-plot',
      plotId: plot.id,
    });
  }

  if (!plot.wateredToday) {
    return plotTarget(plot, distance, nextWordForTargetRole('water-crop', actionWordIndexes), {
      kind: 'water-plot',
      plotId: plot.id,
    });
  }

  return plotTarget(plot, distance, nextWordForTargetRole('inspect-crop', actionWordIndexes), {
    kind: 'inspect-plot',
    plotId: plot.id,
  });
}

function plotTarget(
  plot: CropPlot,
  distance: number,
  word: string,
  action: WorldTargetAction,
): WorldTarget {
  return {
    id: `plot-${plot.id}-${action.kind}`,
    word,
    label: word,
    position: plot.position,
    distance,
    action,
  };
}
