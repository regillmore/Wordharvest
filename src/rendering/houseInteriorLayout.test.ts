import { describe, expect, it } from 'vitest';
import { createViewport } from './viewport';
import { houseBedScreenBounds, houseFloorSeamTopY } from './houseInteriorLayout';

describe('house interior layout', () => {
  it('keeps the bed on the floor side of the back-wall seam', () => {
    const screenSizes = [
      { width: 480, height: 360 },
      { width: 1024, height: 768 },
      { width: 1366, height: 768 },
    ];

    for (const { width, height } of screenSizes) {
      const viewport = createViewport(width, height);
      const bed = houseBedScreenBounds(viewport);
      const seamTop = houseFloorSeamTopY(height, viewport);

      expect(bed.y).toBeGreaterThanOrEqual(seamTop);
    }
  });
});
