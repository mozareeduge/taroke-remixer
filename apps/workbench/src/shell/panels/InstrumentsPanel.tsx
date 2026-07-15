import { useState, useRef, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks.js";
import {
  addDevice,
  updateDeviceName,
  toggleDevice,
  removeDevice,
  addDeviceInput,
  updateDeviceInputSlot,
  updateDeviceInputTray,
  updateDeviceInputRole,
  removeDeviceInput,
  reorderDeviceInputs,
  addRoute,
  updateRouteTemplate,
  updateRouteName,
  setRouteWeight,
  removeRoute,
} from "../../store/commands.js";
import { mutateProject } from "../../store/projectSlice.js";
import { selectDevice } from "../../store/selectionSlice.js";

// Supported role vocabulary
const SUPPORTED_ROLES = ["noun", "verb", "adjective", "adverb", "phrase", "literal"] as const;
type SupportedRole = (typeof SUPPORTED_ROLES)[number];

// Route variable palette
interface PaletteProps {
  deviceId: string;
  routeId: string;
  templateRef: React.RefObject<HTMLTextAreaElement | null>;
  onClose: () => void;
  onInsert: (text: string) => void;
}

function VariablePalette({ deviceId, templateRef, onClose, onInsert }: PaletteProps) {
  const project = useAppSelector((s) => s.project.present);
  const device = project.lineDevices.find((d) => d.id === deviceId);
  const [query, setQuery] = useState("");
  const [focusIdx, setFocusIdx] = useState(0);
  const searchRef = useRef<HTMLInputElement>(null);

  const FORMS_FOR_ROLE: Record<string, string[]> = {
    noun:      ["literal", "singular", "plural"],
    verb:      ["literal", "base", "thirdSingular", "imperative"],
    adjective: ["literal"],
    adverb:    ["literal"],
    phrase:    ["literal"],
    literal:   ["literal"],
  };

  const entries: { variable: string; slot: string; form: string; available: boolean }[] = [];
  if (device) {
    for (const inp of device.inputs) {
      const bankMeta = project.materials.bankMeta[inp.tray];
      const role = bankMeta?.role ?? inp.role ?? "literal";
      const forms = FORMS_FOR_ROLE[role] ?? ["literal"];
      for (const form of forms) {
        entries.push({
          variable: `{${inp.slot}:${form}}`,
          slot: inp.slot,
          form,
          available: Object.keys(project.materials.trays).includes(inp.tray),
        });
      }
    }
    // article helper
    entries.push({ variable: "{article:a}", slot: "article", form: "a", available: true });
    entries.push({ variable: "{article:an}", slot: "article", form: "an", available: true });
  }

  const filtered = entries.filter(
    (e) => !query || e.variable.includes(query) || e.slot.includes(query) || e.form.includes(query),
  );

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") { e.preventDefault(); onClose(); }
    if (e.key === "ArrowDown") { e.preventDefault(); setFocusIdx((f) => Math.min(f + 1, filtered.length - 1)); }
    if (e.key === "ArrowUp") { e.preventDefault(); setFocusIdx((f) => Math.max(f - 1, 0)); }
    if (e.key === "Enter") { e.preventDefault(); const item = filtered[focusIdx]; if (item) onInsert(item.variable); }
  };

  return (
    <div
      className="tr-palette"
      role="dialog"
      aria-label="Insert variable"
      onKeyDown={handleKey}
    >
      <div className="tr-palette__header">
        <input
          ref={searchRef}
          autoFocus
          className="tr-palette__search"
          placeholder="Search variables…"
          value={query}
          onChange={(e) => { setQuery(e.target.value); setFocusIdx(0); }}
          aria-label="Search variables"
        />
        <button className="tr-palette__close" onClick={onClose} aria-label="Close variable palette">✕</button>
      </div>
      <ul className="tr-palette__list" role="listbox">
        {filtered.length === 0 && <li className="tr-palette__empty">No variables match</li>}
        {filtered.map((item, i) => (
          <li
            key={item.variable}
            className={[
              "tr-palette__item",
              i === focusIdx ? "tr-palette__item--focused" : "",
              !item.available ? "tr-palette__item--unavailable" : "",
            ].filter(Boolean).join(" ")}
            role="option"
            aria-selected={i === focusIdx}
            title={!item.available ? "Bank not available" : ""}
            onMouseEnter={() => setFocusIdx(i)}
            onMouseDown={(e) => { e.preventDefault(); onInsert(item.variable); }}
          >
            <code className="tr-palette__var">{item.variable}</code>
            <span className="tr-palette__slot">{item.slot}</span>
            <span className="tr-palette__form">{item.form}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Route template editor with variable palette
function RouteEditor({ deviceId, routeId }: { deviceId: string; routeId: string }) {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const device = project.lineDevices.find((d) => d.id === deviceId);
  const route = device?.routes.find((r) => r.id === routeId);
  const textRef = useRef<HTMLTextAreaElement | null>(null);
  const [showPalette, setShowPalette] = useState(false);

  const dispatchCmd = useCallback(
    (cmd: ReturnType<typeof addDevice>) => {
      dispatch(mutateProject({ label: cmd.label, present: cmd.present, patches: cmd.patches, inversePatches: cmd.inversePatches }));
    },
    [dispatch],
  );

  if (!device || !route) return null;

  const insertAtCaret = (text: string) => {
    const ta = textRef.current;
    if (!ta) {
      dispatchCmd(updateRouteTemplate(project, deviceId, routeId, route.template + text));
      setShowPalette(false);
      return;
    }
    const start = ta.selectionStart ?? route.template.length;
    const end = ta.selectionEnd ?? route.template.length;
    const newTemplate = route.template.slice(0, start) + text + route.template.slice(end);
    dispatchCmd(updateRouteTemplate(project, deviceId, routeId, newTemplate));
    setShowPalette(false);
    // Restore focus and caret
    requestAnimationFrame(() => {
      ta.focus();
      const newCaret = start + text.length;
      ta.setSelectionRange(newCaret, newCaret);
    });
  };

  // Validate template variables
  const unknownVars = [...route.template.matchAll(/\{([^}]+)\}/g)]
    .map((m) => m[1]!)
    .filter((v) => {
      const [slot, form] = v.split(":");
      if (slot === "article") return false;
      return !device.inputs.some((inp) => inp.slot === slot);
    });

  return (
    <div className="tr-route-editor">
      <div className="tr-route-editor__row">
        <input
          className="tr-route-editor__name"
          value={route.name}
          aria-label="Route name"
          onChange={(e) => dispatchCmd(updateRouteName(project, deviceId, routeId, e.target.value))}
        />
        <input
          type="number"
          className="tr-route-editor__weight"
          value={route.weight}
          min={0}
          aria-label="Route weight"
          onChange={(e) => dispatchCmd(setRouteWeight(project, deviceId, routeId, Number(e.target.value)))}
        />
      </div>
      <div className="tr-route-editor__template-wrap">
        <textarea
          ref={textRef}
          className="tr-route-editor__template"
          value={route.template}
          rows={2}
          aria-label="Route template"
          onChange={(e) => dispatchCmd(updateRouteTemplate(project, deviceId, routeId, e.target.value))}
          onKeyDown={(e) => { if ((e.ctrlKey || e.metaKey) && e.key === " ") { e.preventDefault(); setShowPalette(true); } }}
        />
        <button
          className="tr-route-editor__insert-btn"
          aria-label="Insert variable"
          onClick={() => setShowPalette((v) => !v)}
          title="Insert variable (Ctrl+Space)"
        >
          {"{…}"}
        </button>
      </div>
      {unknownVars.length > 0 && (
        <p className="tr-route-editor__warning" role="alert">
          Unknown slots: {unknownVars.join(", ")}
        </p>
      )}
      {showPalette && (
        <VariablePalette
          deviceId={deviceId}
          routeId={routeId}
          templateRef={textRef}
          onClose={() => setShowPalette(false)}
          onInsert={insertAtCaret}
        />
      )}
    </div>
  );
}

export function InstrumentsPanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const selection = useAppSelector((s) => s.selection.primary);
  const [expandedDevice, setExpandedDevice] = useState<string | null>(null);
  const [expandedRoute, setExpandedRoute] = useState<string | null>(null);
  const [slotErrors, setSlotErrors] = useState<Record<string, string>>({});

  const activeDeviceId =
    selection?.type === "device" ? selection.deviceId :
    selection?.type === "route" ? selection.deviceId :
    expandedDevice;

  const dispatchCmd = useCallback(
    (cmd: ReturnType<typeof addDevice>) => {
      dispatch(mutateProject({ label: cmd.label, present: cmd.present, patches: cmd.patches, inversePatches: cmd.inversePatches }));
    },
    [dispatch],
  );

  const toggleExpand = (id: string) => {
    setExpandedDevice((prev) => (prev === id ? null : id));
    dispatch(selectDevice(id));
  };

  const addNewDevice = () => {
    const name = `Device ${project.lineDevices.length + 1}`;
    dispatchCmd(addDevice(project, name));
  };

  const bankNames = Object.keys(project.materials.trays);

  // Validate slot rename
  const validateSlotRename = (deviceId: string, inputIdx: number, newSlot: string): string | null => {
    if (!newSlot.trim()) return "Slot name cannot be empty.";
    const device = project.lineDevices.find((d) => d.id === deviceId);
    if (!device) return null;
    const duplicate = device.inputs.some((inp, i) => i !== inputIdx && inp.slot === newSlot.trim());
    if (duplicate) return `Slot name "${newSlot}" is already used in this device.`;
    return null;
  };

  return (
    <div className="tr-panel tr-instruments">
      <section className="tr-panel__section">
        <h2 className="tr-panel__heading">Devices</h2>
        <button className="tr-btn tr-btn--primary" onClick={addNewDevice} aria-label="Add device">
          + Add device
        </button>
      </section>

      {project.lineDevices.map((device) => {
        const isExpanded = expandedDevice === device.id || activeDeviceId === device.id;
        return (
          <section
            key={device.id}
            className={["tr-device", isExpanded ? "tr-device--expanded" : ""].filter(Boolean).join(" ")}
          >
            <div className="tr-device__header">
              <button
                className="tr-device__expand"
                aria-expanded={isExpanded}
                aria-controls={`device-body-${device.id}`}
                onClick={() => { toggleExpand(device.id); setExpandedDevice(isExpanded ? null : device.id); }}
              >
                {isExpanded ? "▾" : "▸"}
              </button>
              <input
                className="tr-device__name"
                value={device.name}
                aria-label="Device name"
                onChange={(e) => dispatchCmd(updateDeviceName(project, device.id, e.target.value))}
                onClick={() => dispatch(selectDevice(device.id))}
              />
              <label className="tr-device__enabled">
                <input
                  type="checkbox"
                  checked={device.enabled}
                  aria-label={`${device.name} enabled`}
                  onChange={() => dispatchCmd(toggleDevice(project, device.id))}
                />
                Enabled
              </label>
              <button
                className="tr-device__remove"
                aria-label={`Remove device ${device.name}`}
                onClick={() => {
                  if (window.confirm(`Remove device "${device.name}"? This cannot be undone.`)) {
                    dispatchCmd(removeDevice(project, device.id));
                  }
                }}
              >✕</button>
            </div>

            {isExpanded && (
              <div id={`device-body-${device.id}`} className="tr-device__body">
                {/* Inputs */}
                <div className="tr-device__inputs">
                  <h3 className="tr-device__subheading">Inputs</h3>
                  {device.inputs.map((inp, idx) => {
                    const errKey = `${device.id}:${idx}`;
                    return (
                      <div key={idx} className="tr-input-row">
                        <div className="tr-input-row__fields">
                          <label className="tr-input-row__label">Slot</label>
                          <input
                            className="tr-input-row__slot"
                            value={inp.slot}
                            aria-label={`Input ${idx + 1} slot name`}
                            onChange={(e) => {
                              const err = validateSlotRename(device.id, idx, e.target.value);
                              setSlotErrors((prev) => ({ ...prev, [errKey]: err ?? "" }));
                              if (!err) dispatchCmd(updateDeviceInputSlot(project, device.id, idx, e.target.value));
                            }}
                          />
                          {slotErrors[errKey] && (
                            <span className="tr-input-row__error" role="alert">{slotErrors[errKey]}</span>
                          )}
                          <label className="tr-input-row__label">Bank</label>
                          <select
                            className="tr-input-row__tray"
                            value={inp.tray}
                            aria-label={`Input ${idx + 1} bank`}
                            onChange={(e) => dispatchCmd(updateDeviceInputTray(project, device.id, idx, e.target.value))}
                          >
                            {bankNames.map((b) => (
                              <option key={b} value={b}>{project.materials.bankMeta[b]?.label ?? b}</option>
                            ))}
                          </select>
                          <label className="tr-input-row__label">Role</label>
                          <select
                            className="tr-input-row__role"
                            value={inp.role}
                            aria-label={`Input ${idx + 1} role`}
                            onChange={(e) => dispatchCmd(updateDeviceInputRole(project, device.id, idx, e.target.value as SupportedRole))}
                          >
                            {SUPPORTED_ROLES.map((r) => (
                              <option key={r} value={r}>{r}</option>
                            ))}
                          </select>
                        </div>
                        <button
                          className="tr-input-row__remove"
                          aria-label={`Remove input ${inp.slot}`}
                          title="Delete input (guards references in routes)"
                          onClick={() => {
                            const refsInRoutes = device.routes.some((r) =>
                              r.template.includes(`{${inp.slot}:`),
                            );
                            if (refsInRoutes && !window.confirm(`Input "${inp.slot}" is referenced in one or more routes. Remove anyway?`)) return;
                            dispatchCmd(removeDeviceInput(project, device.id, inp.slot));
                          }}
                        >✕</button>
                      </div>
                    );
                  })}
                  <button
                    className="tr-btn tr-btn--secondary"
                    aria-label="Add input"
                    onClick={() => {
                      const slot = `slot${device.inputs.length + 1}`;
                      const tray = bankNames[0] ?? "above";
                      dispatchCmd(addDeviceInput(project, device.id, { slot, tray, role: "noun" }));
                    }}
                  >
                    + Add input
                  </button>
                </div>

                {/* Routes */}
                <div className="tr-device__routes">
                  <h3 className="tr-device__subheading">Routes</h3>
                  {device.routes.map((route) => (
                    <div key={route.id} className="tr-route">
                      <div className="tr-route__header">
                        <button
                          className="tr-route__expand"
                          aria-expanded={expandedRoute === route.id}
                          onClick={() => setExpandedRoute((prev) => (prev === route.id ? null : route.id))}
                        >
                          {expandedRoute === route.id ? "▾" : "▸"} {route.name}
                        </button>
                        <button
                          className="tr-route__remove"
                          aria-label={`Remove route ${route.name}`}
                          onClick={() => dispatchCmd(removeRoute(project, device.id, route.id))}
                        >✕</button>
                      </div>
                      {expandedRoute === route.id && (
                        <RouteEditor deviceId={device.id} routeId={route.id} />
                      )}
                    </div>
                  ))}
                  <button
                    className="tr-btn tr-btn--secondary"
                    aria-label="Add route"
                    onClick={() => dispatchCmd(addRoute(project, device.id))}
                  >
                    + Add route
                  </button>
                </div>
              </div>
            )}
          </section>
        );
      })}

      {project.lineDevices.length === 0 && (
        <p className="tr-panel__empty">No devices. Add one above.</p>
      )}
    </div>
  );
}
