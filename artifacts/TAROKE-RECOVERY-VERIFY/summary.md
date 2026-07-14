# TAROKE-RECOVERY-VERIFY — Evidence Summary

**Date:** 2026-07-14  
**Branch:** claude/project-loom-install-l3glrq (HEAD 410f32e)  
**Method:** git log, GitHub MCP list_pull_requests, list_branches, recovery audit document

---

## 1. Repository Identity

| Field | Value |
|-------|-------|
| Remote | mozareeduge/taroke-remixer |
| main HEAD | b3eca6b "post-merge: update STATUS for WP00 merged; WP01 recovery in progress" |
| origin/main | b3eca6b (synced) |
| v07.8-release-checkpoint tag | f7183f01037bf963612d4b56561d3b8cdde306b5 ✓ |

---

## 2. v07 Baseline

| Metric | Value |
|--------|-------|
| Result | **GATE PASSED** |
| Passed | 534 |
| Failed | 0 |
| Chromium | /opt/pw-browsers/chromium-1194/chrome-linux/chrome |
| Prerequisite | `pip install websocket-client requests` (missing in fresh environment) |

**Note:** The websocket-client module must be pre-installed before running the verifier.
This environment did NOT have it installed; once installed, all 534 tests pass.
This is a known environment bootstrap issue that must be addressed in CI.

---

## 3. WP00 Status

- **PR #4: MERGED** at 2026-07-13T16:08:57Z ✓
- Head sha at merge: c6589e3d3a1472ef571ae9ea7f3104011fc68752
- main now includes: docs/v08/ control docs, .claude/ agents/skills, deterministic verifier
- WP00 gate: 534 passed, 0 failed; v07 root unchanged; independent review APPROVED (agent, 2026-07-13)
- STATUS.md correctly records WP00 MERGED (#4)

---

## 4. PR Inventory

| PR | Title | State | Outcome |
|----|-------|-------|---------|
| #1 | Deploy v07 layout pass | CLOSED | MERGED |
| #2 | v07.1 QA hardening | CLOSED | MERGED |
| #3 | v08 program upload | CLOSED | MERGED |
| #4 | WP00 program bootstrap | CLOSED | **MERGED** ✓ |
| #5 | WP01 original (superseded) | CLOSED | NOT MERGED — superseded by #10 |
| #6 | WP02 original (stale stack) | **OPEN DRAFT** | NOT MERGED — **needs closing** |
| #7 | WP03 original (stale stack) | **OPEN DRAFT** | NOT MERGED — **needs closing** |
| #8 | WP04 original (stale stack) | **OPEN DRAFT** | NOT MERGED — **needs closing** |
| #9 | WP05 original prototype | **OPEN DRAFT** | NOT MERGED — **needs closing** |
| #10 | WP01 recovery | **OPEN DRAFT** | awaiting review + CI fix + merge |

---

## 5. Recovery Branch State

All recovery branches share base commit `fdd5130` (pre-WP00 main).
Current main is `b3eca6b` (post-WP00). The recovery branches do NOT include WP00 changes.

### Stack topology
```
fdd5130 (pre-WP00 main)
  └── 54b04e8  WP01-recovery
        └── 0fa99fc  WP02-recovery
              └── 0f8351a  WP03-recovery
                    └── d2eb596  WP04-recovery
                          └── 7788bf6  WP05-recovery (includes HUMAN_CHECKPOINT_A.md)
```

### Per-branch

| Branch | SHA | PR | Review | v07 on branch |
|--------|-----|----|--------|---------------|
| v08-wp01-toolchain-recovery | 54b04e8 | #10 OPEN | **None** | Untouched (expected 534/0) |
| v08-wp02-core-schema-recovery | 0fa99fc | **None** | **None** | Untouched |
| v08-wp03-state-commands-recovery | 0f8351a | **None** | **None** | Untouched |
| v08-wp04-ui-shell-recovery | d2eb596 | **None** | **None** | Untouched |
| v08-wp05-vertical-slice-recovery | 7788bf6 | **None** | **None** | Untouched (reported 534/0) |

---

## 6. Verified Defects

### D1 — WP01 CI: verifier doesn't read TAROKE_CHROMIUM_PATH (BLOCKER)
The CI yaml sets `TAROKE_CHROMIUM_PATH: ${{ env.PLAYWRIGHT_BROWSERS_PATH }}` but
`scripts/verify_v07_baseline.py` ignores this env var and uses hardcoded paths
(`/opt/pw-browsers/chromium-1194/...`). In GitHub Actions after
`npx playwright install chromium`, the binary is at a different path.
**Fix:** Update verifier to resolve Chromium via `npx playwright executablePath chromium`
or accept `TAROKE_CHROMIUM_PATH` as an override pointing to the binary (not directory).

### D2 — WP01 lacks independent review (BLOCKER)
PR #10 gate checklist: "Independent review" checkbox is unchecked.

### D3 — WP02–WP05 recovery: no PRs exist (BLOCKER)
Recovery branches for WP02–WP05 have been pushed but no PRs were opened.
These cannot be merged without PRs and independent review.

### D4 — Recovery branches not based on current main (STRUCTURAL)
All recovery branches branch from fdd5130 (pre-WP00). After WP01 is merged to
current main (b3eca6b), WP02 recovery must be rebased on top of merged WP01+main,
etc. The branches form a cumulative stack — each must be rebased in order.

### D5 — Original PRs #6–#9 still OPEN/DRAFT (CLEANUP)
These stale PRs should be closed once recovery equivalents have PRs.

### D6 — Human Checkpoint A document unmerged
docs/v08/HUMAN_CHECKPOINT_A.md exists only on v08-wp05-vertical-slice-recovery
(commit 7788bf6). It has not been merged. Its content says "READY FOR MERGE" for
all WPs — but none of them have been reviewed or merged as of this verification.
The document is premature relative to the actual state.

### D7 — /next/ deployment not verified
No evidence of live GitHub Pages deployment at /next/. Cannot be verified
without live URL inspection or CI artifact inspection.

### D8 — 3-browser journey not verified
Previous session reported Chromium smoke test only. Firefox and WebKit proofs
not found in any merged evidence.

### D9 — Accessibility findings (contrast, skip-nav, focus-visible) deferred
These were deferred in the previous session's experience review. Per the
addendum, they must be fixed unless Mohammad explicitly accepts them as
named non-blockers.

---

## 7. Active Risks (from addendum, assessed)

| Risk | Current Assessment |
|------|--------------------|
| WP01–WP05 not package-pure | CONFIRMED: WP01-05 recovery form a stack, not independent PRs |
| Original PRs open/superseded | CONFIRMED: #6-#9 open draft, not closed |
| "Ready for merge" without review | CONFIRMED: no independent review on any recovery branch |
| Only Chromium smoke test | CONFIRMED: no Firefox/WebKit evidence |
| Firefox/WebKit not proven | CONFIRMED |
| Complete vertical journey not proven | UNRESOLVED: WP05-recovery has commits but no merged evidence |
| Mobile/a11y NEEDS_WORK | UNRESOLVED: experience reviews reported but not independently verified |
| /next/ deployment not proven | CONFIRMED |
| Generated /next/ assets may commit to main | FIXED in WP01-recovery (deploy-next job removed) |
| Schema/autosave coexistence | UNVERIFIED at merge time |

---

## 8. Execution Plan (derived from verified state)

The correct execution order from verified facts:

1. **TAROKE-WP00-CERTIFY**: WP00 merged ✓; Loom installed ✓; commit Loom install to branch
2. **TAROKE-WP01-RECOVER**:
   - Fix CI verifier Chromium path (D1)  
   - Run independent review (D2)
   - Push updated branch, get PR #10 out of draft
   - Merge PR #10 to main
3. **TAROKE-WP02-RECOVER**:
   - Close PR #6 (D5)
   - Rebase v08-wp02-core-schema-recovery on merged main
   - Run independent review
   - Create PR, merge
4. **TAROKE-WP03-RECOVER**: same pattern (close #7, rebase, review, PR, merge)
5. **TAROKE-WP04-RECOVER**: same (close #8, rebase on WP01+WP02 merged, review, PR, merge)
6. **TAROKE-WP05-COMPLETE**: same (close #9, rebase, fix D6 (premature checkpoint doc), complete journey proof, review, PR, merge)
7. **CHECKPOINT-A**: prepare complete evidence packet, deploy /next/, stop for Mohammad

---

## 9. Loom Installation

Project Loom installed on claude/project-loom-install-l3glrq (commit 410f32e):
- scripts/loom.py ✓
- project/CONFIG.json ✓ (model: claude-sonnet-4-6, effort: medium)
- project/WORK.json ✓ (8-task graph)
- project/BRIEF.md + AUTHORITY.md ✓
- project/LEDGER.jsonl, STATE.md ✓
- .claude/agents/loom-{worker,reviewer,researcher}.md ✓
- .claude/skills/loom-{start,execute,review}/SKILL.md ✓
- `python scripts/loom.py validate` → PASS ✓

---

*Evidence: artifacts/TAROKE-RECOVERY-VERIFY/branches.json, baseline.json*
