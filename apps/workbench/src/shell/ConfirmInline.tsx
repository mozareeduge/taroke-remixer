/**
 * One consistent inline destructive-confirmation control
 * (06_SELECTION_INSPECTOR_AND_ACTION_CONTRACTS.md "Destructive rules").
 * Replaces native `confirm()` everywhere a removal needs to state the
 * object, the consequence, and offer an explicit Cancel.
 */
export function ConfirmInline({
  message,
  onConfirm,
  onCancel,
  confirmLabel = "Remove",
}: {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmLabel?: string;
}) {
  return (
    <div className="tr-confirm-inline" role="group" aria-label="Confirm removal">
      <span className="tr-confirm-inline__text">{message}</span>
      <button className="tr-btn tr-btn--ghost tr-btn--sm" onClick={onCancel}>
        Cancel
      </button>
      <button className="tr-btn tr-btn--danger tr-btn--sm" onClick={onConfirm} autoFocus>
        {confirmLabel}
      </button>
    </div>
  );
}
