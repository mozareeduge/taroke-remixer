import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { dismissReceipt } from "../store/importReceiptSlice.js";

export function ImportReceiptBanner() {
  const dispatch = useAppDispatch();
  const state = useAppSelector((s) => s.importReceipt);

  if (!state.visible) return null;

  const r = state.fullReceipt;
  const hasErrors = r && r.errors.length > 0;
  const hasWarnings = r && r.warnings.length > 0;

  return (
    <aside
      className="tr-import-receipt"
      role="region"
      aria-label="Import receipt"
      aria-live="polite"
    >
      <div className="tr-import-receipt__header">
        <span className="tr-import-receipt__icon" aria-hidden="true">{hasErrors ? "⚠" : "✓"}</span>
        <strong className="tr-import-receipt__title">
          Imported: {state.filename ?? "unknown file"}
        </strong>
        <button
          className="tr-btn tr-btn--ghost tr-btn--xs tr-import-receipt__close"
          onClick={() => dispatch(dismissReceipt())}
          aria-label="Dismiss import receipt"
        >
          ✕
        </button>
      </div>

      {r ? (
        <div className="tr-import-receipt__body">
          <table className="tr-table tr-import-receipt__table">
            <tbody>
              <tr className="tr-table__row">
                <th className="tr-table__th tr-table__th--label">Format</th>
                <td className="tr-table__td">{r.sourceFormat}</td>
              </tr>
              <tr className="tr-table__row">
                <th className="tr-table__th tr-table__th--label">Schema</th>
                <td className="tr-table__td">
                  {r.sourceSchema ?? "(none)"} → {r.resultingSchema}
                </td>
              </tr>
              <tr className="tr-table__row">
                <th className="tr-table__th tr-table__th--label">Migration</th>
                <td className="tr-table__td">{r.migrationPath}</td>
              </tr>
              <tr className="tr-table__row">
                <th className="tr-table__th tr-table__th--label">Banks</th>
                <td className="tr-table__td">{r.bankCount} ({r.orderedBankIds.join(", ")})</td>
              </tr>
              <tr className="tr-table__row">
                <th className="tr-table__th tr-table__th--label">Samples</th>
                <td className="tr-table__td">{r.tokenCount}</td>
              </tr>
              <tr className="tr-table__row">
                <th className="tr-table__th tr-table__th--label">Devices</th>
                <td className="tr-table__td">{r.deviceCount} ({r.routeCount} routes)</td>
              </tr>
              <tr className="tr-table__row">
                <th className="tr-table__th tr-table__th--label">Patterns</th>
                <td className="tr-table__td">{r.patternCount}</td>
              </tr>
              <tr className="tr-table__row">
                <th className="tr-table__th tr-table__th--label">Scenes</th>
                <td className="tr-table__td">{r.flowSceneCount}</td>
              </tr>
              <tr className="tr-table__row">
                <th className="tr-table__th tr-table__th--label">Triggers</th>
                <td className="tr-table__td">{r.triggerCount}</td>
              </tr>
              <tr className="tr-table__row">
                <th className="tr-table__th tr-table__th--label">Bank order</th>
                <td className="tr-table__td">{r.authoredBankOrderPreserved ? "preserved" : "changed"}</td>
              </tr>
              <tr className="tr-table__row">
                <th className="tr-table__th tr-table__th--label">Defaults applied</th>
                <td className="tr-table__td">
                  {Object.entries(r.classicDefaultsApplied)
                    .filter(([, v]) => v).map(([k]) => k).join(", ") || "none"}
                </td>
              </tr>
              {r.repairCount > 0 && (
                <tr className="tr-table__row">
                  <th className="tr-table__th tr-table__th--label">Repairs</th>
                  <td className="tr-table__td">{r.repairCount} ID conflict{r.repairCount !== 1 ? "s" : ""} resolved</td>
                </tr>
              )}
            </tbody>
          </table>

          {r.repairDetails.length > 0 && (
            <details className="tr-import-receipt__details">
              <summary className="tr-import-receipt__details-toggle">Repair details ({r.repairCount})</summary>
              <ul className="tr-import-receipt__list">
                {r.repairDetails.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </details>
          )}

          {hasErrors && (
            <div className="tr-import-receipt__section tr-import-receipt__section--error" aria-label="Validation errors">
              <strong>Errors ({r.errors.length})</strong>
              <ul className="tr-import-receipt__list">
                {r.errors.map((e, i) => <li key={i}>{e}</li>)}
              </ul>
            </div>
          )}

          {hasWarnings && (
            <div className="tr-import-receipt__section tr-import-receipt__section--warn" aria-label="Validation warnings">
              <strong>Warnings ({r.warnings.length})</strong>
              <ul className="tr-import-receipt__list">
                {r.warnings.map((w, i) => <li key={i}>{w}</li>)}
              </ul>
            </div>
          )}
        </div>
      ) : (
        state.repairCount > 0 && (
          <p className="tr-import-receipt__repairs">
            {state.repairCount} repair{state.repairCount !== 1 ? "s" : ""} applied during import.
          </p>
        )
      )}
    </aside>
  );
}
