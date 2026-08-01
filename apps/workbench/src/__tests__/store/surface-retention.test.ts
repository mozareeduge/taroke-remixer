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
  it("retains exactly 26 records after 30 generates, newest last", () => {
    const store = makeStore();
    const RETENTION = 26;

    // Simulate PerformancePanel useEffect: sync slice retention from project
    store.dispatch(setRetention(RETENTION));
    expect(store.getState().surface.retention).toBe(26);

    for (let i = 0; i < 30; i++) {
      const rec: SurfaceRecord = {
        id: `sl_${i}`,
        tick: i,
        surface: `line ${i}`,
        deviceName: "PATH",
      };
      store.dispatch(appendSurfaceRecord(rec));
    }

    const { records } = store.getState().surface;

    // 1. Exactly 26 records remain
    expect(records.length).toBe(26);

    // 2. The newest record is retained (tick 29)
    const newestRecord = records[records.length - 1];
    expect(newestRecord?.tick).toBe(29);
    expect(newestRecord?.surface).toBe("line 29");
  });

  // DS-PERF-10 reproduction: selectedIndex used to be a raw array index, so
  // once the list was at its retention cap, each new record shifted every
  // existing index down by one and silently re-pointed UNMIX at a different
  // record than the one the user had open. selectedRecordId must stay
  // pinned to the exact record regardless of how much retention trims
  // around it.
  it("selectedRecordId stays pinned to the exact record while generation continues past retention", () => {
    const store = makeStore();
    const RETENTION = 5;
    store.dispatch(setRetention(RETENTION));

    for (let i = 0; i < RETENTION; i++) {
      store.dispatch(appendSurfaceRecord({ id: `sl_${i}`, tick: i, surface: `line ${i}` }));
    }
    expect(store.getState().surface.records.map((r) => r.id)).toEqual(["sl_0", "sl_1", "sl_2", "sl_3", "sl_4"]);

    // User inspects the oldest retained record (index 0 today).
    store.dispatch(selectLine("sl_0"));
    expect(store.getState().surface.selectedRecordId).toBe("sl_0");

    // Two more events arrive; retention trims sl_0 and sl_1 out entirely.
    store.dispatch(appendSurfaceRecord({ id: "sl_5", tick: 5, surface: "line 5" }));
    store.dispatch(appendSurfaceRecord({ id: "sl_6", tick: 6, surface: "line 6" }));
    const { records, selectedRecordId } = store.getState().surface;
    expect(records.map((r) => r.id)).toEqual(["sl_2", "sl_3", "sl_4", "sl_5", "sl_6"]);

    // The id itself is untouched by the reducer — eviction detection and
    // the UNMIX-close/announce side effect live in PerformancePanel, which
    // reacts to the id no longer being present in `records`.
    expect(selectedRecordId).toBe("sl_0");
    expect(records.some((r) => r.id === selectedRecordId)).toBe(false);
  });

  it("selectedRecordId keeps pointing at a record that survives retention trimming", () => {
    const store = makeStore();
    const RETENTION = 5;
    store.dispatch(setRetention(RETENTION));
    for (let i = 0; i < RETENTION; i++) {
      store.dispatch(appendSurfaceRecord({ id: `sl_${i}`, tick: i, surface: `line ${i}` }));
    }
    // Inspect the newest record.
    store.dispatch(selectLine("sl_4"));
    store.dispatch(appendSurfaceRecord({ id: "sl_5", tick: 5, surface: "line 5" }));
    store.dispatch(appendSurfaceRecord({ id: "sl_6", tick: 6, surface: "line 6" }));
    const { records, selectedRecordId } = store.getState().surface;
    // sl_4 is still retained (records are now sl_2..sl_6), so identity holds.
    expect(selectedRecordId).toBe("sl_4");
    expect(records.find((r) => r.id === selectedRecordId)?.surface).toBe("line 4");
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
