#!/usr/bin/env python3
"""
Static verifier: all CDP test scripts in tests/ must import resolve_chromium
from browser_runtime rather than maintaining their own Chromium lookup lists.

Exits 0 if all CDP scripts comply; exits 1 and prints violations otherwise.
"""
import pathlib
import re
import sys

TESTS_DIR = pathlib.Path(__file__).resolve().parent
CDP_SCRIPTS = sorted(TESTS_DIR.glob("run_*_cdp.py"))

# Pattern that would indicate a local lookup list (not using shared resolver)
STALE_LOOKUP = re.compile(
    r"next\s*\(\s*\(p\s+for\s+p\s+in\s+\[.*chromium.*\]",
    re.DOTALL,
)
REQUIRED_IMPORT = re.compile(r"from\s+browser_runtime\s+import\s+resolve_chromium")

violations = []
for script in CDP_SCRIPTS:
    src = script.read_text()
    has_import = bool(REQUIRED_IMPORT.search(src))
    has_stale = bool(STALE_LOOKUP.search(src))
    if not has_import:
        violations.append(f"MISSING import: {script.name}")
    if has_stale:
        violations.append(f"STALE local lookup remains: {script.name}")

if violations:
    print(f"FAIL — {len(violations)} violation(s):")
    for v in violations:
        print(f"  {v}")
    sys.exit(1)

print(f"OK — all {len(CDP_SCRIPTS)} CDP scripts use browser_runtime.resolve_chromium")
sys.exit(0)
