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
| WP01 | Workspace/Toolchain (recovery) | claude/v08-wp01-toolchain-recovery | MERGED (#10) | 534 | #10 | be91655 |
| WP02 | Core/Schema Boundary (recovery) | claude/v08-wp02-core-schema-recovery | MERGED (#11) | 534 | #11 | 735bcaa |
| WP03 | State/Commands/Undo (recovery) | claude/v08-wp03-state-commands-recovery | MERGED (#12+#13) | 152 | #12+#13 | 539c0fa+6810bd8 |
| WP04 | UI Foundation/Shell (recovery) | claude/v08-wp04-ui-shell-recovery | MERGED (#14) | 152 | #14 | 5a64cef |
| WP05 | Vertical Slice (recovery)   | claude/v08-wp05-vertical-slice-recovery | MERGING | 206 | #15 | a781bf9 |
| [A]  | Human Checkpoint A          | —                                   | APPROVED_WITH_CONDITIONS | — | — | — |
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

**Human Checkpoint A** — APPROVED_WITH_CONDITIONS (Mohammad, 2026-07-16). Merging PR #15. WP06 requires a new GPT-authored Relay workload before starting.

WP00 merged 2026-07-13 (PR #4). WP01–WP04 all merged (PRs #10–#14). WP05 recovery branch
is the Checkpoint A candidate on PR #15 (commit `a05010e`). Do not merge or begin WP06
before Checkpoint A verdict.

**Do NOT merge WP05 or begin WP06 until Checkpoint A verdict is received.**

Checkpoint A packet: `docs/v08/HUMAN_CHECKPOINT_A.md`
Experience reviews: `docs/v08/EXPERIENCE_REVIEWS_WP05.md`

Original PRs #5–#9 are frozen; close them after the recovery branches merge.
Recovery audit branch: `claude/taroke-v08-recovery-audit-ajf7b3` — canonical reference for
all phase decisions through WP05.

**Evidence summary (2026-07-16 — candidate commit a781bf9)**
- v07 baseline: 534 passed, 0 failed (CI run 29530118934)
- v08 unit/component: 206 passed, 0 failed (9 test files, CI run 29530118934)
- TypeScript: 0 errors (CI run 29530118934)
- Build: → artifact in /next/ (CI run 29530118934)
- E2E: Firefox ✓, Chromium ✓, WebKit ✓, Mobile (Chromium portrait + WebKit) ✓ (CI run 29530118934)
- F-REF: slot rename/delete cascades route template refs (CI-verified cb9848c)
- F-REORDER-TOUCH: touch drag-and-drop with native passive:false listener + dedicated onTouchCancel (CI-verified a781bf9)
- F-V07-DRAFT: non-destructive v07 migration banner (CI-verified a2e3de5)
- F-FREEZE: candidate a781bf9 frozen, all 8 CI jobs green (run 29530118934)
- F-REVIEW: 3 rounds of reviews; Round 3 (a781bf9) APPROVED×3, no P0/P1
- F-DEPLOY: deployed — workflow run 29539529622, all 10 steps green, 2026-07-16T22:26:51Z (root + /next/ live)

---

## Deployment State

| Location | Content           | Status  |
|----------|-------------------|---------|
| `/`      | v07.8 (frozen)    | Live    |
| `/next/` | v08 (built 2026-07-14; pending deploy after Checkpoint A merge) | Pending |
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

*Last updated: WP05 candidate commit a781bf9; F-REF; F-REORDER-TOUCH (passive:false + dedicated onTouchCancel); F-V07-DRAFT; F-FREEZE (CI green run 29530118934); F-REVIEW Round 3 APPROVED×3; F-DEPLOY deployed (run 29539529622, 2026-07-16T22:26:51Z, root + /next/ live); F-TRUTH synchronized; Human Checkpoint A AWAITING VERDICT — 2026-07-16*
