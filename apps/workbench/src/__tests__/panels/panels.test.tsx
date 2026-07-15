import { describe, it, expect } from "vitest";
import { enablePatches } from "immer";
enablePatches();
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import projectReducer from "../../store/projectSlice.js";
import selectionReducer, { selectBank, selectDevice, selectTrigger } from "../../store/selectionSlice.js";
import editorReducer from "../../store/editorSlice.js";
import runtimeReducer from "../../store/runtimeSlice.js";
import historyReducer from "../../store/historySlice.js";
import importReceiptReducer from "../../store/importReceiptSlice.js";
import takesReducer from "../../store/takesSlice.js";
import surfaceReducer from "../../store/surfaceSlice.js";
import { MaterialsPanel } from "../../panels/MaterialsPanel.js";
import { InstrumentsPanel } from "../../panels/InstrumentsPanel.js";
import { CompositionPanel } from "../../panels/CompositionPanel.js";
import { AutomationPanel } from "../../panels/AutomationPanel.js";
import { PerformancePanel } from "../../panels/PerformancePanel.js";
import { ArchivePanel } from "../../panels/ArchivePanel.js";

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

function wrap(ui: React.ReactElement, store = makeStore()) {
  return { ...render(<Provider store={store}>{ui}</Provider>), store };
}

// ── MaterialsPanel ─────────────────────────────────────────────────────────────

describe("MaterialsPanel", () => {
  it("renders BANKS section heading", () => {
    wrap(<MaterialsPanel />);
    expect(screen.getByText("BANKS")).toBeInTheDocument();
  });

  it("lists banks from the default project", () => {
    wrap(<MaterialsPanel />);
    // default project has 'above' bank with label defined in TRAY_DEFS
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });

  it("selecting a bank shows its samples", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    expect(screen.getByText(/Wt/)).toBeInTheDocument();
  });

  it("shows add sample input when a bank is selected", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    expect(screen.getByLabelText("New sample literal")).toBeInTheDocument();
  });

  it("add sample button dispatches command", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    const input = screen.getByLabelText("New sample literal");
    fireEvent.change(input, { target: { value: "test-sample" } });
    fireEvent.click(screen.getByText("Add"));
    const trays = store.getState().project.present.materials.trays;
    expect(trays["above"]?.some((t) => t.literal === "test-sample")).toBe(true);
  });
});

// ── InstrumentsPanel ───────────────────────────────────────────────────────────

describe("InstrumentsPanel", () => {
  it("renders DEVICES section heading", () => {
    wrap(<InstrumentsPanel />);
    expect(screen.getByText("DEVICES")).toBeInTheDocument();
  });

  it("lists default devices (PATH, SITE, CAVE)", () => {
    wrap(<InstrumentsPanel />);
    expect(screen.getAllByText("PATH").length).toBeGreaterThan(0);
    expect(screen.getAllByText("SITE").length).toBeGreaterThan(0);
    expect(screen.getAllByText("CAVE").length).toBeGreaterThan(0);
  });

  it("shows routes when device is selected", () => {
    const store = makeStore();
    store.dispatch(selectDevice("ld_path"));
    wrap(<InstrumentsPanel />, store);
    expect(screen.getByText("ROUTES")).toBeInTheDocument();
  });
});

// ── CompositionPanel ───────────────────────────────────────────────────────────

describe("CompositionPanel", () => {
  it("renders PATTERNS section heading", () => {
    wrap(<CompositionPanel />);
    expect(screen.getByText("PATTERNS")).toBeInTheDocument();
  });

  it("lists default stanza pattern", () => {
    wrap(<CompositionPanel />);
    expect(screen.getAllByText("Classic Taroko stanza").length).toBeGreaterThan(0);
  });

  it("shows slots for selected stanza", () => {
    wrap(<CompositionPanel />);
    expect(screen.getByText("SLOTS")).toBeInTheDocument();
  });
});

// ── AutomationPanel ────────────────────────────────────────────────────────────

describe("AutomationPanel", () => {
  it("renders TRIGGERS section heading", () => {
    wrap(<AutomationPanel />);
    expect(screen.getByText("TRIGGERS")).toBeInTheDocument();
  });

  it("shows default trigger", () => {
    wrap(<AutomationPanel />);
    expect(screen.getByText("box intrusion")).toBeInTheDocument();
  });

  it("shows WHEN and THEN labels in trigger", () => {
    wrap(<AutomationPanel />);
    expect(screen.getAllByText("WHEN").length).toBeGreaterThan(0);
    expect(screen.getAllByText("THEN").length).toBeGreaterThan(0);
  });

  it("toggling trigger enabled dispatches command", () => {
    const store = makeStore();
    store.dispatch(selectTrigger("tr_box"));
    wrap(<AutomationPanel />, store);
    const toggleBtn = screen.getByText("ON");
    fireEvent.click(toggleBtn);
    const trigger = store.getState().project.present.triggers.find((t) => t.id === "tr_box");
    expect(trigger?.enabled).toBe(false);
  });
});

// ── PerformancePanel ───────────────────────────────────────────────────────────

describe("PerformancePanel", () => {
  it("renders CUE section heading", () => {
    wrap(<PerformancePanel />);
    expect(screen.getByText("CUE")).toBeInTheDocument();
  });

  it("renders Audition button in Cue section", () => {
    wrap(<PerformancePanel />);
    // Cue has an Audition button (private preview, aria-label "Generate next event")
    expect(screen.getByRole("button", { name: /Generate next event/i })).toBeInTheDocument();
  });

  it("renders SURFACE section heading", () => {
    wrap(<PerformancePanel />);
    expect(screen.getByText("SURFACE")).toBeInTheDocument();
  });

  it("clicking Cue Audition shows a Cue preview (line or breath)", () => {
    wrap(<PerformancePanel />);
    fireEvent.click(screen.getByRole("button", { name: /Generate next event/i }));
    // After Cue audition: Cue section shows either a line preview or a breath marker
    const hasCueLine = screen.queryByText(/tr-cue__line/) !== null
      || document.querySelector(".tr-cue__line") !== null
      || document.querySelector(".tr-cue__breath") !== null
      || screen.queryByText("— breath —") !== null
      || screen.queryByRole("status") !== null
      || !!document.querySelector(".tr-cue__output");
    expect(hasCueLine).toBe(true);
  });

  // REGRESSION: Cue is a private audition — it must never append to Surface history.
  it("REGRESSION: Cue Generate does not append to Surface history", () => {
    wrap(<PerformancePanel />);
    // Surface starts empty
    expect(screen.getByText("Generate events to see surface output.")).toBeInTheDocument();
    // Click Cue Generate multiple times to ensure we get at least one line event
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByRole("button", { name: /Generate next event/i }));
    }
    // Surface MUST still show the empty placeholder — Cue is private audition
    expect(screen.getByText("Generate events to see surface output.")).toBeInTheDocument();
  });

  // REGRESSION: Surface must have its own separate generate/run action.
  it("REGRESSION: Surface has its own generate action separate from Cue", () => {
    wrap(<PerformancePanel />);
    // Surface has a "Generate ▶" button with aria-label distinguishing it from Cue
    const surfaceGenBtn = screen.queryByRole("button", { name: /Surface: generate/i })
      ?? screen.queryByLabelText(/Surface: generate/i);
    expect(surfaceGenBtn).not.toBeNull();
  });
});

// ── ArchivePanel ───────────────────────────────────────────────────────────────

describe("ArchivePanel", () => {
  it("renders EXPORT section heading", () => {
    wrap(<ArchivePanel />);
    expect(screen.getByText("EXPORT")).toBeInTheDocument();
  });

  it("renders JSON export button", () => {
    wrap(<ArchivePanel />);
    expect(screen.getByText(/Export JSON/)).toBeInTheDocument();
  });

  it("renders HTML export button", () => {
    wrap(<ArchivePanel />);
    expect(screen.getByText(/Export HTML/)).toBeInTheDocument();
  });

  it("renders import button", () => {
    wrap(<ArchivePanel />);
    expect(screen.getByText(/Import/)).toBeInTheDocument();
  });

  it("shows project info table", () => {
    wrap(<ArchivePanel />);
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Grave sample")).toBeInTheDocument();
  });

  it("shows role=alert error message when a malformed file is imported", async () => {
    wrap(<ArchivePanel />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    const badFile = new File(["{ not valid json }"], "bad.taroke.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [badFile] } });
    // Allow onload to fire asynchronously
    await new Promise((r) => setTimeout(r, 100));
    const alert = screen.queryByRole("alert");
    expect(alert).not.toBeNull();
    expect(alert?.textContent).toMatch(/could not|error|invalid|failed/i);
  });
});

// ── Takes (store-backed) ───────────────────────────────────────────────────────

import { captureTake } from "../../store/takesSlice.js";

describe("PerformancePanel — store-backed Takes", () => {
  it("renders takes from Redux store, not local state", () => {
    const store = makeStore();
    store.dispatch(captureTake({
      id: "take_test_1",
      tick: 5,
      surface: "river stirs the branch",
      trace: "PATH:plural",
      deviceName: "PATH",
      route: "plural",
    }));
    wrap(<PerformancePanel />, store);
    expect(screen.getByText("river stirs the branch")).toBeInTheDocument();
  });

  it("Capture Take button dispatches to Redux takes slice", () => {
    const store = makeStore();
    wrap(<PerformancePanel />, store);
    // Generate first so there is a current event
    const generateBtn = screen.getByRole("button", { name: /generate next event/i });
    fireEvent.click(generateBtn);
    // Capture Take may appear if last event was a line (not a breath)
    const captureBtn = screen.queryByRole("button", { name: /capture take/i });
    if (captureBtn) {
      fireEvent.click(captureBtn);
      expect(store.getState().takes.takes.length).toBeGreaterThan(0);
    }
  });
});

// ── ImportReceiptBanner ────────────────────────────────────────────────────────

import { ImportReceiptBanner } from "../../panels/ImportReceiptBanner.js";
import { showReceipt } from "../../store/importReceiptSlice.js";

describe("ImportReceiptBanner", () => {
  it("does not render when receipt is not visible", () => {
    const { container } = wrap(<ImportReceiptBanner />);
    expect(container.querySelector(".tr-import-receipt")).toBeNull();
  });

  it("renders filename and repair count when visible", () => {
    const store = makeStore();
    store.dispatch(showReceipt({
      filename: "my-poem.taroke.json",
      issues: [],
      repairCount: 2,
    }));
    wrap(<ImportReceiptBanner />, store);
    expect(screen.getByText(/my-poem\.taroke\.json/)).toBeInTheDocument();
    expect(screen.getByText(/2 repair/)).toBeInTheDocument();
  });

  it("dismiss button hides the banner", () => {
    const store = makeStore();
    store.dispatch(showReceipt({ filename: "test.taroke.json", issues: [], repairCount: 0 }));
    wrap(<ImportReceiptBanner />, store);
    const dismiss = screen.getByRole("button", { name: /dismiss import receipt/i });
    fireEvent.click(dismiss);
    expect(store.getState().importReceipt.visible).toBe(false);
  });
});

// ── MaterialsPanel — accessible reorder ───────────────────────────────────────

describe("MaterialsPanel — accessible reorder", () => {
  it("renders Up/Down buttons for each token", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    const upButtons = screen.getAllByRole("button", { name: /move .+ up/i });
    expect(upButtons.length).toBeGreaterThan(0);
    const downButtons = screen.getAllByRole("button", { name: /move .+ down/i });
    expect(downButtons.length).toBeGreaterThan(0);
  });

  it("Up button is disabled for the first token", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    const upButtons = screen.getAllByRole("button", { name: /move .+ up/i });
    expect(upButtons[0]).toBeDisabled();
  });

  it("Down button is disabled for the last token", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    const downButtons = screen.getAllByRole("button", { name: /move .+ down/i });
    expect(downButtons[downButtons.length - 1]).toBeDisabled();
  });
});
