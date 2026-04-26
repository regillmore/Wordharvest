import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { playerSpriteSheet, playerSpriteSource } from './playerSprites';

describe('player sprite assets', () => {
  it('matches the runtime metadata export', () => {
    const rawMetadata = readFileSync(resolve(process.cwd(), 'public/assets/sprites/player_base_v001.json'), 'utf8');
    const metadata = JSON.parse(rawMetadata) as typeof playerSpriteSheet;

    expect(metadata.image).toBe(playerSpriteSheet.image);
    expect(metadata.size).toEqual(playerSpriteSheet.size);
    expect(metadata.cell).toEqual(playerSpriteSheet.cell);
    expect(metadata.frames).toEqual(playerSpriteSheet.frames);
  });

  it('has a transparent png sheet with expected dimensions', () => {
    const path = resolve(process.cwd(), 'public/assets/sprites', playerSpriteSheet.image);
    const bytes = readFileSync(path);

    expect(existsSync(path)).toBe(true);
    expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG');
    expect(bytes.readUInt32BE(16)).toBe(playerSpriteSheet.size.w);
    expect(bytes.readUInt32BE(20)).toBe(playerSpriteSheet.size.h);
    expect(bytes[25]).toBe(6);
    expect(playerSpriteSource()).toBe(`/assets/sprites/${playerSpriteSheet.image}`);
  });
});
