import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { setCasePolicy, setCompoundPolicy, setTokenOverride } from "../store/commands.js";
import { formToken, KEEP_UNCHANGED_SENTINEL } from "@taroke/core";

const ROLE_FORMS: Record<string, { key: string; label: string }[]> = {
  noun:      [{ key: "literal", label: "Literal" }, { key: "singular", label: "Singular" }, { key: "plural", label: "Plural" }],
  verb:      [{ key: "literal", label: "Literal" }, { key: "thirdSingular", label: "3rd singular" }, { key: "imperative", label: "Imperative" }],
  adjective: [{ key: "literal", label: "Literal" }],
  adverb:    [{ key: "literal", label: "Literal" }],
  mixed:     [{ key: "literal", label: "Literal" }],
};
const DEFAULT_FORMS = [{ key: "literal", label: "Literal" }];

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
  const forms = ROLE_FORMS[bankRole] ?? DEFAULT_FORMS;

  function getOverride(tokId: string, form: string): string {
    const ov = (project.forms?.overrides?.[tokId] as Record<string, string> | undefined) ?? {};
    const v = ov[form];
    return v === KEEP_UNCHANGED_SENTINEL ? "" : (v ?? "");
  }
  function isKept(tokId: string, form: string): boolean {
    const ov = (project.forms?.overrides?.[tokId] as Record<string, string> | undefined) ?? {};
    return ov[form] === KEEP_UNCHANGED_SENTINEL;
  }
  function toggleKeep(tokId: string, form: string, currently: boolean) {
    dispatch(mutateProject(setTokenOverride(project, tokId, form, currently ? "" : KEEP_UNCHANGED_SENTINEL)));
  }
  function setOverride(tokId: string, form: string, val: string) {
    dispatch(mutateProject(setTokenOverride(project, tokId, form, val)));
  }

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

        {selectedToken ? (
          <div className="tr-forms__sample-editor">
            <div className="tr-panel__section-head">
              SAMPLE EXCEPTION — {selectedToken.literal}
            </div>
            <p className="tr-forms__hint">
              Override inflection for "{selectedToken.literal}" ({bankRole}). "Keep unchanged" preserves the literal for that form.
            </p>
            <div className="tr-forms" role="group" aria-label={`Form overrides for ${selectedToken.literal}`}>
              {forms.map(({ key, label }) => {
                const kept = isKept(selectedToken.id, key);
                const ov = getOverride(selectedToken.id, key);
                const preview = formToken(project, selectedToken, key);
                return (
                  <div key={key} className="tr-form-row" data-form={key}>
                    <label className="tr-form-row__label" htmlFor={`form-${selectedToken.id}-${key}`}>{label}</label>
                    <span className="tr-form-row__preview" aria-label={`Preview: ${preview}`}>{preview}</span>
                    <label className="tr-form-row__keep" title="Keep text unchanged — preserves literal regardless of inflection">
                      <input
                        type="checkbox"
                        checked={kept}
                        onChange={() => toggleKeep(selectedToken.id, key, kept)}
                        aria-label={`Keep ${label} unchanged for ${selectedToken.literal}`}
                      />
                      {" "}Keep unchanged
                    </label>
                    <input
                      id={`form-${selectedToken.id}-${key}`}
                      className="tr-form-row__input"
                      type="text"
                      disabled={kept}
                      value={ov}
                      placeholder={kept ? "(keeping literal)" : "(auto)"}
                      aria-label={`${label} override for ${selectedToken.literal}`}
                      data-form-override={`${selectedToken.id}:${key}`}
                      onChange={(e) => setOverride(selectedToken.id, key, e.target.value)}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        ) : activeBank ? (
          <div className="tr-forms__bank-context">
            <div className="tr-panel__section-head">OVERRIDES</div>
            <p className="tr-forms__desc">
              Select a sample in Banks &amp; Samples to edit its form exceptions here.
            </p>
          </div>
        ) : (
          <div className="tr-forms__bank-context">
            <div className="tr-panel__section-head">OVERRIDES</div>
            <p className="tr-forms__desc">
              Select a bank or sample to see context-relevant form exceptions.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
