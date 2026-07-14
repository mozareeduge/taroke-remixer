# Current State

- Project: TAROKE RIMIXER v08 Rebuild
- Updated: 2026-07-14T13:20:24+00:00
- Git branch: claude/project-loom-install-l3glrq
- Git commit: 2783c25
- Working tree: dirty
- Model: claude-sonnet-4-6 / medium

## Active
- TAROKE-WP01-RECOVER: Clean toolchain/CI PR from current main

## Ready
- none

## Blocked
- none

## Recently completed
- TAROKE-RECOVERY-VERIFY: Reconcile real repository state — branches, PRs, CI, tests, deployment
- TAROKE-WP00-CERTIFY: Certify WP00 merged; integrate Loom without duplicating v08 program

## Latest binding decisions
- Recovery branches WP01-05 branch from fdd5130 (pre-WP00); must be rebased on current main after each WP merges — one package-pure PR per WP in sequence. [decision-1784035167]

## Resume
1. `python scripts/loom.py validate`
2. `python scripts/loom.py next`
3. `python scripts/loom.py pack <task-id>`
4. execute the active pack; do not reconstruct history from chat
