import type { ScreenBounds } from './houseInteriorLayout';
import { worldToScreen, type Viewport } from './viewport';

interface WorldBounds {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export interface ShopInteriorScreenLayout {
  viewport: Viewport;
  floor: ScreenBounds;
  northWall: ScreenBounds;
  westWall: ScreenBounds;
  eastWall: ScreenBounds;
  southWall: ScreenBounds;
  doorway: ScreenBounds;
  counter: ScreenBounds;
  leftShelf: ScreenBounds;
  rightShelf: ScreenBounds;
  seedBins: ScreenBounds;
  upgradeDisplay: ScreenBounds;
  rug: ScreenBounds;
  crate: ScreenBounds;
}

export const shopInteriorRoomWorldBounds = {
  minX: -2.55,
  minY: 1.36,
  maxX: 2.55,
  maxY: 4.9,
} as const satisfies WorldBounds;

const maxInteriorScale = 84;
const minInteriorScale = 44;
const wallDepthTiles = 0.36;
const sideWallWidthTiles = 0.18;
const southWallHeightTiles = 0.22;
const doorwayWidthTiles = 1.16;
const doorwayDepthTiles = 0.54;

export function createShopInteriorViewport(screenWidth: number, screenHeight: number): Viewport {
  const roomWidthTiles = shopInteriorRoomWorldBounds.maxX - shopInteriorRoomWorldBounds.minX;
  const roomHeightTiles = shopInteriorRoomWorldBounds.maxY - shopInteriorRoomWorldBounds.minY;
  const scale = Math.max(
    minInteriorScale,
    Math.min(
      maxInteriorScale,
      Math.floor(Math.min((screenWidth * 0.7) / roomWidthTiles, (screenHeight * 0.62) / roomHeightTiles)),
    ),
  );
  const floorTop = Math.round(Math.max(42, (screenHeight - roomHeightTiles * scale) * 0.42));

  return {
    originX: Math.round(screenWidth / 2),
    originY: floorTop - shopInteriorRoomWorldBounds.minY * scale,
    scale,
  };
}

export function shopInteriorScreenLayout(screenWidth: number, screenHeight: number): ShopInteriorScreenLayout {
  const viewport = createShopInteriorViewport(screenWidth, screenHeight);
  const floor = screenBoundsForWorldBounds(viewport, shopInteriorRoomWorldBounds);
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
    counter: screenBoundsForWorldBounds(viewport, { minX: -1.55, minY: 2.28, maxX: 1.55, maxY: 2.76 }),
    leftShelf: screenBoundsForWorldBounds(viewport, { minX: -2.08, minY: 1.5, maxX: -0.28, maxY: 1.92 }),
    rightShelf: screenBoundsForWorldBounds(viewport, { minX: 0.28, minY: 1.5, maxX: 2.08, maxY: 1.92 }),
    seedBins: screenBoundsForWorldBounds(viewport, { minX: -1.95, minY: 3.12, maxX: -0.72, maxY: 3.78 }),
    upgradeDisplay: screenBoundsForWorldBounds(viewport, { minX: 1.02, minY: 3.08, maxX: 1.92, maxY: 3.78 }),
    rug: screenBoundsForWorldBounds(viewport, { minX: -0.58, minY: 3.48, maxX: 0.58, maxY: 4.12 }),
    crate: screenBoundsForWorldBounds(viewport, { minX: -2.08, minY: 3.84, maxX: -1.48, maxY: 4.36 }),
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
