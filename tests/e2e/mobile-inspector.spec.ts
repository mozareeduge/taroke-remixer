/**
 * Mobile Inspector flow — sheet mode contract.
 *
 * Verifies the explicit mobile Details flow:
 *   a. select a sample in Materials;
 *   b. verify the Inspector sheet has NOT auto-opened;
 *   c. explicitly open Details via FormsPanel's "Edit in Details" action;
 *   d. verify [data-form-override] inputs are visible inside the Inspector;
 *   e. edit one override and verify its value;
 *   f. close the sheet;
 *   g. navigate to another chamber via the chamber switcher and prove it
 *      remains usable.
 *
 * Retains overlay auto-open at 960–1199 px and docked-open at ≥1200 px.
 * FormsPanel must have no .tr-forms__sample-editor or [data-form-override];
 * Inspector is the sole full form editor.
 */

import { test, expect, type Page } from "@playwright/test";

const BASE = "/next/";
const MOBILE_W = 390;
const MOBILE_H = 844;

async function gotoMobile(page: Page) {
  await page.setViewportSize({ width: MOBILE_W, height: MOBILE_H });
  await page.goto(BASE);
  await expect(page.locator("h1")).toContainText("TAROKE RIMIXER", { timeout: 10_000 });
  await page.waitForTimeout(150); // allow matchMedia listeners to settle
}

/** Opens the mobile chamber switcher and selects a chamber by its full name. */
async function gotoChamber(page: Page, chamberLabel: string) {
  await page.locator(".tr-chamber-switcher__trigger").click();
  await page.getByRole("option", { name: new RegExp(`\\b${chamberLabel}`) }).click();
  await page.waitForTimeout(150);
}

// ── FormsPanel must never contain full form editor elements ───────────────────

test("MI-0 — FormsPanel has no .tr-forms__sample-editor or [data-form-override]", async ({ page }) => {
  await gotoMobile(page);

  // Navigate to Forms via the chamber switcher
  await gotoChamber(page, "Forms");
  await page.waitForTimeout(200);

  // FormsPanel must not contain a sample editor or data-form-override
  const sampleEditor = page.locator(".tr-forms__sample-editor");
  expect(await sampleEditor.count(), "FormsPanel must not have .tr-forms__sample-editor").toBe(0);

  // data-form-override lives only in Inspector, not in FormsPanel
  const panel = page.locator(".tr-panel--forms");
  const overridesInPanel = panel.locator("[data-form-override]");
  expect(await overridesInPanel.count(), "FormsPanel must not contain [data-form-override]").toBe(0);
});

// ── Mobile Inspector sheet flow ───────────────────────────────────────────────

test("MI-1 — mobile: select sample → sheet not auto-opened → open Details → edit override → close → bottom nav usable", async ({ page }) => {
  await gotoMobile(page);

  // Step a: navigate to Materials and select a sample
  await gotoChamber(page, "Materials");
  await page.waitForTimeout(200);

  // Below 600px, samples render as cards, not a table (SHELL-09).
  await expect(page.locator(".tr-mat-cards")).toBeVisible({ timeout: 5_000 });
  const firstLiteral = page.locator(".tr-mat-card__literal").first();
  await expect(firstLiteral).toBeVisible();
  await firstLiteral.click();
  await page.waitForTimeout(200);

  // Step b: verify Inspector sheet has NOT auto-opened in sheet mode (< 960 px)
  // Inspector in sheet mode only opens on explicit user action.
  const inspector = page.locator(".tr-inspector");
  const isOpen = await inspector.evaluate((el) =>
    el.classList.contains("tr-inspector--open")
  );
  expect(isOpen, "Inspector sheet must NOT auto-open on selection in mobile sheet mode").toBe(false);

  // Step c: navigate to Forms and click "Edit in Details"
  await gotoChamber(page, "Forms");
  await page.waitForTimeout(200);

  // "Edit in Details" button appears when a token is selected in FormsPanel
  const editDetailsBtn = page.getByRole("button", { name: /Edit.*Details/i });
  await expect(editDetailsBtn).toBeVisible({ timeout: 3_000 });
  await editDetailsBtn.click();
  await page.waitForTimeout(300);

  // Step d: verify [data-form-override] inputs are visible inside the Inspector
  const inspectorEl = page.locator(".tr-inspector");
  await expect(inspectorEl).toBeVisible({ timeout: 2_000 });
  const overrideInputs = inspectorEl.locator("[data-form-override]");
  await expect(overrideInputs.first()).toBeVisible({ timeout: 3_000 });

  // Step e: edit one override and verify its value
  const firstOverride = overrideInputs.first();
  await firstOverride.fill("mobile-test-value");
  await expect(firstOverride).toHaveValue("mobile-test-value");

  // Step f: close the sheet via the Close button
  const closeBtn = inspectorEl.getByRole("button", { name: /Close inspector/i });
  await expect(closeBtn).toBeVisible();
  await closeBtn.click();
  await page.waitForTimeout(200);

  // Inspector must be closed/hidden
  const isStillOpen = await inspector.evaluate((el) =>
    el.classList.contains("tr-inspector--open")
  );
  expect(isStillOpen, "Inspector must close after clicking Close").toBe(false);

  // Step g: navigate to another chamber via the chamber switcher — prove it is still usable
  await gotoChamber(page, "Performance");
  await page.waitForTimeout(300);

  // Verify the Performance panel rendered (chamber switcher worked)
  await expect(page.getByText("CUE").first()).toBeVisible({ timeout: 3_000 });

  // Verify the switcher is still present and usable
  await gotoChamber(page, "Archive");
  await page.waitForTimeout(200);
  await expect(page.getByText("EXPORT").first()).toBeVisible({ timeout: 3_000 });
});

// ── Overlay auto-open at 960–1199 px (regression guard) ─────────────────────

test("MI-2 — overlay: Inspector auto-opens on first token selection at 1024 px", async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.goto(BASE);
  await expect(page.locator("h1")).toContainText("TAROKE RIMIXER", { timeout: 10_000 });
  await page.waitForTimeout(150);

  // Navigate to Materials
  const materialsBtn = page.getByRole("button", { name: "Banks & Samples" });
  await expect(materialsBtn).toBeVisible({ timeout: 3_000 });
  await materialsBtn.click();
  await page.waitForTimeout(200);

  // Select first sample to trigger auto-open in overlay mode
  const firstLiteral = page.locator(".tr-mat-table__literal").first();
  await expect(firstLiteral).toBeVisible({ timeout: 3_000 });
  await firstLiteral.click();
  await page.waitForTimeout(300);

  // Inspector should auto-open in overlay mode (960–1199 px)
  const inspector = page.locator(".tr-inspector");
  const isOpen = await inspector.evaluate((el) =>
    el.classList.contains("tr-inspector--open")
  );
  expect(isOpen, "Inspector must auto-open on first selection in overlay mode (1024 px)").toBe(true);
});

// ── Docked-open at ≥1200 px (regression guard) ───────────────────────────────

test("MI-3 — docked: Inspector is open by default at 1440 px", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(BASE);
  await expect(page.locator("h1")).toContainText("TAROKE RIMIXER", { timeout: 10_000 });
  await page.waitForTimeout(150);

  // At ≥1200 px the Inspector is docked-open without any user action
  const inspector = page.locator(".tr-inspector");
  const isOpen = await inspector.evaluate((el) =>
    el.classList.contains("tr-inspector--open")
  );
  expect(isOpen, "Inspector must be docked-open at 1440 px without user interaction").toBe(true);
});
