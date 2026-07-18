import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { toggleSidebar, toggleInspector, setActivePanel } from "../store/editorSlice.js";
import { popForUndo, popForRedo } from "../store/historySlice.js";
import { Transport } from "./Transport.js";
import { Navigator } from "./Navigator.js";
import { Workspace } from "./Workspace.js";
import { Inspector } from "./Inspector.js";
import type { EditorPanel } from "../store/types.js";

const MOBILE_NAV_ITEMS: Array<{ id: EditorPanel; label: string; icon: string }> = [
  { id: "materials",   label: "Material",  icon: "◈" },
  { id: "instruments", label: "Devices",   icon: "⊡" },
  { id: "composition", label: "Compose",   icon: "≡" },
  { id: "automation",  label: "Automate",  icon: "⚡" },
  { id: "performance", label: "Perform",   icon: "▶" },
  { id: "archive",     label: "Archive",   icon: "⊞" },
];

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
            className={activePanel === item.id
              ? "tr-mobile-nav__btn tr-mobile-nav__btn--active"
              : "tr-mobile-nav__btn"
            }
            onClick={() => dispatch(setActivePanel(item.id))}
            aria-current={activePanel === item.id ? "page" : undefined}
          >
            <span className="tr-mobile-nav__icon" aria-hidden="true">{item.icon}</span>
            <span className="tr-mobile-nav__label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
