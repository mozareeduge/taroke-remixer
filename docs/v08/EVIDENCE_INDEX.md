# TAROKE RIMIXER v08 — Evidence Index

**Model:** claude-sonnet-4-6  **Effort:** medium

Per-WP evidence records. Updated after each WP merges.

---

## Format

```
WP:       WP##
Branch:   claude/v08-wp##-name
Commit:   <sha>
PR:       #NNN
Merged:   YYYY-MM-DD
Tests:    NNN passed, 0 failed (suites listed)
Visual:   screenshot paths
A11y:     summary
Perf:     summary
Security: summary
Compat:   summary
Reviewer: who reviewed
Findings: list of findings and dispositions
Non-blockers: list
Rollback: how to revert
```

---

## WP00 — Program Bootstrap

**Branch:** claude/v08-wp00-program-bootstrap  
**Status:** IN PROGRESS  

**Commit:** c1d8855 (latest; adds verifier + corrects reviewer classification)  
**Tests:** 534 passed, 0 failed (all 16 v07 suites — 14+38+35+16+10+5+50+28+19+30+51+3+32+16+76+111)  
**Verifier:** `python3 scripts/verify_v07_baseline.py` (deterministic; parses per-suite counts; fails on any mismatch)  

**Independent Review — classification (corrected 2026-07-13):**  
The "independent reviewer" recorded in commit 8bd5acf was an intra-session Claude sub-agent spawned from the same session that authored WP00. This constitutes a same-session self-review, not an external or genuinely fresh-context review. The recovery audit (branch `claude/taroke-v08-recovery-audit-ajf7b3`, commit `d37a64b`) documents this classification. The gate condition `[x] independent reviewer approved` below reflects that the review was performed, but the reviewer classification has been downgraded to **intra-session sub-agent**.

A fresh-context independent review (separate session, no prior exposure to this conversation) is required before PR #4 can be marked ready for merge. See recovery audit doc §6 for the review protocol.

**Gate conditions:**
- [x] 534 tests pass (verified serially via `scripts/verify_v07_baseline.py` on this branch)
- [x] v07 root unchanged (src/, index.html, styles.css, tests/, package.json not in diff)
- [x] model policy: claude-sonnet-4-6 / medium throughout
- [x] program design authority unchanged (only execution-policy language corrected)
- [x] all 7 control documents created
- [x] all 6 agent definitions validated (model + effort pinned)
- [x] hooks validated and installed
- [x] test ledger established (534 tests across 16 suites mapped)
- [x] intra-session sub-agent review completed (no P0/P1 findings)
- [ ] **fresh-context independent review** (separate session) — REQUIRED before merge
- [ ] PR merged (pending)
- [ ] STATUS updated post-merge

---

*Later WPs will be recorded here as they merge.*
