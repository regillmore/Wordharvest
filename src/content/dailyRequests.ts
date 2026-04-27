import { normalizeTypedWord } from '../core/typing';
import { cropDefinition, isCropId, type CropId } from './crops';
import { wordsForTargetRole } from './targetWords';

const dailyRequestIds = ['pantryTurnip', 'radishCrunch', 'carrotBundle', 'peaSnack'] as const;

export type DailyRequestId = (typeof dailyRequestIds)[number];

export interface DailyRequestDefinition {
  id: DailyRequestId;
  title: string;
  requester: string;
  crop: CropId;
  count: number;
  rewardCoins: number;
  word: string;
  prompt: string;
}

export interface DailyRequestProgress {
  completedKeys: string[];
}

export interface DailyRequestCompletionUpdate {
  progress: DailyRequestProgress;
  newlyCompleted: boolean;
}

export interface DailyRequestCatalogValidationResult {
  ok: boolean;
  errors: string[];
}

export const dailyRequestCatalog = [
  {
    id: 'pantryTurnip',
    title: 'Pantry Turnip',
    requester: 'Mira',
    crop: 'turnip',
    count: 1,
    rewardCoins: 6,
    word: 'favor',
    prompt: 'A turnip would round out the soup pot.',
  },
  {
    id: 'radishCrunch',
    title: 'Radish Crunch',
    requester: 'Mira',
    crop: 'radish',
    count: 1,
    rewardCoins: 8,
    word: 'errand',
    prompt: 'A radish adds a bright bite to the market lunch.',
  },
  {
    id: 'carrotBundle',
    title: 'Carrot Bundle',
    requester: 'Mira',
    crop: 'carrot',
    count: 1,
    rewardCoins: 8,
    word: 'order',
    prompt: 'A carrot bundle would help stock the front basket.',
  },
  {
    id: 'peaSnack',
    title: 'Pea Snack',
    requester: 'Mira',
    crop: 'pea',
    count: 1,
    rewardCoins: 10,
    word: 'delivery',
    prompt: 'Snap peas are perfect for a quick town snack.',
  },
] as const satisfies readonly DailyRequestDefinition[];

export function createDailyRequestProgress(): DailyRequestProgress {
  return {
    completedKeys: [],
  };
}

export function normalizeDailyRequestProgress(value: unknown): DailyRequestProgress {
  if (!isRecord(value) || !Array.isArray(value.completedKeys)) {
    return createDailyRequestProgress();
  }

  return {
    completedKeys: [...new Set(value.completedKeys.filter(isDailyRequestKey))],
  };
}

export function dailyRequestForDay(day: number): DailyRequestDefinition {
  const safeDay = Number.isFinite(day) ? Math.max(1, Math.floor(day)) : 1;
  const index = (safeDay - 1) % dailyRequestCatalog.length;

  return dailyRequestCatalog[index] ?? dailyRequestCatalog[0];
}

export function isDailyRequestComplete(day: number, progress: DailyRequestProgress): boolean {
  const key = dailyRequestKey(day, dailyRequestForDay(day).id);

  return normalizeDailyRequestProgress(progress).completedKeys.includes(key);
}

export function markDailyRequestComplete(
  day: number,
  progress: DailyRequestProgress,
): DailyRequestCompletionUpdate {
  const normalizedProgress = normalizeDailyRequestProgress(progress);
  const key = dailyRequestKey(day, dailyRequestForDay(day).id);

  if (normalizedProgress.completedKeys.includes(key)) {
    return {
      progress: normalizedProgress,
      newlyCompleted: false,
    };
  }

  return {
    progress: {
      completedKeys: [...normalizedProgress.completedKeys, key],
    },
    newlyCompleted: true,
  };
}

export function dailyRequestProgressText(day: number, progress: DailyRequestProgress): string {
  const request = dailyRequestForDay(day);
  const status = isDailyRequestComplete(day, progress) ? 'done' : 'open';

  return `Request: ${request.title} ${status} (+${request.rewardCoins} coins)`;
}

export function dailyRequestDetailText(day: number, progress: DailyRequestProgress): string {
  const request = dailyRequestForDay(day);
  const status = isDailyRequestComplete(day, progress) ? 'done' : 'open';

  return `Town request: ${request.requester} wants ${requestCropText(request)} for ${request.title}. Type ${request.word} in town to deliver. Status: ${status}. Reward: ${request.rewardCoins} coins.`;
}

export function dailyRequestBoardText(day: number, progress: DailyRequestProgress): string {
  const request = dailyRequestForDay(day);

  if (isDailyRequestComplete(day, progress)) {
    return `Request board: ${request.title} is complete for today. Tomorrow will bring another note.`;
  }

  return `Request board: ${request.title} - ${request.requester} wants ${requestCropText(request)}. Type ${request.word} near ${request.requester} to deliver. Reward: ${request.rewardCoins} coins.`;
}

export function dailyRequestDawnText(day: number, progress: DailyRequestProgress): string {
  const request = dailyRequestForDay(day);

  if (isDailyRequestComplete(day, progress)) {
    return `Request: ${request.title} is already complete.`;
  }

  return `Request: ${request.requester} wants ${requestCropText(request)} for ${request.title}. Type ${request.word} in town to deliver. Reward: ${request.rewardCoins} coins.`;
}

export function dailyRequestDeliveryLog(request: DailyRequestDefinition): string {
  return `Delivered ${requestCropText(request)} for ${request.requester}'s ${request.title} request. Reward: ${request.rewardCoins} coins.`;
}

export function dailyRequestMissingLog(request: DailyRequestDefinition, availableCount: number): string {
  return `${request.requester}'s ${request.title} request needs ${requestCropText(request)}. Your pack has ${heldCropText(request.crop, availableCount)}.`;
}

export function validateDailyRequestCatalog(): DailyRequestCatalogValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<DailyRequestId>();
  const seenWords = new Set<string>();
  const requestWords = new Set(wordsForTargetRole('daily-request'));

  for (const request of dailyRequestCatalog) {
    if (seenIds.has(request.id)) {
      errors.push(`Duplicate daily request id: ${request.id}`);
    }
    seenIds.add(request.id);

    if (!request.title || !request.requester || !request.prompt) {
      errors.push(`Daily request ${request.id} is missing display text.`);
    }

    if (!isCropId(request.crop)) {
      errors.push(`Daily request ${request.id} has an unknown crop: ${request.crop}`);
    }

    if (!Number.isInteger(request.count) || request.count <= 0) {
      errors.push(`Daily request ${request.id} must require a positive crop count.`);
    }

    if (!Number.isInteger(request.rewardCoins) || request.rewardCoins < 0) {
      errors.push(`Daily request ${request.id} must have a non-negative integer reward.`);
    }

    const normalizedWord = normalizeTypedWord(request.word);

    if (request.word !== normalizedWord || !requestWords.has(request.word)) {
      errors.push(`Daily request ${request.id} word must come from the daily-request target words.`);
    }

    if (seenWords.has(request.word)) {
      errors.push(`Duplicate daily request word: ${request.word}`);
    }
    seenWords.add(request.word);
  }

  for (const requiredRequest of dailyRequestIds) {
    if (!seenIds.has(requiredRequest)) {
      errors.push(`Missing daily request id: ${requiredRequest}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function dailyRequestKey(day: number, requestId: DailyRequestId): string {
  const safeDay = Number.isFinite(day) ? Math.max(1, Math.floor(day)) : 1;

  return `${safeDay}:${requestId}`;
}

function isDailyRequestKey(value: unknown): value is string {
  if (typeof value !== 'string') {
    return false;
  }

  const [day, requestId] = value.split(':');

  return Boolean(day && Number.isInteger(Number(day)) && Number(day) >= 1 && isDailyRequestId(requestId));
}

function isDailyRequestId(value: unknown): value is DailyRequestId {
  return typeof value === 'string' && dailyRequestIds.includes(value as DailyRequestId);
}

function requestCropText(request: Pick<DailyRequestDefinition, 'crop' | 'count'>): string {
  const crop = cropDefinition(request.crop);

  return `${request.count} ${request.count === 1 ? crop.name : crop.pluralName}`;
}

function heldCropText(cropId: CropId, count: number): string {
  if (count <= 0) {
    return 'none';
  }

  const crop = cropDefinition(cropId);

  return `${count} ${count === 1 ? crop.name : crop.pluralName}`;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
