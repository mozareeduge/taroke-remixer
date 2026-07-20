import { useState, useRef } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { selectBank, selectToken } from "../store/selectionSlice.js";
import {
  addToken, removeToken, setTokenWeight, updateTokenLiteral,
  addBank, removeBank, reorderTokens, moveBetweenBanks,
} from "../store/commands.js";

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
  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);
  const [bulkText, setBulkText] = useState("");
  const [bulkOpen, setBulkOpen] = useState(false);
  const [moveMenuFor, setMoveMenuFor] = useState<string | null>(null);
  const [bankSearch, setBankSearch] = useState("");
  const addRef = useRef<HTMLInputElement>(null);

  const tokens = activeBank ? (project.materials.trays[activeBank] ?? []) : [];
  const bankMeta = activeBank ? project.materials.bankMeta[activeBank] : null;
  const bankRole = bankMeta?.role ?? "literal";
  const totalWeight = tokens.reduce((s, t) => s + (t.weight || 0), 0);

  const selectedTokenId =
    primary?.type === "token" && primary.bankName === activeBank ? primary.tokenId : null;

  const filteredBanks = bankSearch
    ? banks.filter((b) => {
        const label = project.materials.bankMeta[b]?.label ?? b;
        return label.toLowerCase().includes(bankSearch.toLowerCase()) || b.toLowerCase().includes(bankSearch.toLowerCase());
      })
    : banks;

  function doAddSample() {
    if (!activeBank || !newSample.trim()) return;
    dispatch(mutateProject(addToken(project, activeBank, newSample)));
    setNewSample("");
    addRef.current?.focus();
  }

  function doAddBank() {
    const key = newBankKey.trim().toLowerCase().replace(/\s+/g, "_");
    if (!key || !newBankLabel.trim()) return;
    dispatch(mutateProject(addBank(project, key, newBankLabel.trim())));
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
    }
    setMoveMenuFor(null);
  }

  function doRemoveToken(tokenId: string, literal: string) {
    if (!activeBank) return;
    if (!confirm(`Remove "${literal}" from ${bankMeta?.label ?? activeBank}? This may affect devices that reference this bank.`)) return;
    dispatch(mutateProject(removeToken(project, activeBank, tokenId)));
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
          {filteredBanks.map((b) => (
            <li key={b} className="tr-list__item">
              <button
                className={["tr-list__btn", activeBank === b ? "tr-list__btn--active" : ""].filter(Boolean).join(" ")}
                onClick={() => dispatch(selectBank(b))}
                aria-current={activeBank === b ? "true" : undefined}
              >
                <span className="tr-list__label">{project.materials.bankMeta[b]?.label ?? b.toUpperCase()}</span>
                <span className="tr-list__count">{project.materials.trays[b]?.length ?? 0}</span>
              </button>
            </li>
          ))}
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
          <button className="tr-btn tr-btn--ghost tr-btn--sm" onClick={doAddBank}>Add bank</button>
        </div>
      </div>

      <div className="tr-panel__main">
        {activeBank ? (
          <>
            <div className="tr-panel__section-head">
              BANKS &amp; SAMPLES
              <span className="tr-panel__section-meta">
                {bankMeta?.label ?? activeBank.toUpperCase()} · {bankRole}
              </span>
              <div className="tr-panel__section-actions">
                <button
                  className="tr-btn tr-btn--ghost tr-btn--sm"
                  onClick={() => setBulkOpen(!bulkOpen)}
                  aria-label="Bulk paste samples"
                  aria-expanded={bulkOpen}
                >
                  Bulk paste
                </button>
                <button
                  className="tr-btn tr-btn--primary tr-btn--sm"
                  onClick={doAddSample}
                  aria-label="Add sample"
                >
                  Add sample
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
              <button className="tr-btn tr-btn--primary" onClick={doAddSample}>Add</button>
            </div>

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
                {tokens.map((tok, idx) => (
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
                      <div className="tr-move-menu-wrap">
                        <button
                          className="tr-btn tr-btn--ghost tr-btn--sm"
                          aria-label={`Actions for ${tok.literal}`}
                          aria-haspopup="true"
                          aria-expanded={moveMenuFor === tok.id}
                          onClick={(e) => {
                            e.stopPropagation();
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
                              <>
                                <div className="tr-move-menu__sep" role="separator" />
                                {banks.filter((b) => b !== activeBank).map((targetBank) => (
                                  <button
                                    key={targetBank}
                                    role="menuitem"
                                    className="tr-move-menu__item"
                                    onClick={(e) => { e.stopPropagation(); doMoveToBank(tok.id, targetBank); }}
                                  >
                                    Move to {project.materials.bankMeta[targetBank]?.label ?? targetBank}
                                  </button>
                                ))}
                              </>
                            )}
                            <div className="tr-move-menu__sep" role="separator" />
                            <button
                              role="menuitem"
                              className="tr-move-menu__item tr-move-menu__item--danger"
                              onClick={(e) => { e.stopPropagation(); setMoveMenuFor(null); doRemoveToken(tok.id, tok.literal); }}
                            >
                              Remove sample
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        ) : (
          <p className="tr-panel__empty">Select a bank to view its samples.</p>
        )}
      </div>
    </div>
  );
}
