export const springSeasonFinalDay = 28;

export function seasonProgressText(day: number): string {
  const safeDay = safeSeasonDay(day);

  if (safeDay <= springSeasonFinalDay) {
    return `Spring: day ${safeDay}/${springSeasonFinalDay}`;
  }

  return `Spring complete: post-season day ${safeDay - springSeasonFinalDay}`;
}

export function seasonDawnText(day: number): string {
  const safeDay = safeSeasonDay(day);

  if (safeDay === springSeasonFinalDay) {
    return 'Season: Last day of spring. Ship final crops, visit town, or tuck the farm into a good stopping place.';
  }

  if (safeDay === springSeasonFinalDay + 1) {
    return 'Season complete: Spring rolls into a gentle post-season. Keep farming, shipping, and finishing Market Encore.';
  }

  return '';
}

export function isFirstSeasonComplete(day: number): boolean {
  return safeSeasonDay(day) > springSeasonFinalDay;
}

function safeSeasonDay(day: number): number {
  return Number.isFinite(day) ? Math.max(1, Math.floor(day)) : 1;
}
