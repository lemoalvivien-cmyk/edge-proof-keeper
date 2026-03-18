import { defineConfig, devices } from "@playwright/test";

/**
 * SECURIT-E — Playwright E2E Configuration
 *
 * Environment variables:
 *   PLAYWRIGHT_BASE_URL — override the target URL (default: local dev server)
 *   E2E_TEST_EMAIL      — test account email (required for auth flows)
 *   E2E_TEST_PASSWORD   — test account password (required for auth flows)
 *   E2E_ACCESS_CODE     — valid test access code (required for /activate flow)
 *
 * Usage:
 *   Local dev:    PLAYWRIGHT_BASE_URL=http://localhost:8080 npx playwright test
 *   Preview:      PLAYWRIGHT_BASE_URL=https://id-preview--xxx.lovable.app npx playwright test
 *   Production:   PLAYWRIGHT_BASE_URL=https://edge-proof-keeper.lovable.app npx playwright test
 *   CI:           npm run test:e2e (uses PLAYWRIGHT_BASE_URL from env)
 *
 * Test scope:
 *   - Public routes (unconditional): landing, pricing, faq, status, 404
 *   - Auth protection: /dashboard, /proofs, /executive, /admin/access-codes redirect when unauth
 *   - Auth flows (conditional, requires E2E_TEST_EMAIL + E2E_TEST_PASSWORD): login, signup, logout
 *   - Premium flows (conditional, requires E2E_ACCESS_CODE): /activate code redemption
 *   - Admin flows (conditional, requires admin account): /admin/access-codes management
 */

const BASE_URL =
  process.env.PLAYWRIGHT_BASE_URL ||
  process.env.VITE_PREVIEW_URL ||
  "http://localhost:8080";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  reporter: [
    ["list"],
    ["html", { open: "never", outputFolder: "playwright-report" }],
  ],

  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
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
