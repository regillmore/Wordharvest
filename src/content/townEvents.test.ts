import { describe, expect, it } from 'vitest';
import {
  createTownEventProgress,
  isTownEventAttended,
  markTownEventAttended,
  normalizeTownEventProgress,
  townEventCatalog,
  townEventDawnText,
  townEventDetailText,
  townEventForDay,
  townEventJoinLog,
  townEventProgressText,
  validateTownEventCatalog,
} from './townEvents';

describe('town events', () => {
  it('passes catalog validation', () => {
    expect(validateTownEventCatalog()).toEqual({ ok: true, errors: [] });
    expect(townEventCatalog.map((event) => event.word)).toEqual(['festival']);
  });

  it('surfaces the weekly market day on day seven', () => {
    const progress = createTownEventProgress();

    expect(townEventForDay(6)).toBeNull();
    expect(townEventProgressText(1, progress)).toBe('Event: Spring Market Day in 6 days');
    expect(townEventProgressText(7, progress)).toBe('Event: Spring Market Day open (+10 coins)');
    expect(townEventDetailText(7, progress)).toBe(
      'Town event: Spring Market Day. Mira sets out a seed-swap table and a lantern line by the town path. Type festival in town to join. Status: open. Reward: 10 coins.',
    );
    expect(townEventDawnText(7, progress)).toBe(
      'Event: Spring Market Day is in town. Type festival in town to join. Reward: 10 coins.',
    );
  });

  it('tracks one attendance per event day', () => {
    let progress = createTownEventProgress();
    const update = markTownEventAttended(7, progress);
    progress = update.progress;

    expect(update.newlyAttended).toBe(true);
    expect(isTownEventAttended(7, progress)).toBe(true);
    expect(townEventProgressText(7, progress)).toBe('Event: Spring Market Day done (+10 coins)');
    expect(townEventJoinLog(townEventCatalog[0])).toBe(
      "Joined Spring Market Day. Mira sends you home with 10 coins for tomorrow's seeds.",
    );
    expect(markTownEventAttended(7, progress).newlyAttended).toBe(false);
    expect(isTownEventAttended(14, progress)).toBe(false);
  });

  it('normalizes saved event attendance keys', () => {
    expect(
      normalizeTownEventProgress({
        attendedKeys: ['7:springMarketDay', '7:springMarketDay', 'bad', '8:missing'],
      }),
    ).toEqual({
      attendedKeys: ['7:springMarketDay'],
    });
  });
});
