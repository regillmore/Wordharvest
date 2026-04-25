export type Direction = 'north' | 'south' | 'east' | 'west';

export type FarmVerb = 'plant' | 'water' | 'harvest' | 'sell' | 'inspect';

export type TypedCommand =
  | { kind: 'move'; direction: Direction; source: string }
  | { kind: 'farm'; verb: FarmVerb; source: string }
  | { kind: 'menu'; menu: 'bag' | 'map' | 'pause'; source: string }
  | { kind: 'unknown'; source: string };

const movementWords: Record<string, Direction> = {
  north: 'north',
  up: 'north',
  south: 'south',
  down: 'south',
  east: 'east',
  right: 'east',
  west: 'west',
  left: 'west',
};

const farmWords: Record<string, FarmVerb> = {
  seed: 'plant',
  plant: 'plant',
  sow: 'plant',
  water: 'water',
  rain: 'water',
  pick: 'harvest',
  reap: 'harvest',
  harvest: 'harvest',
  sell: 'sell',
  ship: 'sell',
  look: 'inspect',
};

const menuWords: Record<string, 'bag' | 'map' | 'pause'> = {
  bag: 'bag',
  pack: 'bag',
  map: 'map',
  pause: 'pause',
};

export function normalizeTypedWord(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z]/g, '');
}

export function parseTypedCommand(input: string): TypedCommand {
  const source = normalizeTypedWord(input);

  if (!source) {
    return { kind: 'unknown', source };
  }

  const direction = movementWords[source];
  if (direction) {
    return { kind: 'move', direction, source };
  }

  const verb = farmWords[source];
  if (verb) {
    return { kind: 'farm', verb, source };
  }

  const menu = menuWords[source];
  if (menu) {
    return { kind: 'menu', menu, source };
  }

  return { kind: 'unknown', source };
}

export function scoreWordProgress(target: string, buffer: string): number {
  const normalizedTarget = normalizeTypedWord(target);
  const normalizedBuffer = normalizeTypedWord(buffer);

  if (!normalizedTarget || !normalizedBuffer) {
    return 0;
  }

  let matchingLetters = 0;
  for (let index = 0; index < normalizedBuffer.length; index += 1) {
    if (normalizedTarget[index] !== normalizedBuffer[index]) {
      break;
    }

    matchingLetters += 1;
  }

  return matchingLetters / normalizedTarget.length;
}
