import type { Middleware } from "@reduxjs/toolkit";
import type { RootState } from "./types.js";
import { mutateProject, setProject } from "./projectSlice.js";
import { setActivePanel } from "./editorSlice.js";
import { clearSelection, restoreForPanel } from "./selectionSlice.js";
import { selectionAllowedInPanel, validateSelection } from "./selectionRules.js";

/**
 * Enforces the selection invariants from 06_SELECTION_INSPECTOR_AND_ACTION_CONTRACTS.md:
 *
 * 1. A chamber may never display a selection it does not own (SEL-01).
 * 2. After any project mutation, an invalid selection is cleared rather
 *    than left dangling on a deleted/moved object (SEL-04).
 * 3. Switching chambers restores that chamber's own last valid selection,
 *    re-resolved against the current project, or falls back to none (SEL-06).
 *
 * Runs after the reducer for the action has already applied, so
 * `api.getState()` reflects the post-mutation project/selection.
 */
export const selectionIntegrityMiddleware: Middleware<object, RootState> =
  (api) => (next) => (action) => {
    const result = next(action);
    const state = api.getState();

    if (setActivePanel.match(action)) {
      const panel = state.editor.activePanel;
      const current = state.selection.primary;

      if (current !== null && selectionAllowedInPanel(current, panel)) {
        if (!validateSelection(state.project.present, current)) {
          api.dispatch(clearSelection());
        }
        return result;
      }

      const remembered = state.selection.lastValidByPanel[panel] ?? null;
      if (
        remembered !== null &&
        selectionAllowedInPanel(remembered, panel) &&
        validateSelection(state.project.present, remembered)
      ) {
        api.dispatch(restoreForPanel({ panel, target: remembered }));
      } else if (current !== null) {
        api.dispatch(clearSelection());
      }
      return result;
    }

    if (mutateProject.match(action) || setProject.match(action)) {
      const current = state.selection.primary;
      if (current !== null && !validateSelection(state.project.present, current)) {
        api.dispatch(clearSelection());
      }
      return result;
    }

    return result;
  };
