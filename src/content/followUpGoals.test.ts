import { describe, expect, it } from 'vitest';
import { createCollectionLogProgress, markCropsShipped } from './collectionLog';
import {
  followUpGoalCompletionLog,
  followUpGoalDetailText,
  followUpGoalProgressText,
  isFollowUpGoalComplete,
  postSpringBasketFollowUpGoal,
  validateFollowUpGoalCatalog,
} from './followUpGoals';

describe('follow-up goals', () => {
  it('passes catalog validation', () => {
    expect(validateFollowUpGoalCatalog()).toEqual({ ok: true, errors: [] });
    expect(postSpringBasketFollowUpGoal).toMatchObject({
      id: 'marketEncore',
      targetShippedCropVarieties: 5,
      rewardCoins: 40,
    });
  });

  it('tracks Market Encore from shipped crop varieties', () => {
    let collectionLog = createCollectionLogProgress();
    collectionLog = markCropsShipped(collectionLog, ['turnip', 'radish', 'carrot']).progress;

    expect(isFollowUpGoalComplete(collectionLog)).toBe(false);
    expect(followUpGoalProgressText(collectionLog)).toBe('Market Encore: 3/5 crop varieties shipped');
    expect(followUpGoalDetailText(collectionLog)).toBe(
      "Market Encore: 3/5 crop varieties shipped. 2 more varieties will broaden Mira's market stall.",
    );

    collectionLog = markCropsShipped(collectionLog, ['pea', 'lettuce']).progress;

    expect(isFollowUpGoalComplete(collectionLog)).toBe(true);
    expect(followUpGoalProgressText(collectionLog)).toBe('Market Encore: complete');
    expect(followUpGoalDetailText(collectionLog)).toBe(
      'Market Encore: complete. Mira has enough variety for a proper spring stall.',
    );
    expect(followUpGoalCompletionLog()).toBe(
      'Market Encore complete! Mira added 40 coins for the fuller spring stall. Reward: 40 coins.',
    );
  });
});
