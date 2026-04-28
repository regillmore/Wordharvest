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
  size: { w: 384, h: 40 },
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
    player_walk_up_1: {
      frame: { x: 128, y: 0, w: 32, h: 40 },
      anchor: { x: 0.5, y: 0.82 },
    },
    player_walk_up_2: {
      frame: { x: 160, y: 0, w: 32, h: 40 },
      anchor: { x: 0.5, y: 0.82 },
    },
    player_idle_left: {
      frame: { x: 192, y: 0, w: 32, h: 40 },
      anchor: { x: 0.5, y: 0.82 },
    },
    player_walk_left_1: {
      frame: { x: 224, y: 0, w: 32, h: 40 },
      anchor: { x: 0.5, y: 0.82 },
    },
    player_walk_left_2: {
      frame: { x: 256, y: 0, w: 32, h: 40 },
      anchor: { x: 0.5, y: 0.82 },
    },
    player_idle_right: {
      frame: { x: 288, y: 0, w: 32, h: 40 },
      anchor: { x: 0.5, y: 0.82 },
    },
    player_walk_right_1: {
      frame: { x: 320, y: 0, w: 32, h: 40 },
      anchor: { x: 0.5, y: 0.82 },
    },
    player_walk_right_2: {
      frame: { x: 352, y: 0, w: 32, h: 40 },
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
