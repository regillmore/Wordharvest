import { describe, expect, it } from 'vitest';
import {
  collectionDetailText,
  collectionProgressText,
  countDiscoveredCrops,
  countShippedCrops,
  createCollectionLogProgress,
  markCropsDiscovered,
  markCropsShipped,
  normalizeCollectionLogProgress,
} from './collectionLog';

describe('collection log', () => {
  it('starts with the starter crop discovered', () => {
    const progress = createCollectionLogProgress();

    expect(progress.discoveredCrops.turnip).toBe(true);
    expect(progress.shippedCrops.turnip).toBe(false);
    expect(collectionProgressText(progress)).toBe('1/10 found, 0/10 shipped');
    expect(collectionDetailText(progress)).toBe('Collection: 1/10 found, 0/10 shipped. Found: turnip. Shipped: none.');
  });

  it('tracks discovered and shipped crop varieties once each', () => {
    let progress = createCollectionLogProgress();
    const discoveredUpdate = markCropsDiscovered(progress, ['radish', 'carrot', 'radish']);
    progress = discoveredUpdate.progress;

    expect(discoveredUpdate.newlyDiscovered).toEqual(['radish', 'carrot']);
    expect(collectionProgressText(progress)).toBe('3/10 found, 0/10 shipped');

    const shippedUpdate = markCropsShipped(progress, ['radish', 'pea', 'radish']);
    progress = shippedUpdate.progress;

    expect(shippedUpdate.newlyDiscovered).toEqual(['pea']);
    expect(shippedUpdate.newlyShipped).toEqual(['radish', 'pea']);
    expect(countDiscoveredCrops(progress)).toBe(4);
    expect(countShippedCrops(progress)).toBe(2);
    expect(collectionProgressText(progress)).toBe('4/10 found, 2/10 shipped');
    expect(collectionDetailText(progress)).toBe(
      'Collection: 4/10 found, 2/10 shipped. Found: turnip, radish, snap pea, carrot. Shipped: radish, snap pea.',
    );
    expect(markCropsShipped(progress, ['radish']).newlyShipped).toEqual([]);
  });

  it('normalizes missing and shipped-only collection data', () => {
    const progress = normalizeCollectionLogProgress({
      discoveredCrops: {
        turnip: true,
      },
      shippedCrops: {
        carrot: true,
      },
    });

    expect(progress.discoveredCrops.turnip).toBe(true);
    expect(progress.discoveredCrops.carrot).toBe(true);
    expect(progress.shippedCrops.carrot).toBe(true);
    expect(collectionProgressText(progress)).toBe('2/10 found, 1/10 shipped');
  });
});
