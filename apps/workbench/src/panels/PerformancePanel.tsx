import { useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { recordEvent } from "../store/runtimeSlice.js";
import { generateEvent } from "@taroke/core";
import type { TarokeEvent, LineEvent, RunState } from "@taroke/schema";

interface Take {
  id: string;
  tick: number;
  surface: string;
  trace: string;
}

export function PerformancePanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const runState = useAppSelector((s) => s.runtime.runState);

  const [surfaceLines, setSurfaceLines] = useState<string[]>([]);
  const [currentEvent, setCurrentEvent] = useState<TarokeEvent | null>(null);
  const [takes, setTakes] = useState<Take[]>([]);
  const localRunState = useRef<Partial<RunState>>({ ...runState, queue: [...runState.queue] });

  function doGenerate() {
    const state = localRunState.current;
    const ev = generateEvent(project, state);
    state.tick = (state.tick ?? 0) + 1;
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
    setTakes((prev) => [
      ...prev,
      { id: `take_${Date.now()}`, tick: ev.tick, surface: ev.surface, trace: ev.trace },
    ]);
  }

  const lineEvent = currentEvent?.type === "line" ? (currentEvent as LineEvent) : null;

  return (
    <div className="tr-panel tr-panel--performance">
      <div className="tr-panel__main">

        {/* CUE */}
        <div className="tr-perf__section">
          <div className="tr-panel__section-head">CUE</div>
          <div className="tr-cue">
            <button className="tr-btn tr-btn--primary tr-cue__generate" onClick={doGenerate}>
              Generate ▶
            </button>
            {currentEvent && (
              <div className={["tr-cue__output", currentEvent.type === "breath" ? "tr-cue__output--breath" : ""].filter(Boolean).join(" ")}>
                {currentEvent.type === "breath" ? (
                  <span className="tr-cue__breath">— breath —</span>
                ) : lineEvent ? (
                  <p className="tr-cue__line">{lineEvent.surface}</p>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* SURFACE */}
        <div className="tr-perf__section">
          <div className="tr-panel__section-head">
            SURFACE
            <button className="tr-btn tr-btn--ghost tr-btn--sm" onClick={() => setSurfaceLines([])}>Clear</button>
          </div>
          <div className="tr-surface" aria-live="polite" aria-label="Surface output">
            {surfaceLines.length === 0 ? (
              <p className="tr-panel__empty">Generate events to see surface output.</p>
            ) : (
              surfaceLines.map((line, i) => (
                <p key={i} className="tr-surface__line">{line}</p>
              ))
            )}
          </div>
        </div>

        {/* UNMIX */}
        {lineEvent && (
          <div className="tr-perf__section">
            <div className="tr-panel__section-head">
              UNMIX
              <button className="tr-btn tr-btn--ghost tr-btn--sm" onClick={doCaptureTake}>
                Capture Take
              </button>
            </div>
            <table className="tr-table tr-table--unmix">
              <tbody>
                <tr className="tr-table__row">
                  <th className="tr-table__th tr-table__th--label">Device</th>
                  <td className="tr-table__td">{lineEvent.deviceName}</td>
                </tr>
                <tr className="tr-table__row">
                  <th className="tr-table__th tr-table__th--label">Route</th>
                  <td className="tr-table__td">{lineEvent.route}</td>
                </tr>
                {lineEvent.consumedInputs.map((ci) => (
                  <tr key={ci.slot} className="tr-table__row">
                    <th className="tr-table__th tr-table__th--label">{ci.slot} / {ci.tray}</th>
                    <td className="tr-table__td">
                      {ci.sourceLiteral}
                      {ci.direct && <span className="tr-badge tr-badge--direct">direct</span>}
                      {ci.derived && <span className="tr-badge tr-badge--derived">derived</span>}
                    </td>
                  </tr>
                ))}
                {lineEvent.trigger && (
                  <tr className="tr-table__row">
                    <th className="tr-table__th tr-table__th--label">Trigger</th>
                    <td className="tr-table__td">
                      {lineEvent.trigger.name} → {lineEvent.trigger.type}: {lineEvent.trigger.text}
                    </td>
                  </tr>
                )}
                <tr className="tr-table__row">
                  <th className="tr-table__th tr-table__th--label">Surface</th>
                  <td className="tr-table__td tr-table__td--surface">{lineEvent.surface}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {/* TAKES */}
        {takes.length > 0 && (
          <div className="tr-perf__section">
            <div className="tr-panel__section-head">
              TAKES
              <button className="tr-btn tr-btn--ghost tr-btn--sm" onClick={() => setTakes([])}>Clear</button>
            </div>
            <div className="tr-takes">
              {takes.map((take) => (
                <div key={take.id} className="tr-take">
                  <span className="tr-take__tick">#{take.tick}</span>
                  <p className="tr-take__surface">{take.surface}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
