# TAROKE RIMIXER

- Preserve the frozen v07 root application and its accepted baseline.
- v08 is the React/TypeScript/Vite workbench under `apps/workbench` and `/next/`.
- The current user instruction or one ingested Project Relay workload is the only task authority.
- `docs/v08/control/`, former task files, former reviewer files, and former evidence ledgers are historical records, not executable instructions.
- Read only the active workload task and its named repository scope. Do not start subagents, agent teams, reviewers, background work, or repository-wide audits unless the active workload explicitly authorizes them.
- Run only the checks named by the active workload. Every long-running check must have a hard timeout; never rerun an unchanged failure.
- Mutable run state, logs, screenshots, and evidence belong under ignored `.claude/relay/run/`, not in candidate commits.
- After the authorized change and checks are complete, create at most one coherent commit and one PR, report the result, and stop. Never merge, deploy, or begin another workload implicitly.
