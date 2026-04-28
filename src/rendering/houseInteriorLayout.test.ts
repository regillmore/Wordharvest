import { describe, expect, it } from 'vitest';
import { houseInteriorScreenLayout } from './houseInteriorLayout';

describe('house interior layout', () => {
  it('frames the starter cabin as a compact room instead of a full-screen floor', () => {
    const screenSizes = [
      { width: 480, height: 360 },
      { width: 1024, height: 768 },
      { width: 1366, height: 768 },
    ];

    for (const { width, height } of screenSizes) {
      const layout = houseInteriorScreenLayout(width, height);

      expect(layout.floor.width).toBeLessThan(width * 0.7);
      expect(layout.floor.height).toBeLessThan(height * 0.65);
      expect(layout.floor.x).toBeGreaterThan(0);
      expect(layout.floor.y).toBeGreaterThan(0);
      expect(layout.floor.x + layout.floor.width).toBeLessThan(width);
      expect(layout.southWall.y + layout.southWall.height).toBeLessThan(height);
    }
  });

  it('keeps the bed footprint on the floor against the northwest corner', () => {
    const layout = houseInteriorScreenLayout(1024, 768);

    expect(layout.bed.x).toBeGreaterThan(layout.floor.x);
    expect(layout.bed.y).toBeGreaterThanOrEqual(layout.floor.y);
    expect(layout.bed.x + layout.bed.width).toBeLessThan(layout.floor.x + layout.floor.width / 2);
    expect(layout.bed.y + layout.bed.height).toBeLessThan(layout.floor.y + layout.floor.height);
  });

  it('attaches the south doorway to the room threshold', () => {
    const layout = houseInteriorScreenLayout(1024, 768);
    const floorBottom = layout.floor.y + layout.floor.height;

    expect(layout.doorway.x).toBeLessThan(layout.floor.x + layout.floor.width / 2);
    expect(layout.doorway.x + layout.doorway.width).toBeGreaterThan(layout.floor.x + layout.floor.width / 2);
    expect(layout.doorway.y).toBeLessThanOrEqual(floorBottom);
    expect(layout.doorway.y + layout.doorway.height).toBeGreaterThan(floorBottom);
    expect(layout.doorway.y).toBeLessThan(layout.southWall.y + layout.southWall.height);
    expect(layout.doorway.y + layout.doorway.height).toBeGreaterThan(layout.southWall.y);
  });

  it('keeps starter-home decorations inside the walkable floor frame', () => {
    const layout = houseInteriorScreenLayout(1024, 768);

    for (const bounds of [layout.rug, layout.table, layout.shelf, layout.crate]) {
      expect(bounds.x).toBeGreaterThanOrEqual(layout.floor.x);
      expect(bounds.y).toBeGreaterThanOrEqual(layout.floor.y);
      expect(bounds.x + bounds.width).toBeLessThanOrEqual(layout.floor.x + layout.floor.width);
      expect(bounds.y + bounds.height).toBeLessThanOrEqual(layout.floor.y + layout.floor.height);
    }
  });
});
