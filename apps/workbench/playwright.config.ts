import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "fs";

// Chromium resolution strategy:
// 1. CHROMIUM_PATH env var — explicit path (CI or manual override)
// 2. /opt/pw-browsers/chromium_headless_shell-1194 — pre-installed headless shell (rev 1194)
//    compatible with Playwright's default headless mode
// 3. Playwright's own downloaded headless shell (CI after npx playwright install)
const localHeadlessShell = "/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell";
const chromiumPath: string | undefined =
  process.env["CHROMIUM_PATH"] ??
  (existsSync(localHeadlessShell) ? localHeadlessShell : undefined);

// Use headless mode (default) with executablePath so the pre-installed binary works.
// In CI, chromiumPath is undefined and Playwright uses its own downloaded headless shell.
const chromiumOverride = chromiumPath
  ? {
      executablePath: chromiumPath,
      channel: undefined as undefined,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    }
  : {};

export default defineConfig({
  testDir: "../../tests/e2e",
  outputDir: "../../test-results",
  reporter: [["html", { outputFolder: "../../playwright-report" }]],
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
  },
  projects: [
    // Desktop viewports
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...chromiumOverride },
    },
    {
      name: "desktop-1280",
      use: { ...devices["Desktop Chrome"], ...chromiumOverride, viewport: { width: 1280, height: 800 } },
    },
    {
      name: "desktop-1024",
      use: { ...devices["Desktop Chrome"], ...chromiumOverride, viewport: { width: 1024, height: 768 } },
    },
    // Tablet viewport
    {
      name: "tablet-portrait",
      use: { ...devices["Desktop Chrome"], ...chromiumOverride, viewport: { width: 768, height: 1024 } },
    },
    // Mobile viewports
    {
      name: "mobile-portrait",
      use: { ...devices["Pixel 5"], ...chromiumOverride },
    },
    {
      name: "mobile-landscape",
      use: { ...devices["Pixel 5 landscape"], ...chromiumOverride },
    },
    {
      name: "mobile-small",
      use: { ...devices["Desktop Chrome"], ...chromiumOverride, viewport: { width: 375, height: 667 } },
    },
  ],
  webServer: {
    // Run from apps/workbench — vite preview serves outDir (../../next) at base /next/
    command: "npm run preview",
    // Wait for the v08 app to respond before running tests
    url: "http://localhost:4173/next/",
    reuseExistingServer: !process.env["CI"],
  },
});
