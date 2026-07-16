import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { selectStanza, selectScene } from "../store/selectionSlice.js";
import {
  addStanzaPattern, removeStanzaPattern, toggleStanzaEnabled,
  addStanzaSlot, removeStanzaSlot, reorderStanzaSlots, setSlotChance, setSlotRepeat,
  addFlowScene, removeFlowScene, toggleSceneEnabled, setSceneChance,
} from "../store/commands.js";
import { uid } from "@taroke/core";

export function CompositionPanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const primary = useAppSelector((s) => s.selection.primary);

  const stanzas = project.stanzaPatterns ?? [];
  const scenes = project.flowScenes ?? [];
  const devices = project.lineDevices ?? [];

  const activeStanzaId = primary?.type === "stanza" ? primary.stanzaId : stanzas[0]?.id ?? null;
  const activeStanza = stanzas.find((s) => s.id === activeStanzaId) ?? null;

  const [newStanzaName, setNewStanzaName] = useState("");
  const [newSceneName, setNewSceneName] = useState("");

  function doAddStanza() {
    const name = newStanzaName.trim();
    if (!name) return;
    const stanza = {
      id: uid("st"),
      name,
      enabled: true,
      description: "",
      slots: [],
    };
    dispatch(mutateProject(addStanzaPattern(project, stanza)));
    setNewStanzaName("");
  }

  function doAddScene() {
    if (!newSceneName.trim() || !activeStanzaId) return;
    const scene = {
      id: uid("sc"),
      name: newSceneName.trim(),
      stanzaId: activeStanzaId,
      enabled: true,
      chance: 100,
      mode: "loop",
    };
    dispatch(mutateProject(addFlowScene(project, scene)));
    setNewSceneName("");
  }

  function doAddBreathSlot() {
    if (!activeStanzaId) return;
    dispatch(mutateProject(addStanzaSlot(project, activeStanzaId, { id: uid("slot"), type: "breath", label: "BREATH", repeat: "once", chance: 100 })));
  }

  function doAddDeviceSlot(deviceId: string, deviceName: string) {
    if (!activeStanzaId) return;
    dispatch(mutateProject(addStanzaSlot(project, activeStanzaId, { id: uid("slot"), type: "device", deviceId, label: deviceName, repeat: "once", chance: 100 })));
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
          <button className="tr-btn tr-btn--ghost" onClick={doAddStanza}>+ Pattern</button>
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
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                onClick={() => dispatch(mutateProject(removeStanzaPattern(project, activeStanza.id)))}
                aria-label={`Remove ${activeStanza.name}`}
              >
                Remove
              </button>
            </div>

            <div className="tr-panel__subsection-head">SLOTS</div>
            <div className="tr-slots">
              {activeStanza.slots.map((slot, i) => {
                function moveSlot(delta: number) {
                  const ids = activeStanza!.slots.map((s) => s.id);
                  const newIdx = i + delta;
                  if (newIdx < 0 || newIdx >= ids.length) return;
                  ids.splice(i, 1);
                  ids.splice(newIdx, 0, slot.id);
                  dispatch(mutateProject(reorderStanzaSlots(project, activeStanza!.id, ids)));
                }
                return (
                <div key={slot.id} className="tr-slot">
                  <span className="tr-slot__index">{i + 1}</span>
                  <span className="tr-slot__type">{slot.type === "breath" ? "BREATH" : slot.label}</span>
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
                  <div className="tr-reorder" role="group" aria-label={`Reorder slot ${slot.label}`}>
                    <button
                      className="tr-btn tr-btn--icon"
                      aria-label={`Move slot ${slot.label} to start`}
                      disabled={i === 0}
                      onClick={() => {
                        const ids = activeStanza!.slots.map((s) => s.id);
                        ids.splice(i, 1);
                        ids.unshift(slot.id);
                        dispatch(mutateProject(reorderStanzaSlots(project, activeStanza!.id, ids)));
                      }}
                    >⇈</button>
                    <button
                      className="tr-btn tr-btn--icon"
                      aria-label={`Move slot ${slot.label} up`}
                      disabled={i === 0}
                      onClick={() => moveSlot(-1)}
                    >↑</button>
                    <button
                      className="tr-btn tr-btn--icon"
                      aria-label={`Move slot ${slot.label} down`}
                      disabled={i === activeStanza!.slots.length - 1}
                      onClick={() => moveSlot(1)}
                    >↓</button>
                    <button
                      className="tr-btn tr-btn--icon"
                      aria-label={`Move slot ${slot.label} to end`}
                      disabled={i === activeStanza!.slots.length - 1}
                      onClick={() => {
                        const ids = activeStanza!.slots.map((s) => s.id);
                        ids.splice(i, 1);
                        ids.push(slot.id);
                        dispatch(mutateProject(reorderStanzaSlots(project, activeStanza!.id, ids)));
                      }}
                    >⇊</button>
                  </div>
                  <button
                    className="tr-btn tr-btn--icon"
                    aria-label={`Remove slot ${slot.label}`}
                    onClick={() => dispatch(mutateProject(removeStanzaSlot(project, activeStanza!.id, slot.id)))}
                  >
                    ✕
                  </button>
                </div>
                );
              })}
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
            </div>

            <div className="tr-panel__subsection-head">SCENES</div>
            <div className="tr-scenes">
              {scenes.filter((sc) => sc.stanzaId === activeStanza.id).map((sc) => (
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
                  <button
                    className="tr-btn tr-btn--icon"
                    aria-label={`Remove scene ${sc.name}`}
                    onClick={() => dispatch(mutateProject(removeFlowScene(project, sc.id)))}
                  >
                    ✕
                  </button>
                </div>
              ))}
              <div className="tr-panel__add-row">
                <input
                  className="tr-input tr-input--sm"
                  placeholder="Scene name"
                  value={newSceneName}
                  onChange={(e) => setNewSceneName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") doAddScene(); }}
                  aria-label="New scene name"
                />
                <button className="tr-btn tr-btn--ghost" onClick={doAddScene}>+ Scene</button>
              </div>
            </div>
          </>
        ) : (
          <p className="tr-panel__empty">Select a pattern to view its slots.</p>
        )}
      </div>
    </div>
  );
}
