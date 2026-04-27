import { Buffer } from 'node:buffer';
import { mkdir, writeFile } from 'node:fs/promises';
import { URL } from 'node:url';

const outputDirectory = new URL('../public/assets/audio/', import.meta.url);
const sampleRate = 22050;

const cueSpecs = [
  {
    fileName: 'type-tick.wav',
    durationSeconds: 0.06,
    voices: [
      { wave: 'triangle', frequency: 1240, durationSeconds: 0.035, volume: 0.3, attackSeconds: 0.002, releaseSeconds: 0.025 },
      { wave: 'noise', seed: 3, durationSeconds: 0.018, volume: 0.05, attackSeconds: 0.001, releaseSeconds: 0.012 },
    ],
  },
  {
    fileName: 'walk-step.wav',
    durationSeconds: 0.16,
    voices: [
      { wave: 'sine', frequency: 150, endFrequency: 95, durationSeconds: 0.11, volume: 0.22, attackSeconds: 0.003, releaseSeconds: 0.09 },
      { wave: 'noise', seed: 8, startSeconds: 0.02, durationSeconds: 0.06, volume: 0.06, attackSeconds: 0.002, releaseSeconds: 0.05 },
    ],
  },
  {
    fileName: 'plant-soft.wav',
    durationSeconds: 0.22,
    voices: [
      { wave: 'triangle', frequency: 330, durationSeconds: 0.16, volume: 0.24, attackSeconds: 0.006, releaseSeconds: 0.12 },
      { wave: 'sine', frequency: 196, startSeconds: 0.04, durationSeconds: 0.12, volume: 0.12, attackSeconds: 0.004, releaseSeconds: 0.08 },
      { wave: 'noise', seed: 11, startSeconds: 0.02, durationSeconds: 0.08, volume: 0.04, attackSeconds: 0.004, releaseSeconds: 0.06 },
    ],
  },
  {
    fileName: 'water-splash.wav',
    durationSeconds: 0.3,
    voices: [
      { wave: 'noise', seed: 14, durationSeconds: 0.16, volume: 0.16, attackSeconds: 0.004, releaseSeconds: 0.14 },
      { wave: 'sine', frequency: 720, endFrequency: 510, startSeconds: 0.03, durationSeconds: 0.13, volume: 0.09, attackSeconds: 0.003, releaseSeconds: 0.1 },
      { wave: 'triangle', frequency: 880, startSeconds: 0.09, durationSeconds: 0.08, volume: 0.06, attackSeconds: 0.002, releaseSeconds: 0.05 },
    ],
  },
  {
    fileName: 'harvest-pop.wav',
    durationSeconds: 0.24,
    voices: [
      { wave: 'triangle', frequency: 440, endFrequency: 690, durationSeconds: 0.13, volume: 0.22, attackSeconds: 0.004, releaseSeconds: 0.09 },
      { wave: 'sine', frequency: 880, startSeconds: 0.09, durationSeconds: 0.08, volume: 0.11, attackSeconds: 0.002, releaseSeconds: 0.06 },
    ],
  },
  {
    fileName: 'ship-chime.wav',
    durationSeconds: 0.42,
    voices: [
      { wave: 'triangle', frequency: 587.33, durationSeconds: 0.18, volume: 0.18, attackSeconds: 0.004, releaseSeconds: 0.12 },
      { wave: 'triangle', frequency: 739.99, startSeconds: 0.09, durationSeconds: 0.18, volume: 0.17, attackSeconds: 0.004, releaseSeconds: 0.12 },
      { wave: 'triangle', frequency: 987.77, startSeconds: 0.18, durationSeconds: 0.18, volume: 0.15, attackSeconds: 0.004, releaseSeconds: 0.12 },
    ],
  },
  {
    fileName: 'door-wood.wav',
    durationSeconds: 0.26,
    voices: [
      { wave: 'sine', frequency: 120, durationSeconds: 0.09, volume: 0.2, attackSeconds: 0.002, releaseSeconds: 0.07 },
      { wave: 'noise', seed: 22, startSeconds: 0.025, durationSeconds: 0.07, volume: 0.08, attackSeconds: 0.002, releaseSeconds: 0.05 },
      { wave: 'sine', frequency: 180, startSeconds: 0.11, durationSeconds: 0.1, volume: 0.12, attackSeconds: 0.004, releaseSeconds: 0.08 },
    ],
  },
  {
    fileName: 'day-bell.wav',
    durationSeconds: 0.55,
    voices: [
      { wave: 'sine', frequency: 392, durationSeconds: 0.42, volume: 0.16, attackSeconds: 0.01, releaseSeconds: 0.32 },
      { wave: 'sine', frequency: 493.88, startSeconds: 0.07, durationSeconds: 0.4, volume: 0.13, attackSeconds: 0.01, releaseSeconds: 0.3 },
      { wave: 'sine', frequency: 659.25, startSeconds: 0.14, durationSeconds: 0.36, volume: 0.11, attackSeconds: 0.01, releaseSeconds: 0.28 },
    ],
  },
  {
    fileName: 'save-chime.wav',
    durationSeconds: 0.26,
    voices: [
      { wave: 'triangle', frequency: 659.25, durationSeconds: 0.12, volume: 0.17, attackSeconds: 0.004, releaseSeconds: 0.08 },
      { wave: 'triangle', frequency: 987.77, startSeconds: 0.08, durationSeconds: 0.13, volume: 0.15, attackSeconds: 0.004, releaseSeconds: 0.08 },
    ],
  },
  {
    fileName: 'load-chime.wav',
    durationSeconds: 0.26,
    voices: [
      { wave: 'triangle', frequency: 987.77, durationSeconds: 0.1, volume: 0.13, attackSeconds: 0.004, releaseSeconds: 0.07 },
      { wave: 'triangle', frequency: 659.25, startSeconds: 0.07, durationSeconds: 0.15, volume: 0.15, attackSeconds: 0.004, releaseSeconds: 0.1 },
    ],
  },
  {
    fileName: 'error-thud.wav',
    durationSeconds: 0.22,
    voices: [
      { wave: 'sine', frequency: 160, endFrequency: 80, durationSeconds: 0.14, volume: 0.22, attackSeconds: 0.002, releaseSeconds: 0.11 },
      { wave: 'square', frequency: 72, startSeconds: 0.03, durationSeconds: 0.07, volume: 0.05, attackSeconds: 0.002, releaseSeconds: 0.05 },
    ],
  },
  {
    fileName: 'music-farm-loop.wav',
    durationSeconds: 2.4,
    voices: [
      { wave: 'triangle', frequency: 261.63, durationSeconds: 2.2, volume: 0.08, attackSeconds: 0.04, releaseSeconds: 0.32 },
      { wave: 'triangle', frequency: 329.63, startSeconds: 0.36, durationSeconds: 1.72, volume: 0.06, attackSeconds: 0.05, releaseSeconds: 0.36 },
      { wave: 'sine', frequency: 392, startSeconds: 0.88, durationSeconds: 1.18, volume: 0.045, attackSeconds: 0.05, releaseSeconds: 0.34 },
    ],
  },
  {
    fileName: 'music-town-loop.wav',
    durationSeconds: 2.4,
    voices: [
      { wave: 'triangle', frequency: 293.66, durationSeconds: 2.1, volume: 0.075, attackSeconds: 0.04, releaseSeconds: 0.3 },
      { wave: 'triangle', frequency: 440, startSeconds: 0.32, durationSeconds: 1.55, volume: 0.055, attackSeconds: 0.05, releaseSeconds: 0.32 },
      { wave: 'sine', frequency: 587.33, startSeconds: 1.02, durationSeconds: 0.9, volume: 0.04, attackSeconds: 0.05, releaseSeconds: 0.28 },
    ],
  },
  {
    fileName: 'music-festival-loop.wav',
    durationSeconds: 2.4,
    voices: [
      { wave: 'triangle', frequency: 392, durationSeconds: 0.7, volume: 0.075, attackSeconds: 0.02, releaseSeconds: 0.18 },
      { wave: 'triangle', frequency: 493.88, startSeconds: 0.44, durationSeconds: 0.72, volume: 0.07, attackSeconds: 0.02, releaseSeconds: 0.18 },
      { wave: 'triangle', frequency: 659.25, startSeconds: 0.9, durationSeconds: 0.8, volume: 0.06, attackSeconds: 0.02, releaseSeconds: 0.22 },
      { wave: 'sine', frequency: 783.99, startSeconds: 1.52, durationSeconds: 0.55, volume: 0.04, attackSeconds: 0.02, releaseSeconds: 0.18 },
    ],
  },
  {
    fileName: 'ambience-spring-loop.wav',
    durationSeconds: 2.4,
    voices: [
      { wave: 'noise', seed: 31, durationSeconds: 2.2, volume: 0.018, attackSeconds: 0.08, releaseSeconds: 0.32 },
      { wave: 'sine', frequency: 1760, startSeconds: 0.46, durationSeconds: 0.16, volume: 0.025, attackSeconds: 0.02, releaseSeconds: 0.08 },
      { wave: 'sine', frequency: 2349.32, startSeconds: 1.26, durationSeconds: 0.12, volume: 0.02, attackSeconds: 0.02, releaseSeconds: 0.07 },
    ],
  },
  {
    fileName: 'ambience-rain-loop.wav',
    durationSeconds: 2.4,
    voices: [
      { wave: 'noise', seed: 44, durationSeconds: 2.3, volume: 0.07, attackSeconds: 0.06, releaseSeconds: 0.3 },
      { wave: 'noise', seed: 47, startSeconds: 0.12, durationSeconds: 2.0, volume: 0.035, attackSeconds: 0.05, releaseSeconds: 0.26 },
      { wave: 'sine', frequency: 610, startSeconds: 0.84, durationSeconds: 0.18, volume: 0.018, attackSeconds: 0.01, releaseSeconds: 0.12 },
    ],
  },
  {
    fileName: 'ambience-indoor-loop.wav',
    durationSeconds: 2.4,
    voices: [
      { wave: 'noise', seed: 58, durationSeconds: 2.2, volume: 0.016, attackSeconds: 0.08, releaseSeconds: 0.32 },
      { wave: 'sine', frequency: 130.81, durationSeconds: 2.1, volume: 0.018, attackSeconds: 0.08, releaseSeconds: 0.34 },
      { wave: 'triangle', frequency: 196, startSeconds: 1.1, durationSeconds: 0.5, volume: 0.018, attackSeconds: 0.06, releaseSeconds: 0.18 },
    ],
  },
];

await mkdir(outputDirectory, { recursive: true });

for (const spec of cueSpecs) {
  await writeFile(new URL(spec.fileName, outputDirectory), renderWav(spec));
}

function renderWav(spec) {
  const sampleCount = Math.max(1, Math.ceil(spec.durationSeconds * sampleRate));
  const samples = new Float32Array(sampleCount);

  for (const voice of spec.voices) {
    renderVoice(samples, voice);
  }

  return encodeWav(samples);
}

function renderVoice(samples, voice) {
  const startSample = Math.floor((voice.startSeconds ?? 0) * sampleRate);
  const durationSamples = Math.max(1, Math.floor(voice.durationSeconds * sampleRate));

  for (let sampleIndex = 0; sampleIndex < durationSamples; sampleIndex += 1) {
    const outputIndex = startSample + sampleIndex;
    if (outputIndex >= samples.length) {
      break;
    }

    const time = sampleIndex / sampleRate;
    const progress = sampleIndex / durationSamples;
    const frequency = lerp(voice.frequency ?? 0, voice.endFrequency ?? voice.frequency ?? 0, progress);
    const envelopeGain = envelope(time, voice.durationSeconds, voice.attackSeconds, voice.releaseSeconds);
    samples[outputIndex] += oscillator(voice.wave, frequency, time, outputIndex, voice.seed ?? 1) * voice.volume * envelopeGain;
  }
}

function oscillator(wave, frequency, time, sampleIndex, seed) {
  if (wave === 'noise') {
    return hashNoise(sampleIndex + seed * 1009);
  }

  const phase = Math.PI * 2 * frequency * time;

  if (wave === 'triangle') {
    return (2 / Math.PI) * Math.asin(Math.sin(phase));
  }

  if (wave === 'square') {
    return Math.sin(phase) >= 0 ? 1 : -1;
  }

  return Math.sin(phase);
}

function envelope(time, durationSeconds, attackSeconds = 0.005, releaseSeconds = 0.08) {
  const attackGain = attackSeconds <= 0 ? 1 : clamp(time / attackSeconds, 0, 1);
  const releaseGain = releaseSeconds <= 0 ? 1 : clamp((durationSeconds - time) / releaseSeconds, 0, 1);

  return Math.min(attackGain, releaseGain);
}

function encodeWav(samples) {
  const byteLength = 44 + samples.length * 2;
  const buffer = Buffer.alloc(byteLength);

  buffer.write('RIFF', 0, 'ascii');
  buffer.writeUInt32LE(byteLength - 8, 4);
  buffer.write('WAVE', 8, 'ascii');
  buffer.write('fmt ', 12, 'ascii');
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(1, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36, 'ascii');
  buffer.writeUInt32LE(samples.length * 2, 40);

  for (let index = 0; index < samples.length; index += 1) {
    const sample = Math.tanh(samples[index] * 1.4);
    buffer.writeInt16LE(Math.round(clamp(sample, -1, 1) * 32767), 44 + index * 2);
  }

  return buffer;
}

function hashNoise(value) {
  const raw = Math.sin(value * 12.9898) * 43758.5453;

  return (raw - Math.floor(raw)) * 2 - 1;
}

function lerp(start, end, amount) {
  return start + (end - start) * amount;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}
