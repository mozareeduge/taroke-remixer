import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { FeedbackState, FeedbackTone } from "./types.js";

const initialState: FeedbackState = {
  current: null,
};

let nextId = 1;

const feedbackSlice = createSlice({
  name: "feedback",
  initialState,
  reducers: {
    announce: {
      reducer(state, action: PayloadAction<{ id: number; tone: FeedbackTone; text: string }>) {
        state.current = action.payload;
      },
      prepare(text: string, tone: FeedbackTone = "success") {
        return { payload: { id: nextId++, tone, text } };
      },
    },
    dismissFeedback(state) {
      state.current = null;
    },
  },
});

export const { announce, dismissFeedback } = feedbackSlice.actions;
export default feedbackSlice.reducer;
