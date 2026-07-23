import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { selectTrigger } from "../store/selectionSlice.js";
import {
  addTrigger, removeTrigger, toggleTriggerEnabled,
  setTriggerCondition, setTriggerChance, setTriggerAction,
} from "../store/commands.js";
import { uid } from "@taroke/core";

export function AutomationPanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const primary = useAppSelector((s) => s.selection.primary);

  const triggers = project.triggers ?? [];
  const banks = Object.keys(project.materials.trays);

  const [newTriggerName, setNewTriggerName] = useState("");
  const [newTray, setNewTray] = useState(banks[0] ?? "");

  function doAddTrigger() {
    const name = newTriggerName.trim();
    if (!name) return;
    const trigger = {
      id: uid("tr"),
      name,
      enabled: true,
      condition: { tray: newTray, term: "" },
      chance: 50,
      action: { type: "append" as const, text: "" },
    };
    dispatch(mutateProject(addTrigger(project, trigger)));
    setNewTriggerName("");
  }

  return (
    <div className="tr-panel tr-panel--automation">
      <div className="tr-panel__main">
        <div className="tr-panel__section-head">TRIGGERS</div>
        <div className="tr-triggers">
          {triggers.map((tr) => {
            const isSelected = primary?.type === "trigger" && primary.triggerId === tr.id;
            const bankLabel = project.materials.bankMeta[tr.condition.tray]?.label ?? tr.condition.tray;
            const termDisplay = tr.condition.term || "any";
            const summary = `WHEN ${bankLabel} ${termDisplay} → ${tr.chance}% → THEN ${tr.action.type} ${tr.action.text || "…"}`;

            return (
              <div
                key={tr.id}
                className={["tr-trigger", isSelected ? "tr-trigger--selected" : ""].filter(Boolean).join(" ")}
              >
                <div className="tr-trigger__summary">
                  <button
                    className="tr-btn tr-btn--ghost tr-trigger__select-btn"
                    aria-pressed={isSelected}
                    aria-expanded={isSelected}
                    onClick={() => dispatch(selectTrigger(tr.id))}
                    aria-label={`${tr.name}: ${summary}`}
                  >
                    <span className={["tr-trigger__pill", tr.enabled ? "tr-trigger__pill--on" : "tr-trigger__pill--off"].join(" ")} aria-hidden="true">
                      {tr.enabled ? "ON" : "OFF"}
                    </span>
                    <span className="tr-trigger__name">{tr.name}</span>
                    <span className="tr-trigger__summary-text">{summary}</span>
                  </button>
                  <button
                    className="tr-btn tr-btn--ghost tr-btn--sm"
                    aria-label={`Remove trigger ${tr.name}`}
                    onClick={() => dispatch(mutateProject(removeTrigger(project, tr.id)))}
                  >
                    Remove trigger
                  </button>
                </div>

                {isSelected && (
                  <div className="tr-trigger__editor" role="group" aria-label={`Edit trigger ${tr.name}`}>
                    <div className="tr-trigger__row">
                      <span className="tr-trigger__label">WHEN</span>
                      <select
                        className="tr-select"
                        value={tr.condition.tray}
                        onChange={(e) => dispatch(mutateProject(setTriggerCondition(project, tr.id, e.target.value, tr.condition.term)))}
                        aria-label="Condition bank"
                      >
                        {banks.map((b) => (
                          <option key={b} value={b}>{project.materials.bankMeta[b]?.label ?? b}</option>
                        ))}
                      </select>
                      <input
                        className="tr-input tr-input--sm"
                        placeholder="term (blank = any)"
                        value={tr.condition.term}
                        onChange={(e) => dispatch(mutateProject(setTriggerCondition(project, tr.id, tr.condition.tray, e.target.value)))}
                        aria-label="Condition term"
                      />
                    </div>

                    <div className="tr-trigger__row">
                      <span className="tr-trigger__label">Chance</span>
                      <input
                        type="number"
                        className="tr-input tr-input--num"
                        value={tr.chance}
                        min={0}
                        max={100}
                        onChange={(e) => dispatch(mutateProject(setTriggerChance(project, tr.id, Number(e.target.value))))}
                        aria-label={`Trigger chance for ${tr.name}`}
                      />
                      <span className="tr-trigger__pct">%</span>
                    </div>

                    <div className="tr-trigger__row">
                      <span className="tr-trigger__label">THEN</span>
                      <select
                        className="tr-select"
                        value={tr.action.type}
                        onChange={(e) => dispatch(mutateProject(setTriggerAction(project, tr.id, e.target.value as "append" | "prepend" | "replace", tr.action.text)))}
                        aria-label="Action type"
                      >
                        <option value="append">append</option>
                        <option value="prepend">prepend</option>
                        <option value="replace">replace</option>
                      </select>
                      <input
                        className="tr-input"
                        placeholder="text…"
                        value={tr.action.text}
                        onChange={(e) => dispatch(mutateProject(setTriggerAction(project, tr.id, tr.action.type, e.target.value)))}
                        aria-label="Action text"
                      />
                    </div>

                    <div className="tr-trigger__row tr-trigger__row--controls">
                      <button
                        className={["tr-btn tr-btn--ghost tr-btn--sm", tr.enabled ? "" : "tr-btn--dim"].filter(Boolean).join(" ")}
                        onClick={() => dispatch(mutateProject(toggleTriggerEnabled(project, tr.id)))}
                        aria-label={`${tr.enabled ? "Disable" : "Enable"} trigger ${tr.name}`}
                      >
                        {tr.enabled ? "Enabled" : "Disabled"}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          <div className="tr-panel__add-row">
            <input
              className="tr-input tr-input--sm"
              placeholder="Trigger name"
              value={newTriggerName}
              onChange={(e) => setNewTriggerName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") doAddTrigger(); }}
              aria-label="New trigger name"
            />
            <select
              className="tr-select"
              value={newTray}
              onChange={(e) => setNewTray(e.target.value)}
              aria-label="New trigger bank"
            >
              {banks.map((b) => (
                <option key={b} value={b}>{project.materials.bankMeta[b]?.label ?? b}</option>
              ))}
            </select>
            <button className="tr-btn tr-btn--ghost" onClick={doAddTrigger}>+ Trigger</button>
          </div>
        </div>
      </div>
    </div>
  );
}
