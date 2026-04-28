# Capability Catalog

This catalog is the 1.0 checklist. Each item includes a concrete "Complete when..." goal so agents can turn broad game ideas into shippable tasks.

## 1.0 Release Definition

Complete when a player can:

- Start a new save in a desktop browser from GitHub Pages.
- Learn movement and farm actions through typing without reading external docs.
- Play at least one full in-game season with crops, weather, upgrades, light story, and festivals.
- Save, close the tab, return, and continue safely.
- Finish a clear first-season objective while still having optional goals left.
- Adjust audio, text, typing assists, and motion settings.

## Core Farming Loop

- Planting: Complete when the player can prepare soil, plant seeds, see crop stages, and understand what each plot needs.
- Watering: Complete when watering is readable, has feedback, consumes stamina or time, and affects growth.
- Harvesting: Complete when ripe crops can be collected, sold, stored, gifted, or used in recipes.
- Time: Complete when days start and end predictably through a clear bedtime action.
- Weather: Complete when rain, sun, and at least one special weather event affect planning.
- Economy: Complete when the player can earn, spend, and save enough currency to make upgrade choices meaningful.

## Typing Controls

- Word buffer: Complete when typed letters appear clearly, can be corrected, and dispatch on Enter or Space.
- Embodied player: Complete when the player unit is visible, moves toward typed targets, and performs actions only through visible world words.
- Distance vocabulary: Complete when distant objects expose broad labels such as `house`, while nearby targets expose specific labels such as `door`.
- Context verbs: Complete when the same word can safely mean different things in farm, menu, and dialogue contexts only when the visible vocabulary makes that context obvious.
- Word targets: Complete when interactable objects display valid words without cluttering the world.
- Synonym assignment: Complete when similar nearby actions can use word families such as `water`, `sprinkle`, `splash`, `drench`, and `douse` without ambiguity.
- Assist modes: Complete when slower players can enable longer time windows, shorter required words, or non-punitive mistakes.
- Mastery: Complete when streaks, accuracy, and word variety grant satisfying rewards without blocking relaxed play.

## World and Exploration

- Farm map: Complete when the farm supports plots, paths, house, shipping bin, storage, and upgrade locations.
- Town edge: Complete when there is at least one connected non-farm area with shops, NPCs, and seasonal decoration.
- Interaction: Complete when signs, doors, chests, shops, and NPCs all share consistent interaction feedback.
- Navigation: Complete when movement is handled by typing visible place, object, and character labels rather than direct directional commands.
- Secrets: Complete when optional discoveries reward observation, typing skill, or seasonal timing.

## Crops, Crafting, and Progression

- Crop roster: Complete when 10-15 crops cover early, mid, and late season choices.
- Tool upgrades: Complete when upgrades change planning, not just numbers.
- Crafting: Complete when recipes create useful items such as sprinklers, preserves, paths, signs, and decor.
- Farm upgrades: Complete when at least three long-term upgrades change the farm layout or daily routine.
- Collection log: Complete when crop, recipe, fish/forage, and word discoveries are tracked.

## Characters and Story

- NPC roster: Complete when 5-7 villagers have schedules, preferences, short dialogue arcs, and gifts.
- Relationships: Complete when repeated positive interactions unlock scenes, recipes, or farm benefits.
- Story spine: Complete when the first season has a gentle main objective and an ending beat.
- Dialogue typing: Complete when dialogue choices can use keywords without making conversations feel like tests.

## Achievement and Replay Value

- Achievements: Complete when there are goals for farming, typing mastery, social play, exploration, economy, and cozy decoration.
- Daily variation: Complete when weather, shop stock, requests, and forage make days feel different.
- Farm planning: Complete when players can choose between fast cash, collection completion, relationships, decoration, or typing mastery.
- Replay seeds: Complete when a new save can vary request order, shop specials, and optional goals without breaking balance.
- Post-season loop: Complete when players can continue after the first major objective with at least one new seasonal or farm goal.

## Audio and Feel

- Music: Complete when farm, town, night, rain, and festival states have distinct loops or stems.
- Ambience: Complete when birds, rain, wind, interiors, and UI quiet moments support the cozy mood.
- Sound effects: Complete when typing, planting, watering, harvesting, coins, UI, and achievements have satisfying cues.
- Options: Complete when the player can independently adjust music, ambience, effects, and mute.

## Accessibility and Comfort

- Keyboard-first: Complete when all gameplay and menus can be played from the keyboard.
- Text: Complete when HUD and menus are readable at common desktop resolutions.
- Typing comfort: Complete when repeated actions avoid strain through buffering, repeats, and optional holds/macros where appropriate.
- Motion: Complete when camera shake, flashes, and particles can be reduced.
- Audio: Complete when important cues have visual equivalents.

## Automation and Durability

- Unit coverage: Complete when core typing, crop, save, economy, and content registries have tests.
- Target coverage: Complete when visible target labels, synonym assignment, and distance-based target specificity have tests.
- Browser coverage: Complete when Playwright verifies boot, typing a farm action, save/load, and settings.
- CI: Complete when every pull request runs typecheck, tests, build, and browser smoke where practical.
- Agent handoff: Complete when each feature task updates docs, tests, and "Complete when..." status.
- Release checklist: Complete when `npm run verify` and a GitHub Pages preview pass before tagging.
