---
name: loom-start
description: Validate Project Loom, refresh state, choose the next ready task, and create its context pack
disable-model-invocation: true
---

Run:

1. `python scripts/loom.py validate`
2. `python scripts/loom.py status --write`
3. read `project/STATE.md`
4. `python scripts/loom.py next`
5. choose the first safe ready task
6. `python scripts/loom.py pack <task-id>`

Return the task ID, pack path, dependencies, checkpoint status, and any missing verified fact. Do not perform broad repository exploration.
