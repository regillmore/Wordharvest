import { Howl, Howler } from 'howler';

export type AudioCue = 'type' | 'walk' | 'plant' | 'water' | 'harvest' | 'ship' | 'door' | 'day' | 'save' | 'load' | 'error';
export type AudioBed = 'farmMusic' | 'townMusic' | 'festivalMusic' | 'springAmbience' | 'rainAmbience' | 'indoorAmbience';
export type AudioChannel = 'music' | 'ambience' | 'effects';

export interface AudioAssetDefinition {
  fileName: string;
  channel: AudioChannel;
  loop: boolean;
  volume: number;
}

export type AudioBedSelection = Partial<Record<Exclude<AudioChannel, 'effects'>, AudioBed>>;

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

export const audioBedFiles = {
  farmMusic: 'music-farm-loop.wav',
  townMusic: 'music-town-loop.wav',
  festivalMusic: 'music-festival-loop.wav',
  springAmbience: 'ambience-spring-loop.wav',
  rainAmbience: 'ambience-rain-loop.wav',
  indoorAmbience: 'ambience-indoor-loop.wav',
} as const satisfies Record<AudioBed, string>;

export const audioCueDefinitions = {
  type: { fileName: audioCueFiles.type, channel: 'effects', loop: false, volume: 0.85 },
  walk: { fileName: audioCueFiles.walk, channel: 'effects', loop: false, volume: 0.65 },
  plant: { fileName: audioCueFiles.plant, channel: 'effects', loop: false, volume: 0.8 },
  water: { fileName: audioCueFiles.water, channel: 'effects', loop: false, volume: 0.85 },
  harvest: { fileName: audioCueFiles.harvest, channel: 'effects', loop: false, volume: 0.85 },
  ship: { fileName: audioCueFiles.ship, channel: 'effects', loop: false, volume: 0.85 },
  door: { fileName: audioCueFiles.door, channel: 'effects', loop: false, volume: 0.75 },
  day: { fileName: audioCueFiles.day, channel: 'effects', loop: false, volume: 0.9 },
  save: { fileName: audioCueFiles.save, channel: 'effects', loop: false, volume: 0.8 },
  load: { fileName: audioCueFiles.load, channel: 'effects', loop: false, volume: 0.8 },
  error: { fileName: audioCueFiles.error, channel: 'effects', loop: false, volume: 0.8 },
} as const satisfies Record<AudioCue, AudioAssetDefinition>;

export const audioBedDefinitions = {
  farmMusic: { fileName: audioBedFiles.farmMusic, channel: 'music', loop: true, volume: 0.46 },
  townMusic: { fileName: audioBedFiles.townMusic, channel: 'music', loop: true, volume: 0.42 },
  festivalMusic: { fileName: audioBedFiles.festivalMusic, channel: 'music', loop: true, volume: 0.48 },
  springAmbience: { fileName: audioBedFiles.springAmbience, channel: 'ambience', loop: true, volume: 0.38 },
  rainAmbience: { fileName: audioBedFiles.rainAmbience, channel: 'ambience', loop: true, volume: 0.46 },
  indoorAmbience: { fileName: audioBedFiles.indoorAmbience, channel: 'ambience', loop: true, volume: 0.28 },
} as const satisfies Record<AudioBed, AudioAssetDefinition>;

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

  private readonly beds: Record<AudioBed, Howl>;

  private activeBeds: AudioBedSelection = {};

  public constructor(settings: AudioSettings) {
    this.settings = normalizeAudioSettings(settings);
    this.cues = createAuthoredCues();
    this.beds = createAudioBeds();
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
    const definition = audioCueDefinitions[cue];
    const volume = volumeForAudioChannel(this.settings, definition.channel) * definition.volume;

    if (this.settings.muted || volume <= 0) {
      return;
    }

    const sound = this.cues[cue];
    sound.volume(volume);
    sound.play();
  }

  public setBeds(beds: AudioBedSelection): void {
    for (const channel of audioBedChannels) {
      const nextBed = beds[channel];
      const activeBed = this.activeBeds[channel];

      if (activeBed === nextBed) {
        continue;
      }

      if (activeBed) {
        this.beds[activeBed].stop();
      }

      if (nextBed) {
        this.beds[nextBed].volume(this.bedVolume(nextBed));
        this.beds[nextBed].play();
      }
    }

    this.activeBeds = { ...beds };
  }

  private applySettings(settings: AudioSettings): void {
    Howler.mute(settings.muted);
    Howler.volume(1);

    for (const bed of Object.keys(this.beds) as AudioBed[]) {
      this.beds[bed].volume(this.bedVolume(bed));
    }
  }

  private bedVolume(bed: AudioBed): number {
    const definition = audioBedDefinitions[bed];

    return volumeForAudioChannel(this.settings, definition.channel) * definition.volume;
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

  if (message.startsWith('Spring Basket complete')) {
    return 'ship';
  }

  if (message.startsWith('Market Encore complete')) {
    return 'ship';
  }

  if (message.startsWith('Achievement unlocked')) {
    return 'ship';
  }

  if (message.startsWith('Bought')) {
    return 'ship';
  }

  if (message.startsWith('Delivered')) {
    return 'ship';
  }

  if (message.startsWith('Joined')) {
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
  return audioAssetSource(audioCueDefinitions[cue]);
}

export function audioBedSource(bed: AudioBed): string {
  return audioAssetSource(audioBedDefinitions[bed]);
}

export function volumeForAudioChannel(settings: AudioSettings, channel: AudioChannel): number {
  const normalizedSettings = normalizeAudioSettings(settings);

  if (normalizedSettings.muted) {
    return 0;
  }

  if (channel === 'music') {
    return normalizedSettings.musicVolume;
  }

  if (channel === 'ambience') {
    return normalizedSettings.ambienceVolume;
  }

  return normalizedSettings.effectsVolume;
}

function createAuthoredCues(): Record<AudioCue, Howl> {
  return (Object.keys(audioCueFiles) as AudioCue[]).reduce(
    (cues, cue) => ({
      ...cues,
      [cue]: createHowl(audioCueDefinitions[cue], 4),
    }),
    {} as Record<AudioCue, Howl>,
  );
}

function createAudioBeds(): Record<AudioBed, Howl> {
  return (Object.keys(audioBedFiles) as AudioBed[]).reduce(
    (beds, bed) => ({
      ...beds,
      [bed]: createHowl(audioBedDefinitions[bed], 1),
    }),
    {} as Record<AudioBed, Howl>,
  );
}

function createHowl(definition: AudioAssetDefinition, pool: number): Howl {
  return new Howl({
    src: [audioAssetSource(definition)],
    format: ['wav'],
    preload: true,
    html5: false,
    loop: definition.loop,
    pool,
  });
}

function audioAssetSource(definition: Pick<AudioAssetDefinition, 'fileName'>): string {
  return `${baseAssetUrl()}assets/audio/${definition.fileName}`;
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

const audioBedChannels = ['music', 'ambience'] as const satisfies readonly Exclude<AudioChannel, 'effects'>[];
