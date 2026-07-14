---
name: loom-execute
description: Execute one Project Loom task in an isolated context and return compact evidence
disable-model-invocation: true
context: fork
agent: loom-worker
---

Execute task `$ARGUMENTS`.

Read the generated task pack. Verify branch and scope. Begin the task, implement the complete contract, save full evidence, run required verification, and return a concise structured summary. Do not update unrelated project areas. Do not declare completion before evidence and required review.
