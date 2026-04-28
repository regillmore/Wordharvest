import { describe, expect, it } from 'vitest';
import { isFirstSeasonComplete, seasonDawnText, seasonProgressText } from './seasons';

describe('season progress', () => {
  it('summarizes spring progress and post-season days', () => {
    expect(seasonProgressText(1)).toBe('Spring: day 1/28');
    expect(seasonProgressText(28)).toBe('Spring: day 28/28');
    expect(seasonProgressText(29)).toBe('Spring complete: post-season day 1');
    expect(seasonProgressText(Number.NaN)).toBe('Spring: day 1/28');
  });

  it('surfaces the first season ending beat at dawn', () => {
    expect(seasonDawnText(27)).toBe('');
    expect(seasonDawnText(28)).toBe(
      'Season: Last day of spring. Ship final crops, visit town, or tuck the farm into a good stopping place.',
    );
    expect(seasonDawnText(29)).toBe(
      'Season complete: Spring rolls into a gentle post-season. Keep farming, shipping, and finishing Market Encore.',
    );
  });

  it('identifies the post-season continuation window', () => {
    expect(isFirstSeasonComplete(28)).toBe(false);
    expect(isFirstSeasonComplete(29)).toBe(true);
  });
});
