import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { SelectionState, SelectionTarget } from "./types.js";

const initialState: SelectionState = {
  primary: null,
  secondary: null,
};

const selectionSlice = createSlice({
  name: "selection",
  initialState,
  reducers: {
    selectPrimary(state, action: PayloadAction<SelectionTarget>) {
      state.primary = action.payload;
      state.secondary = null;
    },
    selectSecondary(state, action: PayloadAction<SelectionTarget>) {
      state.secondary = action.payload;
    },
    clearSelection(state) {
      state.primary = null;
      state.secondary = null;
    },
    selectBank(state, action: PayloadAction<string>) {
      state.primary = { type: "bank", bankName: action.payload };
      state.secondary = null;
    },
    selectToken(state, action: PayloadAction<{ bankName: string; tokenId: string }>) {
      state.primary = { type: "token", bankName: action.payload.bankName, tokenId: action.payload.tokenId };
    },
    selectDevice(state, action: PayloadAction<string>) {
      state.primary = { type: "device", deviceId: action.payload };
      state.secondary = null;
    },
    selectRoute(state, action: PayloadAction<{ deviceId: string; routeId: string }>) {
      state.primary = { type: "route", deviceId: action.payload.deviceId, routeId: action.payload.routeId };
    },
    selectStanza(state, action: PayloadAction<string>) {
      state.primary = { type: "stanza", stanzaId: action.payload };
      state.secondary = null;
    },
    selectScene(state, action: PayloadAction<string>) {
      state.primary = { type: "scene", sceneId: action.payload };
      state.secondary = null;
    },
    selectTrigger(state, action: PayloadAction<string>) {
      state.primary = { type: "trigger", triggerId: action.payload };
      state.secondary = null;
    },
  },
});

export const {
  selectPrimary,
  selectSecondary,
  clearSelection,
  selectBank,
  selectToken,
  selectDevice,
  selectRoute,
  selectStanza,
  selectScene,
  selectTrigger,
} = selectionSlice.actions;
export default selectionSlice.reducer;
