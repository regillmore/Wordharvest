import { normalizeTypedWord } from '../core/typing';

export type TargetWordRole =
  | 'approach-house'
  | 'enter-house'
  | 'exit-outside'
  | 'exit-farm'
  | 'enter-town'
  | 'town-shop'
  | 'talk-villager'
  | 'daily-request'
  | 'request-board'
  | 'town-event'
  | 'open-journal'
  | 'open-inventory'
  | 'open-options'
  | 'ship-bin'
  | 'seed-source'
  | 'plant-crop'
  | 'water-crop'
  | 'harvest-crop'
  | 'inspect-crop';

export type TargetWordCategory = 'place' | 'object' | 'person' | 'menu' | 'crop-action';

export interface TargetWordDefinition {
  role: TargetWordRole;
  category: TargetWordCategory;
  words: readonly string[];
  description: string;
}

export interface TargetWordValidationResult {
  ok: boolean;
  errors: string[];
}

export const targetWordCatalog = [
  {
    role: 'approach-house',
    category: 'place',
    words: ['house'],
    description: 'Distant farmhouse label that walks the player close enough to see specific farmhouse targets.',
  },
  {
    role: 'enter-house',
    category: 'object',
    words: ['door'],
    description: 'Nearby farmhouse door label that enters the house.',
  },
  {
    role: 'exit-outside',
    category: 'place',
    words: ['outside'],
    description: 'Interior label that exits the farmhouse to the yard.',
  },
  {
    role: 'exit-farm',
    category: 'place',
    words: ['farm'],
    description: 'Contextual label that returns from an interior or neighboring area to the farm.',
  },
  {
    role: 'enter-town',
    category: 'place',
    words: ['town'],
    description: 'Farm boundary label that follows the south path toward the town edge.',
  },
  {
    role: 'town-shop',
    category: 'place',
    words: ['shop', 'store', 'market'],
    description: 'Town shop label for entering or inspecting shop services.',
  },
  {
    role: 'talk-villager',
    category: 'person',
    words: ['hello', 'chat', 'greet', 'neighbor'],
    description: 'Villager label for starting a nearby conversation.',
  },
  {
    role: 'daily-request',
    category: 'person',
    words: ['favor', 'errand', 'order', 'delivery'],
    description: 'Villager request labels for delivering the current daily crop request.',
  },
  {
    role: 'request-board',
    category: 'object',
    words: ['board', 'notice', 'bulletin'],
    description: 'Town request board label for reading the current delivery note.',
  },
  {
    role: 'town-event',
    category: 'place',
    words: ['festival', 'fair', 'gala'],
    description: 'Town event label for joining the current weekly gathering.',
  },
  {
    role: 'open-journal',
    category: 'menu',
    words: ['journal', 'notes', 'quests'],
    description: 'Menu label for checking farm progress and current goals.',
  },
  {
    role: 'open-inventory',
    category: 'menu',
    words: ['pack', 'inventory', 'items'],
    description: 'Menu label for checking carried seeds and harvested crops.',
  },
  {
    role: 'open-options',
    category: 'menu',
    words: ['options', 'settings', 'audio'],
    description: 'Menu label for checking available settings controls.',
  },
  {
    role: 'ship-bin',
    category: 'object',
    words: ['bin'],
    description: 'Shipping bin label that sells inventory contents.',
  },
  {
    role: 'seed-source',
    category: 'object',
    words: ['seeds', 'packet', 'crate', 'sack'],
    description: 'Seed source label that buys a small packet of turnip seeds.',
  },
  {
    role: 'plant-crop',
    category: 'crop-action',
    words: ['seed', 'plant', 'sow', 'crop', 'turnip'],
    description: 'Words assigned to empty nearby plots that can receive seeds.',
  },
  {
    role: 'water-crop',
    category: 'crop-action',
    words: ['water', 'sprinkle', 'splash', 'drench', 'douse', 'soak'],
    description: 'Words assigned across nearby planted crops that need water.',
  },
  {
    role: 'harvest-crop',
    category: 'crop-action',
    words: ['pick', 'reap', 'gather', 'pluck', 'harvest'],
    description: 'Words assigned across nearby ripe crops.',
  },
  {
    role: 'inspect-crop',
    category: 'crop-action',
    words: ['look', 'check', 'watch', 'tend', 'visit'],
    description: 'Words assigned to nearby crop plots that can only be inspected.',
  },
] as const satisfies readonly TargetWordDefinition[];

const targetWordsByRole = new Map<TargetWordRole, TargetWordDefinition>(
  targetWordCatalog.map((definition) => [definition.role, definition]),
);

export function wordsForTargetRole(role: TargetWordRole): readonly string[] {
  return targetWordDefinition(role).words;
}

export function primaryWordForTargetRole(role: TargetWordRole): string {
  return wordsForTargetRole(role)[0] ?? role;
}

export function nextWordForTargetRole(
  role: TargetWordRole,
  roleWordIndexes: Partial<Record<TargetWordRole, number>>,
): string {
  const words = wordsForTargetRole(role);
  const index = roleWordIndexes[role] ?? 0;
  roleWordIndexes[role] = index + 1;

  return words[index % words.length] ?? role;
}

export function validateTargetWordCatalog(): TargetWordValidationResult {
  const errors: string[] = [];
  const seenRoles = new Set<TargetWordRole>();
  const seenWords = new Map<string, TargetWordRole>();

  for (const definition of targetWordCatalog) {
    const words: readonly string[] = definition.words;

    if (seenRoles.has(definition.role)) {
      errors.push(`Duplicate target word role: ${definition.role}`);
    }
    seenRoles.add(definition.role);

    if (words.length === 0) {
      errors.push(`Target word role has no words: ${definition.role}`);
    }

    for (const word of words) {
      const normalizedWord = normalizeTypedWord(word);

      if (word !== normalizedWord) {
        errors.push(`Target word must already be normalized: ${definition.role}:${word}`);
      }

      if (!normalizedWord) {
        errors.push(`Target word cannot be empty: ${definition.role}`);
        continue;
      }

      const firstRole = seenWords.get(normalizedWord);
      if (firstRole) {
        errors.push(`Duplicate target word "${normalizedWord}" in ${firstRole} and ${definition.role}`);
      }
      seenWords.set(normalizedWord, definition.role);
    }
  }

  for (const role of requiredTargetWordRoles) {
    if (!seenRoles.has(role)) {
      errors.push(`Missing required target word role: ${role}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

function targetWordDefinition(role: TargetWordRole): TargetWordDefinition {
  const definition = targetWordsByRole.get(role);

  if (!definition) {
    throw new Error(`Missing target word definition: ${role}`);
  }

  return definition;
}

const requiredTargetWordRoles: readonly TargetWordRole[] = [
  'approach-house',
  'enter-house',
  'exit-outside',
  'exit-farm',
  'enter-town',
  'town-shop',
  'talk-villager',
  'daily-request',
  'request-board',
  'town-event',
  'open-journal',
  'open-inventory',
  'open-options',
  'ship-bin',
  'seed-source',
  'plant-crop',
  'water-crop',
  'harvest-crop',
  'inspect-crop',
];
