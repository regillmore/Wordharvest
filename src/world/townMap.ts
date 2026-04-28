import type { WorldPoint } from '../core/worldTargets';

export type TownTileKind = 'grass' | 'path' | 'plaza' | 'foundation' | 'flower' | 'water' | 'fence';

export interface TownTile {
  x: number;
  y: number;
  kind: TownTileKind;
}

export interface TownMapBounds {
  minX: number;
  minY: number;
  width: number;
  height: number;
}

export const townMapBounds: TownMapBounds = {
  minX: -4,
  minY: 0,
  width: 9,
  height: 8,
};

const tileRows = [
  'xgfffgggx',
  'xgfffbbgx',
  'xpppppppx',
  'xppqqqppx',
  'xgpqqqpgx',
  'xgpppppgx',
  'xggpppggx',
  'xxxpppxxx',
] as const;

const tileLegend: Record<string, TownTileKind> = {
  g: 'grass',
  p: 'path',
  q: 'plaza',
  f: 'foundation',
  b: 'flower',
  w: 'water',
  x: 'fence',
};

const townTileKinds = new Set<TownTileKind>(Object.values(tileLegend));

export const townTiles: TownTile[] = tileRows.flatMap((row, rowIndex) =>
  [...row].map((symbol, columnIndex) => ({
    x: townMapBounds.minX + columnIndex,
    y: townMapBounds.minY + rowIndex,
    kind: tileKindForSymbol(symbol),
  })),
);

export function townTileAt(point: WorldPoint): TownTile | undefined {
  const tileX = Math.round(point.x);
  const tileY = Math.round(point.y);

  return townTiles.find((tile) => tile.x === tileX && tile.y === tileY);
}

export function isTownTileKind(kind: string): kind is TownTileKind {
  return townTileKinds.has(kind as TownTileKind);
}

function tileKindForSymbol(symbol: string): TownTileKind {
  const kind = tileLegend[symbol];

  if (!kind) {
    throw new Error(`Unknown town tile symbol: ${symbol}`);
  }

  return kind;
}
