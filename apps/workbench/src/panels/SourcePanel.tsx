import { useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/hooks.js";
import { mutateProject } from "../store/projectSlice.js";
import {
  setProjectTitle,
  setProjectAuthor,
  setProjectLanguage,
  setProjectSourceTitle,
  setProjectSourceUrl,
  setProjectStatement,
  setProjectCredits,
} from "../store/commands.js";

function isValidHttpUrl(value: string): boolean {
  if (!value) return true;
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

export function SourcePanel() {
  const dispatch = useAppDispatch();
  const project = useAppSelector((s) => s.project.present);
  const info = project.project;
  const [urlTouched, setUrlTouched] = useState(false);

  const urlInvalid = info.sourceUrl !== "" && !isValidHttpUrl(info.sourceUrl);
  const showUrlError = urlTouched && urlInvalid;

  return (
    <div className="tr-panel tr-panel--source">
      <div className="tr-panel__main">
        <div className="tr-panel__section-head">WORK IDENTITY</div>
        <div className="tr-source__fields">
          <label className="tr-forms__label">
            Title
            <input
              type="text"
              className="tr-input"
              value={info.title}
              onChange={(e) => dispatch(mutateProject(setProjectTitle(project, e.target.value)))}
              placeholder="Untitled"
              aria-label="Project title"
            />
          </label>
          <label className="tr-forms__label">
            Author
            <input
              type="text"
              className="tr-input"
              value={info.author}
              onChange={(e) => dispatch(mutateProject(setProjectAuthor(project, e.target.value)))}
              placeholder="—"
              aria-label="Author"
            />
          </label>
          <label className="tr-forms__label">
            Language
            <input
              type="text"
              className="tr-input"
              value={info.language}
              onChange={(e) => dispatch(mutateProject(setProjectLanguage(project, e.target.value)))}
              placeholder="—"
              aria-label="Language"
            />
          </label>
        </div>

        <div className="tr-panel__section-head">SOURCE</div>
        <div className="tr-source__fields">
          <label className="tr-forms__label">
            Source title
            <input
              type="text"
              className="tr-input"
              value={info.sourceTitle}
              onChange={(e) => dispatch(mutateProject(setProjectSourceTitle(project, e.target.value)))}
              placeholder="—"
              aria-label="Source title"
            />
          </label>
          <div className="tr-forms__label">
            <span>Source URL <span className="tr-source__optional">(optional)</span></span>
            <input
              type="url"
              className={`tr-input${showUrlError ? " tr-input--error" : ""}`}
              value={info.sourceUrl}
              onChange={(e) => {
                dispatch(mutateProject(setProjectSourceUrl(project, e.target.value)));
                setUrlTouched(true);
              }}
              onBlur={() => setUrlTouched(true)}
              placeholder="https://…"
              aria-label="Source URL"
              aria-describedby={showUrlError ? "tr-source-url-error" : undefined}
              aria-invalid={showUrlError ? "true" : undefined}
            />
            {showUrlError && (
              <span id="tr-source-url-error" className="tr-source__url-error" role="alert">
                URL must start with http:// or https://
              </span>
            )}
          </div>
        </div>

        <div className="tr-panel__section-head">TEXT</div>
        <div className="tr-source__fields">
          <label className="tr-forms__label">
            Statement
            <textarea
              className="tr-input tr-input--textarea"
              value={info.statement}
              onChange={(e) => dispatch(mutateProject(setProjectStatement(project, e.target.value)))}
              placeholder="Optional statement of poetics or intent"
              rows={4}
              aria-label="Statement"
            />
          </label>
          <label className="tr-forms__label">
            Credits
            <textarea
              className="tr-input tr-input--textarea"
              value={info.credits}
              onChange={(e) => dispatch(mutateProject(setProjectCredits(project, e.target.value)))}
              placeholder="Optional credits"
              rows={3}
              aria-label="Credits"
            />
          </label>
        </div>
      </div>
    </div>
  );
}
