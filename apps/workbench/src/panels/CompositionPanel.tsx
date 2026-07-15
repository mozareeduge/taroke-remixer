import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { selectStanza, selectScene } from "../store/selectionSlice.js";
import {
  addStanzaPattern, removeStanzaPattern, toggleStanzaEnabled,
  addStanzaSlot, removeStanzaSlot,
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
              {activeStanza.slots.map((slot, i) => (
                <div key={slot.id} className="tr-slot">
                  <span className="tr-slot__index">{i + 1}</span>
                  <span className="tr-slot__type">{slot.type === "breath" ? "BREATH" : slot.label}</span>
                  <span className="tr-slot__chance">{slot.chance}%</span>
                  {slot.repeat === "loop" && <span className="tr-slot__repeat">LOOP</span>}
                  <button
                    className="tr-btn tr-btn--icon"
                    aria-label={`Remove slot ${slot.label}`}
                    onClick={() => dispatch(mutateProject(removeStanzaSlot(project, activeStanza.id, slot.id)))}
                  >
                    ✕
                  </button>
                </div>
              ))}
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

            <div className="tr-panel__subsection-head">FLOW SCENES using this pattern</div>
            <div className="tr-scenes">
              {scenes.filter((sc) => sc.stanzaId === activeStanza.id).map((sc) => (
                <div
                  key={sc.id}
                  className={["tr-scene", primary?.type === "scene" && primary.sceneId === sc.id ? "tr-scene--selected" : ""].filter(Boolean).join(" ")}
                  onClick={() => dispatch(selectScene(sc.id))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") dispatch(selectScene(sc.id)); }}
                >
                  <span className="tr-scene__name">{sc.name}</span>
                  <input
                    type="number"
                    className="tr-input tr-input--num"
                    value={sc.chance}
                    min={0}
                    max={100}
                    onChange={(e) => dispatch(mutateProject(setSceneChance(project, sc.id, Number(e.target.value))))}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Chance for scene ${sc.name}`}
                  />
                  <span className="tr-scene__mode">{sc.mode}</span>
                  <button
                    className={["tr-btn tr-btn--ghost tr-btn--sm", sc.enabled ? "" : "tr-btn--dim"].filter(Boolean).join(" ")}
                    onClick={(e) => { e.stopPropagation(); dispatch(mutateProject(toggleSceneEnabled(project, sc.id))); }}
                  >
                    {sc.enabled ? "ON" : "OFF"}
                  </button>
                  <button
                    className="tr-btn tr-btn--icon"
                    aria-label={`Remove scene ${sc.name}`}
                    onClick={(e) => { e.stopPropagation(); dispatch(mutateProject(removeFlowScene(project, sc.id))); }}
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
