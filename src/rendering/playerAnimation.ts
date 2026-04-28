import type { PlayerSpriteFrameId } from '../assets/playerSprites';
import type { FarmState } from '../core/gameState';
import type { WorldPoint, WorldTargetAction } from '../core/worldTargets';

export type PlayerDirection = 'down' | 'up' | 'left' | 'right';

const idleFrames = {
  down: 'player_idle_down',
  up: 'player_idle_up',
  left: 'player_idle_left',
  right: 'player_idle_right',
} as const satisfies Record<PlayerDirection, PlayerSpriteFrameId>;

const walkFrames = {
  down: ['player_walk_down_1', 'player_walk_down_2'],
  up: ['player_walk_up_1', 'player_walk_up_2'],
  left: ['player_walk_left_1', 'player_walk_left_2'],
  right: ['player_walk_right_1', 'player_walk_right_2'],
} as const satisfies Record<PlayerDirection, readonly [PlayerSpriteFrameId, PlayerSpriteFrameId]>;

export function playerFrameForMotion(
  direction: PlayerDirection,
  moving: boolean,
  animationSeconds: number,
): PlayerSpriteFrameId {
  if (!moving) {
    return idleFrames[direction];
  }

  const frames = walkFrames[direction];
  const frameIndex = Math.floor(Math.max(0, animationSeconds) * 5) % frames.length;

  return frames[frameIndex];
}

export function playerDirectionForMovement(
  origin: WorldPoint,
  destination: WorldPoint,
  fallback: PlayerDirection = 'down',
): PlayerDirection {
  const deltaX = destination.x - origin.x;
  const deltaY = destination.y - origin.y;

  if (Math.abs(deltaX) < 0.001 && Math.abs(deltaY) < 0.001) {
    return fallback;
  }

  if (Math.abs(deltaX) > Math.abs(deltaY)) {
    return deltaX < 0 ? 'left' : 'right';
  }

  return deltaY < 0 ? 'up' : 'down';
}

export function playerDirectionForState(state: Pick<FarmState, 'pendingAction' | 'player'>, fallback: PlayerDirection): PlayerDirection {
  const nextPoint = state.pendingAction?.path[0] ?? state.pendingAction?.destination;

  return nextPoint ? playerDirectionForMovement(state.player, nextPoint, fallback) : fallback;
}

export function playerDirectionAfterCompletedAction(
  action: WorldTargetAction,
  fallback: PlayerDirection,
): PlayerDirection {
  if (action.kind === 'enter-house' || action.kind === 'enter-shop') {
    return 'up';
  }

  if (action.kind === 'exit-house' || action.kind === 'exit-shop') {
    return 'down';
  }

  return fallback;
}
