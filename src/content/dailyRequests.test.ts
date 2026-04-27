import { describe, expect, it } from 'vitest';
import {
  createDailyRequestProgress,
  dailyRequestBoardText,
  dailyRequestCatalog,
  dailyRequestDeliveryLog,
  dailyRequestDetailText,
  dailyRequestDawnText,
  dailyRequestForDay,
  dailyRequestMissingLog,
  dailyRequestProgressText,
  isDailyRequestComplete,
  markDailyRequestComplete,
  normalizeDailyRequestProgress,
  validateDailyRequestCatalog,
} from './dailyRequests';

describe('daily requests', () => {
  it('passes catalog validation', () => {
    expect(validateDailyRequestCatalog()).toEqual({ ok: true, errors: [] });
    expect(dailyRequestCatalog.map((request) => request.word)).toEqual(['favor', 'errand', 'order', 'delivery']);
  });

  it('rotates deterministic requests by day', () => {
    expect(dailyRequestForDay(1).id).toBe('pantryTurnip');
    expect(dailyRequestForDay(2).id).toBe('radishCrunch');
    expect(dailyRequestForDay(5).id).toBe('pantryTurnip');
  });

  it('tracks one completion per request day', () => {
    let progress = createDailyRequestProgress();

    expect(dailyRequestProgressText(1, progress)).toBe('Request: Pantry Turnip open (+6 coins)');
    expect(dailyRequestDetailText(1, progress)).toBe(
      'Town request: Mira wants 1 turnip for Pantry Turnip. Type favor in town to deliver. Status: open. Reward: 6 coins.',
    );
    expect(dailyRequestBoardText(1, progress)).toBe(
      'Request board: Pantry Turnip - Mira wants 1 turnip. Type favor near Mira to deliver. Reward: 6 coins.',
    );
    expect(dailyRequestDawnText(2, progress)).toBe(
      'Request: Mira wants 1 radish for Radish Crunch. Type errand in town to deliver. Reward: 8 coins.',
    );

    const update = markDailyRequestComplete(1, progress);
    progress = update.progress;

    expect(update.newlyCompleted).toBe(true);
    expect(isDailyRequestComplete(1, progress)).toBe(true);
    expect(dailyRequestProgressText(1, progress)).toBe('Request: Pantry Turnip done (+6 coins)');
    expect(dailyRequestBoardText(1, progress)).toBe(
      'Request board: Pantry Turnip is complete for today. Tomorrow will bring another note.',
    );
    expect(dailyRequestDeliveryLog(dailyRequestForDay(1))).toBe(
      "Delivered 1 turnip for Mira's Pantry Turnip request. Reward: 6 coins.",
    );
    expect(dailyRequestMissingLog(dailyRequestForDay(1), 0)).toBe(
      "Mira's Pantry Turnip request needs 1 turnip. Your pack has none.",
    );
    expect(markDailyRequestComplete(1, progress).newlyCompleted).toBe(false);
  });

  it('normalizes saved progress keys', () => {
    expect(
      normalizeDailyRequestProgress({
        completedKeys: ['1:pantryTurnip', '1:pantryTurnip', 'bad', '2:missing'],
      }),
    ).toEqual({
      completedKeys: ['1:pantryTurnip'],
    });
  });
});
