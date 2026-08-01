import { useState, useRef, useCallback, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { selectDevice, selectRoute } from "../store/selectionSlice.js";
import {
  addLineDevice, toggleDeviceEnabled,
  addRoute, removeRoute, updateRouteTemplate, setRouteWeight,
  addDeviceInput, removeDeviceInput, updateDeviceInput,
  safeRemoveLineDevice, isBlocked,
} from "../store/commands.js";
import { uid, renderDeviceEvent } from "@taroke/core";
import type { LineEvent } from "@taroke/schema";
import { formsForRole } from "../shell/formRoles.js";
import { validateRouteTemplate, type TemplateIssue } from "../shell/templateValidation.js";

const ROUTES_DISCLOSURE_LIMIT = 8;
const INPUTS_DISCLOSURE_LIMIT = 6;

const BANK_ROLES = ["noun", "verb", "adjective", "adverb", "mixed", "literal"] as const;

interface PaletteEntry { variable: string; slot: string; form: string; available: boolean; }

interface VariablePaletteProps {
  deviceId: string;
  routeId: string;
  routeTemplate: string;
  templateRef: React.RefObject<HTMLTextAreaElement | null>;
  onClose: () => void;
  onInsert: (text: string, routeId: string) => void;
}

function VariablePalette({ deviceId, routeId, templateRef, onClose, onInsert }: VariablePaletteProps) {
  const project = useAppSelector((s) => s.project.present);
  const device = project.lineDevices.find((d) => d.id === deviceId);
  const [query, setQuery] = useState("");
  const [focusIdx, setFocusIdx] = useState(0);

  const entries: PaletteEntry[] = [];
  if (device) {
    for (const inp of device.inputs) {
      const bankMeta = project.materials.bankMeta[inp.tray];
      const role = bankMeta?.role ?? inp.role ?? "literal";
      const forms = formsForRole(role);
      const available = Object.keys(project.materials.trays).includes(inp.tray);
      for (const { key, label } of forms) {
        entries.push({ variable: `{${inp.slot}:${key}}`, slot: inp.slot, form: label, available });
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
      if (item && item.available) onInsert(item.variable, routeId);
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
          autoFocus
          className="tr-palette__search tr-input tr-input--sm"
          placeholder="Search variables…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setFocusIdx(0); }}
          aria-label="Search variables"
          aria-controls="tr-palette-list"
        />
        <button className="tr-btn tr-btn--ghost tr-btn--sm" onClick={onClose} aria-label="Close variable palette">Close</button>
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
  const runState = useAppSelector((s) => s.runtime.runState);
  const primary = useAppSelector((s) => s.selection.primary);

  const devices = project.lineDevices ?? [];
  const activeDeviceId =
    primary?.type === "device" ? primary.deviceId :
    primary?.type === "route" ? primary.deviceId :
    devices[0]?.id ?? null;
  const activeDevice = devices.find((d) => d.id === activeDeviceId) ?? null;

  const [newDeviceName, setNewDeviceName] = useState("");
  const [openPaletteForRoute, setOpenPaletteForRoute] = useState<string | null>(null);
  const [cueResult, setCueResult] = useState<LineEvent | null>(null);
  const [cueError, setCueError] = useState<string | null>(null);
  const [routeCue, setRouteCue] = useState<Record<string, { surface?: string; error?: string }>>({});
  const [removeDeviceError, setRemoveDeviceError] = useState<string | null>(null);
  const [advancedOpenFor, setAdvancedOpenFor] = useState<Record<string, boolean>>({});
  const [routesExpanded, setRoutesExpanded] = useState(false);
  const [inputsExpanded, setInputsExpanded] = useState(false);
  const templateRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});

  // E3: switching devices collapses any >8-route/>6-input disclosure back
  // to its default closed state rather than carrying it over.
  useEffect(() => {
    setRoutesExpanded(false);
    setInputsExpanded(false);
  }, [activeDeviceId]);

  // INS-01/DS-INS-03: every route card shows a readable rendered example by
  // default, not only after an explicit "Test route" click — recomputed
  // whenever this device's routes change (weight/template edits, upstream
  // Forms/Materials changes reflected through renderDeviceEvent) so the
  // example stays causally current (DS-INS-13).
  useEffect(() => {
    if (!activeDevice) return;
    const localRunState = { ...runState, queue: [...runState.queue] };
    setRouteCue((prev) => {
      const next = { ...prev };
      for (const rt of activeDevice.routes) {
        const ev = renderDeviceEvent(
          project, activeDevice.id, { type: "device", deviceId: activeDevice.id }, localRunState, Math.random, rt.id
        );
        next[rt.id] = ev.type === "line" ? { surface: (ev as LineEvent).surface } : { error: (ev as { error?: string }).error ?? "error" };
      }
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDevice]);

  function doCue() {
    if (!activeDevice) return;
    const localRunState = { ...runState, queue: [...runState.queue] };
    const ev = renderDeviceEvent(project, activeDevice.id, { type: "device", deviceId: activeDevice.id }, localRunState);
    if (ev.type === "line") {
      setCueResult(ev as LineEvent);
      setCueError(null);
    } else {
      setCueResult(null);
      setCueError((ev as { error?: string }).error ?? "error");
    }
  }

  // Testing beside the specific route being edited (INST-04) — the device
  // Cue above only exercises the device's normal weighted route pick, which
  // may never land on the route a user is actively authoring.
  function doCueRoute(routeId: string) {
    if (!activeDevice) return;
    const localRunState = { ...runState, queue: [...runState.queue] };
    const ev = renderDeviceEvent(
      project, activeDevice.id, { type: "device", deviceId: activeDevice.id }, localRunState, Math.random, routeId
    );
    setRouteCue((prev) => ({
      ...prev,
      [routeId]: ev.type === "line" ? { surface: (ev as LineEvent).surface } : { error: (ev as { error?: string }).error ?? "error" },
    }));
  }

  const selectedRouteId =
    primary?.type === "route" && primary.deviceId === activeDevice?.id
      ? primary.routeId
      : activeDevice?.routes[0]?.id ?? null;

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
        {/* E4: weight distinction — stated once, at the top of the chamber,
            not repeated per-route. */}
        <p className="tr-mat-weight-hint">
          Sample weight chooses a sample inside a bank. Route weight chooses which route this device uses.
        </p>
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
                onClick={() => {
                  const result = safeRemoveLineDevice(project, activeDevice.id);
                  if (isBlocked(result)) {
                    setRemoveDeviceError(`Cannot remove: ${result.reason} (${result.dependents.join(", ")})`);
                  } else {
                    setRemoveDeviceError(null);
                    dispatch(mutateProject(result));
                  }
                }}
                aria-label="Remove device"
              >
                Remove device
              </button>
              {removeDeviceError && (
                <span className="tr-error" role="alert">{removeDeviceError}</span>
              )}
            </div>

            <div className="tr-panel__subsection-head">INPUTS</div>
            <table className="tr-table">
              <thead>
                <tr>
                  <th scope="col" className="tr-table__th">Slot</th>
                  <th scope="col" className="tr-table__th">Bank</th>
                  <th scope="col" className="tr-table__th">Role</th>
                  <th scope="col" className="tr-table__th tr-table__th--action" aria-label="Remove input"></th>
                </tr>
              </thead>
              <tbody>
                {/* E3: more than 6 inputs collapses to a progressive
                    disclosure rather than a plain, ever-growing list. */}
                {(inputsExpanded ? activeDevice.inputs : activeDevice.inputs.slice(0, INPUTS_DISCLOSURE_LIMIT)).map((inp) => (
                  <tr key={inp.id} className="tr-table__row">
                    <td className="tr-table__td">
                      <input
                        className="tr-input tr-input--mono"
                        value={inp.slot}
                        onChange={(e) => dispatch(mutateProject(updateDeviceInput(project, activeDevice.id, inp.id, { slot: e.target.value })))}
                        aria-label="Slot name"
                        data-input-id={inp.id}
                        data-input-slot={inp.slot}
                      />
                    </td>
                    <td className="tr-table__td">
                      <select
                        className="tr-select tr-select--sm"
                        value={inp.tray}
                        onChange={(e) => dispatch(mutateProject(updateDeviceInput(project, activeDevice.id, inp.id, { tray: e.target.value })))}
                        aria-label="Bank"
                      >
                        {Object.keys(project.materials.trays).map((b) => (
                          <option key={b} value={b}>{project.materials.bankMeta[b]?.label ?? b}</option>
                        ))}
                      </select>
                    </td>
                    <td className="tr-table__td">
                      <select
                        className="tr-select tr-select--sm"
                        value={inp.role}
                        onChange={(e) => dispatch(mutateProject(updateDeviceInput(project, activeDevice.id, inp.id, { role: e.target.value })))}
                        aria-label="Role"
                      >
                        {BANK_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </td>
                    <td className="tr-table__td tr-table__td--action">
                      <button
                        className="tr-btn tr-btn--ghost tr-btn--sm"
                        aria-label={`Remove input ${inp.slot}`}
                        onClick={() => dispatch(mutateProject(removeDeviceInput(project, activeDevice.id, inp.id)))}
                      >Remove</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {activeDevice.inputs.length > INPUTS_DISCLOSURE_LIMIT && !inputsExpanded && (
              <div className="tr-panel__add-row">
                <button
                  type="button"
                  className="tr-btn tr-btn--ghost tr-btn--sm"
                  onClick={() => setInputsExpanded(true)}
                >
                  Show all inputs ({activeDevice.inputs.length})
                </button>
              </div>
            )}
            <div className="tr-panel__add-row">
              <button
                className="tr-btn tr-btn--ghost"
                onClick={() => dispatch(mutateProject(addDeviceInput(project, activeDevice.id, {
                  slot: `slot${activeDevice.inputs.length + 1}`,
                  tray: Object.keys(project.materials.trays)[0] ?? "above",
                  role: "literal",
                })))}
              >+ Input</button>
            </div>

            <div className="tr-panel__subsection-head">ROUTES</div>
            <div className="tr-routes">
              {activeDevice.routes.length === 0 && (
                <p className="tr-panel__empty">No routes yet. Add a route to make this device speak.</p>
              )}
              {/* E3: more than 8 routes collapses to a progressive disclosure;
                  the currently selected route always stays visible even if
                  it would otherwise fall past the fold. */}
              {(routesExpanded || activeDevice.routes.length <= ROUTES_DISCLOSURE_LIMIT
                ? activeDevice.routes
                : (() => {
                    const head = activeDevice.routes.slice(0, ROUTES_DISCLOSURE_LIMIT);
                    if (selectedRouteId && !head.some((r) => r.id === selectedRouteId)) {
                      const sel = activeDevice.routes.find((r) => r.id === selectedRouteId);
                      if (sel) return [...head, sel];
                    }
                    return head;
                  })()
              ).map((rt) => {
                const isSelected = rt.id === selectedRouteId;
                const templateIssues = validateRouteTemplate(rt.template, activeDevice, project);
                return (
                  <div
                    key={rt.id}
                    className={["tr-route", isSelected ? "tr-route--selected" : ""].filter(Boolean).join(" ")}
                  >
                    <div className="tr-route__header">
                      <button
                        className="tr-btn tr-btn--ghost tr-route__select-btn"
                        aria-pressed={isSelected}
                        onClick={() => dispatch(selectRoute({ deviceId: activeDevice.id, routeId: rt.id }))}
                      >
                        <span className="tr-route__name">{rt.name}</span>
                      </button>
                      <span className="tr-route__weight-label">wt</span>
                      <input
                        type="number"
                        className="tr-input tr-input--num"
                        value={rt.weight}
                        min={0}
                        max={999}
                        onChange={(e) => dispatch(mutateProject(setRouteWeight(project, activeDevice.id, rt.id, Number(e.target.value))))}
                        aria-label={`Weight for route ${rt.name}`}
                      />
                      <button
                        className="tr-btn tr-btn--ghost tr-btn--sm"
                        aria-label={`Remove route ${rt.name}`}
                        onClick={() => dispatch(mutateProject(removeRoute(project, activeDevice.id, rt.id)))}
                      >Remove</button>
                    </div>

                    {/* INS-01/DS-INS-03: readable example is the primary,
                        always-visible surface for every route card — raw
                        syntax lives under Advanced below, only when selected. */}
                    {routeCue[rt.id]?.error && (
                      <p className="tr-cue-device__error" role="alert">{routeCue[rt.id]!.error}</p>
                    )}
                    {routeCue[rt.id]?.surface && (
                      <p className="tr-route__example" aria-live="off">
                        <span className="tr-route__example-label">renders like</span> {routeCue[rt.id]!.surface}
                      </p>
                    )}

                    {isSelected && (
                      <div className="tr-route__editor">
                        <button
                          className="tr-btn tr-btn--ghost tr-btn--sm"
                          onClick={(e) => { e.stopPropagation(); doCueRoute(rt.id); }}
                          disabled={templateIssues.length > 0}
                          aria-label={`Audition this route, ${rt.name} (private, not recorded)${templateIssues.length > 0 ? " — blocked by template errors" : ""}`}
                        >
                          Audition this route
                        </button>

                        <div className="tr-route__advanced">
                          <button
                            type="button"
                            className="tr-btn tr-btn--ghost tr-btn--sm"
                            aria-expanded={Boolean(advancedOpenFor[rt.id])}
                            aria-controls={`tr-route-advanced-${rt.id}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              setAdvancedOpenFor((prev) => ({ ...prev, [rt.id]: !prev[rt.id] }));
                            }}
                          >
                            {advancedOpenFor[rt.id] ? "Hide advanced: raw template" : "Advanced: edit raw template"}
                          </button>
                          {advancedOpenFor[rt.id] && (
                            <div id={`tr-route-advanced-${rt.id}`} className="tr-route__advanced-body">
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
                                aria-invalid={templateIssues.length > 0}
                                aria-describedby={templateIssues.length > 0 ? `tr-route-template-errors-${rt.id}` : undefined}
                              />
                              {templateIssues.length > 0 && (
                                <ul id={`tr-route-template-errors-${rt.id}`} className="tr-route__template-errors" role="alert">
                                  {templateIssues.map((issue, i) => (
                                    <li key={i} className="tr-route__template-error">{issue.message}</li>
                                  ))}
                                </ul>
                              )}
                              <div className="tr-route__palette-row">
                                {activeDevice.inputs.length > 0 && (
                                  <button
                                    className="tr-btn tr-btn--ghost tr-btn--sm"
                                    aria-label="Insert variable…"
                                    aria-haspopup="dialog"
                                    onClick={(e) => { e.stopPropagation(); setOpenPaletteForRoute(openPaletteForRoute === rt.id ? null : rt.id); }}
                                  >
                                    {openPaletteForRoute === rt.id ? "Close palette" : "Insert variable…"}
                                  </button>
                                )}
                              </div>
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
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {!routesExpanded && activeDevice.routes.length > ROUTES_DISCLOSURE_LIMIT && (
                <button
                  type="button"
                  className="tr-btn tr-btn--ghost tr-btn--sm"
                  onClick={() => setRoutesExpanded(true)}
                >
                  Show all {activeDevice.routes.length} routes
                </button>
              )}
              <button
                className="tr-btn tr-btn--ghost"
                onClick={() => dispatch(mutateProject(addRoute(project, activeDevice.id, { id: uid("rt"), name: "new route", weight: 10, template: "" })))}
              >
                + Route
              </button>
            </div>
            <div className="tr-panel__subsection-head">CUE</div>
            <div className="tr-cue-device">
              <button
                className="tr-btn tr-btn--ghost tr-cue-device__btn"
                onClick={doCue}
                aria-label={`Audition device ${activeDevice.name} (private, not recorded)`}
              >
                Cue
              </button>
              {cueError && (
                <p className="tr-cue-device__error" role="alert">{cueError}</p>
              )}
              {cueResult && (
                <div className="tr-cue-device__output" aria-live="polite" aria-atomic="true">
                  <p className="tr-cue-device__line">{cueResult.surface}</p>
                </div>
              )}
            </div>
          </>
        ) : (
          <p className="tr-panel__empty">Select a device to view its routes.</p>
        )}
      </div>
    </div>
  );
}
