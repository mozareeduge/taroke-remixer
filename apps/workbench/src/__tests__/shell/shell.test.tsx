import { describe, it, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Provider } from "react-redux";
import { configureStore } from "@reduxjs/toolkit";
import projectReducer from "../../store/projectSlice.js";
import selectionReducer from "../../store/selectionSlice.js";
import editorReducer, { toggleSidebar, toggleInspector } from "../../store/editorSlice.js";
import runtimeReducer from "../../store/runtimeSlice.js";
import historyReducer from "../../store/historySlice.js";
import takesReducer from "../../store/takesSlice.js";
import importReceiptReducer from "../../store/importReceiptSlice.js";
import { Transport } from "../../shell/Transport.js";
import { Navigator } from "../../shell/Navigator.js";
import { Workspace } from "../../shell/Workspace.js";
import { Inspector } from "../../shell/Inspector.js";
import { AppShell } from "../../shell/AppShell.js";

function makeStore(editorOverrides?: Partial<{ sidebarOpen: boolean; inspectorOpen: boolean }>) {
  const store = configureStore({
    reducer: {
      project: projectReducer,
      selection: selectionReducer,
      editor: editorReducer,
      runtime: runtimeReducer,
      history: historyReducer,
      importReceipt: importReceiptReducer,
      takes: takesReducer,
    },
  });
  if (editorOverrides?.sidebarOpen === false) store.dispatch(toggleSidebar());
  // inspectorOpen defaults to true; toggle to close when false is requested
  if (editorOverrides?.inspectorOpen === false) store.dispatch(toggleInspector());
  return store;
}

function wrap(ui: React.ReactElement, store = makeStore()) {
  return render(<Provider store={store}>{ui}</Provider>);
}

// ── Transport ──────────────────────────────────────────────────────────────────

describe("Transport", () => {
  it("renders the project title", () => {
    wrap(<Transport />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
  });

  it("shows play button when stopped", () => {
    wrap(<Transport />);
    expect(screen.getByLabelText("Play")).toBeInTheDocument();
  });

  it("shows stop button disabled when stopped", () => {
    wrap(<Transport />);
    const stop = screen.getByLabelText("Stop");
    expect(stop).toBeDisabled();
  });

  it("shows status label STOPPED initially", () => {
    wrap(<Transport />);
    expect(screen.getByText("STOPPED")).toBeInTheDocument();
  });

  it("has inspector toggle button with aria-pressed=true by default", () => {
    wrap(<Transport />);
    const toggle = screen.getByLabelText("Hide inspector");
    expect(toggle).toHaveAttribute("aria-pressed", "true");
  });

  it("inspector toggle dispatches and flips label", () => {
    wrap(<Transport />);
    const toggle = screen.getByLabelText("Hide inspector");
    fireEvent.click(toggle);
    expect(screen.getByLabelText("Show inspector")).toBeInTheDocument();
  });
});

// ── Navigator ──────────────────────────────────────────────────────────────────

describe("Navigator", () => {
  it("renders nav landmark", () => {
    wrap(<Navigator />);
    expect(screen.getByRole("navigation")).toBeInTheDocument();
  });

  it("renders all 6 group headings", () => {
    wrap(<Navigator />);
    ["MATERIAL", "INSTRUMENT", "COMPOSITION", "AUTOMATION", "PERFORMANCE", "ARCHIVE"].forEach(
      (g) => expect(screen.getByText(g)).toBeInTheDocument()
    );
  });

  it("marks Banks & Samples active by default (aria-current=page)", () => {
    wrap(<Navigator />);
    const btn = screen.getByText("Banks & Samples");
    expect(btn).toHaveAttribute("aria-current", "page");
  });

  it("switches active panel on click", () => {
    wrap(<Navigator />);
    const devBtn = screen.getByText("Devices");
    fireEvent.click(devBtn);
    expect(devBtn).toHaveAttribute("aria-current", "page");
    expect(screen.getByText("Banks & Samples")).not.toHaveAttribute("aria-current");
  });
});

// ── Workspace ──────────────────────────────────────────────────────────────────

describe("Workspace", () => {
  it("renders main landmark", () => {
    wrap(<Workspace />);
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});

// ── Inspector ──────────────────────────────────────────────────────────────────

describe("Inspector", () => {
  it("renders complementary landmark always", () => {
    wrap(<Inspector />);
    expect(screen.getByRole("complementary", { hidden: true })).toBeInTheDocument();
  });

  it("is aria-hidden when inspectorOpen=false", () => {
    const store = makeStore({ inspectorOpen: false });
    wrap(<Inspector />, store);
    expect(screen.getByRole("complementary", { hidden: true })).toHaveAttribute("aria-hidden", "true");
  });

  it("is not aria-hidden when inspectorOpen=true", () => {
    const store = makeStore({ inspectorOpen: true });
    wrap(<Inspector />, store);
    expect(screen.getByRole("complementary")).not.toHaveAttribute("aria-hidden", "true");
  });

  it("shows hint text when nothing is selected", () => {
    wrap(<Inspector />);
    expect(screen.getByText("Select an item to inspect")).toBeInTheDocument();
  });
});

// ── AppShell ───────────────────────────────────────────────────────────────────

describe("AppShell", () => {
  it("renders transport, navigator, workspace, inspector", () => {
    wrap(<AppShell />);
    expect(screen.getByRole("banner")).toBeInTheDocument();
    expect(screen.getByRole("navigation", { name: "Editor sections" })).toBeInTheDocument();
    expect(screen.getByRole("main")).toBeInTheDocument();
    expect(screen.getByRole("complementary", { hidden: true })).toBeInTheDocument();
  });

  it("renders mobile nav with 6 destinations", () => {
    wrap(<AppShell />);
    const mobileNav = screen.getByRole("navigation", { name: "Main navigation" });
    expect(mobileNav).toBeInTheDocument();
    expect(mobileNav.querySelectorAll("button")).toHaveLength(6);
  });

  it("inspector is aria-visible when open", () => {
    const store = makeStore({ inspectorOpen: true });
    wrap(<AppShell />, store);
    const inspector = screen.getByRole("complementary");
    expect(inspector).not.toHaveAttribute("aria-hidden", "true");
  });

  it("inspector is aria-hidden when inspectorOpen=false", () => {
    const store = makeStore({ inspectorOpen: false });
    wrap(<AppShell />, store);
    const inspector = screen.getByRole("complementary", { hidden: true });
    expect(inspector).toHaveAttribute("aria-hidden", "true");
  });

  it("skip-nav link is the first link and points to #tr-main-content (a11y WCAG 2.4.1)", () => {
    wrap(<AppShell />);
    const skipLink = screen.getByText("Skip to main content");
    expect(skipLink.tagName).toBe("A");
    expect(skipLink).toHaveAttribute("href", "#tr-main-content");
    const banner = screen.getByRole("banner");
    expect(banner.compareDocumentPosition(skipLink) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it("main landmark has id=tr-main-content for skip-nav target", () => {
    wrap(<AppShell />);
    const main = screen.getByRole("main");
    expect(main).toHaveAttribute("id", "tr-main-content");
  });
});
