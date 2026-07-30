/**
 * Mobile Inspector flow — sheet mode contract.
 *
 * Verifies the explicit mobile Forms flow (T03: FormsPanel owns its own
 * before->after bench — see shell/formRoles.ts — instead of redirecting to
 * "Edit in Details"):
 *   a. select a sample in Materials;
 *   b. verify the Inspector sheet has NOT auto-opened;
 *   c. navigate to Forms via the chamber switcher;
 *   d. verify [data-form-override] inputs are visible directly in
 *      FormsPanel, with no extra "Edit in Details" step required;
 *   e. edit one override inline and verify its value;
 *   f. navigate to another chamber via the chamber switcher and prove it
 *      remains usable.
 *
 * Retains overlay auto-open at 960–1199 px and docked-open at ≥1200 px.
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

// ── FormsPanel owns the real bench directly ────────────────────────────────

test("MI-0 — FormsPanel shows [data-form-override] inline once a sample is selected", async ({ page }) => {
  await gotoMobile(page);

  await gotoChamber(page, "Materials");
  await page.waitForTimeout(200);
  await expect(page.locator(".tr-mat-cards")).toBeVisible({ timeout: 5_000 });
  const firstLiteral = page.locator(".tr-mat-card__literal").first();
  await expect(firstLiteral).toBeVisible();
  await firstLiteral.click();
  await page.waitForTimeout(200);

  // Navigate to Forms via the chamber switcher
  await gotoChamber(page, "Forms");
  await page.waitForTimeout(200);

  // The bench (with data-form-override inputs) is directly in FormsPanel —
  // no separate Details/Inspector step is required.
  const panel = page.locator(".tr-panel--forms");
  const overridesInPanel = panel.locator("[data-form-override]");
  await expect(overridesInPanel.first(), "FormsPanel must show [data-form-override] inline").toBeVisible({ timeout: 3_000 });
});

// ── Mobile Forms bench flow ───────────────────────────────────────────────────

test("MI-1 — mobile: select sample → sheet not auto-opened → Forms bench editable inline → chamber switcher usable", async ({ page }) => {
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

  // Step c: navigate to Forms — the bench is immediately visible, no extra
  // "Edit in Details" step required.
  await gotoChamber(page, "Forms");
  await page.waitForTimeout(200);

  const panel = page.locator(".tr-panel--forms");
  const overrideInputs = panel.locator("[data-form-override]");
  await expect(overrideInputs.first()).toBeVisible({ timeout: 3_000 });

  // Step d: edit one override inline and verify its value
  const firstOverride = overrideInputs.first();
  await firstOverride.fill("mobile-test-value");
  await expect(firstOverride).toHaveValue("mobile-test-value");

  // Step e: navigate to another chamber via the chamber switcher — prove it is still usable
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
