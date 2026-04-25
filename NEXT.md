# Next

## Current Focus

Build the smallest lovable prototype: a farm screen where typing words moves intent through planting, watering, crop growth, harvesting, selling, feedback, and saving.

## Milestone 0 - Project Spine

Complete when:

- [x] Stack is chosen and documented.
- [x] Architecture, capabilities, decisions, roadmap, and agent workflow exist.
- [x] Vite/TypeScript scaffold exists.
- [x] Dependencies are installed and locked.
- [x] CI workflow is configured for typecheck, unit tests, and build.
- [x] GitHub Pages deployment workflow is configured.
- [ ] First GitHub Actions run passes on `main`.
- [ ] GitHub Pages deployment is enabled in repository settings.

## Milestone 1 - Playable Farm Prototype

Complete when:

- [ ] The player sees a top-down farm scene.
- [ ] The player can type at least `seed`, `water`, `pick`, and `sell`.
- [ ] Crops visibly progress through stages over days.
- [ ] Actions produce HUD feedback and audio placeholders.
- [ ] A local save can be created, loaded, and reset.
- [ ] Unit tests cover the action sequence from seed to sale.

## Milestone 2 - First Spring Slice

Complete when:

- [ ] Spring has 10-15 crop definitions with growth times, prices, and word tags.
- [ ] Weather changes crop planning.
- [ ] A shop sells seeds and at least one upgrade.
- [ ] The player has a first-season objective with progress tracking.
- [ ] The game supports at least seven in-game days of meaningful play.

## Milestone 3 - Cozy Durability

Complete when:

- [ ] Achievements reward farming, typing, exploration, collection, and economy goals.
- [ ] A small town edge supports NPCs, shop, requests, and a festival.
- [ ] Audio channels, options, and mute are complete.
- [ ] Accessibility options cover typing assists, reduced motion, readable UI, and visual cue equivalents.
- [ ] Playwright covers boot, input, save/load, and settings.

## Milestone 4 - 1.0 Beta

Complete when:

- [ ] The first season is playable start to finish.
- [ ] The player can continue after the main seasonal objective.
- [ ] All 1.0 capability goals are either complete or explicitly deferred.
- [ ] Save migration tests pass.
- [ ] GitHub Pages preview passes release verification.
- [ ] The README has player-facing instructions and a release link.

## Immediate Task Queue

1. Install dependencies and commit the first lockfile.
2. Wire CI for `npm run verify`.
3. Build a deterministic crop lifecycle module.
4. Replace the placeholder scene with a tile-based farm view.
5. Add local save/load with schema versioning.
6. Add the first audio channel wrapper and mute/options state.
7. Create a visual style guide before generating or importing sprite sheets.
