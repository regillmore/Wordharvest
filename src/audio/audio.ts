import { Howl, Howler } from 'howler';

export type AudioCue = 'type' | 'walk' | 'plant' | 'water' | 'harvest' | 'ship' | 'door' | 'day' | 'save' | 'load' | 'error';

export interface AudioSettings {
  muted: boolean;
  musicVolume: number;
  ambienceVolume: number;
  effectsVolume: number;
}

export const defaultAudioSettings: AudioSettings = {
  muted: false,
  musicVolume: 0.45,
  ambienceVolume: 0.35,
  effectsVolume: 0.7,
};

export function normalizeAudioSettings(value: unknown): AudioSettings {
  if (!isRecord(value)) {
    return defaultAudioSettings;
  }

  return {
    muted: value.muted === true,
    musicVolume: readVolume(value.musicVolume, defaultAudioSettings.musicVolume),
    ambienceVolume: readVolume(value.ambienceVolume, defaultAudioSettings.ambienceVolume),
    effectsVolume: readVolume(value.effectsVolume, defaultAudioSettings.effectsVolume),
  };
}

export function serializeAudioSettings(settings: AudioSettings): string {
  return JSON.stringify(normalizeAudioSettings(settings));
}

export function deserializeAudioSettings(rawSettings: string | null): AudioSettings {
  if (!rawSettings) {
    return defaultAudioSettings;
  }

  try {
    return normalizeAudioSettings(JSON.parse(rawSettings));
  } catch {
    return defaultAudioSettings;
  }
}

export class AudioSystem {
  private settings: AudioSettings;

  private readonly cues: Record<AudioCue, Howl>;

  public constructor(settings: AudioSettings) {
    this.settings = normalizeAudioSettings(settings);
    this.cues = createPlaceholderCues();
    this.applySettings(this.settings);
  }

  public updateSettings(settings: AudioSettings): void {
    this.settings = normalizeAudioSettings(settings);
    this.applySettings(this.settings);
  }

  public getSettings(): AudioSettings {
    return this.settings;
  }

  public play(cue: AudioCue): void {
    if (this.settings.muted || this.settings.effectsVolume <= 0) {
      return;
    }

    const sound = this.cues[cue];
    sound.volume(this.settings.effectsVolume);
    sound.play();
  }

  private applySettings(settings: AudioSettings): void {
    Howler.mute(settings.muted);
    Howler.volume(Math.max(settings.musicVolume, settings.ambienceVolume, settings.effectsVolume));
  }
}

export function cueForLogMessage(message: string): AudioCue | null {
  if (message.startsWith('Planted')) {
    return 'plant';
  }

  if (message.startsWith('The watering can')) {
    return 'water';
  }

  if (message.startsWith('Harvested')) {
    return 'harvest';
  }

  if (message.startsWith('Shipped')) {
    return 'ship';
  }

  if (message.startsWith('Opened') || message.startsWith('Stepped')) {
    return 'door';
  }

  if (message.startsWith('Day ')) {
    return 'day';
  }

  if (message.includes('No ') || message.includes('empty') || message.includes('Finish walking')) {
    return 'error';
  }

  return null;
}

function createPlaceholderCues(): Record<AudioCue, Howl> {
  return {
    type: cue(880, 0.035, 0.18),
    walk: cue(330, 0.07, 0.14),
    plant: cue(392, 0.12, 0.22),
    water: cue(523, 0.14, 0.2),
    harvest: cue(659, 0.16, 0.22),
    ship: cue(784, 0.2, 0.24),
    door: cue(294, 0.14, 0.18),
    day: cue(440, 0.22, 0.18),
    save: cue(698, 0.12, 0.18),
    load: cue(587, 0.12, 0.18),
    error: cue(196, 0.12, 0.2),
  };
}

function cue(frequency: number, durationSeconds: number, gain: number): Howl {
  return new Howl({
    src: [createToneDataUri(frequency, durationSeconds, gain)],
    format: ['wav'],
    preload: true,
    html5: false,
  });
}

function createToneDataUri(frequency: number, durationSeconds: number, gain: number): string {
  const sampleRate = 8000;
  const sampleCount = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const byteLength = 44 + sampleCount * 2;
  const bytes = new Uint8Array(byteLength);
  const view = new DataView(bytes.buffer);

  writeAscii(bytes, 0, 'RIFF');
  view.setUint32(4, byteLength - 8, true);
  writeAscii(bytes, 8, 'WAVE');
  writeAscii(bytes, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeAscii(bytes, 36, 'data');
  view.setUint32(40, sampleCount * 2, true);

  for (let index = 0; index < sampleCount; index += 1) {
    const time = index / sampleRate;
    const fade = Math.min(1, (sampleCount - index) / Math.max(1, sampleCount * 0.25));
    const sample = Math.sin(Math.PI * 2 * frequency * time) * gain * fade;
    view.setInt16(44 + index * 2, Math.floor(sample * 32767), true);
  }

  return `data:audio/wav;base64,${base64Encode(bytes)}`;
}

function writeAscii(bytes: Uint8Array, offset: number, value: string): void {
  for (let index = 0; index < value.length; index += 1) {
    bytes[offset + index] = value.charCodeAt(index);
  }
}

function base64Encode(bytes: Uint8Array): string {
  let binary = '';

  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary);
}

function readVolume(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(value, 0, 1) : fallback;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
