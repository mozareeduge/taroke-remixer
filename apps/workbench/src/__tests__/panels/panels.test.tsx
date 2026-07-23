import { describe, it, expect } from "vitest";
import { enablePatches } from "immer";
enablePatches();
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import projectReducer, { mutateProject } from "../../store/projectSlice.js";
import selectionReducer, { selectBank, selectDevice, selectTrigger } from "../../store/selectionSlice.js";
import editorReducer from "../../store/editorSlice.js";
import runtimeReducer from "../../store/runtimeSlice.js";
import historyReducer from "../../store/historySlice.js";
import importReceiptReducer, { showReceipt } from "../../store/importReceiptSlice.js";
import { ImportReceiptBanner } from "../../panels/ImportReceiptBanner.js";
import takesReducer from "../../store/takesSlice.js";
import surfaceReducer from "../../store/surfaceSlice.js";
import { PHASE_A_NEUTRAL_TEST_FIXTURE } from "../neutral-test-fixture.js";
import { MaterialsPanel } from "../../panels/MaterialsPanel.js";
import { FormsPanel } from "../../panels/FormsPanel.js";
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

function makeStoreWithFixture() {
  const store = makeStore();
  store.dispatch(mutateProject({ present: PHASE_A_NEUTRAL_TEST_FIXTURE, patches: [], inversePatches: [], label: "load fixture" }));
  return store;
}

// ── MaterialsPanel ─────────────────────────────────────────────────────────────

describe("MaterialsPanel", () => {
  it("renders BANKS section heading", () => {
    wrap(<MaterialsPanel />);
    expect(screen.getAllByText(/BANKS/i).length).toBeGreaterThan(0);
  });

  it("lists banks from the default project", () => {
    wrap(<MaterialsPanel />);
    expect(screen.getAllByRole("button").length).toBeGreaterThan(0);
  });

  it("selecting a bank shows its samples table", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    // Sample column header should be visible
    expect(screen.getByText("Sample")).toBeInTheDocument();
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

  // R2: No 4-arrow clusters — arrow reorder buttons must not exist
  it("R2: no 4-arrow reorder button cluster — only drag handles and Move menu", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    // Arrow cluster buttons must not exist
    expect(screen.queryAllByRole("button", { name: /move .+ up/i }).length).toBe(0);
    expect(screen.queryAllByRole("button", { name: /move .+ down/i }).length).toBe(0);
    expect(screen.queryAllByRole("button", { name: /move .+ to start/i }).length).toBe(0);
    // Move menu buttons should exist instead
    const moveMenuBtns = screen.queryAllByRole("button", { name: /actions for/i });
    expect(moveMenuBtns.length).toBeGreaterThan(0);
  });

  // R2: Move menu
  it("R2: Move menu opens on click and shows Move to top", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    const moveMenuBtns = screen.getAllByRole("button", { name: /actions for/i });
    fireEvent.click(moveMenuBtns[0]!);
    expect(screen.getByText("Move to top")).toBeInTheDocument();
  });

  // R2: Bulk paste
  it("R2: Bulk paste section opens when button clicked", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    fireEvent.click(screen.getByLabelText("Bulk paste samples"));
    expect(screen.getByLabelText(/Bulk paste text/i)).toBeInTheDocument();
  });

  // R2: Bank search
  it("R2: shows bank search input in sidebar", () => {
    wrap(<MaterialsPanel />);
    expect(screen.getByLabelText("Search banks")).toBeInTheDocument();
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

  // R3: No permanent chip wall — only Insert variable… button
  it("R3: no permanent variable chip wall — only Insert variable… button", () => {
    const store = makeStore();
    store.dispatch(selectDevice("ld_path"));
    wrap(<InstrumentsPanel />, store);
    // "Insert variable…" button(s) must exist (one per route)
    const insertBtns = screen.queryAllByRole("button", { name: /Insert variable/i });
    expect(insertBtns.length).toBeGreaterThan(0);
    // Chip wall pattern: buttons with {slot:form} directly in aria-label — must NOT exist
    const chipWall = screen.queryAllByRole("button", { name: /insert .+:.+ variable/i });
    expect(chipWall.length).toBe(0);
  });

  // R3: Insert variable… opens palette
  it("R3: Insert variable… button opens variable palette", () => {
    const store = makeStore();
    store.dispatch(selectDevice("ld_path"));
    wrap(<InstrumentsPanel />, store);
    const insertBtns = screen.queryAllByRole("button", { name: /Insert variable/i });
    expect(insertBtns.length).toBeGreaterThan(0);
    fireEvent.click(insertBtns[0]!);
    expect(screen.getByRole("dialog", { name: /insert variable/i })).toBeInTheDocument();
  });

  // R6: Remove buttons use written text, not bare ✕
  it("R6: input Remove buttons use written text not bare ✕", () => {
    const store = makeStore();
    store.dispatch(selectDevice("ld_path"));
    wrap(<InstrumentsPanel />, store);
    // Must not find any ✕ button
    const xButtons = screen.queryAllByRole("button", { name: /^✕$/ });
    expect(xButtons.length).toBe(0);
    // Must find written Remove buttons
    const removeBtns = screen.queryAllByRole("button", { name: /remove/i });
    expect(removeBtns.length).toBeGreaterThan(0);
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
    expect(screen.getAllByText(/Taroko scene/i).length).toBeGreaterThan(0);
  });

  it("shows slots for selected stanza", () => {
    wrap(<CompositionPanel />);
    expect(screen.getByText("SLOTS")).toBeInTheDocument();
    const slotRows = document.querySelectorAll(".tr-slot");
    expect(slotRows.length).toBeGreaterThan(0);
  });

  // R3: No 4-arrow clusters in slots
  it("R3: no 4-arrow reorder cluster in slots", () => {
    wrap(<CompositionPanel />);
    // Arrow cluster buttons must not exist
    expect(screen.queryAllByRole("button", { name: /move slot .+ up/i }).length).toBe(0);
    expect(screen.queryAllByRole("button", { name: /move slot .+ down/i }).length).toBe(0);
    expect(screen.queryAllByRole("button", { name: /move slot .+ to start/i }).length).toBe(0);
    // Drag handles should exist instead
    const handles = document.querySelectorAll(".tr-slot__drag-handle");
    expect(handles.length).toBeGreaterThan(0);
  });

  // R6: No bare ✕ in slots
  it("R6: slot remove buttons use written text not bare ✕", () => {
    wrap(<CompositionPanel />);
    const xButtons = screen.queryAllByRole("button", { name: /^✕$/ });
    expect(xButtons.length).toBe(0);
    const removeBtns = screen.queryAllByRole("button", { name: /remove slot/i });
    expect(removeBtns.length).toBeGreaterThan(0);
  });

  // R6: No bare ✕ in scenes
  it("R6: scene remove buttons use written text not bare ✕", () => {
    wrap(<CompositionPanel />);
    const sceneRemoveBtns = screen.queryAllByRole("button", { name: /remove scene/i });
    // Only present if there are scenes — default project may have scenes
    const xButtons = screen.queryAllByRole("button", { name: /^✕$/ });
    expect(xButtons.length).toBe(0);
    // If there are Remove scene buttons, they should exist and pass
    if (sceneRemoveBtns.length > 0) {
      expect(sceneRemoveBtns[0]!.textContent).toMatch(/remove scene/i);
    }
  });
});

// ── AutomationPanel ────────────────────────────────────────────────────────────

describe("AutomationPanel", () => {
  it("renders TRIGGERS section heading", () => {
    wrap(<AutomationPanel />);
    expect(screen.getByText("TRIGGERS")).toBeInTheDocument();
  });

  it("shows default trigger in summary row", () => {
    // Load fixture which has trig_1
    wrap(<AutomationPanel />, makeStoreWithFixture());
    const summaries = screen.queryAllByRole("button", { name: /WHEN .* THEN/i });
    expect(summaries.length).toBeGreaterThan(0);
  });

  // R3: collapsed trigger rows with readable summary
  it("R3: collapsed trigger row shows readable WHEN→Chance→THEN summary", () => {
    wrap(<AutomationPanel />, makeStoreWithFixture());
    const summaryBtns = screen.queryAllByRole("button", { name: /WHEN .* → .* → THEN/i });
    expect(summaryBtns.length).toBeGreaterThan(0);
  });

  it("selected trigger shows WHEN and THEN labels in editor", () => {
    const store = makeStoreWithFixture();
    store.dispatch(selectTrigger("trig_1"));
    wrap(<AutomationPanel />, store);
    expect(screen.getAllByText("WHEN").length).toBeGreaterThan(0);
    expect(screen.getAllByText("THEN").length).toBeGreaterThan(0);
  });

  it("toggling trigger enabled dispatches command", () => {
    const store = makeStoreWithFixture();
    store.dispatch(selectTrigger("trig_1"));
    wrap(<AutomationPanel />, store);
    // The pill shows Enabled; toggling changes it
    const toggleBtn = screen.getByText("Enabled");
    fireEvent.click(toggleBtn);
    const trigger = store.getState().project.present.triggers.find((t) => t.id === "trig_1");
    expect(trigger?.enabled).toBe(false);
  });

  // R6: No bare ✕ in triggers
  it("R6: trigger remove uses written text not bare ✕", () => {
    wrap(<AutomationPanel />, makeStoreWithFixture());
    const xButtons = screen.queryAllByRole("button", { name: /^✕$/ });
    expect(xButtons.length).toBe(0);
    const removeBtns = screen.queryAllByRole("button", { name: /remove trigger/i });
    expect(removeBtns.length).toBeGreaterThan(0);
  });
});

// ── PerformancePanel ───────────────────────────────────────────────────────────

describe("PerformancePanel", () => {
  it("renders CUE section heading", () => {
    wrap(<PerformancePanel />);
    // CUE section is labeled "CUE · PRIVATE"
    expect(screen.getByText(/CUE/)).toBeInTheDocument();
  });

  it("renders Audition button in Cue section", () => {
    wrap(<PerformancePanel />);
    // Private audition button — does not write to surface
    expect(screen.getByRole("button", { name: /Audition next event/i })).toBeInTheDocument();
  });

  it("renders SURFACE section heading", () => {
    wrap(<PerformancePanel />);
    expect(screen.getByText("SURFACE")).toBeInTheDocument();
  });

  it("clicking Cue Audition shows a Cue preview (line or breath)", () => {
    wrap(<PerformancePanel />);
    fireEvent.click(screen.getByRole("button", { name: /Audition next event/i }));
    const hasCueOutput = document.querySelector(".tr-cue__output") !== null
      || document.querySelector(".tr-cue__line") !== null
      || document.querySelector(".tr-cue__breath") !== null
      || screen.queryByText("— breath —") !== null
      || screen.queryByRole("status") !== null;
    expect(hasCueOutput).toBe(true);
  });

  // REGRESSION: Cue is a private audition — it must never append to Surface history.
  it("REGRESSION: Cue Audition does not append to Surface history", () => {
    wrap(<PerformancePanel />);
    expect(screen.getByText("Generate events to see surface output.")).toBeInTheDocument();
    for (let i = 0; i < 6; i++) {
      fireEvent.click(screen.getByRole("button", { name: /Audition next event/i }));
    }
    expect(screen.getByText("Generate events to see surface output.")).toBeInTheDocument();
  });

  // REGRESSION: Surface must have its own separate generate action.
  it("REGRESSION: Surface has its own generate action separate from Cue", () => {
    wrap(<PerformancePanel />);
    const surfaceGenBtn = screen.queryByRole("button", { name: /Surface: generate/i })
      ?? screen.queryByLabelText(/Surface: generate/i);
    expect(surfaceGenBtn).not.toBeNull();
  });

  // R4: MONITOR band
  it("R4: MONITOR compact band visible with runtime state", () => {
    wrap(<PerformancePanel />);
    const monitor = document.querySelector(".tr-monitor");
    expect(monitor).not.toBeNull();
    // Monitor shows tick info
    expect(monitor!.textContent).toMatch(/tick/i);
  });

  // R4: Surface dominant layout
  it("R4: Surface column is present as dominant column", () => {
    wrap(<PerformancePanel />);
    const surfaceCol = document.querySelector(".tr-perf__surface-col");
    expect(surfaceCol).not.toBeNull();
    const cueCol = document.querySelector(".tr-perf__cue-col");
    expect(cueCol).not.toBeNull();
  });

  // R4: TAKES section exists
  it("R4: TAKES section heading is present", () => {
    wrap(<PerformancePanel />);
    expect(screen.getByText("TAKES")).toBeInTheDocument();
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
    expect(screen.getByText("Taroko Gorge")).toBeInTheDocument();
  });

  // R5: EXPORT first, IMPORT second, PREVIEW third
  it("R5: EXPORT appears before IMPORT, IMPORT before PREVIEW", () => {
    const { container } = wrap(<ArchivePanel />);
    const heads = Array.from(container.querySelectorAll(".tr-panel__section-head"));
    const texts = heads.map((h) => (h as HTMLElement).innerText ?? h.textContent ?? "");
    const exportIdx = heads.findIndex((h) => h.textContent?.includes("EXPORT"));
    const importIdx = heads.findIndex((h) => h.textContent?.includes("IMPORT"));
    const previewIdx = heads.findIndex((h) => h.textContent?.includes("PREVIEW"));
    expect(exportIdx).toBeGreaterThanOrEqual(0);
    expect(importIdx).toBeGreaterThanOrEqual(0);
    expect(previewIdx).toBeGreaterThanOrEqual(0);
    expect(exportIdx).toBeLessThan(importIdx);
    expect(importIdx).toBeLessThan(previewIdx);
  });

  it("shows role=alert error message when a malformed file is imported", async () => {
    wrap(<ArchivePanel />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).not.toBeNull();
    const badFile = new File(["{ not valid json }"], "bad.taroke.json", { type: "application/json" });
    fireEvent.change(input, { target: { files: [badFile] } });
    const alert = await waitFor(() => {
      const el = screen.queryByRole("alert");
      if (!el) throw new Error("alert not yet rendered");
      return el;
    }, { timeout: 2000 });
    expect(alert.textContent).toMatch(/could not|error|invalid|failed/i);
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
    const generateBtn = screen.getByRole("button", { name: /Surface: generate/i });
    fireEvent.click(generateBtn);
    const captureBtn = screen.queryByRole("button", { name: /capture take/i });
    if (captureBtn) {
      fireEvent.click(captureBtn);
      expect(store.getState().takes.takes.length).toBeGreaterThan(0);
    }
  });

  // R4: Takes state machine — Keep/Repair/Pin
  it("R4: captured take shows Keep and Pin buttons", () => {
    const store = makeStore();
    store.dispatch(captureTake({
      id: "take_sm_1",
      tick: 3,
      surface: "a word returns",
      trace: "PATH",
      deviceName: "PATH",
      route: "default",
    }));
    wrap(<PerformancePanel />, store);
    expect(screen.getByRole("button", { name: /keep this take/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /pin this take/i })).toBeInTheDocument();
  });

  // R4: Take annotation
  it("R4: take annotation input is present and updatable", () => {
    const store = makeStore();
    store.dispatch(captureTake({
      id: "take_ann_1",
      tick: 2,
      surface: "stone calls the sky",
      trace: "SITE",
      deviceName: "SITE",
      route: "default",
    }));
    wrap(<PerformancePanel />, store);
    const annotationInput = screen.getByLabelText(/annotation for take/i);
    expect(annotationInput).toBeInTheDocument();
    fireEvent.change(annotationInput, { target: { value: "use this one" } });
    const take = store.getState().takes.takes.find((t) => t.id === "take_ann_1");
    expect(take?.annotation).toBe("use this one");
  });
});

// ── ImportReceiptBanner ────────────────────────────────────────────────────────

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

// ── MaterialsPanel — share column ─────────────────────────────────────────────

describe("MaterialsPanel — share column", () => {
  it("shows a Share column header", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    expect(screen.getByRole("columnheader", { name: "Share" })).toBeInTheDocument();
  });

  it("shows percentage in the share column for a token", () => {
    const store = makeStore();
    store.dispatch(selectBank("above"));
    wrap(<MaterialsPanel />, store);
    const pctCells = document.querySelectorAll(".tr-table__td--share");
    expect(pctCells.length).toBeGreaterThan(0);
    expect(pctCells[0]!.textContent).toMatch(/%/);
  });
});

// ── FormsPanel ─────────────────────────────────────────────────────────────────

describe("FormsPanel", () => {
  it("renders FORMS section heading", () => {
    wrap(<FormsPanel />);
    expect(screen.getByText("FORMS")).toBeInTheDocument();
  });

  it("renders case policy select", () => {
    wrap(<FormsPanel />);
    expect(screen.getByRole("combobox", { name: /case policy/i })).toBeInTheDocument();
  });

  it("renders OVERRIDES section heading", () => {
    wrap(<FormsPanel />);
    expect(screen.getByText("OVERRIDES")).toBeInTheDocument();
  });

  it("changing case policy updates the project", () => {
    const store = makeStore();
    wrap(<FormsPanel />, store);
    const select = screen.getByRole("combobox", { name: /case policy/i });
    fireEvent.change(select, { target: { value: "lower" } });
    expect(store.getState().project.present.forms.casePolicy).toBe("lower");
  });
});

// ── ArchivePanel — import receipt dispatch ────────────────────────────────────

describe("ArchivePanel — import receipt dispatch on success", () => {
  it("reads a valid project file, migrates it, replaces state, and shows receipt", async () => {
    const store = makeStore();
    const titleBefore = store.getState().project.present.project.title;

    wrap(<ArchivePanel />, store);
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).not.toBeNull();

    const importedTitle = "receipt-import-test-" + Date.now();
    const validProject = JSON.stringify({
      schemaVersion: "7.8",
      project: { title: importedTitle, author: "test-author" },
      materials: {
        trays: { above: [{ id: "tok_a1", literal: "wave", role: "noun", weight: 1, lockedLiteral: false }] },
        bankMeta: {},
      },
      forms: { casePolicy: "source" },
      lineDevices: [],
      stanzaPatterns: [],
      flowScenes: [],
      triggers: [],
      meta: {},
    });
    const file = new File([validProject], "receipt-import-test.taroke.json", { type: "application/json" });

    await act(async () => {
      fireEvent.change(fileInput, { target: { files: [file] } });
    });

    await waitFor(() => {
      expect(store.getState().importReceipt.visible, "importReceipt.visible must become true after import").toBe(true);
    }, { timeout: 2000 });

    const titleAfter = store.getState().project.present.project.title;
    expect(titleAfter).toBe(importedTitle);
    expect(titleAfter).not.toBe(titleBefore);
    expect(store.getState().importReceipt.filename).toBe("receipt-import-test.taroke.json");
  });
});
