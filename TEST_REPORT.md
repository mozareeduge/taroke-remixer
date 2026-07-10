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
- Autosave/recovery CDP: 19 passed, 0 failed.

Total: 180 passed, 0 failed.

## Autosave/recovery suite breakdown

| Test | Result |
|---|---|
| edit project → autosave writes to localStorage key | PASS |
| saved value contains savedAt and project payload | PASS |
| autosave status is perceivable text | PASS |
| mobile 375px: no horizontal overflow from autosave UI | PASS |
| no visible tick/line-number regression in run surface | PASS |
| standalone HTML export does not embed autosave storage key | PASS |
| standalone HTML does not write to editor autosave key | PASS |
| clear saved draft removes draft from localStorage | PASS |
| autosave stores schemaVersion in saved wrapper | PASS |
| boot with saved draft → restore prompt appears | PASS |
| restore loads saved draft content | PASS |
| dismiss keeps current/default state (no silent restore) | PASS |
| dismiss hides restore prompt | PASS |
| corrupt saved draft does not crash app | PASS |
| corrupt draft: restore prompt not shown | PASS |
| schema/version mismatch does not crash app | PASS |
| schema/version mismatch does not silently load project | PASS |
| localStorage unavailable: app boots without crash | PASS |
| localStorage unavailable: autosave unavailable message shown | PASS |
