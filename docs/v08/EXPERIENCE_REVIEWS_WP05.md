# WP05 Experience Reviews

Three independent fresh-context reviews conducted before Human Checkpoint A.
Updated 2026-07-14 to reflect the Cue/Surface isolation fix.

---

## 1. Novice User — NEEDS_WORK → FIXED

**Strengths**
- ArchivePanel import warning copy ("Replaces the current project. Undo is available.") is clear safety messaging.
- Transport StatusLamp + status label give continuous, legible saved/running state feedback.
- PerformancePanel has clear separation: Cue section for private audition, Surface section with its own "Generate ▶" button.

**Concerns (deferred to WP06)**
- Navigator uses abbreviated group labels (MATERIAL, INSTRUMENT) with no on-hover explanation.
- MaterialsPanel uses dense domain vocabulary (Banks, Trays, Literal, Wt) with no tooltips.
- PerformancePanel UNMIX exposes technical internals (tick, consumedInputs, direct/derived) without explanatory framing.

**Blocker — FIXED (this session)**
Cue "Generate ▶" silently appended to Surface history, making the Surface section reflect
private audition events. Users saw Surface lines appear when clicking Cue. Fix: complete
Cue/Surface separation — Cue writes only to the Cue preview (local state), Surface has its
own store-backed history written only by "Surface: generate" action.

**Prior blocker (330be1e)**
`ArchivePanel.doImport` silently swallowed parse failures. Fix: visible `role="alert"` error
paragraph and `reader.onerror` handler.

---

## 2. Expert / Power User — APPROVED_WITH_NOTES → blocker fixed

**Strengths**
- `generateEvent` is deterministic with pluggable RNG, zero DOM dependencies — seedable and batchable.
- UNMIX trace panel gives per-slot provenance (tray, sourceLiteral, direct/derived, trigger) that generative artists need. Now correctly shows the last Surface event, not the Cue preview.
- `surfaceSlice` is store-backed — Surface history persists across panel navigation.
- Command-patch architecture carries label + patches + inversePatches — correct foundation for undo.

**Concerns (deferred to WP06)**
- No undo/redo surface exposed in UI (reducers exist, no Cmd+Z binding yet).
- Trigger evaluation stops at first match with no user-visible prioritization control.
- StanzaSlot `chance` field serves as both inclusion gate and loop-continuation roll — no `loopChance` concept.

**Blocker — FIXED (330be1e)**
`localRunState.current` in PerformancePanel diverged from the project on live edits. Fix:
only the queue is held locally; tick/scene/stanza now read from Redux `runState` directly.
The queue is filtered before each `generateEvent` call to remove entries for devices no
longer in `project.lineDevices`.

**Cue/Surface isolation fix**
Cue now uses its own `cueQueueRef` that does NOT call `dispatch(recordEvent())`. Surface uses
`surfaceQueueRef` and DOES dispatch `recordEvent` to advance the committed tick. The two queues
are independent — Cue is a true private audition.

---

## 3. Mobile / Accessibility — NEEDS_WORK → WCAG deferred to WP06

**Strengths**
- React Aria Components wrapping (Button, Field) provides keyboard focus management and `aria-disabled`.
- Live-region discipline correct: ImportReceiptBanner uses `aria-live="polite"`, CUE output uses `aria-live="polite" aria-atomic="true"`.
- Icon buttons carry context-specific `aria-label` throughout (Move up/down, Remove take, Dismiss import receipt, Capture Take, Clear surface history).
- Surface "Generate ▶" and Cue "Audition ▶" are now separate buttons, each with distinct aria-labels ("Surface: generate and record next event" vs "Generate next event").
- The previously-duplicate SURFACE live region (Cue and Surface both having `aria-live="polite"`) is reduced: Cue output still has `aria-live="polite" aria-atomic="true"`, Surface section no longer auto-announces (Surface is commit-driven, not real-time).

**Concerns (deferred to WP06)**
- Sidebar/Inspector collapse does not return focus to the toggle button (WCAG 2.4.3).
- Transport play/pause carries both `aria-label` change and `aria-pressed` — semantically ambiguous.

**WCAG 2.1 AA items — deferred to WP06**

| # | Criterion | Issue |
|---|-----------|-------|
| 1 | 1.4.3 Contrast AA | `--tr-dim: #5c5846` achieves ~2.5:1 against panel backgrounds — below 4.5:1 threshold |
| 2 | 2.4.1 Bypass Blocks (Level A) | No skip-navigation link before Transport header |
| 3 | 2.4.7 Focus Visible AA | `--tr-focus` token defined but `:focus-visible` wiring not confirmed in all states |

**Decision:** These require design-token and CSS changes outside WP05 scope.
Filed as WP06 gate items.

---

## Summary

| Reviewer | Verdict | Blocker Status |
|----------|---------|----------------|
| Novice | NEEDS_WORK → FIXED | Cue/Surface merge — fixed this session |
| Expert | APPROVED_WITH_NOTES | Cue/Surface isolation confirmed correct |
| Mobile/a11y | NEEDS_WORK | WCAG contrast, skip-nav, focus-visible — deferred to WP06 |

WP05 vertical slice is complete pending Human Checkpoint A verdict.
WP06 must address the three WCAG AA items before any public accessibility claim.
