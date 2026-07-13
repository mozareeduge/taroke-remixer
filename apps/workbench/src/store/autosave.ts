import type { Middleware } from "@reduxjs/toolkit";
import type { RootState } from "./types.js";
import { mutateProject, markSaved } from "./projectSlice.js";

const AUTOSAVE_KEY = "taroke_rimixer_v08_autosave";
const AUTOSAVE_DEBOUNCE_MS = 1500;

let debounceTimer: ReturnType<typeof setTimeout> | null = null;

export function saveToLocalStorage(project: RootState["project"]["present"]): void {
  try {
    const payload = JSON.stringify({ project, savedAt: new Date().toISOString() });
    localStorage.setItem(AUTOSAVE_KEY, payload);
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

export function loadFromLocalStorage(): { project: RootState["project"]["present"]; savedAt: string } | null {
  try {
    const raw = localStorage.getItem(AUTOSAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { project: RootState["project"]["present"]; savedAt: string };
  } catch {
    return null;
  }
}

export function clearAutosave(): void {
  try {
    localStorage.removeItem(AUTOSAVE_KEY);
  } catch {
    // ignore
  }
}

export const autosaveMiddleware: Middleware<object, RootState> = (api) => (next) => (action) => {
  const result = next(action);

  if (mutateProject.match(action)) {
    if (debounceTimer !== null) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const state = api.getState();
      saveToLocalStorage(state.project.present);
      api.dispatch(markSaved(new Date().toISOString()));
      debounceTimer = null;
    }, AUTOSAVE_DEBOUNCE_MS);
  }

  return result;
};
