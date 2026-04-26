import { normalizeTypedWord } from '../core/typing';

export type TargetWordRole =
  | 'approach-house'
  | 'enter-house'
  | 'exit-outside'
  | 'exit-farm'
  | 'ship-bin'
  | 'seed-source'
  | 'plant-crop'
  | 'water-crop'
  | 'harvest-crop'
  | 'inspect-crop';

export type TargetWordCategory = 'place' | 'object' | 'crop-action';

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
    description: 'Interior label that exits the farmhouse to the farm.',
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
    words: ['seeds', 'packet', 'crate', 'shop'],
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
  'ship-bin',
  'seed-source',
  'plant-crop',
  'water-crop',
  'harvest-crop',
  'inspect-crop',
];
