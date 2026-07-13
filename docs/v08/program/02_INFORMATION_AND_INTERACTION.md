# 02 — Information Architecture and Interaction

## Desktop shell

Persistent regions:

1. top Transport;
2. grouped left Navigator;
3. central Workspace;
4. right Inspector;
5. optional bottom Monitor.

### Navigator groups

MATERIAL:
- Source
- Banks & Samples
- Forms

INSTRUMENT:
- Devices
- Routes

COMPOSITION:
- Patterns
- Flow Score

AUTOMATION:
- Triggers

PERFORMANCE:
- Cue & Surface
- Takes

ARCHIVE:
- Import & Export

### Inspector

Edits one selected object. Selection never moves the central list unexpectedly. The inspector stays visible on desktop and becomes a sheet on mobile.

## Mobile

- compact top transport;
- grouped bottom destinations;
- one full chamber at a time;
- inspector as full-height sheet or dedicated route;
- variable palette and bank actions as bottom sheets;
- no hover-only explanation.

## Key screens

### Banks & Samples

- bank list;
- selected bank table;
- sample inspector.

Toolbar:
- Add sample
- Paste multiple
- Search/filter
- Bank actions

Row:
- literal
- role
- relative weight
- expected share
- keep unchanged
- activity
- drag + Move menu

### Forms

- global rules;
- bank policy;
- selected sample exception.

Contextual entry from sample without losing position.

### Devices and Routes

Input row:

`slot → bank → default role`

Route row:

`name | weight | template excerpt | validation`

Selected route inspector includes editor and contextual variable palette. Typing `{` may open it. No permanent chip wall.

### Pattern Matrix

Reusable ordered slots with device/breath, repeat, chance, mute, reorder, Cue.

### Flow Score

Ordered scenes with name, pattern, enabled, chance/current mode, activity, reorder. Do not add new transition semantics in initial rebuild.

### Triggers

Collapsed:

`condition → action · chance · enabled`

Expanded WHEN:
- consumed sample bank;
- any / selected / custom source text;
- chance.

THEN:
- append / prepend / replace;
- text.

### Cue & Surface

Cue is isolated audition.

Surface is active poem output with follow policy.

### Unmix / Takes

Unmix shows samples, banks, roles, requested/rendered forms, device, route, pattern, scene, trigger, pre/post-trigger text.

Capture as Take.

## Interaction contracts

### Selection

- no unexpected scroll;
- visible inspector;
- visual selected state;
- keyboard/pointer parity;
- nearest valid selection after deletion.

### Editing

- immediate visible update;
- no whole-app render per keystroke;
- preserve focus/caret/textarea scroll;
- validation near field;
- project edits enter undo;
- UI-only state does not.

### Popovers

- one at a time;
- outside click;
- Escape;
- close after selection;
- focus return;
- mobile sheet.

### Reorder

- pointer/touch/keyboard;
- explicit Move earlier/later/start/end;
- insertion target;
- autoscroll;
- announcements;
- Escape cancel;
- undo;
- IDs stable.

### Destructive actions

- reference-aware delete;
- last bank protected;
- clear consequence;
- undo where safe;
- import warns about replacement.

### Bulk paste

Copy:

“Paste samples separated by commas or put one sample on each row.”

Preview parsed entries, blanks, repeats, role, merge/keep decision.

### Route palette

- button or `{`;
- search;
- slots grouped;
- relevant forms only;
- insert at caret;
- Escape;
- keyboard;
- mobile sheet;
- unknown authored syntax remains visible with validation.

### Undo

Undoable project edits, adds/deletes/reorder/bulk/sort/merge/routes/patterns/scenes/triggers.

Not undoable navigation, selection, scrolling, Cue output, Surface events, preview runtime.
