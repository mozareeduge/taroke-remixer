import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { toggleSidebar, toggleInspector } from "../store/editorSlice.js";
import { Transport } from "./Transport.js";
import { Navigator } from "./Navigator.js";
import { Workspace } from "./Workspace.js";
import { Inspector } from "./Inspector.js";
import { ImportReceiptBanner } from "../panels/ImportReceiptBanner.js";
import { DraftRecoveryBanner } from "../panels/DraftRecoveryBanner.js";

export function AppShell() {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector((s) => s.editor.sidebarOpen);
  const inspectorOpen = useAppSelector((s) => s.editor.inspectorOpen);

  return (
    <div className="tr-shell">
      {/* Skip-nav: first focusable element; visually hidden until focused (a11y WCAG 2.4.1) */}
      <a href="#tr-main-content" className="tr-skip-nav">
        Skip to main content
      </a>
      <DraftRecoveryBanner />
      <ImportReceiptBanner />
      <Transport />
      <div className="tr-shell__body">
        <button
          className="tr-shell__toggle tr-shell__toggle--nav"
          aria-pressed={sidebarOpen}
          aria-label={sidebarOpen ? "Close navigator" : "Open navigator"}
          onClick={() => dispatch(toggleSidebar())}
        >
          {sidebarOpen ? "◀" : "▶"}
        </button>

        {sidebarOpen && <Navigator />}

        <Workspace />

        <button
          className="tr-shell__toggle tr-shell__toggle--inspector"
          aria-pressed={inspectorOpen}
          aria-label={inspectorOpen ? "Close inspector" : "Open inspector"}
          onClick={() => dispatch(toggleInspector())}
        >
          {inspectorOpen ? "▶" : "◀"}
        </button>

        {inspectorOpen && <Inspector />}
      </div>
    </div>
  );
}
