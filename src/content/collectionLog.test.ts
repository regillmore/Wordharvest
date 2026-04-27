import { describe, expect, it } from 'vitest';
import {
  collectionWordCatalog,
  collectionDetailText,
  collectionProgressText,
  countDiscoveredWords,
  countDiscoveredCrops,
  countShippedCrops,
  countUsedWords,
  createCollectionLogProgress,
  markCropsDiscovered,
  markCropsShipped,
  markWordsDiscovered,
  markWordsUsed,
  normalizeCollectionLogProgress,
} from './collectionLog';

describe('collection log', () => {
  it('starts with the starter crop discovered', () => {
    const progress = createCollectionLogProgress();

    expect(progress.discoveredCrops.turnip).toBe(true);
    expect(progress.shippedCrops.turnip).toBe(false);
    expect(countDiscoveredWords(progress)).toBe(0);
    expect(countUsedWords(progress)).toBe(0);
    expect(collectionProgressText(progress)).toBe(
      `Crops 1/10 found, 0/10 shipped; Words 0/${collectionWordCatalog.length} found, 0/${collectionWordCatalog.length} used`,
    );
    expect(collectionDetailText(progress)).toBe(
      `Collection: Crops 1/10 found, 0/10 shipped; Words 0/${collectionWordCatalog.length} found, 0/${collectionWordCatalog.length} used. Found crops: turnip. Shipped crops: none. Found words: none. Used words: none.`,
    );
  });

  it('tracks discovered and shipped crop varieties once each', () => {
    let progress = createCollectionLogProgress();
    const discoveredUpdate = markCropsDiscovered(progress, ['radish', 'carrot', 'radish']);
    progress = discoveredUpdate.progress;

    expect(discoveredUpdate.newlyDiscovered).toEqual(['radish', 'carrot']);
    expect(collectionProgressText(progress)).toBe(
      `Crops 3/10 found, 0/10 shipped; Words 0/${collectionWordCatalog.length} found, 0/${collectionWordCatalog.length} used`,
    );

    const shippedUpdate = markCropsShipped(progress, ['radish', 'pea', 'radish']);
    progress = shippedUpdate.progress;

    expect(shippedUpdate.newlyDiscovered).toEqual(['pea']);
    expect(shippedUpdate.newlyShipped).toEqual(['radish', 'pea']);
    expect(countDiscoveredCrops(progress)).toBe(4);
    expect(countShippedCrops(progress)).toBe(2);
    expect(collectionProgressText(progress)).toBe(
      `Crops 4/10 found, 2/10 shipped; Words 0/${collectionWordCatalog.length} found, 0/${collectionWordCatalog.length} used`,
    );
    expect(collectionDetailText(progress)).toBe(
      `Collection: Crops 4/10 found, 2/10 shipped; Words 0/${collectionWordCatalog.length} found, 0/${collectionWordCatalog.length} used. Found crops: turnip, radish, snap pea, carrot. Shipped crops: radish, snap pea. Found words: none. Used words: none.`,
    );
    expect(markCropsShipped(progress, ['radish']).newlyShipped).toEqual([]);
  });

  it('tracks discovered and used words once each', () => {
    let progress = createCollectionLogProgress();
    const discoveredUpdate = markWordsDiscovered(progress, ['house', 'door', 'house', 'notaword']);
    progress = discoveredUpdate.progress;

    expect(discoveredUpdate.newlyDiscoveredWords).toEqual(['house', 'door']);
    expect(countDiscoveredWords(progress)).toBe(2);
    expect(countUsedWords(progress)).toBe(0);

    const usedUpdate = markWordsUsed(progress, ['door', 'seed']);
    progress = usedUpdate.progress;

    expect(usedUpdate.newlyDiscoveredWords).toEqual(['seed']);
    expect(usedUpdate.newlyUsedWords).toEqual(['door', 'seed']);
    expect(countDiscoveredWords(progress)).toBe(3);
    expect(countUsedWords(progress)).toBe(2);
    expect(collectionProgressText(progress)).toBe(
      `Crops 1/10 found, 0/10 shipped; Words 3/${collectionWordCatalog.length} found, 2/${collectionWordCatalog.length} used`,
    );
    expect(collectionDetailText(progress)).toContain('Found words: house, door, seed.');
    expect(collectionDetailText(progress)).toContain('Used words: door, seed.');
  });

  it('normalizes missing and shipped-only collection data', () => {
    const progress = normalizeCollectionLogProgress({
      discoveredCrops: {
        turnip: true,
      },
      shippedCrops: {
        carrot: true,
      },
      usedWords: {
        town: true,
      },
    });

    expect(progress.discoveredCrops.turnip).toBe(true);
    expect(progress.discoveredCrops.carrot).toBe(true);
    expect(progress.shippedCrops.carrot).toBe(true);
    expect(progress.discoveredWords.town).toBe(true);
    expect(progress.usedWords.town).toBe(true);
    expect(collectionProgressText(progress)).toBe(
      `Crops 2/10 found, 1/10 shipped; Words 1/${collectionWordCatalog.length} found, 1/${collectionWordCatalog.length} used`,
    );
  });
});
