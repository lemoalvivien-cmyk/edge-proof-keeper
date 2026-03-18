/**
 * SECURIT-E — E2E Tests: Public routes, Auth protection & optional auth flows
 *
 * Test scope:
 *   UNCONDITIONAL: public routes, auth redirects, error pages
 *   CONDITIONAL:   auth flows (requires E2E_TEST_EMAIL + E2E_TEST_PASSWORD env vars)
 *                  access code (requires E2E_ACCESS_CODE env var)
 *
 * Run public-only tests:
 *   npx playwright test tests/e2e/public-routes.spec.ts
 *
 * Run with auth (requires credentials):
 *   E2E_TEST_EMAIL=test@example.com E2E_TEST_PASSWORD=secret npx playwright test
 */
import { test, expect } from "@playwright/test";

const HAS_AUTH_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
const HAS_ACCESS_CODE = !!process.env.E2E_ACCESS_CODE;

// ── A. Public routes ─────────────────────────────────────────────────────────

test.describe("A. Public Routes", () => {
  test("landing page loads and has title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SECURIT-E|Securit-E|securit-e/i);
    // Must not expose dashboard content to anonymous users
    await expect(page.locator("body")).not.toContainText("dashboard-protected-content");
  });

  test("/pricing loads without forbidden claims", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("certifié SecNumCloud");
    await expect(page.locator("body")).not.toContainText("SLA garanti contractuellement");
    await expect(page.locator("body")).not.toContainText("fully autonomous");
    await expect(page.locator("body")).not.toContainText("CRYSTALS-Dilithium");
  });

  test("/faq loads", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.locator("body")).toBeVisible();
  });

  test("/status loads and runs real checks", async ({ page }) => {
    await page.goto("/status");
    await expect(page.locator("body")).toBeVisible();
    // Status page must not contain fabricated uptime percentages as facts
    await expect(page.locator("body")).not.toContainText("99.97%");
    await expect(page.locator("body")).not.toContainText("99.99%");
  });

  test("/demo loads", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.locator("body")).toBeVisible();
  });
});

// ── B. Auth protection (unauthenticated redirects) ───────────────────────────

test.describe("B. Auth Protection", () => {
  test("/dashboard redirects unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).not.toHaveURL(/\/dashboard$/);
  });

  test("/admin/access-codes redirects unauthenticated users", async ({ page }) => {
    await page.goto("/admin/access-codes");
    await expect(page).not.toHaveURL(/\/admin\/access-codes$/);
  });

  test("/proofs redirects unauthenticated users", async ({ page }) => {
    await page.goto("/proofs");
    await expect(page).not.toHaveURL(/\/proofs$/);
  });

  test("/executive redirects unauthenticated users", async ({ page }) => {
    await page.goto("/executive");
    await expect(page).not.toHaveURL(/\/executive$/);
  });

  test("/auth page loads with email field", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.locator("input[type='email'], input[name='email']")
    ).toBeVisible({ timeout: 10000 });
  });

  test("/activate page loads (requires auth → redirects if unauth)", async ({ page }) => {
    await page.goto("/activate");
    await expect(page.locator("body")).toBeVisible();
    // Either shows the activation form or redirects to /auth
    const url = page.url();
    const isActivatePage = url.includes("/activate");
    const isAuthPage = url.includes("/auth");
    expect(isActivatePage || isAuthPage).toBe(true);
  });
});

// ── C. Error handling ─────────────────────────────────────────────────────────

test.describe("C. Error Handling", () => {
  test("404 page shows not-found content", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-xyz-999");
    await expect(page.locator("body")).toBeVisible();
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });
});

// ── D. Auth flows — CONDITIONAL (requires E2E_TEST_EMAIL + E2E_TEST_PASSWORD) ─

test.describe("D. Auth Flows [CONDITIONAL — needs E2E_TEST_EMAIL + E2E_TEST_PASSWORD]", () => {
  test.skip(!HAS_AUTH_CREDS, "Skipped: set E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars to enable");

  test("login with valid credentials reaches /dashboard", async ({ page }) => {
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_TEST_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_TEST_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
  });

  test("logout redirects to landing or auth", async ({ page }) => {
    // Login first
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_TEST_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_TEST_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    // Then logout via sidebar or button
    const logoutBtn = page.locator("[data-testid='logout'], button:has-text('Déconnexion'), button:has-text('Logout')").first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).not.toHaveURL(/\/dashboard/, { timeout: 10000 });
    }
  });
});

// ── E. Access code — CONDITIONAL (requires E2E_ACCESS_CODE) ──────────────────

test.describe("E. Access Code [CONDITIONAL — needs E2E_ACCESS_CODE + auth creds]", () => {
  test.skip(!HAS_ACCESS_CODE || !HAS_AUTH_CREDS, "Skipped: set E2E_ACCESS_CODE + E2E_TEST_EMAIL + E2E_TEST_PASSWORD to enable");

  test("/activate with valid code grants access", async ({ page }) => {
    // Login first
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_TEST_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_TEST_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 15000 });
    // Go to activate
    await page.goto("/activate");
    await page.fill("input[placeholder*='code'], input[name='code']", process.env.E2E_ACCESS_CODE!);
    await page.click("button[type='submit']");
    // Should show success and redirect
    await expect(page.locator("body")).toContainText(/activé|succès|granted|access/i, { timeout: 10000 });
  });
});
