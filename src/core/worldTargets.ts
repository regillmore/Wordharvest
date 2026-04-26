import {
  nextWordForTargetRole,
  primaryWordForTargetRole,
  type TargetWordRole,
} from '../content/targetWords';
import type { CropPlot, FarmState } from './gameState';
import { normalizeTypedWord } from './typing';

export interface WorldPoint {
  x: number;
  y: number;
}

export type WorldTargetAction =
  | { kind: 'approach-house'; destination: WorldPoint }
  | { kind: 'enter-house' }
  | { kind: 'exit-house'; destination: WorldPoint }
  | { kind: 'ship-inventory' }
  | { kind: 'buy-turnip-seeds' }
  | { kind: 'plant-plot'; plotId: number }
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

const houseSightRange = 7;
const doorActionRange = 2;
const cropActionRange = 2.15;
const shippingBinRange = 3.2;
const seedSourceRange = 4;

export function listWorldTargets(state: FarmState): WorldTarget[] {
  if (state.pendingAction) {
    return [];
  }

  if (state.location === 'house') {
    return [
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
    ];
  }

  const targets: WorldTarget[] = [];
  const doorDistance = distanceBetween(state.player, doorPosition);
  const houseDistance = distanceBetween(state.player, housePosition);
  const shippingBinDistance = distanceBetween(state.player, shippingBinPosition);
  const seedSourceDistance = distanceBetween(state.player, seedSourcePosition);

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
      action: { kind: 'buy-turnip-seeds' },
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

  for (const { plot, distance } of visiblePlots) {
    const target = targetForPlot(plot, distance, actionWordIndexes);

    if (target) {
      targets.push(target);
    }
  }

  return targets;
}

export function resolveWorldTarget(state: FarmState, typedWord: string): WorldTarget | undefined {
  const word = normalizeTypedWord(typedWord);

  if (!word) {
    return undefined;
  }

  return listWorldTargets(state).find((target) => target.word === word);
}

export function destinationForWorldTarget(target: WorldTarget): WorldPoint {
  if (target.action.kind === 'approach-house' || target.action.kind === 'exit-house') {
    return target.action.destination;
  }

  return target.position;
}

export function distanceBetween(left: WorldPoint, right: WorldPoint): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function targetForPlot(
  plot: CropPlot,
  distance: number,
  actionWordIndexes: Partial<Record<TargetWordRole, number>>,
): WorldTarget | undefined {
  if (!plot.crop) {
    return plotTarget(plot, distance, nextWordForTargetRole('plant-crop', actionWordIndexes), {
      kind: 'plant-plot',
      plotId: plot.id,
    });
  }

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
