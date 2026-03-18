import { defineConfig, devices } from "@playwright/test";

/**
 * SECURIT-E — Playwright E2E Configuration
 * Targets the live preview. Tests run against the deployed app.
 * 
 * To run locally: npx playwright install && npx playwright test
 * In CI: npm run test:e2e
 */

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL || "https://id-preview--535f1714-f91a-45af-915d-b9aa9bc9cf0a.lovable.app";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [["list"], ["html", { open: "never" }]],
  
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    actionTimeout: 15000,
    navigationTimeout: 30000,
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});
