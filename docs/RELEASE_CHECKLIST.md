# Release Checklist

Use this checklist before tagging a public Wordharvest build.

## Local Verification

Complete when:

- [ ] `npm ci` has installed dependencies from `package-lock.json`.
- [ ] `npm run verify` passes.
- [ ] `npm run test:e2e` passes in Chromium.
- [ ] `npm run verify:release` passes on the release branch.
- [ ] The built `dist/index.html` references `/Wordharvest/assets/index-*.js` when built with `GITHUB_PAGES=true`.

## Save Migration Review

Current save schema: `11`.

Complete when:

- [x] `src/core/save.test.ts` covers round-trip serialization for the current schema.
- [x] `src/core/save.test.ts` covers migration from schemas `0` through `10`.
- [x] Migrated saves clear in-progress walking actions before restoring play.
- [x] Migrated saves normalize crop counts, weather, upgrades, objectives, week goals, requests, town events, collection log, and achievements.
- [ ] Any future schema bump increments `SAVE_SCHEMA_VERSION` and adds a focused migration test before release.

## GitHub Pages Preview

Latest local Pages asset-path check: 2026-04-27 passed with `GITHUB_PAGES=true` and `GITHUB_REPOSITORY=regillmore/Wordharvest`; `dist/index.html` referenced `/Wordharvest/assets/` and did not reference `/src/main.ts`.

Complete when:

- [ ] The `Deploy Pages` workflow passes on `main` or from a manually dispatched workflow run.
- [ ] The deployed page opens at `https://regillmore.github.io/Wordharvest/`.
- [ ] Browser DevTools shows no requests for `/src/main.ts`.
- [ ] Browser DevTools shows built asset requests under `/Wordharvest/assets/`.
- [ ] A fresh browser profile can boot, type `seed`, save, reload, load, and hear or see feedback cues.

## Release Notes

Complete when:

- [ ] `NEXT.md` reflects the shipped milestone status.
- [ ] `README.md` includes the current player-facing link and basic play instructions.
- [ ] Known deferrals from `CAPABILITIES.md` are listed in the release notes.
