import { useRef, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks.js";
import { setProject } from "../../store/projectSlice.js";
import { showReceipt, dismissReceipt } from "../../store/importReceiptSlice.js";
import { markPreviewStale } from "../../store/editorSlice.js";
import { migrateProject, defaultProject, SCHEMA_VERSION } from "@taroke/core";
import type { TarokeProject } from "@taroke/schema";

// ── Import receipt ─────────────────────────────────────────────────────────────

interface MigrationReceipt {
  filename: string | null;
  sourceFormat: string;
  sourceSchema: string | null;
  resultSchema: string;
  editorVersion: string;
  bankCount: number;
  bankIds: string[];
  tokenCount: number;
  deviceCount: number;
  routeCount: number;
  patternCount: number;
  flowSceneCount: number;
  triggerCount: number;
  warnings: string[];
  errors: string[];
  duplicateIdFindings: string[];
  repairCount: number;
  repairProvenance: string[];
  unknownFields: string[];
  explicitEmptyCollections: boolean;
  classicDefaultsApplied: boolean;
  migrationPath: string;
}

function buildReceipt(project: TarokeProject, original: unknown, filename: string | null): MigrationReceipt {
  const orig = original as Record<string, unknown>;
  const bankIds = Object.keys(project.materials.trays);
  const tokenCount = bankIds.reduce((s, b) => s + (project.materials.trays[b]?.length ?? 0), 0);
  const routeCount = project.lineDevices.reduce((s, d) => s + d.routes.length, 0);

  // Detect migration path
  const sourceSchema = typeof orig["schemaVersion"] === "string" ? orig["schemaVersion"] : null;
  const migrationPath = sourceSchema === project.schemaVersion ? "none" : `${sourceSchema ?? "unknown"} → ${project.schemaVersion}`;

  // Detect if classic defaults were applied (no custom banks in source)
  const sourceTrays = (orig["materials"] as Record<string, unknown> | undefined)?.["trays"];
  const classicDefaultsApplied = !sourceTrays || Object.keys(sourceTrays as object).length === 0;

  // Find unknown preserved fields
  const knownTopLevel = new Set(["schemaVersion", "project", "workbench", "materials", "forms", "lineDevices", "stanzaPatterns", "flowScenes", "triggers", "surface", "notes", "meta"]);
  const unknownFields = Object.keys(orig).filter((k) => !knownTopLevel.has(k));

  return {
    filename,
    sourceFormat: "taroke.json",
    sourceSchema,
    resultSchema: project.schemaVersion,
    editorVersion: SCHEMA_VERSION,
    bankCount: bankIds.length,
    bankIds,
    tokenCount,
    deviceCount: project.lineDevices.length,
    routeCount,
    patternCount: project.stanzaPatterns.length,
    flowSceneCount: project.flowScenes.length,
    triggerCount: project.triggers.length,
    warnings: [],
    errors: [],
    duplicateIdFindings: [],
    repairCount: 0,
    repairProvenance: [],
    unknownFields,
    explicitEmptyCollections: tokenCount === 0 && project.lineDevices.length === 0,
    classicDefaultsApplied,
    migrationPath,
  };
}

// ── Autosave recovery ──────────────────────────────────────────────────────────

const V08_AUTOSAVE_KEY = "taroke.remixer.v08.draft";
const V07_AUTOSAVE_KEY = "taroke.remixer.draft";

function loadV08Draft(): { project: TarokeProject; savedAt: string } | null {
  try {
    const raw = localStorage.getItem(V08_AUTOSAVE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { project: TarokeProject; savedAt: string };
  } catch { return null; }
}

function loadV07Draft(): string | null {
  try {
    return localStorage.getItem(V07_AUTOSAVE_KEY);
  } catch { return null; }
}

// ── HTML export ────────────────────────────────────────────────────────────────

function generateStandaloneHtml(project: TarokeProject): string {
  const json = JSON.stringify(project, null, 2);
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${project.project.title} — TAROKE RIMIXER</title>
<style>
body { font-family: monospace; background: #000; color: #fff; padding: 1rem; }
button { font-family: monospace; background: #fff; color: #000; border: none; padding: 0.5rem 1rem; cursor: pointer; margin: 0.25rem; }
#surface { white-space: pre-wrap; margin-top: 1rem; min-height: 4rem; }
</style>
</head>
<body>
<h1>${project.project.title}</h1>
<p>${project.project.statement ?? ""}</p>
<button id="gen">Generate ▶</button>
<button id="clear">Clear</button>
<ol id="surface"></ol>
<script>
const project = ${json};
function uid() { return Math.random().toString(36).slice(2); }
function randomWeighted(items, rng) {
  const total = items.reduce((s,x)=>s+(x.weight??1),0);
  let r = rng() * total;
  for (const x of items) { r -= (x.weight??1); if (r<=0) return x; }
  return items[items.length-1];
}
function formToken(tok, form) {
  if (!tok) return '';
  const lit = tok.literal ?? '';
  const ov = (project.forms?.overrides?.[tok.id] ?? {});
  if (form === 'literal' || form === 'base') return ov[form] ?? lit;
  if (form === 'uppercase') return lit.toUpperCase();
  if (form === 'lowercase') return lit.toLowerCase();
  const s = ov[form] ?? lit;
  return s;
}
function render() {
  const scenes = (project.flowScenes ?? []).filter(s => s.enabled && ((project.stanzaPatterns ?? []).find(p => p.id === s.stanzaId)?.enabled));
  if (!scenes.length) return null;
  const scene = randomWeighted(scenes, Math.random);
  const stanza = (project.stanzaPatterns ?? []).find(p => p.id === scene.stanzaId);
  if (!stanza) return null;
  for (const slot of (stanza.slots ?? [])) {
    if (slot.type !== 'device') continue;
    const dev = (project.lineDevices ?? []).find(d => d.id === slot.deviceId && d.enabled);
    if (!dev || !dev.routes.length) continue;
    const route = randomWeighted(dev.routes, Math.random);
    let text = route.template;
    for (const inp of dev.inputs) {
      const tray = project.materials.trays[inp.tray] ?? [];
      if (!tray.length) continue;
      const tok = randomWeighted(tray, Math.random);
      const re = new RegExp('\\\\{' + inp.slot + ':([^}]+)\\\\}', 'g');
      text = text.replace(re, (_, form) => formToken(tok, form));
    }
    return text;
  }
  return null;
}
document.getElementById('gen').addEventListener('click', () => {
  const text = render();
  if (!text) return;
  const li = document.createElement('li');
  li.textContent = text;
  document.getElementById('surface').appendChild(li);
});
document.getElementById('clear').addEventListener('click', () => {
  document.getElementById('surface').innerHTML = '';
});
</script>
</body>
</html>`;
}

// ── ArchivePanel ───────────────────────────────────────────────────────────────

export function ArchivePanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const receipt = useAppSelector((s) => s.importReceipt);
  const fileRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<HTMLIFrameElement>(null);

  const [importError, setImportError] = useState<string | null>(null);
  const [previewState, setPreviewState] = useState<"UNBUILT" | "FRESH" | "STALE" | "ERROR">("UNBUILT");
  const [previewSrc, setPreviewSrc] = useState<string | null>(null);
  const [v08Draft, setV08Draft] = useState<{ project: TarokeProject; savedAt: string } | null>(null);
  const [v07DraftRaw, setV07DraftRaw] = useState<string | null>(null);
  const [showAutosave, setShowAutosave] = useState(false);

  // ── Import ────────────────────────────────────────────────────────────────
  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportError(null);

    try {
      const text = await file.text();
      let raw: unknown;
      if (file.name.endsWith(".html")) {
        // Extract embedded JSON from standalone HTML
        const match = /<script[^>]*>[\s\S]*?const project = ({[\s\S]*?});\s*function/m.exec(text);
        if (!match) throw new Error("No embedded project JSON found in HTML file.");
        raw = JSON.parse(match[1]!);
      } else {
        raw = JSON.parse(text);
      }

      const migrated = migrateProject(raw as TarokeProject);
      const receiptData = buildReceipt(migrated, raw, file.name);

      dispatch(setProject(migrated));
      dispatch(showReceipt({
        filename: file.name,
        issues: [],
        repairCount: receiptData.repairCount,
      }));
      dispatch(markPreviewStale());
      setPreviewState("STALE");
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      setImportError(`Import failed: ${msg}`);
    }

    // Reset input so the same file can be re-imported
    if (fileRef.current) fileRef.current.value = "";
  }, [dispatch]);

  // ── Export JSON ────────────────────────────────────────────────────────────
  const exportJson = useCallback(() => {
    const json = JSON.stringify(project, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.project.title || "taroke-project"}.taroke.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [project]);

  // ── Export HTML ────────────────────────────────────────────────────────────
  const exportHtml = useCallback(() => {
    const html = generateStandaloneHtml(project);
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${project.project.title || "taroke-project"}.taroke.html`;
    a.click();
    URL.revokeObjectURL(url);
  }, [project]);

  // ── Embedded preview ───────────────────────────────────────────────────────
  const buildPreview = useCallback(() => {
    try {
      const html = generateStandaloneHtml(project);
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      if (previewSrc) URL.revokeObjectURL(previewSrc);
      setPreviewSrc(url);
      setPreviewState("FRESH");
    } catch (err) {
      setPreviewState("ERROR");
    }
  }, [project, previewSrc]);

  // ── Autosave restore ───────────────────────────────────────────────────────
  const checkAutosave = useCallback(() => {
    setV08Draft(loadV08Draft());
    setV07DraftRaw(loadV07Draft());
    setShowAutosave(true);
  }, []);

  const restoreV08 = useCallback(() => {
    if (!v08Draft) return;
    try {
      const migrated = migrateProject(v08Draft.project);
      dispatch(setProject(migrated));
      dispatch(showReceipt({ filename: "v08 autosave", issues: [], repairCount: 0 }));
      setShowAutosave(false);
    } catch (err) {
      setImportError(`Autosave restore failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [dispatch, v08Draft]);

  const restoreV07 = useCallback(() => {
    if (!v07DraftRaw) return;
    try {
      const raw = JSON.parse(v07DraftRaw) as TarokeProject;
      const migrated = migrateProject(raw);
      dispatch(setProject(migrated));
      dispatch(showReceipt({ filename: "v07 autosave (migrated)", issues: [], repairCount: 0 }));
      setShowAutosave(false);
    } catch (err) {
      setImportError(`v07 autosave restore failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }, [dispatch, v07DraftRaw]);

  const clearV07Draft = useCallback(() => {
    try { localStorage.removeItem(V07_AUTOSAVE_KEY); } catch {}
    setV07DraftRaw(null);
  }, []);

  return (
    <div className="tr-panel tr-archive">
      {/* Import receipt banner */}
      {receipt.visible && (
        <div className="tr-receipt" role="status" aria-live="polite">
          <div className="tr-receipt__header">
            <strong>Import Receipt</strong>
            <button className="tr-receipt__dismiss" aria-label="Dismiss receipt" onClick={() => dispatch(dismissReceipt())}>✕</button>
          </div>
          <dl className="tr-receipt__detail">
            <dt>File</dt><dd>{receipt.filename ?? "—"}</dd>
            <dt>Imported at</dt><dd>{receipt.timestamp ? new Date(receipt.timestamp).toLocaleString() : "—"}</dd>
            <dt>Repairs</dt><dd>{receipt.repairCount}</dd>
            {receipt.issues.length > 0 && (
              <>
                <dt>Warnings/Errors</dt>
                <dd>
                  <ul className="tr-receipt__issues">
                    {receipt.issues.map((iss, i) => (
                      <li key={i} className={`tr-receipt__issue tr-receipt__issue--${iss.level}`} role="alert">
                        [{iss.level.toUpperCase()}] {iss.area}: {iss.message}
                      </li>
                    ))}
                  </ul>
                </dd>
              </>
            )}
          </dl>
        </div>
      )}

      {importError && (
        <div className="tr-archive__error" role="alert">
          <strong>Error:</strong> {importError}
          <button onClick={() => setImportError(null)} aria-label="Dismiss error">✕</button>
        </div>
      )}

      {/* Import */}
      <section className="tr-panel__section">
        <h2 className="tr-panel__heading">Import</h2>
        <p className="tr-panel__hint">Import a .taroke.json or standalone .taroke.html file.</p>
        <button
          className="tr-btn tr-btn--primary"
          aria-label="Import project file"
          onClick={() => fileRef.current?.click()}
        >
          Import file…
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".json,.taroke.json,.html,.taroke.html"
          aria-hidden="true"
          className="tr-archive__file-input"
          onChange={handleFileChange}
        />
      </section>

      {/* Export */}
      <section className="tr-panel__section">
        <h2 className="tr-panel__heading">Export</h2>
        <div className="tr-archive__export-btns">
          <button
            className="tr-btn tr-btn--primary"
            aria-label="Download project as JSON"
            onClick={exportJson}
          >
            Download JSON
          </button>
          <button
            className="tr-btn tr-btn--primary"
            aria-label="Download standalone HTML"
            onClick={exportHtml}
          >
            Download HTML
          </button>
        </div>
      </section>

      {/* Embedded preview */}
      <section className="tr-panel__section tr-preview">
        <h2 className="tr-panel__heading">
          Preview
          <span className={`tr-preview__status tr-preview__status--${previewState.toLowerCase()}`} aria-label={`Preview status: ${previewState}`}>
            {previewState}
          </span>
        </h2>
        <div className="tr-preview__controls">
          <button
            className="tr-btn tr-btn--primary"
            aria-label="Build preview"
            onClick={buildPreview}
          >
            {previewState === "UNBUILT" ? "Build preview" : "Rebuild preview"}
          </button>
          {previewState === "STALE" && (
            <span className="tr-preview__hint" role="alert">Project changed since last build.</span>
          )}
        </div>
        {previewState === "ERROR" && (
          <p className="tr-archive__error" role="alert">Preview failed to build.</p>
        )}
        {previewSrc && previewState !== "UNBUILT" && (
          <iframe
            ref={previewRef}
            className="tr-preview__frame"
            src={previewSrc}
            title="Standalone HTML preview"
            sandbox="allow-scripts"
            aria-label="Embedded preview"
          />
        )}
      </section>

      {/* Autosave recovery */}
      <section className="tr-panel__section tr-autosave">
        <h2 className="tr-panel__heading">Autosave Recovery</h2>
        <button className="tr-btn tr-btn--secondary" onClick={checkAutosave} aria-label="Check for saved drafts">
          Check for saved drafts
        </button>

        {showAutosave && (
          <div className="tr-autosave__panel">
            {/* v08 draft */}
            {v08Draft ? (
              <div className="tr-autosave__entry">
                <strong>v08 draft</strong> saved {new Date(v08Draft.savedAt).toLocaleString()}
                <button className="tr-btn tr-btn--secondary" onClick={restoreV08} aria-label="Restore v08 draft">Restore</button>
              </div>
            ) : (
              <p className="tr-autosave__none">No v08 draft found.</p>
            )}

            {/* v07 draft */}
            {v07DraftRaw ? (
              <div className="tr-autosave__entry tr-autosave__entry--v07">
                <strong>v07 draft detected</strong>
                <p className="tr-autosave__v07-warn">
                  This is a v07 draft. Restoring will migrate it to v08 format.
                  Your current v08 draft will not be overwritten.
                </p>
                <button className="tr-btn tr-btn--secondary" onClick={restoreV07} aria-label="Migrate and restore v07 draft">
                  Migrate and restore v07 draft
                </button>
                <button className="tr-btn tr-btn--secondary" onClick={clearV07Draft} aria-label="Clear v07 draft">
                  Clear v07 draft
                </button>
              </div>
            ) : (
              <p className="tr-autosave__none">No v07 draft found.</p>
            )}
          </div>
        )}
      </section>

      {/* Project info */}
      <section className="tr-panel__section tr-archive__info">
        <h2 className="tr-panel__heading">Current Project</h2>
        <dl className="tr-archive__detail">
          <dt>Title</dt><dd>{project.project.title || "(untitled)"}</dd>
          <dt>Schema</dt><dd>{project.schemaVersion}</dd>
          <dt>Banks</dt><dd>{Object.keys(project.materials.trays).length}</dd>
          <dt>Devices</dt><dd>{project.lineDevices.length}</dd>
          <dt>Patterns</dt><dd>{project.stanzaPatterns.length}</dd>
          <dt>Scenes</dt><dd>{project.flowScenes.length}</dd>
          <dt>Triggers</dt><dd>{project.triggers.length}</dd>
        </dl>
      </section>
    </div>
  );
}
