import { useState, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { selectDevice, selectRoute } from "../store/selectionSlice.js";
import {
  addLineDevice, removeLineDevice, toggleDeviceEnabled,
  addRoute, removeRoute, updateRouteTemplate, setRouteWeight,
  addDeviceInput, removeDeviceInput, updateDeviceInput,
} from "../store/commands.js";
import { uid } from "@taroke/core";

// Forms available per bank role — unknown roles degrade to ["literal"].
const ROLE_FORMS: Record<string, string[]> = {
  noun:      ["literal", "singular", "plural"],
  verb:      ["literal", "thirdSingular", "imperative"],
  adjective: ["literal"],
  adverb:    ["literal"],
  mixed:     ["literal"],
};
const DEFAULT_FORMS = ["literal"];

interface PaletteEntry { variable: string; slot: string; form: string; available: boolean; }

interface VariablePaletteProps {
  deviceId: string;
  routeId: string;
  routeTemplate: string;
  templateRef: React.RefObject<HTMLTextAreaElement | null>;
  onClose: () => void;
  onInsert: (text: string, routeId: string) => void;
}

function VariablePalette({ deviceId, routeId, routeTemplate, templateRef, onClose, onInsert }: VariablePaletteProps) {
  const project = useAppSelector((s) => s.project.present);
  const device = project.lineDevices.find((d) => d.id === deviceId);
  const [query, setQuery] = useState("");
  const [focusIdx, setFocusIdx] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const entries: PaletteEntry[] = [];
  if (device) {
    for (const inp of device.inputs) {
      const bankMeta = project.materials.bankMeta[inp.tray];
      const role = bankMeta?.role ?? inp.role ?? "literal";
      const forms = ROLE_FORMS[role] ?? DEFAULT_FORMS;
      const available = Object.keys(project.materials.trays).includes(inp.tray);
      for (const form of forms) {
        entries.push({ variable: `{${inp.slot}:${form}}`, slot: inp.slot, form, available });
      }
    }
    entries.push({ variable: "{article:a}", slot: "article", form: "a", available: true });
    entries.push({ variable: "{article:an}", slot: "article", form: "an", available: true });
  }

  const filtered = query
    ? entries.filter((e) => e.variable.includes(query) || e.slot.includes(query) || e.form.includes(query))
    : entries;

  const handleKey = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx((f) => Math.min(f + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setFocusIdx((f) => Math.max(f - 1, 0)); }
    if (e.key === "Enter") {
      e.preventDefault();
      const item = filtered[focusIdx];
      if (item) onInsert(item.variable, routeId);
    }
  }, [filtered, focusIdx, onClose, onInsert, routeId]);

  return (
    <div
      className="tr-palette"
      role="dialog"
      aria-label="Insert variable"
      aria-modal="true"
      onKeyDown={handleKey}
    >
      <div className="tr-palette__header">
        <input
          ref={searchRef}
          autoFocus
          className="tr-palette__search tr-input tr-input--sm"
          placeholder="Search variables…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setFocusIdx(0); }}
          aria-label="Search variables"
          aria-controls="tr-palette-list"
        />
        <button className="tr-btn tr-btn--ghost tr-btn--sm" onClick={onClose} aria-label="Close variable palette">✕</button>
      </div>
      <ul
        id="tr-palette-list"
        className="tr-palette__list"
        role="listbox"
        aria-label="Available variables"
      >
        {filtered.length === 0 && (
          <li className="tr-palette__empty" role="option" aria-selected={false}>No variables match</li>
        )}
        {filtered.map((entry, i) => (
          <li
            key={entry.variable}
            role="option"
            aria-selected={i === focusIdx}
            aria-disabled={!entry.available}
            className={[
              "tr-palette__item",
              i === focusIdx ? "tr-palette__item--focused" : "",
              !entry.available ? "tr-palette__item--unavailable" : "",
            ].filter(Boolean).join(" ")}
            onClick={() => { if (entry.available) onInsert(entry.variable, routeId); }}
          >
            <code className="tr-palette__var">{entry.variable}</code>
            {!entry.available && <span className="tr-palette__hint"> (bank not found)</span>}
          </li>
        ))}
      </ul>
    </div>
  );
}

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
  const [openPaletteForRoute, setOpenPaletteForRoute] = useState<string | null>(null);
  const templateRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

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

  const handleInsert = useCallback((variable: string, routeId: string) => {
    if (!activeDevice) return;
    const ta = templateRefs.current[routeId];
    const route = activeDevice.routes.find((r) => r.id === routeId);
    if (!route) return;
    const start = ta ? (ta.selectionStart ?? route.template.length) : route.template.length;
    const end = ta ? (ta.selectionEnd ?? start) : start;
    const next = route.template.slice(0, start) + variable + route.template.slice(end);
    dispatch(mutateProject(updateRouteTemplate(project, activeDevice.id, routeId, next)));
    setOpenPaletteForRoute(null);
    setTimeout(() => {
      if (ta) { ta.focus(); ta.setSelectionRange(start + variable.length, start + variable.length); }
    }, 0);
  }, [activeDevice, project, dispatch]);

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
                {activeDevice.inputs.map((inp, inputIdx) => (
                  <tr key={inputIdx} className="tr-table__row">
                    <td className="tr-table__td">
                      <input
                        className="tr-input tr-input--mono"
                        value={inp.slot}
                        onChange={(e) => dispatch(mutateProject(updateDeviceInput(project, activeDevice.id, inp.slot, { slot: e.target.value })))}
                        aria-label="Slot name"
                        data-input-slot={inp.slot}
                      />
                    </td>
                    <td className="tr-table__td">
                      <select
                        className="tr-select tr-select--sm"
                        value={inp.tray}
                        onChange={(e) => dispatch(mutateProject(updateDeviceInput(project, activeDevice.id, inp.slot, { tray: e.target.value })))}
                        aria-label="Bank"
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
                        aria-label="Role"
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
                onClick={() => dispatch(mutateProject(addDeviceInput(project, activeDevice.id, {
                  slot: `slot${activeDevice.inputs.length + 1}`,
                  tray: Object.keys(project.materials.trays)[0] ?? "",
                  role: "literal",
                })))}
              >+ Input</button>
            </div>

            <div className="tr-panel__subsection-head">ROUTES</div>
            <div className="tr-routes">
              {activeDevice.routes.map((rt) => (
                <div
                  key={rt.id}
                  className={["tr-route", primary?.type === "route" && primary.routeId === rt.id ? "tr-route--selected" : ""].filter(Boolean).join(" ")}
                >
                  <div
                    className="tr-route__header"
                    role="button"
                    tabIndex={0}
                    aria-pressed={primary?.type === "route" && primary.routeId === rt.id}
                    onClick={() => dispatch(selectRoute({ deviceId: activeDevice.id, routeId: rt.id }))}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") dispatch(selectRoute({ deviceId: activeDevice.id, routeId: rt.id })); }}
                  >
                    <span className="tr-route__name">{rt.name}</span>
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
                    >✕</button>
                  </div>
                  <div className="tr-route__editor">
                    <textarea
                      ref={(el) => { templateRefs.current[rt.id] = el; }}
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
                      <div className="tr-route__palette-row">
                        {/* Quick chip palette — role-aware forms */}
                        {activeDevice.inputs.map((inp) => {
                          const bankMeta = project.materials.bankMeta[inp.tray];
                          const role = bankMeta?.role ?? inp.role ?? "literal";
                          const forms = ROLE_FORMS[role] ?? DEFAULT_FORMS;
                          return forms.map((form) => (
                            <button
                              key={`${inp.slot}:${form}`}
                              className="tr-btn tr-btn--chip"
                              aria-label={`Insert ${inp.slot}:${form} variable`}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleInsert(`{${inp.slot}:${form}}`, rt.id);
                              }}
                            >
                              {`{${inp.slot}:${form}}`}
                            </button>
                          ));
                        })}
                        <button
                          className="tr-btn tr-btn--ghost tr-btn--sm"
                          aria-label="Open variable palette"
                          aria-haspopup="dialog"
                          onClick={(e) => { e.stopPropagation(); setOpenPaletteForRoute(openPaletteForRoute === rt.id ? null : rt.id); }}
                        >
                          {openPaletteForRoute === rt.id ? "Close palette" : "Insert variable…"}
                        </button>
                      </div>
                    )}
                    {openPaletteForRoute === rt.id && (
                      <VariablePalette
                        deviceId={activeDevice.id}
                        routeId={rt.id}
                        routeTemplate={rt.template}
                        templateRef={{ current: templateRefs.current[rt.id] ?? null }}
                        onClose={() => setOpenPaletteForRoute(null)}
                        onInsert={handleInsert}
                      />
                    )}
                  </div>
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
