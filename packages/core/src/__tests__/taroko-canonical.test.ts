import { describe, it, expect } from "vitest";
import { defaultProject, compileCavePhrases, migrateProject } from "../migration.js";

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

// ── Stable canonical IDs ───────────────────────────────────────────────────────

describe("defaultProject stable canonical IDs", () => {
  it("two independent calls produce identical token IDs for all source banks", () => {
    const a = defaultProject();
    const b = defaultProject();
    for (const bank of ["above", "below", "trans", "imper", "intrans", "texture", "cave_fixed"]) {
      const idsA = a.materials.trays[bank]!.map((t) => t.id);
      const idsB = b.materials.trays[bank]!.map((t) => t.id);
      expect(idsA, `${bank} IDs must be stable`).toEqual(idsB);
    }
  });

  it("two independent calls produce identical token IDs for all derived banks", () => {
    const a = defaultProject();
    const b = defaultProject();
    for (const bank of ["imper_cap", "path_subject", "site_subject"]) {
      const idsA = a.materials.trays[bank]!.map((t) => t.id);
      const idsB = b.materials.trays[bank]!.map((t) => t.id);
      expect(idsA, `${bank} IDs must be stable`).toEqual(idsB);
    }
  });

  it("two independent calls produce structurally identical projects (excluding updatedAt)", () => {
    const a = defaultProject();
    const b = defaultProject();
    // Strip the timestamp field before comparing
    const stripTs = (p: ReturnType<typeof defaultProject>) => ({ ...p, meta: { ...p.meta, updatedAt: "" } });
    expect(stripTs(a)).toEqual(stripTs(b));
  });

  it("all token IDs across all banks in defaultProject are unique", () => {
    const p = defaultProject();
    const allIds: string[] = [];
    for (const bank of Object.keys(p.materials.trays)) {
      for (const tok of p.materials.trays[bank]!) {
        allIds.push(tok.id);
      }
    }
    expect(new Set(allIds).size, "All token IDs must be unique").toBe(allIds.length);
  });

  it("source token IDs follow expected prefix pattern", () => {
    const p = defaultProject();
    const above = p.materials.trays["above"]!;
    expect(above[0]!.id).toBe("tok_above_0");
    expect(above[7]!.id).toBe("tok_above_7");
    const imper = p.materials.trays["imper"]!;
    expect(imper[0]!.id).toBe("tok_imper_0");
    expect(imper[4]!.id).toBe("tok_imper_4");
    const imperCap = p.materials.trays["imper_cap"]!;
    expect(imperCap[0]!.id).toBe("tok_imper_cap_0");
    expect(imperCap[4]!.id).toBe("tok_imper_cap_4");
  });

  it("migrateProject(defaultProject()) preserves all stable token IDs", () => {
    const original = defaultProject();
    const migrated = migrateProject(original);
    for (const bank of Object.keys(original.materials.trays)) {
      const origIds = original.materials.trays[bank]!.map((t) => t.id);
      const migrIds = migrated.materials.trays[bank]!.map((t) => t.id);
      expect(migrIds, `${bank} IDs must survive round-trip migration`).toEqual(origIds);
    }
  });

  it("double migration is idempotent on IDs (deterministic export/import)", () => {
    const once = migrateProject(defaultProject());
    const twice = migrateProject(once);
    for (const bank of Object.keys(once.materials.trays)) {
      const idsOnce = once.materials.trays[bank]!.map((t) => t.id);
      const idsTwice = twice.materials.trays[bank]!.map((t) => t.id);
      expect(idsTwice, `${bank} IDs must be idempotent after double migration`).toEqual(idsOnce);
    }
  });
});

// ── CAVE capitalization ────────────────────────────────────────────────────────

describe("CAVE capitalization (imper source + imper_cap operational)", () => {
  it("imper source bank preserves exact lowercase literals", () => {
    const p = defaultProject();
    const imper = p.materials.trays["imper"]!.map((t) => t.literal);
    expect(imper).toEqual(
      ["track", "shade", "translate", "stamp", "progress through", "direct", "run", "enter"],
    );
  });

  it("imper_cap bank has 8 tokens with equal weights", () => {
    const p = defaultProject();
    const imperCap = p.materials.trays["imper_cap"]!;
    expect(imperCap).toHaveLength(8);
    for (const t of imperCap) expect(t.weight).toBe(1);
  });

  it("imper_cap literals are first-char-capitalized from imper (not title case)", () => {
    const p = defaultProject();
    const imper = p.materials.trays["imper"]!.map((t) => t.literal);
    const imperCap = p.materials.trays["imper_cap"]!.map((t) => t.literal);
    for (let i = 0; i < imper.length; i++) {
      const src = imper[i]!;
      const cap = imperCap[i]!;
      expect(cap).toBe(src.charAt(0).toUpperCase() + src.slice(1));
    }
  });

  it("progress through capitalizes only the first character (not title case)", () => {
    const p = defaultProject();
    const imperCap = p.materials.trays["imper_cap"]!;
    const progressThrough = imperCap.find((t) => t.literal.startsWith("Progress"));
    expect(progressThrough?.literal).toBe("Progress through");
    expect(progressThrough?.literal).not.toBe("Progress Through");
  });

  it("CAVE device command input routes through imper_cap bank", () => {
    const p = defaultProject();
    const cave = p.lineDevices.find((d) => d.id === "ld_cave")!;
    const commandInput = cave.inputs.find((i) => i.slot === "command")!;
    expect(commandInput.tray).toBe("imper_cap");
  });

  it("imper_cap bank metadata labels it as IMPER CAP derived bank", () => {
    const p = defaultProject();
    const meta = p.materials.bankMeta["imper_cap"]!;
    expect(meta.label).toBe("IMPER CAP");
    expect(meta.role).toBe("verb");
    expect(meta.desc).toMatch(/[Dd]erived/);
  });

  it("CAVE imper_cap token first chars match source imper first chars capitalized (deterministic)", () => {
    const p = defaultProject();
    const imper = p.materials.trays["imper"]!;
    const imperCap = p.materials.trays["imper_cap"]!;
    for (let i = 0; i < imper.length; i++) {
      const expectedFirstChar = imper[i]!.literal.charAt(0).toUpperCase();
      const actualFirstChar = imperCap[i]!.literal.charAt(0);
      expect(actualFirstChar, `imper_cap[${i}] must start with uppercase char`).toBe(expectedFirstChar);
    }
  });

  it("imper_cap and imper have different IDs to ensure token uniqueness", () => {
    const p = defaultProject();
    const imperIds = new Set(p.materials.trays["imper"]!.map((t) => t.id));
    const imperCapIds = p.materials.trays["imper_cap"]!.map((t) => t.id);
    for (const id of imperCapIds) {
      expect(imperIds.has(id), `imper_cap ID ${id} must not collide with imper IDs`).toBe(false);
    }
  });
});
