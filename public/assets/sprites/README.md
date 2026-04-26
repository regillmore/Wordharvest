# Runtime Sprites

Runtime-ready PNG sprite sheets and metadata live here.

Current sheet:

- `player_base_v001.png`: four `32x40` player cells with transparent padding.
- `player_base_v001.json`: frame rectangles and anchors for runtime cropping.

Source:

- `scripts/write-sprite-assets.mjs` hand-authors the current prototype sheet from simple pixel shapes and the palette in `docs/STYLE_GUIDE.md`.
- Run `npm run assets:sprites` after editing that script to regenerate the runtime exports.

Acceptance notes:

- The sheet uses transparent background pixels and style-guide palette colors.
- The player is readable at gameplay scale and keeps the hat/shirt silhouette from the procedural prototype.
- The runtime currently uses `player_idle_down`; the walking frames are included so animation can be wired next without changing the asset contract.
