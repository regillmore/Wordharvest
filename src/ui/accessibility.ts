export interface AccessibilitySettings {
  typingAssist: boolean;
  reducedMotion: boolean;
  readableUi: boolean;
  visualCues: boolean;
}

export const defaultAccessibilitySettings: AccessibilitySettings = {
  typingAssist: false,
  reducedMotion: false,
  readableUi: false,
  visualCues: true,
};

export function normalizeAccessibilitySettings(value: unknown): AccessibilitySettings {
  if (!isRecord(value)) {
    return { ...defaultAccessibilitySettings };
  }

  return {
    typingAssist: value.typingAssist === true,
    reducedMotion: value.reducedMotion === true,
    readableUi: value.readableUi === true,
    visualCues: value.visualCues !== false,
  };
}

export function serializeAccessibilitySettings(settings: AccessibilitySettings): string {
  return JSON.stringify(normalizeAccessibilitySettings(settings));
}

export function deserializeAccessibilitySettings(rawSettings: string | null): AccessibilitySettings {
  if (!rawSettings) {
    return { ...defaultAccessibilitySettings };
  }

  try {
    return normalizeAccessibilitySettings(JSON.parse(rawSettings));
  } catch {
    return { ...defaultAccessibilitySettings };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
