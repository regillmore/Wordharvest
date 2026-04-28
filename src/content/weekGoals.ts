const weekGoalIds = [
  'plantFirstSeeds',
  'waterFirstCrop',
  'visitTownShop',
  'buySpringSeeds',
  'shipFirstCrop',
  'buyTinCan',
  'completeSpringBasket',
] as const;

export type WeekGoalId = (typeof weekGoalIds)[number];
export type WeekGoalProgress = Record<WeekGoalId, boolean>;

export interface WeekGoalDefinition {
  id: WeekGoalId;
  day: number;
  title: string;
  prompt: string;
  rewardCoins: number;
  completedLog: string;
}

export interface WeekGoalCompletionUpdate {
  progress: WeekGoalProgress;
  newlyCompleted: boolean;
}

export interface WeekGoalCatalogValidationResult {
  ok: boolean;
  errors: string[];
}

export const firstWeekGoalCatalog = [
  {
    id: 'plantFirstSeeds',
    day: 1,
    title: 'Plant first seeds',
    prompt: 'Plant any seed in a farm plot.',
    rewardCoins: 3,
    completedLog: 'Day 1 goal complete: first seeds planted.',
  },
  {
    id: 'waterFirstCrop',
    day: 2,
    title: 'Water a growing crop',
    prompt: 'Water any planted crop before ending the day.',
    rewardCoins: 4,
    completedLog: 'Day 2 goal complete: a crop was watered.',
  },
  {
    id: 'visitTownShop',
    day: 3,
    title: 'Visit the town shop',
    prompt: 'Type shop in town to step inside the seed shop.',
    rewardCoins: 4,
    completedLog: 'Day 3 goal complete: the town shop is on your route now.',
  },
  {
    id: 'buySpringSeeds',
    day: 4,
    title: 'Buy a new seed packet',
    prompt: 'Buy a non-turnip seed packet from the town shop.',
    rewardCoins: 5,
    completedLog: 'Day 4 goal complete: a new seed packet is in the bag.',
  },
  {
    id: 'shipFirstCrop',
    day: 5,
    title: 'Ship a harvested crop',
    prompt: 'Put at least one harvested crop into the shipping bin.',
    rewardCoins: 6,
    completedLog: 'Day 5 goal complete: the first crop shipment went out.',
  },
  {
    id: 'buyTinCan',
    day: 6,
    title: 'Upgrade the watering can',
    prompt: 'Buy the tin watering can from the town shop.',
    rewardCoins: 8,
    completedLog: 'Day 6 goal complete: the tin watering can is ready.',
  },
  {
    id: 'completeSpringBasket',
    day: 7,
    title: 'Finish Spring Basket',
    prompt: 'Ship the turnip, radish, and carrot Mira requested.',
    rewardCoins: 10,
    completedLog: 'Day 7 goal complete: Spring Basket is finished.',
  },
] as const satisfies readonly WeekGoalDefinition[];

const weekGoalsById = new Map<WeekGoalId, WeekGoalDefinition>(
  firstWeekGoalCatalog.map((definition) => [definition.id, definition]),
);

export function weekGoalDefinition(goalId: WeekGoalId): WeekGoalDefinition {
  const definition = weekGoalsById.get(goalId);

  if (!definition) {
    throw new Error(`Missing week goal definition: ${goalId}`);
  }

  return definition;
}

export function emptyWeekGoalProgress(): WeekGoalProgress {
  return Object.fromEntries(firstWeekGoalCatalog.map((definition) => [definition.id, false])) as WeekGoalProgress;
}

export function normalizeWeekGoalProgress(value: unknown): WeekGoalProgress {
  const progress = emptyWeekGoalProgress();

  if (!isRecord(value)) {
    return progress;
  }

  for (const definition of firstWeekGoalCatalog) {
    progress[definition.id] = value[definition.id] === true;
  }

  return progress;
}

export function markWeekGoalComplete(
  progress: WeekGoalProgress,
  goalId: WeekGoalId,
): WeekGoalCompletionUpdate {
  const normalizedProgress = normalizeWeekGoalProgress(progress);

  if (normalizedProgress[goalId]) {
    return {
      progress: normalizedProgress,
      newlyCompleted: false,
    };
  }

  return {
    progress: {
      ...normalizedProgress,
      [goalId]: true,
    },
    newlyCompleted: true,
  };
}

export function weekGoalForDay(day: number): WeekGoalDefinition | undefined {
  return firstWeekGoalCatalog.find((definition) => definition.day === day);
}

export function weekGoalCompletionLog(goalId: WeekGoalId): string {
  const goal = weekGoalDefinition(goalId);

  return `${goal.completedLog} Reward: ${goal.rewardCoins} coins.`;
}

export function weekGoalProgressText(day: number, progress: WeekGoalProgress): string {
  const normalizedProgress = normalizeWeekGoalProgress(progress);
  const goal = weekGoalForDay(day);

  if (!goal) {
    return `First Week: ${completedWeekGoalCount(normalizedProgress)}/${firstWeekGoalCatalog.length} goals done`;
  }

  return `Day ${goal.day}: ${goal.title} ${normalizedProgress[goal.id] ? 'done' : 'open'} (+${goal.rewardCoins} coins)`;
}

export function weekGoalDetailText(day: number, progress: WeekGoalProgress): string {
  const normalizedProgress = normalizeWeekGoalProgress(progress);
  const summary = `First Week: ${completedWeekGoalCount(normalizedProgress)}/${firstWeekGoalCatalog.length} goals done`;
  const goal = weekGoalForDay(day);

  if (!goal) {
    return summary;
  }

  return `${summary}. Today: ${goal.title} - ${goal.prompt} Reward: ${goal.rewardCoins} coins.`;
}

export function weekGoalDawnText(day: number): string {
  const goal = weekGoalForDay(day);

  return goal
    ? `Goal: ${goal.title}. ${goal.prompt} Reward: ${goal.rewardCoins} coins.`
    : 'Goal: Keep tending crops and Spring Basket.';
}

export function validateWeekGoalCatalog(): WeekGoalCatalogValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<WeekGoalId>();
  const seenDays = new Set<number>();

  for (const goal of firstWeekGoalCatalog) {
    const definition: WeekGoalDefinition = goal;

    if (seenIds.has(definition.id)) {
      errors.push(`Duplicate week goal id: ${definition.id}`);
    }
    seenIds.add(definition.id);

    if (!Number.isInteger(definition.day) || definition.day < 1 || definition.day > 7) {
      errors.push(`Week goal ${definition.id} must be assigned to days 1 through 7.`);
    }

    if (seenDays.has(definition.day)) {
      errors.push(`Duplicate first-week goal day: ${definition.day}`);
    }
    seenDays.add(definition.day);

    if (!definition.title || !definition.prompt || !definition.completedLog) {
      errors.push(`Week goal ${definition.id} is missing display text.`);
    }

    if (!Number.isInteger(definition.rewardCoins) || definition.rewardCoins < 0) {
      errors.push(`Week goal ${definition.id} must have a non-negative integer reward.`);
    }
  }

  for (const requiredGoal of weekGoalIds) {
    if (!seenIds.has(requiredGoal)) {
      errors.push(`Missing required week goal id: ${requiredGoal}`);
    }
  }

  for (let day = 1; day <= 7; day += 1) {
    if (!seenDays.has(day)) {
      errors.push(`Missing first-week goal for day ${day}.`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function completedWeekGoalCount(progress: WeekGoalProgress): number {
  return firstWeekGoalCatalog.filter((definition) => progress[definition.id]).length;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
