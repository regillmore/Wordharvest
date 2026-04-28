import { describe, expect, it } from 'vitest';
import { shopInteriorScreenLayout } from './shopInteriorLayout';

describe('shop interior layout', () => {
  it('frames the town shop as a compact room matching the cabin scale', () => {
    const screenSizes = [
      { width: 480, height: 360 },
      { width: 1024, height: 768 },
      { width: 1366, height: 768 },
    ];

    for (const { width, height } of screenSizes) {
      const layout = shopInteriorScreenLayout(width, height);

      expect(layout.floor.width).toBeLessThan(width * 0.72);
      expect(layout.floor.height).toBeLessThan(height * 0.65);
      expect(layout.floor.x).toBeGreaterThan(0);
      expect(layout.floor.y).toBeGreaterThan(0);
      expect(layout.floor.x + layout.floor.width).toBeLessThan(width);
      expect(layout.southWall.y + layout.southWall.height).toBeLessThan(height);
    }
  });

  it('keeps shop fixtures inside the floor frame', () => {
    const layout = shopInteriorScreenLayout(1024, 768);

    for (const bounds of [
      layout.counter,
      layout.leftShelf,
      layout.rightShelf,
      layout.seedBins,
      layout.upgradeDisplay,
      layout.rug,
      layout.crate,
    ]) {
      expect(bounds.x).toBeGreaterThanOrEqual(layout.floor.x);
      expect(bounds.y).toBeGreaterThanOrEqual(layout.floor.y);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(layout.floor.x + layout.floor.width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(layout.floor.y + layout.floor.height);
    }
  });

  it('attaches the shop doorway to the south threshold', () => {
    const layout = shopInteriorScreenLayout(1024, 768);
    const floorBottom = layout.floor.y + layout.floor.height;

    expect(layout.doorway.x).toBeLessThan(layout.floor.x + layout.floor.width / 2);
    expect(layout.doorway.x + layout.doorway.width).toBeGreaterThan(layout.floor.x + layout.floor.width / 2);
    expect(layout.doorway.y).toBeLessThanOrEqual(floorBottom);
    expect(layout.doorway.y + layout.doorway.height).toBeGreaterThan(floorBottom);
    expect(layout.doorway.y).toBeLessThan(layout.southWall.y + layout.southWall.height);
    expect(layout.doorway.y + layout.doorway.height).toBeGreaterThan(layout.southWall.y);
  });

  it('places the counter north of the entry path with room to stand below it', () => {
    const layout = shopInteriorScreenLayout(1024, 768);

    expect(layout.counter.x).toBeGreaterThan(layout.floor.x);
    expect(layout.counter.x + layout.counter.width).toBeLessThan(layout.floor.x + layout.floor.width);
    expect(layout.counter.y).toBeGreaterThan(layout.floor.y);
    expect(layout.counter.y + layout.counter.height).toBeLessThan(layout.rug.y);
  });
});
