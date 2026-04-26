import { describe, expect, it } from 'vitest';
import {
  emptyWeekGoalProgress,
  firstWeekGoalCatalog,
  markWeekGoalComplete,
  validateWeekGoalCatalog,
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
    expect(weekGoalForDay(1)?.id).toBe('plantFirstSeeds');
    expect(weekGoalForDay(7)?.id).toBe('completeSpringBasket');
  });

  it('tracks completion and summarizes the current day', () => {
    let progress = emptyWeekGoalProgress();

    expect(weekGoalProgressText(1, progress)).toBe('Day 1: Plant first seeds open');
    expect(weekGoalDetailText(1, progress)).toContain('First Week: 0/7 goals done');

    const update = markWeekGoalComplete(progress, 'plantFirstSeeds');
    progress = update.progress;

    expect(update.newlyCompleted).toBe(true);
    expect(weekGoalProgressText(1, progress)).toBe('Day 1: Plant first seeds done');
    expect(weekGoalProgressText(8, progress)).toBe('First Week: 1/7 goals done');
    expect(markWeekGoalComplete(progress, 'plantFirstSeeds').newlyCompleted).toBe(false);
  });
});
