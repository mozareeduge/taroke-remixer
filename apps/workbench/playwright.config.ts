import { defineConfig, devices } from "@playwright/test";
import { existsSync } from "fs";

// In CI, Playwright installs its own browser (chromium headless shell).
// In local dev (remote session), use the pre-installed binary from /opt/pw-browsers.
// The pre-installed binary is Playwright 1.47 era so requires headless:false to avoid
// the headless-shell binary lookup that 1.61+ does for default headless mode.
const localChromium = "/opt/pw-browsers/chromium";
const chromiumPath: string | undefined =
  process.env["CHROMIUM_PATH"] ?? (existsSync(localChromium) ? localChromium : undefined);

// When using the local pre-installed binary, run non-headless (Xvfb/DISPLAY required).
// When in CI (chromiumPath undefined), let Playwright use its downloaded headless shell.
const chromiumOverride = chromiumPath
  ? {
      executablePath: chromiumPath,
      channel: undefined as undefined,
      headless: false as false,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
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
