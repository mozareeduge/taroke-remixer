import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { setCasePolicy, setCompoundPolicy } from "../store/commands.js";
import { openInspector } from "../store/editorSlice.js";

export function FormsPanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const primary = useAppSelector((s) => s.selection.primary);

  const casePolicy = project.forms.casePolicy ?? "preserve";
  const compoundPolicy = project.forms.compoundPolicy ?? "hyphen";

  const activeBank =
    primary?.type === "bank" ? primary.bankName :
    primary?.type === "token" ? primary.bankName :
    null;
  const bankMeta = activeBank ? project.materials.bankMeta[activeBank] : null;
  const bankRole = bankMeta?.role ?? "literal";

  const selectedToken =
    primary?.type === "token" && primary.bankName === activeBank
      ? (project.materials.trays[primary.bankName]?.find((t) => t.id === primary.tokenId) ?? null)
      : null;

  return (
    <div className="tr-panel tr-panel--forms">
      <div className="tr-panel__main">

        <div className="tr-panel__section-head">FORMS</div>

        <div className="tr-forms__policies">
          <label className="tr-forms__label">
            Case policy
            <select
              className="tr-select"
              value={casePolicy}
              onChange={(e) => dispatch(mutateProject(setCasePolicy(project, e.target.value)))}
              aria-label="Case policy"
            >
              <option value="preserve">preserve</option>
              <option value="lower">lowercase</option>
              <option value="upper">uppercase</option>
              <option value="title">title case</option>
            </select>
          </label>
          <label className="tr-forms__label">
            Compound policy
            <select
              className="tr-select"
              value={compoundPolicy}
              onChange={(e) => dispatch(mutateProject(setCompoundPolicy(project, e.target.value)))}
              aria-label="Compound policy"
            >
              <option value="hyphen">hyphen</option>
              <option value="space">space</option>
              <option value="none">none</option>
            </select>
          </label>
        </div>

        {activeBank && bankMeta && (
          <div className="tr-forms__bank-context">
            <div className="tr-panel__section-head">BANK CONTEXT</div>
            <div className="tr-forms__bank-info">
              <span className="tr-forms__bank-name">{bankMeta.label}</span>
              <span className="tr-forms__bank-role">role: {bankRole}</span>
            </div>
            {bankMeta.desc && (
              <p className="tr-forms__desc">{bankMeta.desc}</p>
            )}
          </div>
        )}

        <div className="tr-forms__bank-context">
          <div className="tr-panel__section-head">OVERRIDES</div>
          {selectedToken ? (
            <>
              <p className="tr-forms__desc">
                Selected: <strong>{selectedToken.literal}</strong>
              </p>
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                onClick={() => dispatch(openInspector())}
                aria-label={`Edit form exceptions for ${selectedToken.literal} in Details`}
              >
                Edit in Details
              </button>
            </>
          ) : activeBank ? (
            <p className="tr-forms__desc">
              Select a sample in Banks &amp; Samples to edit its form exceptions here.
            </p>
          ) : (
            <p className="tr-forms__desc">
              Select a bank or sample to see context-relevant form exceptions.
            </p>
          )}
        </div>

      </div>
    </div>
  );
}
