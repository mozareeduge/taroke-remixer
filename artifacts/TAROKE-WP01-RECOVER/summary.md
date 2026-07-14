# TAROKE-WP01-RECOVER — Evidence Summary

**Status:** COMPLETE  
**Merged:** 2026-07-14T14:05 UTC  
**PR:** #10 (`claude/v08-wp01-toolchain-recovery` → `main`)  
**Merge SHA:** `be91655e8d69a2f60a81d02a5004a902e7e31f27` (squash)  
**Rebased on:** `b3eca6b8` (post-WP00-merge main)  
**Review:** APPROVED — zero P0/P1 findings

---

## Gate Checklist

| Item | Result |
|------|--------|
| 534 v07 tests pass (deterministic verifier) | PASS |
| v07 root unchanged (src/, index.html, styles.css, tests/) | PASS |
| package.json version 0.7.8 preserved | PASS |
| package.json type: commonjs preserved | PASS |
| CI uses Playwright Chromium for v07 baseline | PASS |
| CI uses `python3 scripts/verify_v07_baseline.py` | PASS |
| Verifier PLAYWRIGHT_BROWSERS_PATH-aware | PASS |
| No deploy-to-main bot | PASS |
| No pre-built next/ artifact committed | PASS |
| Branch rebased on current main post-WP00 | PASS |
| Independent review | APPROVED |
| PR merged | COMPLETE |

---

## Defects Fixed (vs original PR #5)

| Defect | Original | Fix |
|--------|----------|-----|
| Chromium for v07 baseline | apt-get chromium (wrong binary, 2 failures) | npx playwright install --with-deps chromium |
| Baseline aggregation | ./tests/run_all_tests.sh (last-line only, missed 301 tests) | python3 scripts/verify_v07_baseline.py (all 16 suites, deterministic) |
| Deploy-to-main bot | deploy-next committed built next/ on every push | Removed |
| Pre-built artifact | next/assets/index-C1Y37Wq2.js committed | Not committed |
| Verifier Chromium detection | Hardcoded /opt/pw-browsers (fails CI) | Checks PLAYWRIGHT_BROWSERS_PATH env, ~/.cache/ms-playwright, then hardcoded paths |
| CI env var | TAROKE_CHROMIUM_PATH: ${{ env.PLAYWRIGHT_BROWSERS_PATH }} (no-op) | Shell find step exports PLAYWRIGHT_BROWSERS_PATH to $GITHUB_ENV |
| Verifier not on branch | Pre-WP00 base, no verifier | Rebased on main — WP00 verifier included |

---

## Structure Added to main

- `package.json`: workspaces; version 0.7.8; type commonjs
- `tsconfig.base.json`: strict TypeScript base
- `apps/workbench/`: React 18 + Vite 5 + RTK + React Aria + dnd-kit; Playwright; Vitest
- `packages/{core,schema,artifact-runtime,ui,fixtures}/`: stubs
- `tests/e2e/smoke.spec.ts`: Playwright smoke placeholder
- `.gitignore`: node_modules, dist, coverage, playwright-report
- `.github/workflows/ci.yml`: v07-baseline (deterministic verifier), v08-typecheck, v08-unit, v08-build-next, v08-e2e-chromium (artifact only)

---

## Next Tasks (now unblocked)

- **TAROKE-WP02-RECOVER** (active): rebase `claude/v08-wp02-core-schema-recovery` on `be91655e`, PR, compatibility review, merge
- **TAROKE-WP04-RECOVER** (active, parallel): rebase `claude/v08-wp04-ui-shell-recovery` on `be91655e`, fix contrast + focus-visible, PR, a11y review, merge
