import { describe, it, expect } from "vitest";
import { defaultProject, compileCavePhrases } from "../migration.js";

describe("Taroko canonical default project", () => {
  it("title and author match manifest", () => {
    const p = defaultProject();
    expect(p.project.title).toBe("Taroko Gorge");
    expect(p.project.author).toBe("Nick Montfort");
  });

  it("source banks have exact ordered arrays", () => {
    const p = defaultProject();
    expect(p.materials.trays["above"]!.map((t) => t.literal)).toEqual(
      ["brow", "mist", "shape", "layer", "the crag", "stone", "forest", "height"],
    );
    expect(p.materials.trays["below"]!.map((t) => t.literal)).toEqual(
      ["flow", "basin", "shape", "vein", "rippling", "stone", "cove", "rock"],
    );
    expect(p.materials.trays["trans"]!.map((t) => t.literal)).toEqual(
      ["command", "pace", "roam", "trail", "frame", "sweep", "exercise", "range"],
    );
    expect(p.materials.trays["imper"]!.map((t) => t.literal)).toEqual(
      ["track", "shade", "translate", "stamp", "progress through", "direct", "run", "enter"],
    );
    expect(p.materials.trays["intrans"]!.map((t) => t.literal)).toEqual(
      ["linger", "dwell", "rest", "relax", "hold", "dream", "hum"],
    );
    expect(p.materials.trays["texture"]!.map((t) => t.literal)).toEqual(["rough", "fine"]);
    expect(p.materials.trays["cave_fixed"]!.map((t) => t.literal)).toEqual(
      ["encompassing", "sinuous", "straight", "objective", "arched", "cool", "clear", "dim", "driven"],
    );
  });

  it("path_subject has capitalized above tokens with weights [4,4,4,4,4,4,3,4] totaling 31", () => {
    const p = defaultProject();
    const ps = p.materials.trays["path_subject"]!;
    expect(ps.map((t) => t.literal)).toEqual(
      ["Brow", "Mist", "Shape", "Layer", "The crag", "Stone", "Forest", "Height"],
    );
    expect(ps.map((t) => t.weight)).toEqual([4, 4, 4, 4, 4, 4, 3, 4]);
    const total = ps.reduce((s, t) => s + t.weight, 0);
    expect(total).toBe(31);
  });

  it("site_subject has 16 tokens (8 above weight 1, 8 below weight 2)", () => {
    const p = defaultProject();
    const ss = p.materials.trays["site_subject"]!;
    expect(ss).toHaveLength(16);
    // First 8 are above (weight 1)
    for (const t of ss.slice(0, 8)) expect(t.weight).toBe(1);
    // Next 8 are below (weight 2)
    for (const t of ss.slice(8)) expect(t.weight).toBe(2);
  });

  it("PATH device has routes with weights [31,31,31,31,2,2]", () => {
    const p = defaultProject();
    const path = p.lineDevices.find((d) => d.id === "ld_path")!;
    expect(path).toBeDefined();
    expect(path.routes.map((r) => r.weight)).toEqual([31, 31, 31, 31, 2, 2]);
    expect(path.routes.find((r) => r.id === "rt_path_monkeys_plain")).toBeDefined();
    expect(path.routes.find((r) => r.id === "rt_path_monkeys_s")).toBeDefined();
  });

  it("CAVE compiled bank has exactly 515 unique phrases with total weight 20160", () => {
    const phrases = compileCavePhrases();
    expect(phrases).toHaveLength(515);
    const totalWeight = phrases.reduce((s, t) => s + t.weight, 0);
    expect(totalWeight).toBe(20160);
    const literals = phrases.map((t) => t.literal);
    expect(new Set(literals).size).toBe(515);
  });

  it("cave_phrases bank in default project has 515 entries totaling 20160", () => {
    const p = defaultProject();
    const cp = p.materials.trays["cave_phrases"]!;
    expect(cp).toHaveLength(515);
    const totalWeight = cp.reduce((s, t) => s + t.weight, 0);
    expect(totalWeight).toBe(20160);
  });

  it("has 3 stanza patterns with 0, 1, 2 SITE slots respectively", () => {
    const p = defaultProject();
    expect(p.stanzaPatterns).toHaveLength(3);
    const siteCounts = p.stanzaPatterns.map(
      (st) => st.slots.filter((s) => s.type === "device" && s.deviceId === "ld_site").length,
    );
    expect(siteCounts).toEqual([0, 1, 2]);
  });

  it("has 3 equal-weight flow scenes each enabled with chance 100", () => {
    const p = defaultProject();
    expect(p.flowScenes).toHaveLength(3);
    for (const sc of p.flowScenes) {
      expect(sc.enabled).toBe(true);
      expect(sc.chance).toBe(100);
    }
  });

  it("has no triggers", () => {
    const p = defaultProject();
    expect(p.triggers).toHaveLength(0);
  });

  it("surface speedMs is 1200 and retention is 26", () => {
    const p = defaultProject();
    expect(p.surface.speedMs).toBe(1200);
    expect(p.surface.retention).toBe(26);
  });

  it("surface family is taroko and theme is night", () => {
    const p = defaultProject();
    expect(p.surface.family).toBe("taroko");
    expect(p.surface.theme).toBe("night");
  });

  it("credits contain full permission notice", () => {
    const p = defaultProject();
    expect(p.project.credits).toContain("Copyright (c) 2009-2016 Nick Montfort");
    expect(p.project.credits).toContain("Permission to use, copy, modify");
  });

  it("no Grave-related content in default project identity", () => {
    const p = defaultProject();
    expect(p.project.title).not.toMatch(/grave/i);
    expect(p.project.author).not.toMatch(/mozare/i);
  });
});
