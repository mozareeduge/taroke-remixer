# Test report — v07.6 live embedded artifact preview

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
- Live preview CDP: 19 passed, 0 failed.

Total: 199 passed, 0 failed.

## Live preview suite breakdown

| Test | Result |
|---|---|
| export contains iframe preview | PASS |
| iframe has sandbox attribute | PASS |
| iframe sandbox contains allow-scripts | PASS |
| iframe sandbox does not contain allow-same-origin | PASS |
| iframe has non-empty srcdoc | PASS |
| iframe srcdoc contains embedded project JSON | PASS |
| iframe srcdoc has artifact runtime | PASS |
| generated output has no unresolved {slot:form} variables | PASS |
| iframe artifact CSS hides tick spans | PASS |
| edit project then refresh updates iframe content | PASS |
| JSON export button remains available | PASS |
| HTML export button remains available | PASS |
| standalone HTML has required structure | PASS |
| preview failure does not crash app | PASS |
| preview refresh button is keyboard reachable | PASS |
| preview status is perceivable | PASS |
| preview refresh does not write to editor autosave key | PASS |
| mobile 375px: no horizontal overflow on export step | PASS |
| export preview controls have accessible text labels | PASS |

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
