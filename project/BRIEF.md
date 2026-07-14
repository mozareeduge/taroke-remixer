# TAROKE RIMIXER — Project Brief

This file is the Loom project brief. Full design authority is in `docs/v08/program/`.

## Purpose

Rebuild the TAROKE RIMIXER editor (v07.8 baseline) as a stable, legible, responsive
poetic signal workstation in React/TypeScript/Vite (v08), preserving generator parity,
import/export fidelity, and all authored-project compatibility of v07.

Full mission: `docs/v08/program/00_MASTER_CHARTER.md`

## Desired result

- Human Checkpoint A: live `/next/` URL with complete vertical slice, 3-browser proof,
  7-viewport screenshots, downloadable JSON and standalone HTML.
- Human Checkpoint B: production-grade hardened editor at `/`.
- Full program through WP13 cutover (WP06–WP13 after Checkpoint A verdict).

## Human-sensitive decisions

- Product identity, poetry/music metaphors, terminology (TAROKE, Cue, Surface, etc.)
- Aesthetic direction (archaeological-modernist)
- Compatibility promises for external v07 projects
- Release and deployment verdicts (Checkpoint A/B)
- Any schema change that breaks 0.7-reset projects without a tested migration

Do not make these decisions independently.

## Constraints

- No framework/bundler change to v07 root (src/, index.html, styles.css — frozen)
- Model: claude-sonnet-4-6 / medium — do not escalate
- v07 verifier must read 534 passed, 0 failed at all times
- No unreviewed commits to main
- One package-pure PR per work package
- No graph memory, no external vector store in critical path

## Evidence of success

See `docs/v08/program/12_HUMAN_CHECKPOINTS.md` for Checkpoint A packet spec.
