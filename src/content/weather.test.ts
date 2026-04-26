import { describe, expect, it } from 'vitest';
import {
  forecastForDay,
  isWeatherId,
  validateWeatherCatalog,
  weatherCatalog,
  weatherDefinition,
  weatherForDay,
} from './weather';

describe('weather catalog', () => {
  it('passes catalog validation', () => {
    expect(validateWeatherCatalog()).toEqual({ ok: true, errors: [] });
  });

  it('defines sunny and rain weather behavior', () => {
    expect(weatherCatalog.map((definition) => definition.id)).toEqual(['sunny', 'rain']);
    expect(weatherDefinition('sunny').watersCrops).toBe(false);
    expect(weatherDefinition('rain').watersCrops).toBe(true);
  });

  it('uses a deterministic Spring forecast pattern', () => {
    expect(weatherForDay(1)).toBe('sunny');
    expect(forecastForDay(1)).toBe('sunny');
    expect(weatherForDay(3)).toBe('rain');
    expect(forecastForDay(5)).toBe('rain');
  });

  it('recognizes authored weather ids', () => {
    expect(isWeatherId('sunny')).toBe(true);
    expect(isWeatherId('rain')).toBe(true);
    expect(isWeatherId('hail')).toBe(false);
  });
});
