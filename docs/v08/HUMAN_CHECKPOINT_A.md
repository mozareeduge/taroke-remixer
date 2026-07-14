# Human Checkpoint A — Recovery Program Gate

**Program**: TAROKE Remixer v08 Recovery (WP01–WP05)
**Prepared**: 2026-07-14
**Reviewer**: Mohammad (designated authority)
**Status**: AWAITING REVIEW

---

## What This Is

Human Checkpoint A is the gate between the recovery program (WP01–WP05) and the
continuation work (WP06+). Nothing in WP06 begins until this checkpoint is cleared.

---

## Recovery Program Summary

| WP  | Branch | Purpose | Status |
|-----|--------|---------|--------|
| WP00 | `claude/v08-wp00-recovery-audit` | Baseline verifier + EVIDENCE_INDEX | MERGED (#4) |
| WP01 | `claude/v08-wp01-toolchain-recovery` | CI fix: correct Playwright, verifier command, remove deploy bot | READY FOR MERGE |
| WP02 | `claude/v08-wp02-core-schema-recovery` | Schema version policy (0.7-reset / 0.8.0), CORE_PARITY_LEDGER | READY FOR MERGE |
| WP03 | `claude/v08-wp03-state-commands-recovery` | Autosave key (v08.draft), enablePatches() placement | READY FOR MERGE |
| WP04 | `claude/v08-wp04-ui-shell-recovery` | AppShell, Transport, Navigator, Inspector, Workspace | READY FOR MERGE |
| WP05 | `claude/v08-wp05-vertical-slice-recovery` | Store-backed Takes, ImportReceiptBanner, accessible reorder, blocker fixes | READY FOR MERGE |

Superseded PRs to close: #5, #6, #7, #8, #9 (original WP01–WP05 before recovery).

---

## Evidence

### v07 Baseline (immutable reference)
- Tag: `v07.8-release-checkpoint` → commit `f7183f01`
- Verifier: `python3 scripts/verify_v07_baseline.py`
- Result: **534 passed, 0 failed** across 16 suites (confirmed on main)

### v08 Unit/Component Tests (WP05 stack)
- Runner: `npm run test --workspace=apps/workbench`
- Result: **152 passed, 0 failed** across 8 test files

### TypeScript
- Runner: `npm run typecheck`
- Result: **0 errors**

### Build
- Runner: `npm run build:next`
- Result: **1341 modules, 0 errors** → artifact in `/next/`

### E2E Smoke (Playwright / Chromium)
- Runner: project-local Playwright against `vite preview` on port 4173
- Test: `tests/e2e/smoke.spec.ts` — "v08 workbench shell loads"
- Result: **1 passed**

### Experience Reviews
See `docs/v08/EXPERIENCE_REVIEWS_WP05.md` for full verdicts.

| Reviewer | Verdict |
|----------|---------|
| Novice   | NEEDS_WORK → blocker fixed (silent import error) |
| Expert   | APPROVED_WITH_NOTES → blocker fixed (localRunState divergence) |
| Mobile/a11y | NEEDS_WORK → WCAG items deferred to WP06 (tracked) |

---

## Key Decisions Requiring Mohammad's Review

1. **WCAG deferral**: Three WCAG 2.1 AA items (contrast, skip-nav, focus-visible) are filed
   as WP06 gate items rather than fixed in WP05. Is this acceptable?

2. **Merge order**: WP01 → WP02 → WP03 → WP04 → WP05 in order onto main, then close #5–#9.
   Confirm before beginning.

3. **Deploy**: After merge, the `/next/` artifact goes live at the existing GitHub Pages URL.
   The v07 root remains at `/` unchanged. Confirm.

---

## What Must NOT Happen Until Checkpoint Clears

- [ ] Do not begin WP06
- [ ] Do not merge WP01–WP05 branches
- [ ] Do not deploy the new /next/ artifact
- [ ] Do not close PRs #5–#9

---

## Checkpoint Result

- [ ] APPROVED — proceed with merge sequence and WP06 planning
- [ ] APPROVED_WITH_CONDITIONS — conditions: _______________
- [ ] BLOCKED — reason: _______________

Reviewer signature: __________________ Date: __________
