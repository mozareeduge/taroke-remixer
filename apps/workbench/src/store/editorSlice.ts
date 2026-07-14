import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { EditorState, EditorPanel } from "./types.js";

const initialState: EditorState = {
  activePanel: "materials",
  sidebarOpen: true,
  inspectorOpen: true,
  previewFresh: false,
};

const editorSlice = createSlice({
  name: "editor",
  initialState,
  reducers: {
    setActivePanel(state, action: PayloadAction<EditorPanel>) {
      state.activePanel = action.payload;
    },
    toggleSidebar(state) {
      state.sidebarOpen = !state.sidebarOpen;
    },
    toggleInspector(state) {
      state.inspectorOpen = !state.inspectorOpen;
    },
    setPreviewFresh(state, action: PayloadAction<boolean>) {
      state.previewFresh = action.payload;
    },
    markPreviewStale(state) {
      state.previewFresh = false;
    },
  },
});

export const {
  setActivePanel,
  toggleSidebar,
  toggleInspector,
  setPreviewFresh,
  markPreviewStale,
} = editorSlice.actions;
export default editorSlice.reducer;
