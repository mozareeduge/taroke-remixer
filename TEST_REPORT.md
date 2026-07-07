# Test report — v07 layout-pass

Command:

```bash
./tests/run_all_tests.sh
```

Result:

- Core/static: 14 passed, 0 failed.
- Browser functional CDP: 16 passed, 0 failed.
- User-notes regression: 10 passed, 0 failed.
- Route-template regression: 5 passed, 0 failed.

Total: 45 passed, 0 failed.

Extra manual/Node check:

- Imported `mumblings.taroke` project.
- Generated 100 events.
- No doubled commas.
- No unresolved `{...}` variables.
- Exported standalone HTML contains no visible tick spans.
- Export/import roundtrip preserved project title and no-line-number migration.
