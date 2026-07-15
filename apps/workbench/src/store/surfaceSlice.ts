import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

export interface SurfaceLine {
  id: string;
  tick: number;
  text: string;
  trace: string;
  sceneId: string | null;
  stanzaId: string | null;
  deviceId: string | null;
  routeId: string | null;
  timestamp: string;
}

export interface SurfaceState {
  lines: SurfaceLine[];
  retention: number;
  followPolicy: "tail" | "manual";
}

const initialState: SurfaceState = {
  lines: [],
  retention: 8,
  followPolicy: "tail",
};

const surfaceSlice = createSlice({
  name: "surface",
  initialState,
  reducers: {
    appendSurfaceLine(state, action: PayloadAction<SurfaceLine>) {
      state.lines.push(action.payload);
      if (state.lines.length > state.retention) {
        state.lines.splice(0, state.lines.length - state.retention);
      }
    },
    clearSurface(state) {
      state.lines = [];
    },
    setRetention(state, action: PayloadAction<number>) {
      state.retention = Math.max(1, action.payload);
    },
    setFollowPolicy(state, action: PayloadAction<"tail" | "manual">) {
      state.followPolicy = action.payload;
    },
  },
});

export const { appendSurfaceLine, clearSurface, setRetention, setFollowPolicy } = surfaceSlice.actions;
export default surfaceSlice.reducer;
