import { useEffect, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { openInspector, closeInspector, setInspectorMode } from "../store/editorSlice.js";
import { popForUndo, popForRedo } from "../store/historySlice.js";
import { Transport } from "./Transport.js";
import { Navigator } from "./Navigator.js";
import { Workspace } from "./Workspace.js";
import { Inspector } from "./Inspector.js";
import { ChamberSwitcher } from "./ChamberSwitcher.js";
import { LiveRegion } from "./LiveRegion.js";
import type { InspectorMode } from "../store/types.js";

function viewportMode(width: number): InspectorMode {
  if (width >= 1200) return "docked";
  if (width >= 960) return "overlay";
  return "sheet";
}

const FOCUSABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function AppShell() {
  const dispatch = useAppDispatch();
  const inspectorMode = useAppSelector((s) => s.editor.inspectorMode);
  const inspectorOpen = useAppSelector((s) => s.editor.inspectorOpen);
  const primary = useAppSelector((s) => s.selection.primary);
  const prevPrimaryRef = useRef(primary);
  const inspectorRef = useRef<HTMLElement | null>(null);
  const backgroundRef = useRef<HTMLDivElement | null>(null);

  const sheetOpen = inspectorMode === "sheet" && inspectorOpen;

  // `inert` isn't in this project's React DOM typings yet — set it
  // imperatively so the whole background (Transport, chamber switcher,
  // Workspace, Navigator) is genuinely unreachable while the sheet is open.
  useEffect(() => {
    backgroundRef.current?.toggleAttribute("inert", sheetOpen);
  }, [sheetOpen]);

  // Viewport mode detection — sets inspector mode and opens inspector at docked breakpoint
  useEffect(() => {
    const update = () => {
      const mode = viewportMode(window.innerWidth);
      dispatch(setInspectorMode(mode));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [dispatch]);

  // Auto-open inspector on first selection in overlay mode only.
  // Sheet (mobile) requires explicit open — auto-open would cover the workspace.
  useEffect(() => {
    if (primary !== null && prevPrimaryRef.current === null && inspectorMode === "overlay") {
      dispatch(openInspector());
    }
    prevPrimaryRef.current = primary;
  }, [primary, inspectorMode, dispatch]);

  // Keyboard undo/redo
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      if (e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        dispatch(popForUndo());
      } else if (e.key === "Z" || (e.key === "z" && e.shiftKey)) {
        e.preventDefault();
        dispatch(popForRedo());
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [dispatch]);

  // Modal sheet: move focus in on open, trap Tab within it, close on Escape
  // (SHELL-04, A11Y-03). The background is made inert via tr-shell__body so
  // it cannot be reached by pointer, click-through, or Tab while the sheet
  // is open.
  useEffect(() => {
    if (!sheetOpen) return;
    const root = inspectorRef.current;
    if (!root) return;
    const focusables = () => Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
    const first = focusables()[0];
    first?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        handleInspectorClose();
        return;
      }
      if (e.key !== "Tab" || !root) return;
      const list = focusables();
      if (list.length === 0) return;
      const activeIdx = list.indexOf(document.activeElement as HTMLElement);
      if (e.shiftKey && activeIdx <= 0) {
        e.preventDefault();
        list[list.length - 1]?.focus();
      } else if (!e.shiftKey && activeIdx === list.length - 1) {
        e.preventDefault();
        list[0]?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sheetOpen]);

  function handleInspectorClose() {
    dispatch(closeInspector());
    // Return focus to last interactive element or the inspector toggle in Transport
    const toggleBtn = document.querySelector<HTMLElement>(".tr-transport__toggle");
    if (toggleBtn) toggleBtn.focus();
  }

  return (
    <div className="tr-shell">
      <a href="#tr-main-content" className="tr-skip-nav">
        Skip to main content
      </a>
      <a href="#tr-navigator" className="tr-skip-nav">
        Skip to navigation
      </a>

      {/* display:contents — participates in the shell grid unchanged; inert
          disables the entire background while the mobile sheet is open.
          Navigator is placed before ChamberSwitcher in DOM order (both are
          <nav> landmarks) so `nav >> first()` resolves to whichever is
          actually visible at a given breakpoint — CSS grid-area positions
          ChamberSwitcher below Transport on mobile regardless of source
          order. */}
      <div className="tr-shell__body" ref={backgroundRef}>
        <Transport />
        <Workspace />
        <Navigator />
        <ChamberSwitcher />
      </div>

      {sheetOpen && (
        <div
          className="tr-inspector-backdrop"
          aria-hidden="true"
          onClick={handleInspectorClose}
        />
      )}
      <Inspector onClose={handleInspectorClose} panelRef={inspectorRef} />
      <LiveRegion />
    </div>
  );
}
