import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface SurfaceState {
  lines: string[];
  retention: number;
  followPolicy: boolean;
}

const initialState: SurfaceState = {
  lines: [],
  retention: 28,
  followPolicy: true,
};

const surfaceSlice = createSlice({
  name: "surface",
  initialState,
  reducers: {
    appendSurfaceLine(state, action: PayloadAction<string>) {
      state.lines.push(action.payload);
      if (state.lines.length > state.retention) {
        state.lines = state.lines.slice(-state.retention);
      }
    },
    clearSurface(state) {
      state.lines = [];
    },
    setRetention(state, action: PayloadAction<number>) {
      const n = Math.max(1, action.payload);
      state.retention = n;
      if (state.lines.length > n) {
        state.lines = state.lines.slice(-n);
      }
    },
    setFollowPolicy(state, action: PayloadAction<boolean>) {
      state.followPolicy = action.payload;
    },
  },
});

export const { appendSurfaceLine, clearSurface, setRetention, setFollowPolicy } =
  surfaceSlice.actions;
export default surfaceSlice.reducer;
