import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { EditorState, EditorPanel, InspectorMode } from "./types.js";

const initialState: EditorState = {
  activePanel: "materials",
  sidebarOpen: true,
  inspectorOpen: false,
  inspectorMode: "overlay",
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
    openInspector(state) {
      state.inspectorOpen = true;
    },
    closeInspector(state) {
      state.inspectorOpen = false;
    },
    setInspectorMode(state, action: PayloadAction<InspectorMode>) {
      state.inspectorMode = action.payload;
      if (action.payload === "docked") {
        state.inspectorOpen = true;
      }
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
  openInspector,
  closeInspector,
  setInspectorMode,
  setPreviewFresh,
  setPreviewHtml,
  markPreviewStale,
} = editorSlice.actions;
export default editorSlice.reducer;
