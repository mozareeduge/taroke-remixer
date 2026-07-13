import { useAppSelector } from "../store/hooks.js";

export function Workspace() {
  const activePanel = useAppSelector((s) => s.editor.activePanel);

  return (
    <main className="tr-workspace" aria-label="Workspace">
      <div className="tr-workspace__inner">
        <span className="tr-workspace__panel-id">{activePanel.toUpperCase()}</span>
        <p className="tr-workspace__placeholder">
          Panel content for <strong>{activePanel}</strong> — WP05 vertical slice.
        </p>
      </div>
    </main>
  );
}
