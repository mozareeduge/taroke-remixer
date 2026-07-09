# Test report — v07.5 transparent local autosave/recovery

Command:

```bash
./tests/run_all_tests.sh
```

Result:

- Core/static: 14 passed, 0 failed.
- Core extended: 38 passed, 0 failed.
- Browser functional CDP: 16 passed, 0 failed.
- User-notes regression: 10 passed, 0 failed.
- Route-template regression: 5 passed, 0 failed.
- CDP deep QA: 50 passed, 0 failed.
- Accessibility/CDP hardening: 28 passed, 0 failed.
- Autosave/recovery CDP: 34 passed, 0 failed.

Total: 195 passed, 0 failed.

## Autosave/recovery suite breakdown (34 tests)

| # | Description |
|---|---|
| 1 | Edit project → autosave writes to localStorage key |
| 2a | Saved value contains savedAt timestamp |
| 2b | Saved value contains schemaVersion |
| 2c | Saved value contains project payload |
| 2d | Project payload has the edited title |
| 3a | Boot with saved draft: restore prompt appears |
| 3b | Boot with saved draft: pending strip visible |
| 3c | Boot does NOT silently restore (default project active) |
| 4a | Restore loads saved draft project |
| 4b | Restore hides prompt after click |
| 5a | Dismiss: project remains default (draft NOT loaded) |
| 5b | Dismiss: restore prompt hidden |
| 5c | Dismiss: saved draft stays in localStorage |
| 6a | Clear removes saved draft from localStorage |
| 6b | Clear hides restore prompt |
| 7a | Corrupt saved draft: app still boots |
| 7b | Corrupt saved draft: no restore prompt shown |
| 7c | Corrupt saved draft: warning text visible |
| 8a | Schema mismatch: restore prompt does not appear |
| 8b | Schema mismatch: old project not silently loaded |
| 9a | Autosave writes envelope after edit |
| 9b | Autosave envelope schemaVersion matches app |
| 9c | Autosave captures edited title |
| 10 | Standalone HTML exports without error |
| 10b | Standalone HTML has taroke-project tag |
| 11a | Standalone HTML does not reference editor autosave key |
| 11b | Standalone HTML runtime has no localStorage.setItem call |
| 12a | localStorage unavailable: app boots without crashing |
| 12b | localStorage unavailable: unavailable message shown |
| 13 | No visible tick/line-number spans in run surface |
| 14 | Autosave status is perceivable text (strip has content) |
| 15 | Autosave strip has role=status |
| 16a | 375px: autosave strip rendered |
| 16b | 375px: no horizontal overflow from autosave UI |
