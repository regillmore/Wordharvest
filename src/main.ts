import { Howler } from 'howler';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { advanceDay, applyTypedWord, createFarmState, type CropStage, type FarmState } from './core/gameState';
import { normalizeTypedWord } from './core/typing';
import { doorPosition, housePosition, listWorldTargets, type WorldPoint, type WorldTarget } from './core/worldTargets';
import './style.css';

const root = document.querySelector<HTMLDivElement>('#app');

if (!root) {
  throw new Error('Missing #app root.');
}

let farm = createFarmState();
let typedBuffer = '';

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
      </dl>
      <section class="word-panel" aria-live="polite">
        <p class="label">Typed word</p>
        <p id="typed-word" class="typed-word"></p>
        <p class="label">Nearby words</p>
        <p id="word-preview" class="word-preview"></p>
      </section>
      <section>
        <p class="label">Farm log</p>
        <ol id="farm-log" class="farm-log"></ol>
      </section>
      <footer>
        <button id="next-day" type="button">End Day</button>
      </footer>
    </aside>
  </main>
`;

const canvasHost = requireElement<HTMLDivElement>('#game-canvas');
const dayValue = requireElement<HTMLElement>('#day-value');
const coinValue = requireElement<HTMLElement>('#coin-value');
const staminaValue = requireElement<HTMLElement>('#stamina-value');
const typedWord = requireElement<HTMLElement>('#typed-word');
const wordPreview = requireElement<HTMLElement>('#word-preview');
const farmLog = requireElement<HTMLOListElement>('#farm-log');
const nextDay = requireElement<HTMLButtonElement>('#next-day');

Howler.volume(0.7);

const app = new Application();
await app.init({
  antialias: false,
  background: '#7dbf68',
  resizeTo: canvasHost,
});

canvasHost.appendChild(app.canvas);

nextDay.addEventListener('click', () => {
  farm = advanceDay(farm);
  redraw();
});

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
    farm = applyTypedWord(farm, typedBuffer);
    typedBuffer = '';
    redraw();
    event.preventDefault();
    return;
  }

  if (/^[a-z]$/i.test(event.key)) {
    typedBuffer = normalizeTypedWord(`${typedBuffer}${event.key}`).slice(0, 16);
    redrawHud();
  }
});

redraw();

interface Viewport {
  originX: number;
  originY: number;
  scale: number;
}

function redraw(): void {
  app.stage.removeChildren();
  app.stage.addChild(createScene(farm));
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
  typedWord.textContent = typedBuffer || '...';

  const visibleTargets = listWorldTargets(farm);
  const exactTarget = visibleTargets.find((target) => target.word === normalizeTypedWord(typedBuffer));
  wordPreview.textContent = exactTarget
    ? `Target: ${exactTarget.label}`
    : visibleTargets.map((target) => target.label).join(', ');

  farmLog.innerHTML = farm.log.map((entry) => `<li>${entry}</li>`).join('');
}

function createScene(state: FarmState): Container {
  if (state.location === 'house') {
    return createHouseInterior(state);
  }

  return createFarmExterior(state);
}

function createFarmExterior(state: FarmState): Container {
  const scene = new Container();
  const width = app.renderer.width;
  const height = app.renderer.height;
  const viewport = createViewport(width, height);

  scene.addChild(rect(0, 0, width, height, 0x7dbf68));
  scene.addChild(rect(0, Math.floor(height * 0.66), width, Math.floor(height * 0.34), 0x5f9b59));
  scene.addChild(rect(0, 0, width, Math.floor(height * 0.2), 0x8dccd8));

  drawPath(scene, viewport);
  drawHouse(scene, viewport);

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

function drawPath(scene: Container, viewport: Viewport): void {
  const door = worldToScreen(viewport, doorPosition);
  const lowerFarm = worldToScreen(viewport, { x: 0, y: 5.3 });
  const pathWidth = viewport.scale * 0.48;

  scene.addChild(rect(door.x - pathWidth / 2, door.y, pathWidth, lowerFarm.y - door.y, 0xc8ad72));
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
