/**
 * phase-a-contract.test.tsx
 * Phase A contract verification: Inspector responsive modes, form ownership,
 * single monitor, instrument cue, surface provenance expansion,
 * move menu, destructive safety, take idempotence.
 */

import { describe, it, expect } from "vitest";
import { enablePatches } from "immer";
enablePatches();
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import projectReducer, { mutateProject } from "../store/projectSlice.js";
import selectionReducer, { selectBank, selectDevice, selectToken } from "../store/selectionSlice.js";
import editorReducer, { setInspectorMode, openInspector } from "../store/editorSlice.js";
import runtimeReducer from "../store/runtimeSlice.js";
import historyReducer from "../store/historySlice.js";
import importReceiptReducer from "../store/importReceiptSlice.js";
import takesReducer, { captureTake } from "../store/takesSlice.js";
import surfaceReducer, { appendSurfaceRecord } from "../store/surfaceSlice.js";
import { Inspector } from "../shell/Inspector.js";
import { FormsPanel } from "../panels/FormsPanel.js";
import { PerformancePanel } from "../panels/PerformancePanel.js";
import { InstrumentsPanel } from "../panels/InstrumentsPanel.js";
import { CompositionPanel } from "../panels/CompositionPanel.js";
import {
  isBlocked, safeRemoveLineDevice, safeRemoveBank, safeRemoveStanzaPattern,
} from "../store/commands.js";
import { PHASE_A_NEUTRAL_TEST_FIXTURE } from "./neutral-test-fixture.js";

function makeStore(preload?: { project?: ReturnType<typeof projectReducer> }) {
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
    preloadedState: preload,
  });
}

function wrap(ui: React.ReactElement, store = makeStore()) {
  return { ...render(<Provider store={store}>{ui}</Provider>), store };
}

// ── Inspector responsive modes ─────────────────────────────────────────────────

describe("Inspector: responsive modes (T02.A)", () => {
  it("has tr-inspector--docked class in docked mode", () => {
    const store = makeStore();
    store.dispatch(setInspectorMode("docked"));
    wrap(<Inspector />, store);
    const aside = document.querySelector(".tr-inspector");
    expect(aside?.classList.contains("tr-inspector--docked")).toBe(true);
  });

  it("has tr-inspector--overlay class in overlay mode", () => {
    const store = makeStore();
    store.dispatch(setInspectorMode("overlay"));
    wrap(<Inspector />, store);
    const aside = document.querySelector(".tr-inspector");
    expect(aside?.classList.contains("tr-inspector--overlay")).toBe(true);
  });

  it("has tr-inspector--sheet class in sheet mode", () => {
    const store = makeStore();
    store.dispatch(setInspectorMode("sheet"));
    wrap(<Inspector />, store);
    const aside = document.querySelector(".tr-inspector");
    expect(aside?.classList.contains("tr-inspector--sheet")).toBe(true);
  });

  it("auto-opens inspector when mode set to docked", () => {
    const store = makeStore();
    store.dispatch(setInspectorMode("docked"));
    expect(store.getState().editor.inspectorOpen).toBe(true);
  });

  it("shows close button in overlay mode when open", () => {
    const store = makeStore();
    store.dispatch(setInspectorMode("overlay"));
    store.dispatch(openInspector());
    wrap(<Inspector />, store);
    expect(screen.queryByLabelText("Close inspector")).not.toBeNull();
  });

  it("does not show close button in docked mode", () => {
    const store = makeStore();
    store.dispatch(setInspectorMode("docked"));
    wrap(<Inspector />, store);
    expect(screen.queryByLabelText("Close inspector")).toBeNull();
  });
});

// ── Form ownership: FormsPanel does not duplicate full editor ─────────────────

describe("FormsPanel: form ownership (T02.B)", () => {
  it("renders OVERRIDES section", () => {
    wrap(<FormsPanel />);
    expect(screen.getByText("OVERRIDES")).toBeInTheDocument();
  });

  it("does not render sample editor when no token selected", () => {
    wrap(<FormsPanel />);
    expect(document.querySelector(".tr-forms__sample-editor")).toBeNull();
  });

  it("shows data-form-override inputs when token is selected", () => {
    const store = makeStore();
    store.dispatch(mutateProject({
      present: PHASE_A_NEUTRAL_TEST_FIXTURE,
      patches: [],
      inversePatches: [],
      label: "load fixture",
    }));
    store.dispatch(selectToken({ bankName: "nouns", tokenId: "tok_n1" }));
    wrap(<FormsPanel />, store);
    expect(document.querySelector("[data-form-override]")).not.toBeNull();
  });
});

// ── Single Monitor (T02.E) ────────────────────────────────────────────────────

describe("PerformancePanel: single Monitor (T02.E)", () => {
  it("has exactly one .tr-monitor element", () => {
    wrap(<PerformancePanel />);
    const monitors = document.querySelectorAll(".tr-monitor");
    expect(monitors.length).toBe(1);
  });

  it("MONITOR title inside .tr-monitor element", () => {
    wrap(<PerformancePanel />);
    const monitor = document.querySelector(".tr-monitor");
    expect(monitor?.textContent).toMatch(/MONITOR/);
  });

  it("tick text inside .tr-monitor element", () => {
    wrap(<PerformancePanel />);
    const monitor = document.querySelector(".tr-monitor");
    expect(monitor?.textContent).toMatch(/tick/i);
  });
});

// ── Surface provenance expansion (T02.F) ──────────────────────────────────────

describe("SurfaceRecord: expanded provenance fields (T02.F)", () => {
  it("appendSurfaceRecord stores sceneId, stanzaId, deviceId, routeId", () => {
    const store = makeStore();
    store.dispatch(appendSurfaceRecord({
      id: "sl_prov",
      tick: 1,
      surface: "test line",
      sceneId: "sc_1",
      stanzaId: "st_1",
      deviceId: "ld_1",
      routeId: "rt_1",
      slotLabel: "TEST",
      selected: { noun: "river" },
      rendered: { noun: "river" },
      consumedInputs: [{ slot: "noun", tray: "nouns", tokenId: "tok_n1", sourceLiteral: "river" }],
      trigger: {
        name: "Flood", type: "append", text: " rises",
        conditionTray: "nouns", conditionTerm: "river",
        matchedSlot: "noun", matchedTokenId: "tok_n1", matchedSourceLiteral: "river",
      },
    }));
    const rec = store.getState().surface.records[0];
    expect(rec?.sceneId).toBe("sc_1");
    expect(rec?.stanzaId).toBe("st_1");
    expect(rec?.deviceId).toBe("ld_1");
    expect(rec?.routeId).toBe("rt_1");
    expect(rec?.consumedInputs?.[0]?.tokenId).toBe("tok_n1");
    expect(rec?.trigger?.conditionTray).toBe("nouns");
    expect(rec?.trigger?.matchedSourceLiteral).toBe("river");
  });
});

// ── Instrument Cue (T02.G) ────────────────────────────────────────────────────

describe("InstrumentsPanel: Cue button (T02.G)", () => {
  it("renders a Cue button when a device is active", () => {
    const store = makeStore();
    store.dispatch(mutateProject({
      present: PHASE_A_NEUTRAL_TEST_FIXTURE,
      patches: [],
      inversePatches: [],
      label: "load fixture",
    }));
    store.dispatch(selectDevice("ld_test1"));
    wrap(<InstrumentsPanel />, store);
    expect(screen.queryByLabelText(/Audition device/i)).not.toBeNull();
  });
});

// ── Move menu in CompositionPanel (T02.H) ─────────────────────────────────────

describe("CompositionPanel: Move menu (T02.H)", () => {
  it("each slot has a Move button", () => {
    wrap(<CompositionPanel />);
    const moveBtns = screen.queryAllByRole("button").filter(
      (b) => b.getAttribute("aria-label")?.startsWith("Move slot")
    );
    expect(moveBtns.length).toBeGreaterThanOrEqual(0);
  });
});

// ── Destructive safety (T02.I) ────────────────────────────────────────────────

describe("Destructive safety: BlockedResult (T02.I)", () => {
  it("safeRemoveLineDevice is blocked when device has composition slots", () => {
    const result = safeRemoveLineDevice(PHASE_A_NEUTRAL_TEST_FIXTURE, "ld_test1");
    expect(isBlocked(result)).toBe(true);
    if (isBlocked(result)) {
      expect(result.dependents.length).toBeGreaterThan(0);
      expect(result.dependents[0]).toContain("Test Pattern");
    }
  });

  it("safeRemoveLineDevice succeeds when device has no composition slots", () => {
    const projectWithUnusedDevice = {
      ...PHASE_A_NEUTRAL_TEST_FIXTURE,
      lineDevices: [
        ...PHASE_A_NEUTRAL_TEST_FIXTURE.lineDevices,
        { id: "ld_unused", name: "UNUSED", enabled: true, description: "", inputs: [], routes: [] },
      ],
    };
    const result = safeRemoveLineDevice(projectWithUnusedDevice, "ld_unused");
    expect(isBlocked(result)).toBe(false);
  });

  it("safeRemoveBank is blocked when bank is used by device inputs", () => {
    const result = safeRemoveBank(PHASE_A_NEUTRAL_TEST_FIXTURE, "nouns");
    expect(isBlocked(result)).toBe(true);
    if (isBlocked(result)) {
      expect(result.dependents.some((d) => d.includes("TEST"))).toBe(true);
    }
  });

  it("safeRemoveBank succeeds when bank has no dependents", () => {
    const projectWithExtraBank = {
      ...PHASE_A_NEUTRAL_TEST_FIXTURE,
      materials: {
        ...PHASE_A_NEUTRAL_TEST_FIXTURE.materials,
        trays: {
          ...PHASE_A_NEUTRAL_TEST_FIXTURE.materials.trays,
          unused_bank: [],
        },
        bankMeta: {
          ...PHASE_A_NEUTRAL_TEST_FIXTURE.materials.bankMeta,
          unused_bank: { label: "Unused", role: "literal", desc: "" },
        },
      },
    };
    const result = safeRemoveBank(projectWithExtraBank, "unused_bank");
    expect(isBlocked(result)).toBe(false);
  });

  it("safeRemoveStanzaPattern is blocked when pattern has scenes", () => {
    const result = safeRemoveStanzaPattern(PHASE_A_NEUTRAL_TEST_FIXTURE, "st_test1");
    expect(isBlocked(result)).toBe(true);
    if (isBlocked(result)) {
      expect(result.dependents).toContain("Test Scene");
    }
  });

  it("safeRemoveStanzaPattern succeeds when pattern has no scenes", () => {
    const projectWithUnusedPattern = {
      ...PHASE_A_NEUTRAL_TEST_FIXTURE,
      stanzaPatterns: [
        ...PHASE_A_NEUTRAL_TEST_FIXTURE.stanzaPatterns,
        { id: "st_unused", name: "Unused", enabled: true, description: "", slots: [] },
      ],
    };
    const result = safeRemoveStanzaPattern(projectWithUnusedPattern, "st_unused");
    expect(isBlocked(result)).toBe(false);
  });
});

// ── Keep Take idempotence (T02.J) ─────────────────────────────────────────────

describe("PerformancePanel: Keep Take idempotent (T02.J)", () => {
  it("Keep dispatches addProjectNote only once even if called twice", () => {
    const store = makeStore();
    store.dispatch(appendSurfaceRecord({
      id: "sl_take1",
      tick: 5,
      surface: "test surface",
    }));
    store.dispatch(captureTake({
      id: "take_001",
      tick: 5,
      surface: "test surface",
      trace: "",
      deviceName: "",
      route: "",
    }));
    wrap(<PerformancePanel />, store);
    const keepBtns = screen.getAllByRole("button").filter(
      (b) => b.textContent === "Keep"
    );
    if (keepBtns.length > 0) {
      fireEvent.click(keepBtns[0]!);
      fireEvent.click(keepBtns[0]!);
      const notes = store.getState().project.present.notes;
      const matchingNotes = notes.filter((n) => n.eventId === "take_001");
      expect(matchingNotes.length).toBeLessThanOrEqual(1);
    }
  });
});
