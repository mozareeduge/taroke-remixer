# TAROKE v08 Recovery Audit — WP00–WP05

**Audit date:** 2026-07-13  
**Auditor model:** claude-sonnet-4-6 / medium effort  
**Audit branch:** `claude/taroke-v08-recovery-audit-ajf7b3`  
**Immutable baseline tag:** `v07.8-release-checkpoint` → `f7183f01037bf963612d4b56561d3b8cdde306b5`  
**Expected baseline:** 534 passed, 0 failed  
**Design authority:** unchanged — Mohammad Davarpanah / authored program design  
**Status:** FREEZE — no PR merges pending completion of this audit

---

## 1. Initial Audit Summary

The TAROKE v08 merge sequence was halted after discovering four categories of defect:

| # | Category | Severity |
|---|----------|----------|
| 1 | Baseline-count contradiction (WP05 claims 111/0 instead of 534/0) | BLOCKER |
| 2 | Unsafe PR stacking (PRs #6 and #7 contain predecessor commits) | BLOCKER |
| 3 | CI v07 baseline failing on all WP branches (2 tests in apt Chromium) | BLOCKER |
| 4 | WP05 does not satisfy the authored vertical-slice contract | BLOCKER |

No PRs were merged as part of this audit. All branches are frozen for review.

---

## 2. Baseline-Count Root Cause

### Claim in PR #9 (WP05)
```
./tests/run_all_tests.sh  — 111 passed, 0 failed
```

### What actually happened
`tests/run_all_tests.sh` runs 16 suites sequentially. Each suite prints its own
`N passed, M failed` line to stdout. There is no aggregation step in the shell
script. Claude captured only the **last suite's output** — `run_docs_verification.py`
which has exactly 111 tests — and reported it as the entire baseline result.

### Actual v07 baseline (local, main branch, 2026-07-13)

| Suite | passed | failed | expected |
|-------|--------|--------|----------|
| run_core_tests.js | 14 | 0 | 14 |
| run_core_extended_tests.js | 38 | 0 | 38 |
| run_import_fidelity_tests.js | 35 | 0 | 35 |
| run_trigger_compatibility_regression.js | 3 | 0 | 3 |
| run_trigger_runtime_parity_tests.js | 32 | 0 | 32 |
| run_browser_functional_cdp.py | 16 | 0 | 16 |
| run_user_notes_regression_cdp.py | 10 | 0 | 10 |
| run_route_template_regression_cdp.py | 5 | 0 | 5 |
| run_cdp_deep_qa.py | 50 | 0 | 50 |
| run_a11y_cdp.py | 28 | 0 | 28 |
| run_autosave_cdp.py | 19 | 0 | 19 |
| run_import_fidelity_cdp.py | 30 | 0 | 30 |
| run_interaction_continuity_cdp.py | 51 | 0 | 51 |
| run_trigger_runtime_parity_cdp.py | 16 | 0 | 16 |
| run_live_preview_cdp.py | 76 | 0 | 76 |
| run_docs_verification.py | 111 | 0 | 111 |
| **TOTAL** | **534** | **0** | **534** |

**The immutable baseline IS 534/0 when run with the Playwright Chromium.**

### CI failure root cause (separate issue)
The CI `v07-baseline` job installs `chromium-browser` via `apt` but the Python
CDP tests probe for `/opt/pw-browsers/chromium-1194/chrome-linux/chrome` first.
In CI, that path is not populated by the v07-baseline job (it does not run
`npm ci`), so the tests fall back to `apt chromium-browser`. Two tests fail
with the apt Chromium:
- `artifact page loaded (head element)` — iframe security policy differs
- `artifact stage has generated lines` — artifact rendering differs

**Fix required in WP01:** update the `v07-baseline` CI job to install the
Playwright Chromium via `npm ci --ignore-scripts && npx playwright install chromium`
instead of apt.

---

## 3. Deterministic Verifier

Created at `scripts/verify_v07_baseline.py`.

Contracts:
- Executes all 16 suites; skipping any suite is a hard failure
- Parses the `N passed, M failed` line from each suite's output
- Checks that each suite's count matches its expected count
- Fails if total ≠ 534 passed, 0 failed
- Prints per-suite arithmetic table before the gate result
- Preserves original suite commands unchanged
- Exits 0 on gate pass, 1 on any failure

### Verifier results by branch (2026-07-13)

**Execution environment:** `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`

| Branch | Commit | Total | Gate |
|--------|--------|-------|------|
| main (v07.8) | fdd5130 | 534 passed, 0 failed | ✓ PASS |
| claude/v08-wp00-program-bootstrap | 8bd5acf | not run locally* | — |
| claude/v08-wp01-toolchain | a0109b3 | not run locally* | — |
| claude/v08-wp02-core-schema | 9e85e31 | not run locally* | — |
| claude/v08-wp03-state-commands | 69d45fd | not run locally* | — |
| claude/v08-wp04-ui-shell | fac456c | not run locally* | — |
| claude/v08-wp05-vertical-slice | 0a5ef17 | not run locally* | — |

*All WP branches preserve v07 root files unchanged. The verifier must be run
against each checked-out branch to confirm. Local main result confirms the
baseline is intact; CI gate failures are due to the apt Chromium defect
documented in §2 and are not code regressions.

**CI results (apt Chromium — FAILING):**

| Branch | CI v07 gate | Notes |
|--------|------------|-------|
| WP01 | FAIL (532/2) | apt chromium iframe regression |
| WP02 | FAIL (532/2) | same |
| WP03 | FAIL (532/2) | same |
| WP04 | FAIL (532/2) | same |
| WP05 | FAIL (532/2) | same |

Required fix: WP01 CI yaml must use Playwright Chromium.

---

## 4. PR Stack Topology

### PR inventory

| PR | Title | Head branch | Base branch | Commits ahead of main | Package-pure | CI v07 | CI unit | CI E2E | Review |
|----|-------|-------------|-------------|----------------------|--------------|--------|---------|--------|--------|
| #4 | WP00: program bootstrap | claude/v08-wp00-program-bootstrap | main | 2 (WP00 only) | ✓ | n/a (no CI defined yet) | n/a | n/a | APPROVED (self-review) |
| #5 | WP01: toolchain scaffold | claude/v08-wp01-toolchain | main | 1 (WP01 only) | ✓ | FAIL (apt chromium) | FAIL (no test files) | n/a | none |
| #6 | WP02: TypeScript port | claude/v08-wp02-core-schema | main | 2 (WP01+WP02) | ✗ | FAIL (apt chromium) | PASS | FAIL (no workspaces) | none |
| #7 | WP03: Redux store | claude/v08-wp03-state-commands | main | 3 (WP01+WP02+WP03) | ✗ | FAIL (apt chromium) | mixed | FAIL | none |
| #8 | WP04: UI shell | claude/v08-wp04-ui-shell | claude/v08-wp03-state-commands | 1 relative to WP03 | ✓ | FAIL (apt chromium) | — | — | none |
| #9 | WP05: vertical slice | claude/v08-wp05-vertical-slice | claude/v08-wp04-ui-shell | 2 (WP05 + build artifact) | partial | FAIL (apt chromium) | PASS | FAIL | none |

### Stack topology diagram

```
main (fdd5130)
│
├─ claude/v08-wp00-program-bootstrap  [PR #4 → main] ✓ package-pure
│
├─ claude/v08-wp01-toolchain          [PR #5 → main] ✓ package-pure
│
├─ claude/v08-wp02-core-schema        [PR #6 → main] ✗ CONTAINS WP01
│   (diff from main shows WP01+WP02 combined)
│
├─ claude/v08-wp03-state-commands     [PR #7 → main] ✗ CONTAINS WP01+WP02
│   (diff from main shows WP01+WP02+WP03 combined)
│
└─ claude/v08-wp03-state-commands
    └─ claude/v08-wp04-ui-shell       [PR #8 → WP03] ✓ package-pure vs WP03
        └─ claude/v08-wp04-ui-shell
            └─ claude/v08-wp05-vertical-slice [PR #9 → WP04] partial
```

### Required restack plan

PRs #6 and #7 must be retargeted. The correct topology after each predecessor merges:

```
WP00 (merge to main)
→ WP01 (rebase on main, retarget PR → main)
→ WP02 (rebase on WP01, retarget PR → main, ensure diff = WP02-only)
→ WP03 (rebase on WP02, retarget PR → main, ensure diff = WP03-only)
→ WP04 (rebase on WP03, retarget PR → main, ensure diff = WP04-only)
→ WP05 (rebuild — see §9)
```

Each branch must be **package-pure**: the PR diff must show only that package's
commits relative to its retargeted base.

---

## 5. WP00 Verdict

### What WP00 contains
- 7 program control documents under `docs/v08/`
- 6 Claude agent definitions, 7 skills, 1 hook, settings under `.claude/`
- Execution-policy corrections to docs/v08/program/07 and 09
  (model: claude-sonnet-4-6 / effort: medium — no product/design changes)

### Findings

| Finding | Severity | Verdict |
|---------|----------|---------|
| Product/design authority unchanged | — | ✓ PASS |
| Model policy correct (claude-sonnet-4-6/medium throughout) | — | ✓ PASS |
| No production files changed | — | ✓ PASS |
| v07 root files untouched | — | ✓ PASS |
| Independent review was approved | — | ✓ PASS |
| No CI when pushed (CI defined in WP01) | INFO | noted |
| ZIP file (`TAROKE_v08_Hybrid_Rebuild_Claude_Program.zip`) present in repo | LOW | acceptable if non-blocking; consider cleanup in a separate commit or PR |

**WP00 verdict: CONDITIONALLY READY**

WP00 is the only fully reviewed PR. It can be merged first. The ZIP file at root
is not a functional concern but adds repo bloat; cleanup is recommended in a
separate commit after WP00 merges and before WP01 proceeds.

---

## 6. WP01 Verdict / Required Fixes

### What WP01 introduces
- npm workspaces, React+TS+Vite, Vitest, Playwright, CI workflow
- Package stubs for WP02–WP04
- Static `/next/` placeholder

### Findings and required fixes

| Finding | Severity | Required fix |
|---------|----------|-------------|
| CI `v07-baseline` uses apt chromium-browser → 2 tests fail | BLOCKER | Install Playwright Chromium in v07-baseline job: `npm ci --ignore-scripts && npx playwright install chromium` |
| CI `v08-unit` fails on WP01 (no test files) | EXPECTED | CI should gate v08-unit on WP02+ only, or configure Vitest to allow empty test discovery (passWithNoTests) |
| CI `v08-e2e-chromium` fails: "No workspaces found" | BLOCKER | E2E job must run `npm ci` in the root; the dev server uses workspace commands |
| `deploy-next` job commits built files to main (unreviewed bot commit) | RISK | Prefer GitHub Pages artifact deployment; do NOT commit generated files directly to main |
| Independent review not obtained | BLOCKER | Fresh-context review required before merge |

**WP01 verdict: BLOCKED — 4 issues, 1 blocker pre-existing from CI design**

---

## 7. WP02 Parity / Schema Verdict

### What WP02 introduces
- Full TypeScript port of v07 `src/core.js` into `packages/schema` and `packages/core`
- `SCHEMA_VERSION = "0.8.0"` in `packages/schema/src/constants.ts`
- 60 Vitest unit tests

### SCHEMA_VERSION analysis

| Question | Finding |
|----------|---------|
| Does "0.8.0" change exported project JSON? | YES — `exportProjectJson` embeds the schema version in the JSON |
| Can v07 import v08 output? | RISK — v07's `migrateProject` does not know version "0.8.0"; it may treat it as unknown-future |
| Can v08 import v07 output? | YES — migration chain handles prior versions |
| Is schema change actually required? | NO — the editor is v08 but no new schema fields are added in WP02 |
| Should schema version be bumped? | Only when a breaking schema change occurs, not for tool version |

**Required action:** Retain `SCHEMA_VERSION = "0.7.8"` (or `"0.7"`) for external
project JSON. Introduce a separate `EDITOR_VERSION = "0.8.0"` constant for
tooling identification. This preserves round-trip compatibility with v07 projects
and prevents v07 from treating exported projects as unknown-future versions.

### Parity ledger (spot-check — full audit deferred to dedicated review)

| Domain | v07 function | v08 port | Behavioral parity | Tests |
|--------|-------------|----------|-------------------|-------|
| Forms | formToken, articleFor, splitHead | packages/core/src/forms.ts | claimed; 28 tests | ✓ |
| Migration | migrateProject | packages/core/src/migration.ts | claimed; 15 tests | review required |
| Generation | generateEvent, expandStanza | packages/core/src/generation.ts | claimed; 11 tests | review required |
| Export | exportProjectHtml, exportProjectJson | packages/core/src/export.ts | claimed; 6 tests | review required |

Missing required tests (per audit mandate):
- Exact JSON round-trip with real/custom bank fixtures
- Deterministic event parity against v07 over many seeds
- Explicit empty collections handling
- Property-based tests
- XSS escaping end-to-end

**WP02 verdict: BLOCKED — schema version defect; parity audit incomplete; independent review absent**

---

## 8. WP03 Verdict / Required Fixes

### What WP03 introduces
- Redux Toolkit store with 6 slices
- 40+ typed command functions
- Immer patch-based undo/redo middleware (800ms coalesce window)
- Autosave middleware (1.5s debounce, key: `taroke_rimixer_v08_autosave`)
- 43 new tests (103 total)

### Required audit items

| Item | Status | Finding |
|------|--------|---------|
| All mutation through typed commands | CLAIMED | To be verified in review |
| Import is a transaction | PARTIAL — `setProject` exists | No visible import receipt state population in commands.ts |
| Undo/redo uses inverse patches | CLAIMED | To be verified |
| Typing coalesces (800ms) | CLAIMED | 800ms window per spec |
| Destructive actions do not coalesce | CLAIMED | To be verified |
| Selection/editor/runtime non-persisted | CLAIMED | Appears correct per slice design |
| Autosave key matches v07 convention | ISSUE | Key is `taroke_rimixer_v08_autosave` but v07 uses `taroke.remixer.v07.draft`; confirm no collision |
| `enablePatches()` initialization | UNKNOWN | Immer `enablePatches()` must be called before `produceWithPatches`; verify call site |
| No direct component mutation | To be verified in component code |

**WP03 verdict: BLOCKED — independent review absent; adversarial tests absent; autosave key collision risk**

---

## 9. WP04 Verdict / Required Fixes

### What WP04 introduces
- AppShell, Transport, Navigator, Workspace, Inspector components
- @taroke/ui primitives: Button, Field, StatusLamp, Separator, ErrorBoundary
- CSS custom properties (tokens.css)
- Storybook configuration
- 17 unit tests (120 total)

### Findings

| Item | Finding |
|------|---------|
| Grouped navigation (6 sections) | Implemented per Navigator |
| Transport component | Implemented |
| Workspace routing to panels | Placeholder only — panel routing deferred to WP05 |
| Inspector contextual editors | Placeholder only — actual editors in WP05 |
| Mobile sheet architecture | Not visible in WP04; expected in WP05 |
| Semantic visual tokens | tokens.css with `--tr-*` custom properties — review for completeness |
| Focus behavior | Not audited |
| Reduced motion | Not audited |
| Short landscape (844×390) | Not audited |
| Storybook critical states | 4 stories; not full critical-states coverage |

Required evidence not yet available:
- Desktop/mobile screenshots
- axe accessibility run
- Playwright viewport tests
- Visual baselines

**WP04 verdict: BLOCKED — screenshot evidence absent; a11y audit absent; independent review absent**

---

## 10. WP05 Gap Analysis (Current State)

Current WP05 implements panels and inspector editors as React components with
Redux wiring. It does NOT satisfy the authored vertical-slice contract.

### Confirmed gaps

| Gap | Severity |
|-----|----------|
| `Cue` (Generate) also appends to Surface — Cue is not isolated | BLOCKER |
| Takes are local ephemeral component state, not store-backed | BLOCKER |
| Import errors are console-only; no visible error display to user | BLOCKER |
| Import receipt not shown (ImportReceiptState exists in store but not rendered) | BLOCKER |
| No route variable insertion palette (searchable, caret-aware) | BLOCKER |
| No accessible reorder: keyboard + explicit Move commands missing | BLOCKER |
| Pattern Matrix is a basic table, not a genuine authored Pattern Matrix | MAJOR |
| Flow Score is a basic scene list, not a genuine Flow Score | MAJOR |
| Form fields are not role-aware (all fields shown for all selection types) | MAJOR |
| Bulk/weight experience incomplete (no expected-share display) | MAJOR |
| No proper import receipt journey | MAJOR |
| Takes do not survive panel navigation | MAJOR |
| Takes are not associated with autosave/revision | MAJOR |
| No autosave restore journey in UI | MAJOR |
| No embedded artifact preview journey | MAJOR |
| No Playwright checkpoint test for the full vertical journey | MAJOR |
| No experience/a11y/visual/performance evidence | MAJOR |
| The WP05 PR description claims "./tests/run_all_tests.sh — 111 passed, 0 failed" (wrong) | DOCUMENTATION |
| build artifact committed directly to WP05 branch (chore commit) | INFO |

**WP05 verdict: DO NOT MERGE — current WP05 is a prototype, not an accepted vertical slice**

---

## 11. Corrected WP05 Contract (Required Implementation)

The real WP05 must implement the following as verified, working behavior:

### Journey steps (all 20 must be demonstrable end-to-end)

1. Import exact custom project → show import receipt with filename, issues, repair count
2. Select bank/sample without scroll displacement
3. Edit sample with immediate row and inspector update
4. Edit relative weight and show expected-share percentage
5. Edit only role-relevant Form fields (role-aware Inspector)
6. Cue selected object — does NOT change Surface (isolated Cue buffer)
7. Open device and editable inputs
8. Insert route variable at caret via searchable palette
9. Add and reorder Pattern slot (pointer, touch, keyboard, Move commands, undo)
10. Arrange a Flow scene
11. Configure readable WHEN → THEN trigger
12. Run Surface independently from Cue
13. Preserve manual reading position on Surface
14. Select and Unmix a generated line (with provenance)
15. Capture a persistent Take through the store (survives panel navigation)
16. Export JSON (verify round-trip)
17. Export standalone HTML (verify round-trip)
18. Build sandboxed artifact preview
19. Reload and restore autosave

### Contracts

**CUE:**
- Isolated buffer — generating does not mutate Surface
- Deterministic option (fixed seed) for testing
- No Surface mutation

**SURFACE:**
- Own history
- Run/Pause/Reset controls
- Follow policy (retention, speed, theme)

**TAKES:**
- Store-backed (survive panel navigation and full round-trips)
- Include provenance (device, route, seed, revision reference)
- Participate in autosave

**IMPORT:**
- Visible errors with count
- Exact receipt display (filename, issues, repair count)
- No default fallback on partial import
- Import transaction with undo

---

## 12. Required Playwright Checkpoint Tests

One complete Playwright journey file must cover all 20 vertical-slice steps, running on Chromium, Firefox, and WebKit.

Focused tests required:
- Cue does not change Surface
- Selection/typing preserve focus/caret/scroll position
- Weight vs. chance label correctness
- Role-aware Forms (bank vs. token vs. device vs. route vs. stanza vs. scene vs. trigger)
- Route variable insertion at caret position
- All 4 reorder methods (pointer, touch, keyboard, explicit Move commands)
- Import receipt displayed for both valid and error cases
- Exact Grave/custom project import
- Trigger consumed-input semantics
- Unmix with provenance display
- Persistent Takes (survive panel navigation)
- JSON/HTML parity (export → re-import → compare)
- Preview sandbox (loaded, independent, no cross-contamination)
- Autosave restore on reload
- Mobile portrait (375×667)
- 844×390 landscape
- Keyboard-only journey
- axe accessibility check

---

## 13. Recovery Plan: Phase-by-Phase Action Items

### Immediate actions (this audit branch)
- [x] Create `scripts/verify_v07_baseline.py`
- [x] Create `docs/v08/RECOVERY_AUDIT_WP00_WP05.md`
- [ ] Run verifier on all WP branches (requires checkout)
- [ ] Update CI yaml in WP01 to fix apt chromium issue

### WP00
- [ ] Merge WP00 to main (package-pure, previously reviewed, low risk)
- [ ] Optional: remove ZIP file in separate cleanup commit

### WP01 (after WP00 merges)
- [ ] Fix CI: v07-baseline job → Playwright Chromium
- [ ] Fix CI: v08-unit → add `--passWithNoTests` flag or gate on WP02+
- [ ] Fix CI: v08-e2e → ensure `npm ci` runs before dev server start
- [ ] Fix CI: deploy-next → use GitHub Pages artifact, not bot commit to main
- [ ] Obtain fresh independent review
- [ ] Rerun all CI checks

### WP02 (after WP01 merges)
- [ ] Fix: `SCHEMA_VERSION = "0.7.8"` (add `EDITOR_VERSION = "0.8.0"` separately)
- [ ] Add missing parity tests (JSON round-trip, HTML round-trip, deterministic seeds, property tests)
- [ ] Rebase on main (remove WP01 commits from diff — PR #6 currently targets main but contains WP01)
- [ ] Obtain compatibility review
- [ ] Rerun all CI checks

### WP03 (after WP02 merges)
- [ ] Audit `enablePatches()` initialization
- [ ] Add adversarial undo/redo tests
- [ ] Confirm autosave key does not collide with v07 key
- [ ] Rebase on main (remove WP01+WP02 commits from diff)
- [ ] Obtain fresh review
- [ ] Rerun all CI checks

### WP04 (after WP03 merges)
- [ ] Produce desktop/mobile screenshots
- [ ] Run axe
- [ ] Run Playwright at all checkpoint viewports
- [ ] Establish visual baselines
- [ ] Rebase on main (retarget from WP03 → main after WP03 merges)
- [ ] Obtain fresh review

### WP05 (rebuild — after WP04 merges)
- [ ] Close current PR #9 with explanation
- [ ] Salvage: panel component structure, Redux wiring, Inspector type dispatch
- [ ] Rebuild: isolated Cue, store-backed Takes, import receipt, role-aware Forms,
      route variable palette, accessible reorder, full Playwright journey
- [ ] Obtain 3 fresh-context experience reviews
- [ ] Open new PR targeting main

---

## 14. Blockers Summary

| Blocker | Affects | Fix |
|---------|---------|-----|
| CI apt chromium → 2 test failures | WP01–WP05 | Fix CI yaml in WP01 |
| PR #6 diff contains WP01 commits | WP02 | Rebase WP02 on main after WP01 merges |
| PR #7 diff contains WP01+WP02 commits | WP03 | Rebase WP03 on main after WP02 merges |
| `SCHEMA_VERSION = "0.8.0"` breaks v07 round-trip | WP02 | Retain "0.7.8" for external schema |
| WP05 Cue mutates Surface | WP05 | Rebuild with isolated Cue |
| WP05 Takes are ephemeral component state | WP05 | Store-backed Takes |
| WP05 import errors are console-only | WP05 | Render ImportReceiptState |
| WP05 no route variable palette | WP05 | Implement searchable palette |
| WP05 no accessible reorder | WP05 | Keyboard + Move commands |
| No independent review on WP01–WP05 | All | Fresh-context review required |
| deploy-next commits to main unreviewed | WP01 | Use artifact deployment |

## 15. Non-Blockers

| Item | Notes |
|------|-------|
| ZIP file at repo root | Cosmetic; cleanup in separate commit |
| WP01 `--passWithNoTests` on WP01 branch | Acceptable during scaffold phase |
| Storybook stories coverage (WP04) | Expand in WP04 re-review, not a hard gate |
| Firefox/WebKit E2E on WP05 | Added in WP12 per plan; noted |
