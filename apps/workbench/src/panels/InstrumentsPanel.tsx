import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { selectDevice, selectRoute } from "../store/selectionSlice.js";
import {
  addLineDevice, removeLineDevice, toggleDeviceEnabled,
  addRoute, removeRoute, updateRouteTemplate, setRouteWeight,
  addDeviceInput, removeDeviceInput, updateDeviceInput,
} from "../store/commands.js";
import { uid } from "@taroke/core";

export function InstrumentsPanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const primary = useAppSelector((s) => s.selection.primary);

  const devices = project.lineDevices ?? [];
  const activeDeviceId =
    primary?.type === "device" ? primary.deviceId :
    primary?.type === "route" ? primary.deviceId :
    devices[0]?.id ?? null;
  const activeDevice = devices.find((d) => d.id === activeDeviceId) ?? null;

  const [newDeviceName, setNewDeviceName] = useState("");

  function doAddDevice() {
    const name = newDeviceName.trim().toUpperCase();
    if (!name) return;
    const device = {
      id: uid("ld"),
      name,
      enabled: true,
      description: "",
      inputs: [],
      routes: [{ id: uid("rt"), name: "default", weight: 100, template: "" }],
    };
    dispatch(mutateProject(addLineDevice(project, device)));
    setNewDeviceName("");
  }

  return (
    <div className="tr-panel tr-panel--instruments">
      <div className="tr-panel__sidebar">
        <div className="tr-panel__section-head">DEVICES</div>
        <ul className="tr-list" role="list">
          {devices.map((dev) => (
            <li key={dev.id} className="tr-list__item">
              <button
                className={["tr-list__btn", activeDeviceId === dev.id ? "tr-list__btn--active" : ""].filter(Boolean).join(" ")}
                onClick={() => dispatch(selectDevice(dev.id))}
                aria-current={activeDeviceId === dev.id ? "true" : undefined}
              >
                <span className="tr-list__label">{dev.name}</span>
                <span className={["tr-list__badge", dev.enabled ? "tr-list__badge--on" : "tr-list__badge--off"].join(" ")}>
                  {dev.enabled ? "ON" : "OFF"}
                </span>
              </button>
            </li>
          ))}
        </ul>
        <div className="tr-panel__add-row">
          <input
            className="tr-input tr-input--sm"
            placeholder="Device name"
            value={newDeviceName}
            onChange={(e) => setNewDeviceName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") doAddDevice(); }}
            aria-label="New device name"
          />
          <button className="tr-btn tr-btn--ghost" onClick={doAddDevice}>+ Device</button>
        </div>
      </div>

      <div className="tr-panel__main">
        {activeDevice ? (
          <>
            <div className="tr-panel__section-head">
              {activeDevice.name}
              <button
                className={["tr-btn tr-btn--ghost tr-btn--sm", activeDevice.enabled ? "" : "tr-btn--dim"].filter(Boolean).join(" ")}
                onClick={() => dispatch(mutateProject(toggleDeviceEnabled(project, activeDevice.id)))}
                aria-label={`${activeDevice.enabled ? "Disable" : "Enable"} ${activeDevice.name}`}
              >
                {activeDevice.enabled ? "Enabled" : "Disabled"}
              </button>
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                onClick={() => dispatch(mutateProject(removeLineDevice(project, activeDevice.id)))}
                aria-label="Remove device"
              >
                Remove
              </button>
            </div>

            <div className="tr-panel__subsection-head">INPUTS</div>
            <table className="tr-table">
              <thead>
                <tr>
                  <th className="tr-table__th">Slot</th>
                  <th className="tr-table__th">Bank</th>
                  <th className="tr-table__th">Role</th>
                  <th className="tr-table__th tr-table__th--action" aria-label="Remove input"></th>
                </tr>
              </thead>
              <tbody>
                {activeDevice.inputs.map((inp) => (
                  <tr key={inp.slot} className="tr-table__row">
                    <td className="tr-table__td">
                      <input
                        className="tr-input tr-input--mono"
                        value={inp.slot}
                        onChange={(e) => dispatch(mutateProject(updateDeviceInput(project, activeDevice.id, inp.slot, { slot: e.target.value })))}
                        aria-label={`Slot name for input ${inp.slot}`}
                        data-input-slot={inp.slot}
                      />
                    </td>
                    <td className="tr-table__td">
                      <select
                        className="tr-select tr-select--sm"
                        value={inp.tray}
                        onChange={(e) => dispatch(mutateProject(updateDeviceInput(project, activeDevice.id, inp.slot, { tray: e.target.value })))}
                        aria-label={`Bank for input ${inp.slot}`}
                      >
                        {Object.keys(project.materials.trays).map((b) => (
                          <option key={b} value={b}>{project.materials.bankMeta[b]?.label ?? b}</option>
                        ))}
                      </select>
                    </td>
                    <td className="tr-table__td">
                      <input
                        className="tr-input"
                        value={inp.role}
                        onChange={(e) => dispatch(mutateProject(updateDeviceInput(project, activeDevice.id, inp.slot, { role: e.target.value })))}
                        aria-label={`Role for input ${inp.slot}`}
                      />
                    </td>
                    <td className="tr-table__td tr-table__td--action">
                      <button
                        className="tr-btn tr-btn--icon"
                        aria-label={`Remove input ${inp.slot}`}
                        onClick={() => dispatch(mutateProject(removeDeviceInput(project, activeDevice.id, inp.slot)))}
                      >✕</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="tr-panel__add-row">
              <button
                className="tr-btn tr-btn--ghost"
                onClick={() => dispatch(mutateProject(addDeviceInput(project, activeDevice.id, { slot: `slot${activeDevice.inputs.length + 1}`, tray: Object.keys(project.materials.trays)[0] ?? "", role: "literal" })))}
              >+ Input</button>
            </div>

            <div className="tr-panel__subsection-head">ROUTES</div>
            <div className="tr-routes">
              {activeDevice.routes.map((rt) => (
                <div
                  key={rt.id}
                  className={["tr-route", primary?.type === "route" && primary.routeId === rt.id ? "tr-route--selected" : ""].filter(Boolean).join(" ")}
                  onClick={() => dispatch(selectRoute({ deviceId: activeDevice.id, routeId: rt.id }))}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") dispatch(selectRoute({ deviceId: activeDevice.id, routeId: rt.id })); }}
                  aria-pressed={primary?.type === "route" && primary.routeId === rt.id}
                >
                  <div className="tr-route__header">
                    <span className="tr-route__name">{rt.name}</span>
                    <span className="tr-route__weight">×{rt.weight}</span>
                    <input
                      type="number"
                      className="tr-input tr-input--num"
                      value={rt.weight}
                      min={0}
                      max={999}
                      onChange={(e) => dispatch(mutateProject(setRouteWeight(project, activeDevice.id, rt.id, Number(e.target.value))))}
                      onClick={(e) => e.stopPropagation()}
                      aria-label={`Weight for route ${rt.name}`}
                    />
                    <button
                      className="tr-btn tr-btn--icon"
                      aria-label={`Remove route ${rt.name}`}
                      onClick={(e) => { e.stopPropagation(); dispatch(mutateProject(removeRoute(project, activeDevice.id, rt.id))); }}
                    >
                      ✕
                    </button>
                  </div>
                  <textarea
                    className="tr-route__template"
                    value={rt.template}
                    rows={2}
                    onChange={(e) => dispatch(mutateProject(updateRouteTemplate(project, activeDevice.id, rt.id, e.target.value)))}
                    onClick={(e) => e.stopPropagation()}
                    aria-label={`Template for route ${rt.name}`}
                    spellCheck={false}
                    data-route-template={rt.id}
                  />
                  {activeDevice.inputs.length > 0 && (
                    <div className="tr-route__palette" aria-label="Insert variable at cursor">
                      {activeDevice.inputs.map((inp) => (
                        ["literal", "plural", "singular"].map((form) => (
                          <button
                            key={`${inp.slot}:${form}`}
                            className="tr-btn tr-btn--chip"
                            aria-label={`Insert ${inp.slot}:${form} variable`}
                            onClick={(e) => {
                              e.stopPropagation();
                              const ta = document.querySelector<HTMLTextAreaElement>(`[data-route-template="${rt.id}"]`);
                              if (!ta) return;
                              const start = ta.selectionStart ?? rt.template.length;
                              const end = ta.selectionEnd ?? start;
                              const insert = `{${inp.slot}:${form}}`;
                              const next = rt.template.slice(0, start) + insert + rt.template.slice(end);
                              dispatch(mutateProject(updateRouteTemplate(project, activeDevice.id, rt.id, next)));
                              setTimeout(() => { ta.focus(); ta.setSelectionRange(start + insert.length, start + insert.length); }, 0);
                            }}
                          >
                            {`{${inp.slot}:${form}}`}
                          </button>
                        ))
                      ))}
                    </div>
                  )}
                </div>
              ))}
              <button
                className="tr-btn tr-btn--ghost"
                onClick={() => dispatch(mutateProject(addRoute(project, activeDevice.id, { id: uid("rt"), name: "new route", weight: 10, template: "" })))}
              >
                + Route
              </button>
            </div>
          </>
        ) : (
          <p className="tr-panel__empty">Select a device to view its routes.</p>
        )}
      </div>
    </div>
  );
}
