# Control-plane resolution

The existing root `CLAUDE.md` describes the older static v07 architecture and says “one session = one bounded task.” Those instructions conflict with the actual v08 workbench and the desired one-kickoff Relay program.

T00 must replace the root file with `repository/PROPOSED_ROOT_CLAUDE.md`, after creating a local backup. The replacement:

- scopes static/no-framework rules to v07;
- authorizes the current React/TypeScript/Vite v08 architecture;
- names the canonical branch and PR policy;
- defines done as verified, reviewed, and deployed where required;
- establishes progressive context loading and durable state;
- allows one user kickoff to span multiple internal tasks/campaigns.

Existing Loom, recovery, status, PR, and checkpoint files are evidence/history, not parallel task authorities. `docs/v08/control/RUN_STATE.json` and `docs/v08/control/FEATURES.json` become the machine truth for execution status. Existing design/program documents remain product authority where this workload references them.
