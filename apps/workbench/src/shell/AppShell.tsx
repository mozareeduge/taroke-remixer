import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { toggleSidebar, toggleInspector, setActivePanel } from "../store/editorSlice.js";
import { popForUndo, popForRedo } from "../store/historySlice.js";
import { Transport } from "./Transport.js";
import { Navigator } from "./Navigator.js";
import { Workspace } from "./Workspace.js";
import { Inspector } from "./Inspector.js";
import type { EditorPanel } from "../store/types.js";

const MOBILE_NAV_ITEMS: Array<{ id: EditorPanel; label: string; abbr: string }> = [
  { id: "materials",   label: "Material", abbr: "MAT" },
  { id: "instruments", label: "Devices",  abbr: "DEV" },
  { id: "composition", label: "Compose",  abbr: "CMP" },
  { id: "automation",  label: "Automate", abbr: "AUT" },
  { id: "performance", label: "Perform",  abbr: "PRF" },
  { id: "archive",     label: "Archive",  abbr: "ARC" },
];

function isMobileNavActive(itemId: EditorPanel, current: EditorPanel): boolean {
  if (itemId === "materials") return current === "materials" || current === "forms";
  return current === itemId;
}

export function AppShell() {
  const dispatch = useAppDispatch();
  const activePanel = useAppSelector((s) => s.editor.activePanel);

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

  return (
    <div className="tr-shell">
      <a href="#tr-main-content" className="tr-skip-nav">
        Skip to main content
      </a>
      <a href="#tr-navigator" className="tr-skip-nav">
        Skip to navigation
      </a>

      <Transport />
      <Workspace />
      <Navigator />
      <Inspector />

      <nav className="tr-mobile-nav" aria-label="Main navigation">
        {MOBILE_NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={isMobileNavActive(item.id, activePanel)
              ? "tr-mobile-nav__btn tr-mobile-nav__btn--active"
              : "tr-mobile-nav__btn"
            }
            onClick={() => dispatch(setActivePanel(item.id))}
            aria-current={isMobileNavActive(item.id, activePanel) ? "page" : undefined}
            aria-label={item.label}
          >
            <span className="tr-mobile-nav__abbr" aria-hidden="true">{item.abbr}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
