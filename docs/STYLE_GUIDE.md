# Visual Style Guide

This guide defines the art target for Wordharvest before we generate, import, or polish sprite sheets. The current procedural prototype is not final art, but it sets useful constraints: readable top-down forms, warm farm colors, clear word labels, and cozy feedback.

## Art Direction

Wordharvest should feel like a small handcrafted farm notebook that came to life: soft, readable, warm, and a little storybook. It is a farming game first and a typing game second, so art must support instant recognition of objects and floating words.

Use:

- Orthographic top-down layout with simple front-facing object details where helpful.
- Soft pixel-art silhouettes, clear tile boundaries, and chunky readable forms.
- Gentle color variation inside repeated tiles.
- Warm highlights and muted shadows instead of high-contrast black outlines.
- Small animated details that reward attention without stealing focus from words.

Avoid:

- Isometric perspective.
- Photorealism, painterly blur, or noisy texture.
- Heavy black outlines.
- Oversaturated neon colors.
- Tiny details that vanish at gameplay scale.
- One-hue palettes, especially all-green, all-brown, or all-purple scenes.

## Canonical Scale

- Base tile size: `32x32` source pixels.
- Gameplay grid: one world unit equals one tile.
- Export sprites at source scale first; scale in-engine using integer multiples where possible.
- Keep important silhouettes readable at `2x` and `3x`.
- Leave transparent padding in sprite sheets to avoid bleeding.

Recommended source sizes:

- Ground tiles: `32x32`.
- Crop stages: `16x24` within a `32x32` cell.
- Player and villagers: `24x32` within a `32x40` cell.
- Small props: `16x16` or `32x32`.
- Large props: multiples of `32x32`, such as `64x64` for trees and `96x64` for buildings.
- Portraits: `128x128`, cropped consistently.

## Palette

Use this prototype palette as the first art baseline. Add new colors only when they solve a specific readability or mood problem.

| Role | Hex |
| --- | --- |
| Text ink | `#172018` |
| HUD deep green | `#2f5d46` |
| Farm grass | `#78b86a` |
| Farm grass alternate | `#70ad61` |
| Meadow | `#84bf73` |
| Meadow alternate | `#7ab36b` |
| Path | `#c8ad72` |
| Path pebble | `#a88a56` |
| Soil | `#8f5f34` |
| Soil line | `#734626` |
| Foundation wood | `#b98357` |
| Water | `#4d9bbd` |
| Water highlight | `#a8dbe8` |
| Sky | `#8dccd8` |
| House wall | `#d79b5d` |
| House roof | `#7d3f2a` |
| Door | `#4f3328` |
| Window glow | `#f4e3a3` |
| Player shirt | `#2f5d46` |
| Skin warm | `#f1c27d` |
| Hat / reward yellow | `#f4d35e` |
| Word label paper | `#fff5cf` |
| Panel cream | `#fffaf0` |

Palette rules:

- Use `#172018` or dark greens/browns for text and fine detail, not pure black.
- Keep interactable objects slightly warmer or brighter than background tiles.
- Keep word labels high contrast: paper background plus dark ink.
- Reserve yellow for attention, rewards, ripe crops, and focus accents.

## Tiles

Ground tiles should read at a glance from the player's normal camera distance.

Required 1.0 tile families:

- Grass: calm default surface with 2-3 variants.
- Meadow: grass plus small flower or blade details.
- Path: compact dirt or packed straw route, visually walkable.
- Soil: tilled farm plot, clearly distinct from path.
- Foundation: under buildings and large props.
- Water: pond/stream edge with subtle highlights.
- Fence/edge: boundary and future path-blocking communication.

Tile rules:

- Keep the main tile color stable; put detail in low-contrast accents.
- Avoid corner details that create accidental seams when tiled.
- Make soil rows horizontal or lightly curved, not noisy.
- Water can animate later, but the still frame must be readable.
- Every walkable tile and blocked tile should be visually distinct before pathfinding lands.

## Characters

Characters should be simple, expressive, and readable near the same scale as crop labels.

Player:

- Strong silhouette from hat, hair, or shirt.
- Directional walking can start with 2 frames per direction.
- Keep hands/tools visible only when needed.

Villagers:

- Distinct head shape, palette accent, and one readable clothing motif.
- Avoid facial micro-detail on map sprites.
- Portraits may carry more expression and texture than map sprites.

Animation baseline:

- Idle: 2-4 frames.
- Walk: 2-4 frames per direction.
- Farm action: 2-3 frames, held long enough to sync with audio.

## Crops

Crops are gameplay state indicators, so crop art must prioritize stage readability.

Each crop needs:

- Seed or planted mark.
- Sprout.
- Leaf/mid stage.
- Ripe stage.
- Harvested/empty feedback can use particles or a short effect.

Crop rules:

- Ripe state should be distinguishable by shape and color, not color alone.
- Watered state should have a subtle soil sheen or droplet, not a busy overlay.
- Similar crops need different silhouettes.
- Crop sprites should fit inside a `32x32` tile without hiding word labels.

## Word Labels

Word labels are part of the visual identity. They should feel like labels hovering in the world, not debug text.

Rules:

- Paper color: `#fff5cf`.
- Text color: `#172018`.
- Use bold, readable type with no negative letter spacing.
- Labels should have stable dimensions and never overlap critical target art.
- Labels should fade, lift, or pulse gently later, but not bounce constantly.
- Long words should fit by sizing the label, not by shrinking below readable size.

## UI

The HUD should feel quiet and tool-like, with warmth from the farm palette.

Rules:

- Keep panels compact and scannable.
- Prefer icons or short labels for repeated controls once iconography exists.
- Preserve keyboard-first operation.
- Use high contrast for stats and save/audio controls.
- Do not let UI panels compete with floating world words.

## Effects

Effects should confirm actions without turning the game into a spectacle.

Good early effects:

- Tiny soil puff when planting.
- Short blue droplets when watering.
- Leaf sparkle or pop when harvesting.
- Coin glint at shipping.
- Soft door darkening/fade for entering.

Rules:

- Effects should last under one second unless they are ambient.
- Use 3-8 particles for common farm actions.
- Respect reduced-motion settings once added.

## Asset Export

Preferred formats:

- Pixel art sprites/tiles: PNG with transparency.
- Atlases: PNG plus JSON metadata once asset count grows.
- UI icons: SVG only if they match the UI system; otherwise PNG from the same pixel-art direction.
- Audio: OGG plus MP3 fallback when practical.

Naming:

- `tiles_farm_spring_v001.png`
- `crops_turnip_v001.png`
- `player_base_v001.png`
- `props_shipping_bin_v001.png`
- `portraits_<name>_v001.png`

Rules:

- Use lowercase names with underscores.
- Keep source files outside `public/assets` if they are editor-native or too large.
- Only put runtime-ready exports in `public/assets`.
- Include a short note for generated assets describing prompt, date, cleanup, and reviewer.

## GPT Image Generation

Use generated images for drafts, concepts, and batchable asset starts, not as unchecked final art.

Prompt template:

```text
Create a pixel-art sprite sheet for Wordharvest, a cozy top-down farming game with visible word labels.
Style: soft 32x32 tile-based pixel art, warm farm palette, readable silhouettes, gentle highlights, no pure black outlines, no isometric perspective.
Asset: <asset name and required states>.
Canvas: transparent background, evenly spaced cells, source scale, no labels or text inside the art.
Constraints: match the Wordharvest palette, readable at 2x scale, simple shapes, no painterly blur, no photorealism.
```

Review generated assets for:

- Perspective match.
- Palette match.
- Cell alignment.
- Transparent background.
- Readability at gameplay size.
- No stray text, logos, signatures, or artifacts.
- Consistent outline and shadow language.

## Acceptance Checklist

An asset can enter `public/assets` when:

- It matches this guide at gameplay scale.
- It has a clear filename and version.
- It exports cleanly with transparency where needed.
- It does not introduce a new palette direction without updating this guide.
- It has been checked in-game or in a representative mockup.
- Its source, generation note, or authoring note is recorded when relevant.
