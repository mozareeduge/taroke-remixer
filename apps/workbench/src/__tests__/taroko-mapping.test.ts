import { describe, it, expect } from "vitest";
import { defaultProject, compileCavePhrases } from "@taroke/core";

describe("Taroko mapping: CAVE phrase compilation", () => {
  it("compileCavePhrases produces exactly 515 unique phrases", () => {
    const phrases = compileCavePhrases();
    expect(phrases).toHaveLength(515);
    const literals = phrases.map((t) => t.literal);
    expect(new Set(literals).size).toBe(515);
  });

  it("compileCavePhrases total weight is exactly 20160", () => {
    const phrases = compileCavePhrases();
    const total = phrases.reduce((s, t) => s + t.weight, 0);
    expect(total).toBe(20160);
  });

  it("cave_phrases bank has 515 entries totaling 20160", () => {
    const p = defaultProject();
    const cp = p.materials.trays["cave_phrases"]!;
    expect(cp).toHaveLength(515);
    expect(cp.reduce((s, t) => s + t.weight, 0)).toBe(20160);
  });
});

describe("Taroko mapping: PATH route weights", () => {
  it("PATH route weights are [31, 31, 31, 31, 2, 2]", () => {
    const p = defaultProject();
    const path = p.lineDevices.find((d) => d.id === "ld_path")!;
    expect(path.routes.map((r) => r.weight)).toEqual([31, 31, 31, 31, 2, 2]);
  });

  it("rt_path_monkeys routes exist with weight 2", () => {
    const p = defaultProject();
    const path = p.lineDevices.find((d) => d.id === "ld_path")!;
    const monkeysPlain = path.routes.find((r) => r.id === "rt_path_monkeys_plain");
    const monkeysS = path.routes.find((r) => r.id === "rt_path_monkeys_s");
    expect(monkeysPlain).toBeDefined();
    expect(monkeysS).toBeDefined();
    expect(monkeysPlain!.weight).toBe(2);
    expect(monkeysS!.weight).toBe(2);
  });

  it("path_subject weights total 31", () => {
    const p = defaultProject();
    const ps = p.materials.trays["path_subject"]!;
    const total = ps.reduce((s, t) => s + t.weight, 0);
    expect(total).toBe(31);
  });
});
