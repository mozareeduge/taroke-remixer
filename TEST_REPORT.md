# Test report — v07.5c exact import fidelity and project-integrity correction

Command:

```bash
./tests/run_all_tests.sh
```

Result:

- Core/static: 14 passed, 0 failed.
- Core extended: 38 passed, 0 failed.
- Import fidelity (JS): 30 passed, 0 failed.
- Browser functional CDP: 16 passed, 0 failed.
- User-notes regression: 10 passed, 0 failed.
- Route-template regression: 5 passed, 0 failed.
- CDP deep QA: 50 passed, 0 failed.
- Accessibility/CDP hardening: 28 passed, 0 failed.
- Autosave/recovery CDP: 19 passed, 0 failed.
- Import fidelity CDP: 30 passed, 0 failed.

Total: 240 passed, 0 failed.

## Import fidelity suite breakdown (JS — run_import_fidelity_tests.js)

| Test | Result |
|---|---|
| defaultProject still has classic banks | PASS |
| explicit custom trays: no classic banks injected | PASS |
| custom project: exact custom bank set preserved | PASS |
| explicit empty tray remains empty | PASS |
| legacy dictionary migrates exactly without extra banks | PASS |
| missing trays use default classic banks | PASS |
| bankMeta contains only actual project trays | PASS |
| custom role values adverb and preposition survive migration | PASS |
| imported bankMeta labels survive migration | PASS |
| tray key order is preserved after migration | PASS |
| explicit empty lineDevices remains empty | PASS |
| explicit empty stanzaPatterns remains empty | PASS |
| explicit empty flowScenes remains empty | PASS |
| validation reports unusable empty-collection project | PASS |
| duplicate token IDs are repaired deterministically | PASS |
| migration is idempotent: double-migrate does not change structure | PASS |
| JSON round-trip preserves exact custom tray set | PASS |
| HTML round-trip preserves exact custom tray set | PASS |
| token literals and weights survive JSON round-trip | PASS |
| bankMeta roles survive JSON round-trip | PASS |
| device input tray references survive round-trip | PASS |
| duplicate-ID repair records provenance in meta.importRepairs | PASS |
| legacy dict: lineMachines become lineDevices | PASS |
| legacy dict: rareEvents become triggers | PASS |
| surface.showTick=false and family=taroko are invariants | PASS |
| absent lineDevices use classic defaults | PASS |
| explicit empty materials.trays produces empty tray set | PASS |
| projectTrayDefs returns only actual project trays | PASS |
| generation succeeds on custom project without errors | PASS |
| validation: custom project with correct device inputs has no missing-tray errors | PASS |

## Import fidelity suite breakdown (CDP — run_import_fidelity_cdp.py)

| Test | Result |
|---|---|
| app boots with default project | PASS |
| default project shows ABOVE bank on Samples | PASS |
| import succeeds without crash | PASS |
| Samples: no classic banks visible after custom import | PASS |
| Samples: first selected bank is a valid imported bank | PASS |
| Samples: all imported bank labels are visible | PASS |
| Samples: bank order matches fixture order | PASS |
| bankMeta: relations role is adverb | PASS |
| bankMeta: among_prep role is preposition | PASS |
| Devices: no classic bank labels in device editor | PASS |
| Devices: custom bank label present in device editor | PASS |
| Devices: device inputs reference only custom banks | PASS |
| Triggers: no classic bank labels in trigger selector | PASS |
| New device: no reference to classic bank "above" | PASS |
| New trigger: does not reference classic bank "above" | PASS |
| New input: does not reference classic bank "reserve" | PASS |
| Export JSON: no injected classic banks in tray set | PASS |
| Export JSON: custom banks present | PASS |
| Run: line events generated from custom banks | PASS |
| Run: no blank line surfaces | PASS |
| 375px: no horizontal overflow with custom bank list | PASS |
| Bank deletion: referenced bank deletion is blocked | PASS |
| Bank deletion: unreferenced bank deleted without reserve recreation | PASS |
| New project after custom import shows classic ABOVE bank | PASS |
| New project has default classic above tray | PASS |
| Re-import: tray key order preserved | PASS |
| Samples: adverb role visible for relations bank | PASS |
| Samples: preposition role visible for among_prep bank | PASS |
| HTML round-trip: exact tray set preserved | PASS |
| No uncaught errors detected | PASS |

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
