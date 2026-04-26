import { describe, expect, it } from 'vitest';
import { cueForLogMessage, defaultAudioSettings, deserializeAudioSettings, normalizeAudioSettings, serializeAudioSettings } from './audio';

describe('audio settings', () => {
  it('normalizes partial or invalid settings', () => {
    expect(
      normalizeAudioSettings({
        muted: true,
        musicVolume: 2,
        ambienceVolume: -1,
        effectsVolume: 0.25,
      }),
    ).toEqual({
      muted: true,
      musicVolume: 1,
      ambienceVolume: 0,
      effectsVolume: 0.25,
    });

    expect(normalizeAudioSettings(null)).toEqual(defaultAudioSettings);
  });

  it('serializes and deserializes settings safely', () => {
    const raw = serializeAudioSettings({
      muted: true,
      musicVolume: 0.2,
      ambienceVolume: 0.3,
      effectsVolume: 0.4,
    });

    expect(deserializeAudioSettings(raw)).toEqual({
      muted: true,
      musicVolume: 0.2,
      ambienceVolume: 0.3,
      effectsVolume: 0.4,
    });
    expect(deserializeAudioSettings('not json')).toEqual(defaultAudioSettings);
  });

  it('maps farm log messages to placeholder cues', () => {
    expect(cueForLogMessage('Planted turnip seeds.')).toBe('plant');
    expect(cueForLogMessage('The watering can sings against the soil.')).toBe('water');
    expect(cueForLogMessage('No visible target named "door".')).toBe('error');
    expect(cueForLogMessage('A quiet morning begins.')).toBeNull();
  });
});
