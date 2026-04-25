import { describe, expect, it } from 'vitest';
import { normalizeTypedWord, parseTypedCommand, scoreWordProgress } from './typing';

describe('typing controls', () => {
  it('normalizes typed words for command parsing', () => {
    expect(normalizeTypedWord(' Water! ')).toBe('water');
  });

  it('parses farm action aliases', () => {
    expect(parseTypedCommand('seed')).toEqual({ kind: 'farm', verb: 'plant', source: 'seed' });
    expect(parseTypedCommand('pick')).toEqual({ kind: 'farm', verb: 'harvest', source: 'pick' });
  });

  it('parses movement words', () => {
    expect(parseTypedCommand('left')).toEqual({ kind: 'move', direction: 'west', source: 'left' });
  });

  it('scores prefix progress toward a target word', () => {
    expect(scoreWordProgress('harvest', 'har')).toBeCloseTo(3 / 7);
    expect(scoreWordProgress('harvest', 'hut')).toBeCloseTo(1 / 7);
  });
});
