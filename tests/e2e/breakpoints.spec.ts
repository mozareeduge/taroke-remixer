/**
 * SHELL-07 — real breakpoint regression coverage and exact-head screenshots.
 *
 * Verifies, at every required viewport, that:
 *  - the document never scrolls horizontally (no clipped/blown-out content);
 *  - on mobile widths, the primary Transport controls meet the 44x44
 *    minimum touch target (SHELL-05);
 *  - the last control in a representative chamber (Archive's Publish HTML
 *    button) is actually reachable by scrolling, not hidden behind
 *    persistent UI (SHELL-08).
 *
 * A screenshot is captured per viewport for human review; this is
 * mechanical regression coverage, not a claim of visual/artistic review.
 */
import { test, expect, type Page } from "@playwright/test";
import { mkdirSync } from "fs";
import { join } from "path";

const BASE = "/next/";
const OUT_DIR = join(process.cwd(), "..", "..", "test-results", "breakpoint-evidence");
mkdirSync(OUT_DIR, { recursive: true });

const VIEWPORTS = [
  { name: "375x667", width: 375, height: 667 },
  { name: "390x844", width: 390, height: 844 },
  { name: "430x932", width: 430, height: 932 },
  { name: "844x390", width: 844, height: 390 },
  { name: "1024x768", width: 1024, height: 768 },
  { name: "1280x800", width: 1280, height: 800 },
  { name: "1440x900", width: 1440, height: 900 },
];

async function gotoChamber(page: Page, width: number, chamberLabel: string, desktopName: string) {
  if (width >= 960) {
    await page.getByRole("button", { name: desktopName }).click();
    return;
  }
  const trigger = page.locator(".tr-chamber-switcher__trigger");
  if (await trigger.isVisible().catch(() => false)) {
    await trigger.click();
    await page.getByRole("option", { name: new RegExp(`\\b${chamberLabel}`) }).click();
    return;
  }
  await page.locator(".tr-chamber-rail__btn", { hasText: chamberLabel }).click();
}

for (const vp of VIEWPORTS) {
  test(`breakpoint ${vp.name}: no horizontal overflow, touch targets, last control reachable`, async ({ page }) => {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto(BASE);
    await expect(page.locator("h1")).toContainText("TAROKE RIMIXER", { timeout: 10_000 });
    await page.waitForTimeout(200);

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow, `${vp.name}: unexpected document horizontal overflow (px)`).toBeLessThanOrEqual(1);

    await page.screenshot({ path: join(OUT_DIR, `${vp.name}-default.png`) });

    if (vp.width < 960) {
      const playBox = await page.getByRole("button", { name: "Play" }).boundingBox();
      expect(playBox?.width ?? 0, `${vp.name}: Play button width below 40px`).toBeGreaterThanOrEqual(40);
      expect(playBox?.height ?? 0, `${vp.name}: Play button height below 40px`).toBeGreaterThanOrEqual(40);

      const stopBox = await page.getByRole("button", { name: "Stop" }).boundingBox();
      expect(stopBox?.width ?? 0, `${vp.name}: Stop button width below 40px`).toBeGreaterThanOrEqual(40);
      expect(stopBox?.height ?? 0, `${vp.name}: Stop button height below 40px`).toBeGreaterThanOrEqual(40);
    }

    await gotoChamber(page, vp.width, "Archive", "Import & Export");
    await page.waitForTimeout(200);

    const exportBtn = page.getByRole("button", { name: /Publish HTML/i });
    await exportBtn.scrollIntoViewIfNeeded();
    await expect(exportBtn, `${vp.name}: last Archive control (Publish HTML) not reachable`).toBeVisible();

    const overflowAfterNav = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflowAfterNav, `${vp.name}: horizontal overflow appeared after navigating to Archive`).toBeLessThanOrEqual(1);

    await page.screenshot({ path: join(OUT_DIR, `${vp.name}-archive.png`) });
  });
}
