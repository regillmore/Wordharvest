import { describe, expect, it } from 'vitest';
import { createFarmState } from '../core/gameState';
import { listWorldTargets } from '../core/worldTargets';
import { visibleWorldLabelTargets } from './worldLabels';

describe('world label presentation', () => {
  it('keeps menu words available without drawing them as floating world labels', () => {
    const targets = listWorldTargets(createFarmState());
    const words = targets.map((target) => target.word);
    const visibleWords = visibleWorldLabelTargets(targets).map((target) => target.word);

    expect(words).toEqual(expect.arrayContaining(['journal', 'pack', 'options']));
    expect(visibleWords).toEqual(expect.arrayContaining(['house', 'bin', 'seeds', 'town', 'seed']));
    expect(visibleWords).not.toEqual(expect.arrayContaining(['journal', 'pack', 'options']));
  });
});
