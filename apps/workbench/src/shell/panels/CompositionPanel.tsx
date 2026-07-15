import { useState, useCallback, type DragEvent } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks.js";
import {
  addStanzaPattern,
  removeStanzaPattern,
  updateStanzaName,
  toggleStanzaEnabled,
  reorderStanzaPatterns,
  addStanzaSlot,
  removeStanzaSlot,
  reorderStanzaSlots,
  updateSlotLabel,
  setSlotChance,
  setSlotDevice,
  setSlotRepeat,
  addFlowScene,
  removeFlowScene,
  updateSceneName,
  setScenePattern,
  toggleSceneEnabled,
  setSceneChance,
} from "../../store/commands.js";
import { mutateProject } from "../../store/projectSlice.js";
import { uid } from "@taroke/core";
import type { StanzaPattern, StanzaSlot } from "@taroke/schema";

export function CompositionPanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const [expandedPattern, setExpandedPattern] = useState<string | null>(null);
  const [dragFromPat, setDragFromPat] = useState<number | null>(null);
  const [dragOverPat, setDragOverPat] = useState<number | null>(null);
  const [dragFromSlot, setDragFromSlot] = useState<{ patId: string; idx: number } | null>(null);
  const [dragOverSlot, setDragOverSlot] = useState<number | null>(null);

  type CmdResult = { present: import("@taroke/schema").TarokeProject; patches: unknown[]; inversePatches: unknown[]; label: string };
  const dispatchCmd = useCallback(
    (cmd: CmdResult) => {
      dispatch(mutateProject({ label: cmd.label, present: cmd.present, patches: cmd.patches, inversePatches: cmd.inversePatches }));
    },
    [dispatch],
  );

  const devices = project.lineDevices;

  // ── Pattern drag/drop reorder ──────────────────────────────────────────────
  const onPatDragStart = (i: number) => setDragFromPat(i);
  const onPatDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverPat(i); };
  const onPatDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragFromPat === null || dragFromPat === i) { setDragFromPat(null); setDragOverPat(null); return; }
    const ids = project.stanzaPatterns.map((s) => s.id);
    const [moved] = ids.splice(dragFromPat, 1);
    ids.splice(i, 0, moved!);
    dispatchCmd(reorderStanzaPatterns(project, ids));
    setDragFromPat(null);
    setDragOverPat(null);
  };
  const onPatDragEnd = () => { setDragFromPat(null); setDragOverPat(null); };

  const movePattern = (from: number, to: number) => {
    const ids = project.stanzaPatterns.map((s) => s.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved!);
    dispatchCmd(reorderStanzaPatterns(project, ids));
  };

  // ── Slot drag/drop reorder ────────────────────────────────────────────────
  const onSlotDragStart = (patId: string, i: number) => setDragFromSlot({ patId, idx: i });
  const onSlotDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOverSlot(i); };
  const onSlotDrop = (e: React.DragEvent, patId: string, i: number) => {
    e.preventDefault();
    if (!dragFromSlot || dragFromSlot.patId !== patId || dragFromSlot.idx === i) {
      setDragFromSlot(null); setDragOverSlot(null); return;
    }
    const stanza = project.stanzaPatterns.find((s) => s.id === patId);
    if (!stanza) return;
    const ids = stanza.slots.map((s) => s.id);
    const [moved] = ids.splice(dragFromSlot.idx, 1);
    ids.splice(i, 0, moved!);
    dispatchCmd(reorderStanzaSlots(project, patId, ids));
    setDragFromSlot(null); setDragOverSlot(null);
  };
  const onSlotDragEnd = () => { setDragFromSlot(null); setDragOverSlot(null); };

  const moveSlot = (patId: string, from: number, to: number) => {
    const stanza = project.stanzaPatterns.find((s) => s.id === patId);
    if (!stanza) return;
    const ids = stanza.slots.map((s) => s.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved!);
    dispatchCmd(reorderStanzaSlots(project, patId, ids));
  };

  const addNewPattern = () => {
    const stanza: StanzaPattern = {
      id: uid("st"),
      name: `Pattern ${project.stanzaPatterns.length + 1}`,
      enabled: true,
      description: "",
      slots: [],
    };
    dispatchCmd(addStanzaPattern(project, stanza));
    setExpandedPattern(stanza.id);
  };

  const addSlot = (patId: string, type: "device" | "breath") => {
    const slot: StanzaSlot = {
      id: uid("slot"),
      type,
      label: type === "breath" ? "BREATH" : "DEVICE",
      repeat: "once",
      chance: 100,
      ...(type === "device" && devices[0]?.id ? { deviceId: devices[0].id } : {}),
    };
    dispatchCmd(addStanzaSlot(project, patId, slot));
  };

  return (
    <div className="tr-panel tr-composition">
      <section className="tr-panel__section">
        <h2 className="tr-panel__heading">Patterns</h2>
        <button className="tr-btn tr-btn--primary" onClick={addNewPattern} aria-label="Add pattern">
          + Add pattern
        </button>
      </section>

      {project.stanzaPatterns.length === 0 && (
        <p className="tr-panel__empty">No patterns. Add one above.</p>
      )}

      {project.stanzaPatterns.map((pat, pi) => {
        const isExpanded = expandedPattern === pat.id;
        const isDragging = dragFromPat === pi;
        const isOver = dragOverPat === pi;
        return (
          <section
            key={pat.id}
            className={["tr-pattern", isExpanded ? "tr-pattern--expanded" : "", isDragging ? "tr-pattern--dragging" : "", isOver ? "tr-pattern--drag-over" : ""].filter(Boolean).join(" ")}
            draggable
            onDragStart={() => onPatDragStart(pi)}
            onDragOver={(e) => onPatDragOver(e, pi)}
            onDrop={(e) => onPatDrop(e, pi)}
            onDragEnd={onPatDragEnd}
          >
            <div className="tr-pattern__header">
              <span className="tr-pattern__drag" aria-hidden>⠿</span>
              <button
                className="tr-pattern__expand"
                aria-expanded={isExpanded}
                onClick={() => setExpandedPattern((p) => (p === pat.id ? null : pat.id))}
              >
                {isExpanded ? "▾" : "▸"}
              </button>
              <input
                className="tr-pattern__name"
                value={pat.name}
                aria-label="Pattern name"
                onChange={(e) => dispatchCmd(updateStanzaName(project, pat.id, e.target.value))}
                onClick={() => setExpandedPattern(pat.id)}
              />
              <label className="tr-pattern__enabled">
                <input
                  type="checkbox"
                  checked={pat.enabled}
                  aria-label={`${pat.name} enabled`}
                  onChange={() => dispatchCmd(toggleStanzaEnabled(project, pat.id))}
                />
                Enabled
              </label>
              <div className="tr-pattern__moves" role="group" aria-label={`Move ${pat.name}`}>
                <button aria-label="Move pattern to start" disabled={pi === 0} onClick={() => movePattern(pi, 0)}>⇈</button>
                <button aria-label="Move pattern up" disabled={pi === 0} onClick={() => movePattern(pi, pi - 1)}>↑</button>
                <button aria-label="Move pattern down" disabled={pi === project.stanzaPatterns.length - 1} onClick={() => movePattern(pi, pi + 1)}>↓</button>
                <button aria-label="Move pattern to end" disabled={pi === project.stanzaPatterns.length - 1} onClick={() => movePattern(pi, project.stanzaPatterns.length - 1)}>⇊</button>
              </div>
              <button
                className="tr-pattern__remove"
                aria-label={`Remove pattern ${pat.name}`}
                onClick={() => { if (window.confirm(`Remove pattern "${pat.name}"?`)) dispatchCmd(removeStanzaPattern(project, pat.id)); }}
              >✕</button>
            </div>

            {isExpanded && (
              <div className="tr-pattern__body">
                <h3 className="tr-pattern__subheading">Slots</h3>
                {pat.slots.length === 0 && <p className="tr-pattern__empty-slots">No slots. Add device or breath below.</p>}

                <ol className="tr-slot-list" aria-label={`Slots in ${pat.name}`}>
                  {pat.slots.map((slot, si) => {
                    const isDragSlot = dragFromSlot?.patId === pat.id && dragFromSlot.idx === si;
                    const isOverSlot = dragOverSlot === si;
                    return (
                      <li
                        key={slot.id}
                        className={["tr-slot", isDragSlot ? "tr-slot--dragging" : "", isOverSlot ? "tr-slot--drag-over" : ""].filter(Boolean).join(" ")}
                        draggable
                        onDragStart={() => onSlotDragStart(pat.id, si)}
                        onDragOver={(e) => onSlotDragOver(e, si)}
                        onDrop={(e) => onSlotDrop(e, pat.id, si)}
                        onDragEnd={onSlotDragEnd}
                      >
                        <span className="tr-slot__drag" aria-hidden>⠿</span>
                        <span className="tr-slot__type">{slot.type === "breath" ? "BREATH" : "DEV"}</span>
                        <input
                          className="tr-slot__label"
                          value={slot.label}
                          aria-label={`Slot ${si + 1} label`}
                          onChange={(e) => dispatchCmd(updateSlotLabel(project, pat.id, slot.id, e.target.value))}
                        />
                        {slot.type === "device" && (
                          <select
                            className="tr-slot__device"
                            value={slot.deviceId ?? ""}
                            aria-label="Slot device"
                            onChange={(e) => dispatchCmd(setSlotDevice(project, pat.id, slot.id, e.target.value))}
                          >
                            {devices.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
                          </select>
                        )}
                        <label className="tr-slot__chance-label">
                          Chance
                          <input
                            type="number"
                            className="tr-slot__chance"
                            value={slot.chance}
                            min={0}
                            max={100}
                            aria-label={`Slot ${si + 1} chance`}
                            onChange={(e) => dispatchCmd(setSlotChance(project, pat.id, slot.id, Number(e.target.value)))}
                          />%
                        </label>
                        <div className="tr-slot__moves" role="group" aria-label={`Move slot ${si + 1}`}>
                          <button aria-label="Move slot up" disabled={si === 0} onClick={() => moveSlot(pat.id, si, si - 1)}>↑</button>
                          <button aria-label="Move slot down" disabled={si === pat.slots.length - 1} onClick={() => moveSlot(pat.id, si, si + 1)}>↓</button>
                        </div>
                        <button
                          className="tr-slot__remove"
                          aria-label={`Remove slot ${si + 1}`}
                          onClick={() => dispatchCmd(removeStanzaSlot(project, pat.id, slot.id))}
                        >✕</button>
                      </li>
                    );
                  })}
                </ol>

                <div className="tr-slot-add">
                  <button className="tr-btn tr-btn--secondary" onClick={() => addSlot(pat.id, "device")} aria-label="Add device slot">
                    + Device slot
                  </button>
                  <button className="tr-btn tr-btn--secondary" onClick={() => addSlot(pat.id, "breath")} aria-label="Add breath slot">
                    + Breath
                  </button>
                </div>
              </div>
            )}
          </section>
        );
      })}

      {/* Flow Scenes */}
      <section className="tr-panel__section tr-flow">
        <h2 className="tr-panel__heading">Flow Scenes</h2>
        <button className="tr-btn tr-btn--secondary" aria-label="Add flow scene" onClick={() => {
          const firstPat = project.stanzaPatterns[0];
          if (!firstPat) { alert("Add a pattern first."); return; }
          dispatchCmd(addFlowScene(project, {
            id: uid("sc"),
            name: `Scene ${project.flowScenes.length + 1}`,
            stanzaId: firstPat.id,
            enabled: true,
            chance: 100,
            mode: "sequential",
          }));
        }}>
          + Add scene
        </button>

        {project.flowScenes.length === 0 && (
          <p className="tr-panel__empty">No flow scenes.</p>
        )}

        {project.flowScenes.map((scene) => (
          <div key={scene.id} className={["tr-scene", scene.enabled ? "" : "tr-scene--disabled"].filter(Boolean).join(" ")}>
            <label className="tr-scene__enabled">
              <input
                type="checkbox"
                checked={scene.enabled}
                aria-label={`${scene.name} enabled`}
                onChange={() => dispatchCmd(toggleSceneEnabled(project, scene.id))}
              />
            </label>
            <input
              className="tr-scene__name"
              value={scene.name}
              aria-label="Scene name"
              onChange={(e) => dispatchCmd(updateSceneName(project, scene.id, e.target.value))}
            />
            <label className="tr-scene__pattern-label">
              Pattern
              <select
                className="tr-scene__pattern"
                value={scene.stanzaId}
                aria-label="Scene pattern"
                onChange={(e) => dispatchCmd(setScenePattern(project, scene.id, e.target.value))}
              >
                {project.stanzaPatterns.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label className="tr-scene__chance-label">
              Chance
              <input
                type="number"
                className="tr-scene__chance"
                value={scene.chance}
                min={0}
                max={100}
                aria-label={`${scene.name} chance`}
                onChange={(e) => dispatchCmd(setSceneChance(project, scene.id, Number(e.target.value)))}
              />%
            </label>
            <button
              className="tr-scene__remove"
              aria-label={`Remove scene ${scene.name}`}
              onClick={() => dispatchCmd(removeFlowScene(project, scene.id))}
            >✕</button>
          </div>
        ))}
      </section>
    </div>
  );
}
