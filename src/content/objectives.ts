import { cropDefinition, emptyCropCounts, isCropId, type CropCounts, type CropId } from './crops';

const objectiveIds = ['springBasket'] as const;

export type ObjectiveId = (typeof objectiveIds)[number];

export interface CropShipmentRequirement {
  crop: CropId;
  count: number;
}

export interface ObjectiveDefinition {
  id: ObjectiveId;
  name: string;
  summary: string;
  requiredShipments: readonly CropShipmentRequirement[];
  rewardCoins: number;
  completedLog: string;
}

export interface ObjectiveProgress {
  id: ObjectiveId;
  shipped: CropCounts;
  completed: boolean;
}

export interface ObjectiveCatalogValidationResult {
  ok: boolean;
  errors: string[];
}

export interface CropShipment {
  crop: CropId;
  count: number;
}

export interface ObjectiveShipmentUpdate {
  progress: ObjectiveProgress;
  newlyCompleted: boolean;
}

export const firstSeasonObjectiveId: ObjectiveId = 'springBasket';

export const objectiveCatalog = [
  {
    id: 'springBasket',
    name: 'Spring Basket',
    summary: "Ship one turnip, one radish, and one carrot for Mira's market table.",
    requiredShipments: [
      { crop: 'turnip', count: 1 },
      { crop: 'radish', count: 1 },
      { crop: 'carrot', count: 1 },
    ],
    rewardCoins: 25,
    completedLog: 'Spring Basket complete! Mira added 25 coins for the market table.',
  },
] as const satisfies readonly ObjectiveDefinition[];

const objectivesById = new Map<ObjectiveId, ObjectiveDefinition>(
  objectiveCatalog.map((definition) => [definition.id, definition]),
);

export function objectiveDefinition(objectiveId: ObjectiveId): ObjectiveDefinition {
  const definition = objectivesById.get(objectiveId);

  if (!definition) {
    throw new Error(`Missing objective definition: ${objectiveId}`);
  }

  return definition;
}

export function isObjectiveId(value: unknown): value is ObjectiveId {
  return typeof value === 'string' && objectiveIds.includes(value as ObjectiveId);
}

export function createObjectiveProgress(objectiveId: ObjectiveId = firstSeasonObjectiveId): ObjectiveProgress {
  return {
    id: objectiveId,
    shipped: emptyCropCounts(),
    completed: false,
  };
}

export function normalizeObjectiveProgress(value: unknown): ObjectiveProgress {
  if (!isRecord(value) || !isObjectiveId(value.id)) {
    return createObjectiveProgress();
  }

  const shipped = normalizeObjectiveShipments(value.shipped);

  return {
    id: value.id,
    shipped,
    completed: value.completed === true || isObjectiveComplete(objectiveDefinition(value.id), shipped),
  };
}

export function recordObjectiveShipments(
  progress: ObjectiveProgress,
  shipments: readonly CropShipment[],
): ObjectiveShipmentUpdate {
  const normalizedProgress = normalizeObjectiveProgress(progress);
  const definition = objectiveDefinition(normalizedProgress.id);
  const completedBefore =
    normalizedProgress.completed || isObjectiveComplete(definition, normalizedProgress.shipped);
  const shipped = { ...normalizedProgress.shipped };

  for (const shipment of shipments) {
    shipped[shipment.crop] += shipment.count;
  }

  const completed = isObjectiveComplete(definition, shipped);

  return {
    progress: {
      id: normalizedProgress.id,
      shipped,
      completed: completedBefore || completed,
    },
    newlyCompleted: !completedBefore && completed,
  };
}

export function objectiveProgressText(progress: ObjectiveProgress): string {
  const normalizedProgress = normalizeObjectiveProgress(progress);
  const definition = objectiveDefinition(normalizedProgress.id);
  const completeCount = objectiveCompleteRequirementCount(definition, normalizedProgress.shipped);

  if (normalizedProgress.completed) {
    return `${definition.name}: complete`;
  }

  return `${definition.name}: ${completeCount}/${definition.requiredShipments.length} crops shipped`;
}

export function objectiveDetailText(progress: ObjectiveProgress): string {
  const normalizedProgress = normalizeObjectiveProgress(progress);
  const definition = objectiveDefinition(normalizedProgress.id);
  const details = definition.requiredShipments
    .map((requirement) => {
      const crop = cropDefinition(requirement.crop);
      const count = Math.min(normalizedProgress.shipped[requirement.crop], requirement.count);

      return `${crop.name} ${count}/${requirement.count}`;
    })
    .join(', ');

  return `${objectiveProgressText(normalizedProgress)} (${details})`;
}

export function validateObjectiveCatalog(): ObjectiveCatalogValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<ObjectiveId>();

  for (const objective of objectiveCatalog) {
    const definition: ObjectiveDefinition = objective;

    if (seenIds.has(definition.id)) {
      errors.push(`Duplicate objective id: ${definition.id}`);
    }
    seenIds.add(definition.id);

    if (!definition.name || !definition.summary || !definition.completedLog) {
      errors.push(`Objective ${definition.id} is missing display text.`);
    }

    if (!Number.isInteger(definition.rewardCoins) || definition.rewardCoins < 0) {
      errors.push(`Objective ${definition.id} must have a non-negative integer reward.`);
    }

    validateShipmentRequirements(definition, errors);
  }

  for (const requiredObjective of requiredObjectiveIds) {
    if (!seenIds.has(requiredObjective)) {
      errors.push(`Missing required objective id: ${requiredObjective}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function validateShipmentRequirements(definition: ObjectiveDefinition, errors: string[]): void {
  const seenCrops = new Set<CropId>();

  if (definition.requiredShipments.length === 0) {
    errors.push(`Objective ${definition.id} must require at least one shipment.`);
  }

  for (const requirement of definition.requiredShipments) {
    if (!isCropId(requirement.crop)) {
      errors.push(`Objective ${definition.id} has an unknown required crop: ${requirement.crop}`);
    }

    if (seenCrops.has(requirement.crop)) {
      errors.push(`Objective ${definition.id} repeats required crop: ${requirement.crop}`);
    }
    seenCrops.add(requirement.crop);

    if (!Number.isInteger(requirement.count) || requirement.count <= 0) {
      errors.push(`Objective ${definition.id} crop ${requirement.crop} must require a positive count.`);
    }
  }
}

function normalizeObjectiveShipments(value: unknown): CropCounts {
  const shipped = emptyCropCounts();

  if (!isRecord(value)) {
    return shipped;
  }

  for (const cropId of Object.keys(shipped) as CropId[]) {
    shipped[cropId] = readNonNegativeInteger(value[cropId], 0);
  }

  return shipped;
}

function objectiveCompleteRequirementCount(definition: ObjectiveDefinition, shipped: CropCounts): number {
  return definition.requiredShipments.filter((requirement) => shipped[requirement.crop] >= requirement.count).length;
}

function isObjectiveComplete(definition: ObjectiveDefinition, shipped: CropCounts): boolean {
  return objectiveCompleteRequirementCount(definition, shipped) === definition.requiredShipments.length;
}

function readNonNegativeInteger(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 0 ? value : fallback;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const requiredObjectiveIds: readonly ObjectiveId[] = ['springBasket'];
