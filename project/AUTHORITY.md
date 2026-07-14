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
