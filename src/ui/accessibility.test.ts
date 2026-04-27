import { describe, expect, it } from 'vitest';
import {
  defaultAccessibilitySettings,
  deserializeAccessibilitySettings,
  normalizeAccessibilitySettings,
  serializeAccessibilitySettings,
} from './accessibility';

describe('accessibility settings', () => {
  it('normalizes invalid and partial settings', () => {
    expect(normalizeAccessibilitySettings(null)).toEqual(defaultAccessibilitySettings);
    expect(
      normalizeAccessibilitySettings({
        typingAssist: true,
        reducedMotion: 'yes',
        readableUi: true,
        visualCues: false,
      }),
    ).toEqual({
      typingAssist: true,
      reducedMotion: false,
      readableUi: true,
      visualCues: false,
    });
  });

  it('defaults visual cues on unless explicitly disabled', () => {
    expect(normalizeAccessibilitySettings({})).toEqual({
      typingAssist: false,
      reducedMotion: false,
      readableUi: false,
      visualCues: true,
    });
  });

  it('serializes and deserializes settings safely', () => {
    const raw = serializeAccessibilitySettings({
      typingAssist: true,
      reducedMotion: true,
      readableUi: true,
      visualCues: false,
    });

    expect(deserializeAccessibilitySettings(raw)).toEqual({
      typingAssist: true,
      reducedMotion: true,
      readableUi: true,
      visualCues: false,
    });
    expect(deserializeAccessibilitySettings('not json')).toEqual(defaultAccessibilitySettings);
  });
});
