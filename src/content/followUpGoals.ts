import { cropCatalog } from './crops';
import { countShippedCrops, type CollectionLogProgress } from './collectionLog';

const followUpGoalIds = ['marketEncore'] as const;

export type FollowUpGoalId = (typeof followUpGoalIds)[number];

export interface FollowUpGoalDefinition {
  id: FollowUpGoalId;
  title: string;
  summary: string;
  unlockedByObjectiveId: 'springBasket';
  targetShippedCropVarieties: number;
  incompleteSummary: string;
  completionSummary: string;
}

export interface FollowUpGoalCatalogValidationResult {
  ok: boolean;
  errors: string[];
}

export const postSpringBasketFollowUpGoal = {
  id: 'marketEncore',
  title: 'Market Encore',
  summary: 'Ship five different spring crop varieties for Market Encore.',
  unlockedByObjectiveId: 'springBasket',
  targetShippedCropVarieties: 5,
  incompleteSummary: "will broaden Mira's market stall.",
  completionSummary: 'Mira has enough variety for a proper spring stall.',
} as const satisfies FollowUpGoalDefinition;

export const followUpGoalCatalog = [postSpringBasketFollowUpGoal] as const satisfies readonly FollowUpGoalDefinition[];

export function followUpGoalProgressText(collectionLog: CollectionLogProgress): string {
  if (isFollowUpGoalComplete(collectionLog)) {
    return `${postSpringBasketFollowUpGoal.title}: complete`;
  }

  return `${postSpringBasketFollowUpGoal.title}: ${clampedShippedCropCount(collectionLog)}/${postSpringBasketFollowUpGoal.targetShippedCropVarieties} crop varieties shipped`;
}

export function followUpGoalDetailText(collectionLog: CollectionLogProgress): string {
  if (isFollowUpGoalComplete(collectionLog)) {
    return `${postSpringBasketFollowUpGoal.title}: complete. ${postSpringBasketFollowUpGoal.completionSummary}`;
  }

  const shippedCount = clampedShippedCropCount(collectionLog);
  const remaining = postSpringBasketFollowUpGoal.targetShippedCropVarieties - shippedCount;
  const varietyText = remaining === 1 ? 'variety' : 'varieties';

  return `${postSpringBasketFollowUpGoal.title}: ${shippedCount}/${postSpringBasketFollowUpGoal.targetShippedCropVarieties} crop varieties shipped. ${remaining} more ${varietyText} ${postSpringBasketFollowUpGoal.incompleteSummary}`;
}

export function isFollowUpGoalComplete(collectionLog: CollectionLogProgress): boolean {
  return countShippedCrops(collectionLog) >= postSpringBasketFollowUpGoal.targetShippedCropVarieties;
}

export function validateFollowUpGoalCatalog(): FollowUpGoalCatalogValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<FollowUpGoalId>();

  for (const goal of followUpGoalCatalog) {
    if (seenIds.has(goal.id)) {
      errors.push(`Duplicate follow-up goal id: ${goal.id}`);
    }
    seenIds.add(goal.id);

    if (!goal.title || !goal.summary || !goal.incompleteSummary || !goal.completionSummary) {
      errors.push(`Follow-up goal ${goal.id} is missing display text.`);
    }

    if (
      !Number.isInteger(goal.targetShippedCropVarieties) ||
      goal.targetShippedCropVarieties <= 0 ||
      goal.targetShippedCropVarieties > cropCatalog.length
    ) {
      errors.push(`Follow-up goal ${goal.id} must target an achievable crop variety count.`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function clampedShippedCropCount(collectionLog: CollectionLogProgress): number {
  return Math.min(countShippedCrops(collectionLog), postSpringBasketFollowUpGoal.targetShippedCropVarieties);
}
