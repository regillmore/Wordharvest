# Decisions

## 001 - Browser Stack

Status: Accepted on 2026-04-25

Decision: Wordharvest uses TypeScript, Vite, PixiJS 8, and Howler.js.

Context: The game needs to run from GitHub Pages, support fast iteration, keep agent automation simple, and provide reliable 2D rendering plus browser audio.

Consequences:

- The app builds to static files in `dist`.
- Rendering is canvas/WebGL through PixiJS, while UI can remain DOM-based.
- Audio is routed through Howler instead of direct Web Audio for most game needs.
- No backend assumptions are allowed for 1.0.

## 002 - Production Renderer

Status: Accepted on 2026-04-25

Decision: Prefer PixiJS WebGL/WebGL2 for production. Treat WebGPU as an experiment until browser behavior is boringly reliable.

Context: PixiJS v8 documentation marks WebGL as the recommended stable renderer and WebGPU as still maturing.

Consequences:

- Rendering work should avoid WebGPU-only features for 1.0.
- Visual tests should run against common desktop Chromium first, then expand.

## 003 - Simulation Before Presentation

Status: Accepted on 2026-04-25

Decision: Farm rules, typing interpretation, economy, time, progression, and saves live in pure TypeScript modules.

Context: Agent-driven development works best when behavior can be tested without launching the full browser game.

Consequences:

- Gameplay features need unit tests before or alongside visual integration.
- Rendering receives state snapshots and emits input/actions; it does not own rules.

## 004 - 1.0 Scope

Status: Accepted on 2026-04-25

Decision: Version 1.0 targets one polished farm, one connected town edge, one full season, a small villager cast, and durable replay goals.

Context: A cozy farming game can sprawl forever. The first release needs a crisp center.

Consequences:

- Multiplayer, modding, multiple years of authored content, and deep romance systems are out of scope until after 1.0.
- Replay value should come from variation, mastery, optional goals, and farm planning rather than sheer content volume.

## 005 - Asset Strategy

Status: Accepted on 2026-04-25

Decision: Use procedural and simple placeholder assets until game feel is proven. Add generated or polished assets only after a style guide exists.

Context: Early art churn is expensive. We need fast iteration without locking the project into an accidental style.

Consequences:

- Placeholder visuals should be readable and pleasant, not final.
- Generated sprite sheets and textures need review for scale, palette, silhouette, and consistency before entering the main asset set.

## 006 - Visible World Words

Status: Accepted on 2026-04-25

Decision: The player controls an embodied character by typing words that are visible in the world. Words are target labels, not a global command language.

Context: The intended feel is a cozy top-down farm where the player reacts to readable affordances in the scene. A distant farmhouse can offer `house`; near it, the door can offer `door`. Similar crop actions can be disambiguated with synonyms such as `water`, `sprinkle`, `splash`, `drench`, and `douse`.

Consequences:

- Movement is normally produced by typing place, object, character, or action labels.
- The deterministic core needs a target selector that owns visible words, distance rules, synonym assignment, and action resolution.
- Rendering draws labels from the target selector instead of inventing words.
- Directional movement words are useful only for debug tools or optional accessibility modes, not the default game language.
