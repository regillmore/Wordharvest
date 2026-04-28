import type { WorldPoint } from '../core/worldTargets';
import { farmTileAt, type FarmTile, type FarmTileKind } from './farmMap';

export interface PathResult {
  ok: boolean;
  path: WorldPoint[];
}

const walkableTileKinds: ReadonlySet<FarmTileKind> = new Set(['grass', 'meadow', 'path', 'soil']);

export function isWalkableFarmTile(tile: FarmTile | undefined): boolean {
  return Boolean(tile && walkableTileKinds.has(tile.kind));
}

export function findFarmPath(origin: WorldPoint, destination: WorldPoint): PathResult {
  const start = pointToTilePoint(origin);
  const goal = pointToTilePoint(destination);
  const startTile = farmTileAt(start);
  const goalTile = farmTileAt(goal);

  if (!isWalkableFarmTile(startTile) || !isWalkableFarmTile(goalTile)) {
    return { ok: false, path: [] };
  }

  if (start.x === goal.x && start.y === goal.y) {
    return { ok: true, path: pointsEqual(origin, destination) ? [] : [destination] };
  }

  const frontier: WorldPoint[] = [start];
  const cameFrom = new Map<string, string | null>([[pointKey(start), null]]);

  while (frontier.length > 0) {
    const current = frontier.shift();

    if (!current) {
      break;
    }

    if (current.x === goal.x && current.y === goal.y) {
      break;
    }

    for (const neighbor of walkableNeighbors(current)) {
      const key = pointKey(neighbor);

      if (!cameFrom.has(key)) {
        frontier.push(neighbor);
        cameFrom.set(key, pointKey(current));
      }
    }
  }

  if (!cameFrom.has(pointKey(goal))) {
    return { ok: false, path: [] };
  }

  const tilePath = reconstructPath(goal, cameFrom).slice(1);
  const intermediateTilePath = tilePath.slice(0, -1);
  const path = intermediateTilePath.map(tilePointToWorldPoint);
  const lastPoint = path[path.length - 1];

  if (!lastPoint || !pointsEqual(lastPoint, destination)) {
    path.push(destination);
  }

  return { ok: true, path };
}

export function pointToTilePoint(point: WorldPoint): WorldPoint {
  return {
    x: Math.round(point.x),
    y: Math.round(point.y),
  };
}

function walkableNeighbors(point: WorldPoint): WorldPoint[] {
  const candidates = [
    { x: point.x, y: point.y - 1 },
    { x: point.x + 1, y: point.y },
    { x: point.x, y: point.y + 1 },
    { x: point.x - 1, y: point.y },
  ];

  return candidates.filter((candidate) => isWalkableFarmTile(farmTileAt(candidate)));
}

function reconstructPath(goal: WorldPoint, cameFrom: Map<string, string | null>): WorldPoint[] {
  const path: WorldPoint[] = [goal];
  let currentKey = pointKey(goal);

  while (cameFrom.get(currentKey)) {
    const previousKey = cameFrom.get(currentKey);

    if (!previousKey) {
      break;
    }

    path.push(pointFromKey(previousKey));
    currentKey = previousKey;
  }

  return path.reverse();
}

function tilePointToWorldPoint(point: WorldPoint): WorldPoint {
  return { ...point };
}

function pointKey(point: WorldPoint): string {
  return `${point.x},${point.y}`;
}

function pointFromKey(key: string): WorldPoint {
  const [x, y] = key.split(',').map(Number);

  return { x: x ?? 0, y: y ?? 0 };
}

function pointsEqual(left: WorldPoint, right: WorldPoint): boolean {
  return left.x === right.x && left.y === right.y;
}

export function walkableFarmTileKinds(): readonly FarmTileKind[] {
  return [...walkableTileKinds];
}
