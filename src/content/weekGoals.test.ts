import { describe, expect, it } from 'vitest';
import {
  emptyWeekGoalProgress,
  firstWeekGoalCatalog,
  markWeekGoalComplete,
  validateWeekGoalCatalog,
  weekGoalCompletionLog,
  weekGoalDetailText,
  weekGoalForDay,
  weekGoalProgressText,
} from './weekGoals';

describe('first week goals', () => {
  it('passes catalog validation', () => {
    expect(validateWeekGoalCatalog()).toEqual({ ok: true, errors: [] });
  });

  it('defines one pacing goal for each first-week day', () => {
    expect(firstWeekGoalCatalog.map((goal) => goal.day)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(firstWeekGoalCatalog.map((goal) => goal.rewardCoins)).toEqual([3, 4, 4, 5, 6, 8, 10]);
    expect(weekGoalForDay(1)?.id).toBe('plantFirstSeeds');
    expect(weekGoalForDay(7)?.id).toBe('completeSpringBasket');
  });

  it('tracks completion and summarizes the current day', () => {
    let progress = emptyWeekGoalProgress();

    expect(weekGoalProgressText(1, progress)).toBe('Day 1: Plant first seeds open (+3 coins)');
    expect(weekGoalDetailText(1, progress)).toContain('First Week: 0/7 goals done');
    expect(weekGoalDetailText(1, progress)).toContain('Reward: 3 coins.');

    const update = markWeekGoalComplete(progress, 'plantFirstSeeds');
    progress = update.progress;

    expect(update.newlyCompleted).toBe(true);
    expect(weekGoalCompletionLog('plantFirstSeeds')).toBe('Day 1 goal complete: first seeds planted. Reward: 3 coins.');
    expect(weekGoalProgressText(1, progress)).toBe('Day 1: Plant first seeds done (+3 coins)');
    expect(weekGoalProgressText(8, progress)).toBe('First Week: 1/7 goals done');
    expect(markWeekGoalComplete(progress, 'plantFirstSeeds').newlyCompleted).toBe(false);
  });
});
