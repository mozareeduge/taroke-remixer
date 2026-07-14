import { useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { recordEvent } from "../store/runtimeSlice.js";
import { captureTake, clearTakes, removeTake } from "../store/takesSlice.js";
import { generateEvent } from "@taroke/core";
import type { TarokeEvent, LineEvent, RunState } from "@taroke/schema";

export function PerformancePanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const runState = useAppSelector((s) => s.runtime.runState);
  // Store-backed takes — persist across panel navigation
  const takes = useAppSelector((s) => s.takes.takes);

  const [surfaceLines, setSurfaceLines] = useState<string[]>([]);
  const [currentEvent, setCurrentEvent] = useState<TarokeEvent | null>(null);
  // Only the queue is held locally; tick/scene/stanza come from Redux runState.
  const localQueue = useRef<RunState["queue"]>([...runState.queue]);

  function doGenerate() {
    // Build state from Redux (tick/scene/stanza) + local queue filtered to current devices.
    const knownDeviceIds = new Set(project.lineDevices.map((d) => d.id));
    const safeQueue = localQueue.current.filter(
      (entry) => entry.type !== "device" || !entry.deviceId || knownDeviceIds.has(entry.deviceId),
    );
    const state: Partial<RunState> = { ...runState, queue: safeQueue };
    const ev = generateEvent(project, state);
    // Advance the local queue to whatever generateEvent left in state.queue
    localQueue.current = state.queue ?? [];
    dispatch(recordEvent(ev));
    setCurrentEvent(ev);
    if (ev.type === "line" && ev.surface) {
      setSurfaceLines((prev) => {
        const next = [...prev, ev.surface];
        const retention = project.surface?.retention ?? 28;
        return next.slice(-retention);
      });
    }
  }

  function doCaptureTake() {
    if (!currentEvent || currentEvent.type !== "line") return;
    const ev = currentEvent as LineEvent;
    dispatch(captureTake({
      id: `take_${Date.now()}`,
      tick: ev.tick,
      surface: ev.surface,
      trace: ev.trace,
      deviceName: ev.deviceName,
      route: ev.route,
    }));
  }

  const lineEvent = currentEvent?.type === "line" ? (currentEvent as LineEvent) : null;

  return (
    <div className="tr-panel tr-panel--performance">
      <div className="tr-panel__main">

        {/* CUE */}
        <section className="tr-perf__section" aria-labelledby="cue-head">
          <div id="cue-head" className="tr-panel__section-head">CUE</div>
          <div className="tr-cue">
            <button
              className="tr-btn tr-btn--primary tr-cue__generate"
              onClick={doGenerate}
              aria-label="Generate next event"
            >
              Generate ▶
            </button>
            {currentEvent && (
              <div
                className={["tr-cue__output", currentEvent.type === "breath" ? "tr-cue__output--breath" : ""].filter(Boolean).join(" ")}
                aria-live="polite"
                aria-atomic="true"
              >
                {currentEvent.type === "breath" ? (
                  <span className="tr-cue__breath" role="status">— breath —</span>
                ) : lineEvent ? (
                  <p className="tr-cue__line">{lineEvent.surface}</p>
                ) : null}
              </div>
            )}
          </div>
        </section>

        {/* SURFACE */}
        <section className="tr-perf__section" aria-labelledby="surface-head">
          <div id="surface-head" className="tr-panel__section-head">
            SURFACE
            <button className="tr-btn tr-btn--ghost tr-btn--sm" onClick={() => setSurfaceLines([])}>
              Clear
            </button>
          </div>
          <div className="tr-surface" aria-live="polite" aria-label="Surface output stream">
            {surfaceLines.length === 0 ? (
              <p className="tr-panel__empty">Generate events to see surface output.</p>
            ) : (
              surfaceLines.map((line, i) => (
                <p key={i} className="tr-surface__line">{line}</p>
              ))
            )}
          </div>
        </section>

        {/* UNMIX */}
        {lineEvent && (
          <section className="tr-perf__section" aria-labelledby="unmix-head">
            <div id="unmix-head" className="tr-panel__section-head">
              UNMIX
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                onClick={doCaptureTake}
                aria-label="Capture current event as a Take"
              >
                Capture Take
              </button>
            </div>
            <table className="tr-table tr-table--unmix" aria-label="Event trace">
              <tbody>
                <tr className="tr-table__row">
                  <th scope="row" className="tr-table__th tr-table__th--label">Device</th>
                  <td className="tr-table__td">{lineEvent.deviceName}</td>
                </tr>
                <tr className="tr-table__row">
                  <th scope="row" className="tr-table__th tr-table__th--label">Route</th>
                  <td className="tr-table__td">{lineEvent.route}</td>
                </tr>
                {lineEvent.consumedInputs.map((ci) => (
                  <tr key={ci.slot} className="tr-table__row">
                    <th scope="row" className="tr-table__th tr-table__th--label">{ci.slot} / {ci.tray}</th>
                    <td className="tr-table__td">
                      {ci.sourceLiteral}
                      {ci.direct && <span className="tr-badge tr-badge--direct">direct</span>}
                      {ci.derived && <span className="tr-badge tr-badge--derived">derived</span>}
                    </td>
                  </tr>
                ))}
                {lineEvent.trigger && (
                  <tr className="tr-table__row">
                    <th scope="row" className="tr-table__th tr-table__th--label">Trigger</th>
                    <td className="tr-table__td">
                      {lineEvent.trigger.name} → {lineEvent.trigger.type}: {lineEvent.trigger.text}
                    </td>
                  </tr>
                )}
                <tr className="tr-table__row">
                  <th scope="row" className="tr-table__th tr-table__th--label">Surface</th>
                  <td className="tr-table__td tr-table__td--surface">{lineEvent.surface}</td>
                </tr>
              </tbody>
            </table>
          </section>
        )}

        {/* TAKES — store-backed; persists across panel navigation */}
        {takes.length > 0 && (
          <section className="tr-perf__section" aria-labelledby="takes-head">
            <div id="takes-head" className="tr-panel__section-head">
              TAKES
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                onClick={() => dispatch(clearTakes())}
              >
                Clear all
              </button>
            </div>
            <ul className="tr-takes" aria-label="Captured takes">
              {takes.map((take) => (
                <li key={take.id} className="tr-take">
                  <span className="tr-take__tick" aria-label={`Tick ${take.tick}`}>#{take.tick}</span>
                  <p className="tr-take__surface">{take.surface}</p>
                  <button
                    className="tr-btn tr-btn--ghost tr-btn--xs"
                    onClick={() => dispatch(removeTake(take.id))}
                    aria-label={`Remove take ${take.tick}`}
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
