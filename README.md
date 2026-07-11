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
- Export: standalone `.taroke.html` and `.taroke.json`. JSON export remains the portable archive authority. The Export chamber also offers a live embedded preview: a sandboxed iframe running the actual artifact runtime. The preview is temporary (not the archive or the downloaded file) and reflects the last explicit Build.
- Transparent local autosave: draft saved to browser localStorage after each edit; restore prompt on next boot. No cloud, no account.
- Authoritative import contract: imported projects with custom sample banks are never contaminated with classic Taroko defaults. Explicit tray sets are preserved exactly; defaults apply only when trays are absent.
- Predictable chamber entry: navigating to any chamber (Run, Notes, Export, or any editor step) always opens at the top of that chamber's content, with primary controls immediately visible.
- Immediate identity synchronization: editing the title, author, or source title updates the topbar status, identity slip, surface preview stage head, run stage head, and export filename in real time — without navigating away and back.
- Rendered-input trigger parity: triggers fire only from samples that were actually consumed by the chosen route template, not from any selected-but-omitted slot. Exported standalone HTML files now honour triggers too.

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

Expected current result: 415 passed, 0 failed.

Browser tests require Chromium plus Python `requests` and `websocket-client`.

## GitHub Pages

This is a static site. Put `index.html`, `styles.css`, and `src/` at the repository root. Then configure GitHub Pages to deploy from the `main` branch root. `.nojekyll` is included so GitHub Pages serves the static files directly.
