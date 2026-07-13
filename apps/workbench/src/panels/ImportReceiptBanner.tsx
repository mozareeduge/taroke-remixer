import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { dismissReceipt } from "../store/importReceiptSlice.js";

export function ImportReceiptBanner() {
  const dispatch = useAppDispatch();
  const receipt = useAppSelector((s) => s.importReceipt);

  if (!receipt.visible) return null;

  return (
    <aside
      className="tr-import-receipt"
      role="region"
      aria-label="Import receipt"
      aria-live="polite"
    >
      <div className="tr-import-receipt__header">
        <span className="tr-import-receipt__icon" aria-hidden="true">✓</span>
        <strong className="tr-import-receipt__title">
          Imported: {receipt.filename ?? "unknown file"}
        </strong>
        <button
          className="tr-btn tr-btn--ghost tr-btn--xs tr-import-receipt__close"
          onClick={() => dispatch(dismissReceipt())}
          aria-label="Dismiss import receipt"
        >
          ✕
        </button>
      </div>
      {receipt.repairCount > 0 && (
        <p className="tr-import-receipt__repairs">
          {receipt.repairCount} repair{receipt.repairCount !== 1 ? "s" : ""} applied during import.
        </p>
      )}
      {receipt.issues.length > 0 && (
        <ul className="tr-import-receipt__issues" aria-label="Import issues">
          {receipt.issues.map((issue, i) => (
            <li key={i} className="tr-import-receipt__issue">
              <span className={`tr-import-receipt__severity tr-import-receipt__severity--${issue.severity}`}>
                {issue.severity.toUpperCase()}
              </span>
              {" "}{issue.message}
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
