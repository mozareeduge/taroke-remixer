import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { EditorState, EditorPanel } from "./types.js";

const initialState: EditorState = {
  activePanel: "materials",
  sidebarOpen: true,
  inspectorOpen: false,
  previewFresh: false,
  previewHtml: null,
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
    setPreviewHtml(state, action: PayloadAction<string | null>) {
      state.previewHtml = action.payload;
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
  setPreviewHtml,
  markPreviewStale,
} = editorSlice.actions;
export default editorSlice.reducer;
