import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { setCasePolicy, setCompoundPolicy, setTokenOverride, setTokenLockedLiteral } from "../store/commands.js";
import { formToken, KEEP_UNCHANGED_SENTINEL } from "@taroke/core";
import { formsForRole, getFormOverride, isFormKept } from "../shell/formRoles.js";

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
          <div className="tr-panel__section-head">BENCH</div>
          {selectedToken ? (
            <div className="tr-forms__bench" role="group" aria-label={`Form bench for ${selectedToken.literal}`}>
              <p className="tr-forms__desc">
                Before: <strong>{selectedToken.literal}</strong> — transformed by case/compound policy above, per form below.
              </p>
              {formsForRole(bankRole).map(({ key, label }) => {
                const kept = isFormKept(project, selectedToken.id, key);
                const ov = getFormOverride(project, selectedToken.id, key);
                const after = formToken(project, selectedToken, key);
                return (
                  <div key={key} className="tr-form-row">
                    <span className="tr-form-row__label">{label}</span>
                    <span className="tr-form-row__preview" aria-label={`After: ${after}`}>{after}</span>
                    <label className="tr-form-row__keep">
                      <input
                        type="checkbox"
                        checked={kept}
                        onChange={() =>
                          dispatch(
                            mutateProject(
                              setTokenOverride(project, selectedToken.id, key, kept ? "" : KEEP_UNCHANGED_SENTINEL)
                            )
                          )
                        }
                        aria-label={`Keep ${label.toLowerCase()} unchanged for ${selectedToken.literal}`}
                      />
                      Keep literal
                    </label>
                    <input
                      className="tr-form-row__input"
                      type="text"
                      disabled={kept}
                      value={ov}
                      placeholder={kept ? "(keeping literal)" : "(auto)"}
                      aria-label={`${label} override for ${selectedToken.literal}`}
                      data-form-override={`${selectedToken.id}:${key}`}
                      onChange={(e) => dispatch(mutateProject(setTokenOverride(project, selectedToken.id, key, e.target.value)))}
                    />
                  </div>
                );
              })}
              <button
                className="tr-btn tr-btn--ghost tr-btn--sm"
                onClick={() => dispatch(mutateProject(setTokenLockedLiteral(project, activeBank!, selectedToken.id, !selectedToken.lockedLiteral)))}
                aria-label={selectedToken.lockedLiteral ? `Unlock literal for ${selectedToken.literal}` : `Keep literal locked for ${selectedToken.literal}`}
              >
                {selectedToken.lockedLiteral ? "Unlock literal" : "Lock literal"}
              </button>
            </div>
          ) : activeBank ? (
            <p className="tr-forms__desc">
              Select a sample in Banks &amp; Samples to see and edit its form exceptions here.
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
