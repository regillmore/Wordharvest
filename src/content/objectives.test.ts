import { describe, expect, it } from 'vitest';
import {
  createObjectiveProgress,
  objectiveCatalog,
  objectiveDefinition,
  objectiveDetailText,
  objectiveProgressText,
  recordObjectiveShipments,
  validateObjectiveCatalog,
} from './objectives';

describe('objective catalog', () => {
  it('passes catalog validation', () => {
    expect(validateObjectiveCatalog()).toEqual({ ok: true, errors: [] });
  });

  it('defines the first Spring objective', () => {
    expect(objectiveCatalog.map((definition) => definition.id)).toEqual(['springBasket']);
    expect(objectiveDefinition('springBasket')).toMatchObject({
      name: 'Spring Basket',
      rewardCoins: 25,
    });
  });

  it('tracks crop shipment progress and completion', () => {
    let progress = createObjectiveProgress();

    expect(objectiveProgressText(progress)).toBe('Spring Basket: 0/3 crops shipped');
    expect(objectiveDetailText(progress)).toBe('Spring Basket: 0/3 crops shipped (turnip 0/1, radish 0/1, carrot 0/1)');

    let update = recordObjectiveShipments(progress, [
      { crop: 'turnip', count: 1 },
      { crop: 'radish', count: 1 },
    ]);
    progress = update.progress;

    expect(update.newlyCompleted).toBe(false);
    expect(objectiveProgressText(progress)).toBe('Spring Basket: 2/3 crops shipped');

    update = recordObjectiveShipments(progress, [{ crop: 'carrot', count: 1 }]);

    expect(update.newlyCompleted).toBe(true);
    expect(update.progress.completed).toBe(true);
    expect(objectiveProgressText(update.progress)).toBe('Spring Basket: complete');
  });
});
