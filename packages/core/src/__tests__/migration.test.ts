import { describe, it, expect } from "vitest";
import { migrateProject, defaultProject, validateProject } from "../migration.js";
import { SCHEMA_VERSION } from "@taroke/schema";

describe("migrateProject", () => {
  it("returns a valid project from empty input", () => {
    const p = migrateProject({});
    expect(p.schemaVersion).toBe(SCHEMA_VERSION);
    expect(p.materials.trays).toBeDefined();
    expect(p.lineDevices.length).toBeGreaterThan(0);
    expect(p.triggers.length).toBeGreaterThan(0);
  });

  it("preserves explicit modern trays (A path)", () => {
    const input = {
      materials: {
        trays: {
          above: [{ id: "t1", literal: "custom", role: "noun", weight: 1, lockedLiteral: false }],
        },
      },
    };
    const p = migrateProject(input);
    expect(p.materials.trays["above"]).toHaveLength(1);
    expect(p.materials.trays["above"]![0]!.literal).toBe("custom");
  });

  it("falls back to legacy dictionary (B path)", () => {
    const input = {
      dictionary: {
        above: ["old-token"],
      },
    };
    const p = migrateProject(input);
    expect(p.materials.trays["above"]).toHaveLength(1);
    expect(p.materials.trays["above"]![0]!.literal).toBe("old-token");
  });

  it("uses defaults when no trays or dictionary (C path)", () => {
    const p = migrateProject({ project: { title: "Test" } });
    expect(Object.keys(p.materials.trays)).toContain("above");
    expect(p.materials.trays["above"]!.length).toBeGreaterThan(0);
  });

  it("repairs duplicate token IDs and records in meta.importRepairs", () => {
    const dupId = "tok_dup_shared";
    const input = {
      materials: {
        trays: {
          above: [{ id: dupId, literal: "token-a", role: "noun", weight: 1, lockedLiteral: false }],
          below: [{ id: dupId, literal: "token-b", role: "noun", weight: 1, lockedLiteral: false }],
        },
      },
    };
    const p = migrateProject(input);
    const ids = [
      ...p.materials.trays["above"]!.map((t) => t.id),
      ...p.materials.trays["below"]!.map((t) => t.id),
    ];
    expect(new Set(ids).size).toBe(ids.length);
    expect(p.meta.importRepairs).toBeDefined();
    expect(p.meta.importRepairs!.length).toBeGreaterThan(0);
  });

  it("migrates legacy rareEvents to triggers", () => {
    const input = {
      rareEvents: [
        { id: "tr1", name: "rare one", enabled: true, triggerLayer: "above", triggerTerm: "box", chance: 50, placement: "append", insertion: "[RARE]" },
      ],
    };
    const p = migrateProject(input);
    expect(p.triggers).toHaveLength(1);
    expect(p.triggers[0]!.condition.tray).toBe("above");
    expect(p.triggers[0]!.action.text).toBe("[RARE]");
  });

  it("enforces surface invariants (showTick=false, family=taroko)", () => {
    const input = {
      surface: { showTick: true, family: "document", theme: "night", speedMs: 1000, retention: 20, fontSize: 18, lineHeight: 1.4, showTitle: false, showSource: false, traceMode: "visible" },
    };
    const p = migrateProject(input);
    expect(p.surface.showTick).toBe(false);
    expect(p.surface.family).toBe("taroko");
  });

  it("preserves explicitly empty lineDevices array", () => {
    const input = { lineDevices: [] };
    const p = migrateProject(input);
    expect(p.lineDevices).toHaveLength(0);
  });

  it("idempotent: migrating already-migrated project is stable", () => {
    const first = migrateProject(defaultProject());
    const second = migrateProject(first);
    expect(second.schemaVersion).toBe(first.schemaVersion);
    expect(second.materials.trays["above"]!.length).toBe(first.materials.trays["above"]!.length);
    expect(second.lineDevices.length).toBe(first.lineDevices.length);
  });

  it("merges importRepairs provenance across passes", () => {
    const dupId = "tok_shared";
    const input = {
      materials: {
        trays: {
          above: [{ id: dupId, literal: "a", role: "noun", weight: 1, lockedLiteral: false }],
          below: [{ id: dupId, literal: "b", role: "noun", weight: 1, lockedLiteral: false }],
        },
      },
    };
    const first = migrateProject(input);
    const second = migrateProject(first);
    // Second pass should not add new repairs (IDs are now unique)
    expect(second.meta.importRepairs!.length).toBe(first.meta.importRepairs!.length);
  });
});

describe("validateProject", () => {
  it("returns no errors for default project", () => {
    const issues = validateProject(defaultProject());
    const errors = issues.filter((i) => i.level === "error");
    expect(errors).toHaveLength(0);
  });

  it("warns on empty bank", () => {
    const p = defaultProject();
    p.materials.trays["above"] = [];
    const issues = validateProject(p);
    expect(issues.some((i) => i.level === "warning" && i.area === "samples.above")).toBe(true);
  });

  it("errors on device with no routes", () => {
    const p = defaultProject();
    p.lineDevices[0]!.routes = [];
    const issues = validateProject(p);
    expect(issues.some((i) => i.level === "error")).toBe(true);
  });

  it("errors when no scenes are active", () => {
    const p = defaultProject();
    p.flowScenes[0]!.enabled = false;
    const issues = validateProject(p);
    expect(issues.some((i) => i.area === "flow")).toBe(true);
  });

  it("errors on unknown slot in route template", () => {
    const p = defaultProject();
    p.lineDevices[0]!.routes[0]!.template = "{nonexistent:literal} goes here.";
    const issues = validateProject(p);
    expect(issues.some((i) => i.level === "error")).toBe(true);
  });
});
