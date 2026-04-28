import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import { URL } from 'node:url';
import { deflateSync } from 'node:zlib';

const outputDirectory = new URL('../public/assets/sprites/', import.meta.url);
const cellWidth = 32;
const cellHeight = 40;
const directions = ['down', 'up', 'left', 'right'];
const frameNames = directions.flatMap((direction) => [
  `player_idle_${direction}`,
  `player_walk_${direction}_1`,
  `player_walk_${direction}_2`,
]);
const width = cellWidth * frameNames.length;
const height = cellHeight;

const palette = {
  ink: '#172018',
  shirt: '#2f5d46',
  shirtLight: '#3f7358',
  skin: '#f1c27d',
  skinShadow: '#c88758',
  hat: '#f4d35e',
  hatShadow: '#a88a56',
  pants: '#4f3328',
  boot: '#2b332b',
  shadow: '#000000',
};

await mkdir(outputDirectory, { recursive: true });

const image = createImage(width, height);

for (const [directionIndex, direction] of directions.entries()) {
  const frameIndex = directionIndex * 3;

  drawPlayerFrame(image, frameIndex, { footOffset: 0, armOffset: 0, facing: direction });
  drawPlayerFrame(image, frameIndex + 1, { footOffset: -2, armOffset: 1, facing: direction });
  drawPlayerFrame(image, frameIndex + 2, { footOffset: 2, armOffset: -1, facing: direction });
}

await writeFile(new URL('player_base_v001.png', outputDirectory), encodePng(image));
await writeFile(new URL('player_base_v001.json', outputDirectory), `${JSON.stringify(spriteMetadata(), null, 2)}\n`);

function spriteMetadata() {
  return {
    image: 'player_base_v001.png',
    size: { w: width, h: height },
    cell: { w: cellWidth, h: cellHeight },
    authoring: {
      method: 'Hand-authored procedural pixel sheet.',
      source: 'scripts/write-sprite-assets.mjs',
      styleGuide: 'docs/STYLE_GUIDE.md',
    },
    frames: Object.fromEntries(
      frameNames.map((name, index) => [
        name,
        {
          frame: { x: index * cellWidth, y: 0, w: cellWidth, h: cellHeight },
          anchor: { x: 0.5, y: 0.82 },
        },
      ]),
    ),
  };
}

function drawPlayerFrame(image, frameIndex, options) {
  const originX = frameIndex * cellWidth;
  const cx = originX + 16;
  const y = 0;
  const leftFoot = options.footOffset < 0 ? -2 : 0;
  const rightFoot = options.footOffset > 0 ? 2 : 0;

  fillEllipse(image, cx, y + 34, 9, 3, palette.shadow, 70);

  if (options.facing === 'left' || options.facing === 'right') {
    drawSidePlayerFrame(image, cx, y, options, options.facing === 'left' ? -1 : 1);
    return;
  }

  fillRect(image, cx - 6 + leftFoot, y + 27, 5, 5, palette.boot);
  fillRect(image, cx + 1 + rightFoot, y + 27, 5, 5, palette.boot);
  fillRect(image, cx - 7, y + 22, 6, 7, palette.pants);
  fillRect(image, cx + 1, y + 22, 6, 7, palette.pants);

  fillRect(image, cx - 7, y + 16, 14, 10, palette.shirt);
  fillRect(image, cx - 5, y + 15, 10, 2, palette.shirtLight);
  fillRect(image, cx - 9, y + 18 + options.armOffset, 3, 8, palette.skin);
  fillRect(image, cx + 6, y + 18 - options.armOffset, 3, 8, palette.skin);

  if (options.facing === 'up') {
    fillRect(image, cx - 6, y + 8, 12, 8, palette.hatShadow);
    fillRect(image, cx - 10, y + 9, 20, 4, palette.hat);
    fillRect(image, cx - 7, y + 5, 14, 5, palette.hat);
    fillRect(image, cx - 5, y + 11, 10, 6, palette.ink, 180);
    return;
  }

  fillRect(image, cx - 6, y + 8, 12, 9, palette.skin);
  fillRect(image, cx - 6, y + 14, 12, 3, palette.skinShadow);
  fillRect(image, cx - 4, y + 11, 2, 2, palette.ink);
  fillRect(image, cx + 2, y + 11, 2, 2, palette.ink);
  fillRect(image, cx - 2, y + 15, 4, 1, palette.ink, 170);
  fillRect(image, cx - 10, y + 7, 20, 4, palette.hat);
  fillRect(image, cx - 7, y + 3, 14, 6, palette.hat);
  fillRect(image, cx - 5, y + 3, 10, 2, '#fff5cf');
}

function drawSidePlayerFrame(image, cx, y, options, directionSign) {
  const backFoot = options.footOffset < 0 ? -2 : 0;
  const frontFoot = options.footOffset > 0 ? 2 : 0;
  const faceEdge = directionSign > 0 ? 4 : -8;
  const noseX = directionSign > 0 ? cx + 6 : cx - 7;
  const eyeX = directionSign > 0 ? cx + 3 : cx - 4;
  const brimX = directionSign > 0 ? cx - 3 : cx - 10;
  const highlightX = directionSign > 0 ? cx - 3 : cx - 5;

  fillRect(image, cx - 5 + backFoot, y + 27, 5, 5, palette.boot);
  fillRect(image, cx + 1 + frontFoot, y + 27, 5, 5, palette.boot);
  fillRect(image, cx - 5, y + 22, 5, 7, palette.pants);
  fillRect(image, cx + 1, y + 22, 5, 7, palette.pants);

  fillRect(image, cx - 6, y + 16, 12, 10, palette.shirt);
  fillRect(image, cx - 4, y + 15, 8, 2, palette.shirtLight);
  fillRect(image, cx - 7 - directionSign, y + 18 - options.armOffset, 3, 8, palette.skin);
  fillRect(image, cx + 4 + directionSign, y + 18 + options.armOffset, 3, 8, palette.skinShadow);

  fillRect(image, cx + faceEdge, y + 8, 4, 9, palette.skinShadow);
  fillRect(image, cx - 5, y + 8, 11, 9, palette.skin);
  fillRect(image, noseX, y + 12, 2, 2, palette.skinShadow);
  fillRect(image, eyeX, y + 11, 2, 2, palette.ink);
  fillRect(image, cx - 8, y + 7, 16, 4, palette.hat);
  fillRect(image, brimX, y + 8, 8, 3, palette.hat);
  fillRect(image, cx - 6, y + 3, 12, 6, palette.hat);
  fillRect(image, highlightX, y + 3, 8, 2, '#fff5cf');
}

function createImage(imageWidth, imageHeight) {
  return {
    width: imageWidth,
    height: imageHeight,
    data: new Uint8Array(imageWidth * imageHeight * 4),
  };
}

function fillRect(image, x, y, rectWidth, rectHeight, color, alpha = 255) {
  const [r, g, b] = hexToRgb(color);

  for (let yy = y; yy < y + rectHeight; yy += 1) {
    for (let xx = x; xx < x + rectWidth; xx += 1) {
      setPixel(image, xx, yy, r, g, b, alpha);
    }
  }
}

function fillEllipse(image, cx, cy, rx, ry, color, alpha = 255) {
  const [r, g, b] = hexToRgb(color);

  for (let yy = Math.floor(cy - ry); yy <= Math.ceil(cy + ry); yy += 1) {
    for (let xx = Math.floor(cx - rx); xx <= Math.ceil(cx + rx); xx += 1) {
      const dx = (xx - cx) / rx;
      const dy = (yy - cy) / ry;

      if (dx * dx + dy * dy <= 1) {
        setPixel(image, xx, yy, r, g, b, alpha);
      }
    }
  }
}

function setPixel(image, x, y, r, g, b, a) {
  if (x < 0 || y < 0 || x >= image.width || y >= image.height) {
    return;
  }

  const index = (y * image.width + x) * 4;
  image.data[index] = r;
  image.data[index + 1] = g;
  image.data[index + 2] = b;
  image.data[index + 3] = a;
}

function encodePng(image) {
  const scanlineLength = image.width * 4 + 1;
  const raw = Buffer.alloc(scanlineLength * image.height);

  for (let y = 0; y < image.height; y += 1) {
    const rawOffset = y * scanlineLength;
    raw[rawOffset] = 0;
    Buffer.from(image.data.subarray(y * image.width * 4, (y + 1) * image.width * 4)).copy(raw, rawOffset + 1);
  }

  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    pngChunk('IHDR', ihdrData(image.width, image.height)),
    pngChunk('IDAT', deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

function ihdrData(imageWidth, imageHeight) {
  const data = Buffer.alloc(13);

  data.writeUInt32BE(imageWidth, 0);
  data.writeUInt32BE(imageHeight, 4);
  data[8] = 8;
  data[9] = 6;
  data[10] = 0;
  data[11] = 0;
  data[12] = 0;

  return data;
}

function pngChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const lengthBuffer = Buffer.alloc(4);
  const crcBuffer = Buffer.alloc(4);

  lengthBuffer.writeUInt32BE(data.length, 0);
  crcBuffer.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);

  return Buffer.concat([lengthBuffer, typeBuffer, data, crcBuffer]);
}

function crc32(buffer) {
  let crc = 0xffffffff;

  for (const byte of buffer) {
    crc ^= byte;

    for (let bit = 0; bit < 8; bit += 1) {
      crc = crc & 1 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1;
    }
  }

  return (crc ^ 0xffffffff) >>> 0;
}

function hexToRgb(hex) {
  const normalized = hex.replace('#', '');

  return [
    Number.parseInt(normalized.slice(0, 2), 16),
    Number.parseInt(normalized.slice(2, 4), 16),
    Number.parseInt(normalized.slice(4, 6), 16),
  ];
}
