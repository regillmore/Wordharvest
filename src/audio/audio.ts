import { Howl, Howler } from 'howler';

export type AudioCue = 'type' | 'walk' | 'plant' | 'water' | 'harvest' | 'ship' | 'door' | 'day' | 'save' | 'load' | 'error';

export const audioCueFiles = {
  type: 'type-tick.wav',
  walk: 'walk-step.wav',
  plant: 'plant-soft.wav',
  water: 'water-splash.wav',
  harvest: 'harvest-pop.wav',
  ship: 'ship-chime.wav',
  door: 'door-wood.wav',
  day: 'day-bell.wav',
  save: 'save-chime.wav',
  load: 'load-chime.wav',
  error: 'error-thud.wav',
} as const satisfies Record<AudioCue, string>;

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
    this.cues = createAuthoredCues();
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

export function audioCueSource(cue: AudioCue): string {
  return `${baseAssetUrl()}assets/audio/${audioCueFiles[cue]}`;
}

function createAuthoredCues(): Record<AudioCue, Howl> {
  return (Object.keys(audioCueFiles) as AudioCue[]).reduce(
    (cues, cue) => ({
      ...cues,
      [cue]: new Howl({
        src: [audioCueSource(cue)],
        format: ['wav'],
        preload: true,
        html5: false,
        pool: 4,
      }),
    }),
    {} as Record<AudioCue, Howl>,
  );
}

function baseAssetUrl(): string {
  const baseUrl = import.meta.env.BASE_URL || '/';

  return baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
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
