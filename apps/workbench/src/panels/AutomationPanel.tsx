import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { selectTrigger } from "../store/selectionSlice.js";
import { announce } from "../store/feedbackSlice.js";
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

  const trimmedTriggerName = newTriggerName.trim();
  const canAddTrigger = trimmedTriggerName.length > 0;
  const addTriggerReason = canAddTrigger ? "" : "Enter a trigger name";

  // Creating a trigger without THEN text would otherwise look like a valid,
  // running rule that silently does nothing (ACT-05). A blank action makes
  // the new rule a visibly incomplete draft, off until completed.
  function doAddTrigger() {
    if (!canAddTrigger) return;
    const trigger = {
      id: uid("tr"),
      name: trimmedTriggerName,
      enabled: false,
      condition: { tray: newTray, term: "" },
      chance: 50,
      action: { type: "append" as const, text: "" },
    };
    dispatch(mutateProject(addTrigger(project, trigger)));
    dispatch(selectTrigger(trigger.id));
    dispatch(announce(`Added draft trigger "${trigger.name}". Enable it once THEN text is set.`));
    setNewTriggerName("");
  }

  function isTriggerComplete(action: { text: string }): boolean {
    return action.text.trim().length > 0;
  }

  function doToggleTrigger(triggerId: string, trigger: { enabled: boolean; action: { text: string }; name: string }) {
    if (!trigger.enabled && !isTriggerComplete(trigger.action)) {
      dispatch(announce(`"${trigger.name}" needs THEN text before it can be enabled.`, "error"));
      return;
    }
    dispatch(mutateProject(toggleTriggerEnabled(project, triggerId)));
  }

  return (
    <div className="tr-panel tr-panel--automation">
      <div className="tr-panel__main">
        <div className="tr-panel__section-head">TRIGGERS</div>
        <div className="tr-triggers">
          {triggers.map((tr) => {
            const isSelected = primary?.type === "trigger" && primary.triggerId === tr.id;
            const bankLabel = project.materials.bankMeta[tr.condition.tray]?.label ?? tr.condition.tray;
            const termDisplay = tr.condition.term || "any (wildcard)";
            const complete = isTriggerComplete(tr.action);
            const actionDisplay = complete ? tr.action.text : "(incomplete — no action text)";
            const summary = `WHEN ${bankLabel} ${termDisplay} → ${tr.chance}% → THEN ${tr.action.type} ${actionDisplay}`;
            const pillState = !complete ? "draft" : tr.enabled ? "on" : "off";
            const pillText = !complete ? "DRAFT" : tr.enabled ? "ON" : "OFF";

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
                    <span className={`tr-trigger__pill tr-trigger__pill--${pillState}`} aria-hidden="true">
                      {pillText}
                    </span>
                    <span className="tr-trigger__name">{tr.name}</span>
                    <span className="tr-trigger__summary-text">{summary}</span>
                  </button>
                  <button
                    className="tr-btn tr-btn--ghost tr-btn--sm"
                    aria-label={`Remove trigger ${tr.name}`}
                    onClick={() => {
                      dispatch(mutateProject(removeTrigger(project, tr.id)));
                      dispatch(announce(`Removed trigger "${tr.name}".`));
                    }}
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
                        onClick={() => doToggleTrigger(tr.id, tr)}
                        disabled={!tr.enabled && !complete}
                        aria-disabled={!tr.enabled && !complete}
                        aria-label={`${tr.enabled ? "Disable" : "Enable"} trigger ${tr.name}`}
                        title={!tr.enabled && !complete ? "Add THEN action text before enabling" : undefined}
                      >
                        {tr.enabled ? "Enabled" : "Disabled"}
                      </button>
                      {!complete && (
                        <span className="tr-error" role="alert">Add THEN action text before enabling</span>
                      )}
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
            <button
              className="tr-btn tr-btn--ghost"
              onClick={doAddTrigger}
              disabled={!canAddTrigger}
              aria-disabled={!canAddTrigger}
              title={addTriggerReason || undefined}
            >
              + Trigger
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
