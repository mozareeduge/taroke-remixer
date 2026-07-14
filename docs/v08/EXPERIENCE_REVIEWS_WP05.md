# WP05 Experience Reviews

Three independent fresh-context reviews conducted before Human Checkpoint A.
All blockers were addressed before commit `330be1e` on `claude/v08-wp05-vertical-slice-recovery`.

---

## 1. Novice User — NEEDS_WORK → fixed

**Strengths**
- ArchivePanel import warning copy ("Replaces the current project. Undo is available.") is clear safety messaging.
- Transport StatusLamp + status label give continuous, legible saved/running state feedback.
- PerformancePanel SURFACE empty state and prominent Generate button establish an obvious first-action loop.

**Concerns (deferred to WP06)**
- Sidebar/inspector toggle shows only bare Unicode arrows with no visible label.
- MaterialsPanel uses dense domain vocabulary (Banks, Trays, Literal, Wt) with no tooltips.
- PerformancePanel UNMIX exposes technical internals (tick, consumedInputs, direct/derived) without explanatory framing.

**Blocker — FIXED in 330be1e**
`ArchivePanel.doImport` silently swallowed parse failures (console.error only). Fix: added
visible `role="alert"` error paragraph and `reader.onerror` handler — users now see exactly
which file failed and why.

---

## 2. Expert / Power User — APPROVED_WITH_NOTES → blocker fixed

**Strengths**
- `generateEvent` is deterministic with pluggable RNG, zero DOM dependencies — seedable and batchable.
- UNMIX trace panel gives per-slot provenance (tray, sourceLiteral, direct/derived, trigger) that generative artists need.
- Command-patch architecture carries label + patches + inversePatches — correct foundation for undo.

**Concerns (deferred to WP06)**
- No undo/redo surface exposed in UI (reducers missing, no Cmd+Z binding).
- Trigger evaluation stops at first match with no user-visible prioritization control.
- StanzaSlot `chance` field serves as both inclusion gate and loop-continuation roll — no `loopChance` concept.

**Blocker — FIXED in 330be1e**
`localRunState.current` in PerformancePanel diverged from the project on live edits: stale
deviceIds could remain in the local queue after a device was removed, producing silent
`NO_DEVICE` error events on the next generate call. Fix: only the queue is held locally;
tick/scene/stanza now read from Redux `runState` directly. The queue is filtered before each
`generateEvent` call to remove entries for devices no longer in `project.lineDevices`.

---

## 3. Mobile / Accessibility — NEEDS_WORK → WCAG blockers deferred to WP06

**Strengths**
- React Aria Components wrapping (Button, Field) provides keyboard focus management and `aria-disabled` for free.
- Live-region discipline correct: ImportReceiptBanner uses `aria-live="polite"`, CUE output uses `aria-live="polite" aria-atomic="true"`.
- Icon buttons carry context-specific `aria-label` throughout (Move up/down, Remove take, Dismiss).

**Concerns (deferred to WP06)**
- Sidebar/Inspector collapse does not return focus to the toggle button (WCAG 2.4.3).
- Transport play/pause carries both `aria-label` change and `aria-pressed` — semantically ambiguous; drop `aria-pressed`.
- Two simultaneous `aria-live="polite"` regions in PerformancePanel may produce announcement collisions on VoiceOver/NVDA.

**Blockers — deferred to WP06 with tracking**
These are real WCAG 2.1 AA failures but require CSS design-token changes outside WP05 scope:

| # | Criterion | Issue |
|---|-----------|-------|
| 1 | 1.4.3 Contrast AA | `--tr-dim: #5c5846` achieves ~2.5:1 against panel backgrounds — fails 4.5:1 threshold for normal text |
| 2 | 2.4.1 Bypass Blocks (Level A) | No skip-navigation link before Transport header |
| 3 | 2.4.7 Focus Visible AA | `--tr-focus: #7de7ff` token defined but no `:focus-visible` rule confirmed wired to it |

**Decision:** These are filed as WP06 gate items. WP05 scope is the three contract gaps
(store-backed Takes, ImportReceiptBanner, accessible reorder) plus the two runtime/import
blockers addressed in this session. WCAG remediation is a dedicated workpackage concern.

---

## Summary

| Reviewer | Verdict | Blocker Status |
|----------|---------|----------------|
| Novice   | NEEDS_WORK → FIXED | Silent import failure — fixed |
| Expert   | APPROVED_WITH_NOTES → blocker fixed | localRunState divergence — fixed |
| Mobile/a11y | NEEDS_WORK | WCAG contrast, skip-nav, focus-visible — deferred to WP06 |

WP05 is shippable pending Human Checkpoint A. WP06 must address the three WCAG AA items
before any public accessibility claim is made.
