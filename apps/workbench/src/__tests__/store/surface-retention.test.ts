import { describe, it, expect } from "vitest";
import { configureStore } from "@reduxjs/toolkit";
import projectReducer from "../../store/projectSlice.js";
import selectionReducer from "../../store/selectionSlice.js";
import editorReducer from "../../store/editorSlice.js";
import runtimeReducer from "../../store/runtimeSlice.js";
import historyReducer from "../../store/historySlice.js";
import importReceiptReducer from "../../store/importReceiptSlice.js";
import takesReducer from "../../store/takesSlice.js";
import surfaceReducer, {
  appendSurfaceRecord, setRetention, selectLine,
  type SurfaceRecord,
} from "../../store/surfaceSlice.js";

function makeStore() {
  return configureStore({
    reducer: {
      project: projectReducer,
      selection: selectionReducer,
      editor: editorReducer,
      runtime: runtimeReducer,
      history: historyReducer,
      importReceipt: importReceiptReducer,
      takes: takesReducer,
      surface: surfaceReducer,
    },
  });
}

describe("Surface retention synchronization (canonical project retention = 26)", () => {
  it("retains exactly 26 records after 30 generates, newest last, selectedIndex=25, UNMIX matches newest", () => {
    const store = makeStore();
    const RETENTION = 26;

    // Simulate PerformancePanel useEffect: sync slice retention from project
    store.dispatch(setRetention(RETENTION));
    expect(store.getState().surface.retention).toBe(26);

    // Append 30 records, mirroring the doSurfaceGenerate selectedIndex logic
    for (let i = 0; i < 30; i++) {
      const recordsBefore = store.getState().surface.records;
      const nextIndex = recordsBefore.length >= RETENTION ? RETENTION - 1 : recordsBefore.length;
      const rec: SurfaceRecord = {
        id: `sl_${i}`,
        tick: i,
        surface: `line ${i}`,
        deviceName: "PATH",
      };
      store.dispatch(appendSurfaceRecord(rec));
      store.dispatch(selectLine(nextIndex));
    }

    const { records, selectedIndex } = store.getState().surface;

    // 1. Exactly 26 records remain
    expect(records.length).toBe(26);

    // 2. The newest record is retained (tick 29)
    const newestRecord = records[records.length - 1];
    expect(newestRecord?.tick).toBe(29);
    expect(newestRecord?.surface).toBe("line 29");

    // 3. selectedIndex points to the newest retained record
    expect(selectedIndex).toBe(25);

    // 4. UNMIX corresponds to that newest record
    expect(records[selectedIndex!]?.surface).toBe("line 29");
    expect(records[selectedIndex!]?.tick).toBe(29);
  });

  it("setRetention enforces minimum of 1", () => {
    const store = makeStore();
    store.dispatch(setRetention(0));
    expect(store.getState().surface.retention).toBe(1);
    store.dispatch(setRetention(-5));
    expect(store.getState().surface.retention).toBe(1);
  });

  it("setRetention trims existing records when reduced", () => {
    const store = makeStore();
    store.dispatch(setRetention(5));
    for (let i = 0; i < 5; i++) {
      store.dispatch(appendSurfaceRecord({ id: `sl_${i}`, tick: i, surface: `line ${i}` }));
    }
    expect(store.getState().surface.records.length).toBe(5);
    // Reduce to 3 — trims to the 3 newest
    store.dispatch(setRetention(3));
    const { records } = store.getState().surface;
    expect(records.length).toBe(3);
    expect(records[0]?.tick).toBe(2);
    expect(records[2]?.tick).toBe(4);
  });
});
