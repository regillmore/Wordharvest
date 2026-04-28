import { houseBedPosition } from '../core/worldTargets';
import { worldToScreen, type Viewport } from './viewport';

export interface ScreenBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export const houseBedVisualSize = {
  widthTiles: 1.08,
  heightTiles: 1.2,
} as const;

export function houseWallHeightForScreen(screenHeight: number): number {
  return Math.floor(screenHeight * 0.34);
}

export function houseFloorSeamTopY(screenHeight: number, viewport: Viewport): number {
  return houseWallHeightForScreen(screenHeight) - viewport.scale * 0.08;
}

export function houseBedScreenBounds(viewport: Viewport): ScreenBounds {
  const bed = worldToScreen(viewport, houseBedPosition);
  const width = viewport.scale * houseBedVisualSize.widthTiles;
  const height = viewport.scale * houseBedVisualSize.heightTiles;

  return {
    x: bed.x - width / 2,
    y: bed.y - height / 2,
    width,
    height,
  };
}
