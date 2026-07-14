import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { HistoryState, HistoryEntry } from "./types.js";

const MAX_HISTORY = 50;

const initialState: HistoryState = {
  past: [],
  future: [],
  canUndo: false,
  canRedo: false,
};

const historySlice = createSlice({
  name: "history",
  initialState,
  reducers: {
    pushEntry(state, action: PayloadAction<HistoryEntry>) {
      state.past.push(action.payload);
      if (state.past.length > MAX_HISTORY) {
        state.past.shift();
      }
      state.future = [];
      state.canUndo = true;
      state.canRedo = false;
    },
    popForUndo(state) {
      const entry = state.past.pop();
      if (entry) {
        state.future.unshift(entry);
      }
      state.canUndo = state.past.length > 0;
      state.canRedo = state.future.length > 0;
    },
    popForRedo(state) {
      const entry = state.future.shift();
      if (entry) {
        state.past.push(entry);
      }
      state.canUndo = state.past.length > 0;
      state.canRedo = state.future.length > 0;
    },
    clearHistory(state) {
      state.past = [];
      state.future = [];
      state.canUndo = false;
      state.canRedo = false;
    },
  },
});

export const { pushEntry, popForUndo, popForRedo, clearHistory } = historySlice.actions;
export default historySlice.reducer;
