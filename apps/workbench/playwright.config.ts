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
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], ...chromiumOverride },
    },
    {
      name: "mobile-portrait",
      use: { ...devices["Pixel 5"], ...chromiumOverride },
    },
    {
      name: "mobile-landscape",
      use: { ...devices["Pixel 5 landscape"], ...chromiumOverride },
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
