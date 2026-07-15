#!/usr/bin/env python3
"""
Deterministic v07 baseline verifier.

Executes all 16 test suites in the v07 legacy baseline and asserts exactly
534 passed, 0 failed.  Every suite must run; skipping any suite is a hard
failure.  Per-suite arithmetic is printed so failures can be pinpointed
without re-reading multiple log lines.

Usage:
    python3 scripts/verify_v07_baseline.py [--no-browser]

    --no-browser  Skip the 13 CDP/browser suites and report them as SKIPPED
                  (this causes the gate to fail; it is provided only for
                  fast pre-flight in environments without Chromium).

Exit codes:
    0  All 16 suites ran; aggregate exactly 534 passed, 0 failed.
    1  One or more suites failed, were skipped, or the aggregate differed.
"""

import argparse
import os
import re
import subprocess
import sys

# ── Suite definitions ─────────────────────────────────────────────────────────
# Format: (label, command_list, expected_count, is_browser_suite)
# expected_count is the number of assertions declared in the suite.
# The verifier checks the ACTUAL count matches expected_count AND that 0 fail.
SUITES = [
    # JS-only suites (no browser)
    ("run_core_tests",                  ["node", "tests/run_core_tests.js"],                         14,  False),
    ("run_core_extended_tests",         ["node", "tests/run_core_extended_tests.js"],                38,  False),
    ("run_import_fidelity_tests",       ["node", "tests/run_import_fidelity_tests.js"],              35,  False),
    ("run_trigger_compatibility",       ["node", "tests/run_trigger_compatibility_regression.js"],    3,   False),
    ("run_trigger_runtime_parity_js",   ["node", "tests/run_trigger_runtime_parity_tests.js"],       32,  False),

    # Browser / CDP suites
    ("run_browser_functional_cdp",      ["python3", "tests/run_browser_functional_cdp.py"],          16,  True),
    ("run_user_notes_regression_cdp",   ["python3", "tests/run_user_notes_regression_cdp.py"],       10,  True),
    ("run_route_template_regression",   ["python3", "tests/run_route_template_regression_cdp.py"],   5,   True),
    ("run_cdp_deep_qa",                 ["python3", "tests/run_cdp_deep_qa.py"],                     50,  True),
    ("run_a11y_cdp",                    ["python3", "tests/run_a11y_cdp.py"],                        28,  True),
    ("run_autosave_cdp",                ["python3", "tests/run_autosave_cdp.py"],                    19,  True),
    ("run_import_fidelity_cdp",         ["python3", "tests/run_import_fidelity_cdp.py"],             30,  True),
    ("run_interaction_continuity_cdp",  ["python3", "tests/run_interaction_continuity_cdp.py"],      51,  True),
    ("run_trigger_runtime_parity_cdp",  ["python3", "tests/run_trigger_runtime_parity_cdp.py"],      16,  True),
    ("run_live_preview_cdp",            ["python3", "tests/run_live_preview_cdp.py"],                76,  True),
    ("run_docs_verification",           ["python3", "tests/run_docs_verification.py"],               111, False),
]

EXPECTED_TOTAL_PASSED = 534
EXPECTED_TOTAL_FAILED = 0

# "N passed, M failed" — printed by every suite at its last line
RESULT_RE = re.compile(r"(\d+)\s+passed,\s+(\d+)\s+failed", re.IGNORECASE)

# ── Helpers ───────────────────────────────────────────────────────────────────

def find_chromium():
    """Return the first usable Chromium binary path, or None."""
    import glob, shutil

    # 1. TAROKE_CHROMIUM_PATH — explicit binary path override
    explicit = os.environ.get("TAROKE_CHROMIUM_PATH", "").strip()
    if explicit and os.path.isfile(explicit) and os.access(explicit, os.X_OK):
        return explicit

    # 2. PLAYWRIGHT_BROWSERS_PATH — directory where Playwright stores browsers
    pw_base = os.environ.get("PLAYWRIGHT_BROWSERS_PATH", "").strip()
    if pw_base and os.path.isdir(pw_base):
        for pat in ["chromium*/chrome-linux/chrome", "chromium*/chrome"]:
            matches = sorted(glob.glob(os.path.join(pw_base, pat)))
            for m in matches:
                if os.path.isfile(m) and os.access(m, os.X_OK):
                    return m

    # 3. Common default Playwright cache locations
    home = os.path.expanduser("~")
    for base in [f"{home}/.cache/ms-playwright", "/root/.cache/ms-playwright"]:
        if os.path.isdir(base):
            for pat in ["chromium*/chrome-linux/chrome", "chromium*/chrome"]:
                matches = sorted(glob.glob(os.path.join(base, pat)))
                for m in matches:
                    if os.path.isfile(m) and os.access(m, os.X_OK):
                        return m

    # 4. Hardcoded container paths (this execution environment)
    for c in [
        "/opt/pw-browsers/chromium-1194/chrome-linux/chrome",
        "/opt/pw-browsers/chromium/chrome-linux/chrome",
    ]:
        if os.path.exists(c):
            return c

    # 5. System Chromium fallback (not recommended — apt version differs)
    for c in ["chromium-browser", "chromium", "google-chrome"]:
        if shutil.which(c):
            return c

    return None


def banner(title):
    width = 72
    print()
    print("=" * width)
    print(f"  {title}")
    print("=" * width)


def run_suite(label, cmd, expected_count, timeout_s=300, extra_env=None):
    """
    Run one suite.  Return (passed, failed, skipped_reason).
    skipped_reason is None on normal execution.
    """
    print(f"\n── {label} ", end="", flush=True)
    env = os.environ.copy()
    if extra_env:
        env.update(extra_env)
    try:
        result = subprocess.run(
            cmd,
            capture_output=True,
            text=True,
            timeout=timeout_s,
            env=env,
        )
    except subprocess.TimeoutExpired:
        print(f"TIMEOUT after {timeout_s}s")
        return 0, 0, f"timed out after {timeout_s}s"
    except FileNotFoundError as e:
        print(f"NOT FOUND: {e}")
        return 0, 0, str(e)

    output = result.stdout + result.stderr
    match = None
    for line in reversed(output.splitlines()):
        m = RESULT_RE.search(line)
        if m:
            match = m
            break

    if match is None:
        print(f"NO RESULT LINE (exit={result.returncode})")
        if result.stderr.strip():
            print("    stderr:", result.stderr.strip()[:400])
        return 0, 0, "no 'N passed, M failed' line in output"

    p, f = int(match.group(1)), int(match.group(2))
    status = "PASS" if (f == 0 and p == expected_count) else "FAIL"
    count_ok = p == expected_count
    print(f"{status}  {p} passed, {f} failed  (expected {expected_count} passed, 0 failed)")

    if not count_ok:
        print(f"    *** count mismatch: got {p}, expected {expected_count}")

    if result.returncode != 0 and f == 0:
        # Suite printed 0 failed but exited non-zero — treat conservatively
        print(f"    *** non-zero exit ({result.returncode}) despite 0 failed")
        f += 1

    return p, f, None


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    ap = argparse.ArgumentParser(description="Deterministic v07 baseline verifier")
    ap.add_argument("--no-browser", action="store_true",
                    help="Skip browser suites (gate will fail)")
    args = ap.parse_args()

    # Locate repo root (scripts/ lives one level below root)
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    os.chdir(root)

    chromium = find_chromium()

    banner("v07 Baseline Verifier — expecting 534 passed, 0 failed across 16 suites")
    print(f"  repo root:  {root}")
    print(f"  chromium:   {chromium or 'NOT FOUND'}")
    if args.no_browser:
        print("  mode:       --no-browser (gate will FAIL)")

    total_passed = 0
    total_failed = 0
    suite_rows = []
    gate_ok = True

    for label, cmd, expected, is_browser in SUITES:
        if is_browser and args.no_browser:
            print(f"\n── {label} SKIPPED (--no-browser)")
            suite_rows.append((label, None, None, expected, "SKIPPED"))
            gate_ok = False
            continue

        if is_browser and chromium is None:
            print(f"\n── {label} SKIPPED (chromium not found)")
            suite_rows.append((label, None, None, expected, "NO_CHROMIUM"))
            gate_ok = False
            continue

        extra = {"TAROKE_CHROMIUM_PATH": chromium} if (is_browser and chromium) else None
        p, f, skip_reason = run_suite(label, cmd, expected, extra_env=extra)

        if skip_reason:
            suite_rows.append((label, None, None, expected, f"ERROR: {skip_reason}"))
            gate_ok = False
        else:
            suite_rows.append((label, p, f, expected, "OK" if f == 0 and p == expected else "FAIL"))
            total_passed += p
            total_failed += f
            if f > 0 or p != expected:
                gate_ok = False

    # ── Per-suite arithmetic ──────────────────────────────────────────────────
    banner("Per-suite arithmetic")
    col = "{:<38} {:>8} {:>8} {:>8}  {}"
    print(col.format("Suite", "passed", "failed", "expected", "verdict"))
    print("-" * 72)
    running_p = 0
    running_f = 0
    for label, p, f, exp, verdict in suite_rows:
        p_str = str(p) if p is not None else "-"
        f_str = str(f) if f is not None else "-"
        if p is not None:
            running_p += p
            running_f += f
        print(col.format(label[:38], p_str, f_str, str(exp), verdict))
    print("-" * 72)
    print(col.format("TOTAL", str(running_p), str(running_f),
                     str(EXPECTED_TOTAL_PASSED), ""))

    # ── Gate ─────────────────────────────────────────────────────────────────
    banner("Gate result")
    if total_passed == EXPECTED_TOTAL_PASSED and total_failed == EXPECTED_TOTAL_FAILED and gate_ok:
        print(f"  GATE PASSED — {total_passed} passed, {total_failed} failed")
        print()
        sys.exit(0)
    else:
        print(f"  GATE FAILED")
        print(f"    actual:   {total_passed} passed, {total_failed} failed")
        print(f"    expected: {EXPECTED_TOTAL_PASSED} passed, {EXPECTED_TOTAL_FAILED} failed")
        if not gate_ok:
            failed_suites = [r[0] for r in suite_rows if r[4] not in ("OK",)]
            print(f"    suites with issues: {', '.join(failed_suites)}")
        print()
        sys.exit(1)


if __name__ == "__main__":
    main()
