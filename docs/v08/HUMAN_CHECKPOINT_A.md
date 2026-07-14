# Human Checkpoint A — WP05 Vertical Slice Gate

**Program**: TAROKE Remixer v08 WP05 Vertical Slice  
**Candidate commit**: `3acf5f0` on `claude/v08-wp05-vertical-slice-recovery` (= PR #15)  
**Prepared**: 2026-07-14  
**Reviewer**: Mohammad (designated authority)  
**Status**: AWAITING REVIEW

---

## What This Is

Human Checkpoint A gates the merge of the WP05 vertical slice (PR #15) onto main.
Nothing in WP06 begins until this checkpoint is cleared.

The PR covers all WP01–WP05 work. WP01–WP04 were already merged to main before this
session began. This checkpoint covers the PR #15 additions.

---

## Work Package Status

| WP   | Branch | Status |
|------|--------|--------|
| WP00 | `claude/v08-wp00-program-bootstrap` | MERGED (PR #4) |
| WP01 | `claude/v08-wp01-toolchain-recovery` | MERGED (PR #10) |
| WP02 | `claude/v08-wp02-core-schema-recovery` | MERGED (PR #11) |
| WP03 | `claude/v08-wp03-state-commands-recovery` | MERGED (PR #12 + #13) |
| WP04 | `claude/v08-wp04-ui-shell-recovery` | MERGED (PR #14) |
| WP05 | `claude/v08-wp05-vertical-slice-recovery` | AWAITING REVIEW (PR #15) |

Superseded PRs to close after merge: #5, #6, #7, #8, #9.

---

## Evidence

### v07 Baseline (immutable reference)

- Tag: `v07.8-release-checkpoint` → commit `f7183f01`
- Verifier: `python3 scripts/verify_v07_baseline.py`
- Result: **534 passed, 0 failed** across 16 suites
- Environment note: `websocket-client` Python package must be installed for CDP suites

### v08 Unit/Component Tests

- Runner: `npm run test --workspace=apps/workbench`
- Result: **168 passed, 0 failed** across 9 test files
- Covers: store slices, undo/redo, commands, shell, panels (Materials/Instruments/Composition/
  Automation/Performance/Archive), migration, generation, forms, export

### TypeScript

- Runner: `npm run typecheck`
- Result: **0 errors**

### Build

- Runner: `npm run build:next`
- Result: **1342 modules, 0 errors** → artifact in `/next/`

### E2E Checkpoint Journey

- Test file: `tests/e2e/checkpoint-a.spec.ts` — 20 tests
- Runner: `npx playwright test --project=<proj> tests/e2e/checkpoint-a.spec.ts`

| Browser / Viewport | Result |
|--------------------|--------|
| Chromium (1280×720 desktop) | **20/20 passed** |
| Chromium / Pixel 5 portrait (393×851) | **20/20 passed** |
| Chromium / Pixel 5 landscape (851×393) | **20/20 passed** |
| Firefox | NOT AVAILABLE — Firefox not installed in CI environment |
| WebKit | NOT AVAILABLE — WebKit not installed in CI environment |

**Firefox/WebKit status**: the Playwright 1.61.1 environment only has the Chromium 1194
browser binary. Firefox 1532 and WebKit 2311 binaries are not present at
`/opt/pw-browsers/`. The checkpoint journey passes on all available configurations.
Firefox/WebKit testing is a known non-blocker for this checkpoint; defer to WP06 gate.

### E2E Journey Coverage (20 tests)

| # | What is tested | WP05 Contract Items |
|---|---------------|---------------------|
| 1 | Shell loads, h1 visible | — |
| 2 | All 6 panels reachable via nav | — |
| 3 | Materials: bank renders | #4 stable bank selection |
| 4 | Materials: Up/Down reorder buttons exist | #17 keyboard reorder |
| 5 | Instruments: device list visible | #12 editable device inputs |
| 6 | Composition: PATTERNS + SLOTS visible | #20 Flow scene |
| 7 | Automation: WHEN→THEN format | #21 readable WHEN→THEN |
| 8 | Cue audition does NOT append to Surface | #10 isolated Cue |
| 9 | Surface has its own Generate action | #11 independent Surface |
| 10 | Surface Clear empties history | #11 independent Surface |
| 11 | Surface Generate → UNMIX → Capture Take | #24 Unmix provenance, #25 store-backed Take |
| 12 | Archive: JSON + HTML export buttons | #26 JSON export, #27 HTML export |
| 13 | Archive: Import section visible | #1 authored/custom import |
| 14 | Malformed import shows error | #32 visible import errors |
| 15 | Transport controls visible | — |
| 16 | Inspector toggle works | — |
| 17 | v07.8 root URL serves legacy app | root / preserved |
| 18 | No unnamed buttons (basic a11y) | — |
| 19 | Tab key moves focus | — |
| 20 | Cue audition shows Cue-section output | #10 isolated Cue |

---

## Cue / Surface Isolation (New in This Session)

The previous PR #15 candidate had a P0 bug: Cue "Generate" appended to Surface history,
violating the isolation contract. This session:

1. Added two failing regression tests (confirmed fail before fix).
2. Created `surfaceSlice.ts` (store-backed Surface history with `appendSurfaceLine`,
   `clearSurface`, `setRetention`, `setFollowPolicy`).
3. Refactored `PerformancePanel.tsx`:
   - **Cue**: `Audition ▶` button → `doCueAudition()` — private preview, no Surface write,
     no Take capture, no `recordEvent` dispatch.
   - **Surface**: `Generate ▶` button → `doSurfaceGenerate()` — commits to Redux surface
     store, dispatches `recordEvent`, appends line to store-backed history.
   - **UNMIX** provenance now shows the last Surface event (not Cue preview).
4. Both regression tests pass after the fix.

---

## Key Decisions Requiring Mohammad's Review

1. **Firefox/WebKit gap**: Only Chromium is available in the CI environment. The checkpoint
   journey passes 20/20 on Chromium (desktop + 2 mobile viewports). Firefox/WebKit coverage
   deferred to WP06.

2. **WCAG deferral (unchanged from prior session)**: Three WCAG 2.1 AA items are filed as
   WP06 gate items — contrast `--tr-dim` token (~2.5:1 vs. 4.5:1 needed), skip-nav missing,
   focus-visible CSS rule not confirmed wired.

3. **Merge order**: PR #15 (`claude/v08-wp05-vertical-slice-recovery → main`). Confirm before
   beginning WP06.

4. **Deploy**: After merge, the built `/next/` artifact serves the v08 workbench. The v07 root
   at `/` remains unchanged. Confirm.

---

## What Must NOT Happen Until Checkpoint Clears

- [ ] Do not begin WP06
- [ ] Do not merge PR #15
- [ ] Do not deploy the new `/next/` artifact
- [ ] Do not close PRs #5–#9

---

## Checkpoint Result

- [ ] APPROVED — proceed with merge and WP06 planning
- [ ] APPROVED_WITH_CONDITIONS — conditions: _______________
- [ ] BLOCKED — reason: _______________

Reviewer signature: __________________ Date: __________
