# Skill: release-check

Pre-merge checklist for a TAROKE RIMIXER release pass.

---

## Steps

Run each check in order. Record status after each step.

### 1. Branch and commit

```bash
git status
git branch --show-current
git log --oneline -5
```

- Working tree must be clean (nothing uncommitted).
- Current branch must be the feature branch for this pass, not `main`.
- Latest commit message must describe the completed work.

### 2. Full test suite

```bash
./tests/run_all_tests.sh
```

Expected: `161 passed, 0 failed` (update this number when new tests are added).
If count differs from README expectation, update README before merging.

### 3. README / TEST_REPORT sync

Open `README.md` and `TEST_REPORT.md`. Confirm:

- `README.md` states the correct expected test count.
- `TEST_REPORT.md` shows the result from the current run, not a prior pass.
- Both files name the current pass (e.g. `v07.4`).

### 4. Root index.html

```bash
ls -lh index.html styles.css src/core.js src/app.js
```

All four files must exist at the repository root. `index.html` must reference
`styles.css`, `src/core.js`, and `src/app.js` without framework imports.

### 5. Root .nojekyll

```bash
ls .nojekyll
```

Must exist. GitHub Pages requires this to serve static files without Jekyll.

### 6. No zip / temp folder

```bash
ls *.zip 2>/dev/null || echo "no zips"
ls tmp/ 2>/dev/null || echo "no tmp dir"
```

No zip archives or `tmp/` directories should be committed.

### 7. GitHub Pages source

Confirm in the repository settings (or via GitHub MCP tool) that Pages is
configured to deploy from the `main` branch at root (`/`), not from `docs/`.

### 8. Live URL check

```bash
curl -sI https://<owner>.github.io/<repo>/ | head -5
```

Expect HTTP 200. If the environment blocks outbound HTTPS, record:

> Live URL: BLOCKED (network policy). Local file check passed.

### 9. Verdict

Only proceed to merge when:

- [ ] Working tree clean
- [ ] Tests pass at expected count
- [ ] README and TEST_REPORT reflect current pass
- [ ] Root files present
- [ ] `.nojekyll` present
- [ ] No zip/temp clutter
- [ ] Pages source confirmed
- [ ] Live URL passed or honestly blocked
