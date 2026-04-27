import { cropCatalog, emptyCropCounts, isCropId, type CropId } from '../content/crops';
import {
  evaluateAchievementProgress,
  normalizeAchievementProgress,
} from '../content/achievements';
import {
  markCropsDiscovered,
  markCropsShipped,
  markWordsDiscovered,
  normalizeCollectionLogProgress,
  type CollectionLogProgress,
} from '../content/collectionLog';
import { normalizeObjectiveProgress } from '../content/objectives';
import { normalizeDailyRequestProgress } from '../content/dailyRequests';
import { normalizeTownEventProgress } from '../content/townEvents';
import { emptyUpgradeFlags, upgradeCatalog, type UpgradeFlags } from '../content/upgrades';
import { normalizeWeekGoalProgress } from '../content/weekGoals';
import { forecastForDay, isWeatherId, weatherForDay, type WeatherId } from '../content/weather';
import { createFarmState, type CropPlot, type CropStage, type FarmState, type Inventory, type PlayerLocation } from './gameState';
import { listWorldTargets, type WorldPoint } from './worldTargets';

export const SAVE_SCHEMA_VERSION = 11;

export interface SaveDataV11 {
  schemaVersion: typeof SAVE_SCHEMA_VERSION;
  savedAt: string;
  state: FarmState;
}

export type LoadSaveResult =
  | { ok: true; state: FarmState; savedAt: string; migrated: boolean }
  | { ok: false; error: string };

export function serializeSave(state: FarmState, savedAt = new Date().toISOString()): string {
  const saveData: SaveDataV11 = {
    schemaVersion: SAVE_SCHEMA_VERSION,
    savedAt,
    state: sanitizeStateForSave(state),
  };

  return JSON.stringify(saveData);
}

export function deserializeSave(rawSave: string): LoadSaveResult {
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawSave);
  } catch {
    return { ok: false, error: 'Save data is not valid JSON.' };
  }

  if (!isRecord(parsed)) {
    return { ok: false, error: 'Save data is not an object.' };
  }

  if (parsed.schemaVersion === SAVE_SCHEMA_VERSION) {
    return deserializeV11(parsed);
  }

  if (parsed.schemaVersion === 10) {
    return deserializeV10(parsed);
  }

  if (parsed.schemaVersion === 9) {
    return deserializeV9(parsed);
  }

  if (parsed.schemaVersion === 8) {
    return deserializeV8(parsed);
  }

  if (parsed.schemaVersion === 7) {
    return deserializeV7(parsed);
  }

  if (parsed.schemaVersion === 6) {
    return deserializeV6(parsed);
  }

  if (parsed.schemaVersion === 5) {
    return migrateV5(parsed);
  }

  if (parsed.schemaVersion === 4) {
    return migrateV4(parsed);
  }

  if (parsed.schemaVersion === 3) {
    return migrateV3(parsed);
  }

  if (parsed.schemaVersion === 2) {
    return migrateV2(parsed);
  }

  if (parsed.schemaVersion === 1) {
    return migrateV1(parsed);
  }

  if (parsed.schemaVersion === 0) {
    return migrateV0(parsed);
  }

  return { ok: false, error: 'Save data uses an unsupported schema version.' };
}

export function sanitizeStateForSave(state: FarmState): FarmState {
  const sanitizedState = {
    ...state,
    pendingAction: null,
    seeds: normalizeInventory(state.seeds),
    inventory: normalizeInventory(state.inventory),
    upgrades: normalizeUpgrades(state.upgrades),
    seasonObjective: normalizeObjectiveProgress(state.seasonObjective),
    weekGoals: normalizeWeekGoalProgress(state.weekGoals),
    dailyRequests: normalizeDailyRequestProgress(state.dailyRequests),
    townEvents: normalizeTownEventProgress(state.townEvents),
    collectionLog: normalizeCollectionLogProgress(state.collectionLog),
    achievements: normalizeAchievementProgress(state.achievements),
    plots: state.plots.map((plot) => ({ ...plot, position: { ...plot.position } })),
    player: { ...state.player },
    log: state.log.slice(0, 6),
  };

  const stateWithVisibleWords = {
    ...sanitizedState,
    collectionLog: markWordsDiscovered(
      sanitizedState.collectionLog,
      listWorldTargets(sanitizedState).map((target) => target.word),
    ).progress,
  };

  return {
    ...stateWithVisibleWords,
    achievements: evaluateAchievementProgress(stateWithVisibleWords.achievements, {
      weekGoals: stateWithVisibleWords.weekGoals,
      collectionLog: stateWithVisibleWords.collectionLog,
    }).progress,
  };
}

function deserializeV11(data: Record<string, unknown>): LoadSaveResult {
  if (typeof data.savedAt !== 'string') {
    return { ok: false, error: 'Save data is missing a saved timestamp.' };
  }

  const state = parseFarmState(data.state);
  if (!state) {
    return { ok: false, error: 'Save data has an invalid farm state.' };
  }

  return { ok: true, state, savedAt: data.savedAt, migrated: false };
}

function deserializeV10(data: Record<string, unknown>): LoadSaveResult {
  if (typeof data.savedAt !== 'string') {
    return { ok: false, error: 'Save data is missing a saved timestamp.' };
  }

  const state = parseFarmState(data.state);
  if (!state) {
    return { ok: false, error: 'Save data has an invalid farm state.' };
  }

  return { ok: true, state, savedAt: data.savedAt, migrated: true };
}

function deserializeV9(data: Record<string, unknown>): LoadSaveResult {
  if (typeof data.savedAt !== 'string') {
    return { ok: false, error: 'Save data is missing a saved timestamp.' };
  }

  const state = parseFarmState(data.state);
  if (!state) {
    return { ok: false, error: 'Save data has an invalid farm state.' };
  }

  return { ok: true, state, savedAt: data.savedAt, migrated: true };
}

function deserializeV8(data: Record<string, unknown>): LoadSaveResult {
  if (typeof data.savedAt !== 'string') {
    return { ok: false, error: 'Save data is missing a saved timestamp.' };
  }

  const state = parseFarmState(data.state);
  if (!state) {
    return { ok: false, error: 'Save data has an invalid farm state.' };
  }

  return { ok: true, state, savedAt: data.savedAt, migrated: true };
}

function deserializeV7(data: Record<string, unknown>): LoadSaveResult {
  if (typeof data.savedAt !== 'string') {
    return { ok: false, error: 'Save data is missing a saved timestamp.' };
  }

  const state = parseFarmState(data.state);
  if (!state) {
    return { ok: false, error: 'Save data has an invalid farm state.' };
  }

  return { ok: true, state, savedAt: data.savedAt, migrated: true };
}

function deserializeV6(data: Record<string, unknown>): LoadSaveResult {
  if (typeof data.savedAt !== 'string') {
    return { ok: false, error: 'Save data is missing a saved timestamp.' };
  }

  const state = parseFarmState(data.state);
  if (!state) {
    return { ok: false, error: 'Save data has an invalid farm state.' };
  }

  return { ok: true, state, savedAt: data.savedAt, migrated: true };
}

function migrateV5(data: Record<string, unknown>): LoadSaveResult {
  if (typeof data.savedAt !== 'string') {
    return { ok: false, error: 'Save data is missing a saved timestamp.' };
  }

  const state = parseFarmState(data.state);
  if (!state) {
    return { ok: false, error: 'Save data has an invalid farm state.' };
  }

  return { ok: true, state, savedAt: data.savedAt, migrated: true };
}

function migrateV4(data: Record<string, unknown>): LoadSaveResult {
  if (typeof data.savedAt !== 'string') {
    return { ok: false, error: 'Save data is missing a saved timestamp.' };
  }

  const state = parseFarmState(data.state);
  if (!state) {
    return { ok: false, error: 'Save data has an invalid farm state.' };
  }

  return { ok: true, state, savedAt: data.savedAt, migrated: true };
}

function migrateV3(data: Record<string, unknown>): LoadSaveResult {
  if (typeof data.savedAt !== 'string') {
    return { ok: false, error: 'Save data is missing a saved timestamp.' };
  }

  const state = parseFarmState(data.state);
  if (!state) {
    return { ok: false, error: 'Save data has an invalid farm state.' };
  }

  return { ok: true, state, savedAt: data.savedAt, migrated: true };
}

function migrateV2(data: Record<string, unknown>): LoadSaveResult {
  if (typeof data.savedAt !== 'string') {
    return { ok: false, error: 'Save data is missing a saved timestamp.' };
  }

  const state = parseFarmState(data.state);
  if (!state) {
    return { ok: false, error: 'Save data has an invalid farm state.' };
  }

  return { ok: true, state, savedAt: data.savedAt, migrated: true };
}

function migrateV1(data: Record<string, unknown>): LoadSaveResult {
  if (typeof data.savedAt !== 'string') {
    return { ok: false, error: 'Save data is missing a saved timestamp.' };
  }

  const state = parseFarmState(data.state, createFarmState().seeds);
  if (!state) {
    return { ok: false, error: 'Save data has an invalid farm state.' };
  }

  return { ok: true, state, savedAt: data.savedAt, migrated: true };
}

function migrateV0(data: Record<string, unknown>): LoadSaveResult {
  const base = createFarmState();
  const rawState = isRecord(data.state) ? data.state : data;
  const day = readNumber(rawState.day, base.day);
  const seeds = normalizeInventory(isRecord(rawState.seeds) ? rawState.seeds : base.seeds);
  const inventory = normalizeInventory(isRecord(rawState.inventory) ? rawState.inventory : {});
  const seasonObjective = normalizeObjectiveProgress(rawState.seasonObjective);
  const plots = parsePlots(rawState.plots) ?? base.plots;
  const partialState: FarmState = {
    ...base,
    day,
    coins: readNumber(rawState.coins, base.coins),
    stamina: readNumber(rawState.stamina, base.stamina),
    player: parseWorldPoint(rawState.player) ?? base.player,
    location: parseLocation(rawState.location) ?? base.location,
    weather: parseWeatherId(rawState.weather) ?? weatherForDay(day),
    forecast: parseWeatherId(rawState.forecast) ?? forecastForDay(day),
    pendingAction: null,
    seeds,
    inventory,
    upgrades: normalizeUpgrades(isRecord(rawState.upgrades) ? rawState.upgrades : base.upgrades),
    seasonObjective,
    weekGoals: normalizeWeekGoalProgress(rawState.weekGoals),
    dailyRequests: normalizeDailyRequestProgress(rawState.dailyRequests),
    townEvents: normalizeTownEventProgress(rawState.townEvents),
    collectionLog: inferCollectionLog(base.collectionLog, seeds, inventory, plots, seasonObjective.shipped),
    achievements: normalizeAchievementProgress(rawState.achievements),
    plots,
    log: parseLog(rawState.log) ?? ['Loaded an older Wordharvest save.'],
  };
  const savedAt = typeof data.savedAt === 'string' ? data.savedAt : new Date(0).toISOString();

  return { ok: true, state: sanitizeStateForSave(partialState), savedAt, migrated: true };
}

function parseFarmState(value: unknown, fallbackSeeds: Inventory | null = null): FarmState | null {
  if (!isRecord(value)) {
    return null;
  }

  const plots = parsePlots(value.plots);
  const player = parseWorldPoint(value.player);
  const location = parseLocation(value.location);
  const log = parseLog(value.log);

  if (!plots || !player || !location || !log) {
    return null;
  }

  if (!isFiniteNumber(value.day) || !isFiniteNumber(value.coins) || !isFiniteNumber(value.stamina)) {
    return null;
  }

  const seeds = isRecord(value.seeds) ? normalizeInventory(value.seeds) : fallbackSeeds;
  if (!seeds) {
    return null;
  }

  const day = value.day;
  const inventory = normalizeInventory(isRecord(value.inventory) ? value.inventory : {});
  const seasonObjective = normalizeObjectiveProgress(value.seasonObjective);
  const weekGoals = normalizeWeekGoalProgress(value.weekGoals);
  const collectionLog = inferCollectionLog(
    normalizeCollectionLogProgress(value.collectionLog),
    seeds,
    inventory,
    plots,
    seasonObjective.shipped,
  );

  return sanitizeStateForSave({
    day,
    coins: value.coins,
    stamina: value.stamina,
    player,
    location,
    weather: parseWeatherId(value.weather) ?? weatherForDay(day),
    forecast: parseWeatherId(value.forecast) ?? forecastForDay(day),
    pendingAction: null,
    seeds,
    inventory,
    upgrades: normalizeUpgrades(isRecord(value.upgrades) ? value.upgrades : {}),
    seasonObjective,
    weekGoals,
    dailyRequests: normalizeDailyRequestProgress(value.dailyRequests),
    townEvents: normalizeTownEventProgress(value.townEvents),
    collectionLog,
    achievements: normalizeAchievementProgress(value.achievements),
    plots,
    log,
  });
}

function inferCollectionLog(
  collectionLog: CollectionLogProgress,
  seeds: Inventory,
  inventory: Inventory,
  plots: CropPlot[],
  shipped: Inventory,
): CollectionLogProgress {
  const discoveredCropIds = cropCatalog
    .filter(
      (crop) =>
        seeds[crop.id] > 0 ||
        inventory[crop.id] > 0 ||
        shipped[crop.id] > 0 ||
        plots.some((plot) => plot.crop === crop.id),
    )
    .map((crop) => crop.id);
  const shippedCropIds = cropCatalog.filter((crop) => shipped[crop.id] > 0).map((crop) => crop.id);
  const discoveredUpdate = markCropsDiscovered(collectionLog, discoveredCropIds);

  return markCropsShipped(discoveredUpdate.progress, shippedCropIds).progress;
}

function parsePlots(value: unknown): CropPlot[] | null {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }

  const plots = value.map(parsePlot);

  if (plots.some((plot) => !plot)) {
    return null;
  }

  return plots as CropPlot[];
}

function parsePlot(value: unknown): CropPlot | null {
  if (!isRecord(value)) {
    return null;
  }

  const position = parseWorldPoint(value.position);
  const crop = parseCropId(value.crop);
  const stage = parseCropStage(value.stage);

  if (!isFiniteNumber(value.id) || !position || crop === undefined || !stage) {
    return null;
  }

  return {
    id: value.id,
    position,
    crop,
    stage,
    wateredToday: value.wateredToday === true,
    growth: readNumber(value.growth, 0),
  };
}

function parseWorldPoint(value: unknown): WorldPoint | null {
  if (!isRecord(value) || !isFiniteNumber(value.x) || !isFiniteNumber(value.y)) {
    return null;
  }

  return { x: value.x, y: value.y };
}

function parseLocation(value: unknown): PlayerLocation | null {
  return value === 'farm' || value === 'house' || value === 'town' ? value : null;
}

function parseWeatherId(value: unknown): WeatherId | null {
  return isWeatherId(value) ? value : null;
}

function parseCropId(value: unknown): CropId | null | undefined {
  if (value === null) {
    return null;
  }

  if (isCropId(value)) {
    return value;
  }

  return undefined;
}

function parseCropStage(value: unknown): CropStage | null {
  return value === 'empty' || value === 'seed' || value === 'sprout' || value === 'leaf' || value === 'ripe'
    ? value
    : null;
}

function normalizeInventory(value: Record<string, unknown> | Inventory): Inventory {
  const inventory = emptyCropCounts();

  for (const definition of cropCatalog) {
    inventory[definition.id] = readNumber(value[definition.id], 0);
  }

  return inventory;
}

function normalizeUpgrades(value: Record<string, unknown> | UpgradeFlags): UpgradeFlags {
  const upgrades = emptyUpgradeFlags();

  for (const definition of upgradeCatalog) {
    upgrades[definition.id] = value[definition.id] === true;
  }

  return upgrades;
}

function parseLog(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  return value.filter((entry): entry is string => typeof entry === 'string').slice(0, 6);
}

function readNumber(value: unknown, fallback: number): number {
  return isFiniteNumber(value) ? value : fallback;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
