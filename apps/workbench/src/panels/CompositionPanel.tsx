import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { selectStanza, selectScene, selectDevice } from "../store/selectionSlice.js";
import { setActivePanel } from "../store/editorSlice.js";
import { announce } from "../store/feedbackSlice.js";
import { ConfirmInline } from "../shell/ConfirmInline.js";
import { useMediaQuery } from "../shell/useMediaQuery.js";
import {
  addStanzaPattern, toggleStanzaEnabled,
  addStanzaSlot, removeStanzaSlot, reorderStanzaSlots, setSlotChance, setSlotRepeat,
  addFlowScene, removeFlowScene, toggleSceneEnabled, setSceneChance,
  safeRemoveStanzaPattern, isBlocked,
} from "../store/commands.js";
import { expandStanza } from "@taroke/core";
import { uid } from "@taroke/core";
import type { StanzaSlot, QueueEntry } from "@taroke/schema";

/** Below this width a slot row (drag grip, index, label, chance, repeat,
 * actions) cannot carry touch-sized controls without compressing itself
 * into an unreadable strip — slots become cards instead, mirroring the
 * Materials sample-card treatment (SHELL-09). */
const COMPACT_QUERY = "(max-width: 699px)";

export function CompositionPanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const primary = useAppSelector((s) => s.selection.primary);
  const isCompact = useMediaQuery(COMPACT_QUERY);

  const stanzas = project.stanzaPatterns ?? [];
  const scenes = project.flowScenes ?? [];
  const devices = project.lineDevices ?? [];

  const activeStanzaId = primary?.type === "stanza" ? primary.stanzaId : stanzas[0]?.id ?? null;
  const activeStanza = stanzas.find((s) => s.id === activeStanzaId) ?? null;

  const [newStanzaName, setNewStanzaName] = useState("");
  const [newSceneName, setNewSceneName] = useState("");
  const [actionsMenuFor, setActionsMenuFor] = useState<string | null>(null);
  const [pendingRemoveSlotId, setPendingRemoveSlotId] = useState<string | null>(null);
  const [pendingRemovePattern, setPendingRemovePattern] = useState(false);
  const [pendingRemoveSceneId, setPendingRemoveSceneId] = useState<string | null>(null);
  const [removePatternError, setRemovePatternError] = useState<string | null>(null);
  const [resolution, setResolution] = useState<QueueEntry[] | null>(null);

  // ── Pointer drag state (desktop rows only — the Actions menu below is the
  // single keyboard/touch-safe reorder path, so drag and menu never compete
  // for the same gesture). ─────────────────────────────────────────────────
  const [dragFromIdx, setDragFromIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  const trimmedStanzaName = newStanzaName.trim();
  const canAddStanza = trimmedStanzaName.length > 0;
  const addStanzaReason = canAddStanza ? "" : "Enter a pattern name";

  function doAddStanza() {
    if (!canAddStanza) return;
    const stanza = {
      id: uid("st"),
      name: trimmedStanzaName,
      enabled: true,
      description: "",
      slots: [],
    };
    dispatch(mutateProject(addStanzaPattern(project, stanza)));
    dispatch(selectStanza(stanza.id));
    dispatch(announce(`Added pattern "${trimmedStanzaName}".`));
    setNewStanzaName("");
  }

  const trimmedSceneName = newSceneName.trim();
  const canAddScene = trimmedSceneName.length > 0 && Boolean(activeStanzaId);
  const addSceneReason = !activeStanzaId
    ? "Select a pattern first"
    : trimmedSceneName.length === 0
    ? "Enter a scene name"
    : "";

  function doAddScene() {
    if (!canAddScene || !activeStanzaId) return;
    const scene = {
      id: uid("sc"),
      name: trimmedSceneName,
      stanzaId: activeStanzaId,
      enabled: true,
      chance: 100,
      mode: "loop",
    };
    dispatch(mutateProject(addFlowScene(project, scene)));
    dispatch(announce(`Added scene "${trimmedSceneName}".`));
    setNewSceneName("");
  }

  function doAddBreathSlot() {
    if (!activeStanzaId) return;
    dispatch(mutateProject(addStanzaSlot(project, activeStanzaId, { id: uid("slot"), type: "breath", label: "BREATH", repeat: "once", chance: 100 })));
    setResolution(null);
  }

  function doAddDeviceSlot(deviceId: string, deviceName: string) {
    if (!activeStanzaId) return;
    dispatch(mutateProject(addStanzaSlot(project, activeStanzaId, { id: uid("slot"), type: "device", deviceId, label: deviceName, repeat: "once", chance: 100 })));
    setResolution(null);
  }

  function moveSlotTo(slotId: string, toIndex: number) {
    if (!activeStanza) return;
    const ids = activeStanza.slots.map((s) => s.id);
    const fromIdx = ids.indexOf(slotId);
    if (fromIdx < 0) return;
    const clamped = Math.max(0, Math.min(toIndex, ids.length - 1));
    if (fromIdx === clamped) return;
    ids.splice(fromIdx, 1);
    ids.splice(clamped, 0, slotId);
    dispatch(mutateProject(reorderStanzaSlots(project, activeStanza.id, ids)));
    setActionsMenuFor(null);
    setResolution(null);
  }

  // ── Pointer drag handlers (desktop direct manipulation) ──────────────────

  function onDragStart(i: number) {
    setDragFromIdx(i);
    setActionsMenuFor(null);
  }
  function onDragOver(e: React.DragEvent, i: number) {
    e.preventDefault();
    setDragOverIdx(i);
  }
  function onDrop(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragFromIdx === null || dragFromIdx === i || !activeStanza) {
      setDragFromIdx(null);
      setDragOverIdx(null);
      return;
    }
    const ids = activeStanza.slots.map((s) => s.id);
    const moved = ids[dragFromIdx];
    if (!moved) { setDragFromIdx(null); setDragOverIdx(null); return; }
    ids.splice(dragFromIdx, 1);
    ids.splice(i, 0, moved);
    dispatch(mutateProject(reorderStanzaSlots(project, activeStanza.id, ids)));
    setDragFromIdx(null);
    setDragOverIdx(null);
    setResolution(null);
  }
  function onDragEnd() {
    setDragFromIdx(null);
    setDragOverIdx(null);
  }

  function requestRemoveSlot(slotId: string) {
    setActionsMenuFor(null);
    setPendingRemoveSlotId(slotId);
  }
  function confirmRemoveSlot(slotId: string, label: string) {
    if (!activeStanza) return;
    dispatch(mutateProject(removeStanzaSlot(project, activeStanza.id, slotId)));
    dispatch(announce(`Removed slot "${label}".`));
    setPendingRemoveSlotId(null);
    setResolution(null);
  }

  function requestRemoveScene(sceneId: string) {
    setPendingRemoveSceneId(sceneId);
  }
  function confirmRemoveScene(sceneId: string, name: string) {
    dispatch(mutateProject(removeFlowScene(project, sceneId)));
    dispatch(announce(`Removed scene "${name}".`));
    setPendingRemoveSceneId(null);
  }

  function doRemovePattern() {
    if (!activeStanza) return;
    const result = safeRemoveStanzaPattern(project, activeStanza.id);
    if (isBlocked(result)) {
      setRemovePatternError(`Cannot remove: ${result.reason} (${result.dependents.join(", ")})`);
      setPendingRemovePattern(false);
    } else {
      setRemovePatternError(null);
      dispatch(mutateProject(result));
      dispatch(announce(`Removed pattern "${activeStanza.name}".`));
      setPendingRemovePattern(false);
    }
  }

  function doPreviewResolution() {
    if (!activeStanza) return;
    setResolution(expandStanza(project, activeStanza.id, Math.random));
  }

  const displaySlots: StanzaSlot[] = activeStanza ? activeStanza.slots : [];
  const activeScenes = activeStanza ? scenes.filter((sc) => sc.stanzaId === activeStanza.id) : [];

  function renderSlotActionsMenu(slot: StanzaSlot, idx: number) {
    return (
      <div className="tr-move-menu-wrap">
        <button
          className="tr-btn tr-btn--ghost tr-btn--sm"
          aria-label={`Actions for slot ${slot.label}`}
          aria-haspopup="true"
          aria-expanded={actionsMenuFor === slot.id}
          onClick={() => setActionsMenuFor(actionsMenuFor === slot.id ? null : slot.id)}
        >
          Actions ···
        </button>
        {actionsMenuFor === slot.id && (
          <div className="tr-move-menu" role="menu" aria-label={`Actions for slot ${slot.label}`}>
            <button role="menuitem" className="tr-move-menu__item" disabled={idx === 0}
              onClick={() => moveSlotTo(slot.id, 0)}>Move to start</button>
            <button role="menuitem" className="tr-move-menu__item" disabled={idx === 0}
              onClick={() => moveSlotTo(slot.id, idx - 1)}>Move earlier</button>
            <button role="menuitem" className="tr-move-menu__item" disabled={idx === displaySlots.length - 1}
              onClick={() => moveSlotTo(slot.id, idx + 1)}>Move later</button>
            <button role="menuitem" className="tr-move-menu__item" disabled={idx === displaySlots.length - 1}
              onClick={() => moveSlotTo(slot.id, displaySlots.length - 1)}>Move to end</button>
            <div className="tr-move-menu__sep" role="separator" />
            <button role="menuitem" className="tr-move-menu__item tr-move-menu__item--danger"
              onClick={() => requestRemoveSlot(slot.id)}>Remove slot</button>
          </div>
        )}
      </div>
    );
  }

  // E5/DS-INS-09: a slot referencing a disabled device is a silent no-op at
  // runtime unless the disabled state is surfaced right where it's authored.
  function goEnableDevice(deviceId: string) {
    dispatch(selectDevice(deviceId));
    dispatch(setActivePanel("instruments"));
  }

  function renderDeviceOffBadge(slot: StanzaSlot) {
    if (slot.type !== "device" || !slot.deviceId) return null;
    const device = devices.find((d) => d.id === slot.deviceId);
    if (!device || device.enabled) return null;
    return (
      <span className="tr-slot__device-off">
        <span className="tr-badge tr-badge--warn" aria-label={`${slot.label}: device off`}>DEVICE OFF</span>
        <button
          type="button"
          className="tr-btn tr-btn--ghost tr-btn--sm"
          onClick={() => goEnableDevice(slot.deviceId!)}
        >
          Enable in Instruments
        </button>
      </span>
    );
  }

  function renderConfirmRemoveSlot(slot: StanzaSlot) {
    if (pendingRemoveSlotId !== slot.id) return null;
    return (
      <ConfirmInline
        message={`Remove slot "${slot.label}" from this pattern?`}
        onCancel={() => setPendingRemoveSlotId(null)}
        onConfirm={() => confirmRemoveSlot(slot.id, slot.label)}
      />
    );
  }

  return (
    <div className="tr-panel tr-panel--composition">
      <div className="tr-panel__sidebar">
        <div className="tr-panel__section-head">PATTERNS</div>
        <ul className="tr-list" role="list">
          {stanzas.map((st) => (
            <li key={st.id} className="tr-list__item">
              <button
                className={["tr-list__btn", activeStanzaId === st.id ? "tr-list__btn--active" : ""].filter(Boolean).join(" ")}
                onClick={() => dispatch(selectStanza(st.id))}
                aria-current={activeStanzaId === st.id ? "true" : undefined}
              >
                <span className="tr-list__label">{st.name}</span>
                <span className={["tr-list__badge", st.enabled ? "tr-list__badge--on" : "tr-list__badge--off"].join(" ")}>
                  {st.enabled ? "ON" : "OFF"}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="tr-panel__add-row">
          <input
            className="tr-input tr-input--sm"
            placeholder="Pattern name"
            value={newStanzaName}
            onChange={(e) => setNewStanzaName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") doAddStanza(); }}
            aria-label="New pattern name"
          />
          <button
            className="tr-btn tr-btn--ghost"
            onClick={doAddStanza}
            disabled={!canAddStanza}
            aria-disabled={!canAddStanza}
            title={addStanzaReason || undefined}
          >
            + Pattern
          </button>
        </div>
      </div>

      <div className="tr-panel__main">
        {activeStanza ? (
          <>
            <div className="tr-panel__section-head">
              {activeStanza.name}
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                onClick={() => dispatch(mutateProject(toggleStanzaEnabled(project, activeStanza.id)))}
                aria-label={`${activeStanza.enabled ? "Disable" : "Enable"} ${activeStanza.name}`}
              >
                {activeStanza.enabled ? "Enabled" : "Disabled"}
              </button>
              {!pendingRemovePattern ? (
                <button
                  className="tr-btn tr-btn--ghost tr-btn--sm"
                  onClick={() => setPendingRemovePattern(true)}
                  aria-label={`Remove ${activeStanza.name}`}
                >
                  Remove
                </button>
              ) : (
                <ConfirmInline
                  message={`Remove pattern "${activeStanza.name}"?`}
                  onCancel={() => setPendingRemovePattern(false)}
                  onConfirm={doRemovePattern}
                />
              )}
              {removePatternError && (
                <span className="tr-error" role="alert">{removePatternError}</span>
              )}
            </div>

            <div className="tr-panel__section-head tr-panel__subsection-head">
              PATTERN SCORE
              <span className="tr-panel__section-meta">the authored slot sequence — what plays, in what order</span>
              <div className="tr-panel__section-actions">
                <button
                  className="tr-btn tr-btn--ghost tr-btn--sm"
                  onClick={doPreviewResolution}
                  disabled={displaySlots.length === 0}
                  aria-disabled={displaySlots.length === 0}
                  aria-label="Preview one resolution of this pattern's chance and repeat rules"
                >
                  Preview resolution
                </button>
              </div>
            </div>

            {resolution && (
              <div className="tr-score-preview" role="status" aria-label="Pattern resolution preview">
                <p className="tr-score-preview__note">
                  One possible resolution — chance and repeat are re-rolled each time this pattern plays.
                </p>
                {resolution.length === 0 ? (
                  <p className="tr-panel__empty">Every slot rolled below its chance this time — nothing resolved.</p>
                ) : (
                  <ol className="tr-score-preview__list">
                    {resolution.map((entry, i) => (
                      <li key={i} className="tr-score-preview__item">
                        {entry.type === "breath" ? "BREATH" : entry.label}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            )}

            {displaySlots.length === 0 ? (
              <p className="tr-panel__empty">No slots yet — add BREATH or a device below to begin the pattern.</p>
            ) : isCompact ? (
              <ul className="tr-slots tr-slots--cards" aria-label="Pattern slots">
                {displaySlots.map((slot, i) => (
                  <li key={slot.id} className="tr-slot tr-slot--card" data-slot-id={slot.id}>
                    <div className="tr-slot__card-main">
                      <span className="tr-slot__index">{i + 1}</span>
                      <span className="tr-slot__type">{slot.type === "breath" ? "BREATH" : slot.label}</span>
                      {renderDeviceOffBadge(slot)}
                    </div>
                    <div className="tr-slot__card-fields">
                      <label className="tr-slot__field-label">
                        Chance
                        <input
                          type="number"
                          className="tr-input tr-input--num"
                          value={slot.chance}
                          min={0}
                          max={100}
                          onChange={(e) => dispatch(mutateProject(setSlotChance(project, activeStanza!.id, slot.id, Number(e.target.value))))}
                          aria-label={`Chance for slot ${slot.label}`}
                        />
                      </label>
                      <label className="tr-slot__field-label">
                        Repeat
                        <select
                          className="tr-select tr-select--sm"
                          value={slot.repeat}
                          onChange={(e) => dispatch(mutateProject(setSlotRepeat(project, activeStanza!.id, slot.id, e.target.value as "once" | "loop")))}
                          aria-label={`Repeat for slot ${slot.label}`}
                        >
                          <option value="once">once</option>
                          <option value="loop">loop</option>
                        </select>
                      </label>
                    </div>
                    <div className="tr-slot__card-actions">
                      {renderSlotActionsMenu(slot, i)}
                    </div>
                    {renderConfirmRemoveSlot(slot)}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="tr-slots" role="list" aria-label="Pattern slots">
                {displaySlots.map((slot, i) => (
                  <div
                    key={slot.id}
                    role="listitem"
                    data-slot-id={slot.id}
                    className={[
                      "tr-slot",
                      dragFromIdx === i ? "tr-slot--dragging" : "",
                      dragOverIdx === i ? "tr-slot--drag-over" : "",
                    ].filter(Boolean).join(" ")}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={(e) => onDragOver(e, i)}
                    onDrop={(e) => onDrop(e, i)}
                    onDragEnd={onDragEnd}
                  >
                    <span className="tr-slot__drag-handle" aria-hidden="true" title="Drag to reorder">⣿</span>
                    <span className="tr-slot__index">{i + 1}</span>
                    <span className="tr-slot__type">{slot.type === "breath" ? "BREATH" : slot.label}</span>
                    {renderDeviceOffBadge(slot)}
                    <input
                      type="number"
                      className="tr-input tr-input--num"
                      value={slot.chance}
                      min={0}
                      max={100}
                      onChange={(e) => dispatch(mutateProject(setSlotChance(project, activeStanza!.id, slot.id, Number(e.target.value))))}
                      aria-label={`Chance for slot ${slot.label}`}
                    />
                    <span className="tr-slot__pct" aria-hidden="true">%</span>
                    <select
                      className="tr-select tr-select--sm"
                      value={slot.repeat}
                      onChange={(e) => dispatch(mutateProject(setSlotRepeat(project, activeStanza!.id, slot.id, e.target.value as "once" | "loop")))}
                      aria-label={`Repeat for slot ${slot.label}`}
                    >
                      <option value="once">once</option>
                      <option value="loop">loop</option>
                    </select>
                    {renderSlotActionsMenu(slot, i)}
                    {renderConfirmRemoveSlot(slot)}
                  </div>
                ))}
              </div>
            )}
            <div className="tr-slots__actions">
              <button className="tr-btn tr-btn--ghost" onClick={doAddBreathSlot}>+ Breath</button>
              {devices.map((dev) => (
                <button
                  key={dev.id}
                  className="tr-btn tr-btn--ghost"
                  onClick={() => doAddDeviceSlot(dev.id, dev.name)}
                >
                  + {dev.name}
                </button>
              ))}
            </div>

            <div className="tr-panel__section-head tr-panel__subsection-head">
              FLOW SCORE
              <span className="tr-panel__section-meta">which scenes choose this pattern to play, and how often</span>
            </div>

            {activeScenes.length === 0 ? (
              <p className="tr-panel__empty">No scenes yet — add one below to let this pattern play during a run.</p>
            ) : (
              <div className={["tr-scenes", isCompact ? "tr-scenes--cards" : ""].filter(Boolean).join(" ")}>
                {activeScenes.map((sc) => (
                  <div
                    key={sc.id}
                    className={["tr-scene", primary?.type === "scene" && primary.sceneId === sc.id ? "tr-scene--selected" : ""].filter(Boolean).join(" ")}
                  >
                    <button
                      className="tr-btn tr-btn--ghost tr-scene__select-btn"
                      aria-pressed={primary?.type === "scene" && primary.sceneId === sc.id}
                      onClick={() => dispatch(selectScene(sc.id))}
                    >
                      <span className="tr-scene__name">{sc.name}</span>
                      <span className="tr-scene__link" aria-hidden="true">→ {activeStanza.name}</span>
                    </button>
                    <input
                      type="number"
                      className="tr-input tr-input--num"
                      value={sc.chance}
                      min={0}
                      max={100}
                      onChange={(e) => dispatch(mutateProject(setSceneChance(project, sc.id, Number(e.target.value))))}
                      aria-label={`Chance for scene ${sc.name}`}
                    />
                    <span className="tr-scene__mode">{sc.mode}</span>
                    <button
                      className={["tr-btn tr-btn--ghost tr-btn--sm", sc.enabled ? "" : "tr-btn--dim"].filter(Boolean).join(" ")}
                      onClick={() => dispatch(mutateProject(toggleSceneEnabled(project, sc.id)))}
                    >
                      {sc.enabled ? "ON" : "OFF"}
                    </button>
                    {pendingRemoveSceneId === sc.id ? (
                      <ConfirmInline
                        message={`Remove scene "${sc.name}"?`}
                        onCancel={() => setPendingRemoveSceneId(null)}
                        onConfirm={() => confirmRemoveScene(sc.id, sc.name)}
                      />
                    ) : (
                      <button
                        className="tr-btn tr-btn--ghost tr-btn--sm"
                        aria-label={`Remove scene ${sc.name}`}
                        onClick={() => requestRemoveScene(sc.id)}
                      >
                        Remove scene
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="tr-panel__add-row">
              <input
                className="tr-input tr-input--sm"
                placeholder="Scene name"
                value={newSceneName}
                onChange={(e) => setNewSceneName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") doAddScene(); }}
                aria-label="New scene name"
              />
              <button
                className="tr-btn tr-btn--ghost"
                onClick={doAddScene}
                disabled={!canAddScene}
                aria-disabled={!canAddScene}
                title={addSceneReason || undefined}
              >
                + Scene
              </button>
            </div>
          </>
        ) : (
          <p className="tr-panel__empty">Select a pattern to view its Pattern Score and Flow Score.</p>
        )}
      </div>
    </div>
  );
}
