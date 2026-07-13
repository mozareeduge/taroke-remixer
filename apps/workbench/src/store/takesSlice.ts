import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface Take {
  id: string;
  tick: number;
  surface: string;
  trace: string;
  deviceName: string;
  route: string;
  capturedAt: string;
}

interface TakesState {
  takes: Take[];
}

const initialState: TakesState = {
  takes: [],
};

const takesSlice = createSlice({
  name: "takes",
  initialState,
  reducers: {
    captureTake(state, action: PayloadAction<Omit<Take, "capturedAt">>) {
      state.takes.push({ ...action.payload, capturedAt: new Date().toISOString() });
    },
    clearTakes(state) {
      state.takes = [];
    },
    removeTake(state, action: PayloadAction<string>) {
      state.takes = state.takes.filter((t) => t.id !== action.payload);
    },
  },
});

export const { captureTake, clearTakes, removeTake } = takesSlice.actions;
export default takesSlice.reducer;
