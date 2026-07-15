import { configureStore } from "@reduxjs/toolkit";
import { enablePatches } from "immer";
import projectReducer from "./projectSlice.js";
// enablePatches() runs at module-body time (after all imports resolve),
// which is before any Redux action is dispatched. This is the single
// authoritative call — commands.ts must not duplicate it.
enablePatches();
import selectionReducer from "./selectionSlice.js";
import editorReducer from "./editorSlice.js";
import runtimeReducer from "./runtimeSlice.js";
import historyReducer from "./historySlice.js";
import importReceiptReducer from "./importReceiptSlice.js";
import surfaceReducer from "./surfaceSlice.js";
import takesReducer from "./takesSlice.js";
import { autosaveMiddleware } from "./autosave.js";
import { undoMiddleware } from "./undoMiddleware.js";

export const store = configureStore({
  reducer: {
    project: projectReducer,
    selection: selectionReducer,
    editor: editorReducer,
    runtime: runtimeReducer,
    history: historyReducer,
    importReceipt: importReceiptReducer,
    surface: surfaceReducer,
    takes: takesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // Immer patches are plain arrays — serializable
      serializableCheck: {
        ignoredActionPaths: ["payload.patches", "payload.inversePatches"],
      },
    })
      .prepend(undoMiddleware)
      .concat(autosaveMiddleware),
});

export type AppStore = typeof store;
export type AppDispatch = typeof store.dispatch;
