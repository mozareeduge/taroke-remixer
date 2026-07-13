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
    { name: "chromium", use: { ...devices["Desktop Chrome"], executablePath: process.env["CHROMIUM_PATH"] ?? "/opt/pw-browsers/chromium" } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-portrait", use: { ...devices["iPhone 14"] } },
    { name: "mobile-landscape", use: { ...devices["iPhone 14 landscape"] } },
  ],
  webServer: {
    command: "npm run preview --workspace=apps/workbench",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env["CI"],
  },
});
