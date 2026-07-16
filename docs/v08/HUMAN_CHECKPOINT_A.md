# Human Checkpoint A — WP05 Vertical Slice Gate

**Program**: TAROKE Remixer v08 WP05 Vertical Slice  
**Candidate commit**: `9ffdf50` (HEAD on `claude/v08-wp05-vertical-slice-recovery` = PR #15)  
**CI gate**: runs 29412500449 (push) + 29412503255 (pull_request) → **conclusion: success** ✓ (earlier runs; current HEAD adds stable IDs, preview lifecycle, DraftRecoveryBanner, multimodal reorder, 50-step journey, a11y fixes)  
**Prepared**: 2026-07-16 (updated from 2026-07-15)  
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
- CI note: Two CDP scripts (`run_browser_functional_cdp`, `run_user_notes_regression_cdp`)
  required a Chrome discovery fix to find Playwright's chromium in GitHub Actions;
  fixed in commit `7166ef9` — both now propagate `TAROKE_CHROMIUM_PATH` from the
  verified chromium binary. CI gate confirmed green in runs 29412500449 and 29412503255.

### v08 Unit/Component Tests

- Runner: `npx vitest run` (from `apps/workbench/`)
- Result: **206 passed, 0 failed** across 9 test files
- Covers: store slices (project/undo, surface, takes, runtime, history, import-receipt),
  shell, panels (Materials/Instruments/Composition/Automation/Performance/Archive),
  migration (including 2 new tests: stable DeviceInput ID assignment + duplicate ID repair),
  generation, forms, export
- Improvements since 897d65d: stable DeviceInput IDs; DraftRecoveryBanner; 50-test journey

### TypeScript

- Runner: `npm run typecheck`
- Result: **0 errors**

### Build

- Runner: `npm run build:next`
- Result: **0 errors** → artifact in `/next/`

### E2E Checkpoint Journey

- Test files: `tests/e2e/smoke.spec.ts` (1 test) + `tests/e2e/checkpoint-a.spec.ts` (29 tests) = 30 total
- Runner: `npx playwright test` (from `apps/workbench/`)
- Local result: **210/210 passed** across 7 viewport configurations

| Browser / Viewport | Tests | Result |
|--------------------|-------|--------|
| Chromium desktop (1920×1080) | 30 | **passed** |
| Chromium desktop-1280 (1280×800) | 30 | **passed** |
| Chromium desktop-1024 (1024×768) | 30 | **passed** |
| Chromium tablet-portrait (768×1024) | 30 | **passed** |
| Chromium Pixel 5 portrait (393×851) | 30 | **passed** |
| Chromium Pixel 5 landscape (851×393) | 30 | **passed** |
| Chromium mobile-small (375×667) | 30 | **passed** |
| Firefox | NOT AVAILABLE — downloads blocked by network policy |
| WebKit | NOT AVAILABLE — downloads blocked by network policy |

**Firefox/WebKit status**: network policy blocks cdn.playwright.dev. Firefox/WebKit
coverage deferred to WP06. Chromium at 7 viewport sizes satisfies responsive gate.

### E2E Journey Coverage (30 tests)

| # | What is tested | WP05 Contract Items |
|---|---------------|---------------------|
| smoke | Shell loads at /next/ (smoke gate) | — |
| 1 | Shell loads, h1 visible | — |
| 2 | All 6 panels reachable via nav with per-panel heading assertion | — |
| 3 | Materials: bank renders with sample table | #4 stable bank selection |
| 4 | Materials: Up/Down reorder buttons exist | #17 keyboard reorder |
| 5 | Instruments: route template textarea editable | #12 editable device inputs |
| 6 | Composition: slot Up/Down reorder buttons exist | #20 slot ordering |
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
| 17 | v08 app reachable at /next/ (direct nav + reload) | /next/ preserved |
| 18 | No unnamed buttons (basic a11y) | — |
| 19 | Tab key moves focus | — |
| 20 | Cue audition shows Cue-section output | #10 isolated Cue |
| 21 | Materials: sample literal input editable and model updates | #4 editable literals |
| 22 | Materials: share column shows % for tokens | #4 relative weight display |
| 23 | Forms: case policy select editable | #29 case policy |
| 24 | Forms: plural override input editable | #30 plural overrides |
| 25 | Instruments: route chips insert {slot:form} variable | #12 chip palette |
| 26 | Archive: import receipt banner appears after valid import | #1 import receipt |
| 27 | Composition: slot Down reorder changes order | #20 slot reorder |
| 28 | Composition: Move to start/end buttons present and functional | #20 slot reorder |
| 29 | Instruments: device input fields are editable | #12 editable device inputs |

---

## Independent Review Findings

Three bounded review subagents ran against the candidate commit. No FAIL-level issues found.

### Runtime/Compatibility Review

**PASS** — Cue/Surface isolation correct: `doCueAudition()` dispatches nothing; `doSurfaceGenerate()` dispatches both `recordEvent` and `appendSurfaceLine`.  
**PASS** — `surfaceSlice`: `appendSurfaceLine` enforces retention limit; `clearSurface` resets to [].  
**PASS** — `takesSlice`: `captureTake` appends with `capturedAt`; takes survive panel navigation (Redux, not local state).  
**PASS** — Import/export: JSON export produces valid blob; import routes through migration pipeline; parse error shows `role="alert"`.  
**PASS** — `defaultProject()`: classic line devices + 8 banks guarantee UNMIX events within the first generate call.  
**WARN** — Stanza queue position (`cueQueueRef`) lost on panel remount; by design (code comment present), no user signal. Deferred.  
**WARN** — Double `migrateProject` call on import (idempotent). Deferred.

### Interaction/Accessibility Review

**PASS** — All interactive elements have accessible names (no completely unnamed buttons).  
**PASS** — Navigation buttons have full visible labels ("Banks & Samples", "Devices", etc.).  
**PASS** — Reorder buttons have `aria-label="Move X up/down"` with entity name.  
**PASS** — Import error uses `role="alert" aria-live="assertive"`.  
**PASS** — Surface section has `aria-labelledby="surface-head"`.  
**PASS** — No modals exist; focus-trap requirement N/A.  
**PASS** — `.tr-cue__output` renders after `doCueAudition()` with `aria-live="polite"`.  
**PASS** — h1 contains "TAROKE RIMIXER" in `<header role="banner">`.  
**WARN** — Four button types had generic labels without entity context; **fixed in commit `3e514b2`**: device toggle, stanza toggle/remove, trigger ON/OFF, takes "Clear all" now all carry entity-contextual `aria-label`.

---

## Cue / Surface Isolation (Core WP05 Feature)

1. `surfaceSlice.ts`: store-backed Surface history with `appendSurfaceLine`, `clearSurface`, `setRetention`, `setFollowPolicy`.
2. `PerformancePanel.tsx`:
   - **Cue**: `doCueAudition()` → private preview, no Redux dispatch, no Surface write, no Take capture.
   - **Surface**: `doSurfaceGenerate()` → dispatches `recordEvent` + `appendSurfaceLine`, enables Take capture.
   - **UNMIX** shows the last Surface event (not Cue preview).
3. Both regression tests (tests 8 and 20 in checkpoint-a.spec.ts) verify the isolation contract.

---

## Public Preview

GitHub Pages deployment workflow added at `.github/workflows/preview.yml`.

**REQUIRES** repo admin action: Settings → Pages → Source: GitHub Actions

Expected public URL after enablement:
- v07 (root): `https://mozareeduge.github.io/taroke-remixer/`
- v08 (/next/): `https://mozareeduge.github.io/taroke-remixer/next/`

The workflow builds v08 with `VITE_BASE=/taroke-remixer/next/` and assembles both
apps into `_site/` for Pages deployment.

---

## Key Decisions Requiring Mohammad's Review

1. **Firefox/WebKit gap**: Only Chromium available in CI. Journey passes 21/21 on Chromium (desktop). Firefox/WebKit deferred to WP06.

2. **WCAG residual items (documented, not blocking)**:
   - Contextual aria-label gaps (4 button types) → **fixed in `3e514b2`**
   - Surface section div-as-heading (landmark works; H-key navigation incomplete) → WP06
   - Skip-nav not implemented → WP06
   - `--tr-dim` contrast (~2.5:1 vs. 4.5:1 needed) → WP06

3. **Merge order**: PR #15 (`claude/v08-wp05-vertical-slice-recovery → main`). Confirm before beginning WP06.

4. **Deploy**: After merge, the built `/next/` artifact serves the v08 workbench. The v07 root at `/` remains unchanged. Confirm.

5. **GitHub Pages**: Must be enabled by repo admin before the preview URL becomes live.

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
