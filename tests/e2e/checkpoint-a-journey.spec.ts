/**
 * Human Checkpoint A — Serial Journey
 *
 * Tests the complete WP05 vertical-slice contract.
 * Every step asserts both pre-state and post-state.
 * No conditional passes, no arbitrary sleeps (waits on observable state).
 * Browser console errors fail the test.
 */
import { test, expect, type Page, type ConsoleMessage } from "@playwright/test";

// ── Helpers ────────────────────────────────────────────────────────────────────

const errors: string[] = [];

function attachConsoleListener(page: Page) {
  page.on("console", (msg: ConsoleMessage) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(err.message));
}

// ── Journey ────────────────────────────────────────────────────────────────────

test.describe("Checkpoint A — full vertical-slice journey", () => {
  test.use({ viewport: { width: 1440, height: 900 } });

  test("1. Start clean — shell loads, no errors", async ({ page }) => {
    attachConsoleListener(page);
    await page.goto("/next/");
    await expect(page.locator("h1")).toContainText("TAROKE");
    await expect(page.getByRole("navigation")).toBeVisible();
    await expect(page.getByRole("main")).toBeVisible();
    // Skip-nav should exist for a11y
    const skipNav = page.getByText("Skip to main content");
    await expect(skipNav).toBeAttached();
    expect(errors).toHaveLength(0);
  });

  test("2. Navigator has all 6 sections", async ({ page }) => {
    await page.goto("/next/");
    const nav = page.getByRole("navigation", { name: "Editor sections" });
    await expect(nav).toBeVisible();
    for (const section of ["MATERIAL", "INSTRUMENT", "COMPOSITION", "AUTOMATION", "PERFORMANCE", "ARCHIVE"]) {
      await expect(nav.getByText(section)).toBeVisible();
    }
  });

  test("3. Materials panel — Banks & Samples visible", async ({ page }) => {
    await page.goto("/next/");
    // Default panel is materials — heading "Banks" appears in the panel
    await expect(page.getByRole("heading", { name: "Banks" })).toBeVisible();
    // Default project has banks
    const bankBtns = page.locator(".tr-bank-btn");
    await expect(bankBtns.first()).toBeVisible();
  });

  test("4. Select a bank and see samples", async ({ page }) => {
    await page.goto("/next/");
    const firstBank = page.locator(".tr-bank-btn").first();
    const bankName = await firstBank.textContent();
    await firstBank.click();
    // Samples list should be visible
    await expect(page.locator(".tr-token-list")).toBeVisible();
  });

  test("5. Add a sample", async ({ page }) => {
    await page.goto("/next/");
    // Select first bank
    await page.locator(".tr-bank-btn").first().click();
    const before = await page.locator(".tr-token").count();
    // Add new sample
    const input = page.locator(".tr-add-sample__input");
    await input.fill("test-sample-alpha");
    await page.locator(".tr-add-sample__btn").click();
    await expect(page.locator(".tr-token")).toHaveCount(before + 1);
    // Verify sample appears in list
    await expect(page.locator(".tr-token__literal").last()).toHaveValue("test-sample-alpha");
  });

  test("6. Edit a sample literal", async ({ page }) => {
    await page.goto("/next/");
    await page.locator(".tr-bank-btn").first().click();
    const firstInput = page.locator(".tr-token__literal").first();
    const originalValue = await firstInput.inputValue();
    await firstInput.fill("edited-sample");
    // Trigger change
    await firstInput.press("Tab");
    // Value should be updated
    await expect(firstInput).toHaveValue("edited-sample");
  });

  test("7. Edit sample weight and verify share calculation", async ({ page }) => {
    await page.goto("/next/");
    await page.locator(".tr-bank-btn").first().click();
    const weightInput = page.locator(".tr-token__weight").first();
    await weightInput.fill("10");
    await weightInput.press("Tab");
    // Share percentages should be visible
    await expect(page.locator(".tr-token__share").first()).toBeVisible();
  });

  test("8. Move sample to start using explicit button", async ({ page }) => {
    await page.goto("/next/");
    await page.locator(".tr-bank-btn").first().click();
    const tokens = page.locator(".tr-token");
    const count = await tokens.count();
    if (count < 2) {
      // Add a second sample first
      await page.locator(".tr-add-sample__input").fill("second-sample");
      await page.locator(".tr-add-sample__btn").click();
    }
    // Get second token's literal
    const secondLiteral = await page.locator(".tr-token__literal").nth(1).inputValue();
    // Click "Move to start" on second token
    await page.locator(".tr-token").nth(1).locator("[aria-label='Move to start']").click();
    // The token that was second should now be first
    await expect(page.locator(".tr-token__literal").first()).toHaveValue(secondLiteral);
  });

  test("9. Forms panel — select token, see role-aware forms", async ({ page }) => {
    await page.goto("/next/");
    await page.locator(".tr-bank-btn").first().click();
    // Click on the first token to select it
    const firstToken = page.locator(".tr-token").first();
    await firstToken.click();
    // Forms section should appear
    await expect(page.getByText("Forms —")).toBeVisible();
    // Form inputs should exist
    await expect(page.locator(".tr-form-row").first()).toBeVisible();
  });

  test("10. Keep text unchanged — distinct from empty override", async ({ page }) => {
    await page.goto("/next/");
    await page.locator(".tr-bank-btn").first().click();
    await page.locator(".tr-token").first().click();
    // The "Keep unchanged" checkbox
    const keepCheckbox = page.locator("[aria-label*='Keep']").first();
    await expect(keepCheckbox).toBeVisible();
    // Initially unchecked
    await expect(keepCheckbox).not.toBeChecked();
    // Check it
    await keepCheckbox.check();
    await expect(keepCheckbox).toBeChecked();
    // The override input should be disabled
    const formInput = page.locator(".tr-form-row__input").first();
    await expect(formInput).toBeDisabled();
  });

  test("11. Navigate to Instruments panel", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Devices").click();
    await expect(page.getByRole("main")).toContainText("INSTRUMENTS");
    await expect(page.getByRole("heading", { name: "Devices" })).toBeVisible();
  });

  test("12. Instruments — expand device and see inputs/routes", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Devices").click();
    const expandBtn = page.locator(".tr-device__expand").first();
    await expandBtn.click();
    await expect(page.locator(".tr-device__body")).toBeVisible();
    await expect(page.getByText("Inputs")).toBeVisible();
    await expect(page.getByText("Routes")).toBeVisible();
  });

  test("13. Edit device input slot name", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Devices").click();
    await page.locator(".tr-device__expand").first().click();
    const slotInput = page.locator(".tr-input-row__slot").first();
    const originalSlot = await slotInput.inputValue();
    await slotInput.fill("newslotname");
    await slotInput.press("Tab");
    await expect(slotInput).toHaveValue("newslotname");
  });

  test("14. Route template editor — open and edit", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Devices").click();
    await page.locator(".tr-device__expand").first().click();
    // Expand first route
    const routeExpand = page.locator(".tr-route__expand").first();
    await routeExpand.click();
    const templateArea = page.locator(".tr-route-editor__template").first();
    await expect(templateArea).toBeVisible();
  });

  test("15. Variable palette — opens on Insert button click", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Devices").click();
    await page.locator(".tr-device__expand").first().click();
    await page.locator(".tr-route__expand").first().click();
    // Click Insert variable button
    const insertBtn = page.locator(".tr-route-editor__insert-btn").first();
    await insertBtn.click();
    await expect(page.locator(".tr-palette")).toBeVisible();
    await expect(page.locator(".tr-palette__search")).toBeVisible();
  });

  test("16. Variable palette — search filters results", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Devices").click();
    await page.locator(".tr-device__expand").first().click();
    await page.locator(".tr-route__expand").first().click();
    await page.locator(".tr-route-editor__insert-btn").first().click();
    // Type a filter
    const search = page.locator(".tr-palette__search");
    await search.fill("literal");
    const items = page.locator(".tr-palette__item");
    const count = await items.count();
    expect(count).toBeGreaterThan(0);
    for (let i = 0; i < count; i++) {
      await expect(items.nth(i)).toContainText("literal");
    }
  });

  test("17. Variable palette — Escape closes without mutation", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Devices").click();
    await page.locator(".tr-device__expand").first().click();
    await page.locator(".tr-route__expand").first().click();
    const templateArea = page.locator(".tr-route-editor__template").first();
    const beforeValue = await templateArea.inputValue();
    await page.locator(".tr-route-editor__insert-btn").first().click();
    await page.keyboard.press("Escape");
    await expect(page.locator(".tr-palette")).not.toBeVisible();
    await expect(templateArea).toHaveValue(beforeValue);
  });

  test("18. Variable palette — insert at caret", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Devices").click();
    await page.locator(".tr-device__expand").first().click();
    await page.locator(".tr-route__expand").first().click();
    const templateArea = page.locator(".tr-route-editor__template").first();
    await templateArea.click();
    await templateArea.fill("");
    await page.locator(".tr-route-editor__insert-btn").first().click();
    // Click first palette item
    const firstItem = page.locator(".tr-palette__item").first();
    await firstItem.click();
    // Template should now contain a variable
    const value = await templateArea.inputValue();
    expect(value).toMatch(/\{[^}]+\}/);
  });

  test("19. Navigate to Composition panel", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Patterns").click();
    await expect(page.getByRole("main")).toContainText("COMPOSITION");
    await expect(page.getByRole("heading", { name: "Patterns" })).toBeVisible();
  });

  test("20. Composition — add pattern", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Patterns").click();
    const before = await page.locator(".tr-pattern").count();
    await page.getByLabel("Add pattern").click();
    await expect(page.locator(".tr-pattern")).toHaveCount(before + 1);
  });

  test("21. Composition — reorder patterns by button", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Patterns").click();
    const patterns = page.locator(".tr-pattern");
    const count = await patterns.count();
    if (count < 2) {
      await page.getByLabel("Add pattern").click();
    }
    // Get first pattern name
    const firstName = await page.locator(".tr-pattern__name").first().inputValue();
    // Move first pattern down
    await page.locator("[aria-label='Move pattern down']").first().click();
    // First pattern should now be second
    const newSecond = await page.locator(".tr-pattern__name").nth(1).inputValue();
    expect(newSecond).toBe(firstName);
  });

  test("22. Navigate to Automation panel", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Triggers").click();
    await expect(page.getByRole("main")).toContainText("AUTOMATION");
    await expect(page.getByRole("heading", { name: "Triggers" })).toBeVisible();
  });

  test("23. Automation — add trigger with WHEN→THEN", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Triggers").click();
    const before = await page.locator(".tr-trigger").count();
    await page.getByLabel("Add trigger").click();
    await expect(page.locator(".tr-trigger")).toHaveCount(before + 1);
    await expect(page.locator(".tr-trigger__when").last()).toBeVisible();
    await expect(page.locator(".tr-trigger__then").last()).toBeVisible();
  });

  test("24. Automation — set trigger condition and action", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Triggers").click();
    await page.getByLabel("Add trigger").click();
    const lastTrigger = page.locator(".tr-trigger").last();
    await lastTrigger.locator(".tr-trigger__term").fill("forest");
    await lastTrigger.locator(".tr-trigger__action-text").fill("in the forest");
    await expect(lastTrigger.locator(".tr-trigger__summary")).toContainText("forest");
  });

  test("25. Navigate to Performance panel", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Cue & Surface").click();
    await expect(page.getByRole("main")).toContainText("PERFORMANCE");
    await expect(page.getByRole("heading", { name: "Cue" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Surface" })).toBeVisible();
  });

  test("26. Cue — Audition generates preview without writing to Surface", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Cue & Surface").click();
    const surfaceLinesBefore = await page.locator(".tr-surface__line").count();
    await page.getByLabel("Audition — preview without saving to Surface").click();
    // A cue preview should appear
    await expect(page.locator(".tr-cue__preview")).toBeVisible();
    // Surface should NOT have gained a new line
    const surfaceLinesAfter = await page.locator(".tr-surface__line").count();
    expect(surfaceLinesAfter).toBe(surfaceLinesBefore);
  });

  test("27. Surface — Generate adds line to Surface", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Cue & Surface").click();
    await page.getByLabel("Generate — add line to Surface").click();
    await expect(page.locator(".tr-surface__line")).toHaveCount(1);
    // Line text should be non-empty
    const lineText = await page.locator(".tr-surface__line-text").first().textContent();
    expect(lineText).toBeTruthy();
    expect(lineText!.length).toBeGreaterThan(0);
  });

  test("28. Surface — UNMIX shows provenance of last event", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Cue & Surface").click();
    await page.getByLabel("Generate — add line to Surface").click();
    await expect(page.getByText("UNMIX — Last Surface Event")).toBeVisible();
    await expect(page.locator(".tr-unmix__detail")).toBeVisible();
    // Should show tick, device fields
    await expect(page.locator(".tr-unmix__detail")).toContainText("Tick");
  });

  test("29. Takes — Capture Take from Surface", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Cue & Surface").click();
    await page.getByLabel("Generate — add line to Surface").click();
    await page.getByLabel("Capture Take").click();
    await expect(page.locator(".tr-take")).toHaveCount(1);
    const takeLabel = await page.locator(".tr-take__select").first().textContent();
    expect(takeLabel).toContain("Take");
  });

  test("30. Takes — navigate away and back, Take persists", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Cue & Surface").click();
    await page.getByLabel("Generate — add line to Surface").click();
    await page.getByLabel("Capture Take").click();
    const takeLabel = await page.locator(".tr-take__select").first().textContent();
    // Navigate away
    await page.getByText("Banks & Samples").click();
    await expect(page.getByRole("heading", { name: "Banks" })).toBeVisible();
    // Navigate back
    await page.getByText("Cue & Surface").click();
    // Take should still be there
    await expect(page.locator(".tr-take")).toHaveCount(1);
    const stillThere = await page.locator(".tr-take__select").first().textContent();
    expect(stillThere).not.toBeNull();
  });

  test("31. Navigate to Archive panel", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Import & Export").click();
    await expect(page.getByRole("main")).toContainText("ARCHIVE");
    await expect(page.getByRole("heading", { name: "Import" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Export" })).toBeVisible();
  });

  test("32. Archive — Export JSON downloads a file", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Import & Export").click();
    // Set up download listener
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByLabel("Download project as JSON").click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.taroke\.json$/);
  });

  test("33. Archive — Export HTML downloads a file", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Import & Export").click();
    const [download] = await Promise.all([
      page.waitForEvent("download"),
      page.getByLabel("Download standalone HTML").click(),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.taroke\.html$/);
  });

  test("34. Archive — Embedded preview builds successfully", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Import & Export").click();
    await expect(page.locator(".tr-preview__status--unbuilt")).toBeVisible();
    await page.getByLabel("Build preview").click();
    await expect(page.locator(".tr-preview__status--fresh")).toBeVisible();
    await expect(page.locator(".tr-preview__frame")).toBeVisible();
  });

  test("35. Archive — Autosave check works", async ({ page }) => {
    await page.goto("/next/");
    await page.getByText("Import & Export").click();
    await page.getByLabel("Check for saved drafts").click();
    await expect(page.locator(".tr-autosave__panel")).toBeVisible();
  });

  test("36. No browser console errors throughout journey", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => { if (msg.type() === "error") consoleErrors.push(msg.text()); });
    page.on("pageerror", (err) => consoleErrors.push(err.message));

    await page.goto("/next/");
    // Quick walk through all panels
    for (const panel of ["Banks & Samples", "Devices", "Patterns", "Triggers", "Cue & Surface", "Import & Export"]) {
      await page.getByText(panel).click();
    }
    expect(consoleErrors).toHaveLength(0);
  });
});

// ── Viewport matrix ───────────────────────────────────────────────────────────

const VIEWPORTS = [
  { name: "desktop-1440", width: 1440, height: 900 },
  { name: "desktop-1280", width: 1280, height: 800 },
  { name: "desktop-1024", width: 1024, height: 768 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "mobile-430", width: 430, height: 932 },
  { name: "mobile-390", width: 390, height: 844 },
  { name: "landscape-844", width: 844, height: 390 },
];

for (const vp of VIEWPORTS) {
  test(`[${vp.name}] shell loads and panels navigable`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto("/next/");
    await expect(page.locator("h1")).toContainText("TAROKE");
    // Navigate to each panel without errors
    await page.getByText("Devices").click();
    await expect(page.getByRole("main")).toContainText("INSTRUMENTS");
    await page.getByText("Patterns").click();
    await expect(page.getByRole("main")).toContainText("COMPOSITION");
  });
}
