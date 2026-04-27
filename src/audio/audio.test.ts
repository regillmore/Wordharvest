import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  audioCueFiles,
  audioCueSource,
  cueForLogMessage,
  defaultAudioSettings,
  deserializeAudioSettings,
  normalizeAudioSettings,
  serializeAudioSettings,
  type AudioCue,
} from './audio';

const allCues: AudioCue[] = ['type', 'walk', 'plant', 'water', 'harvest', 'ship', 'door', 'day', 'save', 'load', 'error'];

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

  it('maps farm log messages to authored cues', () => {
    expect(cueForLogMessage('Planted turnip seeds.')).toBe('plant');
    expect(cueForLogMessage('The watering can sings against the soil.')).toBe('water');
    expect(cueForLogMessage('Bought 2 radish seeds for 8 coins.')).toBe('ship');
    expect(cueForLogMessage("Delivered 1 turnip for Mira's Pantry Turnip request. Reward: 6 coins.")).toBe('ship');
    expect(cueForLogMessage('Spring Basket complete! Mira added 25 coins for the market table.')).toBe('ship');
    expect(cueForLogMessage('No visible target named "door".')).toBe('error');
    expect(cueForLogMessage('A quiet morning begins.')).toBeNull();
  });

  it('registers authored wav files for every cue', () => {
    expect(Object.keys(audioCueFiles).sort()).toEqual([...allCues].sort());
    expect(new Set(Object.values(audioCueFiles)).size).toBe(allCues.length);

    for (const cue of allCues) {
      const fileName = audioCueFiles[cue];

      expect(fileName.endsWith('.wav')).toBe(true);
      expect(audioCueSource(cue)).toBe(`/assets/audio/${fileName}`);
      expect(existsSync(resolve(process.cwd(), 'public/assets/audio', fileName))).toBe(true);
    }
  });
});
