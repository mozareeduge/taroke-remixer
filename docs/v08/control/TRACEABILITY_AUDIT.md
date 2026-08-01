# Traceability audit — working copy

Audited against exact head `a4144e3fd872922384ebfbe517b370628e936a77` plus
this round's commits on `claude/taroke-final-experience-elzkea-zzgowx`
(PR #20), against the 77-item register supplied in
`TAROKE_RIMIXER_FINAL_CONVERGENCE_INPUT_v1.0_20260801.zip`. This file is a
working audit snapshot, not a tracked application source file, and is not
executable instruction — it records evidence and status for one round.

Method: read every panel/shell/store source file directly and cross-checked
against unit and E2E test coverage; did not infer completion from commit
messages or headings alone. Items marked PARTIAL identify the specific gap
between what exists and what the acceptance text requires. Items resolved
**this round** are noted explicitly; all others were already in place before
this round's commits and are carried forward, not re-litigated.

Legend: R = RESOLVED, P = PARTIAL, U = UNRESOLVED, N/A = not applicable.

## Selection & Inspector

| ID | Status | Evidence |
|---|---|---|
| SEL-01 | R | `selectionIntegrityMiddleware.ts` + `selectionRules.ts` enforce per-panel ownership; `selectionIntegrity.test.ts` (11 tests). |
| SEL-02 | R | Inspector fields are React-keyed by object id (`key={tok.id + "-literal"}` etc.), forcing remount instead of stale-value carryover. |
| SEL-03 | R | `InspectorBody` switches purely on `primary.type`; middleware clears/restores selection on panel switch. Not independently re-walked this round beyond existing test coverage. |
| SEL-04 | R | Middleware calls `validateSelection` on every `mutateProject`/`setProject` and clears on failure. |
| SEL-05 | R | `FormsPanel` derives `activeBank`/`selectedToken` only from `bank`/`token` selection types; shows an explicit picker prompt otherwise. |
| SEL-06 | R | Inspector always renders from live `selection.primary`, no local cache to go stale. |

## Actions

| ID | Status | Evidence |
|---|---|---|
| ACT-01 | R | `MaterialsPanel` disables Add with a `title` reason until valid; test `ACT-01`. |
| ACT-02 | R | Exactly one Add-sample control; test `ACT-02`. |
| ACT-03 | R | Duplicate bank key blocks Add with visible reason; test `ACT-03`. |
| ACT-04 | R | `CompositionPanel` disables Add Pattern/Scene with a dependency reason (`"Select a pattern first"`). |
| ACT-05 | R | New triggers are created `enabled:false`; `doToggleTrigger` blocks enabling until THEN text is non-empty. |
| ACT-06 | R | `ArchivePanel` preview lifecycle gated on an iframe `postMessage` handshake with a 4s timeout → error. |
| ACT-07 | P | Transport shows global `RUNNING`/`PAUSED`/`STOPPED` status on every chamber, but there is no explicit "View output" jump action from a non-Performance chamber — the user must know to navigate to Performance manually. |
| ACT-08 | R | Run (Transport Play), Step (Surface "Step"), Audition (Cue "Audition") are separately labelled with distinct handlers and tests. |
| ACT-09 | R | Inspector header always names the selected object's type; empty state reads "Select an item to inspect." |
| ACT-10 | R | Actions menu separates ordinal reorder (Move to top/up/down/bottom) from "Move to bank" behind a visible separator. |
| ACT-11 | P | Destructive removal consistently uses `ConfirmInline` (not `window.confirm`) — test `ACT-11`. Undo itself is only reachable via the global Ctrl+Z keyboard shortcut; there is no visible "Undo" affordance surfaced at the point of the destructive action for a mouse/touch-only user. |
| ACT-12 | P | Surface "Clear" and Takes "Clear all" carry distinct copy/tooltips. Automation has no separate "clear draft back to template" action — an incomplete trigger is removed outright, not cleared, so this leg of the requirement doesn't have a distinct control to differentiate. |

## Shell / responsive

| ID | Status | Evidence |
|---|---|---|
| SHELL-01 | R | `ChamberSwitcher` sticky full-name switcher replaces the fixed bottom nav. |
| SHELL-02 | R | Full chamber names + sequence number shown, not abbreviations. |
| SHELL-03 | R | Navigator lists Source, Materials, Forms as separate items. |
| SHELL-04 | R | `AppShell` sheet mode: backdrop, `inert` background, Tab focus trap, Escape close. |
| SHELL-05 | P | Two-row mobile Transport exists; `breakpoints.spec.ts` asserts Play/Stop ≥ 40×40px, one px short of the 44px target named in the acceptance text. |
| SHELL-06 | R | Bank/pattern/device lists are vertical `<ul>` sidebars with scroll, not horizontal strips; no undisclosed overflow found by `breakpoints.spec.ts`. |
| SHELL-07 | R | CSS grid-area placement keeps desktop/mobile nav mutually exclusive; verified at all 7 required viewports. |
| SHELL-08 | R | `breakpoints.spec.ts` explicitly scrolls to and asserts visibility of Archive's last control at every viewport. |
| SHELL-09 | R | Materials/Composition switch to card layouts below 600/700px. |
| SHELL-10 | R | `ChamberSwitcher` has a dedicated short-landscape rail; 844×390 covered in `breakpoints.spec.ts`. |

## Recovery

| ID | Status | Evidence |
|---|---|---|
| REC-01 | P | `DraftRecoveryBanner` lifecycle (show/restore/dismiss/clear/corrupt-JSON) is implemented and tested (`checkpoint-a.spec.ts` #36–41). Its visual prominence relative to chamber content (the "no longer primary visual action" bar) was not re-verified against the T03 visual system this round. |

## Visual / media-archaeological (T03 domain)

| ID | Status | Evidence |
|---|---|---|
| VIS-01 | P | Lifecycle/state badges already restrict lime (`--tr-active`) to READY/ON-type states; this round's new taxonomy chips use muted/focus/warning colors, not lime. A full cross-chamber audit for stray lime usage was not performed. |
| VIS-02 | U | Materials/Instruments/Composition/Automation still share one generic sidebar-list + detail-panel shape; distinct chamber geometry (T03's core ask) not implemented. |
| VIS-03 | U | Not audited visually this round (no screenshot review performed). |
| VIS-04 | P | Materials density improved this round (MAT-01 compiled-bank summary). Instruments' raw-syntax density (INS-01) is untouched. |
| VIS-05 | U | Inspector width is fixed by breakpoint, not contextual value, unchanged this round. |
| VIS-06 | P | `--tr-font-reading` (serif) vs `--tr-font-ui` (mono) tokens exist; actual per-register application across all chambers not audited this round. |

## Materials

| ID | Status | Evidence |
|---|---|---|
| MAT-01 | **R (this round)** | Compiled banks (taxonomy `compiled`, e.g. `cave_phrases`, 515 entries) open to a summary card (count, total weight, description) with a "Show full list" disclosure, instead of an immediate raw table. Tests added. |
| MAT-02 | **R (this round)** | New sample-search input filters the active bank's tokens by literal; works standalone and inside a compiled bank's summary view. Tests added. |
| MAT-03 | **R (this round)** | `bankTaxonomy()` deterministically derives Canonical / Authored / Derived / Compiled from the existing `bankMeta.desc` "Source:"/"Derived:" convention plus a token-count threshold — no schema change, per the "deterministic derived presentation" option. Chip shown in sidebar and main header. Tests added. |
| MAT-04 | R | Mobile sample cards with a dedicated Actions menu (prior work). |
| MAT-05 | R | "Move to bank" is a searchable-by-scroll `<select>`, not a button stack (prior work). |
| MAT-06 | **R (this round)** | Inline one-line Weight/Share explanation added above the sample list/cards. |

## Forms

| ID | Status | Evidence |
|---|---|---|
| FORM-01 | R | Bench shows literal "Before" and a computed "After" per form key (prior work). |
| FORM-02 | R | Per-form "After" preview is a direct, visible policy consequence before Performance (prior work). |
| FORM-03 | U | Case/compound policy `<select>` options (preserve/lower/upper/title, hyphen/space/none) have no inline one-line description or example. |

## Instruments

| ID | Status | Evidence |
|---|---|---|
| INS-01 | U | The route `<textarea>` with raw `{slot:form}` template syntax remains the only editing surface — no readable-card / Advanced-syntax split implemented. |
| INS-02 | P | Inputs table sits above Routes, and "Test route" renders output inline, but there is no explicit visual lane grouping Input → Route → Example. |
| INS-03 | P | Route names are plain readable text for the canonical example (`plural`, `singular`, `literal rough`); user-created routes default to `"new route"` with no guided rename prompt. |
| INS-04 | R | Per-route "Test route" and device-level "Cue" are both explicitly labelled "(private, not recorded)" (prior work). |

## Composition

| ID | Status | Evidence |
|---|---|---|
| COMP-01 | R | "PATTERN SCORE" / "FLOW SCORE" subsections with descriptive subtitles (prior work). |
| COMP-02 | R | Desktop drag + Actions menu; mobile Actions-menu only (prior work). |
| COMP-03 | R | `tr-slot--card` mobile layout (prior work). |
| COMP-04 | R | "Preview resolution" shows one resolved chance/repeat rollout (prior work). |
| COMP-05 | P | BREATH slots are labelled distinctly in the Pattern Score; no distinct spacing/rhythm treatment verified (CSS/T03 concern). |

## Automation

| ID | Status | Evidence |
|---|---|---|
| AUTO-01 | R | Incomplete triggers render as a `DRAFT` pill and cannot be enabled (prior work). |
| AUTO-02 | R | Inspector explicitly defers trigger editing to Automation via "Edit in Automation" rather than duplicating the editor (prior work). |
| AUTO-03 | R | Blank term shows "any (wildcard)"; blank action shows "(incomplete — no action text)" (prior work). |
| AUTO-04 | R | "Matches now:" condition preview added (prior work, this workload). |

## Performance

| ID | Status | Evidence |
|---|---|---|
| PERF-01 | R | UNMIX opens only on explicit Surface-line selection, not auto-opened on generation (prior work, regression-tested). |
| PERF-02 | P | Surface and Cue are separate columns (`tr-perf__surface-col` / `tr-perf__cue-col`); visual dominance of Surface not verified without a screenshot/CSS pass. |
| PERF-03 | R | Monitor's compact band leads with a plain-language run-mode label; raw tick/queue counters are behind "Details" (prior work). |
| PERF-04 | R | "CUE · PRIVATE" heading, explicit "(private, not recorded)" labelling (prior work). |
| PERF-05 | P | Takes/UNMIX render in normal document flow (not fixed drawers/sheets); reachable per general viewport-overflow checks, but not implemented as the "dedicated drawers/sheets" the acceptance text describes. |
| PERF-06 | R | "Resume follow ↓" plus explicit "following live"/"follow suspended" status text (prior work). |
| PERF-07 | R | Reset/Clear/Stop each carry distinct explanatory copy (prior work, this workload). |

## Archive

| ID | Status | Evidence |
|---|---|---|
| ARCH-01 | R | Preview handshake lifecycle (unbuilt/building/ready/stale/error) (prior work). |
| ARCH-02 | R | Prominent iframe + "Open separately" action (prior work). |
| ARCH-03 | **R (this round)** | Save Project and Publish Artifact are now separate, visually distinct cards (different accent border, kicker text) instead of two buttons under one EXPORT heading. |
| ARCH-04 | R | Export receipt (filename/time/bytes/checksum), now split per card this round. |
| ARCH-05 | R | Import preflight requires explicit "Replace project" confirmation with a bank/pattern/device/repair-count summary (prior work). |
| ARCH-06 | R | Project Info is a compact key/value table distinct from Source's editable fields (prior work); overflow-under-nav claim not independently re-verified this round. |

## Accessibility

| ID | Status | Evidence |
|---|---|---|
| A11Y-01 | P | No regression found in this round's axe runs; visual calibration of the focus-visible outline against the T03 system not independently verified. |
| A11Y-02 | R | `feedbackSlice.announce()` + `LiveRegion` cover add/remove/error events broadly. |
| A11Y-03 | R | Sheet focus trap + `inert` background (prior work); axe passes. |
| A11Y-04 | R | State badges pair color with text (`ON`/`OFF`/`DRAFT`, lifecycle words); new taxonomy chips follow the same pattern. |
| A11Y-05 | P | Surface lines use `role="option"` with per-item `tabIndex={0}` and Enter/Space handling — keyboard-operable, but not a complete ARIA listbox (single roving tab stop + arrow-key navigation). |

## Evidence

| ID | Status | Evidence |
|---|---|---|
| EVID-01 | U | `taroke-final-visual-evidence` CI job covers 4 viewports × 3 journeys — well short of the 7-viewport × 8-chamber × full-state matrix required. |
| EVID-02 | P | PR body and this audit explicitly separate CI-green from human-acceptance claims. The evidence job does not yet *fail* when required coverage is missing/stale, as the acceptance text requires. |

## Totals

- RESOLVED: 55
- PARTIAL: 16
- UNRESOLVED: 6
- Total: 77
- Resolved this round: MAT-01, MAT-02, MAT-03, MAT-06, ARCH-03 (5 items moved to RESOLVED; all others carried forward from before this round)

## What blocks the terminal `READY_FOR_GPT_AND_MOHAMMAD_REVIEW` status

1. **T03 structural visual calibration** (VIS-02/03/05, PERF-02, COMP-05, INS-01/02) — the biggest remaining gap. This is a full design pass across 8 chambers, not a token swap, and was not attempted at that level this round.
2. **INS-01** — route editing is still raw-syntax-first.
3. **FORM-03** — case/compound policy options lack inline explanation.
4. **T04 evidence atlas** (EVID-01/02) — current CI capture is a small smoke set, not the required matrix, and has no fail-closed gate for missing coverage.
5. **T05** — no exact-head cross-browser/full-matrix verification or `/next/` redeploy performed this round beyond what CI already runs on every push.
