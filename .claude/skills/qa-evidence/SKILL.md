# Skill: qa-evidence

Produce structured acceptance evidence for a TAROKE RIMIXER release pass.

---

## When to run

Run this skill at the end of any named release pass (v07.x) before merging to
`main`. Do not run mid-task; evidence is a closing checkpoint, not a progress log.

---

## Steps

### 1. Confirm test suite passes

```bash
./tests/run_all_tests.sh
```

All tests must pass. Record the exact count (e.g. `161 passed, 0 failed`).
If any test fails, stop here and fix the failure before proceeding.

### 2. Local browser check

Open `index.html` directly in Chromium (file://). Confirm:

- App boots without console errors.
- Every editable layer is reachable: source, samples, forms, devices, stanza,
  flow, triggers, run, export.
- Run chamber generates events.
- Export produces a downloadable `.taroke.html` that opens standalone and shows
  generated lines.
- Import of a `.taroke.json` restores all fields.

### 3. Live GitHub Pages check

URL pattern: `https://<owner>.github.io/<repo>/`

If the live URL is reachable, confirm the same checklist as local browser check.

If GitHub Pages is blocked by network policy in this environment, record:

> Live URL check: BLOCKED (network policy). Local check passed.

Do not claim live check passed when it was not performed.

### 4. Screenshot requirements

Capture at minimum:

- Run chamber with at least one generated event visible.
- Export step with save-HTML and export-JSON buttons visible.

Save screenshots to `docs/screenshots/` with names that include the version
slug (e.g. `run_chamber_v07_4.png`).

If screenshots cannot be taken (headless environment, no write access), record:

> Screenshots: BLOCKED (environment). Tests serve as verification.

### 5. No-redesign check

Confirm no aesthetic changes were introduced without an approved issue:

- Background is black/white monospace workbench.
- No surface theme cards or surface family cards present.
- No visible line numbers in run or export surfaces.

### 6. Final report format

Create `docs/ACCEPTANCE_EVIDENCE_v<VERSION>.md` with this structure:

```
# Acceptance Evidence — v<VERSION>

Date: <YYYY-MM-DD>
Branch: <branch-name>
Base commit: <hash> (<label>)

## Test suite
<command>
<result line: X passed, 0 failed>

## Local browser check
PASS / FAIL — <notes>

## Live URL check
PASS / FAIL / BLOCKED — <notes>

## Screenshots
<list of files or BLOCKED note>

## No-redesign check
PASS / FAIL — <notes>

## Verdict
PASS — ready to merge / BLOCKED — <reason>
```
