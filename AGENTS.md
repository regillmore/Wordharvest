# Agent Workflow

Wordharvest is designed for Codex-assisted planning, development, and verification. Agents should keep work small, testable, and tied to the capability catalog.

## Operating Rules

- Read the relevant docs before editing: `README.md`, `ARCHITECTURE.md`, `CAPABILITIES.md`, `DECISIONS.md`, and `NEXT.md`.
- Preserve the deterministic core. Gameplay rules belong in pure modules unless there is a clear reason otherwise.
- Update tests with behavior changes.
- Update `CAPABILITIES.md` or `NEXT.md` when a task changes release scope.
- Do not overwrite unrelated user or agent work.
- Prefer data definitions and validation over scattered string literals.

## Agent Roles

- Planner: decomposes roadmap items into small tasks with "Complete when..." criteria.
- Feature agent: implements a focused slice with tests and docs.
- Test agent: adds regression, browser, content, and save migration coverage.
- Asset agent: creates or integrates placeholders, generated drafts, and style-guide-compliant assets.
- Release agent: verifies build, CI, GitHub Pages, docs, and checklist status.

## Task Packet Template

```text
Goal:
Files likely involved:
Out of scope:
Complete when:
Tests to add or update:
Docs to update:
Manual check:
```

## Definition of Done

A task is done when:

- The requested behavior exists in the smallest sensible scope.
- `npm run verify` passes, or the blocker is clearly documented.
- Relevant tests were added or updated.
- User-facing behavior is reflected in docs or roadmap status when appropriate.
- Any new content has validation coverage or a clear follow-up task.

## Testing Expectations

- Pure gameplay change: Vitest unit tests.
- Save/schema change: migration and round-trip tests.
- Rendering or input change: Playwright smoke test when practical.
- Audio change: unit-test state/routing and manually verify browser unlock/mute.
- Content expansion: registry validation test.

## Branch and Handoff Notes

For each feature branch or agent handoff, report:

- What changed.
- Why it changed.
- Files touched.
- Tests run.
- Remaining risks or follow-ups.

## Automation Priorities

1. Make `npm run verify` cheap and trustworthy.
2. Add content validation before content gets large.
3. Add save migration tests before public playtests.
4. Keep Playwright smoke tests narrow but representative.
5. Capture milestone screenshots once the farm scene becomes visual enough to regress.
