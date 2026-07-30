import type { TarokeProject } from "@taroke/schema";
import type { EditorPanel, SelectionTarget } from "./types.js";

/**
 * Chamber ownership map (04_SOLUTION_ARCHITECTURE.md §1). Every selection
 * target belongs to exactly one chamber; a chamber may never display a
 * selection it does not own.
 */
export function selectionOwner(target: SelectionTarget): EditorPanel | null {
  if (!target) return null;
  switch (target.type) {
    case "bank":
    case "token":
      return "materials";
    case "device":
    case "route":
      return "instruments";
    case "stanza":
    case "scene":
      return "composition";
    case "trigger":
      return "automation";
    case "note":
      return "archive";
    default:
      return null;
  }
}

/** True when `target` (including null) is a selection the given panel may show. */
export function selectionAllowedInPanel(target: SelectionTarget, panel: EditorPanel): boolean {
  if (target === null) return true;
  if (selectionOwner(target) === panel) return true;
  // Forms consumes Materials' bank/token context without owning it — the
  // main Forms editor still owns form-exception editing (04_SOLUTION_
  // ARCHITECTURE.md §1, SEL-05).
  if (panel === "forms" && (target.type === "bank" || target.type === "token")) return true;
  return false;
}

/** True when `target` still resolves to a live object in `project`. */
export function validateSelection(project: TarokeProject, target: SelectionTarget): boolean {
  if (!target) return true;
  switch (target.type) {
    case "bank":
      return Boolean(project.materials.trays[target.bankName]);
    case "token":
      return Boolean(project.materials.trays[target.bankName]?.some((t) => t.id === target.tokenId));
    case "device":
      return project.lineDevices.some((d) => d.id === target.deviceId);
    case "route": {
      const dev = project.lineDevices.find((d) => d.id === target.deviceId);
      return Boolean(dev?.routes.some((r) => r.id === target.routeId));
    }
    case "stanza":
      return project.stanzaPatterns.some((s) => s.id === target.stanzaId);
    case "scene":
      return project.flowScenes.some((s) => s.id === target.sceneId);
    case "trigger":
      return project.triggers.some((t) => t.id === target.triggerId);
    case "note":
      return project.notes.some((n) => n.id === target.noteId);
    default:
      return false;
  }
}
