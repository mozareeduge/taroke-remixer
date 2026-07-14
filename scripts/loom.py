#!/usr/bin/env python3
"""Project Loom: dependency-free project state, context-pack, and evidence utility."""
from __future__ import annotations

import argparse
import copy
import datetime as dt
import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "project"
CONFIG_PATH = PROJECT / "CONFIG.json"
WORK_PATH = PROJECT / "WORK.json"
LEDGER_PATH = PROJECT / "LEDGER.jsonl"
STATE_PATH = PROJECT / "STATE.md"
PACKS = PROJECT / "PACKS"
SNAPSHOTS = PROJECT / "SNAPSHOTS"

VALID_STATUSES = {
    "planned", "ready", "active", "blocked", "review",
    "complete", "superseded", "rejected"
}

def now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat()

def read_json(path: Path, default: Any = None) -> Any:
    if not path.exists():
        if default is not None:
            return copy.deepcopy(default)
        raise SystemExit(f"Missing required file: {path.relative_to(ROOT)}")
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        raise SystemExit(f"Invalid JSON in {path.relative_to(ROOT)}: {e}") from e

def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

def load_ledger() -> list[dict[str, Any]]:
    if not LEDGER_PATH.exists():
        return []
    out = []
    for i, line in enumerate(LEDGER_PATH.read_text(encoding="utf-8").splitlines(), 1):
        if not line.strip():
            continue
        try:
            out.append(json.loads(line))
        except json.JSONDecodeError as e:
            raise SystemExit(f"Invalid JSONL at project/LEDGER.jsonl:{i}: {e}") from e
    return out

def append_ledger(entry: dict[str, Any]) -> None:
    LEDGER_PATH.parent.mkdir(parents=True, exist_ok=True)
    entry = {"timestamp": now(), **entry}
    with LEDGER_PATH.open("a", encoding="utf-8") as f:
        f.write(json.dumps(entry, ensure_ascii=False) + "\n")

def git_value(args: list[str]) -> str:
    try:
        return subprocess.check_output(
            ["git", *args], cwd=ROOT, text=True, stderr=subprocess.DEVNULL
        ).strip()
    except Exception:
        return "unknown"

def tasks_by_id(work: dict[str, Any]) -> dict[str, dict[str, Any]]:
    return {t["id"]: t for t in work.get("tasks", [])}

def ready_tasks(work: dict[str, Any]) -> list[dict[str, Any]]:
    by_id = tasks_by_id(work)
    ready = []
    for task in work.get("tasks", []):
        if task.get("status") not in {"planned", "ready"}:
            continue
        deps = task.get("depends_on", [])
        if all(by_id.get(dep, {}).get("status") == "complete" for dep in deps):
            ready.append(task)
    return ready

def validate() -> list[str]:
    errors: list[str] = []
    config = read_json(CONFIG_PATH)
    work = read_json(WORK_PATH)
    tasks = work.get("tasks")
    if not isinstance(tasks, list):
        errors.append("project/WORK.json: tasks must be a list")
        return errors

    ids = [t.get("id") for t in tasks]
    duplicates = sorted({x for x in ids if x and ids.count(x) > 1})
    if duplicates:
        errors.append(f"Duplicate task IDs: {duplicates}")
    if any(not x for x in ids):
        errors.append("Every task requires a non-empty id")

    by_id = tasks_by_id(work)
    for task in tasks:
        tid = task.get("id", "<missing>")
        if task.get("status") not in VALID_STATUSES:
            errors.append(f"{tid}: invalid status {task.get('status')!r}")
        for dep in task.get("depends_on", []):
            if dep not in by_id:
                errors.append(f"{tid}: missing dependency {dep}")
        for ref in task.get("authority", []):
            path = ref.split("#", 1)[0]
            if path and not (ROOT / path).exists():
                errors.append(f"{tid}: missing authority path {path}")
        for key in ("allowed_paths", "forbidden_paths"):
            pass

    # Cycle detection
    visiting: set[str] = set()
    visited: set[str] = set()
    def visit(tid: str, chain: list[str]) -> None:
        if tid in visiting:
            errors.append("Dependency cycle: " + " -> ".join(chain + [tid]))
            return
        if tid in visited:
            return
        visiting.add(tid)
        for dep in by_id.get(tid, {}).get("depends_on", []):
            visit(dep, chain + [tid])
        visiting.remove(tid)
        visited.add(tid)
    for tid in by_id:
        visit(tid, [])

    model = config.get("model", {})
    if model.get("name") != "claude-sonnet-4-6":
        errors.append("CONFIG model must be claude-sonnet-4-6")
    if model.get("effort") != "medium":
        errors.append("CONFIG effort must be medium")

    load_ledger()  # validates JSONL
    return errors

def extract_markdown_section(ref: str) -> str:
    if "#" not in ref:
        path = ROOT / ref
        if not path.exists():
            return f"[missing authority: {ref}]"
        text = path.read_text(encoding="utf-8")
        return text[:12000]
    path_str, heading = ref.split("#", 1)
    path = ROOT / path_str
    if not path.exists():
        return f"[missing authority: {ref}]"
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    heading_norm = heading.strip().lower()
    start = None
    level = None
    for i, line in enumerate(lines):
        m = re.match(r"^(#{1,6})\s+(.*)$", line)
        if m and m.group(2).strip().lower() == heading_norm:
            start = i
            level = len(m.group(1))
            break
    if start is None:
        return f"[heading not found: {ref}]"
    end = len(lines)
    for j in range(start + 1, len(lines)):
        m = re.match(r"^(#{1,6})\s+", lines[j])
        if m and len(m.group(1)) <= int(level):
            end = j
            break
    return "\n".join(lines[start:end])

def estimate_tokens(text: str) -> int:
    return max(1, len(text) // 4)

def build_state(write: bool) -> str:
    config = read_json(CONFIG_PATH)
    work = read_json(WORK_PATH)
    ledger = load_ledger()
    tasks = work.get("tasks", [])
    active = [t for t in tasks if t.get("status") == "active"]
    ready = ready_tasks(work)
    blocked = [t for t in tasks if t.get("status") == "blocked"]
    completed = [t for t in tasks if t.get("status") == "complete"][-6:]
    decisions = [e for e in ledger if e.get("type") in {"decision", "human_verdict"}][-5:]

    lines = [
        "# Current State",
        "",
        f"- Project: {config.get('project', {}).get('name', 'Unnamed')}",
        f"- Updated: {now()}",
        f"- Git branch: {git_value(['branch', '--show-current'])}",
        f"- Git commit: {git_value(['rev-parse', '--short', 'HEAD'])}",
        f"- Working tree: {'dirty' if git_value(['status', '--porcelain']) else 'clean'}",
        f"- Model: {config.get('model', {}).get('name')} / {config.get('model', {}).get('effort')}",
        "",
        "## Active",
    ]
    lines += [f"- {t['id']}: {t['title']}" for t in active] or ["- none"]
    lines += ["", "## Ready"]
    lines += [f"- {t['id']}: {t['title']}" for t in ready[:8]] or ["- none"]
    lines += ["", "## Blocked"]
    lines += [f"- {t['id']}: {t['title']} — {t.get('block_reason', 'reason not recorded')}" for t in blocked] or ["- none"]
    lines += ["", "## Recently completed"]
    lines += [f"- {t['id']}: {t['title']}" for t in completed] or ["- none"]
    lines += ["", "## Latest binding decisions"]
    if decisions:
        for e in decisions:
            lines.append(f"- {e.get('summary')} [{e.get('id', 'unidentified')}]")
    else:
        lines.append("- none recorded")
    lines += [
        "",
        "## Resume",
        "1. `python scripts/loom.py validate`",
        "2. `python scripts/loom.py next`",
        "3. `python scripts/loom.py pack <task-id>`",
        "4. execute the active pack; do not reconstruct history from chat",
    ]
    text = "\n".join(lines) + "\n"

    target = int(config.get("context", {}).get("state_token_target", 1800))
    if estimate_tokens(text) > target:
        text = "\n".join(lines[:40]) + "\n\n[State shortened to configured token target]\n"
    if write:
        STATE_PATH.write_text(text, encoding="utf-8")
    return text

def build_pack(task_id: str, mode: str, budget: int | None) -> tuple[Path, int]:
    config = read_json(CONFIG_PATH)
    work = read_json(WORK_PATH)
    ledger = load_ledger()
    by_id = tasks_by_id(work)
    task = by_id.get(task_id)
    if not task:
        raise SystemExit(f"Unknown task: {task_id}")

    defaults = config.get("context", {})
    if budget is None:
        budget = int(defaults.get(f"{mode}_pack_budget", defaults.get("standard_pack_budget", 9000)))

    dependents = [
        t for t in work.get("tasks", []) if task_id in t.get("depends_on", [])
    ]
    deps = [by_id[d] for d in task.get("depends_on", []) if d in by_id]
    affects = {task_id, *task.get("depends_on", [])}
    relevant_ledger = [
        e for e in ledger
        if not e.get("valid_to")
        and (
            not e.get("affects")
            or bool(affects.intersection(set(e.get("affects", []))))
        )
    ][-12:]

    sections: list[tuple[int, str, str]] = [
        (100, "CURRENT STATE", build_state(False)),
        (100, "ACTIVE TASK", json.dumps(task, indent=2, ensure_ascii=False)),
        (85, "DIRECT DEPENDENCIES", json.dumps(deps, indent=2, ensure_ascii=False)),
        (70, "DIRECT DEPENDENTS", json.dumps(dependents, indent=2, ensure_ascii=False)),
        (90, "ACTIVE DECISIONS AND EPISODES", json.dumps(relevant_ledger, indent=2, ensure_ascii=False)),
    ]
    for ref in task.get("authority", []):
        sections.append((95, f"AUTHORITY — {ref}", extract_markdown_section(ref)))

    sections.sort(key=lambda x: -x[0])
    used = 0
    chunks = [
        f"# Context Pack — {task_id}",
        "",
        f"- Mode: {mode}",
        f"- Generated: {now()}",
        f"- Budget: {budget} estimated tokens",
        "",
    ]
    included = []
    for priority, title, body in sections:
        piece = f"## {title}\n\n{body.strip()}\n\n"
        cost = estimate_tokens(piece)
        if used + cost <= budget:
            chunks.append(piece)
            used += cost
            included.append(title)
        else:
            remaining = max(0, (budget - used) * 4)
            if remaining > 600:
                chunks.append(piece[:remaining] + "\n\n[truncated by context budget]\n")
                used = budget
                included.append(title + " (truncated)")
            break

    PACKS.mkdir(parents=True, exist_ok=True)
    md = PACKS / f"{task_id}.{mode}.md"
    meta = PACKS / f"{task_id}.{mode}.json"
    md.write_text("\n".join(chunks), encoding="utf-8")
    write_json(meta, {
        "task_id": task_id,
        "mode": mode,
        "budget": budget,
        "estimated_tokens": used,
        "included_sections": included,
        "generated_at": now(),
        "pack": str(md.relative_to(ROOT))
    })
    return md, used

def set_status(task_id: str, status: str, reason: str | None = None) -> None:
    work = read_json(WORK_PATH)
    by_id = tasks_by_id(work)
    if task_id not in by_id:
        raise SystemExit(f"Unknown task: {task_id}")
    task = by_id[task_id]
    if status == "active":
        for other in work.get("tasks", []):
            if other.get("status") == "active" and other.get("id") != task_id:
                raise SystemExit(f"Another task is already active: {other['id']}")
        deps = task.get("depends_on", [])
        if not all(by_id[d].get("status") == "complete" for d in deps):
            raise SystemExit(f"Dependencies incomplete for {task_id}")
    task["status"] = status
    if reason:
        task["block_reason"] = reason
    elif status != "blocked":
        task.pop("block_reason", None)
    write_json(WORK_PATH, work)
    append_ledger({
        "id": f"{status}-{task_id}-{int(time.time())}",
        "type": "task_status",
        "status": status,
        "summary": f"{task_id} → {status}" + (f": {reason}" if reason else ""),
        "affects": [task_id],
        "source": "scripts/loom.py",
        "confidence": "verified"
    })
    build_state(True)

def run_command(task_id: str, name: str, command: list[str], tail_lines: int) -> int:
    out_dir = ROOT / "artifacts" / task_id
    out_dir.mkdir(parents=True, exist_ok=True)
    log = out_dir / f"{name}.log"
    summary_path = out_dir / f"{name}.summary.json"
    start = time.time()
    proc = subprocess.run(
        command, cwd=ROOT, text=True,
        stdout=subprocess.PIPE, stderr=subprocess.STDOUT
    )
    duration = round(time.time() - start, 3)
    output = proc.stdout or ""
    log.write_text(output, encoding="utf-8", errors="replace")
    lines = output.splitlines()
    bounded = lines[-tail_lines:] if proc.returncode else lines[-20:]
    summary = {
        "task_id": task_id,
        "name": name,
        "command": command,
        "exit_code": proc.returncode,
        "duration_seconds": duration,
        "full_log": str(log.relative_to(ROOT)),
        "bounded_tail": bounded,
        "timestamp": now()
    }
    write_json(summary_path, summary)
    print(json.dumps(summary, indent=2))
    return proc.returncode

def main() -> int:
    ap = argparse.ArgumentParser(prog="loom")
    sub = ap.add_subparsers(dest="cmd", required=True)

    sub.add_parser("validate")
    st = sub.add_parser("status")
    st.add_argument("--write", action="store_true")
    sub.add_parser("next")

    pk = sub.add_parser("pack")
    pk.add_argument("task_id")
    pk.add_argument("--mode", choices=["standard", "deep", "review"], default="standard")
    pk.add_argument("--budget", type=int)

    bg = sub.add_parser("begin")
    bg.add_argument("task_id")

    cp = sub.add_parser("complete")
    cp.add_argument("task_id")
    cp.add_argument("--evidence", action="append", default=[])

    bl = sub.add_parser("block")
    bl.add_argument("task_id")
    bl.add_argument("--reason", required=True)

    rc = sub.add_parser("record")
    rc.add_argument("--type", required=True)
    rc.add_argument("--summary", required=True)
    rc.add_argument("--affects", action="append", default=[])
    rc.add_argument("--source", default="human-or-agent")
    rc.add_argument("--confidence", default="reported")
    rc.add_argument("--supersedes")

    rn = sub.add_parser("run")
    rn.add_argument("task_id")
    rn.add_argument("name")
    rn.add_argument("--tail-lines", type=int, default=80)
    rn.add_argument("command", nargs=argparse.REMAINDER)

    sub.add_parser("snapshot")

    args = ap.parse_args()

    if args.cmd == "validate":
        errors = validate()
        if errors:
            print("\n".join(f"ERROR: {e}" for e in errors))
            return 2
        print("Project Loom validation: PASS")
        return 0

    if args.cmd == "status":
        print(build_state(args.write), end="")
        return 0

    if args.cmd == "next":
        work = read_json(WORK_PATH)
        items = ready_tasks(work)
        print(json.dumps([
            {
                "id": t["id"],
                "title": t["title"],
                "type": t.get("type"),
                "human_checkpoint": t.get("human_checkpoint", False),
                "depends_on": t.get("depends_on", [])
            } for t in items
        ], indent=2))
        return 0

    if args.cmd == "pack":
        path, tokens = build_pack(args.task_id, args.mode, args.budget)
        print(json.dumps({
            "task_id": args.task_id,
            "pack": str(path.relative_to(ROOT)),
            "estimated_tokens": tokens
        }, indent=2))
        return 0

    if args.cmd == "begin":
        set_status(args.task_id, "active")
        print(f"Began {args.task_id}")
        return 0

    if args.cmd == "block":
        set_status(args.task_id, "blocked", args.reason)
        print(f"Blocked {args.task_id}")
        return 0

    if args.cmd == "complete":
        missing = [p for p in args.evidence if not (ROOT / p).exists()]
        if missing:
            raise SystemExit(f"Missing evidence paths: {missing}")
        work = read_json(WORK_PATH)
        task = tasks_by_id(work).get(args.task_id)
        if not task:
            raise SystemExit(f"Unknown task: {args.task_id}")
        missing_deliverables = [
            p for p in task.get("deliverables", [])
            if not (ROOT / p).exists()
        ]
        if missing_deliverables:
            raise SystemExit(f"Missing deliverables: {missing_deliverables}")
        task["evidence"] = sorted(set(task.get("evidence", []) + args.evidence))
        write_json(WORK_PATH, work)
        set_status(args.task_id, "complete")
        print(f"Completed {args.task_id}")
        return 0

    if args.cmd == "record":
        append_ledger({
            "id": f"{args.type}-{int(time.time())}",
            "type": args.type,
            "status": "active",
            "summary": args.summary,
            "affects": args.affects,
            "source": args.source,
            "confidence": args.confidence,
            "supersedes": args.supersedes,
            "valid_from": now(),
            "valid_to": None
        })
        build_state(True)
        print("Recorded")
        return 0

    if args.cmd == "run":
        command = args.command
        if command and command[0] == "--":
            command = command[1:]
        if not command:
            raise SystemExit("No command supplied after --")
        return run_command(args.task_id, args.name, command, args.tail_lines)

    if args.cmd == "snapshot":
        stamp = dt.datetime.now().strftime("%Y%m%d-%H%M%S")
        dest = SNAPSHOTS / stamp
        dest.mkdir(parents=True, exist_ok=False)
        for p in (CONFIG_PATH, WORK_PATH, LEDGER_PATH, STATE_PATH):
            if p.exists():
                shutil.copy2(p, dest / p.name)
        print(dest.relative_to(ROOT))
        return 0

    return 1

if __name__ == "__main__":
    raise SystemExit(main())
