# RAW STATE GAPS — Cyber Serenity / SENTINEL EDGE
**Generated:** 2026-03-12 | **Method:** Direct code inspection
**Format:** Each gap has a title, severity, proof, and concrete impact.

---

## A. CLAIMED BUT NOT FOUND

These are things previous summaries stated as "done" or "operational" that the code reveals as incomplete or not wired.

---

### GAP-A1: Checkout URLs not configured anywhere
- **Severity:** CRITICAL
- **Proof:** `.env` does not contain `VITE_STARTER_CHECKOUT_URL`, `VITE_PRO_CHECKOUT_URL`, or `VITE_ENTERPRISE_CHECKOUT_URL`. `revenue-links.ts` reads these env vars — they return `null`. `commercial_config` table exists in DB but is empty (no row can exist without admin action in UI).
- **Impact:** The Pricing page CTA (`/pricing`) does NOT call `openBookingOrFallback`. It calls `Link to="/auth"` directly. Zero checkout path exists for a prospect visiting `/pricing` right now.

---

### GAP-A2: Booking URL not configured anywhere
- **Severity:** CRITICAL
- **Proof:** `.env` does not contain `VITE_BOOKING_URL`. `getBookingUrl()` returns `null`. `openBookingOrFallback()` always calls the fallback (opens DemoRequestDialog).
- **Impact:** Every CTA labeled "Demander une démo" or "Prendre rendez-vous" falls back to the lead form. No direct booking is possible until `VITE_BOOKING_URL` or `commercial_config.booking_url` is set.

---

### GAP-A3: Report Studio is permanently disabled without VITE_CORE_API_URL
- **Severity:** CRITICAL
- **Proof:** `ReportStudio.tsx` line 308: `disabled={!backendConfigured || ...}`. `isExternalBackendConfigured()` returns `false` when `VITE_CORE_API_URL` is absent. Both "Générer rapport DG/PDG" and "Générer rapport DSI" buttons are disabled.
- **Impact:** Cannot demonstrate the DG/PDG or DSI report generation to a prospect — the core product promise — without a deployed external backend.

---

### GAP-A4: Two disconnected report generation pipelines
- **Severity:** MAJOR
- **Proof:** `generate-reports` Supabase edge function exists and is called by `src/hooks/useReports.ts` → used by `/reports` page. `api-client.ts` `generateExecutiveReport/generateTechnicalReport` target `VITE_CORE_API_URL/v1/reports/*` → used by ReportStudio only.
- **Impact:** A report generated via `/reports` page (Supabase EF + Gemini) does not appear in Report Studio. A report requested via Report Studio requires an external backend that doesn't exist. These two paths never converge.

---

### GAP-A5: api-client createToolRun / uploadToolRunArtifact wrappers are unused
- **Severity:** MINOR
- **Proof:** `useTools.ts` hook (which powers the UI) calls Supabase edge functions directly via `fetch(${VITE_SUPABASE_URL}/functions/v1/upload-tool-run-artifact)` — NOT through `api-client.createToolRun` or `api-client.uploadToolRunArtifact`. The api-client wrappers target `VITE_CORE_API_URL/v1/tool-runs`.
- **Impact:** Dead code. Maintenance confusion. If dev tries to use api-client for tool runs, it will fail.

---

### GAP-A6: verify-evidence-chain has no UI trigger
- **Severity:** MINOR
- **Proof:** `supabase/functions/verify-evidence-chain/` exists. `api-client.ts` has `verifyEvidenceChain()`. No page or component calls `verifyEvidenceChain()`. The Evidence page (`src/pages/Evidence.tsx`) exists but was not audited in detail — likely does not call this.
- **Impact:** The "tamper-proof evidence chain" feature cannot be demonstrated or verified from the UI.

---

### GAP-A7: Pricing.tsx CTA not updated to use openBookingOrFallback
- **Severity:** MAJOR
- **Proof:** `src/pages/Pricing.tsx` lines 191–213. When user is not logged in AND `VITE_STARTER_CHECKOUT_URL` is not set, the button renders as `Link to="/auth"` (signup). No `openBookingOrFallback()` call. No `trackEvent()` call on the main CTA.
- **Impact:** A prospect on `/pricing` who wants to buy clicks "Se connecter" and is taken to a signup form — not to booking or checkout. Conversion path is broken for this entry point. Landing's `PricingSection.tsx` was updated correctly (uses `openBookingOrFallback`) but the standalone `/pricing` page was not.

---

### GAP-A8: LOVABLE_API_KEY status is asserted as "OK" hardcoded in AdminReadiness
- **Severity:** MINOR
- **Proof:** `AdminReadiness.tsx` line 175: `status: 'ok'` for "IA moteur interne (Lovable API)" with detail `"LOVABLE_API_KEY présent — prêt à l'emploi"`. This is a hardcoded assertion — the frontend cannot read server-side secrets to verify this is actually set. If LOVABLE_API_KEY is missing, edge functions fail silently and readiness still shows OK.
- **Impact:** False confidence in readiness dashboard.

---

### GAP-A9: VITE_AI_GATEWAY_URL referenced but never documented
- **Severity:** MINOR
- **Proof:** `api-client.ts` line 12: `const AI_GATEWAY_URL = import.meta.env.VITE_AI_GATEWAY_URL`. Not in `.env`, not in README, not in AdminReadiness checks.
- **Impact:** Silent confusion for any developer who deploys and wonders why `generateExecutiveReport` targets an unexpected URL.

---

## B. PARTIALLY BUILT

These features exist in code but are not fully wired or not actually usable end-to-end.

---

### GAP-B1: Commercial config DB path not triggered by anything on first load
- **Severity:** MAJOR
- **Proof:** `useCommercialConfig.ts` correctly reads from `commercial_config` DB table. But the table is empty unless an admin visits `/settings/revenue` and manually saves data. The hook falls back to env vars (also empty). So `commercial.bookingUrl` is `null` for all new deployments.
- **Impact:** Every commercial decision (booking vs form, checkout vs auth) falls to the worst path until manual admin action.

---

### GAP-B2: Demo page CTA "Démarrer gratuitement" goes to /auth, not checkout
- **Severity:** MAJOR
- **Proof:** `Demo.tsx` line 191: `onClick={() => navigate('/auth')}`. `openBookingOrFallback` is imported (line 35) but not used on the demo CTA.
- **Impact:** After seeing the demo, a hot prospect clicks "Démarrer gratuitement" and is sent to a login/signup screen — not to booking or checkout. Incorrect conversion path.

---

### GAP-B3: Conversion analytics only work if events are actually being tracked
- **Severity:** MAJOR
- **Proof:** `tracking.ts` inserts into `conversion_events` silently. `trackEvent` is called in `HeroSection`, `DemoRequestDialog`, `PricingSection`. NOT called in `Pricing.tsx` standalone page main CTA. NOT called in `Demo.tsx` main CTA. `AdminReadiness` reads conversion_events and shows analytics — but if tracking is not firing, numbers stay at 0 and the "OK" status still shows.
- **Impact:** Analytics are incomplete. Pricing page and Demo page main CTAs are untracked.

---

### GAP-B4: tools_catalog table depends on manual DB seeding
- **Severity:** MAJOR
- **Proof:** `src/pages/Tools.tsx` queries `tools_catalog`. No migration or seed file for `tools_catalog` content was found in the inspected migrations. If the table is empty, the Tools page shows nothing and users cannot create runs.
- **Impact:** The entire import-first flow is blocked if tools_catalog has no rows.

---

### GAP-B5: AdminReadiness some items hardcoded OK
- **Severity:** MINOR
- **Proof:** `AdminReadiness.tsx` line 215: Edge function submit-sales-lead status is hardcoded `'ok'` regardless of whether it's actually deployed and responding. Same for "IA moteur interne" (line 175), "Mode Démo" (line 186), "Landing Page" (line 241), "Navigation principale" (line 253). No actual health check is performed.
- **Impact:** Readiness dashboard provides false confidence. A broken deploy still shows green on these items.

---

### GAP-B6: SLA logic in AdminLeads based on lead age, not on admin action
- **Severity:** MINOR
- **Proof:** `AdminLeads.tsx` `getSLA()` function uses `lead.created_at` and `lead.last_activity_at`. The `last_activity_at` field is updated only by `updateLead.mutate()` call in the UI. If admin views lead but doesn't update it via the CRM, SLA keeps escalating.
- **Impact:** SLA indicator may show false "critical" on leads the admin has already reviewed verbally but not updated in DB. Minor operational friction.

---

### GAP-B7: Reports page uses Supabase generate-reports edge fn, but no UI shows the link to Report Studio
- **Severity:** MINOR
- **Proof:** `/reports` page uses `useReports.ts` → calls `generate-reports` EF. `ReportStudio` is a separate UI. A user going through the normal flow (runs → reports) never lands in ReportStudio and vice versa. There's no navigation bridge.
- **Impact:** Two report UIs with no cross-reference. Users may not discover ReportStudio. Reports generated via EF don't surface in ReportStudio UI.

---

## C. REAL BLOCKERS

These directly prevent selling, demonstrating, converting, or operating the platform.

---

### BLOCKER-1: Cannot demonstrate the core product promise (AI report generation)
- **Severity:** CRITICAL
- **File:** `src/pages/ReportStudio.tsx`, `src/lib/api-client.ts`
- **Proof:** `disabled={!backendConfigured || !toolRunId}` — buttons always disabled. `VITE_CORE_API_URL` not in `.env`.
- **Concrete impact:** You cannot show a prospect a generated DG/PDG or DSI report from the ReportStudio UI. The main product differentiator is not demonstrable.
- **Fix required:** Deploy an external backend at some URL and set `VITE_CORE_API_URL`, OR wire ReportStudio to use the `generate-reports` Supabase edge function instead.

---

### BLOCKER-2: Cannot sell — no checkout path exists
- **Severity:** CRITICAL
- **Files:** `src/pages/Pricing.tsx`, `src/components/landing/PricingSection.tsx`, `.env`
- **Proof:** `VITE_STARTER_CHECKOUT_URL` is `null`. `Pricing.tsx` main CTA links to `/auth`. `PricingSection.tsx` fallback also goes to `/auth` when checkout absent.
- **Concrete impact:** A motivated buyer clicking the pricing CTA is taken to a signup screen, not a payment flow. No transaction is possible.
- **Fix required:** Configure `VITE_STARTER_CHECKOUT_URL` (Stripe, LemonSqueezy, etc.) OR populate `commercial_config.starter_checkout_url` via `/settings/revenue`. AND fix `Pricing.tsx` CTA to use `openBookingOrFallback`.

---

### BLOCKER-3: Cannot book a demo — no booking URL
- **Severity:** CRITICAL
- **Files:** `src/lib/revenue-links.ts`, `src/components/ui/DemoRequestDialog.tsx`, `.env`
- **Proof:** `getBookingUrl()` returns `null`. All booking CTAs fall through to DemoRequestDialog. The DemoRequestDialog post-submit "Prendre rendez-vous" button is only shown when `bookingUrl` is non-null.
- **Concrete impact:** Prospects who submit the form see a next-step screen WITHOUT the primary booking CTA (it's conditionally hidden). The entire direct-booking tunnel is dead.
- **Fix required:** Set `VITE_BOOKING_URL` (Calendly, Cal.com, etc.) OR set `commercial_config.booking_url` via `/settings/revenue`.

---

### BLOCKER-4: Cannot onboard a customer — tools_catalog dependency unknown
- **Severity:** MAJOR
- **Files:** `src/pages/Tools.tsx`, `src/pages/Runs.tsx`, `supabase/migrations/`
- **Proof:** No migration seed file for `tools_catalog` found in inspection. If DB has no rows, Tools page shows nothing, user cannot create a run, the entire import flow is dead.
- **Concrete impact:** A new paying customer cannot use the platform until tools_catalog is populated.
- **Fix required:** Verify tools_catalog has rows in production DB. If not, add a migration with seed data.

---

### BLOCKER-5: Demo page exits to wrong conversion path
- **Severity:** MAJOR
- **Files:** `src/pages/Demo.tsx` line 191
- **Proof:** `onClick={() => navigate('/auth')}` on the "Démarrer gratuitement" button. `openBookingOrFallback` is imported but not used.
- **Concrete impact:** A prospect who just watched the full interactive demo and is ready to buy gets sent to a signup form (free tier), not to a booking or checkout. Lost intent.
- **Fix required:** Replace `navigate('/auth')` with `openBookingOrFallback(() => setDemoContactOpen(true))` or direct to checkout.

---

### BLOCKER-6: No real lead exists to manage until someone submits the form
- **Severity:** MAJOR (operational)
- **Files:** `supabase/functions/submit-sales-lead/index.ts`, `src/pages/AdminLeads.tsx`
- **Proof:** `sales_leads` table exists. `submit-sales-lead` edge function is deployed. But all of the above is infrastructure. AdminLeads page will show "Aucun lead trouvé" with zero rows until organic traffic submits the form.
- **Concrete impact:** The CRM is operationally empty. The Revenue Readiness "Leads reçus" item shows `warn` state. Until a real prospect submits the form, there is nothing to manage.
- **Fix required:** Drive traffic to landing, or manually insert test leads to validate the full pipeline.

---

## SUMMARY COUNTS

| Category | Count |
|----------|-------|
| CLAIMED BUT NOT FOUND (A) | 9 |
| PARTIALLY BUILT (B) | 7 |
| REAL BLOCKERS (C) | 6 |
| **Total gaps** | **22** |

**Critical blockers (CRITICAL severity):** 5 (A1, A2, A3, BLOCKER-1, BLOCKER-2, BLOCKER-3)
**The 3 actions that unlock immediate revenue:**
1. Set `VITE_BOOKING_URL` (or `/settings/revenue`) → enables direct demo booking
2. Set `VITE_STARTER_CHECKOUT_URL` (or `/settings/revenue`) → enables payment
3. Fix `Demo.tsx` CTA to use `openBookingOrFallback` → closes the hottest conversion point
