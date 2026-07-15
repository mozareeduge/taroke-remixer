import { useRef, useEffect, useCallback, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks.js";
// runtime start/stop reserved for future multi-step run mode
import { appendSurfaceLine, clearSurface } from "../../store/surfaceSlice.js";
import { captureTake, selectTake, deleteTake } from "../../store/takesSlice.js";
import { uid, generateEvent } from "@taroke/core";

export function PerformancePanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const runtime = useAppSelector((s) => s.runtime);
  const surfaceState = useAppSelector((s) => s.surface);
  const takesState = useAppSelector((s) => s.takes);
  const surfaceRef = useRef<HTMLOListElement>(null);
  const [cuePreview, setCuePreview] = useState<string | null>(null);

  // Auto-scroll when follow policy is "tail"
  useEffect(() => {
    if (surfaceState.followPolicy === "tail" && surfaceRef.current) {
      surfaceRef.current.scrollTop = surfaceRef.current.scrollHeight;
    }
  }, [surfaceState.lines, surfaceState.followPolicy]);

  const generateSurface = useCallback(() => {
    const event = generateEvent(project);
    if (event && event.type === "line") {
      dispatch(appendSurfaceLine({
        id: uid("sl"),
        tick: event.tick,
        text: event.surface,
        trace: event.trace,
        sceneId: event.sceneId,
        stanzaId: event.stanzaId,
        deviceId: event.deviceId,
        routeId: event.routeId,
        timestamp: new Date().toISOString(),
      }));
    } else if (event && event.type === "error") {
      dispatch(appendSurfaceLine({
        id: uid("sl"),
        tick: event.tick,
        text: `[error] ${event.trace}`,
        trace: event.trace,
        sceneId: null,
        stanzaId: null,
        deviceId: null,
        routeId: null,
        timestamp: new Date().toISOString(),
      }));
    }
  }, [dispatch, project]);

  const captureCurrent = useCallback(() => {
    if (surfaceState.lines.length === 0) return;
    dispatch(captureTake({
      id: uid("take"),
      label: `Take ${takesState.takes.length + 1}`,
      lines: surfaceState.lines,
      projectTitle: project.project.title,
    }));
  }, [dispatch, surfaceState.lines, takesState.takes.length, project.project.title]);

  const selectedTake = takesState.selectedTakeId
    ? takesState.takes.find((t) => t.id === takesState.selectedTakeId)
    : null;

  const viewLines = selectedTake ? selectedTake.lines : surfaceState.lines;

  return (
    <div className="tr-panel tr-performance">
      {/* Cue section — private preview, does NOT write to Surface */}
      <section className="tr-panel__section tr-cue">
        <h2 className="tr-panel__heading">Cue</h2>
        <p className="tr-panel__hint">
          Audition ▶ generates a preview line without adding to Surface history.
        </p>
        <button
          className="tr-btn tr-btn--secondary"
          aria-label="Audition — preview without saving to Surface"
          onClick={() => {
            const event = generateEvent(project);
            const text = event?.type === "line" ? event.surface : event?.type === "error" ? `[error] ${event.trace}` : "(nothing generated)";
            setCuePreview(text);
          }}
        >
          Audition ▶
        </button>
        {cuePreview !== null && (
          <div className="tr-cue__preview" role="status" aria-live="polite">
            <span className="tr-cue__preview-label">Preview (not saved to Surface):</span>
            <span className="tr-cue__preview-text">{cuePreview}</span>
            <button className="tr-cue__preview-dismiss" aria-label="Dismiss preview" onClick={() => setCuePreview(null)}>✕</button>
          </div>
        )}
      </section>

      {/* Surface section — store-backed */}
      <section className="tr-panel__section tr-surface">
        <h2 className="tr-panel__heading">Surface</h2>
        <div className="tr-surface__controls">
          <button
            className="tr-btn tr-btn--primary"
            aria-label="Generate — add line to Surface"
            onClick={generateSurface}
          >
            Generate ▶
          </button>
          <button
            className="tr-btn tr-btn--secondary"
            aria-label="Clear Surface"
            onClick={() => dispatch(clearSurface())}
            disabled={surfaceState.lines.length === 0}
          >
            Clear
          </button>
          <button
            className="tr-btn tr-btn--secondary"
            aria-label="Capture Take"
            onClick={captureCurrent}
            disabled={surfaceState.lines.length === 0}
          >
            Capture Take
          </button>
          <label className="tr-surface__follow">
            <input
              type="checkbox"
              checked={surfaceState.followPolicy === "tail"}
              aria-label="Auto-scroll to latest line"
              onChange={(e) => {
                // Use surfaceSlice's setFollowPolicy
                dispatch({ type: "surface/setFollowPolicy", payload: e.target.checked ? "tail" : "manual" });
              }}
            />
            Auto-scroll
          </label>
        </div>

        <ol
          ref={surfaceRef}
          className="tr-surface__lines"
          aria-label="Surface output lines"
          aria-live="polite"
          aria-atomic="false"
          aria-relevant="additions"
        >
          {surfaceState.lines.length === 0 && (
            <li className="tr-surface__empty">No lines yet. Press Generate ▶</li>
          )}
          {surfaceState.lines.map((line, i) => (
            <li
              key={line.id}
              className="tr-surface__line"
              title={`tick ${line.tick} | device ${line.deviceId ?? "?"} | route ${line.routeId ?? "?"}`}
            >
              <span className="tr-surface__line-num" aria-hidden>{i + 1}</span>
              <span className="tr-surface__line-text">{line.text}</span>
            </li>
          ))}
        </ol>
      </section>

      {/* UNMIX provenance — last Surface event */}
      {surfaceState.lines.length > 0 && (
        <section className="tr-panel__section tr-unmix">
          <h2 className="tr-panel__heading">UNMIX — Last Surface Event</h2>
          {(() => {
            const last = surfaceState.lines[surfaceState.lines.length - 1]!;
            return (
              <dl className="tr-unmix__detail">
                <dt>Text</dt><dd>{last.text}</dd>
                <dt>Tick</dt><dd>{last.tick}</dd>
                <dt>Device</dt><dd>{last.deviceId ?? "—"}</dd>
                <dt>Route</dt><dd>{last.routeId ?? "—"}</dd>
                <dt>Scene</dt><dd>{last.sceneId ?? "—"}</dd>
                <dt>Pattern</dt><dd>{last.stanzaId ?? "—"}</dd>
                <dt>Time</dt><dd>{last.timestamp}</dd>
                <dt>Trace</dt><dd className="tr-unmix__trace">{last.trace || "—"}</dd>
              </dl>
            );
          })()}
        </section>
      )}

      {/* Takes */}
      <section className="tr-panel__section tr-takes">
        <h2 className="tr-panel__heading">Takes</h2>
        {takesState.takes.length === 0 && (
          <p className="tr-panel__empty">No takes captured. Generate lines, then press "Capture Take".</p>
        )}
        <div className="tr-takes__list" role="list">
          {takesState.takes.map((take) => (
            <div
              key={take.id}
              className={["tr-take", take.id === takesState.selectedTakeId ? "tr-take--selected" : ""].filter(Boolean).join(" ")}
              role="listitem"
            >
              <button
                className="tr-take__select"
                aria-pressed={take.id === takesState.selectedTakeId}
                onClick={() => dispatch(selectTake(take.id))}
              >
                {take.label}
              </button>
              <span className="tr-take__info">
                {take.lines.length} lines · {new Date(take.capturedAt).toLocaleTimeString()}
              </span>
              <button
                className="tr-take__delete"
                aria-label={`Delete take ${take.label}`}
                onClick={() => dispatch(deleteTake(take.id))}
              >✕</button>
            </div>
          ))}
        </div>

        {selectedTake && (
          <div className="tr-take__view">
            <h3 className="tr-take__view-title">{selectedTake.label}</h3>
            <ol className="tr-surface__lines tr-take__lines">
              {selectedTake.lines.map((line, i) => (
                <li key={line.id} className="tr-surface__line">
                  <span className="tr-surface__line-num" aria-hidden>{i + 1}</span>
                  <span className="tr-surface__line-text">{line.text}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}
