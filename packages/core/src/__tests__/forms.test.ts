import { describe, it, expect } from "vitest";
import {
  splitHead,
  styleLike,
  pluralBase,
  verb3Base,
  formToken,
  articleFor,
  KEEP_UNCHANGED_SENTINEL,
} from "../forms.js";
import { defaultProject } from "../migration.js";

describe("splitHead", () => {
  it("splits compound word at last separator", () => {
    expect(splitHead("paper-body")).toEqual(["paper-", "body"]);
    expect(splitHead("giant-hole")).toEqual(["giant-", "hole"]);
  });
  it("returns ['', word] for simple words", () => {
    expect(splitHead("floor")).toEqual(["", "floor"]);
    expect(splitHead("")).toEqual(["", ""]);
  });
});

describe("styleLike", () => {
  it("mirrors UPPERCASE", () => expect(styleLike("GRAVE", "floor")).toBe("FLOOR"));
  it("mirrors lowercase", () => expect(styleLike("grave", "FLOOR")).toBe("floor"));
  it("mirrors Titlecase", () => expect(styleLike("Grave", "floor")).toBe("Floor"));
  it("passes through when no match", () => expect(styleLike("", "hello")).toBe("hello"));
});

describe("pluralBase", () => {
  it("handles regular s", () => expect(pluralBase("floor")).toBe("floors"));
  it("handles -y → -ies", () => expect(pluralBase("baby")).toBe("babies"));
  it("handles -sh → -shes", () => expect(pluralBase("dish")).toBe("dishes"));
  it("handles irregular man → men", () => expect(pluralBase("man")).toBe("men"));
  it("handles f-end exceptions (roof stays roofs)", () => expect(pluralBase("roof")).toBe("roofs"));
  it("handles f → ves (leaf → leaves)", () => expect(pluralBase("leaf")).toBe("leaves"));
});

describe("verb3Base", () => {
  it("handles regular +s", () => expect(verb3Base("rush")).toBe("rushes"));
  it("handles irregular be → is", () => expect(verb3Base("be")).toBe("is"));
  it("handles irregular go → goes", () => expect(verb3Base("go")).toBe("goes"));
  it("handles -y → ies (carry → carries)", () => expect(verb3Base("carry")).toBe("carries"));
});

describe("articleFor", () => {
  it("returns an for vowels", () => expect(articleFor("apple")).toBe("an"));
  it("returns a for consonants", () => expect(articleFor("floor")).toBe("a"));
  it("returns an for hour (silent h)", () => expect(articleFor("hour")).toBe("an"));
  it("returns a for university (consonant sound)", () => expect(articleFor("university")).toBe("a"));
  it("returns a for empty string", () => expect(articleFor("")).toBe("a"));
});

describe("formToken", () => {
  const project = defaultProject();

  it("returns empty string for null token", () => {
    expect(formToken(project, null, "literal")).toBe("");
  });

  it("literal form returns the literal unchanged (preserve casePolicy)", () => {
    const tok = { id: "t1", literal: "floor", role: "noun", weight: 1, lockedLiteral: false };
    expect(formToken(project, tok, "literal")).toBe("floor");
  });

  it("plural form pluralizes", () => {
    const tok = { id: "t1", literal: "baby", role: "noun", weight: 1, lockedLiteral: false };
    expect(formToken(project, tok, "plural")).toBe("babies");
  });

  it("thirdSingular form conjugates", () => {
    const tok = { id: "t1", literal: "carry", role: "verb", weight: 1, lockedLiteral: false };
    expect(formToken(project, tok, "thirdSingular")).toBe("carries");
  });

  it("uppercase form uppercases", () => {
    const tok = { id: "t1", literal: "enter", role: "verb", weight: 1, lockedLiteral: false };
    expect(formToken(project, tok, "uppercase")).toBe("ENTER");
  });

  it("lockedLiteral returns literal even for plural form", () => {
    const tok = { id: "t1", literal: "baby", role: "noun", weight: 1, lockedLiteral: true };
    expect(formToken(project, tok, "plural")).toBe("baby");
  });

  it("compound word preserves prefix on plural", () => {
    const tok = { id: "t1", literal: "giant-hole", role: "noun", weight: 1, lockedLiteral: false };
    expect(formToken(project, tok, "plural")).toBe("giant-holes");
  });

  describe("__keep__ sentinel — must never leak to generated text", () => {
    it("KEEP_UNCHANGED_SENTINEL is the expected value", () => {
      expect(KEEP_UNCHANGED_SENTINEL).toBe("__keep__");
    });

    it("plural kept returns literal not sentinel", () => {
      const proj = { ...project, forms: { ...project.forms, overrides: { t1: { plural: KEEP_UNCHANGED_SENTINEL } } } };
      const tok = { id: "t1", literal: "baby", role: "noun", weight: 1, lockedLiteral: false };
      const result = formToken(proj, tok, "plural");
      expect(result).toBe("baby");
      expect(result).not.toContain("__keep__");
    });

    it("literal kept returns literal not sentinel", () => {
      const proj = { ...project, forms: { ...project.forms, overrides: { t1: { literal: KEEP_UNCHANGED_SENTINEL } } } };
      const tok = { id: "t1", literal: "floor", role: "noun", weight: 1, lockedLiteral: false };
      const result = formToken(proj, tok, "literal");
      expect(result).toBe("floor");
      expect(result).not.toContain("__keep__");
    });

    it("thirdSingular kept returns head not sentinel", () => {
      const proj = { ...project, forms: { ...project.forms, overrides: { t1: { thirdSingular: KEEP_UNCHANGED_SENTINEL } } } };
      const tok = { id: "t1", literal: "carry", role: "verb", weight: 1, lockedLiteral: false };
      const result = formToken(proj, tok, "thirdSingular");
      expect(result).toBe("carry");
      expect(result).not.toContain("__keep__");
    });

    it("imperative kept returns literal not sentinel", () => {
      const proj = { ...project, forms: { ...project.forms, overrides: { t1: { imperative: KEEP_UNCHANGED_SENTINEL } } } };
      const tok = { id: "t1", literal: "run", role: "verb", weight: 1, lockedLiteral: false };
      const result = formToken(proj, tok, "imperative");
      expect(result).toBe("run");
      expect(result).not.toContain("__keep__");
    });

    it("custom form kept returns head not sentinel", () => {
      const proj = { ...project, forms: { ...project.forms, overrides: { t1: { gerund: KEEP_UNCHANGED_SENTINEL } } } };
      const tok = { id: "t1", literal: "run", role: "verb", weight: 1, lockedLiteral: false };
      const result = formToken(proj, tok, "gerund");
      expect(result).toBe("run");
      expect(result).not.toContain("__keep__");
    });

    it("non-kept plural override still works normally", () => {
      const proj = { ...project, forms: { ...project.forms, overrides: { t1: { plural: "babies" } } } };
      const tok = { id: "t1", literal: "baby", role: "noun", weight: 1, lockedLiteral: false };
      expect(formToken(proj, tok, "plural")).toBe("babies");
    });
  });
});
