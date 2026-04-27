import {
  countDiscoveredCrops,
  countShippedCrops,
  countUsedWords,
  normalizeCollectionLogProgress,
  type CollectionLogProgress,
} from './collectionLog';
import type { WeekGoalId, WeekGoalProgress } from './weekGoals';

export const achievementCategories = ['farming', 'typing', 'exploration', 'collection', 'economy'] as const;

export type AchievementCategory = (typeof achievementCategories)[number];

const achievementIds = ['firstSeed', 'townFootsteps', 'wordSampler', 'cropCurious', 'firstSale'] as const;

export type AchievementId = (typeof achievementIds)[number];

export type AchievementCriteria =
  | { kind: 'week-goal'; goal: WeekGoalId }
  | { kind: 'used-word'; word: string }
  | { kind: 'used-word-count'; count: number }
  | { kind: 'discovered-crop-count'; count: number }
  | { kind: 'shipped-crop-count'; count: number };

export interface AchievementDefinition {
  id: AchievementId;
  category: AchievementCategory;
  title: string;
  summary: string;
  criteria: AchievementCriteria;
}

export interface AchievementProgress {
  unlockedIds: AchievementId[];
}

export interface AchievementSnapshot {
  weekGoals: WeekGoalProgress;
  collectionLog: CollectionLogProgress;
}

export interface AchievementUpdate {
  progress: AchievementProgress;
  newlyUnlocked: AchievementDefinition[];
}

export interface AchievementCatalogValidationResult {
  ok: boolean;
  errors: string[];
}

export const achievementCatalog = [
  {
    id: 'firstSeed',
    category: 'farming',
    title: 'First Furrow',
    summary: 'Plant any seed in a farm plot.',
    criteria: { kind: 'week-goal', goal: 'plantFirstSeeds' },
  },
  {
    id: 'townFootsteps',
    category: 'exploration',
    title: 'Town Footsteps',
    summary: 'Follow the south path into town.',
    criteria: { kind: 'used-word', word: 'town' },
  },
  {
    id: 'wordSampler',
    category: 'typing',
    title: 'Word Sampler',
    summary: 'Use five different visible words.',
    criteria: { kind: 'used-word-count', count: 5 },
  },
  {
    id: 'cropCurious',
    category: 'collection',
    title: 'Crop Curious',
    summary: 'Discover three crop varieties.',
    criteria: { kind: 'discovered-crop-count', count: 3 },
  },
  {
    id: 'firstSale',
    category: 'economy',
    title: 'First Sale',
    summary: 'Ship a harvested crop through the bin.',
    criteria: { kind: 'shipped-crop-count', count: 1 },
  },
] as const satisfies readonly AchievementDefinition[];

export function createAchievementProgress(): AchievementProgress {
  return {
    unlockedIds: [],
  };
}

export function normalizeAchievementProgress(value: unknown): AchievementProgress {
  if (!isRecord(value) || !Array.isArray(value.unlockedIds)) {
    return createAchievementProgress();
  }

  return {
    unlockedIds: [...new Set(value.unlockedIds.filter(isAchievementId))],
  };
}

export function evaluateAchievementProgress(
  progress: AchievementProgress,
  snapshot: AchievementSnapshot,
): AchievementUpdate {
  const normalizedProgress = normalizeAchievementProgress(progress);
  const unlockedIds = new Set(normalizedProgress.unlockedIds);
  const newlyUnlocked: AchievementDefinition[] = [];

  for (const achievement of achievementCatalog) {
    if (unlockedIds.has(achievement.id) || !achievementIsComplete(achievement, snapshot)) {
      continue;
    }

    unlockedIds.add(achievement.id);
    newlyUnlocked.push(achievement);
  }

  return {
    progress: {
      unlockedIds: achievementCatalog
        .map((achievement) => achievement.id)
        .filter((achievementId) => unlockedIds.has(achievementId)),
    },
    newlyUnlocked,
  };
}

export function achievementProgressText(progress: AchievementProgress): string {
  const normalizedProgress = normalizeAchievementProgress(progress);

  return `Achievements: ${normalizedProgress.unlockedIds.length}/${achievementCatalog.length} unlocked`;
}

export function achievementDetailText(progress: AchievementProgress): string {
  const normalizedProgress = normalizeAchievementProgress(progress);
  const unlocked = achievementCatalog.filter((achievement) => normalizedProgress.unlockedIds.includes(achievement.id));
  const next = achievementCatalog.find((achievement) => !normalizedProgress.unlockedIds.includes(achievement.id));
  const unlockedText =
    unlocked.length > 0 ? unlocked.map((achievement) => achievement.title).join(', ') : 'none yet';
  const nextText = next ? ` Next: ${next.title} - ${next.summary}` : ' All first badges unlocked.';

  return `${achievementProgressText(normalizedProgress)}. Badges: ${unlockedText}.${nextText}`;
}

export function achievementUnlockLog(achievement: AchievementDefinition): string {
  return `Achievement unlocked: ${achievement.title} - ${achievement.summary}`;
}

export function validateAchievementCatalog(): AchievementCatalogValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<AchievementId>();
  const categories = new Set<AchievementCategory>();

  for (const achievement of achievementCatalog) {
    if (seenIds.has(achievement.id)) {
      errors.push(`Duplicate achievement id: ${achievement.id}`);
    }
    seenIds.add(achievement.id);
    categories.add(achievement.category);

    const title: string = achievement.title;
    const summary: string = achievement.summary;

    if (!title || !summary) {
      errors.push(`Achievement ${achievement.id} is missing display text.`);
    }

    if (!validCriteria(achievement.criteria)) {
      errors.push(`Achievement ${achievement.id} has invalid criteria.`);
    }
  }

  for (const category of achievementCategories) {
    if (!categories.has(category)) {
      errors.push(`Missing achievement category: ${category}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function achievementIsComplete(achievement: AchievementDefinition, snapshot: AchievementSnapshot): boolean {
  const collectionLog = normalizeCollectionLogProgress(snapshot.collectionLog);

  if (achievement.criteria.kind === 'week-goal') {
    return snapshot.weekGoals[achievement.criteria.goal] === true;
  }

  if (achievement.criteria.kind === 'used-word') {
    return collectionLog.usedWords[achievement.criteria.word] === true;
  }

  if (achievement.criteria.kind === 'used-word-count') {
    return countUsedWords(collectionLog) >= achievement.criteria.count;
  }

  if (achievement.criteria.kind === 'discovered-crop-count') {
    return countDiscoveredCrops(collectionLog) >= achievement.criteria.count;
  }

  return countShippedCrops(collectionLog) >= achievement.criteria.count;
}

function validCriteria(criteria: AchievementCriteria): boolean {
  if (criteria.kind === 'week-goal' || criteria.kind === 'used-word') {
    return true;
  }

  return Number.isInteger(criteria.count) && criteria.count > 0;
}

function isAchievementId(value: unknown): value is AchievementId {
  return typeof value === 'string' && achievementIds.includes(value as AchievementId);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
