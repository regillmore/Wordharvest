import { normalizeTypedWord } from './typing';
import { resolveWorldTarget, type WorldPoint, type WorldTargetAction } from './worldTargets';

export type CropStage = 'empty' | 'seed' | 'sprout' | 'leaf' | 'ripe';
export type PlayerLocation = 'farm' | 'house';
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
  action: WorldTargetAction;
}

export interface FarmState {
  day: number;
  coins: number;
  stamina: number;
  player: WorldPoint;
  location: PlayerLocation;
  pendingAction: PendingWorldAction | null;
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

  return withLog(
    {
      ...state,
      pendingAction: {
        word: target.word,
        label: target.label,
        destination: destinationForAction(target.position, action),
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

  const nextPlayer = moveToward(state.player, state.pendingAction.destination, walkSpeed * deltaSeconds);
  const arrived = pointsEqual(nextPlayer, state.pendingAction.destination);
  const movedState = {
    ...state,
    player: nextPlayer,
  };

  if (!arrived) {
    return movedState;
  }

  return completePendingAction(movedState);
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

  if (action.kind === 'ship-inventory') {
    return shipInventory(state);
  }

  const plot = state.plots.find((candidate) => candidate.id === action.plotId);
  if (!plot) {
    return withLog(state, 'That target is no longer available.');
  }

  if (action.kind === 'plant-plot') {
    if (plot.crop) {
      return withLog(state, 'That plot already has a crop.');
    }

    if (state.coins < 5) {
      return withLog(state, 'Seeds cost 5 coins.');
    }

    return updatePlot(
      state,
      { ...plot, crop: 'turnip', stage: 'seed', wateredToday: false, growth: 0 },
      { coins: state.coins - 5, stamina: Math.max(0, state.stamina - 1), player: plot.position },
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
  patch: Partial<Pick<FarmState, 'coins' | 'stamina' | 'player' | 'inventory'>>,
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

function destinationForAction(targetPosition: WorldPoint, action: WorldTargetAction): WorldPoint {
  if (action.kind === 'approach-house') {
    return action.destination;
  }

  return targetPosition;
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
