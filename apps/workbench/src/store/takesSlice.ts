import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SurfaceLine } from "./surfaceSlice.js";

export interface Take {
  id: string;
  label: string;
  capturedAt: string;
  lines: SurfaceLine[];
  projectTitle: string;
}

export interface TakesState {
  takes: Take[];
  selectedTakeId: string | null;
}

const initialState: TakesState = {
  takes: [],
  selectedTakeId: null,
};

const takesSlice = createSlice({
  name: "takes",
  initialState,
  reducers: {
    captureTake(state, action: PayloadAction<{ id: string; label: string; lines: SurfaceLine[]; projectTitle: string }>) {
      const take: Take = {
        ...action.payload,
        capturedAt: new Date().toISOString(),
      };
      state.takes.push(take);
      state.selectedTakeId = take.id;
    },
    selectTake(state, action: PayloadAction<string>) {
      state.selectedTakeId = action.payload;
    },
    renameTake(state, action: PayloadAction<{ id: string; label: string }>) {
      const t = state.takes.find((t) => t.id === action.payload.id);
      if (t) t.label = action.payload.label;
    },
    deleteTake(state, action: PayloadAction<string>) {
      state.takes = state.takes.filter((t) => t.id !== action.payload);
      if (state.selectedTakeId === action.payload) {
        state.selectedTakeId = state.takes[state.takes.length - 1]?.id ?? null;
      }
    },
    clearTakes(state) {
      state.takes = [];
      state.selectedTakeId = null;
    },
  },
});

export const { captureTake, selectTake, renameTake, deleteTake, clearTakes } = takesSlice.actions;
export default takesSlice.reducer;
