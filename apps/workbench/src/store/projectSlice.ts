import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import { defaultProject, migrateProject } from "@taroke/core";
import type { TarokeProject } from "@taroke/schema";
import type { ProjectState } from "./types.js";

const initialState: ProjectState = {
  present: defaultProject(),
  isDirty: false,
  lastSavedAt: null,
};

// ── Slice ─────────────────────────────────────────────────────────────────────

const projectSlice = createSlice({
  name: "project",
  initialState,
  reducers: {
    // Set the whole project (e.g. after import)
    setProject(state, action: PayloadAction<TarokeProject>) {
      state.present = migrateProject(action.payload);
      state.isDirty = true;
    },

    // Mark project as saved
    markSaved(state, action: PayloadAction<string>) {
      state.lastSavedAt = action.payload;
      state.isDirty = false;
    },

    // Apply a pre-computed command result (with patches for undo history).
    // Set skipHistory: true when dispatching from undo/redo to prevent re-entry
    // into the undoMiddleware recording path.
    mutateProject: {
      reducer(
        state,
        action: PayloadAction<{ present: TarokeProject; label: string; patches: unknown[]; inversePatches: unknown[]; skipHistory?: boolean }>,
      ) {
        state.present = action.payload.present;
        state.isDirty = true;
      },
      prepare(payload: { label: string; present: TarokeProject; patches: unknown[]; inversePatches: unknown[]; skipHistory?: boolean }) {
        return { payload };
      },
    },
  },
});

export const { setProject, markSaved, mutateProject } = projectSlice.actions;
export default projectSlice.reducer;
