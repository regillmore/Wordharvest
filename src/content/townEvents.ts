import { normalizeTypedWord } from '../core/typing';
import { wordsForTargetRole } from './targetWords';

const townEventIds = ['springMarketDay'] as const;

export type TownEventId = (typeof townEventIds)[number];

export interface TownEventDefinition {
  id: TownEventId;
  title: string;
  word: string;
  intervalDays: number;
  rewardCoins: number;
  prompt: string;
  joinedLog: string;
}

export interface TownEventProgress {
  attendedKeys: string[];
}

export interface TownEventAttendanceUpdate {
  progress: TownEventProgress;
  newlyAttended: boolean;
}

export interface TownEventCatalogValidationResult {
  ok: boolean;
  errors: string[];
}

export const townEventCatalog = [
  {
    id: 'springMarketDay',
    title: 'Spring Market Day',
    word: 'festival',
    intervalDays: 7,
    rewardCoins: 10,
    prompt: 'Mira sets out a seed-swap table and a lantern line by the town path.',
    joinedLog: "Joined Spring Market Day. Mira sends you home with 10 coins for tomorrow's seeds.",
  },
] as const satisfies readonly TownEventDefinition[];

export function createTownEventProgress(): TownEventProgress {
  return {
    attendedKeys: [],
  };
}

export function normalizeTownEventProgress(value: unknown): TownEventProgress {
  if (!isRecord(value) || !Array.isArray(value.attendedKeys)) {
    return createTownEventProgress();
  }

  return {
    attendedKeys: [...new Set(value.attendedKeys.filter(isTownEventKey))],
  };
}

export function townEventForDay(day: number): TownEventDefinition | null {
  const safeDay = safeEventDay(day);

  return townEventCatalog.find((event) => safeDay % event.intervalDays === 0) ?? null;
}

export function isTownEventAttended(day: number, progress: TownEventProgress): boolean {
  const event = townEventForDay(day);

  if (!event) {
    return false;
  }

  return normalizeTownEventProgress(progress).attendedKeys.includes(townEventKey(day, event.id));
}

export function markTownEventAttended(
  day: number,
  progress: TownEventProgress,
): TownEventAttendanceUpdate {
  const event = townEventForDay(day);
  const normalizedProgress = normalizeTownEventProgress(progress);

  if (!event) {
    return {
      progress: normalizedProgress,
      newlyAttended: false,
    };
  }

  const key = townEventKey(day, event.id);

  if (normalizedProgress.attendedKeys.includes(key)) {
    return {
      progress: normalizedProgress,
      newlyAttended: false,
    };
  }

  return {
    progress: {
      attendedKeys: [...normalizedProgress.attendedKeys, key],
    },
    newlyAttended: true,
  };
}

export function townEventProgressText(day: number, progress: TownEventProgress): string {
  const event = townEventForDay(day);

  if (event) {
    const status = isTownEventAttended(day, progress) ? 'done' : 'open';

    return `Event: ${event.title} ${status} (+${event.rewardCoins} coins)`;
  }

  const days = daysUntilNextTownEvent(day);
  const dayText = days === 1 ? 'day' : 'days';

  return `Event: ${townEventCatalog[0].title} in ${days} ${dayText}`;
}

export function townEventDetailText(day: number, progress: TownEventProgress): string {
  const event = townEventForDay(day);

  if (!event) {
    const days = daysUntilNextTownEvent(day);
    const dayText = days === 1 ? 'day' : 'days';

    return `Town event: ${townEventCatalog[0].title} arrives in ${days} ${dayText}.`;
  }

  const status = isTownEventAttended(day, progress) ? 'done' : 'open';

  return `Town event: ${event.title}. ${event.prompt} Type ${event.word} in town to join. Status: ${status}. Reward: ${event.rewardCoins} coins.`;
}

export function townEventDawnText(day: number, progress: TownEventProgress): string {
  const event = townEventForDay(day);

  if (!event) {
    const days = daysUntilNextTownEvent(day);
    const dayText = days === 1 ? 'day' : 'days';

    return `Event: ${townEventCatalog[0].title} arrives in ${days} ${dayText}.`;
  }

  if (isTownEventAttended(day, progress)) {
    return `Event: ${event.title} is already in your journal.`;
  }

  return `Event: ${event.title} is in town. Type ${event.word} in town to join. Reward: ${event.rewardCoins} coins.`;
}

export function townEventJoinLog(event: TownEventDefinition): string {
  return event.joinedLog;
}

export function validateTownEventCatalog(): TownEventCatalogValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<TownEventId>();
  const eventWords = new Set(wordsForTargetRole('town-event'));

  for (const event of townEventCatalog) {
    if (seenIds.has(event.id)) {
      errors.push(`Duplicate town event id: ${event.id}`);
    }
    seenIds.add(event.id);

    if (!event.title || !event.prompt || !event.joinedLog) {
      errors.push(`Town event ${event.id} is missing display text.`);
    }

    if (event.word !== normalizeTypedWord(event.word) || !eventWords.has(event.word)) {
      errors.push(`Town event ${event.id} word must come from town-event target words.`);
    }

    if (!Number.isInteger(event.intervalDays) || event.intervalDays <= 0) {
      errors.push(`Town event ${event.id} must have a positive interval.`);
    }

    if (!Number.isInteger(event.rewardCoins) || event.rewardCoins < 0) {
      errors.push(`Town event ${event.id} must have a non-negative reward.`);
    }
  }

  for (const requiredEvent of townEventIds) {
    if (!seenIds.has(requiredEvent)) {
      errors.push(`Missing town event id: ${requiredEvent}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function daysUntilNextTownEvent(day: number): number {
  const safeDay = safeEventDay(day);
  const nextEventDay = townEventCatalog[0].intervalDays;
  const remainder = safeDay % nextEventDay;

  return remainder === 0 ? 0 : nextEventDay - remainder;
}

function townEventKey(day: number, eventId: TownEventId): string {
  return `${safeEventDay(day)}:${eventId}`;
}

function isTownEventKey(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const [day, eventId] = value.split(':');

  return Boolean(day && Number.isInteger(Number(day)) && Number(day) >= 1 && isTownEventId(eventId));
}

function isTownEventId(value: unknown): value is TownEventId {
  return typeof value === 'string' && townEventIds.includes(value as TownEventId);
}

function safeEventDay(day: number): number {
  return Number.isFinite(day) ? Math.max(1, Math.floor(day)) : 1;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
