---
name: baseline-audit
description: Verify v07.8 tag, commit, tests, fixtures, and repository state.
---
Fetch tags/main, verify commit equals f7183f01037bf963612d4b56561d3b8cdde306b5, run complete baseline (./tests/run_all_tests.sh), inventory suites/fixtures, update test migration ledger, stop on unexplained count difference. Expected: 534 passed, 0 failed (16 suites).
