import { useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks.js";
import {
  addTrigger,
  removeTrigger,
  updateTriggerName,
  toggleTriggerEnabled,
  setTriggerCondition,
  setTriggerChance,
  setTriggerAction,
} from "../../store/commands.js";
import { mutateProject } from "../../store/projectSlice.js";
import { uid } from "@taroke/core";
import type { Trigger } from "@taroke/schema";

export function AutomationPanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);

  type CmdResult = { present: import("@taroke/schema").TarokeProject; patches: unknown[]; inversePatches: unknown[]; label: string };
  const dispatchCmd = useCallback(
    (cmd: CmdResult) => {
      dispatch(mutateProject({ label: cmd.label, present: cmd.present, patches: cmd.patches, inversePatches: cmd.inversePatches }));
    },
    [dispatch],
  );

  const bankNames = Object.keys(project.materials.trays);

  const addNewTrigger = () => {
    const trigger: Trigger = {
      id: uid("trig"),
      name: `Trigger ${project.triggers.length + 1}`,
      enabled: true,
      condition: { tray: bankNames[0] ?? "above", term: "" },
      chance: 100,
      action: { type: "append", text: "" },
    };
    dispatchCmd(addTrigger(project, trigger));
  };

  return (
    <div className="tr-panel tr-automation">
      <section className="tr-panel__section">
        <h2 className="tr-panel__heading">Triggers</h2>
        <p className="tr-panel__hint">
          WHEN a sample matches a condition → THEN modify the output line.
        </p>
        <button className="tr-btn tr-btn--primary" onClick={addNewTrigger} aria-label="Add trigger">
          + Add trigger
        </button>
      </section>

      {project.triggers.length === 0 && (
        <p className="tr-panel__empty">No triggers. Add one above.</p>
      )}

      {project.triggers.map((trig) => (
        <section
          key={trig.id}
          className={["tr-trigger", trig.enabled ? "" : "tr-trigger--disabled"].filter(Boolean).join(" ")}
        >
          <div className="tr-trigger__header">
            <label className="tr-trigger__enabled">
              <input
                type="checkbox"
                checked={trig.enabled}
                aria-label={`${trig.name} enabled`}
                onChange={() => dispatchCmd(toggleTriggerEnabled(project, trig.id))}
              />
            </label>
            <input
              className="tr-trigger__name"
              value={trig.name}
              aria-label="Trigger name"
              onChange={(e) => dispatchCmd(updateTriggerName(project, trig.id, e.target.value))}
            />
            <button
              className="tr-trigger__remove"
              aria-label={`Remove trigger ${trig.name}`}
              onClick={() => dispatchCmd(removeTrigger(project, trig.id))}
            >✕</button>
          </div>

          <div className="tr-trigger__body">
            {/* WHEN condition */}
            <div className="tr-trigger__row tr-trigger__when">
              <span className="tr-trigger__clause-label">WHEN</span>
              <label className="tr-trigger__field-label">
                bank
                <select
                  className="tr-trigger__tray"
                  value={trig.condition.tray}
                  aria-label="Condition bank"
                  onChange={(e) => dispatchCmd(setTriggerCondition(project, trig.id, e.target.value, trig.condition.term))}
                >
                  {bankNames.map((b) => (
                    <option key={b} value={b}>{project.materials.bankMeta[b]?.label ?? b}</option>
                  ))}
                </select>
              </label>
              <label className="tr-trigger__field-label">
                contains
                <input
                  className="tr-trigger__term"
                  value={trig.condition.term}
                  placeholder="(match term)"
                  aria-label="Condition term"
                  onChange={(e) => dispatchCmd(setTriggerCondition(project, trig.id, trig.condition.tray, e.target.value))}
                />
              </label>
              <label className="tr-trigger__field-label">
                chance
                <input
                  type="number"
                  className="tr-trigger__chance"
                  value={trig.chance}
                  min={0}
                  max={100}
                  aria-label="Trigger chance"
                  onChange={(e) => dispatchCmd(setTriggerChance(project, trig.id, Number(e.target.value)))}
                />%
              </label>
            </div>

            {/* THEN action */}
            <div className="tr-trigger__row tr-trigger__then">
              <span className="tr-trigger__clause-label">THEN</span>
              <select
                className="tr-trigger__action-type"
                value={trig.action.type}
                aria-label="Action type"
                onChange={(e) => dispatchCmd(setTriggerAction(project, trig.id, e.target.value as Trigger["action"]["type"], trig.action.text))}
              >
                <option value="append">append</option>
                <option value="prepend">prepend</option>
                <option value="replace">replace</option>
              </select>
              <input
                className="tr-trigger__action-text"
                value={trig.action.text}
                placeholder="text to insert"
                aria-label="Action text"
                onChange={(e) => dispatchCmd(setTriggerAction(project, trig.id, trig.action.type, e.target.value))}
              />
            </div>

            <p className="tr-trigger__summary" aria-label="Trigger summary">
              {trig.enabled
                ? `WHEN "${trig.condition.term || "…"}" in ${project.materials.bankMeta[trig.condition.tray]?.label ?? trig.condition.tray} (${trig.chance}%) → ${trig.action.type} "${trig.action.text || "…"}"`
                : "(disabled)"}
            </p>
          </div>
        </section>
      ))}
    </div>
  );
}
