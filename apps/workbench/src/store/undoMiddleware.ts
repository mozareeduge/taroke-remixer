import type { Middleware } from "@reduxjs/toolkit";
import { applyPatches } from "immer";
import type { RootState } from "./types.js";
import { mutateProject } from "./projectSlice.js";
import { pushEntry, popForUndo, popForRedo } from "./historySlice.js";
import { markPreviewStale } from "./editorSlice.js";

// Commands that should NOT be coalesced (per architecture spec):
// import, delete, bulk merge, route replacement are already distinct actions.
// Coalesce typing and numeric scrubbing only.
const COALESCING_LABELS = new Set(["Edit sample", "Set title", "Set author", "Edit route template", "Set statement", "Set credits"]);
const COALESCE_WINDOW_MS = 800;

let lastLabel = "";
let lastTimestamp = 0;

export const undoMiddleware: Middleware<object, RootState> = (api) => (next) => (action) => {
  if (mutateProject.match(action)) {
    const { present, label, patches, inversePatches } = action.payload as {
      present: ReturnType<typeof api.getState>["project"]["present"];
      label: string;
      patches: unknown[];
      inversePatches: unknown[];
    };

    // Coalesce rapid same-label typing commands
    const now = Date.now();
    const shouldCoalesce =
      COALESCING_LABELS.has(label) &&
      label === lastLabel &&
      now - lastTimestamp < COALESCE_WINDOW_MS;

    const result = next(action);

    if (!shouldCoalesce) {
      api.dispatch(
        pushEntry({
          label,
          patches,
          inversePatches,
          timestamp: now,
        }),
      );
    }

    lastLabel = label;
    lastTimestamp = now;
    api.dispatch(markPreviewStale());
    return result;
  }

  if (popForUndo.match(action)) {
    const state = api.getState();
    const entry = state.history.past[state.history.past.length - 1];
    if (!entry) return next(action);

    const reverted = applyPatches(state.project.present, entry.inversePatches as Parameters<typeof applyPatches>[1]);
    const result = next(action);
    api.dispatch(mutateProject({ present: reverted as typeof state.project.present, label: `Undo: ${entry.label}`, patches: [], inversePatches: [] }));
    api.dispatch(markPreviewStale());
    return result;
  }

  if (popForRedo.match(action)) {
    const state = api.getState();
    const entry = state.history.future[0];
    if (!entry) return next(action);

    const reapplied = applyPatches(state.project.present, entry.patches as Parameters<typeof applyPatches>[1]);
    const result = next(action);
    api.dispatch(mutateProject({ present: reapplied as typeof state.project.present, label: `Redo: ${entry.label}`, patches: [], inversePatches: [] }));
    api.dispatch(markPreviewStale());
    return result;
  }

  return next(action);
};
