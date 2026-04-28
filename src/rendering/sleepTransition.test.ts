import { describe, expect, it } from 'vitest';
import {
  advanceSleepTransition,
  createSleepTransition,
  sleepTransitionDurationSeconds,
  sleepTransitionFrame,
} from './sleepTransition';

describe('sleep transition', () => {
  it('fades through night and back into a dawn wake pulse', () => {
    const start = sleepTransitionFrame(createSleepTransition());
    const night = sleepTransitionFrame({
      elapsedSeconds: sleepTransitionDurationSeconds * 0.34,
      durationSeconds: sleepTransitionDurationSeconds,
    });
    const dawn = sleepTransitionFrame({
      elapsedSeconds: sleepTransitionDurationSeconds * 0.68,
      durationSeconds: sleepTransitionDurationSeconds,
    });
    const end = sleepTransitionFrame({
      elapsedSeconds: sleepTransitionDurationSeconds,
      durationSeconds: sleepTransitionDurationSeconds,
    });

    expect(start.nightAlpha).toBe(0);
    expect(night.nightAlpha).toBeGreaterThan(0.9);
    expect(dawn.dawnAlpha).toBeGreaterThan(0);
    expect(dawn.wakeLift).toBeGreaterThan(0);
    expect(end.nightAlpha).toBe(0);
    expect(end.dawnAlpha).toBe(0);
  });

  it('finishes after the authored duration', () => {
    const transition = createSleepTransition();
    const almostDone = advanceSleepTransition(transition, sleepTransitionDurationSeconds - 0.01);

    expect(almostDone).not.toBeNull();
    expect(advanceSleepTransition(transition, sleepTransitionDurationSeconds)).toBeNull();
  });
});
