import { defineConfig } from "@playwright/test";

const CHROME_EXEC = "/opt/pw-browsers/chromium";
const LAUNCH_OPTS = { executablePath: CHROME_EXEC };

export default defineConfig({
  testDir: "../../tests/e2e",
  outputDir: "../../test-results",
  reporter: [["html", { outputFolder: "../../playwright-report" }]],
  use: {
    baseURL: "http://localhost:4173",
    trace: "on-first-retry",
    launchOptions: LAUNCH_OPTS,
  },
  projects: [
    {
      name: "chromium",
      use: { viewport: { width: 1440, height: 900 } },
    },
    {
      name: "mobile-portrait",
      use: {
        viewport: { width: 390, height: 844 },
        hasTouch: true,
        isMobile: true,
        userAgent:
          "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      },
    },
    {
      name: "mobile-landscape",
      use: {
        viewport: { width: 844, height: 390 },
        hasTouch: true,
        isMobile: true,
        userAgent:
          "Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36",
      },
    },
  ],
  webServer: {
    command: "cd apps/workbench && npx vite preview --port 4173",
    cwd: "../..",
    url: "http://localhost:4173",
    reuseExistingServer: !process.env["CI"],
  },
});
