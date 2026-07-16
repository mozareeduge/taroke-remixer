import { describe, it, expect } from "vitest";
import { exportProjectJson, exportProjectHtml, extractProjectFromText, downloadName, safeJsonForHtml, importProjectWithReceipt } from "../export.js";
import { defaultProject } from "../migration.js";

describe("exportProjectJson / extractProjectFromText round-trip", () => {
  it("round-trips JSON correctly via extractProjectFromText", () => {
    const project = defaultProject();
    const json = exportProjectJson(project);
    const extracted = extractProjectFromText(json);
    // Literal schema-version assertion — regression guard against reversion to "0.8.0"
    expect(extracted.schemaVersion).toBe("0.7-reset");
    expect(extracted.project.title).toBe(project.project.title);
    expect(Object.keys(extracted.materials.trays)).toContain("above");
    expect(extracted.lineDevices.length).toBeGreaterThan(0);
    expect(extracted.triggers.length).toBeGreaterThan(0);
  });
});

describe("exportProjectHtml / extractProjectFromText round-trip", () => {
  it("embeds project in HTML and extracts it back", () => {
    const project = defaultProject();
    const html = exportProjectHtml(project);
    expect(html).toContain("<!DOCTYPE html>");
    expect(html).toContain("taroke-project");
    const extracted = extractProjectFromText(html);
    expect(extracted.project.title).toBe(project.project.title);
    expect(Object.keys(extracted.materials.trays)).toContain("above");
  });

  it("HTML escapes title in <title> tag via esc()", () => {
    const project = defaultProject();
    project.project.title = '<script>alert("xss")</script>';
    const html = exportProjectHtml(project);
    // The <title> element must use HTML-escaped version
    expect(html).toContain("<title>&lt;script&gt;alert");
    // The </script> closing tag must be escaped in JSON data to prevent premature closure
    const jsonBlock = html.match(/<script type="application\/json"[^>]*>([\s\S]*?)<\/script>/i);
    expect(jsonBlock).not.toBeNull();
    expect(jsonBlock![1]).not.toContain("</script>");
  });
});

describe("safeJsonForHtml", () => {
  it("escapes </script> to prevent early closing", () => {
    const project = defaultProject();
    // Inject a </script> into a field to test escaping
    project.project.statement = "test </script> end";
    const safe = safeJsonForHtml(project);
    expect(safe).not.toContain("</script>");
    expect(safe).toContain("<\\/script>");
  });
});

describe("importProjectWithReceipt", () => {
  it("returns authoritative receipt from JSON import", () => {
    const project = defaultProject();
    const json = exportProjectJson(project);
    const { project: imported, receipt } = importProjectWithReceipt(json, "test.taroke.json");
    expect(imported.schemaVersion).toBe("0.7-reset");
    expect(receipt.filename).toBe("test.taroke.json");
    expect(receipt.sourceFormat).toBe("json");
    expect(receipt.resultingSchema).toBe("0.7-reset");
    expect(receipt.bankCount).toBeGreaterThan(0);
    expect(receipt.tokenCount).toBeGreaterThan(0);
    expect(receipt.deviceCount).toBeGreaterThan(0);
    expect(receipt.repairCount).toBe(0);
    expect(receipt.duplicateIdFindings).toHaveLength(0);
    expect(receipt.classicDefaultsApplied.devices).toBe(false);
  });

  it("returns authoritative receipt from HTML import", () => {
    const project = defaultProject();
    const html = exportProjectHtml(project);
    const { receipt } = importProjectWithReceipt(html, "test.taroke.html");
    expect(receipt.sourceFormat).toBe("html");
    expect(receipt.bankCount).toBeGreaterThan(0);
  });

  it("receipt classicDefaultsApplied=true for legacy project missing collections", () => {
    const minimal = JSON.stringify({ schemaVersion: "0.7-reset", materials: { trays: {}, bankMeta: {} } });
    const { receipt } = importProjectWithReceipt(minimal, "minimal.taroke.json");
    expect(receipt.classicDefaultsApplied.devices).toBe(true);
    expect(receipt.classicDefaultsApplied.patterns).toBe(true);
    expect(receipt.classicDefaultsApplied.triggers).toBe(true);
  });

  it("receipt.errors is not empty for missing device banks", () => {
    const project = defaultProject();
    // Remove a bank that devices reference
    delete (project.materials.trays as Record<string, unknown>)["above"];
    delete (project.materials.bankMeta as Record<string, unknown>)["above"];
    const json = exportProjectJson(project);
    const { receipt } = importProjectWithReceipt(json, "broken.taroke.json");
    // Should have errors because PATH device references missing "above" bank
    expect(receipt.errors.length).toBeGreaterThan(0);
  });

  it("throws on malformed JSON", () => {
    expect(() => importProjectWithReceipt("not json at all {{{", "bad.json")).toThrow();
  });

  it("migrationPath reflects legacy schema migration", () => {
    const legacy = JSON.stringify({ dictionary: { test: [] }, schemaVersion: "0.6" });
    const { receipt } = importProjectWithReceipt(legacy, "legacy.json");
    expect(receipt.migrationPath).toContain("legacy-dictionary");
  });
});

describe("downloadName", () => {
  it("normalizes title to snake_case filename", () => {
    const project = defaultProject();
    project.project.title = "My Cool Project";
    expect(downloadName(project, ".taroke.json")).toBe("my_cool_project.taroke.json");
  });

  it("falls back to taroke_rimix for empty title", () => {
    const project = defaultProject();
    project.project.title = "";
    expect(downloadName(project, ".html")).toBe("taroke_rimix.html");
  });
});
