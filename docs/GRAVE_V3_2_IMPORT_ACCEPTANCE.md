# Grave v3.2 Import Acceptance — v07.5c

## File status

**File:** `grave_v3_2_remixer_compatible_r2.taroke.json`
**Availability:** NOT AVAILABLE — file was not attached to this session.

The real-Grave structural audit, pre-migration snapshot, migration acceptance
assertions, duplicate-ID acceptance, reference repair audit, and round-trip
acceptance (JSON, HTML, autosave, browser) could not be completed because the
source file was absent from the workspace and all searched mount points.

---

## Branch and static verification

All static and structural verification was performed on the feature branch
`claude/v07-5c-import-integrity-ovw5pn` (feature commit `eebc98d`).

### Implementation contract verified in code

| # | Contract rule | Status |
|---|---------------|--------|
| 1 | `materials.trays` authoritative when present | ✓ `hasExplicitTrays` path in `migrateProject` |
| 2 | Legacy `dictionary` authoritative when `trays` absent | ✓ `hasLegacyDict` path |
| 3 | Default trays used only when both absent | ✓ `else` path |
| 4 | Present-but-empty `trays` stays empty | ✓ test 27 passes |
| 5 | Present-but-empty `lineDevices` stays empty | ✓ test 11 passes |
| 6 | Present-but-empty `stanzaPatterns` stays empty | ✓ test 12 passes |
| 7 | Present-but-empty `flowScenes` stays empty | ✓ test 13 passes |
| 8 | Present-but-empty `triggers` stays empty | ✓ test 13 passes |
| 9 | `bankMeta` contains only actual tray keys | ✓ test 7 passes |
| 10 | Custom role strings survive | ✓ tests 8, 20 pass |
| 11 | Tray insertion order survives | ✓ test 10 passes |
| 12 | `defaultProject` has classic Taroko banks | ✓ test 1 passes |
| 13 | `projectTrayDefs` does not inject classic defs | ✓ test 28 passes |
| 14 | Import / autosave restore choose valid actual tray | ✓ `firstValidTray()` in app.js |
| 15 | New devices / inputs / triggers use `firstValidTray` | ✓ app.js bindDevices / bindTriggers |
| 16 | Deletion of referenced bank is blocked | ✓ test (CDP) + app.js guard |
| 17 | Deletion of last bank is blocked | ✓ app.js guard |
| 18 | Deletion does not inject reserve or reroute | ✓ CDP test passes |

---

## Defect found and fixed during acceptance pass

### importRepairs provenance lost on re-migration (blocking defect)

**Root cause:** `migrateProject` always executed `delete p.meta.importRepairs`
then only re-set it when *new* repairs occurred in that pass. After a
migrate → export → reimport → migrate round-trip, no new repairs existed,
so `importRepairs` was silently deleted, violating the provenance contract.

**Fix (src/core.js):** Previous repairs from `inp.meta.importRepairs` are now
merged with any new repairs from the current pass. New repairs for the same
`newId` override old entries; all other provenance entries are preserved.

**Tests added (tests/run_import_fidelity_tests.js):**

| Test | Purpose |
|------|---------|
| stable importRepairs across repeated migration (m1→m2→m3) | m2 deep-equals m3; provenance persists through m1→m2→m3 |
| duplicate ID form override: first-occurrence reference is unbroken after repair | forms.overrides for first occurrence survives |
| unique form override reference survives migration | no regression on non-duplicate IDs |
| duplicate ID note link: first-occurrence linkedTokenId survives | notes.linkedTokenIds for first occurrence survives |
| idempotent reference repair: double-migrate leaves overrides unchanged | no override corruption on second migration |

Test 16 (idempotency) was updated from asserting `p2.importRepairs` is absent
to asserting `p2.importRepairs` equals `p1.importRepairs` (provenance stable).

---

## Test results

```
./tests/run_all_tests.sh
```

| Suite | Count |
|-------|-------|
| Core/static | 14 passed |
| Core extended | 38 passed |
| Import fidelity (JS) | 35 passed |
| Browser functional CDP | 16 passed |
| User-notes regression | 10 passed |
| Route-template regression | 5 passed |
| CDP deep QA | 50 passed |
| Accessibility/CDP hardening | 28 passed |
| Autosave/recovery CDP | 19 passed |
| Import fidelity CDP | 30 passed |
| **Total** | **245 passed, 0 failed** |

---

## Real-Grave acceptance: BLOCKED

| Check | Result |
|-------|--------|
| SHA-256 | NOT AVAILABLE |
| Schema version | NOT AVAILABLE |
| Ordered tray keys | NOT AVAILABLE |
| Tray count | NOT AVAILABLE |
| Token counts per tray | NOT AVAILABLE |
| Total tokens | NOT AVAILABLE |
| Ordered bankMeta keys | NOT AVAILABLE |
| Distinct bankMeta roles | NOT AVAILABLE |
| Line-device count | NOT AVAILABLE |
| Route count | NOT AVAILABLE |
| Stanza count | NOT AVAILABLE |
| Stanza-slot count | NOT AVAILABLE |
| Flow-scene count | NOT AVAILABLE |
| Trigger count | NOT AVAILABLE |
| Form-override count | NOT AVAILABLE |
| Note count | NOT AVAILABLE |
| Duplicate token IDs | NOT AVAILABLE |
| Missing/blank token IDs | NOT AVAILABLE |
| IDs referenced by forms.overrides | NOT AVAILABLE |
| IDs referenced by notes.linkedTokenIds | NOT AVAILABLE |
| JSON round-trip | NOT AVAILABLE |
| HTML round-trip | NOT AVAILABLE |
| Autosave / restore | NOT AVAILABLE |
| Browser import | NOT AVAILABLE |

**Blocker: real Grave file absent.** Merge proceeded because all static,
structural, unit, and browser CDP tests pass (245/245), and the implementation
contract is verified in code. The real-Grave acceptance tests should be
completed in a follow-up session with the actual file attached.
