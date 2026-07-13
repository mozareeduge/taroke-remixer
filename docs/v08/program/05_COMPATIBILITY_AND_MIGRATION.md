# 05 — Compatibility and Migration

Immutable baseline:

- tag `v07.8-release-checkpoint`
- commit `f7183f01037bf963612d4b56561d3b8cdde306b5`

## Compatibility

Exact editable compatibility:

- current v07 JSON;
- current v07 standalone HTML;
- Grave v3.2 accepted project;
- exact custom banks;
- legacy dictionary;
- explicit empty collections.

Unsupported/malformed input gives an actionable error and retains current work.

No silent default fallback.

## Import receipt

Display:

- file type;
- schema;
- title;
- ordered bank keys/count;
- token count;
- devices/inputs/routes;
- patterns/slots;
- scenes;
- triggers/enabled;
- repairs;
- warnings;
- unknown fields preserved;
- selected bank.

Expected Grave evidence:

- 33 trays;
- 270 tokens;
- 6 devices;
- 28 routes;
- 3 patterns;
- 3 scenes;
- 3 triggers;
- 0 enabled;
- 80 repairs.

## Migration invariants

1. Explicit trays authoritative.
2. Legacy dictionary authoritative when trays absent.
3. Defaults only when both absent.
4. Explicit empties preserved.
5. Bank/token order exact.
6. Metadata/roles exact.
7. IDs stable except deterministic duplicate repair.
8. Repair provenance stable.
9. No token loss.
10. References valid or reported.
11. Unknown fields preserved where possible.
12. Migration idempotent.

## Test migration ledger

Create `docs/v08/TEST_MIGRATION_LEDGER.md`.

For each v07 test record:

- behavior;
- original path;
- unchanged/adapted/replaced;
- new path;
- justification;
- reviewer;
- status.

No test removed because it is inconvenient.

## Cutover gate

Root replacement only after:

- all fixtures;
- real Grave rerun;
- runtime parity;
- two human checkpoints;
- cross-browser;
- a11y/visual/performance/security;
- rollback package.
