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
7. Run `./tests/run_all_tests.sh` to verify 534 still pass
8. Inspect the branch for the next WP before creating it
9. Do not modify design authority documents
10. Do not start Checkpoint B work before Checkpoint A verdict from Mohammad

---

## Work Package Status

| WP   | Name                        | Branch                              | Status     | Tests | PR | Commit |
|------|-----------------------------|-------------------------------------|------------|-------|----|--------|
| WP00 | Program Bootstrap           | claude/v08-wp00-program-bootstrap   | IN PROGRESS| —     | —  | —      |
| WP01 | Workspace/Toolchain         | claude/v08-wp01-toolchain           | NOT STARTED| —     | —  | —      |
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

**WP00** in progress on branch `claude/v08-wp00-program-bootstrap`.

WP00 scope: control docs, claude assets installation, execution-policy corrections, test ledger, CI foundations. No functional change.

WP00 gate (must all pass before merge):
- [ ] 534 tests pass
- [ ] v07 root unchanged
- [ ] model policy is Sonnet 4.6 / medium throughout
- [ ] program design authority unchanged
- [ ] control documents complete
- [ ] agent definitions validated and installed
- [ ] hooks validated and installed
- [ ] test ledger established
- [ ] independent reviewer approves
- [ ] PR merged
- [ ] STATUS updated

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

*Last updated: WP00 initialization — 2026-07-13*
