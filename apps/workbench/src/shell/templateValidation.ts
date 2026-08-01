import type { LineDevice, TarokeProject } from "@taroke/schema";
import { formsForRole } from "./formRoles.js";

/** E2: structured route template validation — every issue names the exact
 * offending token and the allowed alternatives, so the raw editor can show
 * a local error without rewriting the user's text. */
export type TemplateIssueType = "unknown-slot" | "unknown-form" | "unmatched-brace";

export interface TemplateIssue {
  token: string;
  type: TemplateIssueType;
  message: string;
  allowed: string[];
}

const ARTICLE_FORMS = ["a", "an"];
const TOKEN_RE = /\{([^}:]+):?([^}]*)\}/g;

function findUnmatchedBraces(text: string): TemplateIssue[] {
  const issues: TemplateIssue[] = [];
  let openIdx = -1;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "{") {
      if (openIdx !== -1) {
        const token = text.slice(openIdx, i);
        issues.push({ token, type: "unmatched-brace", message: `"${token}" is missing its closing "}".`, allowed: [] });
      }
      openIdx = i;
    } else if (ch === "}") {
      if (openIdx === -1) {
        issues.push({ token: "}", type: "unmatched-brace", message: `Unmatched "}" with no opening "{".`, allowed: [] });
      } else {
        openIdx = -1;
      }
    }
  }
  if (openIdx !== -1) {
    const token = text.slice(openIdx);
    issues.push({ token, type: "unmatched-brace", message: `"${token}" is missing its closing "}".`, allowed: [] });
  }
  return issues;
}

export function validateRouteTemplate(
  template: string,
  device: LineDevice,
  project: TarokeProject,
): TemplateIssue[] {
  const text = String(template ?? "");
  const issues: TemplateIssue[] = findUnmatchedBraces(text);

  const slotNames = (device.inputs ?? []).map((i) => i.slot);

  TOKEN_RE.lastIndex = 0;
  let m: RegExpExecArray | null;
  while ((m = TOKEN_RE.exec(text))) {
    const token = m[0];
    const slotName = (m[1] ?? "").trim();
    const form = (m[2] ?? "").trim() || "literal";

    if (slotName === "article") {
      if (!ARTICLE_FORMS.includes(form)) {
        issues.push({
          token,
          type: "unknown-form",
          message: `"${token}" uses an unknown article form. Allowed: ${ARTICLE_FORMS.join(", ")}.`,
          allowed: ARTICLE_FORMS,
        });
      }
      continue;
    }

    const input = (device.inputs ?? []).find((i) => i.slot === slotName);
    if (!input) {
      issues.push({
        token,
        type: "unknown-slot",
        message: `"${token}" references slot "${slotName}", which this device does not have.`,
        allowed: slotNames,
      });
      continue;
    }

    const bankMeta = project.materials.bankMeta[input.tray];
    const role = bankMeta?.role ?? input.role ?? "literal";
    const allowedForms = formsForRole(role).map((f) => f.key);
    if (!allowedForms.includes(form)) {
      issues.push({
        token,
        type: "unknown-form",
        message: `"${token}" uses form "${form}", which is not valid for slot "${slotName}" (${role}). Allowed: ${allowedForms.join(", ")}.`,
        allowed: allowedForms,
      });
    }
  }

  return issues;
}
