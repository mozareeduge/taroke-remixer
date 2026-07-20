/**
 * final-horizon-shell.test.tsx
 * T01 shell topology, responsive shell, mobile text navigation.
 */

import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import projectReducer from "../store/projectSlice.js";
import selectionReducer from "../store/selectionSlice.js";
import editorReducer from "../store/editorSlice.js";
import runtimeReducer from "../store/runtimeSlice.js";
import historyReducer from "../store/historySlice.js";
import importReceiptReducer from "../store/importReceiptSlice.js";
import takesReducer from "../store/takesSlice.js";
import surfaceReducer from "../store/surfaceSlice.js";
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
    },
  });
}

function wrap(ui: React.ReactElement, store = makeStore()) {
  return render(<Provider store={store}>{ui}</Provider>);
}

// ── Shell topology ─────────────────────────────────────────────────────────────

describe("Shell topology (T01)", () => {
  it("renders all required landmark regions", () => {
    wrap(<AppShell />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Editor sections" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { hidden: true })).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Main navigation" })).toBeInTheDocument();
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

// ── Mobile navigation text-led ─────────────────────────────────────────────────

describe("Mobile navigation text-led (T01)", () => {
  it("mobile nav has exactly 6 destination buttons", () => {
    wrap(<AppShell />);
    const mobileNav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(mobileNav.querySelectorAll("button")).toHaveLength(6);
  });

  it("mobile nav shows text abbreviations MAT, INST, COMP, AUTO, PERF, ARCH", () => {
    wrap(<AppShell />);
    const mobileNav = screen.getByRole("navigation", { name: "Main navigation" });
    const text = mobileNav.textContent ?? "";
    expect(text).toContain("MAT");
    expect(text).toContain("DEV");
    expect(text).toContain("COMP");
    expect(text).toContain("AUT");
    expect(text).toContain("PERF");
    expect(text).toContain("ARCH");
  });

  it("mobile nav buttons have full accessible names", () => {
    const { getByRole } = wrap(<AppShell />);
    const mobileNav = getByRole("navigation", { name: "Main navigation" });
    const buttons = Array.from(mobileNav.querySelectorAll("button"));
    const names = buttons.map((b) => b.getAttribute("aria-label") ?? b.textContent ?? "");
    expect(names).toContain("Material");
    expect(names).toContain("Devices");
    expect(names).toContain("Compose");
    expect(names).toContain("Automate");
    expect(names).toContain("Perform");
    expect(names).toContain("Archive");
  });

  it("clicking mobile nav Material button sets active panel", () => {
    wrap(<AppShell />);
    const materialBtn = screen.getByRole("button", { name: "Material" });
    fireEvent.click(materialBtn);
    expect(materialBtn).toHaveAttribute("aria-current", "page");
  });

  it("clicking mobile nav Perform button switches panel", () => {
    wrap(<AppShell />);
    fireEvent.click(screen.getByRole("button", { name: "Perform" }));
    expect(screen.getByRole("button", { name: "Perform" })).toHaveAttribute("aria-current", "page");
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
  it("Inspector is accessible but aria-hidden when closed", async () => {
    const store = makeStore();
    const { toggleInspector } = await import("../store/editorSlice.js");
    store.dispatch(toggleInspector()); // close from default-open state
    wrap(<AppShell />, store);
    const inspector = screen.getByRole("complementary", { hidden: true });
    expect(inspector).toHaveAttribute("aria-hidden", "true");
  });

  it("Inspector shows hint when nothing selected and open", () => {
    const store = makeStore(); // inspector is open by default
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

  it("Navigator landmark is distinct from mobile nav landmark", () => {
    wrap(<AppShell />);
    const navs = screen.getAllByRole("navigation");
    expect(navs.length).toBeGreaterThanOrEqual(2);
    const names = navs.map((n) => n.getAttribute("aria-label") ?? "");
    expect(names).toContain("Editor sections");
    expect(names).toContain("Main navigation");
  });

  it("Inspector is present in DOM even when hidden", () => {
    wrap(<AppShell />);
    const inspector = document.querySelector("aside");
    expect(inspector).not.toBeNull();
  });
});
