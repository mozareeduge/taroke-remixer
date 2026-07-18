import { useState, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { setActivePanel } from "../store/editorSlice.js";
import { MaterialsPanel } from "../panels/MaterialsPanel.js";
import { FormsPanel } from "../panels/FormsPanel.js";
import { InstrumentsPanel } from "../panels/InstrumentsPanel.js";
import { CompositionPanel } from "../panels/CompositionPanel.js";
import { AutomationPanel } from "../panels/AutomationPanel.js";
import { PerformancePanel } from "../panels/PerformancePanel.js";
import { ArchivePanel } from "../panels/ArchivePanel.js";
import { ImportReceiptBanner } from "../panels/ImportReceiptBanner.js";
import { DraftRecoveryBanner } from "../panels/DraftRecoveryBanner.js";

function useIsMobile(): boolean {
  const mq = "(max-width: 959px)";
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== "undefined" && typeof window.matchMedia === "function"
      ? window.matchMedia(mq).matches
      : false
  );
  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mediaQuery = window.matchMedia(mq);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mediaQuery.addEventListener("change", handler);
    return () => mediaQuery.removeEventListener("change", handler);
  }, []);
  return isMobile;
}

const MATERIAL_SUB_ITEMS: Array<{ id: "materials" | "forms"; label: string }> = [
  { id: "materials", label: "Banks & Samples" },
  { id: "forms", label: "Forms" },
];

export function Workspace() {
  const dispatch = useAppDispatch();
  const activePanel = useAppSelector((s) => s.editor.activePanel);
  const inMaterialGroup = activePanel === "materials" || activePanel === "forms";
  const isMobile = useIsMobile();

  const panel = (() => {
    switch (activePanel) {
      case "materials": return <MaterialsPanel />;
      case "forms": return <FormsPanel />;
      case "instruments": return <InstrumentsPanel />;
      case "composition": return <CompositionPanel />;
      case "automation": return <AutomationPanel />;
      case "performance": return <PerformancePanel />;
      case "archive": return <ArchivePanel />;
    }
  })();

  return (
    <main id="tr-main-content" className="tr-workspace" aria-label="Workspace">
      <DraftRecoveryBanner />
      <ImportReceiptBanner />
      {isMobile && inMaterialGroup && (
        <nav className="tr-material-subnav" aria-label="Material sub-navigation">
          {MATERIAL_SUB_ITEMS.map((item) => (
            <button
              key={item.id}
              className={
                activePanel === item.id
                  ? "tr-material-subnav__btn tr-material-subnav__btn--active"
                  : "tr-material-subnav__btn"
              }
              onClick={() => dispatch(setActivePanel(item.id))}
              aria-current={activePanel === item.id ? "page" : undefined}
            >
              {item.label}
            </button>
          ))}
        </nav>
      )}
      {panel}
    </main>
  );
}
