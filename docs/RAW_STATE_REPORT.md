# RAW STATE REPORT — Cyber Serenity / SENTINEL EDGE
**Generated:** 2026-03-12 | **Method:** Direct code inspection, no inference
**Auditor rule:** PRESENT = found in code. PARTIAL = exists but incomplete. ABSENT = not found.

---

## SECTION 1 — FILE INVENTORY

### A. src/pages (34 files)
```
AdminLeads.tsx        AdminReadiness.tsx    ApiTest.tsx
Assets.tsx            Auth.tsx              Compliance.tsx
Dashboard.tsx         DashboardTechnical.tsx Demo.tsx
Documents.tsx         Evidence.tsx          Findings.tsx
GoNoGo.tsx            Index.tsx             Landing.tsx
NotFound.tsx          Onboarding.tsx        PlansAddons.tsx
Pricing.tsx           Proofs.tsx            ReportStudio.tsx
Reports.tsx           RevenueSettings.tsx   Risks.tsx
RunDetail.tsx         Runs.tsx              Scans.tsx
Settings.tsx          TaskDetail.tsx        Tasks.tsx
ToolDetail.tsx        Tools.tsx
legal/ (4 files)      offres/ (6 files)
```

### B. src/components
```
auth/       findings/    landing/    layout/
remediation/ reports/   tools/      ui/
NavLink.tsx
```

### C. src/lib
```
api-client.ts       demo-data.ts      revenue-links.ts
sanitize.ts         tracking.ts       utils.ts
validation.ts
```

### D. supabase/functions (15 directories)
```
_shared/                    analyze-signal-with-gemini/
correlate-risks/            create-tool-run/
export-proof-pack/          generate-remediation-plan/
generate-reports/           ingest-signals/
log-evidence/               normalize-tool-run/
platform-health/            submit-sales-lead/
upload-authorization/       upload-document/
upload-tool-run-artifact/   verify-evidence-chain/
```

### E. supabase/migrations (22 files)
Range: 20260104 → 20260311. All UUID-named .sql files.

---

## SECTION 2 — CRITICAL FILES STATUS

| File | Status | Path | Role | Key Deps |
|------|--------|------|------|----------|
| App.tsx | PRESENT | src/App.tsx | Router root, 35+ routes, solo mode wrapper | react-router-dom, AuthContext, ProtectedRoute |
| AppSidebar.tsx | PRESENT | src/components/layout/AppSidebar.tsx | Sidebar nav, role-gated sections | useAuth, lucide-react, sidebar ui |
| api-client.ts | PRESENT | src/lib/api-client.ts | External API + Supabase edge function calls | VITE_CORE_API_URL, VITE_AI_GATEWAY_URL, supabase |
| ReportStudio.tsx | PRESENT | src/pages/ReportStudio.tsx | DG/PDG + DSI report generation UI | VITE_CORE_API_URL (required), api-client |
| ApiTest.tsx | PRESENT | src/pages/ApiTest.tsx | Manual health check of external backend | api-client.getHealth(), VITE_CORE_API_URL |
| Demo.tsx | PRESENT | src/pages/Demo.tsx | Interactive demo with ACME Corp fake data | demo-data.ts, revenue-links, tracking, DemoRequestDialog |
| AdminReadiness.tsx | PRESENT | src/pages/AdminReadiness.tsx | Platform + revenue readiness dashboard | api-client, supabase, useCommercialConfig |
| AdminLeads.tsx | PRESENT | src/pages/AdminLeads.tsx | CRM pipeline for sales leads | supabase sales_leads, useCommercialConfig |
| Pricing.tsx | PRESENT | src/pages/Pricing.tsx | Public pricing page | LandingNav, FooterSection, useAuth |
| Runs.tsx | PRESENT | src/pages/Runs.tsx | Import runs list with empty state | useToolRuns hook, supabase tool_runs |
| RunDetail.tsx | PRESENT | src/pages/RunDetail.tsx | Single run detail | supabase |
| Dashboard.tsx | PRESENT | src/pages/Dashboard.tsx | Direction dashboard — findings, compliance, assets | useFindings, useRemediation, supabase |
| DashboardTechnical.tsx | PRESENT | src/pages/DashboardTechnical.tsx | Technical dashboard | supabase, multiple hooks |
| revenue-links.ts | PRESENT | src/lib/revenue-links.ts | Env var reader for booking/checkout URLs | VITE_BOOKING_URL, VITE_*_CHECKOUT_URL |
| tracking.ts | PRESENT | src/lib/tracking.ts | Conversion event inserter (fail-silent) | supabase conversion_events |
| DemoRequestDialog.tsx | PRESENT | src/components/ui/DemoRequestDialog.tsx | Lead capture form + post-submit screen | submit-sales-lead edge function |
| RevenueSettings.tsx | PRESENT | src/pages/RevenueSettings.tsx | Admin DB config for commercial URLs | supabase commercial_config, useAuth |
| useCommercialConfig.ts | PRESENT | src/hooks/useCommercialConfig.ts | DB-first config hook | supabase commercial_config, revenue-links |
| HeroSection.tsx | PRESENT | src/components/landing/HeroSection.tsx | Hero with 3 CTAs | tracking, revenue-links, DemoRequestDialog |
| PricingSection.tsx | PRESENT | src/components/landing/PricingSection.tsx | Landing pricing card + CTAs | revenue-links, tracking, DemoRequestDialog |

---

## SECTION 3 — ALL ROUTES (App.tsx)

| Path | Component | Protected | Required Role | Status | Note |
|------|-----------|-----------|---------------|--------|------|
| / | Landing | No | None | PRESENT | Full landing page |
| /pricing | Pricing | No | None | PRESENT | Public pricing |
| /demo | Demo | No | None | PRESENT | Interactive demo, fake data |
| /auth | Auth (or redirect if SOLO_MODE) | No | None | PRESENT | Login/register |
| /scopeguard | Navigate → /tools | No | None | PRESENT | Compat redirect |
| /authorizations | Navigate → /tools | No | None | PRESENT | Compat redirect |
| /authorizations/* | Navigate → /tools | No | None | PRESENT | Compat redirect |
| /offres/imports-hub | ImportsHub | No | None | PRESENT | Marketing page |
| /offres/devsecops-pack | DevsecOpsPack | No | None | PRESENT | Marketing page |
| /offres/audit-pack-cabinets | AuditPackCabinets | No | None | PRESENT | Marketing page |
| /offres/remediation-patch-bridge | RemediationPatchBridge | No | None | PRESENT | Marketing page |
| /offres/continuous-governance | ContinuousGovernance | No | None | PRESENT | Marketing page |
| /offres/easm-osint-signals | EasmOsintSignals | No | None | PRESENT | Marketing page |
| /legal/terms | Terms | No | None | PRESENT | Legal |
| /legal/privacy | Privacy | No | None | PRESENT | Legal |
| /legal/authorized-use | AuthorizedUse | No | None | PRESENT | Legal |
| /legal/disclaimer | Disclaimer | No | None | PRESENT | Legal |
| /onboarding | Onboarding | Yes | None | PRESENT | Post-signup setup |
| /settings | Settings | Yes | admin | PRESENT | Org settings |
| /plans | PlansAddons | Yes | admin | PRESENT | Plan management |
| /admin-readiness | AdminReadiness | Yes | admin | PRESENT | Platform readiness |
| /admin/leads | AdminLeads | Yes | admin | PRESENT | CRM pipeline |
| /settings/revenue | RevenueSettings | Yes | admin | PRESENT | Commercial config |
| /dashboard | Dashboard | Yes | None | PRESENT | Direction dashboard |
| /dashboard/technical | DashboardTechnical | Yes | None | PRESENT | Technical dashboard |
| /assets | Assets | Yes | None | PRESENT | Asset inventory |
| /scans | Scans | Yes | None | PRESENT | Legacy scans page |
| /documents | Documents | Yes | None | PRESENT | Document management |
| /compliance | Compliance | Yes | None | PRESENT | GDPR/NIS2 tracking |
| /evidence | Evidence | Yes | None | PRESENT | Evidence log |
| /tools | Tools | Yes | None | PRESENT | Tools catalog |
| /tools/:slug | ToolDetail | Yes | None | PRESENT | Tool detail + run creation |
| /runs | Runs | Yes | None | PRESENT | Import runs list |
| /runs/:id | RunDetail | Yes | None | PRESENT | Run detail |
| /reports | Reports | Yes | None | PRESENT | Reports list |
| /report-studio | ReportStudio | Yes | None | PRESENT | AI report generation (needs VITE_CORE_API_URL) |
| /tasks | Tasks | Yes | None | PRESENT | Remediation tasks |
| /tasks/:id | TaskDetail | Yes | None | PRESENT | Task detail |
| /go-no-go | GoNoGo | Yes | admin | PRESENT | Go/No-Go decision |
| /proofs | Proofs | Yes | None | PRESENT | Proof packs |
| /risks | Risks | Yes | None | PRESENT | Risk register |
| /findings | Findings | Yes | None | PRESENT | Findings table |
| /api-test | ApiTest | Yes | None | PRESENT | External API health test |
| * | NotFound | No | None | PRESENT | 404 |

**Total routes: 43**

---

## SECTION 4 — SIDEBAR / NAVIGATION

### AppSidebar.tsx — Authenticated navigation

**Section: Tableaux de bord** (always visible)
| Label | Route | Role condition | Status |
|-------|-------|----------------|--------|
| Vue Direction | /dashboard | None | PRESENT |
| Vue Technique | /dashboard/technical | None | PRESENT |
| Risques | /risks | None | PRESENT |
| Conformité | /compliance | None | PRESENT |

**Section: Opérations** (hidden for `isAuditor`)
| Label | Route | Role condition | Status |
|-------|-------|----------------|--------|
| Actifs | /assets | !isAuditor | PRESENT |
| Documents | /documents | !isAuditor | PRESENT |
| Outils | /tools | !isAuditor | PRESENT |
| Imports | /runs | !isAuditor | PRESENT |
| Remédiation | /tasks | !isAuditor | PRESENT |

**Section: Audit** (always visible)
| Label | Route | Role condition | Status |
|-------|-------|----------------|--------|
| Rapports | /reports | None | PRESENT |
| Report Studio | /report-studio | None | PRESENT |
| Journal de Preuves | /evidence | None | PRESENT |
| Proof Packs | /proofs | None | PRESENT |

**Section: Administration** (isAdmin only)
| Label | Route | Role condition | Status |
|-------|-------|----------------|--------|
| Paramètres | /settings | isAdmin | PRESENT |
| Plans & Add-ons | /plans | isAdmin | PRESENT |
| Revenue Settings | /settings/revenue | isAdmin | PRESENT |
| GO/NO-GO | /go-no-go | isAdmin | PRESENT |
| Leads | /admin/leads | isAdmin | PRESENT |
| Admin Readiness | /admin-readiness | isAdmin | PRESENT |
| Test API | /api-test | isAdmin | PRESENT |

**Public navigation (LandingNav):** Landing, /pricing, /demo — No auth. DemoRequestDialog CTA present.

---

## SECTION 5 — API CLIENT FUNCTIONS (src/lib/api-client.ts)

### External backend functions (require VITE_CORE_API_URL)

| Function | Method | Endpoint | Payload | VITE_CORE_API_URL dep | Return type | Status |
|----------|--------|----------|---------|----------------------|-------------|--------|
| createToolRun | POST | /v1/tool-runs | CreateToolRunPayload | REQUIRED | CreateToolRunResult | PRESENT |
| uploadToolRunArtifact | POST | /v1/tool-runs/:id/artifact | FormData | REQUIRED | UploadArtifactResult | PRESENT |
| generateExecutiveReport | POST | /v1/reports/executive | {tool_run_id} | REQUIRED (AI_GATEWAY_URL fallback) | ExecutiveReportResult | PRESENT |
| generateTechnicalReport | POST | /v1/reports/technical | {tool_run_id} | REQUIRED (AI_GATEWAY_URL fallback) | TechnicalReportResult | PRESENT |
| verifyEvidenceChain | POST | /v1/evidence/verify-chain | {organization_id} | REQUIRED | VerifyChainResult | PRESENT |
| isExternalBackendConfigured | — | — | — | — | boolean | PRESENT |
| getHealth | GET | /health | — | REQUIRED | unknown | PRESENT |

### Supabase edge function wrappers

| Function | Edge Function | Payload | Return type | Status |
|----------|---------------|---------|-------------|--------|
| getPlatformHealth | platform-health | orgId? | PlatformHealthStatus | PRESENT |
| getSignals | Direct supabase query | orgId, options | Signal[] | PRESENT |
| getRisks | Direct supabase query | orgId, options | Risk[] | PRESENT |
| ingestSignals | ingest-signals | orgId, sourceId, signals | IngestSignalsResult | PRESENT |
| correlateRisks | correlate-risks | orgId | CorrelateRisksResult | PRESENT |
| analyzeSignalWithAI | analyze-signal-with-gemini | orgId, signalId | AnalyzeSignalResult | PRESENT |
| generateRemediationPlan | generate-remediation-plan | orgId, riskId | GenerateRemediationPlanResult | PRESENT |

**Incohérences détectées:**
- `createToolRun` and `uploadToolRunArtifact` target external `VITE_CORE_API_URL`, BUT the Supabase edge functions `create-tool-run` and `upload-tool-run-artifact` also exist. The frontend hooks (`useTools.ts`) call the Supabase edge functions directly — NOT the api-client wrappers. The api-client wrappers for tool runs are **effectively unused** by the UI.
- `verifyEvidenceChain` in api-client targets external backend, BUT a `verify-evidence-chain` Supabase edge function also exists. No UI page calls either.
- `VITE_AI_GATEWAY_URL` is read in api-client but not documented anywhere and not referenced in .env.

---

## SECTION 6 — PAGES STATUS

| Page | Status | File | What it really does | Backend dep | Env dep | Completeness | Main problem |
|------|--------|------|---------------------|-------------|---------|--------------|-------------|
| Landing | PRESENT | src/pages/Landing.tsx | 10+ section landing page, full funnel | None (public) | None | 90/100 | PricingSection CTA has no checkout if VITE_STARTER_CHECKOUT_URL absent |
| Pricing | PRESENT | src/pages/Pricing.tsx | Static pricing page, CTA goes to /auth | None | None | 75/100 | CTA goes to /auth — NOT to checkout. No openBookingOrFallback. No trackEvent on main CTA. |
| Demo | PRESENT | src/pages/Demo.tsx | Fake ACME Corp audit demo, 3 tabs, expandable findings | None (all static demo-data.ts) | None | 85/100 | CTA "Démarrer gratuitement" → /auth (no checkout). openBookingOrFallback present in file but not wired to main CTA. |
| ApiTest | PRESENT | src/pages/ApiTest.tsx | Calls getHealth() → VITE_CORE_API_URL/health | VITE_CORE_API_URL | VITE_CORE_API_URL | 100/100 | Purely diagnostic, correct. Always shows error if env not set. |
| ReportStudio | PRESENT | src/pages/ReportStudio.tsx | Generates exec+technical reports via external backend | VITE_CORE_API_URL | VITE_CORE_API_URL | 80/100 | 100% blocked without VITE_CORE_API_URL. Buttons are disabled. No Supabase fallback. |
| Dashboard | PRESENT | src/pages/Dashboard.tsx | Direction view — findings, compliance %, assets, tasks | supabase findings, control_mappings, assets, remediation_tasks | None | 85/100 | Risk score formula is trivial (100 - critical*5). No real signal data used. |
| DashboardTechnical | PRESENT | src/pages/DashboardTechnical.tsx | Technical view — signals, risks, remediation | supabase signals, risk_register, remediation_actions | None | 80/100 | Requires imported data to be non-empty to show value |
| Runs | PRESENT | src/pages/Runs.tsx | Import list with good empty state | supabase tool_runs | None | 90/100 | Good — empty state guides user, filters work |
| RunDetail | PRESENT | src/pages/RunDetail.tsx | Run detail + findings + report generation link | supabase tool_runs, findings | None | 80/100 | Report generation link → ReportStudio (which requires VITE_CORE_API_URL) |
| Tools | PRESENT | src/pages/Tools.tsx | Tools catalog, create run dialog | supabase tools_catalog, tool_runs | None | 85/100 | Requires tools_catalog to be populated in DB |
| ToolDetail | PRESENT | src/pages/ToolDetail.tsx | Tool detail + run creation + artifact upload | supabase, upload-tool-run-artifact edge fn | VITE_SUPABASE_URL | 80/100 | Upload calls Supabase edge fn directly (correct) |
| Reports | PRESENT | src/pages/Reports.tsx | Reports list | supabase reports | None | 80/100 | Empty if no tool_runs processed |
| AdminReadiness | PRESENT | src/pages/AdminReadiness.tsx | Platform + revenue readiness + conversion analytics | supabase sales_leads, conversion_events, platform-health EF | None | 85/100 | Revenue items marked 'ok' hardcoded for some items regardless of actual state |
| AdminLeads | PRESENT | src/pages/AdminLeads.tsx | CRM pipeline, SLA, owner, priority, booking | supabase sales_leads | None | 85/100 | Fully operational. SLA, filter, quick actions present. |

---

## SECTION 7 — SUPABASE TABLES

| Table | Status | Role | Multi-tenant | RLS |
|-------|--------|------|--------------|-----|
| organizations | PRESENT | Tenant root | Yes (is the tenant) | SELECT only (org members) |
| profiles | PRESENT | User profile, links to org | Yes (organization_id) | Own profile only |
| user_roles | PRESENT | RBAC — admin/auditor/user | Yes (organization_id) | Admins manage, users read |
| authorizations | PRESENT | Legal scan authorization | Yes (organization_id) | Org members CRU |
| assets | PRESENT | Asset inventory | Yes (organization_id) | Org members CRU |
| scans | PRESENT | Legacy scan records | Yes (organization_id) | Org members CR |
| documents | PRESENT | Document storage | Yes (organization_id) | Org members CR |
| evidence_log | PRESENT | Immutable audit chain | Yes (organization_id) | Read only (via edge fn insert) |
| compliance_controls | PRESENT | GDPR/NIS2 controls catalog | No (global) | Anyone authenticated can read |
| control_mappings | PRESENT | Org control status tracking | Yes (organization_id) | Org members CRU |
| secrets_vault | PRESENT | API key metadata (NOT values) | Yes (organization_id) | Admins only |
| tools_catalog | PRESENT | Available security tools | No (global) | Authenticated read only |
| tool_presets | PRESENT | Tool run presets | No (global) | Authenticated read only |
| tool_runs | PRESENT | Import/scan runs | Yes (organization_id) | Org members CRU |
| reports | PRESENT | Generated reports | Yes (organization_id) | Org members CRU |
| findings | PRESENT | Vulnerability findings | Yes (organization_id) | Org members CRU |
| sales_leads | PRESENT | CRM leads from forms | No (global, no org_id) | Anyone INSERT, admins SELECT/UPDATE |
| conversion_events | PRESENT | CTA tracking events | No (global, no org_id) | Anyone INSERT, admins SELECT |
| commercial_config | PRESENT | Booking/checkout URLs per org | Yes (organization_id) | Admins only |
| risk_register | PRESENT | Risk register | Yes (organization_id) | Org members CRUD, admins delete |
| signals | PRESENT | OSINT/security signals | Yes (organization_id) | Org members CRU |
| data_sources | PRESENT | Signal sources | Yes (organization_id) | Org members CRUD |
| source_sync_runs | PRESENT | Source sync logs | Yes (organization_id) | Org members CRU |
| remediation_tasks | PRESENT | Task tracking | Yes (organization_id) | Org members CRU |
| task_comments | PRESENT | Task comments | Yes (organization_id) | Org members CR |
| remediation_actions | PRESENT | AI-generated remediation actions | Yes (organization_id) | Org members CRU, admins delete |
| ai_analyses | PRESENT | AI analysis results | Yes (organization_id) | Org members CR |
| proof_packs | PRESENT | Immutable proof exports | Yes (organization_id) | Org members CR |
| retention_policies | PRESENT | Data retention settings | Yes (organization_id) | Admins only |
| evidence_chain_state | PRESENT | Hash chain state | Yes (organization_id) | Implicit via evidence_log |
| finding_control_links | PRESENT | Finding ↔ control mapping | Indirect (via findings) | Org members CRU |

**Total tables found: 31**

---

## SECTION 8 — EDGE FUNCTIONS

| Name | Status | Role | Key Inputs | Key Outputs | Env deps |
|------|--------|------|------------|-------------|----------|
| upload-authorization | PRESENT | Upload signed authorization PDF | JWT auth, multipart file | authorization record | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| upload-document | PRESENT | Upload org document | JWT auth, file | document record | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| create-tool-run | PRESENT | Create a tool run record | org_id, tool_slug, mode, asset_id | tool_run record | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| upload-tool-run-artifact | PRESENT | Upload scan artifact file | JWT auth, file, tool_run_id | artifact_url, artifact_hash | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| generate-reports | PRESENT | Generate report via Supabase (calls Gemini) | JWT auth, tool_run_id | report record | SUPABASE_URL, LOVABLE_API_KEY |
| normalize-tool-run | PRESENT | Normalize tool output into findings | tool_run_id | findings records | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| log-evidence | PRESENT | Append to evidence log | entity data | evidence_log entry | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| verify-evidence-chain | PRESENT | Verify hash chain integrity | org_id | chain validity report | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| export-proof-pack | PRESENT | Export proof pack JSON | JWT auth, params | proof_pack record | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| ingest-signals | PRESENT | Ingest signals batch | org_id, source_id, signals[] | inserted/deduped count | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |
| correlate-risks | PRESENT | Correlate open signals into risks | org_id | risk entries | SUPABASE_URL, LOVABLE_API_KEY |
| analyze-signal-with-gemini | PRESENT | Analyze signal with AI | org_id, signal_id | structured analysis | SUPABASE_URL, LOVABLE_API_KEY |
| generate-remediation-plan | PRESENT | AI remediation plan for risk | org_id, risk_id | remediation_actions | SUPABASE_URL, LOVABLE_API_KEY |
| platform-health | PRESENT | Platform health status | org_id? | health JSON | SUPABASE_URL |
| submit-sales-lead | PRESENT | Lead capture with validation + dedup | full_name, email, company + optional fields | lead_id, lead_score | SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY |

**IMPORTANT NOTE:** Two parallel report generation paths exist:
1. `generate-reports` edge function (Supabase, uses LOVABLE_API_KEY via Gemini) — called by `useReports.ts` hook
2. `VITE_CORE_API_URL/v1/reports/*` (external backend) — called by ReportStudio and api-client

These are **not connected**. ReportStudio only uses path 2. The Reports page (via useReports.ts) uses path 1.

**Total edge functions: 15**

---

## SECTION 9 — ENVIRONMENT VARIABLES DETECTED IN CODE

| Variable | Files using it | Role | Impact if absent |
|----------|----------------|------|-----------------|
| VITE_SUPABASE_URL | client.ts, DemoRequestDialog, api-client, hooks | Supabase project URL | App broken — auth/DB fails |
| VITE_SUPABASE_PUBLISHABLE_KEY | client.ts, api-client, hooks | Supabase anon key | App broken |
| VITE_SUPABASE_PROJECT_ID | .env only (not used in src) | Project reference | None (unused in code) |
| VITE_CORE_API_URL | api-client.ts, ReportStudio, ApiTest, AdminReadiness | External backend URL | ReportStudio fully disabled, ApiTest always fails |
| VITE_AI_GATEWAY_URL | api-client.ts only | AI gateway alternative URL | Falls back to VITE_CORE_API_URL |
| VITE_BOOKING_URL | revenue-links.ts | Direct booking link | Falls back to DemoRequestDialog |
| VITE_STARTER_CHECKOUT_URL | revenue-links.ts | Starter plan checkout | PricingSection fallback to /auth |
| VITE_PRO_CHECKOUT_URL | revenue-links.ts | Pro plan checkout | Falls back to DemoRequestDialog |
| VITE_ENTERPRISE_CHECKOUT_URL | revenue-links.ts | Enterprise plan checkout | Falls back to DemoRequestDialog |

**Set in .env (confirmed):** VITE_SUPABASE_PROJECT_ID, VITE_SUPABASE_PUBLISHABLE_KEY, VITE_SUPABASE_URL
**NOT set in .env:** VITE_CORE_API_URL, VITE_AI_GATEWAY_URL, VITE_BOOKING_URL, VITE_STARTER_CHECKOUT_URL, VITE_PRO_CHECKOUT_URL, VITE_ENTERPRISE_CHECKOUT_URL

---

## SECTION 10 — RAW SCORES

| Block | Score /100 | Justification |
|-------|-----------|---------------|
| Socle cyber (DB, auth, RLS, evidence) | 82/100 | 31 tables, RLS on all, immutable evidence chain, 15 edge functions. Missing: no DB triggers active, verify-evidence-chain not called from UI. |
| Reporting DG/DSI | 55/100 | ReportStudio UI is complete but 100% blocked on VITE_CORE_API_URL. generate-reports edge fn exists but used only by /reports page (not ReportStudio). Two parallel paths create confusion. |
| Import-first (tool runs, normalization) | 75/100 | Full flow exists: tool catalog → create run → upload artifact → normalize → findings. Empty state is good. Tools catalog must be populated in DB. |
| Tunnel commercial | 60/100 | Lead capture edge fn present, DemoRequestDialog functional, AdminLeads CRM present, tracking present. BLOCKERS: booking/checkout URLs not configured, Pricing page /auth CTA not updated to use openBookingOrFallback. |
| Admin / pilotage | 78/100 | AdminReadiness, AdminLeads, RevenueSettings all present. SLA logic, KPIs, conversion analytics present. Some readiness items hardcoded 'ok' regardless of real state. |
| Revenue readiness (vente immédiate) | 35/100 | Infrastructure ready, but: 0 checkout URLs set, 0 booking URL set, 0 real leads in DB (presumably). Cannot sell without configuring VITE_BOOKING_URL or DB commercial_config. |
