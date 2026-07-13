---
name: root-cause
description: Diagnose a reproduced defect before implementation.
---
Steps: 1. Reproduce exactly (inputs, state, sequence). 2. Classify (P0/P1/P2/P3, category: data/interaction/render/compatibility/a11y/perf/security). 3. Instrument state/DOM/runtime at failure point. 4. Isolate to smallest failing case. 5. Write minimal failing regression test before touching code. 6. Identify root cause (not symptom). 7. Propose smallest correct fix. Reject: selector patches that hide behavior, screenshot updates that mask failures, expectation rewrites that make broken code pass.
