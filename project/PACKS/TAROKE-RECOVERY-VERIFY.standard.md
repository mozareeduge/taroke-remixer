# Context Pack — TAROKE-RECOVERY-VERIFY

- Mode: standard
- Generated: 2026-07-14T13:14:31+00:00
- Budget: 9000 estimated tokens

## CURRENT STATE

# Current State

- Project: TAROKE RIMIXER v08 Rebuild
- Updated: 2026-07-14T13:14:31+00:00
- Git branch: claude/project-loom-install-l3glrq
- Git commit: 410f32e
- Working tree: dirty
- Model: claude-sonnet-4-6 / medium

## Active
- TAROKE-RECOVERY-VERIFY: Reconcile real repository state — branches, PRs, CI, tests, deployment

## Ready
- none

## Blocked
- none

## Recently completed
- none

## Latest binding decisions
- none recorded

## Resume
1. `python scripts/loom.py validate`
2. `python scripts/loom.py next`
3. `python scripts/loom.py pack <task-id>`
4. execute the active pack; do not reconstruct history from chat


## ACTIVE TASK

{
  "id": "TAROKE-RECOVERY-VERIFY",
  "title": "Reconcile real repository state — branches, PRs, CI, tests, deployment",
  "type": "verification",
  "status": "active",
  "depends_on": [],
  "authority": [
    "project/BRIEF.md",
    "project/AUTHORITY.md",
    "docs/v08/STATUS.md",
    "docs/v08/EXECUTION_DAG.md"
  ],
  "scope": {
    "include": [
      "docs/v08/**",
      "project/**",
      "artifacts/**",
      "scripts/**"
    ],
    "exclude": [
      "src/**",
      "index.html",
      "styles.css"
    ]
  },
  "deliverables": [
    "artifacts/TAROKE-RECOVERY-VERIFY/summary.md",
    "artifacts/TAROKE-RECOVERY-VERIFY/branches.json",
    "artifacts/TAROKE-RECOVERY-VERIFY/baseline.json"
  ],
  "verification": [
    {
      "kind": "command",
      "value": "python scripts/loom.py validate"
    },
    {
      "kind": "file",
      "value": "artifacts/TAROKE-RECOVERY-VERIFY/summary.md"
    }
  ],
  "review_required": false,
  "human_checkpoint": false,
  "notes": "Read-only verification. Do not merge during this task. Write full evidence under artifacts/TAROKE-RECOVERY-VERIFY/."
}


## AUTHORITY — project/BRIEF.md

# TAROKE RIMIXER — Project Brief

This file is the Loom project brief. Full design authority is in `docs/v08/program/`.

## Purpose

Rebuild the TAROKE RIMIXER editor (v07.8 baseline) as a stable, legible, responsive
poetic signal workstation in React/TypeScript/Vite (v08), preserving generator parity,
import/export fidelity, and all authored-project compatibility of v07.

Full mission: `docs/v08/program/00_MASTER_CHARTER.md`

## Desired result

- Human Checkpoint A: live `/next/` URL with complete vertical slice, 3-browser proof,
  7-viewport screenshots, downloadable JSON and standalone HTML.
- Human Checkpoint B: production-grade hardened editor at `/`.
- Full program through WP13 cutover (WP06–WP13 after Checkpoint A verdict).

## Human-sensitive decisions

- Product identity, poetry/music metaphors, terminology (TAROKE, Cue, Surface, etc.)
- Aesthetic direction (archaeological-modernist)
- Compatibility promises for external v07 projects
- Release and deployment verdicts (Checkpoint A/B)
- Any schema change that breaks 0.7-reset projects without a tested migration

Do not make these decisions independently.

## Constraints

- No framework/bundler change to v07 root (src/, index.html, styles.css — frozen)
- Model: claude-sonnet-4-6 / medium — do not escalate
- v07 verifier must read 534 passed, 0 failed at all times
- No unreviewed commits to main
- One package-pure PR per work package
- No graph memory, no external vector store in critical path

## Evidence of success

See `docs/v08/program/12_HUMAN_CHECKPOINTS.md` for Checkpoint A packet spec.


## AUTHORITY — project/AUTHORITY.md

# TAROKE RIMIXER — Authority Map

## Binding sources (in precedence order)

1. Mohammad's explicit instructions in the current session
2. `docs/v08/program/` — immutable design authority (00–12); do not modify during implementation
3. `docs/v08/DECISIONS.md` — binding decisions record
4. `docs/v08/DESIGN_CONFLICTS.md` — known conflicts and resolutions
5. `docs/v08/EXECUTION_DAG.md` — work package sequencing
6. `docs/v08/STATUS.md` — current program phase state
7. Tag `v07.8-release-checkpoint` (f7183f01) — executable compatibility baseline
8. `scripts/verify_v07_baseline.py` — deterministic baseline gate (must report 534/0)
9. `docs/v08/TEST_MIGRATION_LEDGER.md` — test ownership and migration records
10. `docs/v08/EVIDENCE_INDEX.md` — per-WP evidence records
11. `docs/v08/RISK_REGISTER.md` — active risks
12. Worker and agent summaries — `reported` until confirmed by executable evidence

## Interpretation rules

- Lower source cannot silently overrule higher source.
- Implementation notes do not become design authority by repetition.
- Worker report is `reported`, not `verified`, until evidence confirms it.
- When binding sources conflict: record in `docs/v08/DECISIONS.md` and stop only if
  safe work cannot continue.
- All binding decisions must be recorded in `project/LEDGER.jsonl` via `loom.py record`.

## Protected domains (no autonomous changes)

- `src/` and `index.html` — v07 root, frozen until WP13
- `docs/v08/program/` — design authority, never modified during implementation
- Schema incompatibility with external 0.7-reset projects — requires explicit approval
- Any merge or deployment — must follow PR policy and review gate


## AUTHORITY — docs/v08/STATUS.md

# TAROKE RIMIXER v08 — Program Status

**Model:** claude-sonnet-4-6  **Effort:** medium  
**Design authority:** `docs/v08/program/` — immutable; do not modify during implementation  
**Baseline commit:** f7183f01037bf963612d4b56561d3b8cdde306b5 (tag: v07.8-release-checkpoint)  
**Accepted baseline:** 534 passed, 0 failed

---

## Quick Resume

A fresh claude-sonnet-4-6 / medium session resuming this program must:

1. Read `docs/v08/program/` in numeric order (00–12)
2. Read this STATUS.md and EXECUTION_DAG.md
3. Check current WP status below
4. Review DECISIONS.md for all recorded decisions
5. Review DESIGN_CONFLICTS.md before touching any domain model
6. Read TEST_MIGRATION_LEDGER.md before touching any test
7. Run `python3 scripts/verify_v07_baseline.py` to verify 534 still pass
8. Inspect the branch for the next WP before creating it
9. Do not modify design authority documents
10. Do not start Checkpoint B work before Checkpoint A verdict from Mohammad

---

## Work Package Status

| WP   | Name                        | Branch                              | Status     | Tests | PR | Commit |
|------|-----------------------------|-------------------------------------|------------|-------|----|--------|
| WP00 | Program Bootstrap           | claude/v08-wp00-program-bootstrap   | MERGED (#4) | 534   | #4 | c6589e3 |
| WP01 | Workspace/Toolchain (recovery) | claude/v08-wp01-toolchain-recovery | IN PROGRESS | 534 | — | 54b04e8 |
| WP02 | Core/Schema Boundary        | claude/v08-wp02-core-schema         | NOT STARTED| —     | —  | —      |
| WP03 | State/Commands/Undo         | claude/v08-wp03-state               | NOT STARTED| —     | —  | —      |
| WP04 | UI Foundation/Shell         | claude/v08-wp04-ui-shell            | NOT STARTED| —     | —  | —      |
| WP05 | Vertical Slice              | claude/v08-wp05-vertical-slice      | NOT STARTED| —     | —  | —      |
| [A]  | Human Checkpoint A          | —                                   | PENDING    | —     | —  | —      |
| WP06 | Materials                   | claude/v08-wp06-materials           | NOT STARTED| —     | —  | —      |
| WP07 | Instruments                 | claude/v08-wp07-instruments         | NOT STARTED| —     | —  | —      |
| WP08 | Composition                 | claude/v08-wp08-composition         | NOT STARTED| —     | —  | —      |
| WP09 | Automation                  | claude/v08-wp09-automation          | NOT STARTED| —     | —  | —      |
| WP10 | Performance (Cue/Surface)   | claude/v08-wp10-performance         | NOT STARTED| —     | —  | —      |
| WP11 | Archive                     | claude/v08-wp11-archive             | NOT STARTED| —     | —  | —      |
| WP12 | Hardening                   | claude/v08-wp12-hardening           | NOT STARTED| —     | —  | —      |
| [B]  | Human Checkpoint B          | —                                   | PENDING    | —     | —  | —      |
| WP13 | Cutover                     | claude/v08-wp13-cutover             | NOT STARTED| —     | —  | —      |

---

## Current Focus

**WP01 (recovery)** in progress on branch `claude/v08-wp01-toolchain-recovery`.

WP00 merged 2026-07-13 (PR #4). Recovery audit (branch `claude/taroke-v08-recovery-audit-ajf7b3`) is the canonical reference for phase decisions through WP05.

Original PRs #5–#9 are frozen pending recovery rebuilds. Do NOT merge them.

WP01 recovery scope: workspace scaffold + CI with correct Playwright Chromium + verifier; deploy-to-main bot removed; no pre-built artifacts committed.

---

## Deployment State

| Location | Content           | Status  |
|----------|-------------------|---------|
| `/`      | v07.8 (frozen)    | Live    |
| `/next/` | v08 (not yet built) | Empty |
| `/legacy/v07/` | —           | Empty until WP13 |

---

## Checkpoint A Packet Requirements (WP05 output)

Prepare from docs/v08/program/12_HUMAN_CHECKPOINTS.md:
- `/next/` URL
- tested commit + full test breakdown
- desktop/mobile screenshots (7 viewports)
- JSON project + standalone HTML
- 10-minute task script
- glossary
- known limitations
- structured feedback form

**Stop at Checkpoint A. Do not start WP06 before Mohammad returns verdict.**

---

## Stop Conditions

Stop the program (not just the current WP) for:

1. unavailable Sonnet 4.6 medium configuration
2. baseline failure that cannot be responsibly resolved
3. schema incompatibility requiring product-level change
4. real Grave data loss
5. editor/artifact semantic divergence
6. contradiction between binding design specifications blocking implementation
7. inability to preserve v07 root
8. security issue
9. unavailable required repository permission

Ordinary defects, layout issues, and test failures: diagnose and fix; do not stop.

---

## Evidence Index

See `docs/v08/EVIDENCE_INDEX.md` for per-WP evidence records.

---

*Last updated: WP00 merged (PR #4) — 2026-07-13*


## AUTHORITY — docs/v08/EXECUTION_DAG.md

# TAROKE RIMIXER v08 — Execution DAG

**Model:** claude-sonnet-4-6  **Effort:** medium  
**Baseline:** 534 passed, 0 failed (tag: v07.8-release-checkpoint / f7183f01)  
**Program authority:** `docs/v08/program/` — immutable design specification

---

## Work Package Graph

```
WP00 ──► WP01 ──► WP02 ──► WP03 ──┐
                                   ├──► WP05 ──► [Checkpoint A] ──► WP06..WP11
                              WP04 ┘                                      │
                                                                      WP12 ──► [Checkpoint B] ──► WP13
```

**Sequential dependencies (must not overlap):**

- WP00 must complete before any other WP starts
- WP01 must complete before WP02
- WP02 must complete before WP03
- WP03 + WP04 must both complete before WP05
- WP05 + Checkpoint A before WP06–WP11
- WP06–WP11 may proceed in parallel within ownership rules
- WP12 after WP06–WP11
- WP13 after Checkpoint B acceptance

**Concurrent ownership constraints:**
- Core schema: one owner at a time (WP02 owns until merged)
- Root Redux store: one owner at a time (WP03 owns until merged)
- Global CSS tokens: one owner at a time (WP04 owns until merged)
- Root `/`: read-only until WP13

---

## Work Packages

### WP00 — Program Bootstrap
**Branch:** `claude/v08-wp00-program-bootstrap`  
**Scope:** Control docs, claude assets, baseline inventory, CI foundations, execution-policy corrections. No functional change.  
**Gate:** 534 pass; v07 root unchanged; model policy Sonnet 4.6/medium; control docs complete; agent defs validated; test ledger established; independent review; PR merged.

### WP01 — Workspace and Toolchain
**Branch:** `claude/v08-wp01-toolchain`  
**Scope:** React+TS+Vite setup, npm workspaces layout, packages/core packages/schema packages/artifact-runtime packages/ui packages/fixtures, Storybook, Vitest, Playwright, CI skeleton, blank `/next/`.  
**Gate:** CI green; blank `/next/` deploys; v07 root unchanged; 534 pass.

### WP02 — Core and Schema Boundary
**Branch:** `claude/v08-wp02-core-schema`  
**Scope:** Typed models in packages/schema, packages/core TS adapter/port of v07 core.js, migration adapters, import receipt, unknown-field preservation, deterministic RNG parity, contract tests.  
**Gate:** Core unit + property + contract tests pass; generation parity vs v07; 534 legacy pass.

### WP03 — State, Commands, Undo, Autosave
**Branch:** `claude/v08-wp03-state`  
**Scope:** Redux Toolkit store, typed command layer, Immer patches, undo/redo, selection state, autosave, preview freshness, runtime state.  
**Gate:** Store/command tests, undo tests, autosave tests; 534 legacy pass.

### WP04 — UI Foundation and Shell
**Branch:** `claude/v08-wp04-ui-shell`  
**Scope:** CSS tokens, primitive components (Button/fields/select/popover/dialog/collection/sortable), Transport, grouped Navigator, Workspace, Inspector split, mobile sheets, Storybook stories.  
**Gate:** Storybook deploys; accessibility checks pass; responsive checks pass; 534 legacy pass.

### WP05 — Complete Vertical Slice
**Branch:** `claude/v08-wp05-vertical-slice`  
**Scope:** Full authored journey: import → receipt → bank/sample → sample edit → relative weight → role-aware form → device input → route variable insertion → pattern → scene → WHEN→THEN trigger → Cue → Surface → Unmix Line → Take → JSON export → standalone HTML → preview → autosave restore. Deploy to `/next/`.  
**Gate:** Canonical journey exercisable end-to-end; design conformance check; Checkpoint A packet prepared; human review.

### WP06 — Materials
**Branch:** `claude/v08-wp06-materials`  
**Scope:** Full Banks/Samples, bulk paste preview, merge/sort, expected share/activity, role-aware Forms, delete/reroute.

### WP07 — Instruments
**Branch:** `claude/v08-wp07-instruments`  
**Scope:** Devices/inputs/routes, route palette, validation, Cue.

### WP08 — Composition
**Branch:** `claude/v08-wp08-composition`  
**Scope:** Pattern Matrix, Flow Score, accessible reorder (pointer/touch/keyboard/Move), current scheduler semantics.

### WP09 — Automation
**Branch:** `claude/v08-wp09-automation`  
**Scope:** WHEN→THEN trigger editor, parity, provenance.

### WP10 — Performance (Cue/Surface/Monitor/Unmix/Takes)
**Branch:** `claude/v08-wp10-performance`  
**Scope:** Cue, Surface follow policy, Monitor, Unmix Line, Takes.

### WP11 — Archive
**Branch:** `claude/v08-wp11-archive`  
**Scope:** Import receipt UI, JSON/HTML export, autosave/recovery, preview, error handling.

### WP12 — Hardening
**Branch:** `claude/v08-wp12-hardening`  
**Scope:** Cross-browser, a11y, performance, security, visual regression, docs, all legacy test mappings. Checkpoint B packet.

### WP13 — Cutover
**Branch:** `claude/v08-wp13-cutover`  
**Scope:** Archive v07 under `/legacy/v07/`, replace root with v08, live smoke, rollback verification, release tag `v08.0-editor-rebuild`.

---

## File Ownership

| File / Package          | Owner WP  | Concurrent lock |
|-------------------------|-----------|-----------------|
| packages/schema/        | WP02      | exclusive until merged |
| packages/core/          | WP02      | exclusive until merged |
| packages/artifact-runtime/ | WP02   | exclusive until merged |
| apps/workbench/store/   | WP03      | exclusive until merged |
| packages/ui/ tokens     | WP04      | exclusive until merged |
| src/ (v07 root)         | FROZEN    | read-only throughout |
| index.html (root)       | FROZEN    | read-only until WP13 |
| docs/v08/STATUS.md      | Lead      | updated after each WP |

---

## Human Checkpoints

| Checkpoint | After  | Required before |
|------------|--------|-----------------|
| A          | WP05   | WP06 start      |
| B          | WP12   | WP13 start      |

Stop completely at each checkpoint. Do not start next phase until Mohammad returns verdict.

---

*Last updated: WP00 initialization*


## ACTIVE DECISIONS AND EPISODES

[
  {
    "timestamp": "2026-07-14T13:14:31+00:00",
    "id": "active-TAROKE-RECOVERY-VERIFY-1784034871",
    "type": "task_status",
    "status": "active",
    "summary": "TAROKE-RECOVERY-VERIFY → active",
    "affects": [
      "TAROKE-RECOVERY-VERIFY"
    ],
    "source": "scripts/loom.py",
    "confidence": "verified"
  }
]


## DIRECT DEPENDENCIES

[]


## DIRECT DEPENDENTS

[
  {
    "id": "TAROKE-WP00-CERTIFY",
    "title": "Certify WP00 merged; integrate Loom without duplicating v08 program",
    "type": "verification",
    "status": "planned",
    "depends_on": [
      "TAROKE-RECOVERY-VERIFY"
    ],
    "authority": [
      "docs/v08/STATUS.md",
      "docs/v08/EVIDENCE_INDEX.md",
      "docs/v08/program/07_AGENT_ORCHESTRATION_AND_WORK_PACKAGES.md"
    ],
    "scope": {
      "include": [
        "project/**",
        "scripts/**",
        ".claude/**",
        "artifacts/**"
      ]
    },
    "deliverables": [
      "artifacts/TAROKE-WP00-CERTIFY/summary.md"
    ],
    "verification": [
      {
        "kind": "command",
        "value": "python scripts/loom.py validate"
      },
      {
        "kind": "command",
        "value": "python3 scripts/verify_v07_baseline.py"
      }
    ],
    "review_required": false,
    "human_checkpoint": false,
    "notes": "Verify WP00 actually merged to main. Retain 534/0. No production behavior change."
  }
]

