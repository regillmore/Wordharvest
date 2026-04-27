import { describe, expect, it } from 'vitest';
import { createCollectionLogProgress, markCropsDiscovered, markCropsShipped, markWordsUsed } from './collectionLog';
import { emptyWeekGoalProgress } from './weekGoals';
import {
  achievementCatalog,
  achievementDetailText,
  achievementProgressText,
  achievementUnlockLog,
  createAchievementProgress,
  evaluateAchievementProgress,
  normalizeAchievementProgress,
  validateAchievementCatalog,
} from './achievements';

describe('achievement catalog', () => {
  it('passes catalog validation and covers the first durability categories', () => {
    expect(validateAchievementCatalog()).toEqual({ ok: true, errors: [] });
    expect(achievementCatalog.map((achievement) => achievement.category)).toEqual([
      'farming',
      'exploration',
      'typing',
      'collection',
      'economy',
    ]);
  });

  it('evaluates newly completed badges from deterministic state snapshots', () => {
    let progress = createAchievementProgress();
    const collectionLog = markCropsShipped(
      markCropsDiscovered(
        markWordsUsed(createCollectionLogProgress(), ['town', 'seed', 'water', 'shop', 'radish']).progress,
        ['radish', 'carrot'],
      ).progress,
      ['turnip'],
    ).progress;
    const update = evaluateAchievementProgress(progress, {
      weekGoals: {
        ...emptyWeekGoalProgress(),
        plantFirstSeeds: true,
      },
      collectionLog,
    });
    progress = update.progress;

    expect(update.newlyUnlocked.map((achievement) => achievement.id)).toEqual([
      'firstSeed',
      'townFootsteps',
      'wordSampler',
      'cropCurious',
      'firstSale',
    ]);
    expect(achievementProgressText(progress)).toBe('Achievements: 5/5 unlocked');
    expect(achievementDetailText(progress)).toContain('First Furrow');
    expect(achievementUnlockLog(update.newlyUnlocked[0])).toBe(
      'Achievement unlocked: First Furrow - Plant any seed in a farm plot.',
    );
    expect(evaluateAchievementProgress(progress, { weekGoals: emptyWeekGoalProgress(), collectionLog }).newlyUnlocked).toEqual(
      [],
    );
  });

  it('normalizes saved badge ids', () => {
    expect(
      normalizeAchievementProgress({
        unlockedIds: ['firstSeed', 'firstSeed', 'missing', 2],
      }),
    ).toEqual({
      unlockedIds: ['firstSeed'],
    });
  });
});
