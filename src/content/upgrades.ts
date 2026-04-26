import { normalizeTypedWord } from '../core/typing';

const upgradeIds = ['wateringCan'] as const;

export type UpgradeId = (typeof upgradeIds)[number];
export type UpgradeFlags = Record<UpgradeId, boolean>;

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  shopWord: string;
  cost: number;
  description: string;
  purchasedLog: string;
  ownedLog: string;
}

export interface UpgradeCatalogValidationResult {
  ok: boolean;
  errors: string[];
}

export const upgradeCatalog = [
  {
    id: 'wateringCan',
    name: 'Tin watering can',
    shopWord: 'can',
    cost: 12,
    description: 'Watering no longer costs stamina.',
    purchasedLog: 'Bought the tin watering can for 12 coins.',
    ownedLog: 'The tin watering can is already yours.',
  },
] as const satisfies readonly UpgradeDefinition[];

const upgradesById = new Map<UpgradeId, UpgradeDefinition>(upgradeCatalog.map((definition) => [definition.id, definition]));

export function upgradeDefinition(upgradeId: UpgradeId): UpgradeDefinition {
  const definition = upgradesById.get(upgradeId);

  if (!definition) {
    throw new Error(`Missing upgrade definition: ${upgradeId}`);
  }

  return definition;
}

export function shopWordForUpgrade(upgradeId: UpgradeId): string {
  return upgradeDefinition(upgradeId).shopWord;
}

export function isUpgradeId(value: unknown): value is UpgradeId {
  return typeof value === 'string' && upgradeIds.includes(value as UpgradeId);
}

export function emptyUpgradeFlags(): UpgradeFlags {
  return Object.fromEntries(upgradeCatalog.map((definition) => [definition.id, false])) as UpgradeFlags;
}

export function validateUpgradeCatalog(): UpgradeCatalogValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<UpgradeId>();
  const seenShopWords = new Map<string, UpgradeId>();

  for (const upgrade of upgradeCatalog) {
    const definition: UpgradeDefinition = upgrade;

    if (seenIds.has(definition.id)) {
      errors.push(`Duplicate upgrade id: ${definition.id}`);
    }
    seenIds.add(definition.id);

    if (!definition.name || !definition.description || !definition.purchasedLog || !definition.ownedLog) {
      errors.push(`Upgrade ${definition.id} is missing display text.`);
    }

    if (!Number.isInteger(definition.cost) || definition.cost <= 0) {
      errors.push(`Upgrade ${definition.id} must have a positive integer cost.`);
    }

    const normalizedWord = normalizeTypedWord(definition.shopWord);
    if (definition.shopWord !== normalizedWord || !normalizedWord) {
      errors.push(`Upgrade ${definition.id} shop word must be normalized.`);
    }

    const firstUpgrade = seenShopWords.get(normalizedWord);
    if (firstUpgrade) {
      errors.push(`Duplicate upgrade shop word "${normalizedWord}" in ${firstUpgrade} and ${definition.id}.`);
    }
    seenShopWords.set(normalizedWord, definition.id);
  }

  for (const requiredUpgrade of requiredUpgradeIds) {
    if (!seenIds.has(requiredUpgrade)) {
      errors.push(`Missing required upgrade id: ${requiredUpgrade}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

const requiredUpgradeIds: readonly UpgradeId[] = ['wateringCan'];
