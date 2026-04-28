export interface SleepTransition {
  elapsedSeconds: number;
  durationSeconds: number;
}

export interface SleepTransitionFrame {
  nightAlpha: number;
  dawnAlpha: number;
  wakeLift: number;
}

export const sleepTransitionDurationSeconds = 2.6;

export function createSleepTransition(): SleepTransition {
  return {
    elapsedSeconds: 0,
    durationSeconds: sleepTransitionDurationSeconds,
  };
}

export function advanceSleepTransition(
  transition: SleepTransition,
  deltaSeconds: number,
): SleepTransition | null {
  const elapsedSeconds = Math.min(
    transition.durationSeconds,
    transition.elapsedSeconds + Math.max(0, deltaSeconds),
  );

  return elapsedSeconds >= transition.durationSeconds
    ? null
    : {
        ...transition,
        elapsedSeconds,
      };
}

export function sleepTransitionFrame(transition: SleepTransition): SleepTransitionFrame {
  const progress = clamp01(transition.elapsedSeconds / transition.durationSeconds);
  const nightAlpha =
    progress < 0.34
      ? interpolate(0, 0.96, progress / 0.34)
      : progress < 0.5
        ? 0.96
        : interpolate(0.96, 0, (progress - 0.5) / 0.38);
  const dawnAlpha =
    progress < 0.48
      ? 0
      : progress < 0.72
        ? interpolate(0, 0.28, (progress - 0.48) / 0.24)
        : interpolate(0.28, 0, (progress - 0.72) / 0.28);
  const wakeLift = progress < 0.52 ? 0 : Math.sin(clamp01((progress - 0.52) / 0.34) * Math.PI);

  return {
    nightAlpha: clamp01(nightAlpha),
    dawnAlpha: clamp01(dawnAlpha),
    wakeLift: clamp01(wakeLift),
  };
}

function interpolate(start: number, end: number, progress: number): number {
  return start + (end - start) * clamp01(progress);
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
