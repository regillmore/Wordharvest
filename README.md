# Wordharvest

Wordharvest is a cozy top-down farming game where the player tends crops, explores a small rural world, and acts by typing short words hovering over things in the scene. The target feel is calm, readable, and satisfying: typing `house` might walk the player toward home, typing `door` up close might step inside, and nearby crops might invite `water`, `sprinkle`, `splash`, or `drench` without turning the game into a typing drill.

## Stack

- Runtime: static browser app built with TypeScript and Vite.
- Rendering: PixiJS 8 with WebGL as the production renderer.
- Audio: Howler.js for music, ambience, sound effects, fades, and audio sprites.
- Testing: Vitest for deterministic simulation and content tests; Playwright for browser smoke, interaction, rendering, and save/load checks.
- Deployment: GitHub Pages via a static `dist` build and GitHub Actions.
- Asset path: hand-authored/procedural placeholder assets first, then curated sprite sheets, tiles, portraits, icons, and textures. GPT Image Generation can supplement asset ideation and production once prompts and style constraints are documented.

## First Release Target

Version 1.0 should be a compact but durable farming game, not a sprawling life sim. The release is complete when a new player can start a save, learn typing controls in-world, play through a satisfying first season, unlock meaningful upgrades, and choose to continue because the farm, word mastery, and achievement goals still have room to grow.

See [CAPABILITIES.md](CAPABILITIES.md) for the feature catalog and [NEXT.md](NEXT.md) for the working roadmap.

## Play

Play the current browser build at <https://regillmore.github.io/Wordharvest/>.

Wordharvest is keyboard-first. Type a visible word hovering in the world, then press Enter or Space. Good first words to try are `seed`, `house`, `door`, `town`, `shop`, `journal`, and `pack`. Use the HUD buttons to end the day, save, load, reset, and adjust audio or accessibility options.

## Development

```bash
npm install
npm run install:browsers
npm run dev
npm run verify
```

Useful scripts:

- `npm run dev`: start the Vite dev server.
- `npm run build`: typecheck and build the static site into `dist`.
- `npm run preview`: serve the production build locally.
- `npm test`: run unit tests.
- `npm run test:e2e`: run Playwright browser tests.
- `npm run install:browsers`: install the Chromium browser used by Playwright.
- `npm run verify`: run typecheck, unit tests, and production build.
- `npm run verify:release`: run the full local release gate, including Playwright smoke tests.

## GitHub Pages

This project must be deployed from the Vite production build, not directly from the repository root. In GitHub repository settings, go to **Pages**, set **Build and deployment** to **GitHub Actions**, then run the `Deploy Pages` workflow.

The built `dist/index.html` should reference files like `/Wordharvest/assets/index-*.js`. If the deployed site requests `/src/main.ts`, GitHub Pages is serving the source `index.html` instead of the built artifact.

## Project Docs

- [ARCHITECTURE.md](ARCHITECTURE.md): system design, module boundaries, save model, and testing strategy.
- [CAPABILITIES.md](CAPABILITIES.md): 1.0 feature catalog with checkable completion goals.
- [DECISIONS.md](DECISIONS.md): durable technical and product decisions.
- [NEXT.md](NEXT.md): milestone plan and immediate task list.
- [AGENTS.md](AGENTS.md): Codex agent workflow for planning, implementation, testing, and handoff.
- [docs/STYLE_GUIDE.md](docs/STYLE_GUIDE.md): visual direction, palette, sprite rules, and asset acceptance criteria.
- [docs/RELEASE_CHECKLIST.md](docs/RELEASE_CHECKLIST.md): release verification, save migration, and GitHub Pages preview checklist.
