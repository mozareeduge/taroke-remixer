#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
node --check src/core.js
node --check src/app.js
node tests/run_core_tests.js
node tests/run_core_extended_tests.js
node tests/run_import_fidelity_tests.js
python3 tests/run_browser_functional_cdp.py
python3 tests/run_user_notes_regression_cdp.py
python3 tests/run_route_template_regression_cdp.py
python3 tests/run_cdp_deep_qa.py
python3 tests/run_a11y_cdp.py
python3 tests/run_autosave_cdp.py
python3 tests/run_import_fidelity_cdp.py
python3 tests/run_interaction_continuity_cdp.py
node tests/run_trigger_compatibility_regression.js
node tests/run_trigger_runtime_parity_tests.js
python3 tests/run_trigger_runtime_parity_cdp.py
python3 tests/run_live_preview_cdp.py
python3 tests/run_docs_verification.py
