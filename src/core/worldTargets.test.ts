import { describe, expect, it } from 'vitest';
import { createFarmState, type FarmState } from './gameState';
import { listWorldTargets } from './worldTargets';

describe('world targets', () => {
  it('shows house from range and door only when near the farmhouse', () => {
    const distant = createFarmState();
    expect(listWorldTargets(distant).map((target) => target.word)).toContain('house');
    expect(listWorldTargets(distant).map((target) => target.word)).not.toContain('door');

    const nearby: FarmState = {
      ...distant,
      player: { x: 0, y: 1.7 },
    };

    expect(listWorldTargets(nearby).map((target) => target.word)).toContain('door');
    expect(listWorldTargets(nearby).map((target) => target.word)).not.toContain('house');
  });

  it('assigns synonyms across multiple nearby crops with the same action', () => {
    const state: FarmState = {
      ...createFarmState(),
      plots: createFarmState().plots.map((plot) =>
        plot.id === 4 || plot.id === 5
          ? { ...plot, crop: 'turnip', stage: 'seed', wateredToday: false, growth: 0 }
          : plot,
      ),
    };

    const words = listWorldTargets(state).map((target) => target.word);

    expect(words).toContain('water');
    expect(words).toContain('sprinkle');
  });
});
