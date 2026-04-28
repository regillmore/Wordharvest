import {
  achievementCatalog,
  achievementDetailText,
  achievementUnlockLog,
  createAchievementProgress,
  evaluateAchievementProgress,
  type AchievementProgress,
  type AchievementSnapshot,
} from '../content/achievements';
import {
  cropCatalog,
  cropCountsWith,
  cropDefinition,
  emptyCropCounts,
  shopWordForCrop,
  stageForCropGrowth,
  starterCropId,
  type CropDefinition,
  type CropCounts,
  type CropGrowthStage,
  type CropId,
} from '../content/crops';
import {
  collectionDetailText,
  createCollectionLogProgress,
  markCropsDiscovered,
  markCropsShipped,
  markWordsDiscovered,
  markWordsUsed,
  type CollectionLogProgress,
} from '../content/collectionLog';
import {
  followUpGoalCompletionLog,
  followUpGoalDetailText,
  isFollowUpGoalComplete,
  postSpringBasketFollowUpGoal,
} from '../content/followUpGoals';
import {
  createDailyRequestProgress,
  dailyRequestBoardText,
  dailyRequestDawnText,
  dailyRequestDeliveryLog,
  dailyRequestDetailText,
  dailyRequestForDay,
  dailyRequestMissingLog,
  isDailyRequestComplete,
  markDailyRequestComplete,
  type DailyRequestProgress,
} from '../content/dailyRequests';
import {
  emptyUpgradeFlags,
  shopWordForUpgrade,
  upgradeCatalog,
  upgradeDefinition,
  type UpgradeFlags,
  type UpgradeId,
} from '../content/upgrades';
import {
  createTownEventProgress,
  isTownEventAttended,
  markTownEventAttended,
  townEventDawnText,
  townEventDetailText,
  townEventForDay,
  townEventJoinLog,
  type TownEventProgress,
} from '../content/townEvents';
import {
  createObjectiveProgress,
  objectiveDefinition,
  objectiveDetailText,
  recordObjectiveShipments,
  type ObjectiveProgress,
} from '../content/objectives';
import { seasonDawnText } from '../content/seasons';
import {
  emptyWeekGoalProgress,
  weekGoalCompletionLog,
  markWeekGoalComplete,
  weekGoalDawnText,
  weekGoalDefinition,
  weekGoalDetailText,
  type WeekGoalId,
  type WeekGoalProgress,
} from '../content/weekGoals';
import { forecastForDay, weatherDefinition, weatherForDay, type WeatherId } from '../content/weather';
import { findFarmPath } from '../world/pathfinding';
import { normalizeTypedWord } from './typing';
import {
  destinationForWorldTarget,
  farmReturnPosition,
  houseWakePosition,
  isPlayerInBed,
  listWorldTargets,
  resolveWorldTarget,
  townArrivalPosition,
  type WorldPoint,
  type WorldTargetAction,
} from './worldTargets';

export type CropStage = 'empty' | CropGrowthStage;
export type PlayerLocation = 'farm' | 'house' | 'town';

export type Inventory = CropCounts;

export interface CropPlot {
  id: number;
  position: WorldPoint;
  crop: CropId | null;
  stage: CropStage;
  wateredToday: boolean;
  growth: number;
}

export interface PendingWorldAction {
  word: string;
  label: string;
  destination: WorldPoint;
  path: WorldPoint[];
  action: WorldTargetAction;
}

export interface FarmState {
  day: number;
  coins: number;
  stamina: number;
  player: WorldPoint;
  location: PlayerLocation;
  weather: WeatherId;
  forecast: WeatherId;
  pendingAction: PendingWorldAction | null;
  seeds: Inventory;
  inventory: Inventory;
  upgrades: UpgradeFlags;
  seasonObjective: ObjectiveProgress;
  weekGoals: WeekGoalProgress;
  dailyRequests: DailyRequestProgress;
  townEvents: TownEventProgress;
  collectionLog: CollectionLogProgress;
  achievements: AchievementProgress;
  plots: CropPlot[];
  log: string[];
}

const startingPlots = 6;
const maxLogEntries = 6;
const walkSpeed = 2.4;
const startingPlayerPosition: WorldPoint = { x: 0, y: 5 };
const startingDay = 1;

export function createFarmState(): FarmState {
  return discoverVisibleWords({
    day: startingDay,
    coins: 25,
    stamina: 10,
    player: startingPlayerPosition,
    location: 'farm',
    weather: weatherForDay(startingDay),
    forecast: forecastForDay(startingDay),
    pendingAction: null,
    seeds: cropCountsWith(starterCropId, cropDefinition(starterCropId).seedPacketQuantity),
    inventory: emptyCropCounts(),
    upgrades: emptyUpgradeFlags(),
    seasonObjective: createObjectiveProgress(),
    weekGoals: emptyWeekGoalProgress(),
    dailyRequests: createDailyRequestProgress(),
    townEvents: createTownEventProgress(),
    collectionLog: createCollectionLogProgress(),
    achievements: createAchievementProgress(),
    plots: Array.from({ length: startingPlots }, (_, index) => ({
      id: index + 1,
      position: {
        x: (index % 3) - 1,
        y: 3 + Math.floor(index / 3),
      },
      crop: null,
      stage: 'empty',
      wateredToday: false,
      growth: 0,
    })),
    log: ['A quiet morning begins. Type a visible word hovering in the world.'],
  });
}

export function applyTypedWord(state: FarmState, word: string): FarmState {
  const source = normalizeTypedWord(word);

  if (state.pendingAction) {
    return withLog(state, `Finish walking to ${state.pendingAction.label} first.`);
  }

  const target = resolveWorldTarget(state, source);

  if (!source) {
    return withLog(state, 'No word entered.');
  }

  if (!target) {
    return withLog(state, `No visible target named "${source}".`);
  }

  const action = target.action;
  const destination = destinationForWorldTarget(target);
  const pathResult = findFarmPath(state.player, destination);

  if (!pathResult.ok) {
    return withLog(state, `No clear path to ${target.label}.`);
  }

  const stateWithUsedWord = markWordUsed(state, target.word);

  if (pathResult.path.length === 0) {
    return discoverVisibleWords(completeWorldAction(
      {
        ...stateWithUsedWord,
        player: destination,
        pendingAction: null,
      },
      action,
    ));
  }

  return withLog(
    {
      ...stateWithUsedWord,
      pendingAction: {
        word: target.word,
        label: target.label,
        destination,
        path: pathResult.path,
        action,
      },
    },
    `Heading toward ${target.label}.`,
  );
}

export function advanceFarmTime(state: FarmState, deltaSeconds: number): FarmState {
  if (!state.pendingAction || deltaSeconds <= 0) {
    return state;
  }

  const nextWaypoint = state.pendingAction.path[0];

  if (!nextWaypoint) {
    return completePendingAction(state);
  }

  const nextPlayer = moveToward(state.player, nextWaypoint, walkSpeed * deltaSeconds);
  const arrived = pointsEqual(nextPlayer, nextWaypoint);
  const movedState = {
    ...state,
    player: nextPlayer,
  };

  if (!arrived) {
    return movedState;
  }

  const pendingAction = {
    ...state.pendingAction,
    path: state.pendingAction.path.slice(1),
  };
  const nextState = {
    ...movedState,
    pendingAction,
  };

  return pendingAction.path.length === 0 ? completePendingAction(nextState) : nextState;
}

export function completePendingAction(state: FarmState): FarmState {
  if (!state.pendingAction) {
    return state;
  }

  const pendingAction = state.pendingAction;

  return discoverVisibleWords(completeWorldAction(
    {
      ...state,
      player: pendingAction.destination,
      pendingAction: null,
    },
    pendingAction.action,
  ));
}

function completeWorldAction(state: FarmState, action: WorldTargetAction): FarmState {
  if (action.kind === 'approach-house') {
    return withLog(
      {
        ...state,
        player: action.destination,
        location: 'farm',
      },
      'Walked up the path toward the farmhouse.',
    );
  }

  if (action.kind === 'enter-house') {
    return withLog(
      {
        ...state,
        location: 'house',
        player: { x: 0, y: 2.2 },
      },
      'Opened the farmhouse door and stepped inside.',
    );
  }

  if (action.kind === 'exit-house') {
    return withLog(
      {
        ...state,
        location: 'farm',
        player: action.destination,
      },
      'Stepped back into the farmyard.',
    );
  }

  if (action.kind === 'enter-bed') {
    return withLog(
      {
        ...state,
        location: 'house',
        player: action.destination,
      },
      'Settled into bed. Type sleep to end the day, or rise to get back up.',
    );
  }

  if (action.kind === 'sleep-bed') {
    return sleepInFarmhouseBed(state);
  }

  if (action.kind === 'leave-bed') {
    return withLog(
      {
        ...state,
        location: 'house',
        player: action.destination,
      },
      'Got back out of bed.',
    );
  }

  if (action.kind === 'enter-town') {
    return withLog(
      {
        ...state,
        location: 'town',
        player: townArrivalPosition,
      },
      'Followed the south path toward town.',
    );
  }

  if (action.kind === 'return-farm') {
    return withLog(
      {
        ...state,
        location: 'farm',
        player: farmReturnPosition,
      },
      'Walked back up the lane to the farm.',
    );
  }

  if (action.kind === 'ship-inventory') {
    return shipInventory(state);
  }

  if (action.kind === 'buy-seeds') {
    return buySeeds(state, action.crop);
  }

  if (action.kind === 'buy-upgrade') {
    return buyUpgrade(state, action.upgrade);
  }

  if (action.kind === 'visit-shop') {
    return withActionLogs(state, [`The shop shelf is open: ${shopWordSummary(state)}.`], ['visitTownShop']);
  }

  if (action.kind === 'talk-villager') {
    return withLog(state, 'Mira says hello and asks how the turnips are growing.');
  }

  if (action.kind === 'read-request-board') {
    return withLog(state, dailyRequestBoardText(state.day, state.dailyRequests));
  }

  if (action.kind === 'join-town-event') {
    return joinTownEvent(state);
  }

  if (action.kind === 'complete-daily-request') {
    return completeDailyRequest(state);
  }

  if (action.kind === 'open-menu') {
    return withLog(state, describeMenu(state, action.menu));
  }

  const plot = state.plots.find((candidate) => candidate.id === action.plotId);
  if (!plot) {
    return withLog(state, 'That target is no longer available.');
  }

  if (action.kind === 'plant-plot') {
    if (plot.crop) {
      return withLog(state, 'That plot already has a crop.');
    }

    const crop = cropDefinition(action.crop);

    if (state.seeds[action.crop] <= 0) {
      return withLog(state, `No ${crop.seedName} in your bag.`);
    }

    return updatePlot(
      state,
      { ...plot, crop: action.crop, stage: 'seed', wateredToday: false, growth: 0 },
      {
        seeds: {
          ...state.seeds,
          [action.crop]: state.seeds[action.crop] - 1,
        },
        collectionLog: markCropsDiscovered(state.collectionLog, [action.crop]).progress,
        stamina: Math.max(0, state.stamina - 1),
        player: plot.position,
      },
      `Planted ${crop.seedName}.`,
      ['plantFirstSeeds'],
    );
  }

  if (action.kind === 'water-plot') {
    if (!plot.crop) {
      return withLog(state, 'Water splashes onto empty soil.');
    }

    if (plot.wateredToday) {
      return withLog(state, 'This crop is already watered.');
    }

    return updatePlot(
      state,
      { ...plot, wateredToday: true },
      { stamina: Math.max(0, state.stamina - wateringStaminaCost(state)), player: plot.position },
      'The watering can sings against the soil.',
      ['waterFirstCrop'],
    );
  }

  if (action.kind === 'harvest-plot') {
    if (!plot.crop || plot.stage !== 'ripe') {
      return withLog(state, 'Nothing is ripe here yet.');
    }

    const crop = cropDefinition(plot.crop);

    return updatePlot(
      state,
      { ...plot, crop: null, stage: 'empty', wateredToday: false, growth: 0 },
      {
        inventory: {
          ...state.inventory,
          [crop.id]: state.inventory[crop.id] + 1,
        },
        collectionLog: markCropsDiscovered(state.collectionLog, [crop.id]).progress,
        player: plot.position,
      },
      crop.harvestMessage,
    );
  }

  return withLog({ ...state, player: plot.position }, describePlot(plot));
}

export function advanceDay(state: FarmState): FarmState {
  if (state.pendingAction) {
    return withLog(state, `Finish walking to ${state.pendingAction.label} before sleeping.`);
  }

  return advanceToNextDawn(state, { location: 'farm' });
}

export function sleepInFarmhouseBed(state: FarmState): FarmState {
  if (state.pendingAction) {
    return withLog(state, `Finish walking to ${state.pendingAction.label} before sleeping.`);
  }

  if (state.location !== 'house' || !isPlayerInBed(state.player)) {
    return withLog(state, 'Get into bed before sleeping.');
  }

  const tuckedInState = withLog(
    {
      ...state,
      location: 'house',
    },
    'Slept in the farmhouse bed.',
  );

  return advanceToNextDawn(tuckedInState, {
    location: 'house',
    player: houseWakePosition,
  });
}

function advanceToNextDawn(
  state: FarmState,
  wakePatch: Partial<Pick<FarmState, 'location' | 'player'>>,
): FarmState {
  const nextDay = state.day + 1;
  const weather = state.forecast;
  const forecast = forecastForDay(nextDay);
  const grownPlots = state.plots.map((plot) => {
    if (!plot.crop) {
      return { ...plot, wateredToday: false };
    }

    const growth = plot.wateredToday ? plot.growth + 1 : plot.growth;
    return {
      ...plot,
      growth,
      wateredToday: false,
      stage: stageForCropGrowth(plot.crop, growth),
    };
  });
  const plots = applyDawnWeather(grownPlots, weather);

  return discoverVisibleWords(withLog(
    {
      ...state,
      ...wakePatch,
      day: nextDay,
      stamina: 10,
      weather,
      forecast,
      plots,
    },
    dawnLogText(nextDay, weather, forecast, state),
  ));
}

export function addFarmLog(state: FarmState, message: string): FarmState {
  return withLog(state, message);
}

export function seedInventorySummary(state: Pick<FarmState, 'seeds'>): string {
  return cropCountSummary(state.seeds, 'no seeds', (crop, count) => {
    const seedName = count === 1 ? singularItemName(crop.seedName) : crop.seedName;

    return `${count} ${seedName}`;
  });
}

export function cropInventorySummary(state: Pick<FarmState, 'inventory'>): string {
  return cropCountSummary(state.inventory, 'no harvested crops', (crop, count) => {
    const cropName = count === 1 ? crop.name : crop.pluralName;

    return `${count} ${cropName}`;
  });
}

export function packInventorySummary(
  state: Pick<FarmState, 'seeds' | 'inventory' | 'collectionLog' | 'achievements'>,
): string {
  return `Pack: Seeds: ${seedInventorySummary(state)}. Crops: ${cropInventorySummary(state)}. ${collectionDetailText(state.collectionLog)} ${achievementDetailText(state.achievements)}`;
}

function discoverVisibleWords(state: FarmState): FarmState {
  const visibleWords = listWorldTargets(state).map((target) => target.word);

  return unlockAchievements({
    ...state,
    collectionLog: markWordsDiscovered(state.collectionLog, visibleWords).progress,
  });
}

function markWordUsed(state: FarmState, word: string): FarmState {
  return {
    ...state,
    collectionLog: markWordsUsed(state.collectionLog, [word]).progress,
  };
}

function updatePlot(
  state: FarmState,
  updatedPlot: CropPlot,
  patch: Partial<Pick<FarmState, 'coins' | 'stamina' | 'player' | 'seeds' | 'inventory' | 'collectionLog'>>,
  message: string,
  completedGoals: readonly WeekGoalId[] = [],
): FarmState {
  return withActionLogs(
    {
      ...state,
      ...patch,
      plots: state.plots.map((plot) => (plot.id === updatedPlot.id ? updatedPlot : plot)),
    },
    [message],
    completedGoals,
  );
}

function buySeeds(state: FarmState, cropId: CropId): FarmState {
  const crop = cropDefinition(cropId);

  if (state.coins < crop.seedPacketPrice) {
    return withLog(state, `${capitalize(crop.seedName)} cost ${crop.seedPacketPrice} coins.`);
  }

  return withActionLogs(
    {
      ...state,
      coins: state.coins - crop.seedPacketPrice,
      seeds: {
        ...state.seeds,
        [crop.id]: state.seeds[crop.id] + crop.seedPacketQuantity,
      },
      collectionLog: markCropsDiscovered(state.collectionLog, [crop.id]).progress,
    },
    [`Bought ${crop.seedPacketQuantity} ${crop.seedName} for ${crop.seedPacketPrice} coins.`],
    cropId === starterCropId ? [] : ['buySpringSeeds'],
  );
}

function buyUpgrade(state: FarmState, upgradeId: UpgradeId): FarmState {
  const upgrade = upgradeDefinition(upgradeId);

  if (state.upgrades[upgrade.id]) {
    return withLog(state, upgrade.ownedLog);
  }

  if (state.coins < upgrade.cost) {
    return withLog(state, `${upgrade.name} costs ${upgrade.cost} coins.`);
  }

  return withActionLogs(
    {
      ...state,
      coins: state.coins - upgrade.cost,
      upgrades: {
        ...state.upgrades,
        [upgrade.id]: true,
      },
    },
    [upgrade.purchasedLog],
    upgradeId === 'wateringCan' ? ['buyTinCan'] : [],
  );
}

function shipInventory(state: FarmState): FarmState {
  const shipments = Object.entries(state.inventory)
    .map(([cropId, count]) => ({
      crop: cropDefinition(cropId as CropId),
      count,
    }))
    .filter((shipment) => shipment.count > 0);

  if (shipments.length === 0) {
    return withLog(state, 'The shipping bin is empty.');
  }

  const coinsEarned = shipments.reduce((sum, shipment) => sum + shipment.count * shipment.crop.sellPrice, 0);
  const objectiveUpdate = recordObjectiveShipments(
    state.seasonObjective,
    shipments.map((shipment) => ({ crop: shipment.crop.id, count: shipment.count })),
  );
  const objectiveReward = objectiveUpdate.newlyCompleted
    ? objectiveDefinition(objectiveUpdate.progress.id).rewardCoins
    : 0;
  const collectionUpdate = markCropsShipped(
    state.collectionLog,
    shipments.map((shipment) => shipment.crop.id),
  );
  const followUpReward =
    objectiveUpdate.progress.completed &&
    !isFollowUpGoalComplete(state.collectionLog) &&
    isFollowUpGoalComplete(collectionUpdate.progress)
      ? postSpringBasketFollowUpGoal.rewardCoins
      : 0;
  const shippedInventory = {
    ...state.inventory,
  };

  for (const shipment of shipments) {
    shippedInventory[shipment.crop.id] = 0;
  }

  const shipmentLog = `Shipped ${shipmentSummary(shipments)} for ${coinsEarned} coins.`;
  const completedGoals: WeekGoalId[] = ['shipFirstCrop'];

  if (objectiveUpdate.progress.completed) {
    completedGoals.push('completeSpringBasket');
  }

  const completionLogs = [
    ...(objectiveUpdate.newlyCompleted ? [objectiveDefinition(objectiveUpdate.progress.id).completedLog] : []),
    ...(followUpReward > 0 ? [followUpGoalCompletionLog()] : []),
  ];

  return withActionLogs(
    {
      ...state,
      coins: state.coins + coinsEarned + objectiveReward + followUpReward,
      inventory: shippedInventory,
      seasonObjective: objectiveUpdate.progress,
      collectionLog: collectionUpdate.progress,
    },
    [...completionLogs, shipmentLog],
    completedGoals,
  );
}

function completeDailyRequest(state: FarmState): FarmState {
  const request = dailyRequestForDay(state.day);

  if (isDailyRequestComplete(state.day, state.dailyRequests)) {
    return withLog(state, `${request.title} is already complete.`);
  }

  if (state.inventory[request.crop] < request.count) {
    return withLog(state, dailyRequestMissingLog(request, state.inventory[request.crop]));
  }

  const requestUpdate = markDailyRequestComplete(state.day, state.dailyRequests);

  return withLog(
    {
      ...state,
      coins: state.coins + request.rewardCoins,
      inventory: {
        ...state.inventory,
        [request.crop]: state.inventory[request.crop] - request.count,
      },
      dailyRequests: requestUpdate.progress,
    },
    dailyRequestDeliveryLog(request),
  );
}

function joinTownEvent(state: FarmState): FarmState {
  const event = townEventForDay(state.day);

  if (!event) {
    return withLog(state, 'There is no town event today.');
  }

  if (isTownEventAttended(state.day, state.townEvents)) {
    return withLog(state, `${event.title} is already tucked into your journal.`);
  }

  const attendance = markTownEventAttended(state.day, state.townEvents);

  return withLog(
    {
      ...state,
      coins: state.coins + event.rewardCoins,
      townEvents: attendance.progress,
    },
    townEventJoinLog(event),
  );
}

function describeMenu(state: FarmState, menu: 'journal' | 'inventory' | 'options'): string {
  const starterCrop = cropDefinition(starterCropId);

  if (menu === 'journal') {
    const weather = weatherDefinition(state.weather);
    const forecast = weatherDefinition(state.forecast);
    const can = state.upgrades.wateringCan ? 'tin can' : 'basic can';
    const followUpDetail = state.seasonObjective.completed ? ` ${followUpGoalDetailText(state.collectionLog)}` : '';

    return `Journal: Day ${state.day}, ${weather.name} today, ${forecast.forecastLabel} tomorrow, ${state.coins} coins, ${state.seeds[starterCrop.id]} ${starterCrop.seedName}, ${can}. ${objectiveDetailText(state.seasonObjective)}.${followUpDetail} ${weekGoalDetailText(state.day, state.weekGoals)} ${dailyRequestDetailText(state.day, state.dailyRequests)} ${townEventDetailText(state.day, state.townEvents)} ${achievementDetailText(state.achievements)}`;
  }

  if (menu === 'inventory') {
    return packInventorySummary(state);
  }

  return 'Options: audio, save, load, and reset controls are on the HUD.';
}

function moveToward(origin: WorldPoint, destination: WorldPoint, distance: number): WorldPoint {
  const offsetX = destination.x - origin.x;
  const offsetY = destination.y - origin.y;
  const remainingDistance = Math.hypot(offsetX, offsetY);

  if (remainingDistance <= distance || remainingDistance === 0) {
    return destination;
  }

  const ratio = distance / remainingDistance;
  return {
    x: origin.x + offsetX * ratio,
    y: origin.y + offsetY * ratio,
  };
}

function pointsEqual(left: WorldPoint, right: WorldPoint): boolean {
  return left.x === right.x && left.y === right.y;
}

function withLog(state: FarmState, message: string): FarmState {
  return withLogs(state, [message]);
}

function withActionLogs(
  state: FarmState,
  messages: readonly string[],
  completedGoals: readonly WeekGoalId[],
): FarmState {
  let nextState = state;
  const goalMessages: string[] = [];

  for (const goalId of completedGoals) {
    const update = markWeekGoalComplete(nextState.weekGoals, goalId);
    nextState = {
      ...nextState,
      weekGoals: update.progress,
    };

    if (update.newlyCompleted) {
      nextState = {
        ...nextState,
        coins: nextState.coins + weekGoalDefinition(goalId).rewardCoins,
      };
      goalMessages.push(weekGoalCompletionLog(goalId));
    }
  }

  return withLogs(nextState, [...messages, ...goalMessages]);
}

function withLogs(state: FarmState, messages: readonly string[]): FarmState {
  const nextState = unlockAchievements(state);

  return {
    ...nextState,
    log: [...messages, ...achievementLogsSince(state, nextState), ...state.log].slice(0, maxLogEntries),
  };
}

function unlockAchievements(state: FarmState): FarmState {
  const update = evaluateAchievementProgress(state.achievements, achievementSnapshot(state));

  return {
    ...state,
    achievements: update.progress,
  };
}

function achievementLogsSince(previousState: FarmState, nextState: FarmState): string[] {
  const previousIds = new Set(previousState.achievements.unlockedIds);
  const nextIds = new Set(nextState.achievements.unlockedIds);

  return achievementCatalog
    .filter((achievement) => nextIds.has(achievement.id) && !previousIds.has(achievement.id))
    .map(achievementUnlockLog);
}

function achievementSnapshot(state: Pick<FarmState, 'weekGoals' | 'collectionLog'>): AchievementSnapshot {
  return {
    weekGoals: state.weekGoals,
    collectionLog: state.collectionLog,
  };
}

function describePlot(plot: CropPlot): string {
  if (!plot.crop) {
    return `Plot ${plot.id} is empty.`;
  }

  return `Plot ${plot.id} holds a ${plot.stage} ${cropDefinition(plot.crop).name}.`;
}

function shipmentSummary(shipments: Array<{ crop: ReturnType<typeof cropDefinition>; count: number }>): string {
  return shipments
    .map((shipment) => `${shipment.count} ${shipment.count === 1 ? shipment.crop.name : shipment.crop.pluralName}`)
    .join(' and ');
}

function cropCountSummary(
  counts: CropCounts,
  emptyText: string,
  formatItem: (crop: CropDefinition, count: number) => string,
): string {
  const entries: Array<{ crop: CropDefinition; count: number }> = cropCatalog
    .map((crop) => ({
      crop,
      count: counts[crop.id],
    }))
    .filter((entry) => entry.count > 0);

  return entries.length > 0 ? entries.map((entry) => formatItem(entry.crop, entry.count)).join(', ') : emptyText;
}

function singularItemName(name: string): string {
  return name.endsWith('s') ? name.slice(0, -1) : name;
}

function shopWordSummary(state: FarmState): string {
  const words = cropCatalog.map((crop) => shopWordForCrop(crop.id));
  const upgradeWords = upgradeCatalog
    .filter((upgrade) => !state.upgrades[upgrade.id])
    .map((upgrade) => shopWordForUpgrade(upgrade.id));
  const shopWords = [...words, ...upgradeWords];

  if (shopWords.length <= 1) {
    return shopWords.join('');
  }

  return `${shopWords.slice(0, -1).join(', ')}, or ${shopWords[shopWords.length - 1]}`;
}

function wateringStaminaCost(state: FarmState): number {
  return state.upgrades.wateringCan ? 0 : 1;
}

function applyDawnWeather(plots: CropPlot[], weather: WeatherId): CropPlot[] {
  if (!weatherDefinition(weather).watersCrops) {
    return plots;
  }

  return plots.map((plot) => ({
    ...plot,
    wateredToday: Boolean(plot.crop) && plot.stage !== 'ripe',
  }));
}

function describeDawn(day: number, weather: WeatherId, forecast: WeatherId): string {
  const weatherText = weatherDefinition(weather).dawnPhrase;
  const forecastText = weatherDefinition(forecast).forecastLabel;
  const rainText = weatherDefinition(weather).watersCrops ? ' Rain watered planted crops.' : '';

  return `Day ${day} dawns ${weatherText}.${rainText} Tomorrow: ${forecastText}.`;
}

function dawnLogText(
  day: number,
  weather: WeatherId,
  forecast: WeatherId,
  previousState: Pick<FarmState, 'dailyRequests' | 'townEvents'>,
): string {
  return [
    describeDawn(day, weather, forecast),
    weekGoalDawnText(day),
    dailyRequestDawnText(day, previousState.dailyRequests),
    townEventDawnText(day, previousState.townEvents),
    seasonDawnText(day),
  ]
    .filter(Boolean)
    .join(' ');
}

function capitalize(value: string): string {
  return `${value.slice(0, 1).toUpperCase()}${value.slice(1)}`;
}
