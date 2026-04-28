import type { WorldPoint } from '../core/worldTargets';

export interface Viewport {
  originX: number;
  originY: number;
  scale: number;
}

export function createViewport(width: number, height: number): Viewport {
  return {
    originX: width / 2,
    originY: Math.max(88, height * 0.16),
    scale: Math.max(56, Math.min(92, Math.floor(Math.min(width / 6, height / 6.4)))),
  };
}

export function worldToScreen(viewport: Viewport, point: WorldPoint): WorldPoint {
  return {
    x: viewport.originX + point.x * viewport.scale,
    y: viewport.originY + point.y * viewport.scale,
  };
}
