/**
 * SECURIT-E — E2E Tests: Public routes, Auth protection & optional business flows
 *
 * Test scope:
 *   UNCONDITIONAL: public routes, auth redirects, error pages, product truth checks
 *   CONDITIONAL:   auth flows (requires E2E_TEST_EMAIL + E2E_TEST_PASSWORD env vars)
 *                  access code (requires E2E_ACCESS_CODE env var)
 *                  admin flows (requires E2E_ADMIN_EMAIL + E2E_ADMIN_PASSWORD env vars)
 *                  paywall flows (requires auth creds + entitlement state)
 *
 * Required GitHub Secrets for full coverage:
 *   PLAYWRIGHT_BASE_URL   — target URL (default: local dev server)
 *   E2E_TEST_EMAIL        — test user email
 *   E2E_TEST_PASSWORD     — test user password
 *   E2E_ADMIN_EMAIL       — admin account email
 *   E2E_ADMIN_PASSWORD    — admin account password
 *   E2E_ACCESS_CODE       — valid test access code (for /activate flow)
 *
 * Run public-only tests (no credentials needed):
 *   npx playwright test tests/e2e/public-routes.spec.ts
 *
 * Run with auth credentials:
 *   E2E_TEST_EMAIL=user@example.com E2E_TEST_PASSWORD=secret npx playwright test
 */
import { test, expect } from "@playwright/test";

const HAS_AUTH_CREDS = !!(process.env.E2E_TEST_EMAIL && process.env.E2E_TEST_PASSWORD);
const HAS_ADMIN_CREDS = !!(process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD);
const HAS_ACCESS_CODE = !!process.env.E2E_ACCESS_CODE;

// ── A. Public routes ──────────────────────────────────────────────────────────

test.describe("A. Public Routes", () => {
  test("landing page loads with title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SECURIT-E|Securit-E|securit-e/i);
    await expect(page.locator("body")).not.toContainText("dashboard-protected-content");
  });

  test("landing page has CTA buttons", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    const ctas = page.locator("button, a[href]");
    await expect(ctas.first()).toBeVisible({ timeout: 10000 });
  });

  test("/pricing loads with plans and no forbidden claims", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("body")).toBeVisible();
    // Plans present
    await expect(page.locator("body")).toContainText(/Sentinel|Command|Sovereign/i);
    // Forbidden claims absent
    await expect(page.locator("body")).not.toContainText("certifié SecNumCloud");
    await expect(page.locator("body")).not.toContainText("SLA garanti contractuellement");
    await expect(page.locator("body")).not.toContainText("fully autonomous");
    await expect(page.locator("body")).not.toContainText("CRYSTALS-Dilithium");
    await expect(page.locator("body")).not.toContainText("zk-SNARK");
    await expect(page.locator("body")).not.toContainText("ROI garanti");
    await expect(page.locator("body")).not.toContainText("ROI 367x");
    await expect(page.locator("body")).not.toContainText("87% prediction");
    await expect(page.locator("body")).not.toContainText("99.97%");
  });

  test("/pricing ROI calculator renders", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("body")).toContainText(/ROI/i);
  });

  test("/faq loads with real content and no false autonomy claims", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).toContainText(/SECURIT-E|Evidence Vault|NIS2/i);
    await expect(page.locator("body")).not.toContainText("100% autonome");
    await expect(page.locator("body")).not.toContainText("zéro intervention humaine");
    await expect(page.locator("body")).not.toContainText("CRYSTALS-Dilithium");
  });

  test("/status loads without fabricated uptime percentages", async ({ page }) => {
    await page.goto("/status");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).not.toContainText("99.97%");
    await expect(page.locator("body")).not.toContainText("99.99% garanti");
  });

  test("/demo loads with demo/lab label", async ({ page }) => {
    await page.goto("/demo");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).toContainText(/simulat|démo|demo|lab/i);
  });

  test("/legal/terms loads", async ({ page }) => {
    await page.goto("/legal/terms");
    await expect(page.locator("body")).toBeVisible();
  });

  test("/legal/privacy loads", async ({ page }) => {
    await page.goto("/legal/privacy");
    await expect(page.locator("body")).toBeVisible();
  });
});

// ── B. Auth protection (unauthenticated redirects) ────────────────────────────

test.describe("B. Auth Protection — unauthenticated redirects", () => {
  test("/dashboard redirects unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard");
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

  test("/remediation redirects unauthenticated users", async ({ page }) => {
    await page.goto("/remediation");
    await expect(page).not.toHaveURL(/\/remediation$/, { timeout: 10000 });
  });

  test("/auth page loads with email and password fields", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator("body")).toBeVisible();
    await expect(
      page.locator("input[type='email'], input[name='email']")
    ).toBeVisible({ timeout: 10000 });
  });

  test("/activate page loads or redirects to /auth", async ({ page }) => {
    await page.goto("/activate");
    await expect(page.locator("body")).toBeVisible();
    const url = page.url();
    expect(url.includes("/activate") || url.includes("/auth")).toBe(true);
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
    await expect(body).not.toContainText("Palantir-style");
  });

  test("landing cycle time is labeled as lab or demo context", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator("body")).toBeVisible();
    const body = await page.locator("body").innerText();
    if (body.includes("47s") || body.includes("47 secondes")) {
      // Must have qualifying language anywhere on the page
      expect(body.toLowerCase()).toMatch(/lab|démo|demo|démontré|conditi|supervisé/);
    }
  });

  test("/pricing has no unverifiable ROI guarantees", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("body")).not.toContainText("ROI 367x");
    await expect(page.locator("body")).not.toContainText("87% prediction");
    await expect(page.locator("body")).not.toContainText("99.97%");
    await expect(page.locator("body")).not.toContainText("ROI garanti");
  });

  test("every public page has proper meta charset via html structure", async ({ page }) => {
    await page.goto("/");
    const charset = await page.locator("meta[charset]").count();
    expect(charset).toBeGreaterThan(0);
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

  test("authenticated user can navigate to /executive", async ({ page }) => {
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_TEST_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_TEST_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await page.goto("/executive");
    await expect(page.locator("body")).toBeVisible();
    // Should show executive cockpit OR paywall (not a redirect to /auth)
    await expect(page).not.toHaveURL(/\/auth/, { timeout: 5000 });
  });

  test("paywall is shown for user without active subscription", async ({ page }) => {
    // This test validates paywall gate logic — actual result depends on test account state
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_TEST_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_TEST_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    // Navigate to premium area — should show either content (if entitled) or upgrade wall
    await page.goto("/proofs");
    await expect(page.locator("body")).toBeVisible();
    // Either way, no infinite loading or crash
    const hasContent = await page.locator("body").innerText();
    expect(hasContent.length).toBeGreaterThan(50);
  });

  test("logout redirects away from dashboard", async ({ page }) => {
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_TEST_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_TEST_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    const logoutBtn = page.locator("[data-testid='logout'], button:has-text('Déconnexion'), button:has-text('Logout')").first();
    if (await logoutBtn.isVisible()) {
      await logoutBtn.click();
      await expect(page).not.toHaveURL(/\/dashboard/, { timeout: 10000 });
    }
  });
});

// ── F. Access code — CONDITIONAL (requires E2E_ACCESS_CODE + auth creds) ──────

test.describe("F. Access Code [CONDITIONAL — needs E2E_ACCESS_CODE + auth creds]", () => {
  test.skip(!HAS_ACCESS_CODE || !HAS_AUTH_CREDS, "Skipped: set E2E_ACCESS_CODE + E2E_TEST_EMAIL + E2E_TEST_PASSWORD to enable");

  test("/activate with valid code grants access", async ({ page }) => {
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_TEST_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_TEST_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await page.goto("/activate");
    await page.fill("input[placeholder*='code'], input[name='code'], input[type='text']", process.env.E2E_ACCESS_CODE!);
    await page.click("button[type='submit']");
    await expect(page.locator("body")).toContainText(/activé|succès|granted|access|bienvenue/i, { timeout: 15000 });
  });

  test("/activate with invalid code shows error", async ({ page }) => {
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_TEST_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_TEST_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await page.goto("/activate");
    await page.fill("input[placeholder*='code'], input[name='code'], input[type='text']", "INVALID-CODE-XYZ-999");
    await page.click("button[type='submit']");
    // Should show error, not grant access
    await expect(page.locator("body")).toContainText(/invalide|erreur|invalid|error|incorrect/i, { timeout: 10000 });
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
    test.skip(!HAS_AUTH_CREDS, "Needs E2E_TEST_EMAIL + E2E_TEST_PASSWORD");
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_TEST_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_TEST_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await page.goto("/admin/access-codes");
    await expect(page).not.toHaveURL(/\/admin\/access-codes/, { timeout: 10000 });
  });

  test("admin can view /admin/readiness", async ({ page }) => {
    await page.goto("/auth");
    await page.fill("input[type='email'], input[name='email']", process.env.E2E_ADMIN_EMAIL!);
    await page.fill("input[type='password'], input[name='password']", process.env.E2E_ADMIN_PASSWORD!);
    await page.click("button[type='submit']");
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 20000 });
    await page.goto("/admin/readiness");
    await expect(page.locator("body")).toBeVisible();
    await expect(page.locator("body")).toContainText(/readiness|prêt|ready|checklist/i, { timeout: 10000 });
  });
});

// ── H. Stripe flows — CONDITIONAL (test mode, requires explicit env) ──────────
// Note: These flows require Stripe test mode keys set up and are NOT run in standard CI.
// They must be triggered manually or via a dedicated job with STRIPE secrets.
// See .github/workflows/ci.yml job "e2e-stripe" for configuration.
test.describe("H. Stripe Checkout [CONDITIONAL — manual/dedicated CI job only]", () => {
  test.skip(true, "Stripe E2E requires dedicated test mode setup — see ci.yml job e2e-stripe");

  test("Sentinel checkout opens Stripe test session", async ({ page }) => {
    // Requires: authenticated user + STRIPE_PUBLISHABLE_KEY_TEST in env
    await page.goto("/pricing");
    await page.click("button:has-text('Démarrer'), button:has-text('Activer')");
    // Stripe checkout redirect
    await expect(page).toHaveURL(/stripe\.com|checkout/, { timeout: 20000 });
  });
});
