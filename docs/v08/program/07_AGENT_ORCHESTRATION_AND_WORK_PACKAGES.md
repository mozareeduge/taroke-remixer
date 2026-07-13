# 07 — Agent Orchestration and Work Packages

## Operating model

One claude-sonnet-4-6 lead owns the program and uses a medium dynamic workflow or agent team.

**Execution policy (correction requested by Mohammad, recorded in docs/v08/DECISIONS.md D-001):**
The complete program uses claude-sonnet-4-6 at medium effort throughout. No model escalation for architecture, review, debugging, compatibility, or release work. All custom agent definitions use `model: claude-sonnet-4-6` and `effort: medium`.

The lead maintains:

- `EXECUTION_DAG.md`
- `STATUS.md`
- `DECISIONS.md`
- `RISK_REGISTER.md`
- `TEST_MIGRATION_LEDGER.md`

## Agents

- Program Lead
- Baseline Archivist
- Domain/UX Guardian
- Core Compatibility Engineer
- State Architecture Engineer
- UI Foundation Engineer
- Materials Engineer
- Instrument Engineer
- Composition Engineer
- Automation Engineer
- Performance Engineer
- Archive Engineer
- Test Architect
- Accessibility Reviewer
- Performance/Security Reviewer
- Independent PR Reviewer
- Experience Reviewer

## Writer/reviewer

Each package:

1. writer implements;
2. test agent attacks acceptance;
3. fresh reviewer audits diff and running app;
4. writer fixes verified findings;
5. reviewer rechecks;
6. lead merges.

Use isolated worktrees. Do not allow concurrent ownership of core schema, root store, or global tokens.

## Work packages

### WP00 Program bootstrap

Claude assets, v08 docs, baseline, test ledger, CI skeleton, `/next/` strategy. No functional change.

Gate: v07 root unchanged; 534 pass.

### WP01 Workspace/toolchain

React/TS/Vite, workspaces, pure TS packages, Storybook, Vitest, Playwright, CI, blank `/next/`.

### WP02 Core/schema boundary

Typed models, current core adapter/port, migrations, artifact runtime, deterministic parity.

### WP03 State/commands/undo

Redux, commands, Immer patches, selection, runtime, autosave, freshness.

### WP04 UI foundation/shell

Transport, grouped nav, workspace, inspector, mobile sheets, tokens, primitives, Storybook.

### WP05 Vertical slice

One complete journey:

Source → sample → Forms → route → pattern → scene → trigger → Cue → Surface → Unmix → Take → export.

Deploy `/next/`, run Human Checkpoint A. Do not broaden before feedback is classified.

### WP06 Materials

Full banks/samples, bulk preview, merge/sort, expected share/activity, role-aware Forms, delete/reroute.

### WP07 Instruments

Devices/inputs/routes, palette, validation, Cue.

### WP08 Composition

Pattern Matrix, Flow Score, accessible reorder, current scheduler semantics.

### WP09 Automation

WHEN → THEN trigger editor, parity, provenance.

### WP10 Performance

Cue, Surface, Monitor, Unmix, Takes, follow policy.

### WP11 Archive

Import receipt, JSON/HTML, autosave, preview, errors.

### WP12 Hardening

Cross-browser, a11y, performance, security, visual, docs, all legacy mappings. Human Checkpoint B.

### WP13 Cutover

Archive v07, root v08, live smoke, rollback, release tag.

## Stop conditions

Stop program for:

- schema break;
- unmapped legacy behavior;
- Grave fidelity failure;
- artifact divergence;
- new product concept outside charter;
- human domain-design conflict.

Ordinary defects are fixed and work continues.
