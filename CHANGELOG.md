# TAROKE RIMIXER — Changelog

## v08 WP05 — Human Checkpoint A (2026-07-16)

v08 workbench (React + Redux + Vite) vertical slice, branch `claude/v08-wp05-vertical-slice-recovery`.

- **Role-aware forms**: `KEEP_UNCHANGED_SENTINEL = "__keep__"` stored in `forms.overrides`; `formToken()` resolves sentinel back to literal text — sentinel never leaks into Cue, Surface, UNMIX, or exported HTML. 7 sentinel non-leak tests added.
- **Authoritative import receipt**: `importProjectWithReceipt()` runs actual `migrateProject()` + `validateProject()` and returns a truthful `ImportReceipt` (20+ fields). `ImportReceiptBanner` renders the full receipt; no hardcoded empty arrays.
- **Route variable palette**: searchable `VariablePalette` component with ArrowUp/Down/Enter/Escape keyboard nav, listbox semantics, and role-aware form chips that insert `{slot:form}` at the cursor caret.
- **Stable device input keys**: array-index key for input rows (not `inp.slot`) prevents remount on each keystroke.
- **a11y — nested-interactive eliminated**: removed `role="button"` from container divs that wrapped interactive controls in InstrumentsPanel, CompositionPanel, AutomationPanel. All replaced with proper `<button>` elements for selection intent.
- **Playwright browser symlink**: `chromium_headless_shell-1228` symlinked to pre-installed rev-1194 binary to resolve Playwright 1.61.1 revision mismatch without network download.
- **E2E suite**: 38 tests passing (smoke + 29-step checkpoint-a journey) on Chromium.
- **axe-core audit**: 8 panels audited; 0 serious/critical violations.
- v07 baseline: 534 passed, 0 failed (unchanged).
- v08 unit tests: 204 passed, 0 failed.

---

## v07.8 — Release checkpoint (2026-07-11)

Final release verification and checkpoint for the v07 track.

- Release metadata corrected: package version 0.7.8, document title neutral.
- Preview iframe preservation: Copy JSON / toast / dismiss-draft no longer recreate the running preview iframe. The iframe runtime continues uninterrupted across non-build Export rerenders. (`_previewBuildPending` + `_savedPreviewIframe` flag mechanism in `src/app.js`.)
- v07.8 iframe stability regression suite added to `tests/run_live_preview_cdp.py` (8 tests).
- Docs verifier extended with v07.8 metadata checks (6 checks) in `tests/run_docs_verification.py`.
- `docs/RELEASE_CHECKPOINT_v07_8.md` checkpoint document created.
- `KNOWN_LIMITS.md` and `EXPORT_PREVIEW_AND_RECOVERY.md` updated to reflect final preview recreation behavior.
- Branch: `claude/v07-8-release-checkpoint` → merged to main → tagged `v07.8-release-checkpoint`.

---

## v07.7 — Public documentation packet

Commit: `bd8a78e` / merge `e145603`

- Six public documentation files added: `WHAT_IS_TAROKE_RIMIXER.md`, `MAKE_A_REMIX.md`, `IMPORTING_AUTHORED_PROJECTS.md`, `EXPORT_PREVIEW_AND_RECOVERY.md`, `KNOWN_LIMITS.md`, `RELEASE_v07_7.md`.
- `tests/run_docs_verification.py` added: deterministic offline documentation verifier (105 checks).
- `tests/run_live_preview_cdp.py` added: live preview CDP test suite (68 tests).
- README rewritten as compact entry point with six-document index.
- Total after this pass: 520 passed, 0 failed.

---

## v07.6 — Live embedded artifact preview

Commit: `a5237bc` / merge `4dc6067`

- Export chamber shows sandboxed live preview of the standalone artifact.
- Explicit Build / Rebuild / Refresh / Retry lifecycle with state model: UNBUILT, FRESH, STALE, ERROR.
- Freshness signature detects project changes and marks preview STALE.
- Scroll and focus preserved across preview builds (`buildPreview()` captures/restores).
- Sandbox: `allow-scripts` only; no `allow-same-origin`.
- 68 CDP tests in `run_live_preview_cdp.py`.
- Total after this pass: 415 passed, 0 failed.

---

## v07.5e — Rendered-input trigger parity

Commit: `7a6f9d8` / certification `2b9ebd1`

- Triggers evaluate only against tokens consumed by the chosen route template, not all selected inputs.
- `consumedInputs` provenance added to each generated event.
- Exported standalone HTML uses the same consumed-input model as the editor.
- No RNG call when no consumed candidate matches the trigger condition.
- 16 CDP tests in `run_trigger_runtime_parity_cdp.py`.
- Total after this pass: 347 passed, 0 failed.

---

## v07.5d — Interaction continuity

Commit: `2bae9f2` / merge `444321e`

- Centralized chamber navigation resets work scroll to top; prior ad-hoc navigation removed.
- Same-step rerenders (`renderPreserving()`) preserve work scroll, rail scroll, stage scroll, focus, caret, and textarea scroll.
- Run stage follows new output when near bottom; manual scroll-up suspends auto-follow; returning to bottom resumes.
- Identity field changes update all live mirrors immediately via `updateLiveMirrors()` (no full render).
- 51 CDP tests in `run_interaction_continuity_cdp.py`.
- Total after this pass: 296 passed, 0 failed.

---

## v07.5c-r — Real Grave v3.2 import acceptance

Commit: `fb56819` / merge `57b6d5a`

- Import acceptance of real authored poem project: 33 banks, 270 tokens, 80 deterministic duplicate-ID occurrence repairs.
- No token loss. No classic-bank contamination. All authored bank IDs, order, labels, roles, and descriptions preserved.
- Evidence in `docs/GRAVE_V3_2_IMPORT_ACCEPTANCE.md` and `docs/screenshots/v07_5c_real_grave/`.

---

## v07.5c — Exact import fidelity

Commit: `eebc98d` / acceptance corrections `c3c47d8` / merge `15de175`

- Explicit `materials.trays` is authoritative over classic defaults.
- Legacy `dictionary` format migrates without classic-bank injection.
- Empty collections preserved as empty.
- Custom bank IDs, labels, roles, and descriptions survive import, JSON round-trip, HTML round-trip, and autosave/restore.
- `importRepairs` provenance recorded for all duplicate-ID repairs.
- Reference repair tests added (form overrides, note links, idempotent double-migrate).
- Total after this pass: 245 passed, 0 failed.

---

## v07.5 — Transparent local autosave recovery

Commit: `20c923c`

- Browser-local draft autosave after each edit (`taroke.remixer.v07.draft` localStorage key).
- Explicit restore prompt on next boot; recovery is never automatic.
- Corrupt or schema-mismatched drafts safely ignored.
- `localStorage` unavailability handled without crash.
- 19 CDP tests in `run_autosave_cdp.py`.

---

## v07.4 — Operations layer

Commit: `4ee5e05`

- Claude Code operations layer: `CLAUDE.md`, skill templates (`qa-evidence`, `release-check`, `feature-gate`), `docs/CLAUDE_WORKFLOW.md`.
- `.gitignore` for Python `__pycache__`.

---

## v07.3 — UX and accessibility hardening

Commit: `0ba8fe2` / merge `650640b`

- Focus management: chamber headings get focus on navigation; modal dialogs trap focus.
- ARIA roles and labels added: dialogs (`role="dialog"`, `aria-modal`, `aria-labelledby`), navigation, buttons, custom selects, status elements.
- Custom select keyboard support: Escape closes, Tab moves on.
- Status and toast announcements: `aria-live="polite"` for autosave status and flash toasts.
- Move-up / Move-down buttons for routes, slots, and scenes (alternatives to drag-and-drop).
- 28 CDP tests in `run_a11y_cdp.py`.

---

## v07.2 — Acceptance evidence

Commit: `fca53b8` / publish `f01e429`

- CDP browser test suites: `run_browser_functional_cdp.py`, `run_cdp_deep_qa.py`, `run_user_notes_regression_cdp.py`, `run_route_template_regression_cdp.py`.
- Self-test harness in `src/app.js`.
- Drag-and-drop handlers verified for tokens, routes, slots, scenes.
- Export HTML/import round-trip verified in browser.

---

## v07.1 — QA hardening

Commit: `caf4e51` / publish `a9930df`

- Deep static and runtime QA pass.
- `run_core_tests.js` (14 tests) and `run_core_extended_tests.js` (38 tests).
- `run_import_fidelity_tests.js` (35 tests).
- `run_trigger_compatibility_regression.js` (3 tests), `run_trigger_runtime_parity_tests.js` (32 tests).
- Doubled-punctuation cleanup for missing slot variables.
- Route template textarea + slot chip insertion.
- Route Move up / Move down buttons.

---

## v07 route-pass

Commit: `bdc8eda`

Initial functional workbench pass.

- Replaced cramped one-line route template input with large textarea.
- Clickable slot chips for route templates (`{slot:form}` variable insertion at cursor).
- Route Move up / Move down buttons; route ordering no longer depends on drag-and-drop.
- Changed draft storage key to avoid restoring broken prior local draft.
- Cleaned generated line text when a route references a missing slot (no doubled punctuation).
- Cleaned migrated note surfaces to remove doubled punctuation display artifacts.
- Improved device layout proportions.

### Kept from before v07

- Black/white pixel-like monospace interface.
- Editable sample banks, forms, devices, stanza patterns, flow, triggers, surface, run, notes, and export.
- Drag-and-drop for samples, routes, slots, and scenes where supported.
- JSON and standalone HTML export/import.
