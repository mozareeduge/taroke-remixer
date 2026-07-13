import { useAppSelector } from "../store/hooks.js";
import { MaterialsPanel } from "../panels/MaterialsPanel.js";
import { InstrumentsPanel } from "../panels/InstrumentsPanel.js";
import { CompositionPanel } from "../panels/CompositionPanel.js";
import { AutomationPanel } from "../panels/AutomationPanel.js";
import { PerformancePanel } from "../panels/PerformancePanel.js";
import { ArchivePanel } from "../panels/ArchivePanel.js";

export function Workspace() {
  const activePanel = useAppSelector((s) => s.editor.activePanel);

  const panel = (() => {
    switch (activePanel) {
      case "materials": return <MaterialsPanel />;
      case "instruments": return <InstrumentsPanel />;
      case "composition": return <CompositionPanel />;
      case "automation": return <AutomationPanel />;
      case "performance": return <PerformancePanel />;
      case "archive": return <ArchivePanel />;
    }
  })();

  return (
    <main id="tr-main-content" className="tr-workspace" aria-label="Workspace">
      <div className="tr-workspace__panel-id" aria-hidden="true">
        {activePanel.toUpperCase()}
      </div>
      {panel}
    </main>
  );
}
