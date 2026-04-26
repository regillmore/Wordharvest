# Runtime Audio

These WAV files are tiny authored prototype cues used by Howler at runtime.

Source:

- `scripts/write-audio-assets.mjs` defines the cue names, simple synth voices, envelopes, and durations.
- Run `npm run assets:audio` after editing that script to regenerate the WAV exports.

Cue intent:

- `type-tick.wav`: crisp keypress tick.
- `walk-step.wav`: soft step on packed soil.
- `plant-soft.wav`: seed pressed into earth.
- `water-splash.wav`: short watering splash.
- `harvest-pop.wav`: bright crop pickup.
- `ship-chime.wav`: sale/coin chime.
- `door-wood.wav`: farmhouse door action.
- `day-bell.wav`: new morning cue.
- `save-chime.wav`: saved game cue.
- `load-chime.wav`: loaded game cue.
- `error-thud.wav`: blocked or invalid action.
