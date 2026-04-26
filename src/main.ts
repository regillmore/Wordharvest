import { Application, Container, Graphics, Text } from 'pixi.js';
import { AudioSystem, cueForLogMessage, deserializeAudioSettings, serializeAudioSettings, type AudioSettings } from './audio/audio';
import {
  addFarmLog,
  advanceDay,
  advanceFarmTime,
  applyTypedWord,
  createFarmState,
  type CropStage,
  type FarmState,
} from './core/gameState';
import { deserializeSave, serializeSave } from './core/save';
import { normalizeTypedWord } from './core/typing';
import {
  destinationForWorldTarget,
  doorPosition,
  housePosition,
  listWorldTargets,
  resolveWorldTarget,
  shippingBinPosition,
  type WorldPoint,
  type WorldTarget,
} from './core/worldTargets';
import { farmTiles, type FarmTile, type FarmTileKind } from './world/farmMap';
import { findFarmPath } from './world/pathfinding';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Missing #app root.');
}

let farm = createFarmState();
let typedBuffer = '';

const saveKey = 'wordharvest:save:v1';
const audioSettingsKey = 'wordharvest:audio:v1';
let audioSettings = deserializeAudioSettings(localStorage.getItem(audioSettingsKey));
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
        <div><dt>Turnips</dt><dd id="turnip-value"></dd></div>
      </dl>
      <section class="word-panel" aria-live="polite">
        <p class="label">Typed word</p>
        <p id="typed-word" class="typed-word"></p>
        <p class="label">Nearby words</p>
        <p id="word-preview" class="word-preview"></p>
      </section>
      <fieldset class="audio-panel">
        <legend class="label">Audio</legend>
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
      </fieldset>
      <section>
        <p class="label">Farm log</p>
        <ol id="farm-log" class="farm-log"></ol>
      </section>
      <footer class="actions">
        <button id="next-day" type="button">End Day</button>
        <button id="save-game" type="button">Save</button>
        <button id="load-game" type="button">Load</button>
        <button id="reset-game" type="button">Reset</button>
        <p id="save-status" class="save-status" role="status" aria-live="polite"></p>
      </footer>
    </aside>
  </main>
`;

const canvasHost = requireElement<HTMLDivElement>('#game-canvas');
const dayValue = requireElement<HTMLElement>('#day-value');
const coinValue = requireElement<HTMLElement>('#coin-value');
const staminaValue = requireElement<HTMLElement>('#stamina-value');
const turnipValue = requireElement<HTMLElement>('#turnip-value');
const typedWord = requireElement<HTMLElement>('#typed-word');
const wordPreview = requireElement<HTMLElement>('#word-preview');
const farmLog = requireElement<HTMLOListElement>('#farm-log');
const nextDay = requireElement<HTMLButtonElement>('#next-day');
const saveGame = requireElement<HTMLButtonElement>('#save-game');
const loadGame = requireElement<HTMLButtonElement>('#load-game');
const resetGame = requireElement<HTMLButtonElement>('#reset-game');
const saveStatus = requireElement<HTMLElement>('#save-status');
const mutedControl = requireElement<HTMLInputElement>('#audio-muted');
const musicVolume = requireElement<HTMLInputElement>('#music-volume');
const ambienceVolume = requireElement<HTMLInputElement>('#ambience-volume');
const effectsVolume = requireElement<HTMLInputElement>('#effects-volume');

const app = new Application();
await app.init({
  antialias: false,
  background: '#7dbf68',
  resizeTo: canvasHost,
});

canvasHost.appendChild(app.canvas);

nextDay.addEventListener('click', () => {
  farm = advanceDay(farm);
  playCueForLatestLog();
  redraw();
});

saveGame.addEventListener('click', () => {
  if (farm.pendingAction) {
    farm = addFarmLog(farm, `Finish walking to ${farm.pendingAction.label} before saving.`);
    audio.play('error');
    redraw();
    return;
  }

  localStorage.setItem(saveKey, serializeSave(farm));
  farm = addFarmLog(farm, 'Saved the farm.');
  saveStatus.textContent = 'Saved.';
  audio.play('save');
  redraw();
});

loadGame.addEventListener('click', () => {
  if (farm.pendingAction) {
    farm = addFarmLog(farm, `Finish walking to ${farm.pendingAction.label} before loading.`);
    audio.play('error');
    redraw();
    return;
  }

  const rawSave = localStorage.getItem(saveKey);
  if (!rawSave) {
    farm = addFarmLog(farm, 'No local save found.');
    saveStatus.textContent = 'No save found.';
    audio.play('error');
    redraw();
    return;
  }

  const result = deserializeSave(rawSave);
  if (!result.ok) {
    farm = addFarmLog(farm, result.error);
    saveStatus.textContent = 'Load failed.';
    audio.play('error');
    redraw();
    return;
  }

  farm = addFarmLog(result.state, result.migrated ? 'Loaded and migrated the farm.' : 'Loaded the farm.');
  saveStatus.textContent = result.migrated ? 'Loaded migrated save.' : 'Loaded.';
  audio.play('load');
  redraw();
});

resetGame.addEventListener('click', () => {
  localStorage.removeItem(saveKey);
  farm = addFarmLog(createFarmState(), 'Reset the local save.');
  typedBuffer = '';
  saveStatus.textContent = 'Reset.';
  audio.play('load');
  redraw();
});

for (const control of [mutedControl, musicVolume, ambienceVolume, effectsVolume]) {
  control.addEventListener('input', () => {
    updateAudioSettings(readAudioSettingsFromControls());
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
    const wasPending = Boolean(farm.pendingAction);
    farm = applyTypedWord(farm, typedBuffer);
    if (!wasPending && farm.pendingAction) {
      audio.play('walk');
    } else {
      playCueForLatestLog();
    }
    typedBuffer = '';
    redraw();
    event.preventDefault();
    return;
  }

  if (/^[a-z]$/i.test(event.key)) {
    typedBuffer = normalizeTypedWord(`${typedBuffer}${event.key}`).slice(0, 16);
    audio.play('type');
    redrawHud();
  }
});

app.ticker.add((ticker) => {
  if (!farm.pendingAction) {
    return;
  }

  const hadPendingAction = Boolean(farm.pendingAction);
  farm = advanceFarmTime(farm, ticker.deltaMS / 1000);
  if (hadPendingAction && !farm.pendingAction) {
    playCueForLatestLog();
  }
  redraw();
});

syncAudioControls();
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
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element;
}

function redrawHud(): void {
  dayValue.textContent = String(farm.day);
  coinValue.textContent = String(farm.coins);
  staminaValue.textContent = String(farm.stamina);
  turnipValue.textContent = String(farm.inventory.turnip);
  typedWord.textContent = typedBuffer || '...';

  nextDay.disabled = Boolean(farm.pendingAction);
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

function playCueForLatestLog(): void {
  const cue = cueForLogMessage(farm.log[0] ?? '');

  if (cue) {
    audio.play(cue);
  }
}

function createScene(state: FarmState, typedWord: string): Container {
  if (state.location === 'house') {
    return createHouseInterior(state);
  }

  return createFarmExterior(state, typedWord);
}

function createFarmExterior(state: FarmState, typedWord: string): Container {
  const scene = new Container();
  const width = app.renderer.width;
  const height = app.renderer.height;
  const viewport = createViewport(width, height);

  scene.addChild(rect(0, 0, width, height, 0x8dccd8));

  drawFarmTiles(scene, viewport);
  drawPathPreview(scene, viewport, pathPreviewForState(state, typedWord));
  drawHouse(scene, viewport);
  drawShippingBin(scene, viewport);

  for (const plot of state.plots) {
    const point = worldToScreen(viewport, plot.position);
    const plotSize = viewport.scale * 0.72;
    scene.addChild(rect(point.x - plotSize / 2, point.y - plotSize / 2, plotSize, plotSize, 0x8f5f34));
    scene.addChild(cropMarker(point.x, point.y, plotSize, plot.stage));
  }

  drawPlayer(scene, viewport, state.player);
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

function createHouseInterior(state: FarmState): Container {
  const scene = new Container();
  const width = app.renderer.width;
  const height = app.renderer.height;
  const viewport = createViewport(width, height);

  scene.addChild(rect(0, 0, width, height, 0xd8c49a));
  scene.addChild(rect(0, 0, width, Math.floor(height * 0.18), 0xa96f48));
  scene.addChild(rect(width * 0.18, height * 0.22, width * 0.24, height * 0.18, 0x7f5138));
  scene.addChild(rect(width * 0.58, height * 0.26, width * 0.2, height * 0.14, 0x6d4b36));
  scene.addChild(rect(width * 0.43, height * 0.64, width * 0.14, height * 0.22, 0x3c5f46));

  drawPlayer(scene, viewport, state.player);
  drawTargets(scene, viewport, listWorldTargets(state));

  return scene;
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

  return 0x6b7d4e;
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

function drawPlayer(scene: Container, viewport: Viewport, position: WorldPoint): void {
  const point = worldToScreen(viewport, position);
  const body = new Graphics();

  body.circle(point.x, point.y, viewport.scale * 0.18).fill(0x2f5d46);
  body.circle(point.x, point.y - viewport.scale * 0.18, viewport.scale * 0.13).fill(0xf1c27d);
  body.rect(point.x - viewport.scale * 0.2, point.y - viewport.scale * 0.36, viewport.scale * 0.4, viewport.scale * 0.08).fill(0xf4d35e);

  scene.addChild(body);
}

function drawTargets(scene: Container, viewport: Viewport, targets: WorldTarget[]): void {
  for (const target of targets) {
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
