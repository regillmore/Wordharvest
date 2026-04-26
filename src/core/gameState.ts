import {
  cropCatalog,
  cropCountsWith,
  cropDefinition,
  emptyCropCounts,
  shopWordForCrop,
  stageForCropGrowth,
  starterCropId,
  type CropCounts,
  type CropGrowthStage,
  type CropId,
} from '../content/crops';
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

export type CropStage = 'empty' | CropGrowthStage;
export type PlayerLocation = 'farm' | 'house' | 'town';

export type Inventory = CropCounts;

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

export function createFarmState(): FarmState {
  return {
    day: 1,
    coins: 25,
    stamina: 10,
    player: startingPlayerPosition,
    location: 'farm',
    pendingAction: null,
    seeds: cropCountsWith(starterCropId, cropDefinition(starterCropId).seedPacketQuantity),
    inventory: emptyCropCounts(),
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

  if (action.kind === 'buy-seeds') {
    return buySeeds(state, action.crop);
  }

  if (action.kind === 'visit-shop') {
    return withLog(state, `The shop shelf is open: ${shopWordSummary()}.`);
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

    const crop = cropDefinition(action.crop);

    if (state.seeds[action.crop] <= 0) {
      return withLog(state, `No ${crop.seedName} in your bag.`);
    }

    return updatePlot(
      state,
      { ...plot, crop: action.crop, stage: 'seed', wateredToday: false, growth: 0 },
      {
        seeds: {
          ...state.seeds,
          [action.crop]: state.seeds[action.crop] - 1,
        },
        stamina: Math.max(0, state.stamina - 1),
        player: plot.position,
      },
      `Planted ${crop.seedName}.`,
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
    if (!plot.crop || plot.stage !== 'ripe') {
      return withLog(state, 'Nothing is ripe here yet.');
    }

    const crop = cropDefinition(plot.crop);

    return updatePlot(
      state,
      { ...plot, crop: null, stage: 'empty', wateredToday: false, growth: 0 },
      {
        inventory: {
          ...state.inventory,
          [crop.id]: state.inventory[crop.id] + 1,
        },
        player: plot.position,
      },
      crop.harvestMessage,
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
      stage: stageForCropGrowth(plot.crop, growth),
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

function buySeeds(state: FarmState, cropId: CropId): FarmState {
  const crop = cropDefinition(cropId);

  if (state.coins < crop.seedPacketPrice) {
    return withLog(state, `${capitalize(crop.seedName)} cost ${crop.seedPacketPrice} coins.`);
  }

  return withLog(
    {
      ...state,
      coins: state.coins - crop.seedPacketPrice,
      seeds: {
        ...state.seeds,
        [crop.id]: state.seeds[crop.id] + crop.seedPacketQuantity,
      },
    },
    `Bought ${crop.seedPacketQuantity} ${crop.seedName} for ${crop.seedPacketPrice} coins.`,
  );
}

function shipInventory(state: FarmState): FarmState {
  const shipments = Object.entries(state.inventory)
    .map(([cropId, count]) => ({
      crop: cropDefinition(cropId as CropId),
      count,
    }))
    .filter((shipment) => shipment.count > 0);

  if (shipments.length === 0) {
    return withLog(state, 'The shipping bin is empty.');
  }

  const coinsEarned = shipments.reduce((sum, shipment) => sum + shipment.count * shipment.crop.sellPrice, 0);
  const shippedInventory = {
    ...state.inventory,
  };

  for (const shipment of shipments) {
    shippedInventory[shipment.crop.id] = 0;
  }

  return withLog(
    {
      ...state,
      coins: state.coins + coinsEarned,
      inventory: shippedInventory,
    },
    `Shipped ${shipmentSummary(shipments)} for ${coinsEarned} coins.`,
  );
}

function describeMenu(state: FarmState, menu: 'journal' | 'inventory' | 'options'): string {
  const starterCrop = cropDefinition(starterCropId);

  if (menu === 'journal') {
    return `Journal: Day ${state.day}, ${state.coins} coins, ${state.seeds[starterCrop.id]} ${starterCrop.seedName}.`;
  }

  if (menu === 'inventory') {
    return `Pack: ${state.inventory[starterCrop.id]} ${starterCrop.pluralName}, ${state.seeds[starterCrop.id]} ${starterCrop.seedName}.`;
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

  return `Plot ${plot.id} holds a ${plot.stage} ${cropDefinition(plot.crop).name}.`;
}

function shipmentSummary(shipments: Array<{ crop: ReturnType<typeof cropDefinition>; count: number }>): string {
  return shipments
    .map((shipment) => `${shipment.count} ${shipment.count === 1 ? shipment.crop.name : shipment.crop.pluralName}`)
    .join(' and ');
}

function shopWordSummary(): string {
  const words = cropCatalog.map((crop) => shopWordForCrop(crop.id));

  if (words.length <= 1) {
    return words.join('');
  }

  return `${words.slice(0, -1).join(', ')}, or ${words[words.length - 1]}`;
}

function capitalize(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
