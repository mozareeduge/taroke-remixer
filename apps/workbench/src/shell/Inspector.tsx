import { useState, useEffect, useRef, type MutableRefObject } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { selectBank } from "../store/selectionSlice.js";
import { setActivePanel } from "../store/editorSlice.js";
import { announce } from "../store/feedbackSlice.js";
import { ConfirmInline } from "./ConfirmInline.js";
import type { SelectionTarget } from "../store/types.js";
import type { TarokeProject } from "@taroke/schema";
import type { AppDispatch } from "../store/store.js";
import {
  updateTokenLiteral, setTokenWeight, setTokenLockedLiteral,
  updateDeviceName, updateDeviceDescription, toggleDeviceEnabled,
  updateRouteTemplate, setRouteWeight,
  updateStanzaName, toggleStanzaEnabled,
  updateSceneName, toggleSceneEnabled, setSceneChance,
  setBankLabel, setTokenOverride, removeToken, moveBetweenBanks,
} from "../store/commands.js";
import { formToken } from "@taroke/core";
import { formsForRole, getFormOverride, isFormKept } from "./formRoles.js";

type NonNullTarget = Exclude<SelectionTarget, null>;

function InspectorBody({
  primary,
  project,
  dispatch,
}: {
  primary: NonNullTarget;
  project: TarokeProject;
  dispatch: AppDispatch;
}) {
  const [pendingRemoveTokenId, setPendingRemoveTokenId] = useState<string | null>(null);
  const [moveTargetBank, setMoveTargetBank] = useState<string>("");

  if (primary.type === "bank") {
    const meta = project.materials.bankMeta[primary.bankName];
    const count = project.materials.trays[primary.bankName]?.length ?? 0;
    return (
      <div className="tr-inspector__fields">
        <label className="tr-inspector__label">Label</label>
        <input
          className="tr-input"
          defaultValue={meta?.label ?? primary.bankName}
          key={primary.bankName + "-label"}
          onBlur={(e) => dispatch(mutateProject(setBankLabel(project, primary.bankName, e.target.value)))}
          aria-label="Bank label"
        />
        <label className="tr-inspector__label">Role</label>
        <div className="tr-inspector__value">{meta?.role ?? "literal"}</div>
        <label className="tr-inspector__label">Samples</label>
        <div className="tr-inspector__value">{count}</div>
        <label className="tr-inspector__label">Description</label>
        <div className="tr-inspector__value">{meta?.desc ?? "—"}</div>
      </div>
    );
  }

  if (primary.type === "token") {
    const tok = project.materials.trays[primary.bankName]?.find((t) => t.id === primary.tokenId);
    if (!tok) return <div className="tr-inspector__value">Sample not found</div>;
    const bankMeta = project.materials.bankMeta[primary.bankName];
    const bankRole = bankMeta?.role ?? "literal";
    const allTokens = project.materials.trays[primary.bankName] ?? [];
    const totalWeight = allTokens.reduce((s, t) => s + (t.weight || 0), 0);
    const sharePercent = totalWeight > 0 ? Math.round((tok.weight / totalWeight) * 100) : 0;
    const forms = formsForRole(bankRole);
    const otherBanks = Object.keys(project.materials.trays).filter((b) => b !== primary.bankName);

    return (
      <div className="tr-inspector__fields">
        <label className="tr-inspector__label">Literal</label>
        <input
          className="tr-input"
          defaultValue={tok.literal}
          key={tok.id + "-literal"}
          onBlur={(e) => dispatch(mutateProject(updateTokenLiteral(project, primary.bankName, tok.id, e.target.value)))}
          aria-label="Sample literal"
        />

        <label className="tr-inspector__label">Role</label>
        <div className="tr-inspector__value">{bankRole}</div>

        <label className="tr-inspector__label">Weight · Share</label>
        <div className="tr-inspector__weight-row">
          <input
            className="tr-input tr-input--num"
            type="number"
            defaultValue={tok.weight}
            key={tok.id + "-weight"}
            min={0}
            max={999}
            onBlur={(e) => dispatch(mutateProject(setTokenWeight(project, primary.bankName, tok.id, Number(e.target.value))))}
            aria-label="Sample weight"
          />
          <span className="tr-inspector__share" aria-label={`${sharePercent}% share`}>{sharePercent}%</span>
        </div>
        <div className="tr-inspector__share-bar" role="presentation">
          <div className="tr-inspector__share-fill" style={{ width: `${sharePercent}%` }} />
        </div>

        <div className="tr-inspector__subsection">FORM EXCEPTIONS</div>
        <p className="tr-inspector__hint">Full before→after bench is in the Forms chamber.</p>
        {forms.map(({ key, label }) => {
          const kept = isFormKept(project, tok!.id, key);
          const ov = getFormOverride(project, tok!.id, key);
          const preview = formToken(project, tok, key);
          return (
            <div key={key} className="tr-inspector__form-row">
              <span className="tr-inspector__form-label">{label}</span>
              <span className="tr-inspector__form-preview" aria-label={`Preview: ${preview}`}>{preview}</span>
              <input
                className="tr-input tr-input--sm tr-inspector__form-input"
                type="text"
                disabled={kept}
                value={ov}
                placeholder={kept ? "(keeping literal)" : "(auto)"}
                aria-label={`${label} override`}
                data-form-override={`${tok!.id}:${key}`}
                onChange={(e) => dispatch(mutateProject(setTokenOverride(project, tok!.id, key, e.target.value)))}
              />
            </div>
          );
        })}

        <div className="tr-inspector__actions">
          {otherBanks.length > 0 && (
            <div className="tr-inspector__action-group">
              <label className="tr-inspector__action-label" htmlFor="tr-inspector-move-target">Move to bank</label>
              <div className="tr-inspector__move-row">
                <select
                  id="tr-inspector-move-target"
                  className="tr-select"
                  key={tok.id + "-move-target"}
                  value={moveTargetBank}
                  onChange={(e) => setMoveTargetBank(e.target.value)}
                  aria-label="Destination bank"
                >
                  <option value="">Choose a bank…</option>
                  {otherBanks.map((b) => (
                    <option key={b} value={b}>{project.materials.bankMeta[b]?.label ?? b}</option>
                  ))}
                </select>
                <button
                  className="tr-btn tr-btn--ghost tr-btn--sm"
                  disabled={!moveTargetBank}
                  aria-disabled={!moveTargetBank}
                  onClick={() => {
                    if (!moveTargetBank) return;
                    const targetLabel = project.materials.bankMeta[moveTargetBank]?.label ?? moveTargetBank;
                    dispatch(mutateProject(moveBetweenBanks(project, primary.bankName, tok.id, moveTargetBank)));
                    dispatch(selectBank(moveTargetBank));
                    dispatch(announce(`Moved "${tok.literal}" to ${targetLabel}.`));
                    setMoveTargetBank("");
                  }}
                  aria-label={`Move ${tok.literal} to selected bank`}
                >
                  Move
                </button>
              </div>
            </div>
          )}
          <button
            className="tr-btn tr-btn--ghost tr-btn--sm"
            onClick={() => dispatch(mutateProject(setTokenLockedLiteral(project, primary.bankName, tok.id, !tok.lockedLiteral)))}
            aria-label={tok.lockedLiteral ? "Unlock literal" : "Keep literal unchanged"}
          >
            {tok.lockedLiteral ? "Unlock literal" : "Keep unchanged"}
          </button>
          {pendingRemoveTokenId === tok.id ? (
            <ConfirmInline
              message={`Remove "${tok.literal}" from ${bankMeta?.label ?? primary.bankName}? This may affect devices that reference this bank.`}
              onCancel={() => setPendingRemoveTokenId(null)}
              onConfirm={() => {
                dispatch(mutateProject(removeToken(project, primary.bankName, tok.id)));
                dispatch(announce(`Removed "${tok.literal}" from ${bankMeta?.label ?? primary.bankName}.`));
                setPendingRemoveTokenId(null);
              }}
            />
          ) : (
            <button
              className="tr-btn tr-btn--ghost tr-btn--sm tr-btn--danger"
              onClick={() => setPendingRemoveTokenId(tok.id)}
              aria-label={`Remove sample ${tok.literal}`}
            >
              Remove sample
            </button>
          )}
        </div>
      </div>
    );
  }

  if (primary.type === "device") {
    const dev = project.lineDevices.find((d) => d.id === primary.deviceId);
    if (!dev) return <div className="tr-inspector__value">Device not found</div>;
    return (
      <div className="tr-inspector__fields">
        <label className="tr-inspector__label">Name</label>
        <input
          className="tr-input"
          defaultValue={dev.name}
          key={dev.id + "-name"}
          onBlur={(e) => dispatch(mutateProject(updateDeviceName(project, dev.id, e.target.value)))}
          aria-label="Device name"
        />
        <label className="tr-inspector__label">Enabled</label>
        <input
          type="checkbox"
          checked={dev.enabled}
          onChange={() => dispatch(mutateProject(toggleDeviceEnabled(project, dev.id)))}
          aria-label="Device enabled"
        />
        <label className="tr-inspector__label">Description</label>
        <textarea
          className="tr-input tr-input--textarea"
          defaultValue={dev.description}
          key={dev.id + "-desc"}
          rows={3}
          onBlur={(e) => dispatch(mutateProject(updateDeviceDescription(project, dev.id, e.target.value)))}
          aria-label="Device description"
        />
      </div>
    );
  }

  if (primary.type === "route") {
    const dev = project.lineDevices.find((d) => d.id === primary.deviceId);
    const rt = dev?.routes.find((r) => r.id === primary.routeId);
    if (!rt || !dev) return <div className="tr-inspector__value">Route not found</div>;
    const slots = dev.inputs.map((i) => `{${i.slot}:literal}`).join(", ");
    return (
      <div className="tr-inspector__fields">
        <label className="tr-inspector__label">Route</label>
        <div className="tr-inspector__value">{rt.name}</div>
        <label className="tr-inspector__label">Weight</label>
        <input
          className="tr-input tr-input--num"
          type="number"
          defaultValue={rt.weight}
          key={rt.id + "-weight"}
          min={0}
          max={999}
          onBlur={(e) => dispatch(mutateProject(setRouteWeight(project, dev.id, rt.id, Number(e.target.value))))}
          aria-label="Route weight"
        />
        <label className="tr-inspector__label">Template</label>
        <textarea
          className="tr-input tr-input--textarea"
          defaultValue={rt.template}
          key={rt.id + "-template"}
          rows={4}
          onBlur={(e) => dispatch(mutateProject(updateRouteTemplate(project, dev.id, rt.id, e.target.value)))}
          aria-label="Route template"
          spellCheck={false}
        />
        <div className="tr-inspector__hint">Slots: {slots || "none"}</div>
      </div>
    );
  }

  if (primary.type === "stanza") {
    const st = project.stanzaPatterns.find((s) => s.id === primary.stanzaId);
    if (!st) return <div className="tr-inspector__value">Pattern not found</div>;
    return (
      <div className="tr-inspector__fields">
        <label className="tr-inspector__label">Name</label>
        <input
          className="tr-input"
          defaultValue={st.name}
          key={st.id + "-name"}
          onBlur={(e) => dispatch(mutateProject(updateStanzaName(project, st.id, e.target.value)))}
          aria-label="Pattern name"
        />
        <label className="tr-inspector__label">Enabled</label>
        <input
          type="checkbox"
          checked={st.enabled}
          onChange={() => dispatch(mutateProject(toggleStanzaEnabled(project, st.id)))}
          aria-label="Pattern enabled"
        />
        <label className="tr-inspector__label">Slots</label>
        <div className="tr-inspector__value">{st.slots.length}</div>
      </div>
    );
  }

  if (primary.type === "scene") {
    const sc = project.flowScenes.find((s) => s.id === primary.sceneId);
    if (!sc) return <div className="tr-inspector__value">Scene not found</div>;
    return (
      <div className="tr-inspector__fields">
        <label className="tr-inspector__label">Name</label>
        <input
          className="tr-input"
          defaultValue={sc.name}
          key={sc.id + "-name"}
          onBlur={(e) => dispatch(mutateProject(updateSceneName(project, sc.id, e.target.value)))}
          aria-label="Scene name"
        />
        <label className="tr-inspector__label">Enabled</label>
        <input
          type="checkbox"
          checked={sc.enabled}
          onChange={() => dispatch(mutateProject(toggleSceneEnabled(project, sc.id)))}
          aria-label="Scene enabled"
        />
        <label className="tr-inspector__label">Chance</label>
        <input
          className="tr-input tr-input--num"
          type="number"
          defaultValue={sc.chance}
          key={sc.id + "-chance"}
          min={0}
          max={100}
          onBlur={(e) => dispatch(mutateProject(setSceneChance(project, sc.id, Number(e.target.value))))}
          aria-label="Scene chance"
        />
        <label className="tr-inspector__label">Mode</label>
        <div className="tr-inspector__value">{sc.mode}</div>
      </div>
    );
  }

  if (primary.type === "trigger") {
    const tr = project.triggers.find((t) => t.id === primary.triggerId);
    if (!tr) return <div className="tr-inspector__value">Trigger not found</div>;
    const bankLabel = project.materials.bankMeta[tr.condition.tray]?.label ?? tr.condition.tray;
    const termDisplay = tr.condition.term || "any (wildcard)";
    const complete = tr.action.text.trim().length > 0;
    const state = !complete ? "Draft (incomplete)" : tr.enabled ? "Enabled" : "Disabled";
    // The WHEN/chance/THEN editor and its no-op validation live only in the
    // Automation chamber (ACT-05) — a second, unvalidated copy here would let
    // edits silently diverge from what Automation enforces.
    return (
      <div className="tr-inspector__fields">
        <label className="tr-inspector__label">Name</label>
        <div className="tr-inspector__value">{tr.name}</div>
        <label className="tr-inspector__label">State</label>
        <div className="tr-inspector__value">{state}</div>
        <label className="tr-inspector__label">Rule</label>
        <div className="tr-inspector__value">
          WHEN {bankLabel} {termDisplay} → {tr.chance}% → THEN {tr.action.type} {complete ? tr.action.text : "(no action text)"}
        </div>
        <button
          className="tr-btn tr-btn--ghost tr-btn--sm"
          onClick={() => dispatch(setActivePanel("automation"))}
          aria-label={`Edit trigger ${tr.name} in Automation`}
        >
          Edit in Automation
        </button>
      </div>
    );
  }

  return null;
}

export function Inspector({
  onClose,
  panelRef,
}: {
  onClose?: () => void;
  panelRef?: MutableRefObject<HTMLElement | null>;
}) {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const primary = useAppSelector((s) => s.selection.primary);
  const inspectorOpen = useAppSelector((s) => s.editor.inspectorOpen);
  const inspectorMode = useAppSelector((s) => s.editor.inspectorMode);

  const modeClass = `tr-inspector--${inspectorMode}`;
  const isModalSheet = inspectorMode === "sheet" && inspectorOpen;

  const asideRef = useRef<HTMLElement | null>(null);

  // aria-hidden alone does not stop assistive tech or the browser from
  // focusing descendants (axe: aria-hidden-focus) — when the Inspector is
  // closed in overlay/sheet mode, its buttons and inputs stay in the DOM and
  // stay tabbable unless the subtree is also made genuinely inert.
  useEffect(() => {
    const el = asideRef.current as (HTMLElement & { inert?: boolean }) | null;
    if (el) el.inert = !inspectorOpen;
  }, [inspectorOpen]);

  return (
    <aside
      ref={(node) => {
        asideRef.current = node;
        if (panelRef) panelRef.current = node;
      }}
      className={[
        "tr-inspector",
        modeClass,
        inspectorOpen ? "tr-inspector--open" : "",
      ].filter(Boolean).join(" ")}
      aria-label="Inspector"
      aria-hidden={!inspectorOpen}
      role={isModalSheet ? "dialog" : undefined}
      aria-modal={isModalSheet ? true : undefined}
    >
      {(inspectorMode === "overlay" || inspectorMode === "sheet") && inspectorOpen && (
        <button
          className="tr-inspector__close"
          aria-label="Close inspector"
          onClick={onClose}
        >
          Close
        </button>
      )}
      {primary ? (
        <div className="tr-inspector__content">
          <div className="tr-inspector__type">{primary.type.toUpperCase()}</div>
          <InspectorBody primary={primary} project={project} dispatch={dispatch} />
        </div>
      ) : (
        <div className="tr-inspector__empty">
          <span className="tr-inspector__hint">Select an item to inspect</span>
        </div>
      )}
    </aside>
  );
}
