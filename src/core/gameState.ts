import { parseTypedCommand } from './typing';

export type CropStage = 'empty' | 'seed' | 'sprout' | 'leaf' | 'ripe';

export interface CropPlot {
  id: number;
  crop: 'turnip' | null;
  stage: CropStage;
  wateredToday: boolean;
  growth: number;
}

export interface FarmState {
  day: number;
  coins: number;
  stamina: number;
  selectedPlotId: number;
  plots: CropPlot[];
  log: string[];
}

const startingPlots = 6;
const maxLogEntries = 6;

export function createFarmState(): FarmState {
  return {
    day: 1,
    coins: 25,
    stamina: 10,
    selectedPlotId: 1,
    plots: Array.from({ length: startingPlots }, (_, index) => ({
      id: index + 1,
      crop: null,
      stage: 'empty',
      wateredToday: false,
      growth: 0,
    })),
    log: ['A quiet morning begins. Try typing seed, water, pick, or sell.'],
  };
}

export function applyTypedWord(state: FarmState, word: string): FarmState {
  const command = parseTypedCommand(word);

  if (command.kind === 'move') {
    return withLog(
      {
        ...state,
        selectedPlotId: moveSelection(state.selectedPlotId, command.direction),
      },
      `Moved focus ${command.direction}.`,
    );
  }

  if (command.kind !== 'farm') {
    return withLog(state, command.source ? `No action for "${command.source}" yet.` : 'No word entered.');
  }

  const plot = state.plots.find((candidate) => candidate.id === state.selectedPlotId);
  if (!plot) {
    return withLog(state, 'No plot is selected.');
  }

  if (command.verb === 'plant') {
    if (plot.crop) {
      return withLog(state, 'That plot already has a crop.');
    }

    if (state.coins < 5) {
      return withLog(state, 'Seeds cost 5 coins.');
    }

    return updatePlot(
      state,
      { ...plot, crop: 'turnip', stage: 'seed', wateredToday: false, growth: 0 },
      { coins: state.coins - 5, stamina: Math.max(0, state.stamina - 1) },
      'Planted turnip seeds.',
    );
  }

  if (command.verb === 'water') {
    if (!plot.crop) {
      return withLog(state, 'Water splashes onto empty soil.');
    }

    if (plot.wateredToday) {
      return withLog(state, 'This crop is already watered.');
    }

    return updatePlot(
      state,
      { ...plot, wateredToday: true },
      { stamina: Math.max(0, state.stamina - 1) },
      'The watering can sings against the soil.',
    );
  }

  if (command.verb === 'harvest') {
    if (plot.stage !== 'ripe') {
      return withLog(state, 'Nothing is ripe here yet.');
    }

    return updatePlot(
      state,
      { ...plot, crop: null, stage: 'empty', wateredToday: false, growth: 0 },
      { coins: state.coins + 12 },
      'Harvested a crisp turnip for 12 coins.',
    );
  }

  if (command.verb === 'sell') {
    return withLog(state, 'The shipping bin will arrive in the first prototype milestone.');
  }

  return withLog(state, describePlot(plot));
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
      plots,
    },
    `Day ${state.day + 1} dawns.`,
  );
}

function moveSelection(selectedPlotId: number, direction: string): number {
  if (direction === 'west' || direction === 'north') {
    return selectedPlotId === 1 ? startingPlots : selectedPlotId - 1;
  }

  return selectedPlotId === startingPlots ? 1 : selectedPlotId + 1;
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
  patch: Partial<Pick<FarmState, 'coins' | 'stamina'>>,
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
