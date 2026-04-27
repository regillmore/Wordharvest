import { normalizeTypedWord } from '../core/typing';
import { cropCatalog, shopWordForCrop, starterCropId, type CropId } from './crops';
import { targetWordCatalog } from './targetWords';
import { shopWordForUpgrade, upgradeCatalog } from './upgrades';

export type CropCollectionFlags = Record<CropId, boolean>;
export type WordCollectionFlags = Record<string, boolean>;

export interface CollectionLogProgress {
  discoveredCrops: CropCollectionFlags;
  shippedCrops: CropCollectionFlags;
  discoveredWords: WordCollectionFlags;
  usedWords: WordCollectionFlags;
}

export interface CollectionLogUpdate {
  progress: CollectionLogProgress;
  newlyDiscovered: CropId[];
  newlyShipped: CropId[];
  newlyDiscoveredWords: string[];
  newlyUsedWords: string[];
}

export const collectionWordCatalog = [
  ...new Set([
    ...targetWordCatalog.flatMap((definition) => definition.words),
    ...cropCatalog.map((crop) => shopWordForCrop(crop.id)),
    ...upgradeCatalog.map((upgrade) => shopWordForUpgrade(upgrade.id)),
  ]),
];

export function createCollectionLogProgress(
  initialDiscovered: readonly CropId[] = [starterCropId],
): CollectionLogProgress {
  return markCropsDiscovered(
    {
      discoveredCrops: emptyCropCollectionFlags(),
      shippedCrops: emptyCropCollectionFlags(),
      discoveredWords: emptyWordCollectionFlags(),
      usedWords: emptyWordCollectionFlags(),
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
  const discoveredWords = normalizeWordFlags(value.discoveredWords);
  const usedWords = normalizeWordFlags(value.usedWords);

  discoveredCrops[starterCropId] = true;

  for (const crop of cropCatalog) {
    if (shippedCrops[crop.id]) {
      discoveredCrops[crop.id] = true;
    }
  }

  for (const word of collectionWordCatalog) {
    if (usedWords[word]) {
      discoveredWords[word] = true;
    }
  }

  return {
    discoveredCrops,
    shippedCrops,
    discoveredWords,
    usedWords,
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
    newlyDiscoveredWords: [],
    newlyUsedWords: [],
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
      discoveredWords: discoveredUpdate.progress.discoveredWords,
      usedWords: discoveredUpdate.progress.usedWords,
    },
    newlyDiscovered: discoveredUpdate.newlyDiscovered,
    newlyShipped,
    newlyDiscoveredWords: [],
    newlyUsedWords: [],
  };
}

export function markWordsDiscovered(
  progress: CollectionLogProgress,
  words: readonly string[],
): CollectionLogUpdate {
  const normalizedProgress = normalizeCollectionLogProgress(progress);
  const discoveredWords = { ...normalizedProgress.discoveredWords };
  const newlyDiscoveredWords: string[] = [];

  for (const word of uniqueCollectionWords(words)) {
    if (!discoveredWords[word]) {
      discoveredWords[word] = true;
      newlyDiscoveredWords.push(word);
    }
  }

  return {
    progress: {
      ...normalizedProgress,
      discoveredWords,
    },
    newlyDiscovered: [],
    newlyShipped: [],
    newlyDiscoveredWords,
    newlyUsedWords: [],
  };
}

export function markWordsUsed(progress: CollectionLogProgress, words: readonly string[]): CollectionLogUpdate {
  const discoveredUpdate = markWordsDiscovered(progress, words);
  const usedWords = { ...discoveredUpdate.progress.usedWords };
  const newlyUsedWords: string[] = [];

  for (const word of uniqueCollectionWords(words)) {
    if (!usedWords[word]) {
      usedWords[word] = true;
      newlyUsedWords.push(word);
    }
  }

  return {
    progress: {
      discoveredCrops: discoveredUpdate.progress.discoveredCrops,
      shippedCrops: discoveredUpdate.progress.shippedCrops,
      discoveredWords: discoveredUpdate.progress.discoveredWords,
      usedWords,
    },
    newlyDiscovered: [],
    newlyShipped: [],
    newlyDiscoveredWords: discoveredUpdate.newlyDiscoveredWords,
    newlyUsedWords,
  };
}

export function collectionProgressText(progress: CollectionLogProgress): string {
  const normalizedProgress = normalizeCollectionLogProgress(progress);
  const cropTotal = cropCatalog.length;
  const wordTotal = collectionWordCatalog.length;

  return `Crops ${countFlags(normalizedProgress.discoveredCrops)}/${cropTotal} found, ${countFlags(normalizedProgress.shippedCrops)}/${cropTotal} shipped; Words ${countWordFlags(normalizedProgress.discoveredWords)}/${wordTotal} found, ${countWordFlags(normalizedProgress.usedWords)}/${wordTotal} used`;
}

export function countDiscoveredCrops(progress: CollectionLogProgress): number {
  return countFlags(normalizeCollectionLogProgress(progress).discoveredCrops);
}

export function countShippedCrops(progress: CollectionLogProgress): number {
  return countFlags(normalizeCollectionLogProgress(progress).shippedCrops);
}

export function countDiscoveredWords(progress: CollectionLogProgress): number {
  return countWordFlags(normalizeCollectionLogProgress(progress).discoveredWords);
}

export function countUsedWords(progress: CollectionLogProgress): number {
  return countWordFlags(normalizeCollectionLogProgress(progress).usedWords);
}

export function collectionDetailText(progress: CollectionLogProgress): string {
  const normalizedProgress = normalizeCollectionLogProgress(progress);

  return `Collection: ${collectionProgressText(normalizedProgress)}. Found crops: ${cropListText(normalizedProgress.discoveredCrops)}. Shipped crops: ${cropListText(normalizedProgress.shippedCrops)}. Found words: ${wordListText(normalizedProgress.discoveredWords)}. Used words: ${wordListText(normalizedProgress.usedWords)}.`;
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

function emptyWordCollectionFlags(): WordCollectionFlags {
  return Object.fromEntries(collectionWordCatalog.map((word) => [word, false]));
}

function normalizeWordFlags(value: unknown): WordCollectionFlags {
  const flags = emptyWordCollectionFlags();

  if (!isRecord(value)) {
    return flags;
  }

  for (const word of collectionWordCatalog) {
    flags[word] = value[word] === true;
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

function wordListText(flags: WordCollectionFlags): string {
  const words = collectionWordCatalog.filter((word) => flags[word]);

  return words.length > 0 ? words.join(', ') : 'none';
}

function countWordFlags(flags: WordCollectionFlags): number {
  return collectionWordCatalog.filter((word) => flags[word]).length;
}

function uniqueCropIds(cropIds: readonly CropId[]): CropId[] {
  return [...new Set(cropIds)];
}

function uniqueCollectionWords(words: readonly string[]): string[] {
  const knownWords = new Set(collectionWordCatalog);

  return [
    ...new Set(
      words
        .map((word) => normalizeTypedWord(word))
        .filter((word): word is string => Boolean(word) && knownWords.has(word)),
    ),
  ];
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
