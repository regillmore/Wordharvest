# Next

## Current Focus

Harden the prototype toward a 1.0 beta: preserve saves across schema changes, verify GitHub Pages releases, and grow the first season without weakening the visible-word control loop.

## Milestone 0 - Project Spine

Complete when:

- [x] Stack is chosen and documented.
- [x] Architecture, capabilities, decisions, roadmap, and agent workflow exist.
- [x] Vite/TypeScript scaffold exists.
- [x] Dependencies are installed and locked.
- [x] CI workflow is configured for typecheck, unit tests, and build.
- [x] GitHub Pages deployment workflow is configured.
- [x] First GitHub Actions run passes on `main`.
- [x] GitHub Pages deployment source is set to GitHub Actions in repository settings.
- [x] Deployed `dist/index.html` loads `/Wordharvest/assets/index-*.js`, not `/src/main.ts`.

## Milestone 1 - Playable Farm Prototype

Complete when:

- [x] The player sees a top-down farm scene.
- [x] The farm scene is rendered from an authored tile map.
- [x] The player unit is visible in the world.
- [x] The player unit animates walking in four directions at a brisk readable pace.
- [x] Distant and near targets can expose different words, such as `house` and `door`.
- [x] Similar nearby crop actions can use synonyms such as `water` and `sprinkle`.
- [x] Target labels are defined in a typed content catalog with validation tests.
- [x] Typed labels queue walking to the target before the action completes.
- [x] Typed targets use tile-aware paths with preview and blocked-path feedback.
- [x] Farm/town transition boundaries use the same typed-label walking flow.
- [x] The player can type visible labels to plant, water, harvest, enter the house, and use the shipping bin.
- [x] Crops visibly progress through stages over days.
- [x] Planting consumes seed inventory and seeds come from a visible farm source.
- [x] The player renders from a style-guide-compliant runtime sprite sheet.
- [x] Target word roles cover shop, villager, and menu interactions.
- [x] Blocked map tiles have visible fence, foundation, and water language.
- [x] Actions produce HUD feedback and authored prototype audio cues.
- [x] A local save can be created, loaded, and reset.
- [x] Save/load feedback includes a visible restored save timestamp.
- [x] Unit tests cover the action sequence from seed to sale.

## Milestone 2 - First Spring Slice

Complete when:

- [x] Spring has 10-15 crop definitions with growth times, prices, and word tags.
- [x] Spring crop catalog schema exists with the first four crop definitions and validation coverage.
- [x] The town shop sells crop seed packets through typed crop labels.
- [x] Weather changes crop planning through visible forecasts and rainy dawn watering.
- [x] A shop sells seeds and at least one upgrade.
- [x] The player has a first-season objective with progress tracking.
- [x] The game supports at least seven in-game days of meaningful play.

## Milestone 3 - Cozy Durability

Complete when:

- [x] Achievements reward farming, typing, exploration, collection, and economy goals.
- [x] A small town edge supports NPCs, shop, requests, and a festival.
- [x] Audio channels, options, and mute are complete.
- [x] Accessibility options cover typing assists, reduced motion, readable UI, and visual cue equivalents.
- [x] Playwright covers boot, input, save/load, and settings.

## Milestone 4 - 1.0 Beta

Complete when:

- [x] The first season is playable start to finish.
- [x] The player can continue after the main seasonal objective.
- [ ] All 1.0 capability goals are either complete or explicitly deferred.
- [x] Save migration tests pass.
- [x] GitHub Pages preview passes release verification.
- [x] The README has player-facing instructions and a release link.

## Immediate Task Queue

1. Draft 1.0 capability deferrals and beta release notes.
2. Add recipe and forage collection sections once their source actions exist.
3. Expand achievement presentation with a dedicated badge view once menus grow beyond HUD logs.
