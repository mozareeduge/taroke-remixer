import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { selectBank, selectToken } from "../store/selectionSlice.js";
import {
  addToken, removeToken, setTokenWeight, updateTokenLiteral, addBank, removeBank, reorderTokens,
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

  const tokens = activeBank ? (project.materials.trays[activeBank] ?? []) : [];
  const bankMeta = activeBank ? project.materials.bankMeta[activeBank] : null;
  const totalWeight = tokens.reduce((s, t) => s + (t.weight || 0), 0);

  function doAddSample() {
    if (!activeBank || !newSample.trim()) return;
    dispatch(mutateProject(addToken(project, activeBank, newSample)));
    setNewSample("");
  }

  function doAddBank() {
    const key = newBankKey.trim().toLowerCase().replace(/\s+/g, "_");
    if (!key || !newBankLabel.trim()) return;
    dispatch(mutateProject(addBank(project, key, newBankLabel.trim())));
    setNewBankKey("");
    setNewBankLabel("");
  }

  return (
    <div className="tr-panel tr-panel--materials">
      <div className="tr-panel__sidebar">
        <div className="tr-panel__section-head">BANKS</div>
        <ul className="tr-list" role="list">
          {banks.map((b) => (
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
        <div className="tr-panel__add-row">
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
          <button className="tr-btn tr-btn--ghost" onClick={doAddBank}>+ Bank</button>
        </div>
      </div>

      <div className="tr-panel__main">
        {activeBank ? (
          <>
            <div className="tr-panel__section-head">
              {bankMeta?.label ?? activeBank.toUpperCase()}
              <span className="tr-panel__section-meta">{bankMeta?.role} · {tokens.length} samples</span>
            </div>
            <table className="tr-table">
              <thead>
                <tr>
                  <th className="tr-table__th">Literal</th>
                  <th className="tr-table__th tr-table__th--num">Wt</th>
                  <th className="tr-table__th tr-table__th--num">Share</th>
                  <th className="tr-table__th tr-table__th--action" aria-label="Reorder"></th>
                  <th className="tr-table__th tr-table__th--action" aria-label="Remove"></th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((tok, idx) => {
                  function moveToken(delta: number) {
                    if (!activeBank) return;
                    const ids = tokens.map((t) => t.id);
                    const newIdx = idx + delta;
                    if (newIdx < 0 || newIdx >= ids.length) return;
                    ids.splice(idx, 1);
                    ids.splice(newIdx, 0, tok.id);
                    dispatch(mutateProject(reorderTokens(project, activeBank, ids)));
                  }
                  return (
                  <tr
                    key={tok.id}
                    className={["tr-table__row", primary?.type === "token" && primary.tokenId === tok.id ? "tr-table__row--selected" : ""].filter(Boolean).join(" ")}
                    onClick={() => dispatch(selectToken({ bankName: activeBank, tokenId: tok.id }))}
                  >
                    <td className="tr-table__td">
                      <input
                        className="tr-input tr-input--literal"
                        value={tok.literal}
                        onChange={(e) => dispatch(mutateProject(updateTokenLiteral(project, activeBank, tok.id, e.target.value)))}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Literal for sample ${tok.literal}`}
                        data-token-literal={tok.id}
                      />
                    </td>
                    <td className="tr-table__td tr-table__td--num">
                      <input
                        type="number"
                        className="tr-input tr-input--num"
                        value={tok.weight}
                        min={0}
                        max={999}
                        onChange={(e) => dispatch(mutateProject(setTokenWeight(project, activeBank, tok.id, Number(e.target.value))))}
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`Weight for ${tok.literal}`}
                      />
                    </td>
                    <td className="tr-table__td tr-table__td--num tr-table__td--share" aria-label={`Expected share for ${tok.literal}`}>
                      {totalWeight > 0 ? `${Math.round((tok.weight / totalWeight) * 100)}%` : "—"}
                    </td>
                    <td className="tr-table__td tr-table__td--action">
                      <div className="tr-reorder" role="group" aria-label={`Reorder ${tok.literal}`}>
                        <button
                          className="tr-btn tr-btn--icon"
                          aria-label={`Move ${tok.literal} up`}
                          disabled={idx === 0}
                          onClick={(e) => { e.stopPropagation(); moveToken(-1); }}
                        >↑</button>
                        <button
                          className="tr-btn tr-btn--icon"
                          aria-label={`Move ${tok.literal} down`}
                          disabled={idx === tokens.length - 1}
                          onClick={(e) => { e.stopPropagation(); moveToken(1); }}
                        >↓</button>
                      </div>
                    </td>
                    <td className="tr-table__td tr-table__td--action">
                      <button
                        className="tr-btn tr-btn--icon"
                        aria-label={`Remove ${tok.literal}`}
                        onClick={(e) => { e.stopPropagation(); dispatch(mutateProject(removeToken(project, activeBank, tok.id))); }}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="tr-panel__add-row">
              <input
                className="tr-input"
                placeholder="Add sample…"
                value={newSample}
                onChange={(e) => setNewSample(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") doAddSample(); }}
                aria-label="New sample literal"
              />
              <button className="tr-btn tr-btn--primary" onClick={doAddSample}>Add</button>
            </div>
          </>
        ) : (
          <p className="tr-panel__empty">Select a bank to view its samples.</p>
        )}
      </div>
    </div>
  );
}
