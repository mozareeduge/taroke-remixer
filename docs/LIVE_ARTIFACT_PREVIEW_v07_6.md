# Live Embedded Artifact Preview — v07.6

## Behavior summary

The Export chamber now includes a live artifact preview: a sandboxed `<iframe>` that
runs the actual exported standalone HTML artifact. The preview auto-loads when you first
navigate to Export and can be manually refreshed with the "Refresh live artifact preview"
button. It reflects the current project state after each refresh.

The preview is **not** the portable artifact. Use "Save playable HTML" to download the
distributable file.

## Implementation approach

- `buildPreview()` in `src/app.js` calls `C.exportProjectHtml(project)` — the same
  generator used by "Save playable HTML" — and stores the result in `ui.preview.srcdoc`.
- `exportStep()` renders an `<iframe class="livePreviewFrame">` whose `srcdoc` attribute
  carries the stored HTML, HTML-escaped via `C.esc()`.
- Auto-build: when the user navigates to Export and no preview exists yet, `buildPreview()`
  is called automatically.
- Manual refresh: `[data-refresh-preview]` button calls `buildPreview()` and re-renders.
- On error: `buildPreview()` catches any exception and stores `ui.preview.error`; the
  Export panel renders an error div instead of the iframe; download buttons remain unaffected.

## iframe `srcdoc` vs Blob URL choice

`srcdoc` is used. Reasons:

1. No object URL lifecycle management needed (no `createObjectURL` / `revokeObjectURL`).
2. Content is fully inline in the attribute — no separate resource to load.
3. Sandbox enforcement is cleaner: `srcdoc` documents have a null origin when
   `allow-same-origin` is absent, which is exactly the isolation we need.
4. No network request, no CSP issue, no cross-tab resource sharing.

The exported HTML is HTML-escaped before being placed in the attribute (`C.esc()`). The
browser decodes the entities back to raw HTML and parses it as the iframe's document.
`safeJsonForHtml` in core.js already protects against `</script>` injection in the
embedded JSON; the attribute-level escaping adds a second layer for the srcdoc context.

## Sandbox and isolation approach

```
sandbox="allow-scripts"
```

- `allow-scripts`: required for the artifact's self-contained runtime JavaScript to execute.
- `allow-same-origin` is **NOT** granted. Without it, the iframe has a null origin.

Null-origin consequences (all by design):
- The iframe **cannot** read or write the parent's `localStorage`.
- The iframe **cannot** access the parent's cookies.
- The iframe **cannot** call `parent.postMessage` to the parent with a same-origin match.
- `localStorage` inside the iframe throws `SecurityError`.

This guarantees: the preview iframe cannot read or write the editor autosave key
`taroke.remixer.v07.draft`. The autosave isolation guarantee is enforced at the
browser level, not by application code.

## Why the preview is not the archive

The preview runs the artifact runtime in an ephemeral iframe. It:
- is not saved to disk
- does not persist between sessions
- reflects the in-memory project state at the time of the last refresh
- is destroyed when the page reloads or the browser navigates away

The portable artifact is the `.taroke.html` file produced by "Save playable HTML". That
file is self-contained, distributable, and importable back into the editor.

## Relationship to standalone HTML export

Both the preview iframe and the "Save playable HTML" download use the same
`C.exportProjectHtml(project)` call. The generated HTML is identical. The only difference
is destination: the download goes to a file; the preview goes into an iframe `srcdoc`.

## Autosave isolation guarantee

The preview:
- calls `buildPreview()`, which only reads `project` and sets `ui.preview.srcdoc`
- never calls `saveDraft()`
- cannot access `localStorage` from inside the iframe (null origin)

Verified by test: `preview refresh does not write to editor autosave key`.

## Test command and result

```bash
python3 tests/run_live_preview_cdp.py
```

```
19 passed, 0 failed
```

Full suite:

```bash
./tests/run_all_tests.sh
```

```
199 passed, 0 failed
```

## Screenshots

- `docs/screenshots/v07_6/desktop-export-live-preview.png` — desktop Export with live preview
- `docs/screenshots/v07_6/mobile-375-export-live-preview.png` — mobile 375px Export with live preview
