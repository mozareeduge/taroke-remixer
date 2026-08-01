# Design scenario traceability — working copy

Audited against exact head on `claude/taroke-final-experience-elzkea-zzgowx`
(PR #20) after this round's `MAT-01/02/03/06` and `ARCH-03` commits, against
the 138-scenario matrix in `16_COMPLETE_DESIGN_SCENARIO_AND_ACCEPTANCE_MATRIX.md`
(Design Head Authority Amendment). This is a working audit snapshot, not a
tracked application source file and not executable instruction.

Method: cross-referenced against the source reading already performed for
`TRACEABILITY_AUDIT.md` (the 77-item register) in this same round, plus
targeted re-checks of specific scenario claims (e.g. Undo affordance,
Source link validation, Surface selection stability under retention
trimming) that the 77-item register did not cover at this granularity.
Two concrete correctness/consistency issues were found this way and are
flagged below rather than silently left as PARTIAL polish items.

Legend: R = RESOLVED, P = PARTIAL, U = UNRESOLVED, N/A = not applicable.

## Global shell and state (DS-G)

| ID | Status | Note |
|---|---|---|
| DS-G-01 | R | Shell loads legibly at all 7 required viewports (`breakpoints.spec.ts`, `smoke.spec.ts`). |
| DS-G-02 | R | No selection → no unrelated Inspector content (SEL-01). |
| DS-G-03 | R | Per-type ownership enforced and tested (`selectionIntegrity.test.ts`). |
| DS-G-04 | P | Overlay closes with backdrop/Escape/focus return, but focus always returns to the Transport `Details` toggle, not necessarily the specific control that opened the Inspector (e.g. a token selected via a table row). |
| DS-G-05 | R | Mobile sheet: backdrop, `inert` background, focus trap, single close action (axe-tested). |
| DS-G-06 | R | Dirty state is a small `StatusLamp`, not a banner. |
| DS-G-07 | P | `DraftRecoveryBanner` functional and tested; visual compactness/dominance relative to chamber content not verified without a screenshot pass (same gap as `REC-01`). |
| DS-G-08 | **U** | Transport shows global `RUNNING`/`PAUSED`/`STOPPED` text but there is no `Running to Surface · View` action that navigates to Performance from another chamber, as this spec explicitly requires. |
| DS-G-09 | R | `ChamberSwitcher` short-landscape rail; 844×390 covered in `breakpoints.spec.ts`. |
| DS-G-10 | U | Long project/chamber/object name truncation with accessible full name not implemented or tested. |
| DS-G-11 | P | Individual controls are keyboard-operable; no dedicated full-tour keyboard test exists. |
| DS-G-12 | P | Global `prefers-reduced-motion` rule collapses transition/animation durations; not verified per-component for information loss. |
| DS-G-13 | P | Most controls carry contextual `aria-label`s (e.g. "Remove sample X"); not exhaustively audited for every instance of a generic label. |
| DS-G-14 | P | Verified for Archive only (`breakpoints.spec.ts`); not verified for all 8 chambers at all 7 viewports. |
| DS-G-15 | R | No undisclosed document-level horizontal overflow found. |
| DS-G-16 | R | `announce()` + `LiveRegion` + inline `role="alert"` errors near the triggering control. |
| DS-G-17 | P | Same gap as `ACT-11`: destructive actions confirm inline, but Undo itself is reachable only via the global Ctrl+Z shortcut — no visible Undo affordance at the point of action. |
| DS-G-18 | R | `safeRemoveBank`/`safeRemoveLineDevice`/`safeRemoveStanzaPattern` name dependents explicitly. |
| DS-G-19 | U | Browser zoom / large-text stress not tested. |
| DS-G-20 | P | Text/shape pairing exists for most state badges (`A11Y-04`); no formal grayscale/colour-blind audit performed. |

## Source (DS-SRC)

| ID | Status | Note |
|---|---|---|
| DS-SRC-01 | R | One ledger: LINEAGE, WORK IDENTITY, SOURCE PROVENANCE, TEXT; no unrelated Inspector. |
| DS-SRC-02 | R | Editable identity fields are visually separated from the "stable" Source Provenance section by distinct section heads and meta text. |
| DS-SRC-03 | **P — found this round** | The LINEAGE block's "View origin text ↗" link renders `href={info.sourceUrl}` directly without the same `http(s)`-only validation `ArchivePanel`'s `safeLink()` applies to its own source-URL row. A non-`http(s)` URL (e.g. `javascript:`) saved into the field could render as a live link in Lineage while Archive would correctly refuse to render it. Not a regression introduced this round — pre-existing inconsistency found while cross-checking `DS-SRC-03`. |
| DS-SRC-04 | P | Statement/Credits are `<textarea class="tr-input tr-input--textarea">`, which inherits the apparatus/mono UI font, not the literary serif register the design authority specifies for reading content. |
| DS-SRC-05 | P | Same as `DS-G-07`. |
| DS-SRC-06 | U | No test distinguishes imported identity vs. preserved lineage after import. |
| DS-SRC-07 | P | Source renders as one vertical flow like other panels under the general mobile layout; no Source-specific "last control reachable" test exists. |
| DS-SRC-08 | R | `source.spec.ts` S6: invalid URL shows accessible `role="alert"` error without blocking editing. |

## Materials (DS-MAT)

| ID | Status | Note |
|---|---|---|
| DS-MAT-01 | R | Indexed well header + direct sample table/cards. |
| DS-MAT-02 | **R (this round)** | Compiled `cave_phrases` (515 entries) opens to a summary card, not a raw table. |
| DS-MAT-03 | **R (this round)** | "Show full list" progressive disclosure; search also reveals matches without expanding. |
| DS-MAT-04 | **R (this round)** | "No sample matches …" empty state preserves the query. |
| DS-MAT-05 | P | Long literal wrapping not specifically tested. |
| DS-MAT-06 | R | `ACT-01`. |
| DS-MAT-07 | R | `ACT-03`. |
| DS-MAT-08 | R | `MAT-05` — searchable `<select>` + explicit Move. |
| DS-MAT-09 | R | `ACT-10` — reorder vs. move-to-bank separated. |
| DS-MAT-10 | P | Confirm + restore works (`ACT-11`); no visible Undo affordance (`DS-G-17`). |
| DS-MAT-11 | R | Dependency-blocked bank removal. |
| DS-MAT-12 | **R (this round)** | `MAT-06` weight/share explanation. |
| DS-MAT-13 | **R (this round)** | `MAT-03` taxonomy chip, deterministically derived. |
| DS-MAT-14 | P | Bank sidebar is searchable; scalability to very large bank counts (virtualization) not verified. |
| DS-MAT-15 | R | `SHELL-09`/`MAT-04` mobile cards with one Actions menu. |
| DS-MAT-16 | U | Imported/migrated bank taxonomy degrade-honestly path not tested. |

## Forms (DS-FORM)

| ID | Status | Note |
|---|---|---|
| DS-FORM-01 | R | "Select a bank or sample…" guidance text, no arbitrary void. |
| DS-FORM-02 | R | Bench only opens for a valid `bank`/`token` selection. |
| DS-FORM-03 | R | Noun forms via `formsForRole`. |
| DS-FORM-04 | R | Verb forms via `formsForRole`. |
| DS-FORM-05 | R | `formsForRole("literal")` limits the form list for literal-only roles. |
| DS-FORM-06 | R | `formToken` recomputes the "After" preview live from the current case policy. |
| DS-FORM-07 | **U** | Same as `FORM-03` in the issue register: case/compound `<select>` options carry no inline description or example. |
| DS-FORM-08 | R | Override is a fully controlled input; "Keep literal" toggles a sentinel value cleanly. |
| DS-FORM-09 | R | Bench fields are recomputed from `selectedToken.id` each render, not cached — no mixed-object state across rapid switches. |
| DS-FORM-10 | P | Mobile bench is the same vertical flow as desktop, not the "sequential before→transform→after cards" the design authority specifically asks for. |
| DS-FORM-11 | U | No test for a deleted/moved selected token's Forms context repairing itself. |
| DS-FORM-12 | P | Long transformed-result wrapping not verified. |

## Instruments (DS-INS)

| ID | Status | Note |
|---|---|---|
| DS-INS-01 | **U** | Same as `INS-01`: raw `{slot:form}` template remains the only editing surface. |
| DS-INS-02 | P | "Select a device to view its routes" empty state exists at the device level; no dedicated empty state for a device with zero routes. |
| DS-INS-03 | P | Route name is plain readable text; share/rendered-example are not shown by default, only after "Test route". |
| DS-INS-04 | R | `INS-04` — per-route Cue explicitly labelled private. |
| DS-INS-05 | **U** | There is no "Advanced" disclosure at all — the raw template textarea is always shown, not gated behind a disclosure as the design authority requires. |
| DS-INS-06 | P | Route weight has `min`/`max` on its number input; the template itself has no parse-time validation UI. |
| DS-INS-07 | P | Sample weight (Materials/Inspector) and route weight (Instruments) are labelled in their own contexts but there is no explicit side-by-side explanation of the two roles. |
| DS-INS-08 | U | No progressive disclosure for devices with many inputs/routes — plain list only. |
| DS-INS-09 | P | `toggleDeviceEnabled` works; no explicit surfaced consequence for Composition slots referencing a disabled device. |
| DS-INS-10 | N/A | Routes have no external references outside their own device (Composition slots reference `deviceId`, not a specific `routeId`), so a dependency-block for single-route removal is not structurally needed. Device removal is already dependency-blocked (`safeRemoveLineDevice`). |
| DS-INS-11 | **U** | Mobile route editing reflows the same DOM; no dedicated card/lane layout as `05_RESPONSIVE_AND_SHELL_SPEC.md` and `07_CHAMBER_RECONSTRUCTION_SPEC.md` both call for. |
| DS-INS-12 | P | Long bank/route name handling not specifically tested. |
| DS-INS-13 | R | "Test route" calls `renderDeviceEvent` against the live `project`/`activeDevice` state, so it always reflects current upstream Forms/Materials edits. |
| DS-INS-14 | N/A | Instruments routes have no reorder concept in the current schema/UI (order is insertion order); nothing to make keyboard-equivalent. |

## Composition (DS-COMP)

| ID | Status | Note |
|---|---|---|
| DS-COMP-01 | R | "PATTERN SCORE" labelled score, not a CRUD table. |
| DS-COMP-02 | R | "FLOW SCORE" labelled subsection. |
| DS-COMP-03 | R | "No slots yet — add BREATH or a device below…" |
| DS-COMP-04 | R | "No scenes yet…", disabled Add-scene reason when no pattern selected. |
| DS-COMP-05 | R | `ACT-04`. |
| DS-COMP-06 | P | BREATH labelled distinctly in text; no distinct spacing/rhythm treatment verified (CSS/T03 concern, same as `COMP-05` in the issue register). |
| DS-COMP-07 | R | "Preview resolution" shows one resolved chance/repeat rollout, including an honest "nothing resolved" empty case. |
| DS-COMP-08 | R | Desktop drag + Actions menu, one hierarchy. |
| DS-COMP-09 | R | Mobile: Actions-menu-only, no drag requirement. |
| DS-COMP-10 | R | `safeRemoveStanzaPattern` blocks with dependents named. |
| DS-COMP-11 | P | Long-score scanability not specifically tested. |
| DS-COMP-12 | R | Details resolves strictly from `selection.primary.type`. |
| DS-COMP-13 | R | Resolution preview has an honest empty/zero-result state; no fake output. |
| DS-COMP-14 | U | No Composition-specific short-landscape check beyond the general shell regression. |

## Automation (DS-AUTO)

| ID | Status | Note |
|---|---|---|
| DS-AUTO-01 | R | "No triggers yet…" guidance text. |
| DS-AUTO-02 | R | New trigger is Draft/OFF by construction. |
| DS-AUTO-03 | R | "any (wildcard)" is explicit, never a silently-blank term. |
| DS-AUTO-04 | R | "(incomplete — no action text)" is explicit. |
| DS-AUTO-05 | R | DRAFT/ON/OFF pill + text state. |
| DS-AUTO-06 | R | `doToggleTrigger` blocks enabling until THEN text is complete. |
| DS-AUTO-07 | R | "Matches now:" condition preview. |
| DS-AUTO-08 | R | "No sample in this bank currently matches…" explicit no-match state. |
| DS-AUTO-09 | P | Chance is editable and shown in the summary text, but the match preview does not factor chance — it always lists literal matches regardless of the rule's chance %, so the preview doesn't fully convey probability. |
| DS-AUTO-10 | R | `ConfirmInline`, no immediate silent deletion. |
| DS-AUTO-11 | U | No dedicated mobile WHEN→chance→THEN card layout; same DOM reflows. |
| DS-AUTO-12 | R | Inspector explicitly defers to Automation ("Edit in Automation"), one source of truth. |
| DS-AUTO-13 | P | Long condition/action text wrapping not specifically tested. |
| DS-AUTO-14 | U | No distinct human-readable "rule fired" feedback beyond the resulting Surface line itself. |

## Performance (DS-PERF)

| ID | Status | Note |
|---|---|---|
| DS-PERF-01 | R | "Generate events to see surface output." |
| DS-PERF-02 | R | Step records exactly one event (tested). |
| DS-PERF-03 | R | Run continuously via Transport Play + `setInterval`; human status; no forced UNMIX (`PERF-01`). |
| DS-PERF-04 | R | Pause via Transport toggle. |
| DS-PERF-05 | P | Stop is a distinct Transport action; unlike Reset/Clear it has no inline tooltip explaining what is retained. |
| DS-PERF-06 | R | Reset has explicit retained-state copy (`PERF-07`). |
| DS-PERF-07 | R | Clear has an explicit "(does not affect Takes or runtime tick)" tooltip. |
| DS-PERF-08 | R | Audition writes only to Cue, never to Surface. |
| DS-PERF-09 | R | UNMIX opens only on explicit Surface-line selection (`PERF-01`). |
| DS-PERF-10 | **P — found this round, needs engineering follow-up** | `selectedIndex` is a plain array index into `surface.records`. `appendSurfaceRecord` trims the list to `retention` (default 26). If Run continuously is active while UNMIX is open and the list is already at the retention cap, each new record shifts every existing index down by one — `selectedIndex` would then point at a *different* record than the one the user had open, silently. This is a plausible correctness bug against `DS-PERF-10`'s "current inspection stable" requirement, not just a polish gap; flagged for the next round rather than fixed speculatively without a reproduction test in hand. |
| DS-PERF-11 | R | Selecting the same index again closes UNMIX; selecting another opens it fresh — deliberate, not leaked global Inspector state. |
| DS-PERF-12 | R | "Resume follow ↓" + explicit following/suspended text. |
| DS-PERF-13 | R | Captured Take appears immediately in the Takes list. |
| DS-PERF-14 | R | Keep/Repair/Pin/Remove controls, annotation field. |
| DS-PERF-15 | R | Monitor compact band leads with `runModeLabel`; raw counters behind "Details" (`PERF-03`). |
| DS-PERF-16 | P | Cue shows a `role="alert"` error string on a failed audition; not deeply verified against every failure mode (e.g. "no available route"). |
| DS-PERF-17 | U | No long-running/stress test of Surface responsiveness. |
| DS-PERF-18 | P | Cue/UNMIX/Takes render as normal in-flow sections on mobile, not the "explicit drawers" the design authority calls for; reachability itself is covered by general overflow checks, not a Performance-specific mobile test. |
| DS-PERF-19 | U | No Performance-specific short-landscape check. |
| DS-PERF-20 | U | Reduced-motion behavior during an active run not specifically verified. |

## Archive (DS-ARCH)

| ID | Status | Note |
|---|---|---|
| DS-ARCH-01 | **R (this round)** | Save Project, Publish Artifact, Import, and Preview are now four visually distinct sections (`ARCH-03`). |
| DS-ARCH-02 | R | Save receipt: filename/time/bytes/checksum. |
| DS-ARCH-03 | R | UNBUILT → BUILDING on click, disabled while building. |
| DS-ARCH-04 | R | READY only after the iframe `postMessage` handshake (`ARCH-01`). |
| DS-ARCH-05 | R | 4s timeout → ERROR with message. |
| DS-ARCH-06 | R | Artifact-posted error message surfaces as ERROR. |
| DS-ARCH-07 | R | STALE lifecycle covered by `checkpoint-a.spec.ts` #32. |
| DS-ARCH-08 | R | "Open separately" via Blob URL, delayed revoke. |
| DS-ARCH-09 | **R (this round)** | Publish HTML now has its own card/receipt, visually distinct from Save Project. |
| DS-ARCH-10 | R | Import preflight shows current-vs-incoming summary before replacing. |
| DS-ARCH-11 | R | Repair count shown in the preflight warning. |
| DS-ARCH-12 | R | Malformed import shows an error and never sets `pendingImport` — current project is untouched. |
| DS-ARCH-13 | R | Confirm replaces the project via `setProject` (selection re-validated by `selectionIntegrityMiddleware`). |
| DS-ARCH-14 | R | Cancel clears `pendingImport` only, no mutation. |
| DS-ARCH-15 | R | Import receipt banner tested (`checkpoint-a.spec.ts` #26). |
| DS-ARCH-16 | U | No automated test opens the exported HTML file directly outside the workbench iframe — "Open separately" is manual-only. |
| DS-ARCH-17 | R | Project Info is a compact key/value table, distinct from Source's editable fields. |
| DS-ARCH-18 | P | `breakpoints.spec.ts` verifies the Publish HTML button reachable on mobile; Preview and Project Info reachability at every mobile viewport not separately tested. |
| DS-ARCH-19 | U | Long-poem preview readability not tested. |
| DS-ARCH-20 | P | `doOpenArtifactSeparately` self-revokes each Blob URL after 30s independently; rapid repeated "Open separately" clicks before revoke could in principle accumulate multiple live Blob URLs. Each opened tab still gets the exact artifact it was given, so this is not a correctness bug, but "no leaked stale Blob target" is not verified under rapid repeat use. |

## Mandatory high-risk combinations (§11)

None of the 12 combinations were run as dedicated end-to-end journey tests this
round. Items 1, 4, 6, and 7 are partially covered by existing unit/E2E tests
that exercise their individual halves (e.g. compiled-bank move/remove exists,
Run→Pause→Step exists) but not as the single combined journey the amendment
requires. All 12 are carried forward as open work.

## Totals

- 138 scenarios classified.
- RESOLVED: 84
- PARTIAL: 33
- UNRESOLVED: 19
- N/A: 2
- Resolved this round (design-scenario framing): DS-MAT-02/03/04/12/13, DS-ARCH-01/09 (7 scenarios; same underlying commits as `MAT-01/02/03/06` and `ARCH-03` in the issue register).
- Found this round, not yet fixed: `DS-SRC-03` (Source lineage link skips the URL-scheme validation Archive applies), `DS-PERF-10` (possible UNMIX selection-index drift under retention trimming during an active run — needs a reproduction test before a fix is written, not a speculative patch).

## What blocks the terminal `READY_FOR_GPT_AND_MOHAMMAD_REVIEW` status

Same structural gaps as `TRACEABILITY_AUDIT.md`, now confirmed at the scenario
level:

1. **Chamber geometry** (`DS-INS-01/02/05/08/11`, `DS-FORM-10`, `DS-PERF-18`, `DS-COMP-06`) — Instruments in particular has no "Advanced" disclosure at all; raw template syntax is the only editing surface. This is the largest concrete implementation gap, not just a subjective polish item.
2. **`DS-G-08`** — no cross-chamber "Running to Surface · View" affordance.
3. **Two found-not-fixed correctness items** — `DS-SRC-03`, `DS-PERF-10` — should be resolved with a reproduction/regression test before the evidence atlas is generated, since evidence built against a live bug would misrepresent the candidate.
4. **Full evidence atlas and mandatory high-risk combination journeys** — not generated this round.
5. **T05** — no dedicated exact-head cross-browser verification or `/next/` redeploy pass beyond ordinary CI.
