import { normalizeTypedWord } from '../core/typing';

export type SeasonId = 'spring' | 'summer' | 'fall' | 'winter';
export type CropGrowthStage = 'seed' | 'sprout' | 'leaf' | 'ripe';

const cropIds = ['turnip', 'radish', 'pea', 'strawberry'] as const;

export type CropId = (typeof cropIds)[number];
export type CropCounts = Record<CropId, number>;

export interface CropStageThreshold {
  stage: CropGrowthStage;
  minGrowth: number;
}

export interface CropDefinition {
  id: CropId;
  name: string;
  pluralName: string;
  seedName: string;
  season: SeasonId;
  growthDays: number;
  sellPrice: number;
  seedPacketPrice: number;
  seedPacketQuantity: number;
  wordTags: readonly string[];
  stageThresholds: readonly CropStageThreshold[];
  harvestMessage: string;
}

export interface CropCatalogValidationResult {
  ok: boolean;
  errors: string[];
}

export const starterCropId: CropId = 'turnip';

export const cropCatalog = [
  {
    id: 'turnip',
    name: 'turnip',
    pluralName: 'turnips',
    seedName: 'turnip seeds',
    season: 'spring',
    growthDays: 3,
    sellPrice: 12,
    seedPacketPrice: 6,
    seedPacketQuantity: 3,
    wordTags: ['turnip', 'root', 'quick', 'starter'],
    stageThresholds: [
      { stage: 'seed', minGrowth: 0 },
      { stage: 'sprout', minGrowth: 1 },
      { stage: 'leaf', minGrowth: 2 },
      { stage: 'ripe', minGrowth: 3 },
    ],
    harvestMessage: 'Harvested a crisp turnip.',
  },
  {
    id: 'radish',
    name: 'radish',
    pluralName: 'radishes',
    seedName: 'radish seeds',
    season: 'spring',
    growthDays: 4,
    sellPrice: 18,
    seedPacketPrice: 8,
    seedPacketQuantity: 2,
    wordTags: ['radish', 'root', 'crisp', 'red'],
    stageThresholds: [
      { stage: 'seed', minGrowth: 0 },
      { stage: 'sprout', minGrowth: 1 },
      { stage: 'leaf', minGrowth: 3 },
      { stage: 'ripe', minGrowth: 4 },
    ],
    harvestMessage: 'Harvested a peppery radish.',
  },
  {
    id: 'pea',
    name: 'snap pea',
    pluralName: 'snap peas',
    seedName: 'snap pea seeds',
    season: 'spring',
    growthDays: 5,
    sellPrice: 22,
    seedPacketPrice: 10,
    seedPacketQuantity: 2,
    wordTags: ['pea', 'vine', 'spring', 'snack'],
    stageThresholds: [
      { stage: 'seed', minGrowth: 0 },
      { stage: 'sprout', minGrowth: 2 },
      { stage: 'leaf', minGrowth: 4 },
      { stage: 'ripe', minGrowth: 5 },
    ],
    harvestMessage: 'Harvested a handful of snap peas.',
  },
  {
    id: 'strawberry',
    name: 'strawberry',
    pluralName: 'strawberries',
    seedName: 'strawberry starts',
    season: 'spring',
    growthDays: 6,
    sellPrice: 30,
    seedPacketPrice: 16,
    seedPacketQuantity: 2,
    wordTags: ['strawberry', 'berry', 'sweet', 'late'],
    stageThresholds: [
      { stage: 'seed', minGrowth: 0 },
      { stage: 'sprout', minGrowth: 2 },
      { stage: 'leaf', minGrowth: 4 },
      { stage: 'ripe', minGrowth: 6 },
    ],
    harvestMessage: 'Harvested a sweet strawberry.',
  },
] as const satisfies readonly CropDefinition[];

const cropDefinitionsById = new Map<CropId, CropDefinition>(cropCatalog.map((definition) => [definition.id, definition]));

export function cropDefinition(cropId: CropId): CropDefinition {
  const definition = cropDefinitionsById.get(cropId);

  if (!definition) {
    throw new Error(`Missing crop definition: ${cropId}`);
  }

  return definition;
}

export function shopWordForCrop(cropId: CropId): string {
  return cropDefinition(cropId).wordTags[0] ?? cropId;
}

export function isCropId(value: unknown): value is CropId {
  return typeof value === 'string' && cropIds.includes(value as CropId);
}

export function emptyCropCounts(): CropCounts {
  return Object.fromEntries(cropCatalog.map((definition) => [definition.id, 0])) as CropCounts;
}

export function cropCountsWith(cropId: CropId, count: number): CropCounts {
  return {
    ...emptyCropCounts(),
    [cropId]: count,
  };
}

export function stageForCropGrowth(cropId: CropId, growth: number): CropGrowthStage {
  const thresholds = [...cropDefinition(cropId).stageThresholds].sort((left, right) => right.minGrowth - left.minGrowth);

  return thresholds.find((threshold) => growth >= threshold.minGrowth)?.stage ?? 'seed';
}

export function validateCropCatalog(): CropCatalogValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<CropId>();
  const seenShopWords = new Map<string, CropId>();

  for (const crop of cropCatalog) {
    const definition: CropDefinition = crop;

    if (seenIds.has(definition.id)) {
      errors.push(`Duplicate crop id: ${definition.id}`);
    }
    seenIds.add(definition.id);

    if (!definition.name || !definition.pluralName || !definition.seedName) {
      errors.push(`Crop ${definition.id} is missing display names.`);
    }

    if (definition.season !== 'spring') {
      errors.push(`Crop ${definition.id} has unsupported season: ${definition.season}`);
    }

    if (!isPositiveInteger(definition.growthDays)) {
      errors.push(`Crop ${definition.id} must have a positive integer growthDays.`);
    }

    if (!isPositiveInteger(definition.sellPrice)) {
      errors.push(`Crop ${definition.id} must have a positive integer sellPrice.`);
    }

    if (!isPositiveInteger(definition.seedPacketPrice)) {
      errors.push(`Crop ${definition.id} must have a positive integer seedPacketPrice.`);
    }

    if (!isPositiveInteger(definition.seedPacketQuantity)) {
      errors.push(`Crop ${definition.id} must have a positive integer seedPacketQuantity.`);
    }

    validateWordTags(definition, errors);
    validateShopWord(definition, seenShopWords, errors);
    validateStageThresholds(definition, errors);
  }

  if (!seenIds.has(starterCropId)) {
    errors.push(`Starter crop is missing from the catalog: ${starterCropId}`);
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function validateWordTags(definition: CropDefinition, errors: string[]): void {
  const seenTags = new Set<string>();

  if (definition.wordTags.length === 0) {
    errors.push(`Crop ${definition.id} must have at least one word tag.`);
  }

  for (const tag of definition.wordTags) {
    const normalizedTag = normalizeTypedWord(tag);

    if (!normalizedTag) {
      errors.push(`Crop ${definition.id} has an empty word tag.`);
      continue;
    }

    if (tag !== normalizedTag) {
      errors.push(`Crop ${definition.id} word tag must already be normalized: ${tag}`);
    }

    if (seenTags.has(normalizedTag)) {
      errors.push(`Crop ${definition.id} has duplicate word tag: ${normalizedTag}`);
    }
    seenTags.add(normalizedTag);
  }
}

function validateShopWord(
  definition: CropDefinition,
  seenShopWords: Map<string, CropId>,
  errors: string[],
): void {
  const shopWord = shopWordForCrop(definition.id);
  const firstCrop = seenShopWords.get(shopWord);

  if (firstCrop) {
    errors.push(`Duplicate shop crop word "${shopWord}" in ${firstCrop} and ${definition.id}.`);
  }

  seenShopWords.set(shopWord, definition.id);
}

function validateStageThresholds(definition: CropDefinition, errors: string[]): void {
  const stages = new Set<CropGrowthStage>();
  let previousMinGrowth = -1;

  for (const threshold of definition.stageThresholds) {
    if (threshold.minGrowth < previousMinGrowth) {
      errors.push(`Crop ${definition.id} stage thresholds must be sorted by minGrowth.`);
    }
    previousMinGrowth = threshold.minGrowth;
    stages.add(threshold.stage);
  }

  for (const stage of requiredGrowthStages) {
    if (!stages.has(stage)) {
      errors.push(`Crop ${definition.id} is missing ${stage} stage threshold.`);
    }
  }

  const seedThreshold = definition.stageThresholds.find((threshold) => threshold.stage === 'seed');
  if (seedThreshold?.minGrowth !== 0) {
    errors.push(`Crop ${definition.id} seed stage must start at growth 0.`);
  }

  const ripeThreshold = definition.stageThresholds.find((threshold) => threshold.stage === 'ripe');
  if (ripeThreshold?.minGrowth !== definition.growthDays) {
    errors.push(`Crop ${definition.id} ripe stage must match growthDays.`);
  }
}

function isPositiveInteger(value: number): boolean {
  return Number.isInteger(value) && value > 0;
}

const requiredGrowthStages: readonly CropGrowthStage[] = ['seed', 'sprout', 'leaf', 'ripe'];
