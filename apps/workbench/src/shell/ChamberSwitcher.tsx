import { useEffect, useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { setActivePanel } from "../store/editorSlice.js";
import { CHAMBERS, chamberInfo, formatChamberSequence } from "./chambers.js";
import { useMediaQuery, SHORT_LANDSCAPE_QUERY } from "./useMediaQuery.js";

/**
 * Replaces the fixed six-abbreviation bottom navigation (SHELL-01) with a
 * sticky, full-name chamber switcher below the Transport (04_SOLUTION_
 * ARCHITECTURE.md §3). Portrait shows a collapsed "03 Instruments ▾"
 * trigger that expands to all eight chambers with sequence and purpose;
 * short landscape shows a compact scrollable rail of full names instead
 * (SHELL-10).
 */
export function ChamberSwitcher() {
  const dispatch = useAppDispatch();
  const activePanel = useAppSelector((s) => s.editor.activePanel);
  const isShortLandscape = useMediaQuery(SHORT_LANDSCAPE_QUERY);
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const railRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLElement>(null);
  const current = chamberInfo(activePanel);

  function choose(id: typeof activePanel) {
    dispatch(setActivePanel(id));
    setOpen(false);
    triggerRef.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function onPointerDown(e: PointerEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open]);

  if (isShortLandscape) {
    function scrollRail(dir: -1 | 1) {
      railRef.current?.scrollBy({ left: dir * 160, behavior: "smooth" });
    }
    return (
      <nav className="tr-chamber-rail" aria-label="Chambers">
        <button
          type="button"
          className="tr-chamber-rail__arrow"
          onClick={() => scrollRail(-1)}
          aria-label="Scroll chambers earlier"
        >
          ‹
        </button>
        <div className="tr-chamber-rail__track" role="tablist" ref={railRef}>
          {CHAMBERS.map((c) => (
            <button
              key={c.id}
              type="button"
              role="tab"
              className={["tr-chamber-rail__btn", c.id === activePanel ? "tr-chamber-rail__btn--active" : ""].filter(Boolean).join(" ")}
              aria-selected={c.id === activePanel}
              onClick={() => dispatch(setActivePanel(c.id))}
            >
              {formatChamberSequence(c.sequence)} {c.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="tr-chamber-rail__arrow"
          onClick={() => scrollRail(1)}
          aria-label="Scroll chambers later"
        >
          ›
        </button>
      </nav>
    );
  }

  return (
    <nav className="tr-chamber-switcher" aria-label="Chambers" ref={rootRef}>
      <button
        type="button"
        ref={triggerRef}
        className="tr-chamber-switcher__trigger"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="tr-chamber-switcher__seq">{formatChamberSequence(current.sequence)}</span>
        <span className="tr-chamber-switcher__label">{current.label}</span>
        <span className="tr-chamber-switcher__chevron" aria-hidden="true">{open ? "▴" : "▾"}</span>
      </button>
      {open && (
        <ul className="tr-chamber-switcher__menu" role="listbox" aria-label="Chambers">
          {CHAMBERS.map((c) => (
            <li key={c.id} role="presentation">
              <button
                type="button"
                role="option"
                aria-selected={c.id === activePanel}
                className={["tr-chamber-switcher__item", c.id === activePanel ? "tr-chamber-switcher__item--active" : ""].filter(Boolean).join(" ")}
                onClick={() => choose(c.id)}
              >
                <span className="tr-chamber-switcher__item-seq">{formatChamberSequence(c.sequence)}</span>
                <span className="tr-chamber-switcher__item-text">
                  <span className="tr-chamber-switcher__item-label">{c.label}</span>
                  <span className="tr-chamber-switcher__item-desc">{c.description}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </nav>
  );
}
