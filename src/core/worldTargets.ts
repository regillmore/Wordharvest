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

const houseSightRange = 7;
const doorActionRange = 2;
const cropActionRange = 2.15;

const plantWords = ['seed', 'plant', 'sow', 'crop', 'turnip'];
const waterWords = ['water', 'sprinkle', 'splash', 'drench', 'douse', 'soak'];
const harvestWords = ['pick', 'reap', 'gather', 'pluck', 'harvest'];
const inspectWords = ['look', 'check', 'watch', 'tend', 'visit'];

export function listWorldTargets(state: FarmState): WorldTarget[] {
  if (state.pendingAction) {
    return [];
  }

  if (state.location === 'house') {
    return [
      {
        id: 'house-exit',
        word: 'outside',
        label: 'outside',
        position: { x: 0, y: 2.4 },
        distance: 0,
        action: { kind: 'exit-house', destination: houseExitPosition },
      },
      {
        id: 'farm-exit',
        word: 'farm',
        label: 'farm',
        position: { x: 1.2, y: 2.1 },
        distance: 0,
        action: { kind: 'exit-house', destination: houseExitPosition },
      },
    ];
  }

  const targets: WorldTarget[] = [];
  const doorDistance = distanceBetween(state.player, doorPosition);
  const houseDistance = distanceBetween(state.player, housePosition);

  if (doorDistance <= doorActionRange) {
    targets.push({
      id: 'farmhouse-door',
      word: 'door',
      label: 'door',
      position: doorPosition,
      distance: doorDistance,
      action: { kind: 'enter-house' },
    });
  } else if (houseDistance <= houseSightRange) {
    targets.push({
      id: 'farmhouse',
      word: 'house',
      label: 'house',
      position: housePosition,
      distance: houseDistance,
      action: { kind: 'approach-house', destination: houseApproachPosition },
    });
  }

  const visiblePlots = state.plots
    .map((plot) => ({
      plot,
      distance: distanceBetween(state.player, plot.position),
    }))
    .filter(({ distance }) => distance <= cropActionRange)
    .sort((left, right) => left.distance - right.distance || left.plot.id - right.plot.id);

  const actionWordIndexes: Record<string, number> = {};

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

export function distanceBetween(left: WorldPoint, right: WorldPoint): number {
  return Math.hypot(left.x - right.x, left.y - right.y);
}

function targetForPlot(
  plot: CropPlot,
  distance: number,
  actionWordIndexes: Record<string, number>,
): WorldTarget | undefined {
  if (!plot.crop) {
    return plotTarget(plot, distance, nextWord('plant', plantWords, actionWordIndexes), {
      kind: 'plant-plot',
      plotId: plot.id,
    });
  }

  if (plot.stage === 'ripe') {
    return plotTarget(plot, distance, nextWord('harvest', harvestWords, actionWordIndexes), {
      kind: 'harvest-plot',
      plotId: plot.id,
    });
  }

  if (!plot.wateredToday) {
    return plotTarget(plot, distance, nextWord('water', waterWords, actionWordIndexes), {
      kind: 'water-plot',
      plotId: plot.id,
    });
  }

  return plotTarget(plot, distance, nextWord('inspect', inspectWords, actionWordIndexes), {
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

function nextWord(kind: string, words: string[], actionWordIndexes: Record<string, number>): string {
  const index = actionWordIndexes[kind] ?? 0;
  actionWordIndexes[kind] = index + 1;

  return words[index % words.length];
}
