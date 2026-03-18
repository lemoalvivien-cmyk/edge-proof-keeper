/**
 * SECURIT-E — E2E Tests: Public routes & Auth flows
 * These tests verify routes accessible without login, and auth entry points.
 * Full auth flow tests require a live test account (see tests/e2e/README.md).
 */
import { test, expect } from "@playwright/test";

// ── Public routes ────────────────────────────────────────────────────────────

test.describe("Public Routes", () => {
  test("landing page loads", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/SECURIT-E|Securit-E|securit-e/i);
    // Landing must not expose dashboard content
    await expect(page.locator("body")).not.toContainText("dashboard-protected-content");
  });

  test("/pricing loads", async ({ page }) => {
    await page.goto("/pricing");
    await expect(page.locator("body")).toBeVisible();
    // Must not contain forbidden claims
    await expect(page.locator("body")).not.toContainText("certifié SecNumCloud");
    await expect(page.locator("body")).not.toContainText("SLA garanti contractuellement");
    await expect(page.locator("body")).not.toContainText("fully autonomous");
  });

  test("/faq loads", async ({ page }) => {
    await page.goto("/faq");
    await expect(page.locator("body")).toBeVisible();
  });

  test("/status loads", async ({ page }) => {
    await page.goto("/status");
    await expect(page.locator("body")).toBeVisible();
  });
});

// ── Auth protection ───────────────────────────────────────────────────────────

test.describe("Auth Protection", () => {
  test("/dashboard redirects unauthenticated users", async ({ page }) => {
    await page.goto("/dashboard");
    // Should end up at /auth or / — not stay at /dashboard with full data
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

  test("/auth page loads", async ({ page }) => {
    await page.goto("/auth");
    await expect(page.locator("body")).toBeVisible();
    // Auth page must have a form
    await expect(page.locator("input[type='email'], input[name='email']")).toBeVisible({ timeout: 10000 });
  });

  test("/activate page loads", async ({ page }) => {
    await page.goto("/activate");
    await expect(page.locator("body")).toBeVisible();
  });
});

// ── 4xx handling ─────────────────────────────────────────────────────────────

test.describe("Error Handling", () => {
  test("404 page shows not found", async ({ page }) => {
    await page.goto("/this-route-does-not-exist-xyz-999");
    await expect(page.locator("body")).toBeVisible();
    // Should show some form of error / not-found content
    const bodyText = await page.locator("body").innerText();
    expect(bodyText.length).toBeGreaterThan(10);
  });
});
