# 10 — Acceptance, CI, Release, and Rollback

## Global gate

Required:

- all v07 behavior mapped;
- type/lint/unit/component/E2E/Storybook/build;
- exact import/no default contamination;
- Grave counts and 80 repairs;
- editor/Cue/Surface/artifact parity;
- no stale field, hidden selection result, scroll jump, caret loss;
- weight/chance distinction;
- role-aware Forms;
- caret variable palette;
- reorder across pointer/touch/keyboard/Move/undo;
- WHEN → THEN triggers;
- purpose-designed mobile;
- automated and manual accessibility;
- seven-viewport visual acceptance;
- performance/security budgets;
- two human checkpoints;
- JSON/HTML/autosave/preview;
- `/next/` before root;
- rollback.

## Severity

P0:
- data loss;
- wrong import;
- semantic artifact divergence;
- corruption;
- exploit;
- public outage.

P1:
- essential workflow blocked;
- unreliable editing;
- drag-only;
- mobile control unreachable;
- undo corruption;
- Cue changes Surface.

P2:
- misleading copy;
- moderate layout/a11y/performance issue.

P3:
- polish/enhancement.

P0/P1 block merge. P2 blocks milestone unless explicitly accepted.

## CI jobs

- static/type/lint
- core/schema/state unit
- component/Storybook
- E2E Chromium
- E2E Firefox
- E2E WebKit
- visual
- compatibility
- artifact parity
- security
- build-next
- evidence artifacts

## PR rules

- package branch;
- fresh review;
- jobs green;
- no P0/P1;
- ledger/decision updates;
- executable evidence.

## Preview

Accepted builds publish at:

`https://mozareeduge.github.io/taroke-remixer/next/`

Root remains v07.8.

## Cutover

- RC zip;
- archive v07 `/legacy/v07/`;
- verify old tag/archive;
- deploy v08 root;
- live smoke;
- tag after deployment/tests.

## Rollback

Keep prior root files, deployment commit, instructions, tested import/export assets. Rehearse restoration.

## Release name

Final target:

`v08.0-editor-rebuild`

Use alpha/beta/rc tags before final.
