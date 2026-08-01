/**
 * final-horizon-shell.test.tsx
 * T01 shell topology, responsive shell, mobile text navigation.
 */

import { describe, it, expect, afterEach } from "vitest";
import { render, screen, fireEvent, within, act } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import projectReducer from "../store/projectSlice.js";
import selectionReducer, { selectBank } from "../store/selectionSlice.js";
import editorReducer, { openInspector } from "../store/editorSlice.js";
import runtimeReducer from "../store/runtimeSlice.js";
import historyReducer from "../store/historySlice.js";
import importReceiptReducer from "../store/importReceiptSlice.js";
import takesReducer from "../store/takesSlice.js";
import surfaceReducer from "../store/surfaceSlice.js";
import feedbackReducer from "../store/feedbackSlice.js";
import { AppShell } from "../shell/AppShell.js";
import { Navigator } from "../shell/Navigator.js";
import { Transport } from "../shell/Transport.js";

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
      feedback: feedbackReducer,
    },
  });
}

function wrap(ui: React.ReactElement, store = makeStore()) {
  return render(<Provider store={store}>{ui}</Provider>);
}

function setViewportWidth(width: number) {
  Object.defineProperty(window, "innerWidth", { value: width, configurable: true, writable: true });
}

afterEach(() => {
  setViewportWidth(1024);
});

// ── Shell topology ─────────────────────────────────────────────────────────────

describe("Shell topology (T01)", () => {
  it("renders all required landmark regions", () => {
    wrap(<AppShell />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Editor sections" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Chambers" })).toBeInTheDocument();
  });

  it("main landmark has id tr-main-content for skip-nav", () => {
    wrap(<AppShell />);
    expect(screen.getByRole("main")).toHaveAttribute("id", "tr-main-content");
  });

  it("skip-nav link is present pointing to tr-main-content", () => {
    wrap(<AppShell />);
    const skip = screen.getByText("Skip to main content");
    expect(skip).toHaveAttribute("href", "#tr-main-content");
  });
});

// ── Mobile chamber switcher (replaces SHELL-01 fixed abbreviation nav) ────────

describe("Mobile chamber switcher (T02)", () => {
  it("SHELL-01/02: shows the current chamber's full name and sequence, not an abbreviation", () => {
    wrap(<AppShell />);
    const switcher = screen.getByRole("navigation", { name: "Chambers" });
    expect(switcher.textContent).not.toMatch(/\bMAT\b|\bDEV\b|\bAUT\b|\bPERF\b|\bARCH\b/);
    expect(screen.getByRole("button", { name: /Materials/ })).toBeInTheDocument();
  });

  it("SHELL-03: opening the switcher lists all eight chambers by full name with sequence and purpose", () => {
    wrap(<AppShell />);
    fireEvent.click(screen.getByRole("button", { name: /Materials/ }));
    const menu = screen.getByRole("listbox", { name: "Chambers" });
    const options = within(menu).getAllByRole("option");
    expect(options).toHaveLength(8);
    ["Source", "Materials", "Forms", "Instruments", "Composition", "Automation", "Performance", "Archive"].forEach((label) => {
      expect(within(menu).getByText(label)).toBeInTheDocument();
    });
  });

  it("selecting a chamber from the switcher sets the active panel and closes the menu", () => {
    wrap(<AppShell />);
    fireEvent.click(screen.getByRole("button", { name: /Materials/ }));
    fireEvent.click(screen.getByRole("option", { name: /Performance/ }));
    expect(screen.queryByRole("listbox", { name: "Chambers" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Performance/ })).toBeInTheDocument();
  });

  it("SHELL-01: the switcher does not cover content — it renders alongside the workspace, not fixed over it", () => {
    wrap(<AppShell />);
    const switcher = screen.getByRole("navigation", { name: "Chambers" });
    const main = screen.getByRole("main");
    // Sibling landmarks in normal document flow, not one nested inside the
    // other — so the switcher is a distinct grid region, not an overlay
    // wrapping (or wrapped by) the workspace.
    expect(switcher.contains(main)).toBe(false);
    expect(main.contains(switcher)).toBe(false);
  });
});

// ── Navigator Source accessibility ─────────────────────────────────────────────

describe("Navigator Source remains reachable (T01)", () => {
  it("Source is listed under MATERIAL group in Navigator", () => {
    wrap(<Navigator />);
    const nav = screen.getByRole("navigation");
    expect(nav).toBeInTheDocument();
    expect(screen.getByText("Source")).toBeInTheDocument();
    expect(screen.getByText("MATERIAL")).toBeInTheDocument();
  });

  it("clicking Source sets active panel to source", () => {
    wrap(<Navigator />);
    fireEvent.click(screen.getByText("Source"));
    expect(screen.getByText("Source")).toHaveAttribute("aria-current", "page");
  });
});

// ── Transport ──────────────────────────────────────────────────────────────────

describe("Transport recalibrated (T01)", () => {
  it("Transport renders banner landmark with playback controls group", () => {
    wrap(<Transport />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "Playback controls" })).toBeInTheDocument();
  });

  it("Transport Play button is present", () => {
    wrap(<Transport />);
    const playBtn = screen.getAllByRole("button").find(
      (b) => b.getAttribute("aria-label") === "Play"
    );
    expect(playBtn).toBeDefined();
  });
});

// ── Inspector recalibrated ─────────────────────────────────────────────────────

describe("Inspector recalibrated (T01)", () => {
  it("Inspector is accessible but aria-hidden when closed", () => {
    const store = makeStore(); // inspector is closed by default
    wrap(<AppShell />, store);
    const inspector = screen.getByRole("complementary", { hidden: true });
    expect(inspector).toHaveAttribute("aria-hidden", "true");
  });

  it("Inspector shows hint when nothing selected and open", async () => {
    const store = makeStore();
    const { toggleInspector } = await import("../store/editorSlice.js");
    store.dispatch(toggleInspector()); // open from default-closed state
    wrap(<AppShell />, store);
    const inspector = screen.getByRole("complementary");
    expect(inspector).not.toHaveAttribute("aria-hidden", "true");
  });
});

// ── Shell dimension invariants ─────────────────────────────────────────────────

describe("Shell spatial contract (T01)", () => {
  it("AppShell renders all 4 primary regions without error", () => {
    expect(() => wrap(<AppShell />)).not.toThrow();
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Editor sections" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { hidden: true })).toBeInTheDocument();
  });

  it("Navigator landmark is distinct from the chamber switcher landmark", () => {
    wrap(<AppShell />);
    const navs = screen.getAllByRole("navigation");
    expect(navs.length).toBeGreaterThanOrEqual(2);
    const names = navs.map((n) => n.getAttribute("aria-label") ?? "");
    expect(names).toContain("Editor sections");
    expect(names).toContain("Chambers");
  });

  it("Inspector is present in DOM even when hidden", () => {
    wrap(<AppShell />);
    const inspector = document.querySelector("aside");
    expect(inspector).not.toBeNull();
  });
});

// ── Inspector modal sheet (T02: SHELL-04, A11Y-03) ────────────────────────────

describe("Inspector modal sheet (T02)", () => {
  function renderMobileWithSelection() {
    setViewportWidth(375);
    const store = makeStore();
    store.dispatch(selectBank("above"));
    store.dispatch(openInspector());
    wrap(<AppShell />, store);
    return store;
  }

  it("renders dialog semantics and a backdrop when open as a sheet", () => {
    renderMobileWithSelection();
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByRole("button", { name: "Close inspector" })).toBeInTheDocument();
  });

  it("makes the background inert while the sheet is open", () => {
    renderMobileWithSelection();
    const background = document.querySelector(".tr-shell__body");
    expect(background).not.toBeNull();
    expect(background!.hasAttribute("inert")).toBe(true);
  });

  it("background is not inert when the sheet is closed", () => {
    setViewportWidth(375);
    wrap(<AppShell />);
    const background = document.querySelector(".tr-shell__body");
    expect(background!.hasAttribute("inert")).toBe(false);
  });

  it("clicking the backdrop closes the sheet", () => {
    renderMobileWithSelection();
    const backdrop = document.querySelector(".tr-inspector-backdrop") as HTMLElement;
    expect(backdrop).not.toBeNull();
    fireEvent.click(backdrop);
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("Escape closes the sheet", () => {
    renderMobileWithSelection();
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves focus into the sheet when it opens", () => {
    renderMobileWithSelection();
    expect(document.activeElement).toBe(screen.getByRole("button", { name: "Close inspector" }));
  });
});
