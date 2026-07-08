# Skill: feature-gate

Structured plan template for a new TAROKE RIMIXER feature pass.

Fill each section before writing any code. A feature without a gate plan
should not be started.

---

## Objective

State in one sentence what the user can do after this feature that they cannot
do now.

## Non-goals

List explicitly what this feature does NOT do. Be specific. This prevents scope
creep during implementation.

## Allowed changes

List only the files this feature is permitted to touch:

- `src/core.js` — if new model behavior is required
- `src/app.js` — if new DOM interactions are required
- `styles.css` — if new layout or element needs styling (no aesthetic redesign)
- `index.html` — if new static markup is required
- `tests/` — always: new tests for new behavior
- `docs/` — always: updated docs and evidence

## Forbidden changes

- Do not change aesthetics (background, color palette, font choices).
- Do not add a framework, bundler, or runtime dependency.
- Do not reintroduce surface theme cards, surface family cards, or visible line
  numbers.
- Do not touch files outside the Allowed list without noting it here and
  explaining why.

## Acceptance tests

List the specific behaviors that must pass as observable test assertions
(not just "it works"):

1. ...
2. ...

Add these as new tests in `tests/` before or alongside the implementation.

## Regression tests

State which existing test files cover the areas touched by this feature.
All existing tests must still pass after the feature is complete.

```bash
./tests/run_all_tests.sh
```

Expected result: `<N> passed, 0 failed`

## Screenshots (if visual)

If the feature changes any visible surface, capture before/after screenshots in
`docs/screenshots/`. Name them `<feature>_before.png` and `<feature>_after.png`.

## Docs update

List which docs files must be updated when the feature ships:

- `README.md` — if functional scope changes
- `TEST_REPORT.md` — always, with new test count
- `docs/ACCEPTANCE_EVIDENCE_v<VERSION>.md` — always
- `CLAUDE.md` — only if a new hard rule is introduced

## Stop condition

The feature is done when:

- All acceptance tests pass.
- All regression tests pass (no new failures).
- Docs are updated.
- QA evidence doc is written.
- Working tree is clean and commit is pushed.

## Rollback condition

Stop and roll back (revert to base commit) if:

- Two consecutive implementation attempts cannot pass existing regression tests.
- The feature requires touching more than the Allowed list without a clear
  reason.
- The feature would require a new runtime dependency.

On rollback, write a short post-mortem in the task thread before closing the
session.
