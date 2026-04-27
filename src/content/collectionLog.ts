import { cropCatalog, starterCropId, type CropId } from './crops';

export type CropCollectionFlags = Record<CropId, boolean>;

export interface CollectionLogProgress {
  discoveredCrops: CropCollectionFlags;
  shippedCrops: CropCollectionFlags;
}

export interface CollectionLogUpdate {
  progress: CollectionLogProgress;
  newlyDiscovered: CropId[];
  newlyShipped: CropId[];
}

export function createCollectionLogProgress(
  initialDiscovered: readonly CropId[] = [starterCropId],
): CollectionLogProgress {
  return markCropsDiscovered(
    {
      discoveredCrops: emptyCropCollectionFlags(),
      shippedCrops: emptyCropCollectionFlags(),
    },
    initialDiscovered,
  ).progress;
}

export function normalizeCollectionLogProgress(value: unknown): CollectionLogProgress {
  if (!isRecord(value)) {
    return createCollectionLogProgress();
  }

  const discoveredCrops = normalizeCropFlags(value.discoveredCrops);
  const shippedCrops = normalizeCropFlags(value.shippedCrops);

  discoveredCrops[starterCropId] = true;

  for (const crop of cropCatalog) {
    if (shippedCrops[crop.id]) {
      discoveredCrops[crop.id] = true;
    }
  }

  return {
    discoveredCrops,
    shippedCrops,
  };
}

export function markCropsDiscovered(
  progress: CollectionLogProgress,
  cropIds: readonly CropId[],
): CollectionLogUpdate {
  const normalizedProgress = normalizeCollectionLogProgress(progress);
  const discoveredCrops = { ...normalizedProgress.discoveredCrops };
  const newlyDiscovered: CropId[] = [];

  for (const cropId of uniqueCropIds(cropIds)) {
    if (!discoveredCrops[cropId]) {
      discoveredCrops[cropId] = true;
      newlyDiscovered.push(cropId);
    }
  }

  return {
    progress: {
      ...normalizedProgress,
      discoveredCrops,
    },
    newlyDiscovered,
    newlyShipped: [],
  };
}

export function markCropsShipped(
  progress: CollectionLogProgress,
  cropIds: readonly CropId[],
): CollectionLogUpdate {
  const discoveredUpdate = markCropsDiscovered(progress, cropIds);
  const shippedCrops = { ...discoveredUpdate.progress.shippedCrops };
  const newlyShipped: CropId[] = [];

  for (const cropId of uniqueCropIds(cropIds)) {
    if (!shippedCrops[cropId]) {
      shippedCrops[cropId] = true;
      newlyShipped.push(cropId);
    }
  }

  return {
    progress: {
      discoveredCrops: discoveredUpdate.progress.discoveredCrops,
      shippedCrops,
    },
    newlyDiscovered: discoveredUpdate.newlyDiscovered,
    newlyShipped,
  };
}

export function collectionProgressText(progress: CollectionLogProgress): string {
  const normalizedProgress = normalizeCollectionLogProgress(progress);
  const total = cropCatalog.length;

  return `${countFlags(normalizedProgress.discoveredCrops)}/${total} found, ${countFlags(normalizedProgress.shippedCrops)}/${total} shipped`;
}

export function collectionDetailText(progress: CollectionLogProgress): string {
  const normalizedProgress = normalizeCollectionLogProgress(progress);

  return `Collection: ${collectionProgressText(normalizedProgress)}. Found: ${cropListText(normalizedProgress.discoveredCrops)}. Shipped: ${cropListText(normalizedProgress.shippedCrops)}.`;
}

function emptyCropCollectionFlags(): CropCollectionFlags {
  return Object.fromEntries(cropCatalog.map((crop) => [crop.id, false])) as CropCollectionFlags;
}

function normalizeCropFlags(value: unknown): CropCollectionFlags {
  const flags = emptyCropCollectionFlags();

  if (!isRecord(value)) {
    return flags;
  }

  for (const crop of cropCatalog) {
    flags[crop.id] = value[crop.id] === true;
  }

  return flags;
}

function cropListText(flags: CropCollectionFlags): string {
  const cropNames = cropCatalog.filter((crop) => flags[crop.id]).map((crop) => crop.name);

  return cropNames.length > 0 ? cropNames.join(', ') : 'none';
}

function countFlags(flags: CropCollectionFlags): number {
  return cropCatalog.filter((crop) => flags[crop.id]).length;
}

function uniqueCropIds(cropIds: readonly CropId[]): CropId[] {
  return [...new Set(cropIds)];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
