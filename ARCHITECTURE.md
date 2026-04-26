# Architecture

## Principles

- Static-first: the game must build to files that GitHub Pages can host without a backend.
- Deterministic core: farm simulation, typing interpretation, progression, economy, and save migration live in pure TypeScript modules that can be tested without a browser.
- Thin adapters: rendering, audio, storage, and DOM UI wrap the deterministic core instead of owning game rules.
- Data-driven content: crops, words, quests, recipes, achievements, villagers, sounds, and maps should move toward typed data catalogs as soon as they stabilize.
- Cozy performance: target desktop browsers first with stable frame pacing, readable pixel art, gentle animation, and no network dependency after load.

## Stack Shape

- Vite builds the app into `dist` for GitHub Pages. Repository Pages deployments use a repo-relative base path.
- PixiJS owns the top-down game scene, sprite layers, camera, tile rendering, particles, and visual effects. Production should prefer WebGL because PixiJS marks WebGL/WebGL2 as the stable renderer for v8.
- Howler.js owns music, ambience, sound effects, audio sprites, global mute, per-channel volume, fades, and browser audio unlock behavior.
- DOM UI owns menus, HUD text, accessibility affordances, save slots, options, and debug panels. Pixi remains focused on the world view.
- Vitest tests pure modules and content validation. Playwright tests browser boot, input, canvas presence, save/load, and core user journeys.

## Source Layout

```text
src/
  audio/       Howler adapters, channel mixers, sound registries
  content/     Typed content catalogs and validation helpers
  core/        Pure game state, typing parser, economy, time, saves
  rendering/   Pixi scene graph, camera, animation, tile/sprite drawing
  systems/     Runtime orchestration that connects core to adapters
  ui/          DOM HUD, menus, options, accessibility helpers
  tests/       Shared test helpers when needed
tests/         Playwright browser specs
public/assets/ Static files copied directly into the build
```

## Runtime Model

The browser shell creates adapters first: renderer, audio, storage, input, and UI. It then creates a `GameSession` that owns the current deterministic `FarmState`.

The long-term loop should use:

- Fixed-step simulation for time, crop growth, NPC schedules, and queued actions.
- Render interpolation for camera movement, sprites, and effects.
- Event logs for player actions and system outcomes, which are useful for UI, testing, replay diagnostics, and agent debugging.

## Typing Control Model

The player has an embodied unit in the world. Typing does not issue abstract movement commands; it reacts to words the world is currently offering.

The renderer displays a small vocabulary of nearby or visible words over actionable things. Typing one of those words queues the character to walk to the target and act on it. Distance controls specificity:

- From farther away, the farmhouse may show `house`; typing it walks the player close to the farmhouse.
- Near the farmhouse, the door may show `door`; typing it walks to the door and enters.
- Near several crops that need the same action, each crop gets a related word such as `water`, `sprinkle`, `splash`, `drench`, or `douse`.
- Menus and dialogue can still use typed words, but they should be explicit modal contexts with their own visible vocabulary.

This makes the game feel like reading and responding to a living scene. The core target selector owns which words are visible, which target each word resolves to, and what action will be queued. Rendering should only draw those target labels.

Completion should be forgiving enough for cozy play: clear labels, short early vocabulary, no hidden required words, good feedback, and optional assist modes. Challenge can come from longer words, dense scenes, timed festivals, streaks, and mastery goals later.

## Save Model

Saves should be local JSON stored in `localStorage` with a visible schema version. Every released schema change needs a migration test.

Save data should include:

- Farm state, day, weather, inventory, money, quests, achievements, options, unlocked words, and map changes.
- Content version and save schema version.
- A small event summary for diagnostics, not a full infinite event log.

## Content Model

Prefer typed registries over loose string lookups:

- `CropDefinition`
- `WordDefinition`
- `TargetWordDefinition`
- `RecipeDefinition`
- `AchievementDefinition`
- `QuestDefinition`
- `VillagerDefinition`
- `AudioCueDefinition`

Each registry needs validation tests before it becomes large.

## Asset Pipeline

Early development should use procedural placeholders and tiny hand-authored sprite sheets. The visual style guide in `docs/STYLE_GUIDE.md` is the source of truth before generating or commissioning assets.

GPT Image Generation can help with:

- Mood boards and palette exploration.
- Tile and crop sprite sheet drafts.
- Character portrait concepts.
- Texture studies for soil, water, wood, stone, and seasonal variants.

Generated art should be reviewed, normalized, and checked into `public/assets` only when it matches the style guide and works at gameplay scale.

## Testing Strategy

- Unit tests: typing parser, farm simulation, economy, inventory, save migration, content validation.
- Target tests: visible word assignment, distance-based specificity, synonym pools, and action resolution.
- Golden state tests: known action sequences produce expected farm states.
- Browser smoke tests: app boots, canvas renders, HUD updates, keyboard typing dispatches actions.
- Visual checks: milestone screenshots for desktop viewport sizes.
- Accessibility checks: keyboard-only menus, text contrast, reduced-motion mode, mute and volume controls.

## 1.0 Performance Budgets

- Initial load should remain small enough for GitHub Pages and a casual browser launch.
- Keep the first playable area compact; stream or lazy-load larger assets later.
- Prefer texture atlases and audio sprites once asset count grows.
- Avoid simulation work tied directly to frame rate.
