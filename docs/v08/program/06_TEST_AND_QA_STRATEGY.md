# 06 — Test and QA Strategy

## Root-cause protocol

For every defect:

1. reproduce;
2. classify;
3. instrument;
4. isolate;
5. write smallest failing regression;
6. fix root cause;
7. targeted tests;
8. affected package tests;
9. full suite;
10. inspect running UI;
11. evidence.

## Layers

### Static/type

TypeScript strict, ESLint, format, cycles, dead imports, forbidden direct mutation, unsafe HTML scan, production build.

### Core unit

Forms, weights, chance, parser, consumed inputs, triggers, deterministic RNG, scheduling, cleanup.

### Property-based

Generate projects and assert migration idempotency, no token loss, valid weighted selection, chance boundaries, no unresolved known slots, JSON/HTML round trips, unknown-field preservation.

### Contract

Versioned fixtures, receipts, references, exact bank order, repair stability, editor/artifact parity.

### Store/commands

Every command, undo, redo, coalescing, import boundary, autosave, preview stale state, selection after delete.

### Component

Fields, lists, popovers, sheets, inspectors, route palette, trigger rule, sortable collection, transport, Take capture.

### Accessibility

axe, names, IDs, headings, focus, dialogs, status, keyboard drag, reduced motion. No formal compliance claim.

### E2E

Playwright on Chromium, Firefox, WebKit for:

- create/import;
- sample/weight/forms;
- device/route;
- pattern/flow;
- trigger;
- Cue/Surface;
- Unmix/Take;
- JSON/HTML/preview;
- autosave/undo.

### Visual

Seven viewports:

- 1440×900
- 1280×800
- 1024×768
- 430×932
- 390×844
- 375×667
- 844×390

Never auto-update baselines without review.

### Performance

Marks, render counts, long tasks, standard/stress fixtures, bundle, long Surface run, preview stability.

### Fuzz/resilience

Corrupt input, huge literals, HTML-like text, Unicode/RTL, repeated IDs, missing refs, storage unavailable/quota, rapid navigation, repeated undo, interrupted import.

### Security

XSS through authored text, HTML escaping, sandbox, dependency audit, URL injection, secrets.

### Experience

Fresh agents and user complete the canonical journey.

## Flake policy

- no arbitrary sleeps;
- user-facing locators;
- isolated contexts;
- retries tracked;
- quarantine needs issue/owner/expiry;
- flaky critical test blocks merge.

## PR evidence

- package;
- base/head;
- changed files;
- criteria;
- tests/results;
- visual evidence;
- accessibility;
- performance;
- compatibility;
- review/fixes;
- non-blockers;
- rollback.
