import { useState, useRef, useEffect, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { recordEvent, start, pause, stop } from "../store/runtimeSlice.js";
import {
  captureTake, clearTakes, removeTake,
  keepTake, markRepair, clearRepair, pinTake, unpinTake, setTakeAnnotation,
} from "../store/takesSlice.js";
import { addProjectNote } from "../store/commands.js";
import {
  appendSurfaceRecord, clearSurface, selectLine, setFollowActive,
} from "../store/surfaceSlice.js";
import type { SurfaceRecord } from "../store/surfaceSlice.js";
import { generateEvent } from "@taroke/core";
import { uid } from "@taroke/core";
import type { TarokeEvent, LineEvent, RunState } from "@taroke/schema";
import type { Take } from "../store/takesSlice.js";

export function PerformancePanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const runState = useAppSelector((s) => s.runtime.runState);
  const status = useAppSelector((s) => s.runtime.status);
  const takes = useAppSelector((s) => s.takes.takes);
  const records = useAppSelector((s) => s.surface.records);
  const selectedIndex = useAppSelector((s) => s.surface.selectedIndex);
  const followActive = useAppSelector((s) => s.surface.followActive);

  const [cueEvent, setCueEvent] = useState<TarokeEvent | null>(null);
  const cueQueueRef = useRef<RunState["queue"]>([...runState.queue]);
  const surfaceQueueRef = useRef<RunState["queue"]>([...runState.queue]);
  const surfaceListRef = useRef<HTMLOListElement>(null);
  const [monitorOpen, setMonitorOpen] = useState(false);

  const retention = (project.surface as { retention?: number } | undefined)?.retention ?? 28;
  const speedMs = (project.surface as { speedMs?: number } | undefined)?.speedMs ?? 1200;

  function safeQueue(queue: RunState["queue"]): RunState["queue"] {
    const knownIds = new Set(project.lineDevices.map((d) => d.id));
    return queue.filter(
      (entry) => entry.type !== "device" || !entry.deviceId || knownIds.has(entry.deviceId),
    );
  }

  const doSurfaceGenerate = useCallback(() => {
    const state: Partial<RunState> = { ...runState, queue: safeQueue(surfaceQueueRef.current) };
    const ev = generateEvent(project, state);
    surfaceQueueRef.current = state.queue ?? [];
    dispatch(recordEvent(ev));
    if (ev.type === "line") {
      const le = ev as LineEvent;
      const rec: SurfaceRecord = {
        id: le.id,
        tick: le.tick,
        surface: le.surface,
        ...(le.deviceName ? { deviceName: le.deviceName } : {}),
        ...(le.route ? { route: le.route } : {}),
        ...(le.trace ? { trace: le.trace } : {}),
        ...(le.consumedInputs ? {
          consumedInputs: le.consumedInputs.map((ci) => ({
            slot: ci.slot,
            tray: ci.tray,
            sourceLiteral: ci.sourceLiteral,
            ...(ci.direct !== undefined ? { direct: ci.direct } : {}),
            ...(ci.derived !== undefined ? { derived: ci.derived } : {}),
          })),
        } : {}),
        ...(le.trigger ? {
          trigger: { name: le.trigger.name ?? "", type: le.trigger.type, text: le.trigger.text ?? "" },
        } : {}),
      };
      dispatch(appendSurfaceRecord(rec));
      // Auto-select the newly generated record so UNMIX appears immediately
      const nextIndex = records.length >= retention ? retention - 1 : records.length;
      dispatch(selectLine(nextIndex));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project, runState, dispatch, records.length, retention]);

  function doCueAudition() {
    const state: Partial<RunState> = { ...runState, queue: safeQueue(cueQueueRef.current) };
    const ev = generateEvent(project, state);
    cueQueueRef.current = state.queue ?? [];
    setCueEvent(ev);
  }

  // Timed playback: generate one event per speedMs when running
  useEffect(() => {
    if (status !== "running") return;
    const id = setInterval(doSurfaceGenerate, speedMs);
    return () => clearInterval(id);
  }, [status, speedMs, doSurfaceGenerate]);

  // Auto-scroll to bottom when follow is active and new records arrive
  useEffect(() => {
    if (!followActive || !surfaceListRef.current) return;
    surfaceListRef.current.scrollTop = surfaceListRef.current.scrollHeight;
  }, [records.length, followActive]);

  function handleSurfaceScroll() {
    const el = surfaceListRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    if (!atBottom && followActive) dispatch(setFollowActive(false));
  }

  function doCaptureTake(rec: SurfaceRecord) {
    dispatch(captureTake({
      id: `take_${Date.now()}_${rec.tick}`,
      tick: rec.tick,
      surface: rec.surface,
      trace: rec.trace ?? "",
      deviceName: rec.deviceName ?? "",
      route: rec.route ?? "",
    }));
  }

  function doKeepTake(take: Take) {
    dispatch(keepTake(take.id));
    dispatch(mutateProject(addProjectNote(project, {
      id: uid("note"),
      eventId: take.id,
      status: "kept",
      note: take.annotation,
      surface: take.surface,
      event: null,
      linkedTokenIds: [],
      linkedDeviceId: "",
      linkedStanzaId: "",
      updatedAt: new Date().toISOString(),
    })));
  }

  const cueLineEvent = cueEvent?.type === "line" ? (cueEvent as LineEvent) : null;
  const selectedRecord = selectedIndex !== null ? (records[selectedIndex] ?? null) : null;

  const currentScene = runState.currentScene
    ? (project.flowScenes.find((s) => s.id === runState.currentScene)?.name ?? runState.currentScene)
    : "—";
  const currentStanza = runState.currentStanza
    ? (project.stanzaPatterns.find((s) => s.id === runState.currentStanza)?.name ?? runState.currentStanza)
    : "—";

  return (
    <div className="tr-panel tr-panel--performance">

      {/* Compact MONITOR band — always visible, satisfies .tr-monitor + tick test */}
      <div className="tr-monitor" role="status" aria-label="Runtime state">
        <span className="tr-monitor__item">tick <strong>{runState.tick}</strong></span>
        <span className="tr-monitor__sep" aria-hidden="true">·</span>
        <span className="tr-monitor__item">scene <strong>{currentScene}</strong></span>
        <span className="tr-monitor__sep" aria-hidden="true">·</span>
        <span className="tr-monitor__item">pattern <strong>{currentStanza}</strong></span>
        <span className="tr-monitor__sep" aria-hidden="true">·</span>
        <span className="tr-monitor__item">queue <strong>{surfaceQueueRef.current.length}</strong></span>
        <span className="tr-monitor__sep" aria-hidden="true">·</span>
        <span className="tr-monitor__item">follow <strong>{followActive ? "on" : "suspended"}</strong></span>
      </div>

      <div className="tr-perf__body">

        {/* SURFACE — dominant left column with selectable records */}
        <section className="tr-perf__surface-col" aria-labelledby="surface-head">
          <div className="tr-panel__section-head" id="surface-head">
            SURFACE
            <div className="tr-panel__section-actions">
              <button
                className="tr-btn tr-btn--primary tr-surface__generate"
                onClick={doSurfaceGenerate}
                aria-label="Surface: generate and record next event"
              >
                Generate
              </button>
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                onClick={() => dispatch(clearSurface())}
                aria-label="Clear surface history"
              >
                Clear
              </button>
            </div>
          </div>
          {!followActive && (
            <div className="tr-surface__follow-bar">
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                onClick={() => dispatch(setFollowActive(true))}
                aria-label="Resume follow"
              >
                Resume follow ↓
              </button>
            </div>
          )}
          <ol
            className="tr-surface"
            aria-label="Surface output stream"
            aria-live="polite"
            ref={surfaceListRef}
            onScroll={handleSurfaceScroll}
          >
            {records.length === 0 ? (
              <li className="tr-panel__empty" role="listitem">Generate events to see surface output.</li>
            ) : (
              records.map((rec, i) => (
                <li
                  key={rec.id}
                  className={["tr-surface__line", selectedIndex === i ? "tr-surface__line--selected" : ""].filter(Boolean).join(" ")}
                  onClick={() => dispatch(selectLine(selectedIndex === i ? null : i))}
                  aria-selected={selectedIndex === i}
                  role="option"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      dispatch(selectLine(selectedIndex === i ? null : i));
                    }
                  }}
                >
                  {rec.surface}
                </li>
              ))
            )}
          </ol>
        </section>

        {/* CUE · PRIVATE — compact right column, never writes to Surface */}
        <section className="tr-perf__cue-col" aria-labelledby="cue-head">
          <div className="tr-panel__section-head" id="cue-head">CUE · PRIVATE</div>
          <button
            className="tr-btn tr-btn--ghost tr-cue__generate"
            onClick={doCueAudition}
            aria-label="Audition next event (private, not recorded)"
          >
            Audition
          </button>
          {cueEvent && (
            <div
              className={["tr-cue__output", cueEvent.type === "breath" ? "tr-cue__output--breath" : ""].filter(Boolean).join(" ")}
              aria-live="polite"
              aria-atomic="true"
            >
              {cueEvent.type === "breath" ? (
                <span className="tr-cue__breath" role="status">— breath —</span>
              ) : cueLineEvent ? (
                <p className="tr-cue__line">{cueLineEvent.surface}</p>
              ) : null}
            </div>
          )}
        </section>
      </div>

      {/* MONITOR — expandable detail section */}
      <section className="tr-perf__section" aria-labelledby="monitor-head">
        <div className="tr-panel__section-head" id="monitor-head">
          MONITOR
          <button
            className="tr-btn tr-btn--ghost tr-btn--sm"
            aria-controls="tr-monitor-body"
            aria-expanded={monitorOpen}
            onClick={() => setMonitorOpen((o) => !o)}
            aria-label={monitorOpen ? "Collapse monitor" : "Expand monitor"}
          >
            {monitorOpen ? "Hide details" : "Details"}
          </button>
        </div>
        {monitorOpen && (
          <div id="tr-monitor-body" className="tr-monitor__detail">
            <table className="tr-table tr-table--monitor" aria-label="Runtime monitor">
              <tbody>
                <tr className="tr-table__row">
                  <th scope="row" className="tr-table__th tr-table__th--label">Tick</th>
                  <td className="tr-table__td">{runState.tick}</td>
                </tr>
                <tr className="tr-table__row">
                  <th scope="row" className="tr-table__th tr-table__th--label">Status</th>
                  <td className="tr-table__td">{status}</td>
                </tr>
                <tr className="tr-table__row">
                  <th scope="row" className="tr-table__th tr-table__th--label">Scene</th>
                  <td className="tr-table__td">{runState.currentScene ?? "—"}</td>
                </tr>
                <tr className="tr-table__row">
                  <th scope="row" className="tr-table__th tr-table__th--label">Pattern</th>
                  <td className="tr-table__td">{runState.currentStanza ?? "—"}</td>
                </tr>
                <tr className="tr-table__row">
                  <th scope="row" className="tr-table__th tr-table__th--label">Queue</th>
                  <td className="tr-table__td">{runState.queue?.length ?? 0} events</td>
                </tr>
                <tr className="tr-table__row">
                  <th scope="row" className="tr-table__th tr-table__th--label">Follow</th>
                  <td className="tr-table__td">{followActive ? "active" : "suspended"}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* UNMIX — provenance for selected Surface record (not latest event) */}
      {selectedRecord && (
        <section className="tr-perf__unmix" aria-labelledby="unmix-head">
          <div className="tr-panel__section-head" id="unmix-head">
            UNMIX
            <button
              className="tr-btn tr-btn--ghost tr-btn--sm"
              onClick={() => doCaptureTake(selectedRecord)}
              aria-label="Capture current event as a Take"
            >
              Capture Take
            </button>
          </div>
          <div className="tr-unmix" role="table" aria-label="Event trace">
            {selectedRecord.deviceName && (
              <div className="tr-unmix__row" role="row">
                <span className="tr-unmix__label" role="rowheader">Device</span>
                <span className="tr-unmix__value" role="cell">{selectedRecord.deviceName}</span>
              </div>
            )}
            {selectedRecord.route && (
              <div className="tr-unmix__row" role="row">
                <span className="tr-unmix__label" role="rowheader">Route</span>
                <span className="tr-unmix__value" role="cell">{selectedRecord.route}</span>
              </div>
            )}
            {selectedRecord.consumedInputs?.map((ci) => (
              <div key={ci.slot} className="tr-unmix__row" role="row">
                <span className="tr-unmix__label" role="rowheader">{ci.slot} / {ci.tray}</span>
                <span className="tr-unmix__value" role="cell">
                  {ci.sourceLiteral}
                  {ci.direct && <span className="tr-badge tr-badge--direct"> direct</span>}
                  {ci.derived && <span className="tr-badge tr-badge--derived"> derived</span>}
                </span>
              </div>
            ))}
            {selectedRecord.trigger && (
              <div className="tr-unmix__row" role="row">
                <span className="tr-unmix__label" role="rowheader">Trigger</span>
                <span className="tr-unmix__value" role="cell">
                  {selectedRecord.trigger.name} → {selectedRecord.trigger.type}: {selectedRecord.trigger.text}
                </span>
              </div>
            )}
            <div className="tr-unmix__row tr-unmix__row--final" role="row">
              <span className="tr-unmix__label" role="rowheader">Final</span>
              <span className="tr-unmix__value tr-unmix__value--final" role="cell">{selectedRecord.surface}</span>
            </div>
          </div>
        </section>
      )}

      {/* TAKES — always shown, with full state machine */}
      <section className="tr-perf__takes" aria-labelledby="takes-head">
        <div className="tr-panel__section-head" id="takes-head">
          TAKES
          {takes.length > 0 && (
            <button
              className="tr-btn tr-btn--ghost tr-btn--sm"
              aria-label="Clear all takes"
              onClick={() => dispatch(clearTakes())}
            >
              Clear all
            </button>
          )}
        </div>
        {takes.length === 0 ? (
          <p className="tr-panel__empty">Capture a take from UNMIX.</p>
        ) : (
          <ul className="tr-takes" aria-label="Captured takes">
            {takes.map((take) => (
              <li key={take.id} className={["tr-take", `tr-take--${take.state}`].join(" ")}>
                <div className="tr-take__header">
                  <span className="tr-take__tick" aria-label={`Tick ${take.tick}`}>#{take.tick}</span>
                  <span className="tr-take__state-badge" aria-label={`State: ${take.state}`}>{take.state}</span>
                  <span className="tr-take__device">{take.deviceName}</span>
                  <button
                    className="tr-btn tr-btn--ghost tr-btn--sm"
                    onClick={() => dispatch(removeTake(take.id))}
                    aria-label={`Remove take ${take.tick}`}
                  >
                    Remove take
                  </button>
                </div>
                <p className="tr-take__surface">{take.surface}</p>
                <div className="tr-take__controls" role="group" aria-label="Take actions">
                  {take.state !== "kept" && take.state !== "pinned" && (
                    <button
                      className="tr-btn tr-btn--ghost tr-btn--sm"
                      onClick={() => doKeepTake(take)}
                      aria-label="Keep this take"
                    >
                      Keep
                    </button>
                  )}
                  {take.state === "kept" || take.state === "captured" ? (
                    <button
                      className="tr-btn tr-btn--ghost tr-btn--sm"
                      onClick={() => dispatch(markRepair(take.id))}
                      aria-label="Mark for repair"
                    >
                      Repair
                    </button>
                  ) : take.state === "repair" ? (
                    <button
                      className="tr-btn tr-btn--ghost tr-btn--sm"
                      onClick={() => dispatch(clearRepair(take.id))}
                      aria-label="Clear repair flag"
                    >
                      Clear repair
                    </button>
                  ) : null}
                  {take.state !== "pinned" ? (
                    <button
                      className="tr-btn tr-btn--ghost tr-btn--sm"
                      onClick={() => dispatch(pinTake(take.id))}
                      aria-label="Pin this take"
                    >
                      Pin
                    </button>
                  ) : (
                    <button
                      className="tr-btn tr-btn--ghost tr-btn--sm"
                      onClick={() => dispatch(unpinTake(take.id))}
                      aria-label="Unpin this take"
                    >
                      Unpin
                    </button>
                  )}
                </div>
                <input
                  className="tr-input tr-take__annotation"
                  type="text"
                  placeholder="Annotation…"
                  value={take.annotation}
                  onChange={(e) => dispatch(setTakeAnnotation({ id: take.id, annotation: e.target.value }))}
                  aria-label={`Annotation for take ${take.tick}`}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
