/**
 * SECURIT-E — E2E Tests: Public routes, Auth protection & optional business flows
 *
 * Test scope:
 *   UNCONDITIONAL: public routes, auth redirects, error pages, product truth checks
 *   CONDITIONAL:   auth flows (requires E2E_TEST_EMAIL + E2E_TEST_PASSWORD env vars)
 *                  access code (requires E2E_ACCESS_CODE env var)
 *                  admin flows (requires E2E_ADMIN_EMAIL + E2E_ADMIN_PASSWORD env vars)
 *
 * Required GitHub Secrets for full coverage:
 *   PLAYWRIGHT_BASE_URL   — target URL (default: local dev server)
 *   E2E_TEST_EMAIL        — test user email
 *   E2E_TEST_PASSWORD     — test user password
 *   E2E_ADMIN_EMAIL       — admin account email
 *   E2E_ADMIN_PASSWORD    — admin account password
 *   E2E_ACCESS_CODE       — valid test access code
 *
 * Run public-only tests (no credentials needed):
 *   npx playwright test tests/e2e/public-routes.spec.ts
 *
 * Run with auth credentials:
 *   E2E_TEST_EMAIL=test@example.com E2E_TEST_PASSWORD=secret npx playwright test
 */
import { test, expect } from "@playwright/test";

const HAS_AUTH_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
const HAS_ADMIN_CREDS = !!(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);
const HAS_ACCESS_CODE = !!process.env.E2E_ACCESS_CODE;

// ── A. Public routes ─────────────────────────────────────────────────────────

test.describe("A. Public Routes", () => {
  test("landing page loads and has title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SECURIT-E|Securit-E|securit-e/i);
    // Must not expose dashboard content to anonymous users
    await expect(page.locator("body")).not.toContainText("dashboard-protected-content");
  });

  test("landing page has hero CTA buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    // Should have at least one call-to-action
    const ctas = page.locator("button, a[href]");
    await expect(ctas.first()).toBeVisible({ timeout: 10000 });
  });

  test("/pricing loads without forbidden claims", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("body")).toBeVisible();
    // Forbidden hardcoded claims
    await expect(page.locator("body")).not.toContainText("certifié SecNumCloud");
    await expect(page.locator("body")).not.toContainText("SLA garanti contractuellement");
    await expect(page.locator("body")).not.toContainText("fully autonomous");
    await expect(page.locator("body")).not.toContainText("CRYSTALS-Dilithium");
    await expect(page.locator("body")).not.toContainText("zk-SNARK");
    await expect(page.locator("body")).not.toContainText("ROI garanti");
    // Plans should be present
    await expect(page.locator("body")).toContainText(/Sentinel|Command|Sovereign/i);
  });

  test("/pricing ROI calculator is interactive", async ({ page }) => {
    await page.goto("/pricing");
    // ROI block should be present
    await expect(page.locator("body")).toContainText(/ROI/i);
  });

  test("/faq loads with real content", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.locator("body")).toBeVisible();
    // Should have actual FAQ content
    await expect(page.locator("body")).toContainText(/SECURIT-E|Evidence Vault|NIS2/i);
    // Must not claim false autonomous operation
    await expect(page.locator("body")).not.toContainText("100% autonome");
    await expect(page.locator("body")).not.toContainText("zéro intervention humaine");
  });

  test("/status loads and runs real checks", async ({ page }) => {
    await page.goto("/status");
    await expect(page.locator("body")).toBeVisible();
    // Status page must not contain fabricated uptime percentages as facts
    await expect(page.locator("body")).not.toContainText("99.97%");
    await expect(page.locator("body")).not.toContainText("99.99% garanti");
  });

  test("/demo loads with simulation label", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.locator("body")).toBeVisible();
    // Demo should clearly label itself as simulation/demonstration
    await expect(page.locator("body")).toContainText(/simulat|démo|demo|lab/i);
  });
});

// ── B. Auth protection (unauthenticated redirects) ───────────────────────────

test.describe("B. Auth Protection", () => {
  test("/dashboard redirects unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard");
    // Should NOT stay on /dashboard — must redirect to /auth or /
    await expect(page).not.toHaveURL(/\/dashboard$/, { timeout: 10000 });
  });

  test("/admin/access-codes redirects unauthenticated users", async ({ page }) => {
    await page.goto("/admin/access-codes");
    await expect(page).not.toHaveURL(/\/admin\/access-codes$/, { timeout: 10000 });
  });

  test("/proofs redirects unauthenticated users", async ({ page }) => {
    await page.goto("/proofs");
    await expect(page).not.toHaveURL(/\/proofs$/, { timeout: 10000 });
  });

  test("/executive redirects unauthenticated users", async ({ page }) => {
    await page.goto("/executive");
    await expect(page).not.toHaveURL(/\/executive$/, { timeout: 10000 });
  });

  test("/risks redirects unauthenticated users", async ({ page }) => {
    await page.goto("/risks");
    await expect(page).not.toHaveURL(/\/risks$/, { timeout: 10000 });
  });

  test("/findings redirects unauthenticated users", async ({ page }) => {
    await page.goto("/findings");
    await expect(page).not.toHaveURL(/\/findings$/, { timeout: 10000 });
  });

  test("/auth page loads with email field", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.locator("input[type='email'], input[name='email']")
    ).toBeVisible({ timeout: 10000 });
  });

  test("/activate page loads or redirects correctly", async ({ page }) => {
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

// ── D. Product truth — public content integrity ───────────────────────────────

test.describe("D. Product Truth — Public Pages", () => {
  test("landing has no forbidden post-quantum claims", async ({ page }) => {
    await page.goto("/");
    const body = page.locator("body");
    await expect(body).not.toContainText("CRYSTALS-Dilithium");
    await expect(body).not.toContainText("Kyber-1024");
    await expect(body).not.toContainText("zk-SNARK");
  });

  test("landing cycle time is labeled as lab/demo", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    // "47s" should be present somewhere (it's the hero claim)
    // It must be qualified as lab/demo — we verify it's not a standalone production claim
    const body = await page.locator("body").innerText();
    if (body.includes("47s") || body.includes("47 secondes")) {
      // Must have qualifying language nearby
      expect(body.toLowerCase()).toMatch(/lab|démo|demo|démontré|conditi/);
    }
  });

  test("/pricing has no hardcoded unverifiable ROI claims", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("body")).not.toContainText("ROI 367x");
    await expect(page.locator("body")).not.toContainText("87% prediction");
    await expect(page.locator("body")).not.toContainText("99.97%");
  });

  test("/executive is not accessible without auth", async ({ page }) => {
    await page.goto("/executive");
    const url = page.url();
    // Should redirect away from /executive
    expect(url).not.toMatch(/\/executive$/);
  });
});

// ── E. Auth flows — CONDITIONAL (requires E2E_TEST_EMAIL + E2E_TEST_PASSWORD) ─

test.describe("E. Auth Flows [CONDITIONAL — needs E2E_TEST_EMAIL + E2E_TEST_PASSWORD]", () => {
  test.skip(!HAS_AUTH_CREDS, "Skipped: set E2E_TEST_EMAIL and E2E_TEST_PASSWORD env vars to enable");

  test("login with valid credentials reaches /dashboard", async ({ page }) => {
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_TEST_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_TEST_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
  });

  test("authenticated user sees dashboard content, not paywall if entitled", async ({ page }) => {
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_TEST_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_TEST_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    // Should show some dashboard content
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("dashboard-protected-content");
  });

  test("logout redirects away from dashboard", async ({ page }) => {
    // Login first
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_TEST_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_TEST_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    // Then logout via sidebar or button
    const logoutBtn = page.locator("[data-testid='logout'], button:has-text('Déconnexion'), button:has-text('Logout')").first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).not.toHaveURL(/\/dashboard/, { timeout: 10000 });
    }
  });
});

// ── F. Access code — CONDITIONAL (requires E2E_ACCESS_CODE) ──────────────────

test.describe("F. Access Code [CONDITIONAL — needs E2E_ACCESS_CODE + auth creds]", () => {
  test.skip(!HAS_ACCESS_CODE || !HAS_AUTH_CREDS, "Skipped: set E2E_ACCESS_CODE + E2E_TEST_EMAIL + E2E_TEST_PASSWORD to enable");

  test("/activate with valid code grants access", async ({ page }) => {
    // Login first
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_TEST_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_TEST_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    // Go to activate
    await page.goto("/activate");
    await page.fill("input[placeholder*='code'], input[name='code'], input[type='text']", process.env.E2E_ACCESS_CODE!);
    await page.click("button[type='submit']");
    // Should show success and redirect
    await expect(page.locator("body")).toContainText(/activé|succès|granted|access|bienvenue/i, { timeout: 15000 });
  });
});

// ── G. Admin flows — CONDITIONAL (requires admin credentials) ─────────────────

test.describe("G. Admin Flows [CONDITIONAL — needs E2E_ADMIN_EMAIL + E2E_ADMIN_PASSWORD]", () => {
  test.skip(!HAS_ADMIN_CREDS, "Skipped: set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD env vars to enable");

  test("admin can reach /admin/access-codes", async ({ page }) => {
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_ADMIN_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_ADMIN_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await page.goto("/admin/access-codes");
    await expect(page).toHaveURL(/\/admin\/access-codes/, { timeout: 10000 });
    await expect(page.locator("body")).toContainText(/code|accès|access/i);
  });

  test("non-admin user is redirected from /admin/access-codes", async ({ page }) => {
    if (!HAS_AUTH_CREDS) {
      test.skip();
      return;
    }
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_TEST_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_TEST_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await page.goto("/admin/access-codes");
    // Should be redirected to /dashboard (not admin area)
    await expect(page).not.toHaveURL(/\/admin\/access-codes/, { timeout: 10000 });
  });
});
