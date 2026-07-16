import { useRef, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { setProject } from "../store/projectSlice.js";
import { setPreviewFresh, setPreviewHtml } from "../store/editorSlice.js";
import { showReceipt } from "../store/importReceiptSlice.js";
import { exportProjectJson, exportProjectHtml, importProjectWithReceipt, downloadName } from "@taroke/core";

type PreviewLifecycle = "unbuilt" | "fresh" | "stale" | "error";

function download(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function ArchivePanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const previewFresh = useAppSelector((s) => s.editor.previewFresh);
  const previewHtml = useAppSelector((s) => s.editor.previewHtml);
  const importRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const lifecycle: PreviewLifecycle =
    previewError !== null
      ? "error"
      : previewHtml === null
      ? "unbuilt"
      : previewFresh
      ? "fresh"
      : "stale";

  function doPreview() {
    setPreviewError(null);
    try {
      const html = exportProjectHtml(project);
      dispatch(setPreviewHtml(html));
      dispatch(setPreviewFresh(true));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setPreviewError(msg);
      dispatch(setPreviewHtml(null));
    }
  }

  function doExportJson() {
    download(downloadName(project, ".taroke.json"), exportProjectJson(project), "application/json");
  }

  function doExportHtml() {
    download(downloadName(project, ".taroke.html"), exportProjectHtml(project), "text/html");
  }

  function doImport(file: File) {
    setImportError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result ?? "");
      try {
        const { project: imported, receipt } = importProjectWithReceipt(text, file.name);
        dispatch(setProject(imported));
        dispatch(showReceipt({
          filename: file.name,
          issues: [],
          repairCount: receipt.repairCount,
          fullReceipt: receipt,
        }));
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        setImportError(`Could not import "${file.name}": ${msg}`);
      }
    };
    reader.onerror = () => {
      setImportError(`Could not read "${file.name}".`);
    };
    reader.readAsText(file);
  }

  return (
    <div className="tr-panel tr-panel--archive">
      <div className="tr-panel__main">
        <div className="tr-panel__section-head">EXPORT</div>
        <div className="tr-archive__actions">
          <button className="tr-btn tr-btn--primary" onClick={doExportJson}>
            Export JSON (.taroke.json)
          </button>
          <p className="tr-archive__desc">Project data for editing in another session.</p>

          <button className="tr-btn tr-btn--primary" onClick={doExportHtml}>
            Export HTML (.taroke.html)
          </button>
          <p className="tr-archive__desc">Standalone artifact — runs in any browser, no server needed.</p>
        </div>

        <div className="tr-panel__section-head">IMPORT</div>
        <div className="tr-archive__actions">
          <input
            ref={importRef}
            type="file"
            accept=".json,.html,.taroke.json,.taroke.html"
            className="tr-visually-hidden"
            aria-label="Import project file"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) doImport(file);
              e.target.value = "";
            }}
          />
          <button className="tr-btn tr-btn--ghost" onClick={() => importRef.current?.click()}>
            Import .taroke.json or .taroke.html
          </button>
          <p className="tr-archive__desc">Replaces the current project. Undo is available.</p>
          {importError && (
            <p className="tr-archive__error" role="alert" aria-live="assertive">
              {importError}
            </p>
          )}
        </div>

        <div className="tr-panel__section-head">
          PREVIEW
          <span
            className={`tr-badge tr-badge--lifecycle tr-badge--lifecycle-${lifecycle}`}
            data-preview-lifecycle={lifecycle}
            aria-label={`Preview status: ${lifecycle}`}
          >
            {lifecycle.toUpperCase()}
          </span>
        </div>
        <div className="tr-archive__actions">
          <button
            className="tr-btn tr-btn--ghost"
            onClick={doPreview}
            aria-label={lifecycle === "unbuilt" ? "Generate preview of exported artifact" : "Refresh artifact preview"}
          >
            {lifecycle === "unbuilt" ? "Preview artifact" : "Refresh preview"}
          </button>
          {lifecycle === "stale" && (
            <p className="tr-archive__desc tr-archive__stale-hint">
              Project has changed — preview is stale. Click Refresh to rebuild.
            </p>
          )}
          {previewError && (
            <p className="tr-archive__error" role="alert" aria-live="assertive">
              Preview error: {previewError}
            </p>
          )}
        </div>
        {previewHtml && (
          <div
            className="tr-archive__preview-frame"
            data-preview-lifecycle={lifecycle}
          >
            <iframe
              title="Artifact preview"
              srcDoc={previewHtml}
              sandbox="allow-scripts"
              className="tr-archive__iframe"
              aria-label="Exported artifact preview"
            />
          </div>
        )}

        <div className="tr-panel__section-head">PROJECT INFO</div>
        <table className="tr-table">
          <tbody>
            <tr className="tr-table__row">
              <th scope="row" className="tr-table__th tr-table__th--label">Title</th>
              <td className="tr-table__td">{project.project.title || "(untitled)"}</td>
            </tr>
            <tr className="tr-table__row">
              <th scope="row" className="tr-table__th tr-table__th--label">Author</th>
              <td className="tr-table__td">{project.project.author || "—"}</td>
            </tr>
            <tr className="tr-table__row">
              <th scope="row" className="tr-table__th tr-table__th--label">Source</th>
              <td className="tr-table__td">{project.project.sourceTitle || "—"}</td>
            </tr>
            <tr className="tr-table__row">
              <th scope="row" className="tr-table__th tr-table__th--label">Version</th>
              <td className="tr-table__td">{project.schemaVersion}</td>
            </tr>
            <tr className="tr-table__row">
              <th scope="row" className="tr-table__th tr-table__th--label">Banks</th>
              <td className="tr-table__td">{Object.keys(project.materials.trays).length}</td>
            </tr>
            <tr className="tr-table__row">
              <th scope="row" className="tr-table__th tr-table__th--label">Devices</th>
              <td className="tr-table__td">{project.lineDevices.length}</td>
            </tr>
            <tr className="tr-table__row">
              <th scope="row" className="tr-table__th tr-table__th--label">Patterns</th>
              <td className="tr-table__td">{project.stanzaPatterns.length}</td>
            </tr>
            <tr className="tr-table__row">
              <th scope="row" className="tr-table__th tr-table__th--label">Triggers</th>
              <td className="tr-table__td">{project.triggers.length}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
