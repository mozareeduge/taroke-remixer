import { createSlice, type PayloadAction, type Draft } from "@reduxjs/toolkit";
import type { EditorPanel, SelectionState, SelectionTarget } from "./types.js";
import { selectionOwner } from "./selectionRules.js";

const initialState: SelectionState = {
  primary: null,
  secondary: null,
  lastValidByPanel: {},
};

// Every user-driven selection is tracked as the "last valid selection" for
// the chamber it belongs to, so switching chambers away and back restores
// it deterministically instead of leaking into an unrelated chamber.
function setPrimaryTracked(state: Draft<SelectionState>, target: SelectionTarget) {
  state.primary = target;
  state.secondary = null;
  const owner = selectionOwner(target);
  if (owner) state.lastValidByPanel[owner] = target;
}

const selectionSlice = createSlice({
  name: "selection",
  initialState,
  reducers: {
    selectPrimary(state, action: PayloadAction<SelectionTarget>) {
      setPrimaryTracked(state, action.payload);
    },
    selectSecondary(state, action: PayloadAction<SelectionTarget>) {
      state.secondary = action.payload;
    },
    clearSelection(state) {
      state.primary = null;
      state.secondary = null;
    },
    // Used only by the selection-integrity middleware to restore a chamber's
    // remembered selection on panel switch, or repair after project mutation.
    // Never updates lastValidByPanel — it is a restoration, not a fresh pick.
    restoreForPanel(state, _action: PayloadAction<{ panel: EditorPanel; target: SelectionTarget }>) {
      state.primary = _action.payload.target;
      state.secondary = null;
    },
    selectBank(state, action: PayloadAction<string>) {
      setPrimaryTracked(state, { type: "bank", bankName: action.payload });
    },
    selectToken(state, action: PayloadAction<{ bankName: string; tokenId: string }>) {
      setPrimaryTracked(state, { type: "token", bankName: action.payload.bankName, tokenId: action.payload.tokenId });
    },
    selectDevice(state, action: PayloadAction<string>) {
      setPrimaryTracked(state, { type: "device", deviceId: action.payload });
    },
    selectRoute(state, action: PayloadAction<{ deviceId: string; routeId: string }>) {
      setPrimaryTracked(state, { type: "route", deviceId: action.payload.deviceId, routeId: action.payload.routeId });
    },
    selectStanza(state, action: PayloadAction<string>) {
      setPrimaryTracked(state, { type: "stanza", stanzaId: action.payload });
    },
    selectScene(state, action: PayloadAction<string>) {
      setPrimaryTracked(state, { type: "scene", sceneId: action.payload });
    },
    selectTrigger(state, action: PayloadAction<string>) {
      setPrimaryTracked(state, { type: "trigger", triggerId: action.payload });
    },
  },
});

export const {
  selectPrimary,
  selectSecondary,
  clearSelection,
  restoreForPanel,
  selectBank,
  selectToken,
  selectDevice,
  selectRoute,
  selectStanza,
  selectScene,
  selectTrigger,
} = selectionSlice.actions;
export default selectionSlice.reducer;
