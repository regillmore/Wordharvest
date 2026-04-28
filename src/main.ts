import { Application, Assets, Container, Graphics, Rectangle, Sprite, Text, Texture } from 'pixi.js';
import {
  AudioSystem,
  cueForLogMessage,
  deserializeAudioSettings,
  serializeAudioSettings,
  type AudioBedSelection,
  type AudioCue,
  type AudioSettings,
} from './audio/audio';
import { playerSpriteSheet, playerSpriteSource, type PlayerSpriteFrameId } from './assets/playerSprites';
import { achievementProgressText } from './content/achievements';
import {
  addFarmLog,
  advanceDay,
  advanceFarmTime,
  applyTypedWord,
  completePendingAction,
  cropInventorySummary,
  createFarmState,
  seedInventorySummary,
  sleepInFarmhouseBed,
  type CropStage,
  type FarmState,
} from './core/gameState';
import { deserializeSave, serializeSave } from './core/save';
import { normalizeTypedWord } from './core/typing';
import { collectionProgressText } from './content/collectionLog';
import { dailyRequestProgressText } from './content/dailyRequests';
import { followUpGoalDetailText, isFollowUpGoalComplete } from './content/followUpGoals';
import { objectiveCompletionText, objectiveProgressText } from './content/objectives';
import { seasonProgressText } from './content/seasons';
import { townEventForDay, townEventProgressText } from './content/townEvents';
import { weekGoalProgressText } from './content/weekGoals';
import { weatherDefinition, type WeatherId } from './content/weather';
import {
  destinationForWorldTarget,
  doorPosition,
  houseBedPosition,
  housePosition,
  listWorldTargets,
  resolveWorldTarget,
  seedSourcePosition,
  shippingBinPosition,
  townGatePosition,
  townEventPosition,
  townRequestBoardPosition,
  townShopPosition,
  townVillagerPosition,
  type WorldPoint,
  type WorldTarget,
} from './core/worldTargets';
import { farmTiles, type FarmTile, type FarmTileKind } from './world/farmMap';
import { findFarmPath } from './world/pathfinding';
import {
  playerDirectionForMovement,
  playerDirectionForState,
  playerFrameForMotion,
  type PlayerDirection,
} from './rendering/playerAnimation';
import { visibleWorldLabelTargets } from './rendering/worldLabels';
import {
  deserializeAccessibilitySettings,
  normalizeAccessibilitySettings,
  serializeAccessibilitySettings,
  type AccessibilitySettings,
} from './ui/accessibility';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Missing #app root.');
}

let farm = createFarmState();
let typedBuffer = '';
let playerFacing: PlayerDirection = 'down';
let playerAnimationSeconds = 0;

const saveKey = 'wordharvest:save:v1';
const audioSettingsKey = 'wordharvest:audio:v1';
const accessibilitySettingsKey = 'wordharvest:accessibility:v1';
let audioSettings = deserializeAudioSettings(localStorage.getItem(audioSettingsKey));
let accessibilitySettings = deserializeAccessibilitySettings(localStorage.getItem(accessibilitySettingsKey));
const audio = new AudioSystem(audioSettings);

root.innerHTML = `
  <main class="game-shell">
    <section class="stage-panel" aria-label="Farm">
      <div id="game-canvas" class="game-canvas"></div>
    </section>
    <aside class="hud" aria-label="Farm status">
      <header>
        <p class="eyebrow">Prototype 0</p>
        <h1>Wordharvest</h1>
      </header>
      <dl class="stats">
        <div><dt>Day</dt><dd id="day-value"></dd></div>
        <div><dt>Coins</dt><dd id="coin-value"></dd></div>
        <div><dt>Stamina</dt><dd id="stamina-value"></dd></div>
        <div><dt>Weather</dt><dd id="weather-value"></dd></div>
        <div><dt>Tomorrow</dt><dd id="forecast-value"></dd></div>
        <div><dt>Can</dt><dd id="can-value"></dd></div>
        <div><dt>Seeds</dt><dd id="seed-value" class="inventory-summary"></dd></div>
        <div><dt>Crops</dt><dd id="crop-value" class="inventory-summary"></dd></div>
        <div><dt>Collection</dt><dd id="collection-value" class="inventory-summary"></dd></div>
        <div><dt>Badges</dt><dd id="achievement-value" class="inventory-summary"></dd></div>
      </dl>
      <section class="word-panel" aria-live="polite">
        <p class="label">Spring goal</p>
        <p id="objective-progress" class="objective-progress"></p>
        <p id="objective-completion" class="objective-completion" hidden></p>
        <p id="follow-up-progress" class="objective-completion follow-up-progress" hidden></p>
        <p class="label">Week pace</p>
        <p id="week-progress" class="objective-progress"></p>
        <p class="label">Town request</p>
        <p id="request-progress" class="objective-progress"></p>
        <p class="label">Town event</p>
        <p id="event-progress" class="objective-progress"></p>
        <p class="label">Season</p>
        <p id="season-progress" class="objective-progress"></p>
        <p class="label">Typed word</p>
        <p id="typed-word" class="typed-word"></p>
        <p class="label">Nearby words</p>
        <p id="word-preview" class="word-preview"></p>
      </section>
      <section class="audio-panel" aria-labelledby="audio-options-title">
        <p id="audio-options-title" class="label">Audio</p>
        <label class="check-control">
          <input id="audio-muted" type="checkbox" />
          <span>Mute</span>
        </label>
        <label class="range-control">
          <span>Music</span>
          <input id="music-volume" type="range" min="0" max="1" step="0.05" />
        </label>
        <label class="range-control">
          <span>Ambience</span>
          <input id="ambience-volume" type="range" min="0" max="1" step="0.05" />
        </label>
        <label class="range-control">
          <span>Effects</span>
          <input id="effects-volume" type="range" min="0" max="1" step="0.05" />
        </label>
      </section>
      <section class="accessibility-panel" aria-labelledby="accessibility-options-title">
        <p id="accessibility-options-title" class="label">Accessibility</p>
        <label class="check-control">
          <input id="typing-assist" type="checkbox" />
          <span>Typing assist</span>
        </label>
        <label class="check-control">
          <input id="reduced-motion" type="checkbox" />
          <span>Reduced motion</span>
        </label>
        <label class="check-control">
          <input id="readable-ui" type="checkbox" />
          <span>Readable UI</span>
        </label>
        <label class="check-control">
          <input id="visual-cues" type="checkbox" />
          <span>Visual cues</span>
        </label>
        <p id="visual-cue" class="visual-cue" role="status" aria-live="polite"></p>
      </section>
      <section>
        <p class="label">Farm log</p>
        <ol id="farm-log" class="farm-log"></ol>
      </section>
      <footer class="actions">
        <button id="sleep-button" type="button">Sleep</button>
        <button id="save-game" type="button">Save</button>
        <button id="load-game" type="button">Load</button>
        <button id="reset-game" type="button">Reset</button>
        <p id="save-status" class="save-status" role="status" aria-live="polite"></p>
        <p id="save-timestamp" class="save-timestamp"></p>
      </footer>
    </aside>
  </main>
`;

const gameShell = requireElement<HTMLElement>('.game-shell');
const canvasHost = requireElement<HTMLDivElement>('#game-canvas');
const dayValue = requireElement<HTMLElement>('#day-value');
const coinValue = requireElement<HTMLElement>('#coin-value');
const staminaValue = requireElement<HTMLElement>('#stamina-value');
const weatherValue = requireElement<HTMLElement>('#weather-value');
const forecastValue = requireElement<HTMLElement>('#forecast-value');
const canValue = requireElement<HTMLElement>('#can-value');
const seedValue = requireElement<HTMLElement>('#seed-value');
const cropValue = requireElement<HTMLElement>('#crop-value');
const collectionValue = requireElement<HTMLElement>('#collection-value');
const achievementValue = requireElement<HTMLElement>('#achievement-value');
const objectiveProgress = requireElement<HTMLElement>('#objective-progress');
const objectiveCompletion = requireElement<HTMLElement>('#objective-completion');
const followUpProgress = requireElement<HTMLElement>('#follow-up-progress');
const weekProgress = requireElement<HTMLElement>('#week-progress');
const requestProgress = requireElement<HTMLElement>('#request-progress');
const eventProgress = requireElement<HTMLElement>('#event-progress');
const seasonProgress = requireElement<HTMLElement>('#season-progress');
const typedWord = requireElement<HTMLElement>('#typed-word');
const wordPreview = requireElement<HTMLElement>('#word-preview');
const farmLog = requireElement<HTMLOListElement>('#farm-log');
const sleepButton = requireElement<HTMLButtonElement>('#sleep-button');
const saveGame = requireElement<HTMLButtonElement>('#save-game');
const loadGame = requireElement<HTMLButtonElement>('#load-game');
const resetGame = requireElement<HTMLButtonElement>('#reset-game');
const saveStatus = requireElement<HTMLElement>('#save-status');
const saveTimestamp = requireElement<HTMLElement>('#save-timestamp');
const mutedControl = requireElement<HTMLInputElement>('#audio-muted');
const musicVolume = requireElement<HTMLInputElement>('#music-volume');
const ambienceVolume = requireElement<HTMLInputElement>('#ambience-volume');
const effectsVolume = requireElement<HTMLInputElement>('#effects-volume');
const typingAssistControl = requireElement<HTMLInputElement>('#typing-assist');
const reducedMotionControl = requireElement<HTMLInputElement>('#reduced-motion');
const readableUiControl = requireElement<HTMLInputElement>('#readable-ui');
const visualCuesControl = requireElement<HTMLInputElement>('#visual-cues');
const visualCue = requireElement<HTMLElement>('#visual-cue');

const app = new Application();
await app.init({
  antialias: false,
  background: '#7dbf68',
  resizeTo: canvasHost,
});

canvasHost.appendChild(app.canvas);

const playerTextures = await loadPlayerTextures();

sleepButton.addEventListener('click', () => {
  farm = farm.location === 'house' ? sleepInFarmhouseBed(farm) : advanceDay(farm);
  playCueForLatestLog();
  redraw();
});

saveGame.addEventListener('click', () => {
  if (farm.pendingAction) {
    farm = addFarmLog(farm, `Finish walking to ${farm.pendingAction.label} before saving.`);
    playCue('error');
    redraw();
    return;
  }

  const savedAt = new Date().toISOString();
  localStorage.setItem(saveKey, serializeSave(farm, savedAt));
  farm = addFarmLog(farm, 'Saved the farm.');
  saveStatus.textContent = 'Saved.';
  saveTimestamp.textContent = `Last saved: ${formatSaveTimestamp(savedAt)}`;
  playCue('save');
  redraw();
});

loadGame.addEventListener('click', () => {
  if (farm.pendingAction) {
    farm = addFarmLog(farm, `Finish walking to ${farm.pendingAction.label} before loading.`);
    playCue('error');
    redraw();
    return;
  }

  const rawSave = localStorage.getItem(saveKey);
  if (!rawSave) {
    farm = addFarmLog(farm, 'No local save found.');
    saveStatus.textContent = 'No save found.';
    saveTimestamp.textContent = 'No save restored.';
    playCue('error');
    redraw();
    return;
  }

  const result = deserializeSave(rawSave);
  if (!result.ok) {
    farm = addFarmLog(farm, result.error);
    saveStatus.textContent = 'Load failed.';
    saveTimestamp.textContent = 'Stored save could not be loaded.';
    playCue('error');
    redraw();
    return;
  }

  farm = addFarmLog(result.state, result.migrated ? 'Loaded and migrated the farm.' : 'Loaded the farm.');
  saveStatus.textContent = result.migrated ? 'Loaded migrated save.' : 'Loaded.';
  saveTimestamp.textContent = `${result.migrated ? 'Restored migrated save' : 'Restored save'}: ${formatSaveTimestamp(result.savedAt)}`;
  playCue('load');
  redraw();
});

resetGame.addEventListener('click', () => {
  localStorage.removeItem(saveKey);
  farm = addFarmLog(createFarmState(), 'Reset the local save.');
  typedBuffer = '';
  saveStatus.textContent = 'Reset.';
  saveTimestamp.textContent = 'No save restored.';
  playCue('load');
  redraw();
});

for (const control of [mutedControl, musicVolume, ambienceVolume, effectsVolume]) {
  control.addEventListener('input', () => {
    updateAudioSettings(readAudioSettingsFromControls());
  });
}

for (const control of [typingAssistControl, reducedMotionControl, readableUiControl, visualCuesControl]) {
  control.addEventListener('input', () => {
    updateAccessibilitySettings(readAccessibilitySettingsFromControls());
  });
}

window.addEventListener('keydown', (event) => {
  if (event.ctrlKey || event.metaKey || event.altKey) {
    return;
  }

  if (event.key === 'Backspace') {
    typedBuffer = typedBuffer.slice(0, -1);
    redrawHud();
    event.preventDefault();
    return;
  }

  if (event.key === 'Enter' || event.key === ' ') {
    submitTypedBuffer();
    event.preventDefault();
    return;
  }

  if (/^[a-z]$/i.test(event.key)) {
    typedBuffer = normalizeTypedWord(`${typedBuffer}${event.key}`).slice(0, 16);
    playCue('type');
    if (accessibilitySettings.typingAssist && resolveWorldTarget(farm, typedBuffer)) {
      submitTypedBuffer();
      event.preventDefault();
      return;
    }
    redrawHud();
  }
});

app.ticker.add((ticker) => {
  if (!farm.pendingAction) {
    playerAnimationSeconds = 0;
    return;
  }

  const hadPendingAction = Boolean(farm.pendingAction);
  const previousPlayer = farm.player;
  playerAnimationSeconds += ticker.deltaMS / 1000;
  farm = accessibilitySettings.reducedMotion ? completePendingAction(farm) : advanceFarmTime(farm, ticker.deltaMS / 1000);
  playerFacing = playerDirectionForMovement(previousPlayer, farm.player, playerFacing);
  if (hadPendingAction && !farm.pendingAction) {
    playerAnimationSeconds = 0;
    playCueForLatestLog();
  }
  redraw();
});

syncAudioControls();
syncAccessibilityControls();
applyAccessibilitySettings();
syncSaveTimestampFromStorage();
redraw();

interface Viewport {
  originX: number;
  originY: number;
  scale: number;
}

function redraw(): void {
  app.stage.removeChildren();
  app.stage.addChild(createScene(farm, typedBuffer));
  redrawHud();
  syncAudioScene();
}

function submitTypedBuffer(): void {
  const wasPending = Boolean(farm.pendingAction);
  farm = applyTypedWord(farm, typedBuffer);
  if (!wasPending && farm.pendingAction) {
    playerFacing = playerDirectionForState(farm, playerFacing);
    playerAnimationSeconds = 0;
    playCue('walk');
  } else {
    playCueForLatestLog();
  }
  typedBuffer = '';
  redraw();
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

async function loadPlayerTextures(): Promise<Record<PlayerSpriteFrameId, Texture>> {
  const sheetTexture = (await Assets.load(playerSpriteSource())) as Texture;
  sheetTexture.source.scaleMode = 'nearest';

  return Object.fromEntries(
    Object.entries(playerSpriteSheet.frames).map(([frameId, definition]) => {
      const frame = definition.frame;

      return [
        frameId,
        new Texture({
          source: sheetTexture.source,
          frame: new Rectangle(frame.x, frame.y, frame.w, frame.h),
          defaultAnchor: definition.anchor,
        }),
      ];
    }),
  ) as Record<PlayerSpriteFrameId, Texture>;
}

function redrawHud(): void {
  const completionText = objectiveCompletionText(farm.seasonObjective);
  const followUpText = farm.seasonObjective.completed ? followUpGoalDetailText(farm.collectionLog) : '';

  dayValue.textContent = String(farm.day);
  coinValue.textContent = String(farm.coins);
  staminaValue.textContent = String(farm.stamina);
  weatherValue.textContent = weatherDefinition(farm.weather).name;
  forecastValue.textContent = weatherDefinition(farm.forecast).name;
  canValue.textContent = farm.upgrades.wateringCan ? 'Tin' : 'Basic';
  seedValue.textContent = seedInventorySummary(farm);
  cropValue.textContent = cropInventorySummary(farm);
  collectionValue.textContent = collectionProgressText(farm.collectionLog);
  achievementValue.textContent = achievementProgressText(farm.achievements);
  objectiveProgress.textContent = objectiveProgressText(farm.seasonObjective);
  objectiveProgress.classList.toggle('is-complete', farm.seasonObjective.completed);
  objectiveCompletion.textContent = completionText;
  objectiveCompletion.hidden = completionText.length === 0;
  followUpProgress.textContent = followUpText;
  followUpProgress.hidden = followUpText.length === 0;
  followUpProgress.classList.toggle(
    'is-complete',
    followUpText.length > 0 && isFollowUpGoalComplete(farm.collectionLog),
  );
  weekProgress.textContent = weekGoalProgressText(farm.day, farm.weekGoals);
  requestProgress.textContent = dailyRequestProgressText(farm.day, farm.dailyRequests);
  eventProgress.textContent = townEventProgressText(farm.day, farm.townEvents);
  seasonProgress.textContent = seasonProgressText(farm.day);
  typedWord.textContent = typedBuffer || '...';

  sleepButton.disabled = Boolean(farm.pendingAction);
  saveGame.disabled = Boolean(farm.pendingAction);
  loadGame.disabled = Boolean(farm.pendingAction);

  if (farm.pendingAction) {
    wordPreview.textContent = `Walking to ${farm.pendingAction.label}...`;
    farmLog.innerHTML = farm.log.map((entry) => `<li>${entry}</li>`).join('');
    return;
  }

  const visibleTargets = listWorldTargets(farm);
  const exactTarget = visibleTargets.find((target) => target.word === normalizeTypedWord(typedBuffer));
  wordPreview.textContent = exactTarget
    ? `Target: ${exactTarget.label}`
    : visibleTargets.map((target) => target.label).join(', ');

  farmLog.innerHTML = farm.log.map((entry) => `<li>${entry}</li>`).join('');
}

function readAudioSettingsFromControls(): AudioSettings {
  return {
    muted: mutedControl.checked,
    musicVolume: Number(musicVolume.value),
    ambienceVolume: Number(ambienceVolume.value),
    effectsVolume: Number(effectsVolume.value),
  };
}

function updateAudioSettings(settings: AudioSettings): void {
  audioSettings = settings;
  audio.updateSettings(audioSettings);
  localStorage.setItem(audioSettingsKey, serializeAudioSettings(audioSettings));
}

function syncAudioControls(): void {
  mutedControl.checked = audioSettings.muted;
  musicVolume.value = String(audioSettings.musicVolume);
  ambienceVolume.value = String(audioSettings.ambienceVolume);
  effectsVolume.value = String(audioSettings.effectsVolume);
}

function readAccessibilitySettingsFromControls(): AccessibilitySettings {
  return {
    typingAssist: typingAssistControl.checked,
    reducedMotion: reducedMotionControl.checked,
    readableUi: readableUiControl.checked,
    visualCues: visualCuesControl.checked,
  };
}

function updateAccessibilitySettings(settings: AccessibilitySettings): void {
  accessibilitySettings = normalizeAccessibilitySettings(settings);
  localStorage.setItem(accessibilitySettingsKey, serializeAccessibilitySettings(accessibilitySettings));
  applyAccessibilitySettings();
}

function syncAccessibilityControls(): void {
  typingAssistControl.checked = accessibilitySettings.typingAssist;
  reducedMotionControl.checked = accessibilitySettings.reducedMotion;
  readableUiControl.checked = accessibilitySettings.readableUi;
  visualCuesControl.checked = accessibilitySettings.visualCues;
}

function applyAccessibilitySettings(): void {
  gameShell.classList.toggle('is-reduced-motion', accessibilitySettings.reducedMotion);
  gameShell.classList.toggle('is-readable-ui', accessibilitySettings.readableUi);

  if (!accessibilitySettings.visualCues) {
    visualCue.textContent = '';
  }
}

function syncAudioScene(): void {
  audio.setBeds(audioBedsForFarm(farm));
}

function audioBedsForFarm(state: FarmState): AudioBedSelection {
  const music =
    state.location === 'town' ? (townEventForDay(state.day) ? 'festivalMusic' : 'townMusic') : 'farmMusic';
  const ambience =
    state.location === 'house' ? 'indoorAmbience' : weatherDefinition(state.weather).watersCrops ? 'rainAmbience' : 'springAmbience';

  return {
    music,
    ambience,
  };
}

function syncSaveTimestampFromStorage(): void {
  const rawSave = localStorage.getItem(saveKey);
  if (!rawSave) {
    saveTimestamp.textContent = 'No save restored.';
    return;
  }

  const result = deserializeSave(rawSave);
  saveTimestamp.textContent = result.ok
    ? `Stored save: ${formatSaveTimestamp(result.savedAt)}`
    : 'Stored save could not be loaded.';
}

function formatSaveTimestamp(savedAt: string): string {
  const date = new Date(savedAt);

  if (Number.isNaN(date.getTime())) {
    return 'unknown time';
  }

  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`;
}

function playCue(cue: AudioCue): void {
  audio.play(cue);

  if (accessibilitySettings.visualCues) {
    visualCue.textContent = visualCueText(cue);
  }
}

function playCueForLatestLog(): void {
  const cue = cueForLogMessage(farm.log[0] ?? '');

  if (cue) {
    playCue(cue);
  }
}

function visualCueText(cue: AudioCue): string {
  const cueText = {
    type: 'Cue: typing',
    walk: 'Cue: walking',
    plant: 'Cue: planted',
    water: 'Cue: watered',
    harvest: 'Cue: harvested',
    ship: 'Cue: reward',
    door: 'Cue: door',
    day: 'Cue: new day',
    save: 'Cue: saved',
    load: 'Cue: loaded',
    error: 'Cue: needs attention',
  } as const satisfies Record<AudioCue, string>;

  return cueText[cue];
}

function createScene(state: FarmState, typedWord: string): Container {
  if (state.location === 'house') {
    return createHouseInterior(state, typedWord);
  }

  if (state.location === 'town') {
    return createTownEdge(state, typedWord);
  }

  return createFarmExterior(state, typedWord);
}

function createFarmExterior(state: FarmState, typedWord: string): Container {
  const scene = new Container();
  const width = app.renderer.width;
  const height = app.renderer.height;
  const viewport = createViewport(width, height);

  scene.addChild(rect(0, 0, width, height, skyColorForWeather(state.weather)));

  drawFarmTiles(scene, viewport);
  drawPathPreview(scene, viewport, pathPreviewForState(state, typedWord));
  drawHouse(scene, viewport);
  drawSeedSource(scene, viewport);
  drawShippingBin(scene, viewport);
  drawObjectiveCompletionMarker(scene, viewport, state);
  drawMarketEncoreMarker(scene, viewport, state);
  drawTownGate(scene, viewport);

  for (const plot of state.plots) {
    const point = worldToScreen(viewport, plot.position);
    const plotSize = viewport.scale * 0.72;
    scene.addChild(rect(point.x - plotSize / 2, point.y - plotSize / 2, plotSize, plotSize, 0x8f5f34));
    scene.addChild(cropMarker(point.x, point.y, plotSize, plot.stage));
  }

  drawPlayer(scene, viewport, state);
  drawTargets(scene, viewport, listWorldTargets(state));

  return scene;
}

function createTownEdge(state: FarmState, typedWord: string): Container {
  const scene = new Container();
  const width = app.renderer.width;
  const height = app.renderer.height;
  const viewport = createViewport(width, height);

  scene.addChild(rect(0, 0, width, height, skyColorForWeather(state.weather)));
  scene.addChild(rect(0, height * 0.54, width, height * 0.46, 0x82b66f));

  const laneCenter = worldToScreen(viewport, { x: 0, y: 5.7 });
  scene.addChild(rect(laneCenter.x - viewport.scale * 0.55, height * 0.48, viewport.scale * 1.1, height * 0.52, 0xc8ad72));
  scene.addChild(rect(laneCenter.x - viewport.scale * 0.22, height * 0.42, viewport.scale * 0.44, viewport.scale * 0.34, 0x5f715f));
  scene.addChild(rect(laneCenter.x - viewport.scale * 0.32, height * 0.74, viewport.scale * 0.64, viewport.scale * 0.12, 0xe7d39f));

  drawPathPreview(scene, viewport, pathPreviewForState(state, typedWord));
  drawTownShop(scene, viewport);
  drawTownRequestBoard(scene, viewport);
  drawTownEvent(scene, viewport, state);
  drawTownVillager(scene, viewport);
  drawPlayer(scene, viewport, state);
  drawTargets(scene, viewport, listWorldTargets(state));

  return scene;
}

function pathPreviewForState(state: FarmState, typedWord: string): WorldPoint[] {
  if (state.pendingAction) {
    return [state.player, ...state.pendingAction.path];
  }

  const target = resolveWorldTarget(state, typedWord);

  if (!target) {
    return [];
  }

  const pathResult = findFarmPath(state.player, destinationForWorldTarget(target));

  return pathResult.ok ? [state.player, ...pathResult.path] : [];
}

function createHouseInterior(state: FarmState, typedWord: string): Container {
  const scene = new Container();
  const width = app.renderer.width;
  const height = app.renderer.height;
  const viewport = createViewport(width, height);
  const wallHeight = Math.floor(height * 0.34);

  scene.addChild(rect(0, 0, width, height, 0xcaa66f));
  scene.addChild(rect(0, 0, width, wallHeight, 0x9b6848));
  scene.addChild(rect(0, 0, width * 0.08, height, 0x70452f));
  scene.addChild(rect(width * 0.92, 0, width * 0.08, height, 0x70452f));
  scene.addChild(rect(width * 0.08, wallHeight - viewport.scale * 0.08, width * 0.84, viewport.scale * 0.12, 0x6b422e));
  drawFloorboards(scene, wallHeight, width, height, viewport.scale);
  drawPathPreview(scene, viewport, pathPreviewForState(state, typedWord));
  drawHouseBed(scene, viewport);
  scene.addChild(rect(width * 0.58, height * 0.24, width * 0.2, height * 0.14, 0x6d4b36));
  scene.addChild(rect(width * 0.6, height * 0.265, width * 0.16, height * 0.035, 0xe7d39f));
  scene.addChild(rect(width * 0.43, height * 0.68, width * 0.14, height * 0.2, 0x3c5f46));

  drawPlayer(scene, viewport, state);
  drawTargets(scene, viewport, listWorldTargets(state));

  return scene;
}

function drawFloorboards(scene: Container, wallHeight: number, width: number, height: number, scale: number): void {
  const floorboards = new Graphics();
  const boardHeight = Math.max(18, scale * 0.32);

  for (let y = wallHeight + boardHeight; y < height; y += boardHeight) {
    floorboards.moveTo(width * 0.08, y).lineTo(width * 0.92, y);
  }

  floorboards.stroke({ color: 0x8e6d45, alpha: 0.3, width: 2 });
  scene.addChild(floorboards);
}

function drawHouseBed(scene: Container, viewport: Viewport): void {
  const bed = worldToScreen(viewport, houseBedPosition);
  const width = viewport.scale * 1.08;
  const height = viewport.scale * 1.2;
  const graphic = new Graphics();

  graphic.rect(bed.x - width / 2, bed.y - height / 2, width, height).fill(0x7b4e2c);
  graphic.rect(bed.x - width * 0.42, bed.y - height * 0.42, width * 0.84, height * 0.28).fill(0xf4e3a3);
  graphic.rect(bed.x - width * 0.42, bed.y - height * 0.08, width * 0.84, height * 0.48).fill(0x668a9c);
  graphic.rect(bed.x - width * 0.42, bed.y + height * 0.08, width * 0.84, height * 0.08).fill(0xf4d35e);
  graphic.rect(bed.x - width * 0.52, bed.y - height * 0.5, width * 0.12, height).fill(0x4f3328);
  graphic.rect(bed.x + width * 0.4, bed.y - height * 0.5, width * 0.12, height).fill(0x4f3328);

  scene.addChild(graphic);
}

function createViewport(width: number, height: number): Viewport {
  return {
    originX: width / 2,
    originY: Math.max(88, height * 0.16),
    scale: Math.max(56, Math.min(92, Math.floor(Math.min(width / 6, height / 6.4)))),
  };
}

function worldToScreen(viewport: Viewport, point: WorldPoint): WorldPoint {
  return {
    x: viewport.originX + point.x * viewport.scale,
    y: viewport.originY + point.y * viewport.scale,
  };
}

function skyColorForWeather(weather: WeatherId): number {
  return weather === 'rain' ? 0x7fb6bf : 0x8dccd8;
}

function drawFarmTiles(scene: Container, viewport: Viewport): void {
  for (const tile of farmTiles) {
    scene.addChild(tileGraphic(viewport, tile));
  }
}

function drawPathPreview(scene: Container, viewport: Viewport, path: WorldPoint[]): void {
  if (path.length < 2) {
    return;
  }

  const graphic = new Graphics();
  const firstPoint = worldToScreen(viewport, path[0]);

  graphic.moveTo(firstPoint.x, firstPoint.y);

  for (const point of path.slice(1)) {
    const screenPoint = worldToScreen(viewport, point);
    graphic.lineTo(screenPoint.x, screenPoint.y);
  }

  graphic.stroke({ color: 0xfff5cf, alpha: 0.82, width: Math.max(3, viewport.scale * 0.08) });

  for (const point of path.slice(1)) {
    const screenPoint = worldToScreen(viewport, point);
    graphic.circle(screenPoint.x, screenPoint.y, Math.max(4, viewport.scale * 0.08)).fill({ color: 0xf4d35e, alpha: 0.85 });
  }

  scene.addChild(graphic);
}

function tileGraphic(viewport: Viewport, tile: FarmTile): Graphics {
  const point = worldToScreen(viewport, { x: tile.x, y: tile.y });
  const size = viewport.scale;
  const x = point.x - size / 2;
  const y = point.y - size / 2;
  const graphic = new Graphics().rect(x, y, size, size).fill(tileColor(tile.kind, tile.x, tile.y));

  graphic.rect(x, y, size, size).stroke({ color: 0x5b7f56, alpha: 0.18, width: 1 });
  drawTileDetail(graphic, tile.kind, x, y, size);

  return graphic;
}

function tileColor(kind: FarmTileKind, x: number, y: number): number {
  if (kind === 'grass') {
    return (x + y) % 2 === 0 ? 0x78b86a : 0x70ad61;
  }

  if (kind === 'meadow') {
    return (x + y) % 2 === 0 ? 0x84bf73 : 0x7ab36b;
  }

  if (kind === 'path') {
    return 0xc8ad72;
  }

  if (kind === 'soil') {
    return 0x8f5f34;
  }

  if (kind === 'foundation') {
    return 0xb98357;
  }

  if (kind === 'water') {
    return 0x4d9bbd;
  }

  return (x + y) % 2 === 0 ? 0x78b86a : 0x70ad61;
}

function drawTileDetail(graphic: Graphics, kind: FarmTileKind, x: number, y: number, size: number): void {
  if (kind === 'soil') {
    graphic.moveTo(x + size * 0.18, y + size * 0.32).lineTo(x + size * 0.82, y + size * 0.32);
    graphic.moveTo(x + size * 0.18, y + size * 0.52).lineTo(x + size * 0.82, y + size * 0.52);
    graphic.moveTo(x + size * 0.18, y + size * 0.72).lineTo(x + size * 0.82, y + size * 0.72);
    graphic.stroke({ color: 0x734626, alpha: 0.55, width: 2 });
    return;
  }

  if (kind === 'path') {
    graphic.circle(x + size * 0.28, y + size * 0.68, size * 0.035).fill(0xa88a56);
    graphic.circle(x + size * 0.66, y + size * 0.34, size * 0.028).fill(0xe2c58a);
    return;
  }

  if (kind === 'meadow') {
    graphic.circle(x + size * 0.28, y + size * 0.42, size * 0.035).fill(0xf4d35e);
    graphic.circle(x + size * 0.7, y + size * 0.66, size * 0.026).fill(0xf7a8a3);
    return;
  }

  if (kind === 'foundation') {
    graphic.moveTo(x + size * 0.08, y + size * 0.36).lineTo(x + size * 0.92, y + size * 0.36);
    graphic.moveTo(x + size * 0.08, y + size * 0.62).lineTo(x + size * 0.92, y + size * 0.62);
    graphic.moveTo(x + size * 0.34, y + size * 0.08).lineTo(x + size * 0.34, y + size * 0.92);
    graphic.moveTo(x + size * 0.66, y + size * 0.08).lineTo(x + size * 0.66, y + size * 0.92);
    graphic.stroke({ color: 0x8b5a3c, alpha: 0.5, width: 2 });
    graphic.rect(x + size * 0.16, y + size * 0.16, size * 0.1, size * 0.1).fill(0xe7d39f);
    graphic.rect(x + size * 0.74, y + size * 0.72, size * 0.1, size * 0.1).fill(0xe7d39f);
    return;
  }

  if (kind === 'fence') {
    graphic.rect(x + size * 0.1, y + size * 0.31, size * 0.8, size * 0.09).fill(0xe7d39f);
    graphic.rect(x + size * 0.1, y + size * 0.58, size * 0.8, size * 0.09).fill(0xc8ad72);
    graphic.rect(x + size * 0.16, y + size * 0.18, size * 0.13, size * 0.66).fill(0x7b4e2c);
    graphic.rect(x + size * 0.71, y + size * 0.18, size * 0.13, size * 0.66).fill(0x7b4e2c);
    graphic.rect(x + size * 0.16, y + size * 0.18, size * 0.13, size * 0.07).fill(0xb98357);
    graphic.rect(x + size * 0.71, y + size * 0.18, size * 0.13, size * 0.07).fill(0xb98357);
    return;
  }

  if (kind === 'water') {
    graphic.moveTo(x + size * 0.16, y + size * 0.45).lineTo(x + size * 0.42, y + size * 0.38);
    graphic.moveTo(x + size * 0.48, y + size * 0.62).lineTo(x + size * 0.82, y + size * 0.54);
    graphic.stroke({ color: 0xa8dbe8, alpha: 0.7, width: 2 });
  }
}

function drawHouse(scene: Container, viewport: Viewport): void {
  const house = worldToScreen(viewport, housePosition);
  const door = worldToScreen(viewport, doorPosition);
  const houseWidth = viewport.scale * 2.1;
  const houseHeight = viewport.scale * 1.1;

  scene.addChild(rect(house.x - houseWidth / 2, house.y + viewport.scale * 0.12, houseWidth, houseHeight, 0xd79b5d));
  scene.addChild(rect(house.x - houseWidth * 0.58, house.y - viewport.scale * 0.08, houseWidth * 1.16, viewport.scale * 0.34, 0x7d3f2a));
  scene.addChild(rect(door.x - viewport.scale * 0.18, door.y - viewport.scale * 0.2, viewport.scale * 0.36, viewport.scale * 0.55, 0x4f3328));
  scene.addChild(rect(house.x - viewport.scale * 0.68, house.y + viewport.scale * 0.42, viewport.scale * 0.32, viewport.scale * 0.26, 0xf4e3a3));
  scene.addChild(rect(house.x + viewport.scale * 0.36, house.y + viewport.scale * 0.42, viewport.scale * 0.32, viewport.scale * 0.26, 0xf4e3a3));
}

function drawShippingBin(scene: Container, viewport: Viewport): void {
  const bin = worldToScreen(viewport, shippingBinPosition);
  const width = viewport.scale * 0.52;
  const height = viewport.scale * 0.48;

  scene.addChild(rect(bin.x - width / 2, bin.y - height / 2, width, height, 0x8b5a3c));
  scene.addChild(rect(bin.x - width * 0.58, bin.y - height * 0.66, width * 1.16, height * 0.18, 0x5c3a28));
  scene.addChild(rect(bin.x - width * 0.38, bin.y - height * 0.16, width * 0.76, height * 0.08, 0xe7d39f));
}

function drawObjectiveCompletionMarker(scene: Container, viewport: Viewport, state: FarmState): void {
  if (!state.seasonObjective.completed) {
    return;
  }

  const marker = worldToScreen(viewport, { x: shippingBinPosition.x + 0.62, y: shippingBinPosition.y - 0.18 });
  const width = viewport.scale * 0.42;
  const height = viewport.scale * 0.3;
  const graphic = new Graphics();

  graphic.rect(marker.x - width / 2, marker.y - height / 2, width, height).fill(0xc98c42);
  graphic.rect(marker.x - width * 0.42, marker.y - height * 0.65, width * 0.84, height * 0.18).fill(0x7b4e2c);
  graphic.moveTo(marker.x - width * 0.34, marker.y - height * 0.5).lineTo(marker.x, marker.y - height * 0.92);
  graphic.lineTo(marker.x + width * 0.34, marker.y - height * 0.5).stroke({ color: 0x7b4e2c, width: 2 });
  graphic.circle(marker.x - width * 0.17, marker.y - height * 0.1, width * 0.09).fill(0xf4d35e);
  graphic.circle(marker.x, marker.y - height * 0.18, width * 0.08).fill(0xf7a8a3);
  graphic.circle(marker.x + width * 0.16, marker.y - height * 0.08, width * 0.08).fill(0xe7d39f);

  scene.addChild(graphic);
}

function drawMarketEncoreMarker(scene: Container, viewport: Viewport, state: FarmState): void {
  if (!isFollowUpGoalComplete(state.collectionLog)) {
    return;
  }

  const marker = worldToScreen(viewport, { x: shippingBinPosition.x + 1.18, y: shippingBinPosition.y + 0.22 });
  const width = viewport.scale * 0.66;
  const height = viewport.scale * 0.38;
  const graphic = new Graphics();

  graphic.rect(marker.x - width / 2, marker.y - height / 2, width, height).fill(0x7b4e2c);
  graphic.rect(marker.x - width * 0.42, marker.y - height * 0.72, width * 0.84, height * 0.24).fill(0xe7d39f);
  graphic.circle(marker.x - width * 0.28, marker.y - height * 0.1, width * 0.1).fill(0xf4d35e);
  graphic.circle(marker.x - width * 0.08, marker.y - height * 0.14, width * 0.1).fill(0xf7a8a3);
  graphic.circle(marker.x + width * 0.12, marker.y - height * 0.08, width * 0.1).fill(0x9bd07a);
  graphic.circle(marker.x + width * 0.31, marker.y - height * 0.13, width * 0.1).fill(0xd85f4f);
  graphic.rect(marker.x - width * 0.45, marker.y + height * 0.28, width * 0.12, height * 0.38).fill(0x4f3328);
  graphic.rect(marker.x + width * 0.33, marker.y + height * 0.28, width * 0.12, height * 0.38).fill(0x4f3328);

  scene.addChild(graphic);
}

function drawTownGate(scene: Container, viewport: Viewport): void {
  const gate = worldToScreen(viewport, townGatePosition);
  const width = viewport.scale * 1.2;
  const postWidth = viewport.scale * 0.12;
  const postHeight = viewport.scale * 0.74;

  scene.addChild(rect(gate.x - width / 2, gate.y - postHeight * 0.15, postWidth, postHeight, 0x7b4e2c));
  scene.addChild(rect(gate.x + width / 2 - postWidth, gate.y - postHeight * 0.15, postWidth, postHeight, 0x7b4e2c));
  scene.addChild(rect(gate.x - width * 0.42, gate.y - postHeight * 0.36, width * 0.84, viewport.scale * 0.18, 0xe7d39f));
  scene.addChild(rect(gate.x - width * 0.08, gate.y - postHeight * 0.12, width * 0.16, viewport.scale * 0.42, 0xc8ad72));
}

function drawTownShop(scene: Container, viewport: Viewport): void {
  const shop = worldToScreen(viewport, townShopPosition);
  const width = viewport.scale * 1.15;
  const height = viewport.scale * 0.78;

  scene.addChild(rect(shop.x - width / 2, shop.y - height * 0.72, width, height, 0xd79b5d));
  scene.addChild(rect(shop.x - width * 0.58, shop.y - height, width * 1.16, height * 0.28, 0x7d3f2a));
  scene.addChild(rect(shop.x - width * 0.24, shop.y - height * 0.42, width * 0.48, height * 0.16, 0xe7d39f));
  scene.addChild(rect(shop.x - width * 0.12, shop.y - height * 0.2, width * 0.24, height * 0.28, 0x4f3328));
}

function drawTownRequestBoard(scene: Container, viewport: Viewport): void {
  const board = worldToScreen(viewport, townRequestBoardPosition);
  const width = viewport.scale * 0.7;
  const height = viewport.scale * 0.52;
  const postWidth = viewport.scale * 0.08;

  scene.addChild(rect(board.x - postWidth / 2, board.y - height * 0.08, postWidth, height * 0.86, 0x4f3328));
  scene.addChild(rect(board.x - width / 2, board.y - height * 0.78, width, height, 0x7b4e2c));
  scene.addChild(rect(board.x - width * 0.4, board.y - height * 0.66, width * 0.34, height * 0.28, 0xf4e3a3));
  scene.addChild(rect(board.x + width * 0.06, board.y - height * 0.64, width * 0.32, height * 0.23, 0xe7d39f));
  scene.addChild(rect(board.x - width * 0.3, board.y - height * 0.24, width * 0.6, height * 0.08, 0xc8ad72));
}

function drawTownEvent(scene: Container, viewport: Viewport, state: FarmState): void {
  if (!townEventForDay(state.day)) {
    return;
  }

  const event = worldToScreen(viewport, townEventPosition);
  const bannerWidth = viewport.scale * 0.96;
  const bannerHeight = viewport.scale * 0.28;
  const postHeight = viewport.scale * 0.72;
  const postWidth = viewport.scale * 0.08;

  scene.addChild(rect(event.x - bannerWidth / 2, event.y - postHeight, postWidth, postHeight, 0x4f3328));
  scene.addChild(rect(event.x + bannerWidth / 2 - postWidth, event.y - postHeight, postWidth, postHeight, 0x4f3328));
  scene.addChild(rect(event.x - bannerWidth / 2, event.y - postHeight, bannerWidth, bannerHeight, 0xf4d35e));
  scene.addChild(rect(event.x - bannerWidth * 0.4, event.y - postHeight, bannerWidth * 0.22, bannerHeight, 0xd85f4f));
  scene.addChild(rect(event.x + bannerWidth * 0.18, event.y - postHeight, bannerWidth * 0.22, bannerHeight, 0x9bd07a));
  scene.addChild(rect(event.x - viewport.scale * 0.34, event.y - viewport.scale * 0.22, viewport.scale * 0.68, viewport.scale * 0.16, 0xe7d39f));
  scene.addChild(rect(event.x - viewport.scale * 0.26, event.y - viewport.scale * 0.1, viewport.scale * 0.52, viewport.scale * 0.18, 0xc98c42));
}

function drawTownVillager(scene: Container, viewport: Viewport): void {
  const villager = worldToScreen(viewport, townVillagerPosition);
  const figure = new Graphics();

  figure.circle(villager.x, villager.y, viewport.scale * 0.16).fill(0xc98c42);
  figure.circle(villager.x, villager.y - viewport.scale * 0.2, viewport.scale * 0.12).fill(0xf1c27d);
  figure.rect(villager.x - viewport.scale * 0.14, villager.y - viewport.scale * 0.36, viewport.scale * 0.28, viewport.scale * 0.08).fill(0xf7a8a3);
  figure.rect(villager.x - viewport.scale * 0.09, villager.y + viewport.scale * 0.14, viewport.scale * 0.07, viewport.scale * 0.16).fill(0x4f3328);
  figure.rect(villager.x + viewport.scale * 0.02, villager.y + viewport.scale * 0.14, viewport.scale * 0.07, viewport.scale * 0.16).fill(0x4f3328);

  scene.addChild(figure);
}

function drawSeedSource(scene: Container, viewport: Viewport): void {
  const source = worldToScreen(viewport, seedSourcePosition);
  const width = viewport.scale * 0.62;
  const height = viewport.scale * 0.48;

  scene.addChild(rect(source.x - width / 2, source.y - height / 2, width, height, 0xc98c42));
  scene.addChild(rect(source.x - width * 0.42, source.y - height * 0.68, width * 0.84, height * 0.22, 0x7b4e2c));
  scene.addChild(rect(source.x - width * 0.28, source.y - height * 0.12, width * 0.56, height * 0.12, 0xf4e3a3));
  scene.addChild(rect(source.x - width * 0.12, source.y + height * 0.14, width * 0.24, height * 0.18, 0x2f7d32));
}

function drawPlayer(scene: Container, viewport: Viewport, state: FarmState): void {
  const direction = state.pendingAction ? playerDirectionForState(state, playerFacing) : playerFacing;
  const frameId = playerFrameForMotion(direction, Boolean(state.pendingAction), playerAnimationSeconds);
  const point = worldToScreen(viewport, state.player);
  const frame = playerSpriteSheet.frames[frameId];
  const sprite = new Sprite({
    texture: playerTextures[frameId],
    anchor: frame.anchor,
    roundPixels: true,
  });
  const spriteHeight = viewport.scale * 0.72;

  sprite.width = spriteHeight * (playerSpriteSheet.cell.w / playerSpriteSheet.cell.h);
  sprite.height = spriteHeight;
  sprite.position.set(point.x, point.y + viewport.scale * 0.1);

  scene.addChild(sprite);
}

function drawTargets(scene: Container, viewport: Viewport, targets: WorldTarget[]): void {
  for (const target of visibleWorldLabelTargets(targets)) {
    const point = worldToScreen(viewport, target.position);
    scene.addChild(wordLabel(target.label, point.x, point.y - viewport.scale * 0.34));
  }
}

function wordLabel(word: string, x: number, y: number): Container {
  const container = new Container();
  const text = new Text({
    text: word,
    style: {
      fill: '#172018',
      fontFamily: 'Inter, system-ui, sans-serif',
      fontSize: 16,
      fontWeight: '800',
    },
  });
  const paddingX = 8;
  const paddingY = 5;
  const width = text.width + paddingX * 2;
  const height = text.height + paddingY * 2;

  container.addChild(rect(0, 0, width, height, 0xfff5cf));
  text.x = paddingX;
  text.y = paddingY - 1;
  container.addChild(text);
  container.x = x - width / 2;
  container.y = y - height;

  return container;
}

function rect(x: number, y: number, width: number, height: number, color: number): Graphics {
  return new Graphics().rect(x, y, width, height).fill(color);
}

function cropMarker(x: number, y: number, size: number, stage: CropStage): Graphics {
  const marker = new Graphics();

  if (stage === 'empty') {
    marker.moveTo(x - size * 0.34, y).lineTo(x + size * 0.34, y).stroke({ color: 0x734626, width: 3 });
    return marker;
  }

  marker.circle(x, y, stage === 'ripe' ? size * 0.22 : size * 0.14);
  marker.fill(stage === 'ripe' ? 0xf4d35e : 0x2f7d32);

  if (stage === 'leaf' || stage === 'ripe') {
    marker.ellipse(x - size * 0.15, y + size * 0.1, size * 0.18, size * 0.09).fill(0x3fa34d);
    marker.ellipse(x + size * 0.15, y + size * 0.1, size * 0.18, size * 0.09).fill(0x3fa34d);
  }

  return marker;
}
