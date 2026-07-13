import { describe, it, expect } from "vitest";
import { exportProjectJson, exportProjectHtml, extractProjectFromText, downloadName, safeJsonForHtml } from "../export.js";
import { defaultProject } from "../migration.js";

describe("exportProjectJson / extractProjectFromText round-trip", () => {
  it("round-trips JSON correctly", () => {
    const project = defaultProject();
    const json = exportProjectJson(project);
    const parsed = JSON.parse(json);
    expect(parsed.schemaVersion).toBe(project.schemaVersion);
    expect(parsed.project.title).toBe(project.project.title);
  });
});

describe("exportProjectHtml / extractProjectFromText round-trip", () => {
  it("embeds project in HTML and extracts it back", () => {
    const project = defaultProject();
    const html = exportProjectHtml(project);
    expect(html).toContain("<!doctype html>");
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
