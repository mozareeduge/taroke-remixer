import { useAppSelector } from "../store/hooks.js";

export function Inspector() {
  const primary = useAppSelector((s) => s.selection.primary);
  const inspectorOpen = useAppSelector((s) => s.editor.inspectorOpen);

  if (!inspectorOpen) return null;

  return (
    <aside className="tr-inspector" aria-label="Inspector">
      {primary ? (
        <div className="tr-inspector__content">
          <div className="tr-inspector__type">{primary.type.toUpperCase()}</div>
          <div className="tr-inspector__detail">
            {"bankName" in primary ? primary.bankName : ""}
            {"tokenId" in primary ? ` / ${primary.tokenId}` : ""}
            {"deviceId" in primary ? primary.deviceId : ""}
            {"stanzaId" in primary ? primary.stanzaId : ""}
            {"sceneId" in primary ? primary.sceneId : ""}
            {"triggerId" in primary ? primary.triggerId : ""}
          </div>
        </div>
      ) : (
        <div className="tr-inspector__empty">
          <span className="tr-inspector__hint">Select an item to inspect</span>
        </div>
      )}
    </aside>
  );
}
