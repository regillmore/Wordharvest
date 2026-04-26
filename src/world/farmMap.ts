import type { WorldPoint } from '../core/worldTargets';

export type FarmTileKind = 'grass' | 'meadow' | 'path' | 'soil' | 'foundation' | 'water' | 'fence';

export interface FarmTile {
  x: number;
  y: number;
  kind: FarmTileKind;
}

export interface FarmMapBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export const farmMapBounds: FarmMapBounds = {
  minX: -4,
  minY: -1,
  width: 9,
  height: 8,
};

const tileRows = [
  'gggffgggg',
  'ggffffggg',
  'gggppgggg',
  'gmmpppggg',
  'gmsssppgg',
  'gmsssppgg',
  'gggppggwg',
  'gggppgwww',
] as const;

const tileLegend: Record<string, FarmTileKind> = {
  g: 'grass',
  m: 'meadow',
  p: 'path',
  s: 'soil',
  f: 'foundation',
  w: 'water',
};

export const farmTiles: FarmTile[] = tileRows.flatMap((row, rowIndex) =>
  [...row].map((symbol, columnIndex) => ({
    x: farmMapBounds.minX + columnIndex,
    y: farmMapBounds.minY + rowIndex,
    kind: tileKindForSymbol(symbol),
  })),
);

export function farmTileAt(point: WorldPoint): FarmTile | undefined {
  const tileX = Math.round(point.x);
  const tileY = Math.round(point.y);

  return farmTiles.find((tile) => tile.x === tileX && tile.y === tileY);
}

export function isFarmTileKind(kind: string): kind is FarmTileKind {
  return Object.values(tileLegend).includes(kind as FarmTileKind) || kind === 'fence';
}

function tileKindForSymbol(symbol: string): FarmTileKind {
  const kind = tileLegend[symbol];

  if (!kind) {
    throw new Error(`Unknown farm tile symbol: ${symbol}`);
  }

  return kind;
}
