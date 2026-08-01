import { useState, useRef, useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { selectBank, selectToken } from "../store/selectionSlice.js";
import { announce } from "../store/feedbackSlice.js";
import { ConfirmInline } from "../shell/ConfirmInline.js";
import { useMediaQuery } from "../shell/useMediaQuery.js";
import { bankTaxonomy, TAXONOMY_LABEL, TAXONOMY_HINT } from "../shell/bankTaxonomy.js";
import {
  addToken, removeToken, setTokenWeight, updateTokenLiteral,
  addBank, reorderTokens, moveBetweenBanks,
  safeRemoveBank, isBlocked,
} from "../store/commands.js";
import type { Token } from "@taroke/schema";

/** Below this width a five-column table cannot carry touch-sized controls
 * without compressing itself into an unusable strip — samples become cards
 * instead (SHELL-09). */
const COMPACT_TABLE_QUERY = "(max-width: 599px)";

function TaxonomyChip({ taxonomy }: { taxonomy: ReturnType<typeof bankTaxonomy> }) {
  return (
    <span className={`tr-taxonomy-chip tr-taxonomy-chip--${taxonomy}`} title={TAXONOMY_HINT[taxonomy]}>
      {TAXONOMY_LABEL[taxonomy]}
    </span>
  );
}

export function MaterialsPanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const primary = useAppSelector((s) => s.selection.primary);

  const banks = Object.keys(project.materials.trays);
  const activeBank =
    primary?.type === "bank" ? primary.bankName :
    primary?.type === "token" ? primary.bankName :
    banks[0] ?? null;

  const [newSample, setNewSample] = useState("");
  const [newBankKey, setNewBankKey] = useState("");
  const [newBankLabel, setNewBankLabel] = useState("");
  const [removeBankError, setRemoveBankError] = useState<string | null>(null);
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [moveMenuFor, setMoveMenuFor] = useState<string | null>(null);
  const [moveToBankTarget, setMoveToBankTarget] = useState("");
  const [bankSearch, setBankSearch] = useState("");
  const [pendingRemoveTokenId, setPendingRemoveTokenId] = useState<string | null>(null);
  const [sampleSearch, setSampleSearch] = useState("");
  const [showFullList, setShowFullList] = useState(false);
  const addRef = useRef<HTMLInputElement>(null);
  const isCompact = useMediaQuery(COMPACT_TABLE_QUERY);

  // Reset the local per-bank view state (search/expansion) when the active
  // bank changes, so switching banks never carries over a stale filter or a
  // stuck-open full list (MAT-01/MAT-02).
  useEffect(() => {
    setSampleSearch("");
    setShowFullList(false);
  }, [activeBank]);

  const tokens = activeBank ? (project.materials.trays[activeBank] ?? []) : [];
  const bankMeta = activeBank ? project.materials.bankMeta[activeBank] : null;
  const bankRole = bankMeta?.role ?? "literal";
  const totalWeight = tokens.reduce((s, t) => s + (t.weight || 0), 0);
  const activeTaxonomy = activeBank ? bankTaxonomy(bankMeta?.desc, tokens.length) : null;
  const isCompiledBank = activeTaxonomy === "compiled";

  // MAT-02: sample search within the active bank, independent of the
  // sidebar's bank search. Matching indices are re-resolved against the
  // full `tokens` array (not the filtered position) so reorder/actions stay
  // correct while a filter is active.
  const trimmedSampleSearch = sampleSearch.trim().toLowerCase();
  const searchedTokens = trimmedSampleSearch
    ? tokens.filter((t) => t.literal.toLowerCase().includes(trimmedSampleSearch))
    : tokens;

  // MAT-01: a compiled bank's initial view is a concise summary, not a raw
  // table of hundreds of rows. Searching or explicitly expanding reveals
  // the real list.
  const showRawList = !isCompiledBank || showFullList || trimmedSampleSearch.length > 0;

  const selectedTokenId =
    primary?.type === "token" && primary.bankName === activeBank ? primary.tokenId : null;

  const filteredBanks = bankSearch
    ? banks.filter((b) => {
        const label = project.materials.bankMeta[b]?.label ?? b;
        return label.toLowerCase().includes(bankSearch.toLowerCase()) || b.toLowerCase().includes(bankSearch.toLowerCase());
      })
    : banks;

  const trimmedSample = newSample.trim();
  const canAddSample = Boolean(activeBank) && trimmedSample.length > 0;
  const addSampleReason = !activeBank ? "Select a bank first" : trimmedSample.length === 0 ? "Enter a sample first" : "";

  function doAddSample() {
    if (!canAddSample || !activeBank) return;
    dispatch(mutateProject(addToken(project, activeBank, newSample)));
    dispatch(announce(`Added "${trimmedSample}" to ${bankMeta?.label ?? activeBank}.`));
    setNewSample("");
    addRef.current?.focus();
  }

  const trimmedBankKey = newBankKey.trim().toLowerCase().replace(/\s+/g, "_");
  const trimmedBankLabel = newBankLabel.trim();
  const bankKeyTaken = trimmedBankKey.length > 0 && Boolean(project.materials.trays[trimmedBankKey]);
  const canAddBank = trimmedBankKey.length > 0 && trimmedBankLabel.length > 0 && !bankKeyTaken;
  const addBankReason = bankKeyTaken
    ? `Bank key "${trimmedBankKey}" already exists`
    : trimmedBankKey.length === 0
    ? "Enter a bank key"
    : trimmedBankLabel.length === 0
    ? "Enter a bank label"
    : "";

  function doAddBank() {
    if (!canAddBank) return;
    dispatch(mutateProject(addBank(project, trimmedBankKey, trimmedBankLabel)));
    dispatch(announce(`Added bank "${trimmedBankLabel}".`));
    setNewBankKey("");
    setNewBankLabel("");
  }

  function doBulkPaste() {
    if (!activeBank || !bulkText.trim()) return;
    const lines = bulkText.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.length === 0) return;
    let current = project;
    let last = addToken(current, activeBank, lines[0]!);
    for (const line of lines.slice(1)) {
      last = addToken(last.present, activeBank, line);
    }
    dispatch(mutateProject(last));
    setBulkText("");
    setBulkOpen(false);
  }

  function moveToken(idx: number, to: number) {
    if (!activeBank) return;
    const ids = tokens.map((t) => t.id);
    const [moved] = ids.splice(idx, 1);
    ids.splice(to, 0, moved!);
    dispatch(mutateProject(reorderTokens(project, activeBank, ids)));
  }

  function doMoveToBank(tokenId: string, targetBank: string) {
    if (!activeBank || targetBank === activeBank) return;
    if (moveBetweenBanks) {
      dispatch(mutateProject(moveBetweenBanks(project, activeBank, tokenId, targetBank)));
      dispatch(announce(`Moved sample to ${project.materials.bankMeta[targetBank]?.label ?? targetBank}.`));
    }
    setMoveMenuFor(null);
  }

  function requestRemoveToken(tokenId: string) {
    setMoveMenuFor(null);
    setPendingRemoveTokenId(tokenId);
  }

  function confirmRemoveToken(tokenId: string, literal: string) {
    if (!activeBank) return;
    dispatch(mutateProject(removeToken(project, activeBank, tokenId)));
    dispatch(announce(`Removed "${literal}" from ${bankMeta?.label ?? activeBank}.`));
    setPendingRemoveTokenId(null);
  }

  // Drag/drop reorder
  function onDragStart(i: number) { setDragFrom(i); }
  function onDragOver(e: React.DragEvent, i: number) { e.preventDefault(); setDragOver(i); }
  function onDrop(e: React.DragEvent, i: number) {
    e.preventDefault();
    if (dragFrom === null || dragFrom === i || !activeBank) { setDragFrom(null); setDragOver(null); return; }
    moveToken(dragFrom, i);
    setDragFrom(null);
    setDragOver(null);
  }
  function onDragEnd() { setDragFrom(null); setDragOver(null); }

  const bulkLines = bulkText.trim() ? bulkText.split("\n").map((l) => l.trim()).filter(Boolean) : [];

  function renderActionsMenu(tok: Token, idx: number) {
    return (
      <div className="tr-move-menu-wrap">
        <button
          className="tr-btn tr-btn--ghost tr-btn--sm"
          aria-label={`Actions for ${tok.literal}`}
          aria-haspopup="true"
          aria-expanded={moveMenuFor === tok.id}
          onClick={(e) => {
            e.stopPropagation();
            setMoveToBankTarget("");
            setMoveMenuFor(moveMenuFor === tok.id ? null : tok.id);
          }}
        >
          Move ···
        </button>
        {moveMenuFor === tok.id && (
          <div className="tr-move-menu" role="menu" aria-label={`Move ${tok.literal}`}>
            <button
              role="menuitem"
              className="tr-move-menu__item"
              disabled={idx === 0}
              onClick={(e) => { e.stopPropagation(); moveToken(idx, 0); setMoveMenuFor(null); }}
            >Move to top</button>
            <button
              role="menuitem"
              className="tr-move-menu__item"
              disabled={idx === 0}
              onClick={(e) => { e.stopPropagation(); moveToken(idx, idx - 1); setMoveMenuFor(null); }}
            >Move up</button>
            <button
              role="menuitem"
              className="tr-move-menu__item"
              disabled={idx === tokens.length - 1}
              onClick={(e) => { e.stopPropagation(); moveToken(idx, idx + 1); setMoveMenuFor(null); }}
            >Move down</button>
            <button
              role="menuitem"
              className="tr-move-menu__item"
              disabled={idx === tokens.length - 1}
              onClick={(e) => { e.stopPropagation(); moveToken(idx, tokens.length - 1); setMoveMenuFor(null); }}
            >Move to bottom</button>
            {banks.filter((b) => b !== activeBank).length > 0 && (
              <div className="tr-move-menu__move-to" onClick={(e) => e.stopPropagation()}>
                <div className="tr-move-menu__sep" role="separator" />
                <label className="tr-inspector__action-label" htmlFor={`tr-mat-move-target-${tok.id}`}>Move to bank</label>
                <div className="tr-inspector__move-row">
                  <select
                    id={`tr-mat-move-target-${tok.id}`}
                    className="tr-select"
                    value={moveToBankTarget}
                    onChange={(e) => setMoveToBankTarget(e.target.value)}
                    aria-label="Destination bank"
                  >
                    <option value="">Choose a bank…</option>
                    {banks.filter((b) => b !== activeBank).map((targetBank) => (
                      <option key={targetBank} value={targetBank}>
                        {project.materials.bankMeta[targetBank]?.label ?? targetBank}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    className="tr-btn tr-btn--ghost tr-btn--sm"
                    disabled={!moveToBankTarget}
                    aria-disabled={!moveToBankTarget}
                    onClick={() => {
                      if (!moveToBankTarget) return;
                      doMoveToBank(tok.id, moveToBankTarget);
                      setMoveToBankTarget("");
                    }}
                    aria-label={`Move ${tok.literal} to selected bank`}
                  >
                    Move
                  </button>
                </div>
              </div>
            )}
            <div className="tr-move-menu__sep" role="separator" />
            <button
              role="menuitem"
              className="tr-move-menu__item tr-move-menu__item--danger"
              onClick={(e) => { e.stopPropagation(); requestRemoveToken(tok.id); }}
            >
              Remove sample
            </button>
          </div>
        )}
      </div>
    );
  }

  function renderConfirmRemove(tok: Token) {
    if (pendingRemoveTokenId !== tok.id) return null;
    return (
      <div onClick={(e) => e.stopPropagation()}>
        <ConfirmInline
          message={`Remove "${tok.literal}" from ${bankMeta?.label ?? activeBank}? This may affect devices that reference this bank.`}
          onCancel={() => setPendingRemoveTokenId(null)}
          onConfirm={() => confirmRemoveToken(tok.id, tok.literal)}
        />
      </div>
    );
  }

  return (
    <div className="tr-panel tr-panel--materials">
      <div className="tr-panel__sidebar">
        <div className="tr-panel__section-head">BANKS &amp; SAMPLES</div>
        <div className="tr-mat-search">
          <input
            className="tr-input tr-input--sm"
            placeholder="Search banks"
            value={bankSearch}
            onChange={(e) => setBankSearch(e.target.value)}
            aria-label="Search banks"
          />
        </div>
        <ul className="tr-list" role="list">
          {filteredBanks.map((b) => {
            const bCount = project.materials.trays[b]?.length ?? 0;
            const bTaxonomy = bankTaxonomy(project.materials.bankMeta[b]?.desc, bCount);
            return (
              <li key={b} className="tr-list__item">
                <button
                  className={["tr-list__btn", activeBank === b ? "tr-list__btn--active" : ""].filter(Boolean).join(" ")}
                  onClick={() => dispatch(selectBank(b))}
                  aria-current={activeBank === b ? "true" : undefined}
                >
                  <span className="tr-list__label">{project.materials.bankMeta[b]?.label ?? b.toUpperCase()}</span>
                  <span className="tr-list__taxonomy"><TaxonomyChip taxonomy={bTaxonomy} /></span>
                  <span className="tr-list__count">{bCount}</span>
                </button>
              </li>
            );
          })}
        </ul>
        <div className="tr-panel__add-row tr-panel__add-row--bank">
          <input
            className="tr-input tr-input--sm"
            placeholder="key"
            value={newBankKey}
            onChange={(e) => setNewBankKey(e.target.value)}
            aria-label="New bank key"
          />
          <input
            className="tr-input tr-input--sm"
            placeholder="label"
            value={newBankLabel}
            onChange={(e) => setNewBankLabel(e.target.value)}
            aria-label="New bank label"
          />
          <button
            className="tr-btn tr-btn--ghost tr-btn--sm"
            onClick={doAddBank}
            disabled={!canAddBank}
            aria-disabled={!canAddBank}
            title={addBankReason || undefined}
          >
            Add bank
          </button>
          {addBankReason && (newBankKey || newBankLabel) && (
            <span className="tr-error tr-panel__add-row-reason" role="alert">{addBankReason}</span>
          )}
        </div>
      </div>

      <div className="tr-panel__main">
        {activeBank ? (
          <>
            <div className="tr-panel__section-head">
              BANKS &amp; SAMPLES
              <span className="tr-panel__section-meta">
                {bankMeta?.label ?? activeBank.toUpperCase()} · {bankRole}
                {activeTaxonomy && <TaxonomyChip taxonomy={activeTaxonomy} />}
              </span>
              <div className="tr-panel__section-actions">
                <button
                  className="tr-btn tr-btn--ghost tr-btn--sm"
                  onClick={() => {
                    const result = safeRemoveBank(project, activeBank);
                    if (isBlocked(result)) {
                      setRemoveBankError(`Cannot remove: ${result.reason} (${result.dependents.join(", ")})`);
                    } else {
                      setRemoveBankError(null);
                      dispatch(mutateProject(result));
                      dispatch(announce(`Removed bank "${bankMeta?.label ?? activeBank}".`));
                    }
                  }}
                  aria-label="Remove bank"
                >
                  Remove bank
                </button>
                {removeBankError && (
                  <span className="tr-error" role="alert">{removeBankError}</span>
                )}
                <button
                  className="tr-btn tr-btn--ghost tr-btn--sm"
                  onClick={() => setBulkOpen(!bulkOpen)}
                  aria-label="Bulk paste samples"
                  aria-expanded={bulkOpen}
                >
                  Bulk paste
                </button>
              </div>
            </div>

            {bulkOpen && (
              <div className="tr-bulk-paste" role="region" aria-label="Bulk paste samples">
                <textarea
                  className="tr-input tr-input--textarea tr-bulk-paste__area"
                  placeholder="One sample per line…"
                  value={bulkText}
                  onChange={(e) => setBulkText(e.target.value)}
                  rows={6}
                  aria-label="Bulk paste text, one sample per line"
                  data-testid="bulk-paste-textarea"
                />
                {bulkLines.length > 0 && (
                  <p className="tr-bulk-paste__count">{bulkLines.length} sample{bulkLines.length !== 1 ? "s" : ""} to add</p>
                )}
                <div className="tr-bulk-paste__actions">
                  <button className="tr-btn tr-btn--ghost tr-btn--sm" onClick={() => { setBulkOpen(false); setBulkText(""); }}>Cancel</button>
                  <button
                    className="tr-btn tr-btn--primary tr-btn--sm"
                    onClick={doBulkPaste}
                    disabled={bulkLines.length === 0}
                    aria-label={`Add ${bulkLines.length} samples`}
                  >
                    Add {bulkLines.length > 0 ? bulkLines.length : ""} sample{bulkLines.length !== 1 ? "s" : ""}
                  </button>
                </div>
              </div>
            )}

            <div className="tr-mat-add-row">
              <input
                ref={addRef}
                className="tr-input"
                placeholder="Add sample…"
                value={newSample}
                onChange={(e) => setNewSample(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") doAddSample(); }}
                aria-label="New sample literal"
              />
              <button
                className="tr-btn tr-btn--primary"
                onClick={doAddSample}
                disabled={!canAddSample}
                aria-disabled={!canAddSample}
                aria-label="Add sample"
                title={addSampleReason || undefined}
              >
                Add
              </button>
            </div>

            <div className="tr-mat-sample-search">
              <input
                className="tr-input tr-input--sm"
                placeholder={`Search ${tokens.length} sample${tokens.length !== 1 ? "s" : ""}…`}
                value={sampleSearch}
                onChange={(e) => setSampleSearch(e.target.value)}
                aria-label="Search samples in this bank"
              />
            </div>
            <p className="tr-mat-weight-hint">
              Weight sets a sample's relative pick probability within this bank; Share shows that as a % of the bank's total weight.
            </p>

            {isCompiledBank && !showRawList ? (
              <div className="tr-mat-compiled-summary" role="region" aria-label={`${bankMeta?.label ?? activeBank} summary`}>
                <p className="tr-mat-compiled-summary__desc">{bankMeta?.desc ?? "Compiled bank — generated from other banks."}</p>
                <div className="tr-mat-compiled-summary__stats">
                  <div className="tr-mat-compiled-summary__stat">
                    <span className="tr-mat-compiled-summary__stat-value">{tokens.length.toLocaleString()}</span>
                    <span className="tr-mat-compiled-summary__stat-label">SAMPLES</span>
                  </div>
                  <div className="tr-mat-compiled-summary__stat">
                    <span className="tr-mat-compiled-summary__stat-value">{Math.round(totalWeight).toLocaleString()}</span>
                    <span className="tr-mat-compiled-summary__stat-label">TOTAL WEIGHT</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="tr-btn tr-btn--ghost tr-btn--sm"
                  onClick={() => setShowFullList(true)}
                >
                  Show full list ({tokens.length})
                </button>
              </div>
            ) : searchedTokens.length === 0 && trimmedSampleSearch.length > 0 ? (
              <p className="tr-panel__empty">No sample matches &ldquo;{sampleSearch.trim()}&rdquo;.</p>
            ) : isCompact ? (
              <ul className="tr-mat-cards" aria-label={`Samples in ${bankMeta?.label ?? activeBank}`}>
                {searchedTokens.map((tok) => {
                  const idx = tokens.indexOf(tok);
                  return (
                  <li
                    key={tok.id}
                    className={["tr-mat-card", selectedTokenId === tok.id ? "tr-mat-card--selected" : ""].filter(Boolean).join(" ")}
                    aria-current={selectedTokenId === tok.id ? "true" : undefined}
                  >
                    {/* A separate button for select vs. the actions menu button below —
                        nesting one interactive control inside another (e.g. a focusable
                        card containing the Move button) is unreliable for assistive
                        technology, so they are siblings instead (A11Y-03/A11Y-05). */}
                    <button
                      type="button"
                      className="tr-mat-card__select"
                      onClick={() => dispatch(selectToken({ bankName: activeBank, tokenId: tok.id }))}
                      aria-pressed={selectedTokenId === tok.id}
                      aria-label={`Select sample ${tok.literal}`}
                    >
                      <div className="tr-mat-card__main">
                        <span className="tr-mat-card__literal">{tok.literal}</span>
                        <span className="tr-mat-card__role">{tok.role || bankRole}</span>
                        {tok.lockedLiteral && <span className="tr-mat-card__locked">literal locked</span>}
                      </div>
                      <div className="tr-mat-card__meta">
                        <span className="tr-mat-card__weight">Weight {tok.weight}</span>
                        <span className="tr-mat-card__share">
                          {totalWeight > 0 ? `${Math.round((tok.weight / totalWeight) * 100)}% share` : "— share"}
                        </span>
                      </div>
                    </button>
                    <div className="tr-mat-card__actions">
                      {renderActionsMenu(tok, idx)}
                    </div>
                    {renderConfirmRemove(tok)}
                  </li>
                  );
                })}
              </ul>
            ) : (
              <table className="tr-table tr-mat-table">
                <thead>
                  <tr>
                    <th scope="col" className="tr-table__th tr-table__th--drag" aria-label="Drag handle"></th>
                    <th scope="col" className="tr-table__th">Sample</th>
                    <th scope="col" className="tr-table__th tr-table__th--num">Weight</th>
                    <th scope="col" className="tr-table__th tr-table__th--num">Share</th>
                    <th scope="col" className="tr-table__th tr-table__th--action" aria-label="Actions"></th>
                  </tr>
                </thead>
                <tbody>
                  {searchedTokens.map((tok) => {
                    const idx = tokens.indexOf(tok);
                    return (
                    <tr
                      key={tok.id}
                      className={[
                        "tr-table__row",
                        selectedTokenId === tok.id ? "tr-table__row--selected" : "",
                        dragFrom === idx ? "tr-table__row--dragging" : "",
                        dragOver === idx ? "tr-table__row--drag-over" : "",
                      ].filter(Boolean).join(" ")}
                      draggable
                      onDragStart={() => onDragStart(idx)}
                      onDragOver={(e) => onDragOver(e, idx)}
                      onDrop={(e) => onDrop(e, idx)}
                      onDragEnd={onDragEnd}
                      onClick={() => dispatch(selectToken({ bankName: activeBank, tokenId: tok.id }))}
                      aria-selected={selectedTokenId === tok.id}
                    >
                      <td className="tr-table__td tr-table__td--drag" aria-hidden="true" title="Drag to reorder">⠿</td>
                      <td className="tr-table__td tr-mat-table__sample">
                        <span className="tr-mat-table__literal">{tok.literal}</span>
                        <span className="tr-mat-table__role">{tok.role || bankRole}</span>
                        {tok.lockedLiteral && <span className="tr-mat-table__locked">literal locked</span>}
                      </td>
                      <td className="tr-table__td tr-table__td--num" data-weight={tok.weight}>{tok.weight}</td>
                      <td className="tr-table__td tr-table__td--num tr-table__td--share">
                        {totalWeight > 0 ? `${Math.round((tok.weight / totalWeight) * 100)}%` : "—"}
                      </td>
                      <td className="tr-table__td tr-table__td--action tr-mat-table__actions">
                        {renderActionsMenu(tok, idx)}
                        {renderConfirmRemove(tok)}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </>
        ) : (
          <p className="tr-panel__empty">Select a bank to view its samples.</p>
        )}
      </div>
    </div>
  );
}
