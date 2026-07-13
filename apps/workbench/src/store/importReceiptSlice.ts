import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { ValidationIssue } from "@taroke/schema";
import type { ImportReceiptState } from "./types.js";

const initialState: ImportReceiptState = {
  visible: false,
  filename: null,
  timestamp: null,
  issues: [],
  repairCount: 0,
};

export interface ImportReceiptPayload {
  filename: string | null;
  issues: ValidationIssue[];
  repairCount: number;
}

const importReceiptSlice = createSlice({
  name: "importReceipt",
  initialState,
  reducers: {
    showReceipt(state, action: PayloadAction<ImportReceiptPayload>) {
      state.visible = true;
      state.filename = action.payload.filename;
      state.timestamp = new Date().toISOString();
      state.issues = action.payload.issues;
      state.repairCount = action.payload.repairCount;
    },
    dismissReceipt(state) {
      state.visible = false;
    },
    clearReceipt(state) {
      state.visible = false;
      state.filename = null;
      state.timestamp = null;
      state.issues = [];
      state.repairCount = 0;
    },
  },
});

export const { showReceipt, dismissReceipt, clearReceipt } = importReceiptSlice.actions;
export default importReceiptSlice.reducer;
