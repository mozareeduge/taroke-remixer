import { KEEP_UNCHANGED_SENTINEL } from "@taroke/core";
import type { TarokeProject } from "@taroke/schema";

/** Which grammatical forms are editable per bank role, shown as the
 * before→transformation→after bench in the Forms chamber. */
export const ROLE_FORMS: Record<string, { key: string; label: string }[]> = {
  noun:      [{ key: "literal", label: "Literal" }, { key: "singular", label: "Singular" }, { key: "plural", label: "Plural" }],
  verb:      [{ key: "literal", label: "Literal" }, { key: "thirdSingular", label: "3rd singular" }, { key: "imperative", label: "Imperative" }],
  adjective: [{ key: "literal", label: "Literal" }],
  adverb:    [{ key: "literal", label: "Literal" }],
  mixed:     [{ key: "literal", label: "Literal" }],
};
export const DEFAULT_FORMS = [{ key: "literal", label: "Literal" }];

export function formsForRole(role: string): { key: string; label: string }[] {
  return ROLE_FORMS[role] ?? DEFAULT_FORMS;
}

export function getFormOverride(project: TarokeProject, tokenId: string, form: string): string {
  const ov = (project.forms?.overrides?.[tokenId] as Record<string, string> | undefined) ?? {};
  const v = ov[form];
  return v === KEEP_UNCHANGED_SENTINEL ? "" : (v ?? "");
}

export function isFormKept(project: TarokeProject, tokenId: string, form: string): boolean {
  const ov = (project.forms?.overrides?.[tokenId] as Record<string, string> | undefined) ?? {};
  return ov[form] === KEEP_UNCHANGED_SENTINEL;
}
