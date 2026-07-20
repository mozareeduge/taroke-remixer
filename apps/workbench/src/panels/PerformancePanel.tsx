import { useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { recordEvent } from "../store/runtimeSlice.js";
import {
  captureTake, clearTakes, removeTake,
  keepTake, markRepair, clearRepair, pinTake, unpinTake, setTakeAnnotation,
} from "../store/takesSlice.js";
import { addProjectNote } from "../store/commands.js";
import { appendSurfaceLine, clearSurface } from "../store/surfaceSlice.js";
import { generateEvent } from "@taroke/core";
import { uid } from "@taroke/core";
import type { TarokeEvent, LineEvent, RunState } from "@taroke/schema";
import type { Take } from "../store/takesSlice.js";

export function PerformancePanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const runState = useAppSelector((s) => s.runtime.runState);
  const takes = useAppSelector((s) => s.takes.takes);
  const surfaceLines = useAppSelector((s) => s.surface.lines);

  const [cueEvent, setCueEvent] = useState<TarokeEvent | null>(null);
  const cueQueueRef = useRef<RunState["queue"]>([...runState.queue]);

  const [surfaceEvent, setSurfaceEvent] = useState<TarokeEvent | null>(null);
  const surfaceQueueRef = useRef<RunState["queue"]>([...runState.queue]);

  const [followSurface, setFollowSurface] = useState(true);

  function safeQueue(queue: RunState["queue"]): RunState["queue"] {
    const knownIds = new Set(project.lineDevices.map((d) => d.id));
    return queue.filter(
      (entry) => entry.type !== "device" || !entry.deviceId || knownIds.has(entry.deviceId),
    );
  }

  function doCueAudition() {
    const state: Partial<RunState> = { ...runState, queue: safeQueue(cueQueueRef.current) };
    const ev = generateEvent(project, state);
    cueQueueRef.current = state.queue ?? [];
    setCueEvent(ev);
  }

  function doSurfaceGenerate() {
    const state: Partial<RunState> = { ...runState, queue: safeQueue(surfaceQueueRef.current) };
    const ev = generateEvent(project, state);
    surfaceQueueRef.current = state.queue ?? [];
    dispatch(recordEvent(ev));
    setSurfaceEvent(ev);
    if (ev.type === "line" && ev.surface) {
      dispatch(appendSurfaceLine(ev.surface));
    }
  }

  function doCaptureTake() {
    if (!surfaceEvent || surfaceEvent.type !== "line") return;
    const ev = surfaceEvent as LineEvent;
    dispatch(captureTake({
      id: `take_${Date.now()}`,
      tick: ev.tick,
      surface: ev.surface,
      trace: ev.trace,
      deviceName: ev.deviceName,
      route: ev.route,
      ...(ev.trigger ? { preTrigger: ev.surface, triggerText: ev.trigger.text } : {}),
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
  const surfaceLineEvent = surfaceEvent?.type === "line" ? (surfaceEvent as LineEvent) : null;

  const currentScene = runState.currentScene
    ? (project.flowScenes.find((s) => s.id === runState.currentScene)?.name ?? runState.currentScene)
    : "—";
  const currentStanza = runState.currentStanza
    ? (project.stanzaPatterns.find((s) => s.id === runState.currentStanza)?.name ?? runState.currentStanza)
    : "—";

  return (
    <div className="tr-panel tr-panel--performance">

      {/* MONITOR — compact status band */}
      <div className="tr-monitor" role="status" aria-label="Runtime state">
        <span className="tr-monitor__item">tick <strong>{runState.tick}</strong></span>
        <span className="tr-monitor__sep" aria-hidden="true">·</span>
        <span className="tr-monitor__item">scene <strong>{currentScene}</strong></span>
        <span className="tr-monitor__sep" aria-hidden="true">·</span>
        <span className="tr-monitor__item">pattern <strong>{currentStanza}</strong></span>
        <span className="tr-monitor__sep" aria-hidden="true">·</span>
        <span className="tr-monitor__item">queue <strong>{runState.queue.length}</strong></span>
        <label className="tr-monitor__follow">
          <input
            type="checkbox"
            checked={followSurface}
            onChange={(e) => setFollowSurface(e.target.checked)}
            aria-label="Follow surface output"
          />
          {" "}follow
        </label>
      </div>

      <div className="tr-perf__body">

        {/* SURFACE — dominant left column */}
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
          <div
            className="tr-surface"
            aria-live={followSurface ? "polite" : "off"}
            aria-label="Surface output stream"
            data-follow={followSurface}
          >
            {surfaceLines.length === 0 ? (
              <p className="tr-panel__empty">Generate events to see surface output.</p>
            ) : (
              surfaceLines.map((line: string, i: number) => (
                <p key={i} className="tr-surface__line">{line}</p>
              ))
            )}
          </div>
        </section>

        {/* CUE · PRIVATE — compact right column */}
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

      {/* UNMIX — cause-to-result for most recent surface event */}
      {surfaceLineEvent && (
        <section className="tr-perf__unmix" aria-labelledby="unmix-head">
          <div className="tr-panel__section-head" id="unmix-head">
            UNMIX
            <button
              className="tr-btn tr-btn--ghost tr-btn--sm"
              onClick={doCaptureTake}
              aria-label="Capture current event as a Take"
            >
              Capture Take
            </button>
          </div>
          <div className="tr-unmix" role="table" aria-label="Event trace">
            {surfaceLineEvent.stanzaId && (
              <div className="tr-unmix__row" role="row">
                <span className="tr-unmix__label" role="rowheader">Pattern</span>
                <span className="tr-unmix__value" role="cell">
                  {project.stanzaPatterns.find((s) => s.id === surfaceLineEvent.stanzaId)?.name ?? surfaceLineEvent.stanzaId}
                </span>
              </div>
            )}
            {surfaceLineEvent.slotLabel && (
              <div className="tr-unmix__row" role="row">
                <span className="tr-unmix__label" role="rowheader">Slot</span>
                <span className="tr-unmix__value" role="cell">{surfaceLineEvent.slotLabel}</span>
              </div>
            )}
            <div className="tr-unmix__row" role="row">
              <span className="tr-unmix__label" role="rowheader">Device</span>
              <span className="tr-unmix__value" role="cell">{surfaceLineEvent.deviceName}</span>
            </div>
            <div className="tr-unmix__row" role="row">
              <span className="tr-unmix__label" role="rowheader">Route</span>
              <span className="tr-unmix__value" role="cell">{surfaceLineEvent.route}</span>
            </div>
            {surfaceLineEvent.consumedInputs.map((ci) => (
              <div key={ci.slot} className="tr-unmix__row" role="row">
                <span className="tr-unmix__label" role="rowheader">{ci.slot} / {ci.tray}</span>
                <span className="tr-unmix__value" role="cell">
                  {ci.sourceLiteral}
                  {ci.direct && <span className="tr-badge tr-badge--direct"> direct</span>}
                  {ci.derived && <span className="tr-badge tr-badge--derived"> derived</span>}
                </span>
              </div>
            ))}
            {surfaceLineEvent.trigger && (
              <div className="tr-unmix__row" role="row">
                <span className="tr-unmix__label" role="rowheader">Trigger</span>
                <span className="tr-unmix__value" role="cell">
                  {surfaceLineEvent.trigger.name} → {surfaceLineEvent.trigger.type}: {surfaceLineEvent.trigger.text}
                </span>
              </div>
            )}
            <div className="tr-unmix__row tr-unmix__row--final" role="row">
              <span className="tr-unmix__label" role="rowheader">Final</span>
              <span className="tr-unmix__value tr-unmix__value--final" role="cell">{surfaceLineEvent.surface}</span>
            </div>
          </div>
        </section>
      )}

      {/* TAKES — with state machine controls */}
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
