# TAROKE RIMIXER

Light local-first workbench for making Taroko-style remix artifacts.

Open `index.html` locally or publish the repository root with GitHub Pages. The app is static: HTML, CSS, and plain JavaScript. No build step.

Current pass: v07.6 live embedded artifact preview.

## Current functional scope

- Source metadata editor.
- Sample banks: create, relabel, add, bulk paste, edit, duplicate, move between banks, weight samples.
- Forms: case policy, compound handling, per-token overrides.
- Devices: input slots + route templates.
- Route templates: large textarea; write static text and click slot chips to insert variables at the cursor.
- Stanza patterns: arrange devices and breaths.
- Flow scenes: choose stanza patterns and weighting.
- Triggers: condition by sample bank/term and append/prepend/replace event text.
- Run chamber: generate, pause, reset, inspect line recipe, keep/repair notes.
- Export: standalone `.taroke.html` and `.taroke.json`. JSON export remains the portable archive authority.
- Live artifact preview: sandboxed iframe in the Export chamber runs the actual generated artifact. Click "Refresh live artifact preview" to update. The preview is not the portable artifact — use "Save playable HTML" for the distributable file.
- Transparent local autosave: draft saved to browser localStorage after each edit; restore prompt on next boot. No cloud, no account.

## Deliberate simplifications in this pass

- No surface theme controls.
- No surface family cards.
- No visible line numbers in the run surface or exported artifact.
- Black/white functional workbench first; aesthetics later.

## Tests

Run all available checks:

```bash
./tests/run_all_tests.sh
```

Expected current result: 199 passed, 0 failed.

Browser tests require Chromium plus Python `requests` and `websocket-client`.

## GitHub Pages

This is a static site. Put `index.html`, `styles.css`, and `src/` at the repository root. Then configure GitHub Pages to deploy from the `main` branch root. `.nojekyll` is included so GitHub Pages serves the static files directly.
