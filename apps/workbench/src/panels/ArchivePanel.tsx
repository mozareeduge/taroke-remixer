import { useRef, useState, useEffect, type ReactNode } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { setProject } from "../store/projectSlice.js";
import { setPreviewFresh, setPreviewHtml } from "../store/editorSlice.js";
import { showReceipt } from "../store/importReceiptSlice.js";
import { exportProjectJson, exportProjectHtml, importProjectWithReceipt, downloadName, checksumOf } from "@taroke/core";

type PreviewLifecycle = "unbuilt" | "building" | "ready" | "stale" | "error";

/** How long to wait for the preview iframe's postMessage handshake before
 * treating a silent artifact (one that hung or threw before wiring up) as an
 * error instead of leaving the badge stuck on "building" forever. */
const PREVIEW_HANDSHAKE_TIMEOUT_MS = 4000;

function safeLink(url: string): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    return (u.protocol === "http:" || u.protocol === "https:") ? url : null;
  } catch { return null; }
}

function InfoRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <tr className="tr-table__row">
      <th scope="row" className="tr-table__th tr-table__th--label">{label}</th>
      <td className="tr-table__td">{children}</td>
    </tr>
  );
}

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
  const [handshake, setHandshake] = useState<"pending" | "ready" | "error" | null>(null);
  const [exportReceipt, setExportReceipt] = useState<{ filename: string; timestamp: string; checksum: string; byteSize: number } | null>(null);

  const lifecycle: PreviewLifecycle =
    previewError !== null
      ? "error"
      : previewHtml === null
      ? "unbuilt"
      : handshake === "pending"
      ? "building"
      : previewFresh
      ? "ready"
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

  // Iframe handshake: the exported artifact posts a "ready" or "error"
  // message once it has actually run (see standaloneRuntime in core/export).
  // Without this, srcDoc being set would be mistaken for a working preview
  // even if the artifact hung or threw before rendering anything.
  useEffect(() => {
    if (previewHtml === null) { setHandshake(null); return; }
    setHandshake("pending");
    let settled = false;
    function onMessage(e: MessageEvent) {
      if (!e.data || e.data.source !== "taroke-artifact") return;
      settled = true;
      if (e.data.status === "ready") {
        setHandshake("ready");
      } else {
        setHandshake("error");
        setPreviewError(typeof e.data.message === "string" ? e.data.message : "Artifact reported an error while loading.");
      }
    }
    window.addEventListener("message", onMessage);
    const timeoutId = setTimeout(() => {
      if (!settled) {
        setHandshake("error");
        setPreviewError(`Preview did not confirm it loaded within ${PREVIEW_HANDSHAKE_TIMEOUT_MS / 1000}s.`);
      }
    }, PREVIEW_HANDSHAKE_TIMEOUT_MS);
    return () => {
      window.removeEventListener("message", onMessage);
      clearTimeout(timeoutId);
    };
  }, [previewHtml]);

  function recordExport(filename: string, content: string) {
    setExportReceipt({
      filename,
      timestamp: new Date().toISOString(),
      checksum: checksumOf(content),
      byteSize: content.length,
    });
  }

  function doExportJson() {
    const filename = downloadName(project, ".taroke.json");
    const content = exportProjectJson(project);
    download(filename, content, "application/json");
    recordExport(filename, content);
  }

  function doExportHtml() {
    const filename = downloadName(project, ".taroke.html");
    const content = exportProjectHtml(project);
    download(filename, content, "text/html");
    recordExport(filename, content);
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
          <button className="tr-btn tr-btn--ghost" onClick={doExportJson}>
            Export JSON (.taroke.json)
          </button>
          <p className="tr-archive__desc">Project data for editing in another session.</p>

          <button className="tr-btn tr-btn--ghost" onClick={doExportHtml}>
            Export HTML (.taroke.html)
          </button>
          <p className="tr-archive__desc">Standalone artifact — runs in any browser, no server needed.</p>

          {exportReceipt && (
            <p className="tr-archive__export-receipt" role="status">
              Exported <strong>{exportReceipt.filename}</strong> at{" "}
              {new Date(exportReceipt.timestamp).toLocaleString(undefined, { dateStyle: "short", timeStyle: "medium" })}
              {" · "}{exportReceipt.byteSize.toLocaleString()} bytes{" · "}
              <span className="tr-archive__export-receipt-checksum">#{exportReceipt.checksum}</span>
            </p>
          )}
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
            disabled={lifecycle === "building"}
            aria-disabled={lifecycle === "building"}
            aria-label={lifecycle === "unbuilt" ? "Generate preview of exported artifact" : "Refresh artifact preview"}
          >
            {lifecycle === "building" ? "Building…" : lifecycle === "unbuilt" ? "Preview artifact" : "Refresh preview"}
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

        <div className="tr-panel__section-head tr-panel__section-head--subordinate">PROJECT INFO</div>
        <table className="tr-table tr-archive__info-table">
          <tbody>
            <InfoRow label="Title">{project.project.title || "(untitled)"}</InfoRow>
            <InfoRow label="Author">{project.project.author || "—"}</InfoRow>
            <InfoRow label="Language">{project.project.language || "—"}</InfoRow>
            <InfoRow label="Source title">{project.project.sourceTitle || "—"}</InfoRow>
            <InfoRow label="Source URL">
              {(() => {
                const href = safeLink(project.project.sourceUrl);
                if (href) return <a href={href} className="tr-archive__source-link" target="_blank" rel="noopener noreferrer">{project.project.sourceUrl}</a>;
                return project.project.sourceUrl || "—";
              })()}
            </InfoRow>
            <InfoRow label="Statement">
              {project.project.statement
                ? <span className="tr-archive__multiline">{project.project.statement}</span>
                : "—"}
            </InfoRow>
            <InfoRow label="Credits">
              {project.project.credits
                ? <span className="tr-archive__multiline">{project.project.credits}</span>
                : "—"}
            </InfoRow>
            <InfoRow label="Version">{project.schemaVersion}</InfoRow>
            <InfoRow label="Banks">{Object.keys(project.materials.trays).length}</InfoRow>
            <InfoRow label="Devices">{project.lineDevices.length}</InfoRow>
            <InfoRow label="Patterns">{project.stanzaPatterns.length}</InfoRow>
            <InfoRow label="Triggers">{project.triggers.length}</InfoRow>
          </tbody>
        </table>
      </div>
    </div>
  );
}
