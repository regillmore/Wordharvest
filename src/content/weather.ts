export type WeatherId = 'sunny' | 'rain';

export interface WeatherDefinition {
  id: WeatherId;
  name: string;
  forecastLabel: string;
  dawnPhrase: string;
  watersCrops: boolean;
}

export interface WeatherCatalogValidationResult {
  ok: boolean;
  errors: string[];
}

export const weatherCatalog = [
  {
    id: 'sunny',
    name: 'Sunny',
    forecastLabel: 'sunny',
    dawnPhrase: 'sunny',
    watersCrops: false,
  },
  {
    id: 'rain',
    name: 'Rain',
    forecastLabel: 'rain',
    dawnPhrase: 'with rain',
    watersCrops: true,
  },
] as const satisfies readonly WeatherDefinition[];

const springWeatherPattern: readonly WeatherId[] = ['sunny', 'sunny', 'rain', 'sunny', 'sunny', 'rain', 'sunny'];
const weatherById = new Map<WeatherId, WeatherDefinition>(weatherCatalog.map((definition) => [definition.id, definition]));

export function weatherDefinition(weatherId: WeatherId): WeatherDefinition {
  const definition = weatherById.get(weatherId);

  if (!definition) {
    throw new Error(`Missing weather definition: ${weatherId}`);
  }

  return definition;
}

export function weatherForDay(day: number): WeatherId {
  const dayIndex = Math.max(1, Math.floor(day)) - 1;

  return springWeatherPattern[dayIndex % springWeatherPattern.length] ?? 'sunny';
}

export function forecastForDay(day: number): WeatherId {
  return weatherForDay(day + 1);
}

export function isWeatherId(value: unknown): value is WeatherId {
  return typeof value === 'string' && weatherById.has(value as WeatherId);
}

export function validateWeatherCatalog(): WeatherCatalogValidationResult {
  const errors: string[] = [];
  const seenIds = new Set<WeatherId>();

  for (const weather of weatherCatalog) {
    const definition: WeatherDefinition = weather;

    if (seenIds.has(definition.id)) {
      errors.push(`Duplicate weather id: ${definition.id}`);
    }
    seenIds.add(definition.id);

    if (!definition.name || !definition.forecastLabel || !definition.dawnPhrase) {
      errors.push(`Weather ${definition.id} is missing display text.`);
    }
  }

  for (const requiredWeather of requiredWeatherIds) {
    if (!seenIds.has(requiredWeather)) {
      errors.push(`Missing required weather id: ${requiredWeather}`);
    }
  }

  for (const patternWeather of springWeatherPattern) {
    if (!seenIds.has(patternWeather)) {
      errors.push(`Spring pattern references missing weather id: ${patternWeather}`);
    }
  }

  return {
    ok: errors.length === 0,
    errors,
  };
}

const requiredWeatherIds: readonly WeatherId[] = ['sunny', 'rain'];
