# TAROKE RIMIXER — Claude Code rules

## Architecture scope

- Frozen v07 is the root static application and its legacy verifier. Preserve its behavior and 534 passed, 0 failed baseline.
- v08 is the React/TypeScript/Vite workbench under `apps/workbench`, current packages, CI, and `/next/` build tooling.
- Static/no-framework rules apply only to v07 files. Do not use them to reject the authorized v08 architecture.

## Current program

- Canonical branch and PR come from `docs/v08/control/RUN_STATE.json`.
- Do not create another branch or PR unless current explicit user authority says so.
- Do not merge or begin the next work package before its human checkpoint.
- When a Relay workload is active, read its `START_HERE.md`, current run state, active task, and only the authority files named by that task.

## Meaning of done

Code existence is `implemented`, not `done`.
A required behavior is done only when its mapped scenarios pass for the current candidate, evidence is fresh, required CI and reviews pass, no P0/P1 remains, and public verification passes where required.
Never use earlier-SHA evidence for a later SHA.

## Workflow

- One user kickoff may span multiple internal tasks and context-managed campaigns.
- Continue through dependency-satisfied tasks without phase approvals.
- Use targeted tests during edits; run broad gates only at task/freeze points.
- Fix root causes. Do not mute failures, weaken tests, add vacuous assertions, or rerun unchanged failures.
- Update durable state after each coherent atomic group; commit and push safe work.
- Stop only for the workload completion gate, a verified authority/permission/material blocker, or external usage exhaustion after a clean handoff.

## Context economy

- Keep startup reads minimal.
- Store full logs/screenshots on disk and report bounded summaries.
- Use at most one bounded exploration subagent per task when it saves main-context reads.
- Run fresh reviewers only after the candidate is frozen.
- Before context saturation, finish or revert the atomic edit, update state, commit, and preserve the next exact action.

## Project invariants

- Preserve authored text, bank order, IDs, meaningful empty states, migration provenance, import/export, and local-first behavior.
- Cue is private audition; Surface is committed generation.
- Editor, runtime, UNMIX, JSON, preview, and standalone HTML must agree.
- Maintain focus, caret, selection, scroll, reading position, keyboard, touch, accessibility, and responsive behavior.
