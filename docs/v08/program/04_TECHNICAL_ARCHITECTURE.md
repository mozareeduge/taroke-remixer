# 04 — Technical Architecture

## Stack decision

Hybrid rebuild:

- React + TypeScript editor;
- Vite static build;
- pure TypeScript core and artifact runtime;
- Redux Toolkit serializable state;
- Immer patches for undo/redo;
- React Aria Components for accessible controls/collections;
- dnd-kit only for custom sortable surfaces where needed;
- Vitest + Testing Library;
- Storybook;
- Playwright across Chromium, Firefox, WebKit;
- axe integration.

No Next.js, backend, SSR, account, or cloud persistence.

## Repository layout

```text
/
  index.html                  # v07.8 until cutover
  src/                        # current v07 source until cutover
  apps/workbench/
  packages/core/
  packages/schema/
  packages/artifact-runtime/
  packages/ui/
  packages/fixtures/
  tests/e2e/
  tests/visual/
  tests/accessibility/
  tests/compatibility/
  next/                       # v08 accepted preview
  docs/v08/
  .claude/
```

Use npm workspaces unless current evidence justifies another package manager.

## Boundaries

### Core

Pure functions:

- weighted selection;
- forms;
- templates;
- consumed inputs;
- triggers;
- patterns/flow;
- deterministic RNG;
- validation.

No DOM, React, localStorage, or downloads.

### Schema

- types;
- version constants;
- migration adapters;
- import receipts;
- unknown-field preservation.

Do not rewrite mature migration before parity tests.

### Artifact runtime

- standalone HTML builder;
- embedded JSON;
- runtime bundle;
- editor/artifact parity.

No React.

### UI

Unstyled/project-styled primitives:

- Button;
- fields;
- select/combobox;
- popover;
- dialog/sheet;
- collection;
- sortable list;
- inspector;
- split pane;
- transport;
- status;
- error boundary.

### Workbench

- shell/navigation;
- store;
- selection;
- autosave;
- import/export;
- Cue/Surface;
- inspector composition.

## State

```ts
type RootState = {
  project: ProjectState;
  selection: SelectionState;
  editor: EditorState;
  runtime: RuntimeState;
  history: HistoryState;
  importReceipt: ImportReceiptState;
};
```

Only `project` is exported.

## Commands

All project mutation passes through typed commands.

The command layer:

- produces forward/inverse Immer patches;
- validates;
- records undo;
- schedules autosave;
- marks preview freshness;
- labels the transaction.

Direct component mutation of project objects is forbidden.

Coalesce typing and numeric scrubbing. Do not coalesce import, delete, bulk merge, or route replacement.

## Import pipeline

```text
read
→ detect JSON/HTML
→ extract raw project
→ migrate without contamination
→ validate
→ import receipt
→ set project
→ select first actual bank
→ reset transient runtime/preview
→ autosave
```

Never fall back to default while reporting success.

## Deployment

During rebuild:

- root `/` remains v07.8;
- v08 preview builds to `/next/`.

Cutover archives v07 under `/legacy/v07/`, replaces root with v08, verifies rollback, then tags.

## Performance budgets

Standard Grave-shaped project:

- usable editor <2.5s on CI reference;
- keystroke reflection <50ms p95;
- selected-row update <100ms p95;
- bank switch <150ms p95;
- route palette <100ms;
- no unexpected >200ms long task;
- no whole-app rerender for one field.

Stress fixtures:

- 100 banks;
- 10,000 samples;
- 100 devices/routes;
- 100 patterns/scenes/triggers.

Virtualize only after measurement.
