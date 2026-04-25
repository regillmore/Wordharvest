import { normalizeTypedWord } from './typing';
import { resolveWorldTarget, type WorldPoint } from './worldTargets';

export type CropStage = 'empty' | 'seed' | 'sprout' | 'leaf' | 'ripe';
export type PlayerLocation = 'farm' | 'house';

export interface CropPlot {
  id: number;
  position: WorldPoint;
  crop: 'turnip' | null;
  stage: CropStage;
  wateredToday: boolean;
  growth: number;
}

export interface FarmState {
  day: number;
  coins: number;
  stamina: number;
  player: WorldPoint;
  location: PlayerLocation;
  plots: CropPlot[];
  log: string[];
}

const startingPlots = 6;
const maxLogEntries = 6;
const startingPlayerPosition: WorldPoint = { x: 0, y: 5 };

export function createFarmState(): FarmState {
  return {
    day: 1,
    coins: 25,
    stamina: 10,
    player: startingPlayerPosition,
    location: 'farm',
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
  const target = resolveWorldTarget(state, source);

  if (!source) {
    return withLog(state, 'No word entered.');
  }

  if (!target) {
    return withLog(state, `No visible target named "${source}".`);
  }

  const action = target.action;

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
      { coins: state.coins + 12, player: plot.position },
      'Harvested a crisp turnip for 12 coins.',
    );
  }

  return withLog({ ...state, player: plot.position }, describePlot(plot));
}

export function advanceDay(state: FarmState): FarmState {
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
  patch: Partial<Pick<FarmState, 'coins' | 'stamina' | 'player'>>,
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
