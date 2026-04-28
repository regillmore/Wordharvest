import { describe, expect, it } from 'vitest';
import {
  nextWordForTargetRole,
  primaryWordForTargetRole,
  targetWordCatalog,
  validateTargetWordCatalog,
  wordsForTargetRole,
  type TargetWordRole,
} from './targetWords';

describe('target word catalog', () => {
  it('passes catalog validation', () => {
    expect(validateTargetWordCatalog()).toEqual({ ok: true, errors: [] });
  });

  it('defines every target word role used by the prototype', () => {
    const roles = targetWordCatalog.map((definition) => definition.role);
    const expectedRoles: TargetWordRole[] = [
      'approach-house',
      'enter-house',
      'exit-outside',
      'exit-farm',
      'sleep-bed',
      'enter-town',
      'town-shop',
      'talk-villager',
      'daily-request',
      'request-board',
      'town-event',
      'open-journal',
      'open-inventory',
      'open-options',
      'ship-bin',
      'seed-source',
      'plant-crop',
      'water-crop',
      'harvest-crop',
      'inspect-crop',
    ];

    expect(roles).toEqual(expectedRoles);
  });

  it('returns primary words for single target labels', () => {
    expect(primaryWordForTargetRole('approach-house')).toBe('house');
    expect(primaryWordForTargetRole('enter-house')).toBe('door');
    expect(primaryWordForTargetRole('sleep-bed')).toBe('sleep');
    expect(primaryWordForTargetRole('enter-town')).toBe('town');
    expect(primaryWordForTargetRole('town-shop')).toBe('shop');
    expect(primaryWordForTargetRole('talk-villager')).toBe('hello');
    expect(primaryWordForTargetRole('daily-request')).toBe('favor');
    expect(primaryWordForTargetRole('request-board')).toBe('board');
    expect(primaryWordForTargetRole('town-event')).toBe('festival');
    expect(primaryWordForTargetRole('open-journal')).toBe('journal');
    expect(primaryWordForTargetRole('ship-bin')).toBe('bin');
    expect(primaryWordForTargetRole('seed-source')).toBe('seeds');
  });

  it('cycles role word families for repeated nearby actions', () => {
    const indexes = {};

    expect(nextWordForTargetRole('water-crop', indexes)).toBe('water');
    expect(nextWordForTargetRole('water-crop', indexes)).toBe('sprinkle');
    expect(wordsForTargetRole('water-crop')).toContain('douse');
    expect(wordsForTargetRole('sleep-bed')).toContain('bed');
  });
});
