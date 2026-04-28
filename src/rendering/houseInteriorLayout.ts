import { houseBedPosition } from '../core/worldTargets';
import { worldToScreen, type Viewport } from './viewport';

export interface ScreenBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface WorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface HouseInteriorScreenLayout {
  viewport: Viewport;
  floor: ScreenBounds;
  northWall: ScreenBounds;
  westWall: ScreenBounds;
  eastWall: ScreenBounds;
  southWall: ScreenBounds;
  doorway: ScreenBounds;
  bed: ScreenBounds;
  rug: ScreenBounds;
  table: ScreenBounds;
  shelf: ScreenBounds;
  crate: ScreenBounds;
}

export const houseInteriorRoomWorldBounds = {
  minX: -2.45,
  minY: 1.42,
  maxX: 2.45,
  maxY: 4.9,
} as const satisfies WorldBounds;

export const houseBedVisualSize = {
  widthTiles: 1.08,
  heightTiles: 1.12,
} as const;

const maxInteriorScale = 84;
const minInteriorScale = 44;
const wallDepthTiles = 0.36;
const sideWallWidthTiles = 0.18;
const southWallHeightTiles = 0.22;
const doorwayWidthTiles = 1.16;
const doorwayDepthTiles = 0.54;

export function createHouseInteriorViewport(screenWidth: number, screenHeight: number): Viewport {
  const roomWidthTiles = houseInteriorRoomWorldBounds.maxX - houseInteriorRoomWorldBounds.minX;
  const roomHeightTiles = houseInteriorRoomWorldBounds.maxY - houseInteriorRoomWorldBounds.minY;
  const scale = Math.max(
    minInteriorScale,
    Math.min(
      maxInteriorScale,
      Math.floor(Math.min((screenWidth * 0.68) / roomWidthTiles, (screenHeight * 0.62) / roomHeightTiles)),
    ),
  );
  const floorTop = Math.round(Math.max(42, (screenHeight - roomHeightTiles * scale) * 0.42));

  return {
    originX: Math.round(screenWidth / 2),
    originY: floorTop - houseInteriorRoomWorldBounds.minY * scale,
    scale,
  };
}

export function houseInteriorScreenLayout(screenWidth: number, screenHeight: number): HouseInteriorScreenLayout {
  const viewport = createHouseInteriorViewport(screenWidth, screenHeight);
  const floor = screenBoundsForWorldBounds(viewport, houseInteriorRoomWorldBounds);
  const wallDepth = viewport.scale * wallDepthTiles;
  const sideWallWidth = viewport.scale * sideWallWidthTiles;
  const southWallHeight = viewport.scale * southWallHeightTiles;
  const doorwayWidth = viewport.scale * doorwayWidthTiles;
  const doorwayDepth = viewport.scale * doorwayDepthTiles;

  return {
    viewport,
    floor,
    northWall: {
      x: floor.x,
      y: floor.y - wallDepth,
      width: floor.width,
      height: wallDepth,
    },
    westWall: {
      x: floor.x - sideWallWidth,
      y: floor.y - wallDepth,
      width: sideWallWidth,
      height: floor.height + wallDepth + southWallHeight,
    },
    eastWall: {
      x: floor.x + floor.width,
      y: floor.y - wallDepth,
      width: sideWallWidth,
      height: floor.height + wallDepth + southWallHeight,
    },
    southWall: {
      x: floor.x,
      y: floor.y + floor.height - southWallHeight * 0.55,
      width: floor.width,
      height: southWallHeight,
    },
    doorway: {
      x: floor.x + floor.width / 2 - doorwayWidth / 2,
      y: floor.y + floor.height - doorwayDepth * 0.52,
      width: doorwayWidth,
      height: doorwayDepth,
    },
    bed: houseBedScreenBounds(viewport),
    rug: screenBoundsForWorldBounds(viewport, { minX: -0.55, minY: 3.02, maxX: 0.6, maxY: 3.78 }),
    table: screenBoundsForWorldBounds(viewport, { minX: 0.88, minY: 2.36, maxX: 1.62, maxY: 3.0 }),
    shelf: screenBoundsForWorldBounds(viewport, { minX: 0.78, minY: 1.52, maxX: 1.75, maxY: 1.84 }),
    crate: screenBoundsForWorldBounds(viewport, { minX: 1.12, minY: 3.62, maxX: 1.72, maxY: 4.15 }),
  };
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

function screenBoundsForWorldBounds(viewport: Viewport, bounds: WorldBounds): ScreenBounds {
  const topLeft = worldToScreen(viewport, { x: bounds.minX, y: bounds.minY });
  const bottomRight = worldToScreen(viewport, { x: bounds.maxX, y: bounds.maxY });

  return {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  };
}
