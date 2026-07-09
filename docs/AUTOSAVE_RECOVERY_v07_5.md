# Autosave & Recovery — v07.5

## Behavior summary

TAROKE RIMIXER automatically saves the current project draft to the browser's `localStorage` every time you make an edit. On your next visit, if a draft is found, a restore prompt appears. You choose whether to restore it or dismiss it. Restoring is explicit; nothing loads silently.

The autosave is session-local, browser-specific, and serves crash/tab-recovery only. It is not a cloud backup, not a version history, and not an archive. The authoritative portable copy is always the exported `.taroke.json` or `.taroke.html` file.

---

## Storage key

```
taroke.remixer.v07.draft
```

One key. One draft. Writing a new edit overwrites the previous draft entry.

---

## What is stored

```json
{
  "savedAt": "2026-07-09T14:32:11.000Z",
  "schemaVersion": "0.7-reset",
  "project": { ... full project object ... }
}
```

- `savedAt` — ISO 8601 timestamp of the save.
- `schemaVersion` — the schema version string from the running app, used to detect mismatches.
- `project` — the full project model (same structure as `.taroke.json` export).

---

## What is NOT stored

- Generated line history (run events).
- Screenshots or images.
- Exported HTML blobs.
- Browser or device metadata.
- User account information (there is no account).
- Anything outside the project draft.

---

## Restore / Dismiss / Clear behavior

| Action | Effect |
|---|---|
| **Restore saved draft** | Loads the saved project into the editor. The restore prompt disappears. The autosave strip shows the saved timestamp. |
| **Dismiss** | Hides the restore prompt. The saved draft remains in `localStorage`. On next page load, the prompt reappears. |
| **Clear saved draft** | Removes the draft from `localStorage` permanently. The restore prompt disappears. |

---

## Corruption / mismatch behavior

| Condition | Result |
|---|---|
| Corrupt JSON in `localStorage` | Ignored silently. App boots with default project. Warning strip: "Saved draft could not be read and was ignored." Old entry cleared from `localStorage`. |
| `schemaVersion` mismatch | Ignored. App boots with default project. Same warning. Old entry cleared. |

---

## Storage-unavailable behavior

If `localStorage` is inaccessible (private mode, security policy, sandboxed iframe), the app detects this at startup and continues without autosave. The autosave strip shows:

> Autosave unavailable in this browser/session. JSON export remains the archive copy.

No crash, no silent failure, no missing features beyond autosave itself.

---

## Why JSON export remains authoritative

The local draft is browser-scoped and ephemeral: clearing browser data, switching browsers, using incognito mode, or working on another machine will lose the draft. It has no portability guarantee.

The `.taroke.json` export is a complete, portable file that can be opened in any browser, on any machine, shared with collaborators, committed to version control, or archived. It is the canonical representation of the project.

> "JSON export remains the archive copy." — shown in the autosave UI as a persistent reminder.

---

## Test command and result

```bash
./tests/run_all_tests.sh
```

Result as of v07.5:

| Suite | Passed | Failed |
|---|---|---|
| Core/static | 14 | 0 |
| Core extended | 38 | 0 |
| Browser functional CDP | 16 | 0 |
| User-notes regression | 10 | 0 |
| Route-template regression | 5 | 0 |
| CDP deep QA | 50 | 0 |
| Accessibility/CDP | 28 | 0 |
| **Autosave/recovery CDP** | **34** | **0** |
| **Total** | **195** | **0** |
