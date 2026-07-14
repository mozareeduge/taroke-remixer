import { defineConfig, devices } from "@playwright/test";

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
      use: {
        ...devices["Desktop Chrome"],
        // /opt/pw-browsers/chromium is a symlink to the pre-installed Chromium binary
        executablePath: process.env["CHROMIUM_PATH"] ?? "/opt/pw-browsers/chromium",
        channel: undefined,
      },
    },
    // Firefox and WebKit are not available in this CI environment (chromium only)
    // { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    // { name: "webkit", use: { ...devices["Desktop Safari"] } },
    // Mobile viewports via Chromium device emulation (Pixel 5 = Android, 393×851 portrait)
    {
      name: "mobile-portrait",
      use: {
        ...devices["Pixel 5"],
        executablePath: process.env["CHROMIUM_PATH"] ?? "/opt/pw-browsers/chromium",
        channel: undefined,
      },
    },
    {
      name: "mobile-landscape",
      use: {
        ...devices["Pixel 5 landscape"],
        executablePath: process.env["CHROMIUM_PATH"] ?? "/opt/pw-browsers/chromium",
        channel: undefined,
      },
    },
  ],
  webServer: {
    command: "npm run preview --workspace=apps/workbench",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env["CI"],
  },
});
