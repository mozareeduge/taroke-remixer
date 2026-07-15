import { useRef, useState, useCallback } from "react";
import { useAppDispatch, useAppSelector } from "../../store/hooks.js";
import {
  addToken,
  updateTokenLiteral,
  setTokenWeight,
  removeToken,
  reorderTokens,
  setTokenOverride,
} from "../../store/commands.js";
import { mutateProject } from "../../store/projectSlice.js";
import { selectBank, selectToken } from "../../store/selectionSlice.js";
import { formToken } from "@taroke/core";
import type { Token } from "@taroke/schema";

// Forms meaningful for each bank role
const ROLE_FORMS: Record<string, { key: string; label: string }[]> = {
  noun:      [{ key: "literal", label: "Base/literal" }, { key: "singular", label: "Singular" }, { key: "plural", label: "Plural" }],
  verb:      [{ key: "literal", label: "Base/literal" }, { key: "thirdSingular", label: "3rd singular" }, { key: "imperative", label: "Imperative" }],
  adjective: [{ key: "literal", label: "Base/literal" }],
  adverb:    [{ key: "literal", label: "Base/literal" }],
  phrase:    [{ key: "literal", label: "Literal phrase" }],
  literal:   [{ key: "literal", label: "Literal" }],
};

const KEEP_UNCHANGED = "__keep__";

export function MaterialsPanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const selection = useAppSelector((s) => s.selection.primary);
  const [newLiteral, setNewLiteral] = useState("");
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const addRef = useRef<HTMLInputElement>(null);

  const bankNames = Object.keys(project.materials.trays);
  const activeBank =
    selection?.type === "bank" ? selection.bankName :
    selection?.type === "token" ? selection.bankName :
    bankNames[0] ?? null;

  const bankMeta = activeBank ? project.materials.bankMeta[activeBank] : null;
  const bankRole = bankMeta?.role ?? "literal";
  const tokens: Token[] = activeBank ? (project.materials.trays[activeBank] ?? []) : [];

  const selectedTokenId =
    selection?.type === "token" && selection.bankName === activeBank
      ? selection.tokenId : null;

  const totalWeight = tokens.reduce((s, t) => s + (t.weight ?? 1), 0);

  const dispatchCmd = useCallback(
    (cmd: ReturnType<typeof addToken>) => {
      dispatch(mutateProject({ label: cmd.label, present: cmd.present, patches: cmd.patches, inversePatches: cmd.inversePatches }));
    },
    [dispatch],
  );

  // ── drag/drop reorder ──────────────────────────────────────────────────────
  const onDragStart = (i: number) => setDragFrom(i);
  const onDragOver = (e: React.DragEvent, i: number) => { e.preventDefault(); setDragOver(i); };
  const onDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault();
    if (dragFrom === null || dragFrom === i || !activeBank) { setDragFrom(null); setDragOver(null); return; }
    const ids = tokens.map((t) => t.id);
    const [moved] = ids.splice(dragFrom, 1);
    ids.splice(i, 0, moved!);
    dispatchCmd(reorderTokens(project, activeBank, ids));
    setDragFrom(null);
    setDragOver(null);
  };
  const onDragEnd = () => { setDragFrom(null); setDragOver(null); };

  // ── explicit reorder buttons ───────────────────────────────────────────────
  const moveToken = (from: number, to: number) => {
    if (!activeBank) return;
    const ids = tokens.map((t) => t.id);
    const [moved] = ids.splice(from, 1);
    ids.splice(to, 0, moved!);
    dispatchCmd(reorderTokens(project, activeBank, ids));
  };

  // ── form override helpers ──────────────────────────────────────────────────
  const getOverride = (tokId: string, form: string): string => {
    const ov = (project.forms?.overrides?.[tokId] as Record<string, string> | undefined) ?? {};
    return ov[form] ?? "";
  };

  const isKeptUnchanged = (tokId: string, form: string): boolean => {
    const ov = (project.forms?.overrides?.[tokId] as Record<string, string> | undefined) ?? {};
    return ov[form] === KEEP_UNCHANGED;
  };

  const setFormOverride = (tokId: string, form: string, val: string) => {
    dispatchCmd(setTokenOverride(project, tokId, form, val));
  };

  const toggleKeepUnchanged = (tokId: string, form: string, currently: boolean) => {
    if (currently) {
      setFormOverride(tokId, form, "");
    } else {
      setFormOverride(tokId, form, KEEP_UNCHANGED);
    }
  };

  const selectedToken = selectedTokenId ? tokens.find((t) => t.id === selectedTokenId) ?? null : null;

  const forms = ROLE_FORMS[bankRole] ?? ROLE_FORMS["literal"]!;

  return (
    <div className="tr-panel tr-materials">
      {/* Bank selector */}
      <section className="tr-panel__section">
        <h2 className="tr-panel__heading">Banks</h2>
        <div className="tr-banks" role="list">
          {bankNames.map((name) => {
            const meta = project.materials.bankMeta[name];
            return (
              <button
                key={name}
                role="listitem"
                className={["tr-bank-btn", activeBank === name ? "tr-bank-btn--active" : ""].filter(Boolean).join(" ")}
                onClick={() => dispatch(selectBank(name))}
                aria-pressed={activeBank === name}
              >
                <span className="tr-bank-btn__name">{meta?.label ?? name}</span>
                <span className="tr-bank-btn__role">{meta?.role ?? "literal"}</span>
                <span className="tr-bank-btn__count">{(project.materials.trays[name] ?? []).length}</span>
              </button>
            );
          })}
        </div>
      </section>

      {activeBank && (
        <>
          {/* Sample list */}
          <section className="tr-panel__section">
            <h2 className="tr-panel__heading">
              Samples — <span className="tr-panel__subheading">{bankMeta?.label ?? activeBank}</span>
              <span className="tr-panel__badge">{bankMeta?.role ?? "literal"}</span>
            </h2>

            {tokens.length === 0 && (
              <p className="tr-panel__empty">No samples. Add one below.</p>
            )}

            <ol className="tr-token-list" aria-label={`Samples in ${bankMeta?.label ?? activeBank}`}>
              {tokens.map((tok, i) => {
                const share = totalWeight > 0 ? Math.round((tok.weight / totalWeight) * 100) : 0;
                const isSelected = tok.id === selectedTokenId;
                const isDragging = dragFrom === i;
                const isOver = dragOver === i;
                return (
                  <li
                    key={tok.id}
                    className={[
                      "tr-token",
                      isSelected ? "tr-token--selected" : "",
                      isDragging ? "tr-token--dragging" : "",
                      isOver ? "tr-token--drag-over" : "",
                    ].filter(Boolean).join(" ")}
                    draggable
                    onDragStart={() => onDragStart(i)}
                    onDragOver={(e) => onDragOver(e, i)}
                    onDrop={(e) => onDrop(e, i)}
                    onDragEnd={onDragEnd}
                    onClick={() => dispatch(selectToken({ bankName: activeBank, tokenId: tok.id }))}
                    aria-selected={isSelected}
                  >
                    <span className="tr-token__drag" aria-hidden="true">⠿</span>
                    <input
                      className="tr-token__literal"
                      value={tok.literal}
                      aria-label={`Sample literal ${i + 1}`}
                      onChange={(e) => dispatchCmd(updateTokenLiteral(project, activeBank, tok.id, e.target.value))}
                      onClick={(e) => { e.stopPropagation(); dispatch(selectToken({ bankName: activeBank, tokenId: tok.id })); }}
                    />
                    <span className="tr-token__weight-wrap">
                      <input
                        type="number"
                        className="tr-token__weight"
                        value={tok.weight}
                        min={0}
                        aria-label={`Weight for ${tok.literal}`}
                        onChange={(e) => dispatchCmd(setTokenWeight(project, activeBank, tok.id, Number(e.target.value)))}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <span className="tr-token__share" aria-label={`${share}% share`}>{share}%</span>
                    </span>
                    <div className="tr-token__moves" role="group" aria-label={`Move ${tok.literal}`}>
                      <button
                        className="tr-token__move"
                        aria-label="Move to start"
                        disabled={i === 0}
                        onClick={(e) => { e.stopPropagation(); moveToken(i, 0); }}
                      >⇈</button>
                      <button
                        className="tr-token__move"
                        aria-label="Move up"
                        disabled={i === 0}
                        onClick={(e) => { e.stopPropagation(); moveToken(i, i - 1); }}
                      >↑</button>
                      <button
                        className="tr-token__move"
                        aria-label="Move down"
                        disabled={i === tokens.length - 1}
                        onClick={(e) => { e.stopPropagation(); moveToken(i, i + 1); }}
                      >↓</button>
                      <button
                        className="tr-token__move"
                        aria-label="Move to end"
                        disabled={i === tokens.length - 1}
                        onClick={(e) => { e.stopPropagation(); moveToken(i, tokens.length - 1); }}
                      >⇊</button>
                    </div>
                    <button
                      className="tr-token__remove"
                      aria-label={`Remove ${tok.literal}`}
                      onClick={(e) => { e.stopPropagation(); dispatchCmd(removeToken(project, activeBank, tok.id)); }}
                    >✕</button>
                  </li>
                );
              })}
            </ol>

            {/* Add sample */}
            <form
              className="tr-add-sample"
              onSubmit={(e) => {
                e.preventDefault();
                const lit = newLiteral.trim();
                if (!lit) return;
                dispatchCmd(addToken(project, activeBank, lit));
                setNewLiteral("");
                addRef.current?.focus();
              }}
            >
              <input
                ref={addRef}
                className="tr-add-sample__input"
                value={newLiteral}
                onChange={(e) => setNewLiteral(e.target.value)}
                placeholder={`Add ${bankMeta?.role ?? "sample"}…`}
                aria-label="New sample text"
              />
              <button type="submit" className="tr-add-sample__btn" aria-label="Add sample">Add</button>
            </form>
          </section>

          {/* Forms for selected token */}
          {selectedToken && (
            <section className="tr-panel__section">
              <h2 className="tr-panel__heading">
                Forms — <span className="tr-panel__subheading">{selectedToken.literal}</span>
              </h2>
              <p className="tr-forms__hint">
                Override how this {bankRole} is inflected. "Keep text unchanged" preserves the literal regardless of form.
              </p>
              <div className="tr-forms">
                {forms.map(({ key, label }) => {
                  const kept = isKeptUnchanged(selectedToken.id, key);
                  const ov = kept ? "" : getOverride(selectedToken.id, key);
                  const preview = kept ? selectedToken.literal : formToken(project, selectedToken, key);
                  return (
                    <div key={key} className="tr-form-row">
                      <label className="tr-form-row__label" htmlFor={`form-${selectedToken.id}-${key}`}>
                        {label}
                      </label>
                      <span className="tr-form-row__preview" aria-label={`Preview: ${preview}`}>{preview}</span>
                      <label className="tr-form-row__keep" title="Keep text unchanged (distinct from empty or auto-generated)">
                        <input
                          type="checkbox"
                          checked={kept}
                          onChange={() => toggleKeepUnchanged(selectedToken.id, key, kept)}
                          aria-label={`Keep ${label} text unchanged`}
                        />
                        Keep unchanged
                      </label>
                      <input
                        id={`form-${selectedToken.id}-${key}`}
                        className="tr-form-row__input"
                        type="text"
                        disabled={kept}
                        value={ov}
                        placeholder={kept ? "(keeping literal)" : "(auto)"}
                        aria-label={`${label} override`}
                        onChange={(e) => setFormOverride(selectedToken.id, key, e.target.value)}
                      />
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
