/**
 * WP05 Accessibility audit — axe-core via Chromium injection.
 * Checks each panel for serious and critical violations.
 * All violations are reported; none are suppressed.
 */

import { test, expect, type Page } from "@playwright/test";
import { readFileSync } from "fs";
import { resolve } from "path";

const BASE = "/next/";
const AXE_PATH = resolve(process.cwd(), "../../node_modules/axe-core/axe.js");

async function injectAxe(page: Page) {
  const axeSource = readFileSync(AXE_PATH, "utf-8");
  await page.evaluate(axeSource);
}

async function runAxe(page: Page, panelName: string): Promise<void> {
  const results = await page.evaluate(() => {
    return new Promise<{
      violations: { id: string; impact: string; description: string; nodes: { html: string }[] }[];
    }>((resolve) => {
      // @ts-expect-error axe injected globally
      window.axe.run(document, { runOnly: ["wcag2a", "wcag2aa", "best-practice"] }, (_err: unknown, res: unknown) => {
        resolve(res as never);
      });
    });
  });

  const seriousOrCritical = results.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );

  if (seriousOrCritical.length > 0) {
    const report = seriousOrCritical
      .map(
        (v) =>
          `[${v.impact.toUpperCase()}] ${v.id}: ${v.description}\n` +
          `  Nodes: ${v.nodes.slice(0, 2).map((n) => n.html.slice(0, 80)).join(" | ")}`,
      )
      .join("\n");
    throw new Error(`axe violations in ${panelName}:\n${report}`);
  }
}

async function goto(page: Page) {
  await page.goto(BASE);
  await expect(page.locator("h1")).toContainText("TAROKE RIMIXER", { timeout: 10_000 });
}

const NAV_LABELS_A11Y: Record<string, string> = {
  "Materials": "Banks & Samples",
  "Forms": "Forms",
  "Instruments": "Devices",
  "Composition": "Patterns",
  "Automation": "Triggers",
  "Performance": "Cue & Surface",
  "Archive": "Import & Export",
};

async function clickNav(page: Page, label: string) {
  const desktopName = NAV_LABELS_A11Y[label] ?? label;

  if (await page.locator(".tr-navigator").isVisible()) {
    await page.getByRole("button", { name: desktopName }).click();
    return;
  }

  // Mobile: the chamber switcher lists all eight chambers by their canonical
  // name (the same `label` passed in, e.g. "Materials", "Performance").
  const trigger = page.locator(".tr-chamber-switcher__trigger");
  if (await trigger.isVisible()) {
    await trigger.click();
    await page.getByRole("option", { name: new RegExp(`\\b${label}`) }).click();
    return;
  }

  // Short landscape: compact scrollable rail instead of the collapsed switcher.
  await page.locator(".tr-chamber-rail__btn", { hasText: label }).click();
}

test("a11y — shell (no panel active)", async ({ page }) => {
  await goto(page);
  await injectAxe(page);
  await runAxe(page, "shell");
});

test("a11y — Materials panel", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Materials");
  await injectAxe(page);
  await runAxe(page, "Materials");
});

test("a11y — Forms panel", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Forms");
  await injectAxe(page);
  await runAxe(page, "Forms");
});

test("a11y — Instruments panel", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Instruments");
  await injectAxe(page);
  await runAxe(page, "Instruments");
});

test("a11y — Composition panel", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Composition");
  await injectAxe(page);
  await runAxe(page, "Composition");
});

test("a11y — Automation panel", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Automation");
  await injectAxe(page);
  await runAxe(page, "Automation");
});

test("a11y — Performance panel", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Performance");
  await injectAxe(page);
  await runAxe(page, "Performance");
});

test("a11y — Archive panel", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Archive");
  await injectAxe(page);
  await runAxe(page, "Archive");
});

// ── T05: non-default states (selected, editing, in-progress) ────────────────
// The checks above only exercise each panel's neutral default state; several
// real violations (e.g. the SHELL-09 nested-interactive card bug) were only
// found by auditing a panel mid-interaction.

test("a11y — Materials panel with a sample selected (mobile card state)", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await goto(page);
  await clickNav(page, "Materials");
  await page.waitForTimeout(150);
  const firstCard = page.locator(".tr-mat-card__select").first();
  await expect(firstCard).toBeVisible({ timeout: 5_000 });
  await firstCard.click();
  await injectAxe(page);
  await runAxe(page, "Materials (sample selected, mobile card)");
});

test("a11y — Forms panel with the before/after bench open", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Materials");
  await page.locator(".tr-mat-table__literal, .tr-mat-card__literal").first().click();
  await clickNav(page, "Forms");
  await page.waitForTimeout(150);
  await expect(page.locator("[data-form-override]").first()).toBeVisible({ timeout: 3_000 });
  await injectAxe(page);
  await runAxe(page, "Forms (bench open)");
});

test("a11y — Archive panel with preview built (READY badge, iframe present)", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Archive");
  await page.getByRole("button", { name: /generate preview of exported artifact/i }).click();
  await expect(page.locator("[data-preview-lifecycle]").first()).toHaveAttribute("data-preview-lifecycle", "ready", { timeout: 5_000 });
  await injectAxe(page);
  await runAxe(page, "Archive (preview ready)");
});

test("a11y — Composition panel with a slot's Actions menu open", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Composition");
  await page.getByRole("button", { name: /^Actions for slot /i }).first().click();
  await injectAxe(page);
  await runAxe(page, "Composition (Actions menu open)");
});

test("a11y — Automation panel with a trigger's editor and condition preview open", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Automation");
  // No trigger exists by default — add one, then open its editor.
  await page.getByLabel("New trigger name").fill("a11y test trigger");
  await page.getByRole("button", { name: "+ Trigger" }).click();
  await page.locator(".tr-trigger__select-btn").first().click();
  await expect(page.locator(".tr-trigger__preview")).toBeVisible();
  await injectAxe(page);
  await runAxe(page, "Automation (editor + condition preview open)");
});

test("a11y — Archive panel with the import preflight replacement warning open", async ({ page }) => {
  await goto(page);
  await clickNav(page, "Archive");
  const validProject = JSON.stringify({
    schemaVersion: "7.8",
    project: { title: "a11y-preflight-test", author: "" },
    materials: { trays: {}, bankMeta: {} },
    forms: { casePolicy: "source" },
    lineDevices: [], stanzaPatterns: [], flowScenes: [], triggers: [], meta: {},
  });
  await page.locator('input[type="file"]').setInputFiles({
    name: "a11y-preflight.taroke.json",
    mimeType: "application/json",
    buffer: Buffer.from(validProject),
  });
  await expect(page.getByRole("alertdialog", { name: /confirm import/i })).toBeVisible({ timeout: 3000 });
  await injectAxe(page);
  await runAxe(page, "Archive (import preflight open)");
});
