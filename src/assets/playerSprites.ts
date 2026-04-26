export interface SpriteFrameDefinition {
  frame: {
    x: number;
    y: number;
    w: number;
    h: number;
  };
  anchor: {
    x: number;
    y: number;
  };
}

export const playerSpriteSheet = {
  image: 'player_base_v001.png',
  size: { w: 128, h: 40 },
  cell: { w: 32, h: 40 },
  frames: {
    player_idle_down: {
      frame: { x: 0, y: 0, w: 32, h: 40 },
      anchor: { x: 0.5, y: 0.82 },
    },
    player_walk_down_1: {
      frame: { x: 32, y: 0, w: 32, h: 40 },
      anchor: { x: 0.5, y: 0.82 },
    },
    player_walk_down_2: {
      frame: { x: 64, y: 0, w: 32, h: 40 },
      anchor: { x: 0.5, y: 0.82 },
    },
    player_idle_up: {
      frame: { x: 96, y: 0, w: 32, h: 40 },
      anchor: { x: 0.5, y: 0.82 },
    },
  } satisfies Record<string, SpriteFrameDefinition>,
} as const;

export type PlayerSpriteFrameId = keyof typeof playerSpriteSheet.frames;

export function playerSpriteSource(): string {
  return `${runtimeAssetBaseUrl()}assets/sprites/${playerSpriteSheet.image}`;
}

function runtimeAssetBaseUrl(): string {
  const baseUrl = import.meta.env.BASE_URL || '/';

  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
}
