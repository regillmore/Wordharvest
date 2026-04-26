import { findFarmPath } from '../world/pathfinding';
import { normalizeTypedWord } from './typing';
import {
  destinationForWorldTarget,
  farmReturnPosition,
  resolveWorldTarget,
  townArrivalPosition,
  type WorldPoint,
  type WorldTargetAction,
} from './worldTargets';

export type CropStage = 'empty' | 'seed' | 'sprout' | 'leaf' | 'ripe';
export type PlayerLocation = 'farm' | 'house' | 'town';
export type CropId = 'turnip';

export type Inventory = Record<CropId, number>;

export interface CropPlot {
  id: number;
  position: WorldPoint;
  crop: CropId | null;
  stage: CropStage;
  wateredToday: boolean;
  growth: number;
}

export interface PendingWorldAction {
  word: string;
  label: string;
  destination: WorldPoint;
  path: WorldPoint[];
  action: WorldTargetAction;
}

export interface FarmState {
  day: number;
  coins: number;
  stamina: number;
  player: WorldPoint;
  location: PlayerLocation;
  pendingAction: PendingWorldAction | null;
  seeds: Inventory;
  inventory: Inventory;
  plots: CropPlot[];
  log: string[];
}

const startingPlots = 6;
const maxLogEntries = 6;
const walkSpeed = 3.2;
const startingPlayerPosition: WorldPoint = { x: 0, y: 5 };
const seedPacketCost = 6;
const seedPacketQuantity = 3;

export function createFarmState(): FarmState {
  return {
    day: 1,
    coins: 25,
    stamina: 10,
    player: startingPlayerPosition,
    location: 'farm',
    pendingAction: null,
    seeds: {
      turnip: seedPacketQuantity,
    },
    inventory: {
      turnip: 0,
    },
    plots: Array.from({ length: startingPlots }, (_, index) => ({
      id: index + 1,
      position: {
        x: (index % 3) - 1,
        y: 3 + Math.floor(index / 3),
      },
      crop: null,
      stage: 'empty',
      wateredToday: false,
      growth: 0,
    })),
    log: ['A quiet morning begins. Type a visible word hovering in the world.'],
  };
}

export function applyTypedWord(state: FarmState, word: string): FarmState {
  const source = normalizeTypedWord(word);

  if (state.pendingAction) {
    return withLog(state, `Finish walking to ${state.pendingAction.label} first.`);
  }

  const target = resolveWorldTarget(state, source);

  if (!source) {
    return withLog(state, 'No word entered.');
  }

  if (!target) {
    return withLog(state, `No visible target named "${source}".`);
  }

  const action = target.action;
  const destination = destinationForWorldTarget(target);
  const pathResult = findFarmPath(state.player, destination);

  if (!pathResult.ok) {
    return withLog(state, `No clear path to ${target.label}.`);
  }

  if (pathResult.path.length === 0) {
    return completeWorldAction(
      {
        ...state,
        player: destination,
        pendingAction: null,
      },
      action,
    );
  }

  return withLog(
    {
      ...state,
      pendingAction: {
        word: target.word,
        label: target.label,
        destination,
        path: pathResult.path,
        action,
      },
    },
    `Heading toward ${target.label}.`,
  );
}

export function advanceFarmTime(state: FarmState, deltaSeconds: number): FarmState {
  if (!state.pendingAction || deltaSeconds <= 0) {
    return state;
  }

  const nextWaypoint = state.pendingAction.path[0];

  if (!nextWaypoint) {
    return completePendingAction(state);
  }

  const nextPlayer = moveToward(state.player, nextWaypoint, walkSpeed * deltaSeconds);
  const arrived = pointsEqual(nextPlayer, nextWaypoint);
  const movedState = {
    ...state,
    player: nextPlayer,
  };

  if (!arrived) {
    return movedState;
  }

  const pendingAction = {
    ...state.pendingAction,
    path: state.pendingAction.path.slice(1),
  };
  const nextState = {
    ...movedState,
    pendingAction,
  };

  return pendingAction.path.length === 0 ? completePendingAction(nextState) : nextState;
}

export function completePendingAction(state: FarmState): FarmState {
  if (!state.pendingAction) {
    return state;
  }

  const pendingAction = state.pendingAction;

  return completeWorldAction(
    {
      ...state,
      player: pendingAction.destination,
      pendingAction: null,
    },
    pendingAction.action,
  );
}

function completeWorldAction(state: FarmState, action: WorldTargetAction): FarmState {
  if (action.kind === 'approach-house') {
    return withLog(
      {
        ...state,
        player: action.destination,
        location: 'farm',
      },
      'Walked up the path toward the farmhouse.',
    );
  }

  if (action.kind === 'enter-house') {
    return withLog(
      {
        ...state,
        location: 'house',
        player: { x: 0, y: 2.2 },
      },
      'Opened the farmhouse door and stepped inside.',
    );
  }

  if (action.kind === 'exit-house') {
    return withLog(
      {
        ...state,
        location: 'farm',
        player: action.destination,
      },
      'Stepped back into the farmyard.',
    );
  }

  if (action.kind === 'enter-town') {
    return withLog(
      {
        ...state,
        location: 'town',
        player: townArrivalPosition,
      },
      'Followed the south path toward town.',
    );
  }

  if (action.kind === 'return-farm') {
    return withLog(
      {
        ...state,
        location: 'farm',
        player: farmReturnPosition,
      },
      'Walked back up the lane to the farm.',
    );
  }

  if (action.kind === 'ship-inventory') {
    return shipInventory(state);
  }

  if (action.kind === 'buy-turnip-seeds') {
    return buyTurnipSeeds(state);
  }

  if (action.kind === 'visit-shop') {
    return withLog(state, 'The town shop is preparing its spring seed shelf.');
  }

  if (action.kind === 'talk-villager') {
    return withLog(state, 'Mira says hello and asks how the turnips are growing.');
  }

  if (action.kind === 'open-menu') {
    return withLog(state, describeMenu(state, action.menu));
  }

  const plot = state.plots.find((candidate) => candidate.id === action.plotId);
  if (!plot) {
    return withLog(state, 'That target is no longer available.');
  }

  if (action.kind === 'plant-plot') {
    if (plot.crop) {
      return withLog(state, 'That plot already has a crop.');
    }

    if (state.seeds.turnip <= 0) {
      return withLog(state, 'No turnip seeds in your bag.');
    }

    return updatePlot(
      state,
      { ...plot, crop: 'turnip', stage: 'seed', wateredToday: false, growth: 0 },
      {
        seeds: {
          ...state.seeds,
          turnip: state.seeds.turnip - 1,
        },
        stamina: Math.max(0, state.stamina - 1),
        player: plot.position,
      },
      'Planted turnip seeds.',
    );
  }

  if (action.kind === 'water-plot') {
    if (!plot.crop) {
      return withLog(state, 'Water splashes onto empty soil.');
    }

    if (plot.wateredToday) {
      return withLog(state, 'This crop is already watered.');
    }

    return updatePlot(
      state,
      { ...plot, wateredToday: true },
      { stamina: Math.max(0, state.stamina - 1), player: plot.position },
      'The watering can sings against the soil.',
    );
  }

  if (action.kind === 'harvest-plot') {
    if (plot.stage !== 'ripe') {
      return withLog(state, 'Nothing is ripe here yet.');
    }

    return updatePlot(
      state,
      { ...plot, crop: null, stage: 'empty', wateredToday: false, growth: 0 },
      {
        inventory: {
          ...state.inventory,
          turnip: state.inventory.turnip + 1,
        },
        player: plot.position,
      },
      'Harvested a crisp turnip.',
    );
  }

  return withLog({ ...state, player: plot.position }, describePlot(plot));
}

export function advanceDay(state: FarmState): FarmState {
  if (state.pendingAction) {
    return withLog(state, `Finish walking to ${state.pendingAction.label} before ending the day.`);
  }

  const plots = state.plots.map((plot) => {
    if (!plot.crop) {
      return { ...plot, wateredToday: false };
    }

    const growth = plot.wateredToday ? plot.growth + 1 : plot.growth;
    return {
      ...plot,
      growth,
      wateredToday: false,
      stage: stageForGrowth(growth),
    };
  });

  return withLog(
    {
      ...state,
      day: state.day + 1,
      stamina: 10,
      location: 'farm',
      plots,
    },
    `Day ${state.day + 1} dawns.`,
  );
}

export function addFarmLog(state: FarmState, message: string): FarmState {
  return withLog(state, message);
}

function stageForGrowth(growth: number): CropStage {
  if (growth >= 3) {
    return 'ripe';
  }

  if (growth === 2) {
    return 'leaf';
  }

  if (growth === 1) {
    return 'sprout';
  }

  return 'seed';
}

function updatePlot(
  state: FarmState,
  updatedPlot: CropPlot,
  patch: Partial<Pick<FarmState, 'coins' | 'stamina' | 'player' | 'seeds' | 'inventory'>>,
  message: string,
): FarmState {
  return withLog(
    {
      ...state,
      ...patch,
      plots: state.plots.map((plot) => (plot.id === updatedPlot.id ? updatedPlot : plot)),
    },
    message,
  );
}

function buyTurnipSeeds(state: FarmState): FarmState {
  if (state.coins < seedPacketCost) {
    return withLog(state, `Turnip seed packets cost ${seedPacketCost} coins.`);
  }

  return withLog(
    {
      ...state,
      coins: state.coins - seedPacketCost,
      seeds: {
        ...state.seeds,
        turnip: state.seeds.turnip + seedPacketQuantity,
      },
    },
    `Bought ${seedPacketQuantity} turnip seeds for ${seedPacketCost} coins.`,
  );
}

function shipInventory(state: FarmState): FarmState {
  const turnips = state.inventory.turnip;

  if (turnips === 0) {
    return withLog(state, 'The shipping bin is empty.');
  }

  const coinsEarned = turnips * 12;
  const cropName = turnips === 1 ? 'turnip' : 'turnips';

  return withLog(
    {
      ...state,
      coins: state.coins + coinsEarned,
      inventory: {
        ...state.inventory,
        turnip: 0,
      },
    },
    `Shipped ${turnips} ${cropName} for ${coinsEarned} coins.`,
  );
}

function describeMenu(state: FarmState, menu: 'journal' | 'inventory' | 'options'): string {
  if (menu === 'journal') {
    return `Journal: Day ${state.day}, ${state.coins} coins, ${state.seeds.turnip} turnip seeds.`;
  }

  if (menu === 'inventory') {
    return `Pack: ${state.inventory.turnip} turnips, ${state.seeds.turnip} turnip seeds.`;
  }

  return 'Options: audio, save, load, and reset controls are on the HUD.';
}

function moveToward(origin: WorldPoint, destination: WorldPoint, distance: number): WorldPoint {
  const offsetX = destination.x - origin.x;
  const offsetY = destination.y - origin.y;
  const remainingDistance = Math.hypot(offsetX, offsetY);

  if (remainingDistance <= distance || remainingDistance === 0) {
    return destination;
  }

  const ratio = distance / remainingDistance;
  return {
    x: origin.x + offsetX * ratio,
    y: origin.y + offsetY * ratio,
  };
}

function pointsEqual(left: WorldPoint, right: WorldPoint): boolean {
  return left.x === right.x && left.y === right.y;
}

function withLog(state: FarmState, message: string): FarmState {
  return {
    ...state,
    log: [message, ...state.log].slice(0, maxLogEntries),
  };
}

function describePlot(plot: CropPlot): string {
  if (!plot.crop) {
    return `Plot ${plot.id} is empty.`;
  }

  return `Plot ${plot.id} holds a ${plot.stage} ${plot.crop}.`;
}
