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
`tests/run_all_tests.sh` runs 16 suites sequentially with no aggregation step.
Each suite prints its own `N passed, M failed` line. Claude captured only the
**last suite's output** — `run_docs_verification.py` which has exactly 111 tests
— and reported it as the entire baseline result.

### Actual v07 baseline — verified locally on main (2026-07-13)

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

**Chromium:** `/opt/pw-browsers/chromium-1194/chrome-linux/chrome`

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

The preferred approach is a documented `TAROKE_CHROMIUM_PATH` environment variable.
CI derives the actual Playwright executable path from `npx playwright --version`
or a known artifact path and exports it; the Python tests pick it up. This
avoids hardcoding a build number like `chromium-1194`.

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

---

## 4. Per-Branch Verifier Results

Results must be obtained by checked-out isolation with the documented Chromium.
Results marked `[PENDING]` have not yet been individually verified; they are
expected to match main because those branches do not modify any v07 root file
(`src/`, `index.html`, `styles.css`, `tests/`, `package.json type/version`).
This expectation must be confirmed by running the verifier before each branch merges.

| Branch | Commit | v07 root changed? | Verifier result | Chromium | Notes |
|--------|--------|-------------------|-----------------|----------|-------|
| main | fdd5130 | — | **534/0 PASS** | pw chromium-1194 | Baseline reference |
| claude/v08-wp00-program-bootstrap | 8bd5acf | No | **534/0 PASS** | pw chromium-1194 | Confirmed 2026-07-13 |
| claude/v08-wp01-toolchain | a0109b3 | No | **534/0 PASS** | pw chromium-1194 | Confirmed 2026-07-13 |
| claude/v08-wp02-core-schema | 9e85e31 | No | **534/0 PASS** | pw chromium-1194 | Confirmed 2026-07-13 |
| claude/v08-wp03-state-commands | 69d45fd | No | **534/0 PASS** | pw chromium-1194 | Confirmed 2026-07-13 |
| claude/v08-wp04-ui-shell | fac456c | No | **534/0 PASS** | pw chromium-1194 | Confirmed 2026-07-13 |
| claude/v08-wp05-vertical-slice | 0a5ef17 | No | **534/0 PASS** | pw chromium-1194 | Confirmed 2026-07-13 |

**CI results (apt Chromium — BLOCKED):**

| Branch | CI v07 gate | Failures |
|--------|-------------|----------|
| WP01–WP05 | FAIL (532/2) | `artifact page loaded`, `artifact stage has generated lines` |

Required fix before any WP branch can merge: WP01 CI yaml must use Playwright Chromium.

---

## 5. PR Stack Topology

### PR inventory

| PR | Title | Head branch | Base branch | Commits vs main | Package-pure | CI v07 | CI unit | CI E2E | Review |
|----|-------|-------------|-------------|-----------------|--------------|--------|---------|--------|--------|
| #4 | WP00 | claude/v08-wp00-program-bootstrap | main | 2 (WP00 only) | ✓ | n/a | n/a | n/a | self-review (see §6) |
| #5 | WP01 | claude/v08-wp01-toolchain | main | 1 (WP01 only) | ✓ | FAIL/apt | FAIL/no files | n/a | none |
| #6 | WP02 | claude/v08-wp02-core-schema | **main** | **2 (WP01+WP02)** | **✗** | FAIL/apt | PASS | FAIL | none |
| #7 | WP03 | claude/v08-wp03-state-commands | **main** | **3 (WP01+WP02+WP03)** | **✗** | FAIL/apt | mixed | FAIL | none |
| #8 | WP04 | claude/v08-wp04-ui-shell | claude/v08-wp03 | 1 relative to WP03 | ✓ vs WP03 | FAIL/apt | — | — | none |
| #9 | WP05 | claude/v08-wp05-vertical-slice | claude/v08-wp04 | 2 vs WP04 | partial | FAIL/apt | PASS | FAIL | none |

### Stack topology diagram

```
main (fdd5130)
│
├─ claude/v08-wp00-program-bootstrap  [PR #4 → main] ✓ package-pure
│
├─ claude/v08-wp01-toolchain          [PR #5 → main] ✓ package-pure
│
├─ claude/v08-wp02-core-schema        [PR #6 → main]
│   ✗ diff contains WP01+WP02 commits — NOT package-pure
│
├─ claude/v08-wp03-state-commands     [PR #7 → main]
│   ✗ diff contains WP01+WP02+WP03 commits — NOT package-pure
│
└─ claude/v08-wp03-state-commands
    └─ claude/v08-wp04-ui-shell       [PR #8 → WP03] ✓ 1 commit vs WP03
        └─ claude/v08-wp04-ui-shell
            └─ claude/v08-wp05-vertical-slice [PR #9 → WP04] 2 commits vs WP04
```

### Required restack plan

PRs #6 and #7 must be **superseded** by clean branches rather than rebased, to
preserve original history and avoid confusion. After each predecessor merges:

```
WP00 (merge to main)
→ WP01 recovery branch (from main, package-pure)
→ WP02 recovery branch (from main after WP01 merges, package-pure)
→ WP03 recovery branch (from main after WP02 merges, package-pure)
→ WP04 recovery branch (from main after WP03 merges, package-pure)
→ WP05 recovery branch (rebuild — see §11)
```

---

## 6. WP00 Verdict

### What WP00 contains
- 7 program control documents under `docs/v08/`
- 6 Claude agent definitions, 7 skills, 1 hook, settings under `.claude/`
- Execution-policy corrections to docs/v08/program/07 and 09
  (model: claude-sonnet-4-6 / effort: medium — no product/design changes)

### Independent review: evidence and analysis

The WP00 PR description states "APPROVED (fresh-context independent-reviewer agent,
2026-07-13)". The second WP00 commit (`8bd5acf`) records this approval.

**Evidence:**
- The `independent-reviewer` agent definition (`.claude/agents/independent-reviewer.md`)
  was itself created in the first WP00 commit (`6c106cc`).
- The review was conducted by invoking this agent from within the same Claude
  session that authored WP00.
- Claude Code sub-agents are technically fresh-context: they do not inherit the
  parent session's conversation history and access code only through their tools.
- The sub-agent's approval was recorded by the parent session, not independently
  surfaced to the repository.

**Verdict on review quality:** The sub-agent review is *technically* fresh-context
in the tool-access sense. However, it was invoked by the authoring session, used
a reviewer definition it just wrote, and produced no logged findings that can be
independently verified. This constitutes lightweight intra-session review, not
an external independent review. For a documentation-only WP with no functional
changes, this is acceptable as a gatekeeping measure, but it is not equivalent
to an external human or separate-session review.

**Required action:** A genuinely separate-session reviewer must inspect the WP00
diff before it is considered finally approved.

### WP00 findings

| Finding | Severity | Verdict |
|---------|----------|---------|
| Product/design authority unchanged | — | ✓ PASS |
| Model policy correct (claude-sonnet-4-6/medium throughout) | — | ✓ PASS |
| No production files changed | — | ✓ PASS |
| v07 root files untouched | — | ✓ PASS |
| Independent review quality (intra-session sub-agent) | LOW | acceptable for doc-only WP |
| ZIP file (`TAROKE_v08_Hybrid_Rebuild_Claude_Program.zip`) at root | LOW | cosmetic; cleanup preferred |
| No CI when pushed (CI defined in WP01) | INFO | noted; verifier must run at merge |
| Verifier script not present in WP00 | BLOCKER for merge | must be added before merge |

**WP00 verdict: CONDITIONALLY READY pending:**
1. verifier integration
2. separate-session independent review
3. verifier run confirming 534/0

---

## 7. WP01 Verdict / Required Fixes

### What WP01 introduces
- npm workspaces, React+TS+Vite, Vitest, Playwright, CI workflow
- Package stubs for WP02–WP04
- Static `/next/` placeholder

### Findings and required fixes

| Finding | Severity | Required fix |
|---------|----------|-------------|
| CI `v07-baseline` uses apt chromium-browser → 2 tests fail | BLOCKER | Install Playwright Chromium in v07-baseline job; use `TAROKE_CHROMIUM_PATH` env var |
| CI `v08-unit` fails on WP01 (no test files) | NEEDS DECISION | Add real smoke test OR condition unit job on WP02+; do NOT silently pass empty suite |
| CI `v08-e2e-chromium` fails: "No workspaces found" | BLOCKER | E2E job must run `npm ci` before dev server; root workspace install needed |
| `deploy-next` commits generated files directly to main (unreviewed bot commit) | RISK | Remove; prefer GitHub Pages artifact deployment |
| Independent review not obtained | BLOCKER | Fresh-context review required before merge |

**WP01 verdict: BLOCKED — 4 issues, superseded by `claude/v08-wp01-toolchain-recovery`**

---

## 8. WP02 Schema / Parity Verdict

### What WP02 introduces
- Full TypeScript port of v07 `src/core.js` into `packages/schema` and `packages/core`
- 60 Vitest unit tests

### Schema constants (actual WP02 code)

```typescript
// packages/schema/src/constants.ts
export const SCHEMA_VERSION = "0.8.0" as const;
export const V07_SCHEMA_VERSION = "0.7-reset" as const;
```

The released external v07 project schema is `"0.7-reset"` (verified from
`src/core.js`). `SCHEMA_VERSION = "0.8.0"` will be embedded in exported
project JSON when the v08 editor exports files.

### Schema analysis

| Question | Finding |
|----------|---------|
| Does v07 use `"0.7-reset"` externally? | YES — confirmed in `src/core.js` |
| Does `"0.8.0"` in exported JSON break v07 round-trip? | YES — v07's migration chain does not know version `"0.8.0"`; it may treat it as unknown-future |
| Is a new external schema version needed for WP02? | NO — WP02 is a TypeScript port of existing behavior; no new schema fields |
| Required policy | `PROJECT_SCHEMA_VERSION = "0.7-reset"` for external JSON; `EDITOR_VERSION = "0.8.0"` for tooling |

**Note:** The previous audit version incorrectly recommended `"0.7.8"` as the
project schema. The correct value is `"0.7-reset"` which is the actual v07
external schema. This has been corrected in this version.

### Parity audit (spot-check — full ledger in `docs/v08/CORE_PARITY_LEDGER.md`)

Missing required tests (per audit mandate):
- Exact JSON round-trip with real/custom bank fixtures
- Deterministic event parity against v07 over many seeds
- Explicit empty collections handling
- Property-based migration idempotency tests
- XSS escaping end-to-end
- Artifact runtime parity

**WP02 verdict: BLOCKED — schema version defect; parity audit incomplete; no review; superseded by `claude/v08-wp02-core-schema-recovery`**

---

## 9. WP03 State / Autosave Verdict

### What WP03 introduces
- Redux Toolkit store with 6 slices
- 40+ typed command functions
- Immer patch-based undo/redo middleware (800ms coalesce window)
- Autosave middleware

### Autosave key analysis

**v07 autosave key (actual, from `src/app.js`):**
```javascript
const AUTOSAVE_KEY = 'taroke.remixer.v07.draft';
```

**WP03 v08 autosave key (actual, from `apps/workbench/src/store/autosave.ts`):**
```javascript
const AUTOSAVE_KEY = "taroke_rimixer_v08_autosave";
```

**Problems with the WP03 key:**
1. Uses underscores instead of dots — diverges from the established naming convention
2. Contains a typo: `rimixer` instead of `remixer`
3. No documented coexistence policy
4. `/` and `/next/` are served from the **same browser origin** (e.g., `mozareeduge.github.io`), so both v07 and v08 share the same localStorage namespace
5. The current WP03 key is different enough that it won't collide, but this is accidental — a formal policy is required

**Required autosave policy:**

| Application | Key | Notes |
|-------------|-----|-------|
| v07 (`/`) | `taroke.remixer.v07.draft` | immutable; do not change |
| v08 preview (`/next/`) | `taroke.remixer.v08.draft` | explicit, typo-free, convention-matching |
| Cross-version import | Explicit UI action only | Never silently restore v07 draft in v08 |
| Coexistence | v07 and v08 keys are distinct; no interference | confirmed by key inspection |

**The WP03 key `taroke_rimixer_v08_autosave` must be corrected to `taroke.remixer.v08.draft`**
before WP03 can merge.

### Other WP03 findings

| Item | Finding |
|------|---------|
| `enablePatches()` initialization | UNKNOWN — must verify Immer patches are enabled before `produceWithPatches` calls |
| Import transaction | Partial — `setProject` exists but import receipt is not populated from it |
| Adversarial tests | Absent — storage unavailable, corrupt draft, quota errors not tested |
| Storage coexistence | No explicit test that v07 draft survives v08 autosave |

**WP03 verdict: BLOCKED — autosave key defect; adversarial tests absent; no review; superseded by `claude/v08-wp03-state-commands-recovery`**

---

## 10. WP04 Verdict

### What WP04 introduces
- AppShell, Transport, Navigator, Workspace, Inspector components
- @taroke/ui primitives
- CSS custom properties (tokens.css)
- Storybook configuration
- 17 unit tests (120 total)

### Findings

| Item | Finding |
|------|---------|
| Workspace panel routing | Placeholder — deferred to WP05 |
| Inspector editors | Placeholder — deferred to WP05 |
| Mobile sheets | Not in WP04; expected in WP05 |
| Storybook critical states | 4 stories; not full coverage |
| Screenshots | None produced |
| axe run | Not performed |
| Playwright viewport tests | Not performed |
| Visual baselines | Not established |

**WP04 verdict: BLOCKED — evidence absent; no review; superseded by `claude/v08-wp04-ui-shell-recovery`**

---

## 11. WP05 Gap Analysis (Current State — PR #9)

Current WP05 (PR #9, branch `claude/v08-wp05-vertical-slice`) implements
panels and inspector editors as React components but does NOT satisfy the
authored vertical-slice contract.

### Confirmed gaps

| Gap | Severity |
|-----|----------|
| `Cue` (Generate) appends to Surface — Cue is not isolated | BLOCKER |
| Takes are local ephemeral component state, not store-backed | BLOCKER |
| Import errors are console-only; no visible error display | BLOCKER |
| Import receipt state exists in store but not rendered | BLOCKER |
| No route variable insertion palette | BLOCKER |
| No accessible reorder (keyboard + Move commands) | BLOCKER |
| Pattern Matrix is a basic table, not the authored matrix | MAJOR |
| Flow Score is a basic scene list, not the authored Flow Score | MAJOR |
| Form fields not role-aware (all types shown for all selection types) | MAJOR |
| Weight input present but expected-share % not displayed | MAJOR |
| Takes do not survive panel navigation | MAJOR |
| Takes not associated with autosave/revision | MAJOR |
| No autosave restore journey in UI | MAJOR |
| No embedded artifact preview journey | MAJOR |
| No complete Playwright checkpoint test | MAJOR |
| No experience/a11y/visual/performance evidence | MAJOR |
| PR description claims "./tests/run_all_tests.sh — 111 passed, 0 failed" (wrong) | DOCUMENTATION |
| Build artifact committed directly to WP05 branch (chore commit) | INFO |

**WP05 verdict: DO NOT MERGE — prototype, not an accepted vertical slice**

---

## 12. Corrected WP05 Contract

The real WP05 (branch: `claude/v08-wp05-vertical-slice-recovery`) must implement
the complete twenty-one-step journey as non-negotiable:

1. Import exact custom project → show import receipt (filename, issues, repair count)
2. Select bank/sample without scroll displacement
3. Edit sample with immediate row and inspector update
4. Edit relative weight and display expected-share percentage
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
20. Import: visible errors, exact receipt, no default fallback, undo transaction

**Cue contract:** isolated buffer; generating does not mutate Surface; deterministic option.

**Surface contract:** own history; Run/Pause/Reset; follow policy.

**Takes contract:** store-backed; provenance; survive panel nav and autosave.

**Import contract:** visible errors; receipt rendered; no fallback; undo-able.

---

## 13. Recovery Plan

### Recovery branch mapping

| Original PR | Original branch | Status | Recovery branch | Action |
|-------------|----------------|--------|-----------------|--------|
| #4 | claude/v08-wp00-program-bootstrap | Conditionally ready | Same branch, add verifier | Merge after verifier + review |
| #5 | claude/v08-wp01-toolchain | Superseded | claude/v08-wp01-toolchain-recovery | New PR, close #5 |
| #6 | claude/v08-wp02-core-schema | Superseded | claude/v08-wp02-core-schema-recovery | New PR, close #6 |
| #7 | claude/v08-wp03-state-commands | Superseded | claude/v08-wp03-state-commands-recovery | New PR, close #7 |
| #8 | claude/v08-wp04-ui-shell | Superseded | claude/v08-wp04-ui-shell-recovery | New PR, close #8 |
| #9 | claude/v08-wp05-vertical-slice | Prototype — close | claude/v08-wp05-vertical-slice-recovery | New PR, close #9 |

### Phase sequence

```
1. Correct audit (this document)
2. Run verifier on all branches
3. Integrate verifier into WP00
4. WP00: add verifier → fresh review → merge
5. WP01: recovery branch → fix CI → fresh review → merge
6. WP02: recovery branch → fix schema → parity ledger → fresh review → merge
7. WP03: recovery branch → fix autosave key → adversarial tests → fresh review → merge
8. WP04: recovery branch → screenshots + a11y + viewports → fresh review → merge
9. Close WP05 PR #9 with explanation
10. WP05: rebuild → full 20-step journey → Playwright suite → experience reviews → merge
11. Deploy /next/ → verify both routes → prepare Human Checkpoint A
```

---

## 14. Blockers Summary

| Blocker | Affects | Fix branch |
|---------|---------|-----------|
| CI apt chromium → 2 test failures | WP01–WP05 | WP01 recovery |
| PR #6 diff contains WP01 commits | WP02 | WP02 recovery |
| PR #7 diff contains WP01+WP02+WP03 commits | WP03 | WP03 recovery |
| `SCHEMA_VERSION = "0.8.0"` breaks v07 round-trip | WP02 | WP02 recovery |
| Autosave key typo + no coexistence policy | WP03 | WP03 recovery |
| WP05 Cue mutates Surface | WP05 | WP05 rebuild |
| WP05 Takes are ephemeral component state | WP05 | WP05 rebuild |
| WP05 import errors console-only | WP05 | WP05 rebuild |
| WP05 no route variable palette | WP05 | WP05 rebuild |
| WP05 no accessible reorder | WP05 | WP05 rebuild |
| No independent review on WP01–WP05 | All | Per WP |
| deploy-next commits to main unreviewed | WP01 | WP01 recovery |
| Verifier not integrated into CI | WP01 | WP01 recovery |

## 15. Non-Blockers

| Item | Notes |
|------|-------|
| ZIP file at repo root | Cosmetic; cleanup in WP00 or separate commit |
| WP01 empty Vitest on WP01 branch only | Fixed in recovery by smoke test or passWithNoTests |
| Storybook stories coverage (WP04) | Expand in WP04 recovery review |
| Firefox/WebKit E2E on WP05 | Added in WP12 per plan |
