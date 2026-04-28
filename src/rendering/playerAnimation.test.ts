import { describe, expect, it } from 'vitest';
import { playerSpriteSheet } from '../assets/playerSprites';
import { playerDirectionForMovement, playerDirectionForState, playerFrameForMotion } from './playerAnimation';

describe('player animation', () => {
  it('chooses four-direction movement from world deltas', () => {
    expect(playerDirectionForMovement({ x: 0, y: 0 }, { x: 1, y: 0 })).toBe('right');
    expect(playerDirectionForMovement({ x: 0, y: 0 }, { x: -1, y: 0 })).toBe('left');
    expect(playerDirectionForMovement({ x: 0, y: 0 }, { x: 0, y: 1 })).toBe('down');
    expect(playerDirectionForMovement({ x: 0, y: 0 }, { x: 0, y: -1 })).toBe('up');
    expect(playerDirectionForMovement({ x: 2, y: 2 }, { x: 2, y: 2 }, 'left')).toBe('left');
  });

  it('uses the next queued path point for pending movement direction', () => {
    expect(
      playerDirectionForState(
        {
          player: { x: 0, y: 5 },
          pendingAction: {
            word: 'house',
            label: 'house',
            destination: { x: 0, y: 1.7 },
            path: [{ x: 0, y: 4 }],
            action: { kind: 'approach-house', destination: { x: 0, y: 1.7 } },
          },
        },
        'down',
      ),
    ).toBe('up');
  });

  it('returns runtime sprite frames for idle and walking states', () => {
    const frameIds = new Set(Object.keys(playerSpriteSheet.frames));

    expect(playerFrameForMotion('down', false, 0)).toBe('player_idle_down');
    expect(playerFrameForMotion('up', false, 0)).toBe('player_idle_up');
    expect(playerFrameForMotion('left', false, 0)).toBe('player_idle_left');
    expect(playerFrameForMotion('right', false, 0)).toBe('player_idle_right');
    expect(playerFrameForMotion('right', true, 0)).toBe('player_walk_right_1');
    expect(playerFrameForMotion('right', true, 0.24)).toBe('player_walk_right_2');

    for (const direction of ['down', 'up', 'left', 'right'] as const) {
      expect(frameIds.has(playerFrameForMotion(direction, false, 0))).toBe(true);
      expect(frameIds.has(playerFrameForMotion(direction, true, 0))).toBe(true);
      expect(frameIds.has(playerFrameForMotion(direction, true, 0.24))).toBe(true);
    }
  });
});
