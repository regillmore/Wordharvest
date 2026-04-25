import { Howler } from 'howler';
import { Application, Container, Graphics, Text } from 'pixi.js';
import { advanceDay, applyTypedWord, createFarmState, type FarmState } from './core/gameState';
import { normalizeTypedWord, parseTypedCommand } from './core/typing';
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

function redraw(): void {
  app.stage.removeChildren();
  app.stage.addChild(createFarmScene(farm));
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

  const preview = parseTypedCommand(typedBuffer);
  wordPreview.textContent =
    preview.kind === 'unknown'
      ? 'Try seed, water, pick, sell, north, south, east, or west.'
      : `${preview.kind}: ${preview.source}`;

  farmLog.innerHTML = farm.log.map((entry) => `<li>${entry}</li>`).join('');
}

function createFarmScene(state: FarmState): Container {
  const scene = new Container();
  const width = app.renderer.width;
  const height = app.renderer.height;
  const plotSize = Math.max(64, Math.min(104, Math.floor(width / 8)));
  const gap = 14;
  const totalWidth = plotSize * 3 + gap * 2;
  const startX = Math.max(24, Math.floor((width - totalWidth) / 2));
  const startY = Math.max(72, Math.floor((height - plotSize * 2 - gap) / 2));

  scene.addChild(rect(0, 0, width, height, 0x7dbf68));
  scene.addChild(rect(0, Math.floor(height * 0.62), width, Math.floor(height * 0.38), 0x5f9b59));
  scene.addChild(rect(0, 0, width, 64, 0x8dccd8));

  state.plots.forEach((plot, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    const x = startX + column * (plotSize + gap);
    const y = startY + row * (plotSize + gap);
    const selected = plot.id === state.selectedPlotId;

    scene.addChild(rect(x - 4, y - 4, plotSize + 8, plotSize + 8, selected ? 0xffd166 : 0x6d8a48));
    scene.addChild(rect(x, y, plotSize, plotSize, 0x8f5f34));
    scene.addChild(cropMarker(x, y, plotSize, plot.stage));
  });

  scene.addChild(
    new Text({
      text: 'Type a word, then press Enter or Space.',
      style: {
        fill: '#1d2b22',
        fontFamily: 'Georgia, serif',
        fontSize: 18,
      },
      x: 24,
      y: 22,
    }),
  );

  return scene;
}

function rect(x: number, y: number, width: number, height: number, color: number): Graphics {
  return new Graphics().rect(x, y, width, height).fill(color);
}

function cropMarker(x: number, y: number, size: number, stage: string): Graphics {
  const marker = new Graphics();
  const centerX = x + size / 2;
  const centerY = y + size / 2;

  if (stage === 'empty') {
    marker.moveTo(x + 12, centerY).lineTo(x + size - 12, centerY).stroke({ color: 0x734626, width: 3 });
    return marker;
  }

  marker.circle(centerX, centerY, stage === 'ripe' ? size * 0.22 : size * 0.14);
  marker.fill(stage === 'ripe' ? 0xf4d35e : 0x2f7d32);

  if (stage === 'leaf' || stage === 'ripe') {
    marker.ellipse(centerX - 12, centerY + 8, 16, 8).fill(0x3fa34d);
    marker.ellipse(centerX + 12, centerY + 8, 16, 8).fill(0x3fa34d);
  }

  return marker;
}
