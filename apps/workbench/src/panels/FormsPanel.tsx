import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import { setCasePolicy, setCompoundPolicy, setTokenOverride } from "../store/commands.js";

export function FormsPanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);

  const banks = Object.keys(project.materials.trays);
  const casePolicy = project.forms.casePolicy ?? "preserve";
  const compoundPolicy = project.forms.compoundPolicy ?? "hyphen";

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

        <div className="tr-panel__section-head">OVERRIDES</div>
        <p className="tr-forms__desc">
          Override inflected forms for individual samples. Each bank row shows the token and its plural override.
        </p>
        {banks.map((bankName) => {
          const tokens = project.materials.trays[bankName] ?? [];
          if (tokens.length === 0) return null;
          return (
            <details key={bankName} className="tr-forms__bank" open={bankName === banks[0]}>
              <summary className="tr-forms__bank-label">
                {project.materials.bankMeta[bankName]?.label ?? bankName.toUpperCase()} ({tokens.length})
              </summary>
              <table className="tr-table">
                <thead>
                  <tr>
                    <th className="tr-table__th">Token</th>
                    <th className="tr-table__th">Plural override</th>
                  </tr>
                </thead>
                <tbody>
                  {tokens.map((tok) => {
                    const pluralOverride = project.forms.overrides[tok.id]?.["plural"] ?? "";
                    return (
                      <tr key={tok.id} className="tr-table__row">
                        <td className="tr-table__td">{tok.literal}</td>
                        <td className="tr-table__td">
                          <input
                            className="tr-input"
                            value={pluralOverride}
                            placeholder={`${tok.literal}s`}
                            onChange={(e) => dispatch(mutateProject(setTokenOverride(project, tok.id, "plural", e.target.value)))}
                            aria-label={`Plural override for ${tok.literal}`}
                            data-override={`${tok.id}:plural`}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </details>
          );
        })}
      </div>
    </div>
  );
}
