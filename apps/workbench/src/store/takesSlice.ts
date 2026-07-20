import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export type TakeState = "captured" | "kept" | "repair" | "pinned";

export interface Take {
  id: string;
  tick: number;
  surface: string;
  trace: string;
  deviceName: string;
  route: string;
  capturedAt: string;
  annotation: string;
  state: TakeState;
  preTrigger?: string;
  triggerText?: string;
}

export interface TakesState {
  takes: Take[];
}

const initialState: TakesState = {
  takes: [],
};

const takesSlice = createSlice({
  name: "takes",
  initialState,
  reducers: {
    captureTake(state, action: PayloadAction<Omit<Take, "capturedAt" | "annotation" | "state">>) {
      state.takes.push({
        ...action.payload,
        capturedAt: new Date().toISOString(),
        annotation: "",
        state: "captured",
      });
    },
    keepTake(state, action: PayloadAction<string>) {
      const take = state.takes.find((t) => t.id === action.payload);
      if (take) take.state = "kept";
    },
    markRepair(state, action: PayloadAction<string>) {
      const take = state.takes.find((t) => t.id === action.payload);
      if (take) take.state = "repair";
    },
    clearRepair(state, action: PayloadAction<string>) {
      const take = state.takes.find((t) => t.id === action.payload);
      if (take) take.state = "kept";
    },
    pinTake(state, action: PayloadAction<string>) {
      const take = state.takes.find((t) => t.id === action.payload);
      if (take) take.state = "pinned";
    },
    unpinTake(state, action: PayloadAction<string>) {
      const take = state.takes.find((t) => t.id === action.payload);
      if (take) take.state = "kept";
    },
    setTakeAnnotation(state, action: PayloadAction<{ id: string; annotation: string }>) {
      const take = state.takes.find((t) => t.id === action.payload.id);
      if (take) take.annotation = action.payload.annotation;
    },
    clearTakes(state) {
      state.takes = [];
    },
    removeTake(state, action: PayloadAction<string>) {
      state.takes = state.takes.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  captureTake,
  keepTake,
  markRepair,
  clearRepair,
  pinTake,
  unpinTake,
  setTakeAnnotation,
  clearTakes,
  removeTake,
} = takesSlice.actions;
export default takesSlice.reducer;
