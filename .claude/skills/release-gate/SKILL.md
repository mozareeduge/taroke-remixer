---
name: release-gate
description: Enforce final tests, compatibility, experience, deployment, rollback, and tag.
---
No skipped suite counts. Verify: human verdict (Checkpoint B ACCEPT), real Grave rerun (33/270/80), live smoke at deployed URL, archive v07 at /legacy/v07/, rollback package documented and tested, evidence in EVIDENCE_INDEX.md, tag v08.0-editor-rebuild. Block if any P0/P1 unresolved. Block if two human checkpoints not recorded. Block if cross-browser (Chromium/Firefox/WebKit) not green. Block if a11y/visual/performance/security suites not green.
