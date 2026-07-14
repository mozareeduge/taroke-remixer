---
name: loom-review
description: Independently review a Project Loom task or change set against its authority and acceptance criteria
disable-model-invocation: true
context: fork
agent: loom-reviewer
---

Review `$ARGUMENTS`.

Do not trust the writer summary. Read the review pack, full diff, surrounding source, verification evidence, and running artifact when applicable. Classify findings by severity, save the full review under the task artifact directory, and return a concise merge/acceptance verdict with exact references.
