# WORKSPACE STATE REPORT — Securit-E

**Source de vérité : workspace Lovable**
**Date de génération : 2026-03-12T12:00:00Z**

---

## A. PAGES

| Fichier | Statut | Rôle réel |
|---------|--------|-----------|
| `src/pages/Landing.tsx` | PRESENT | Page publique principale, landing marketing |
| `src/pages/Pricing.tsx` | PRESENT | Page tarification publique |
| `src/pages/Demo.tsx` | PRESENT | Démo fictive publique ACME Corp — données mockées, framer-motion, ~515 lignes |
| `src/pages/Auth.tsx` | PRESENT | Authentification (login / signup) — désactivée en SOLO_MODE |
| `src/pages/Onboarding.tsx` | PRESENT | Onboarding post-signup — protégé |
| `src/pages/Dashboard.tsx` | PRESENT | Vue Direction / KPIs exécutifs |
| `src/pages/DashboardTechnical.tsx` | PRESENT | Vue Technique / DSI |
| `src/pages/Assets.tsx` | PRESENT | Inventaire des actifs |
| `src/pages/Scans.tsx` | PRESENT | Historique des scans |
| `src/pages/Documents.tsx` | PRESENT | Gestion documentaire |
| `src/pages/Compliance.tsx` | PRESENT | Conformité RGPD / NIS2, contrôles |
| `src/pages/Evidence.tsx` | PRESENT | Journal de preuves (evidence_log) |
| `src/pages/Settings.tsx` | PRESENT | Paramètres — admin only |
| `src/pages/Tools.tsx` | PRESENT | Catalogue d'outils |
| `src/pages/ToolDetail.tsx` | PRESENT | Détail outil par slug |
| `src/pages/Runs.tsx` | PRESENT | Historique des tool runs |
| `src/pages/RunDetail.tsx` | PRESENT | Détail d'un tool run |
| `src/pages/Reports.tsx` | PRESENT | Liste des rapports |
| `src/pages/ReportStudio.tsx` | PRESENT | Génération rapports DG/PDG + DSI via `VITE_CORE_API_URL` — warning affiché si non configuré |
| `src/pages/Tasks.tsx` | PRESENT | Liste des tâches de remédiation |
| `src/pages/TaskDetail.tsx` | PRESENT | Détail d'une tâche |
| `src/pages/GoNoGo.tsx` | PRESENT | Feu vert / rouge commercial — admin only |
| `src/pages/Proofs.tsx` | PRESENT | Proof Packs |
| `src/pages/Risks.tsx` | PRESENT | Registre des risques (~384 lignes, useFindings) |
| `src/pages/Findings.tsx` | PRESENT | Findings détaillés |
| `src/pages/Sources.tsx` | PRESENT | Gestion des sources de données (~660 lignes, CRUD complet) |
| `src/pages/Signals.tsx` | PRESENT | Signaux + entités + pivots corrélation (~749 lignes) |
| `src/pages/ApiTest.tsx` | PRESENT | Test du backend externe `VITE_CORE_API_URL/health` (~55 lignes) |
| `src/pages/AdminReadiness.tsx` | PRESENT | Checklist commerciale et technique (~670 lignes) — reflète réalité des env vars |
| `src/pages/AdminLeads.tsx` | PRESENT | Pipeline CRM leads (~704 lignes) — CRUD, SLA, filtres |
| `src/pages/RevenueSettings.tsx` | PRESENT | Config commerciale DB (booking, checkout) (~408 lignes) |
| `src/pages/PlansAddons.tsx` | PRESENT | Plans et add-ons — admin |
| `src/pages/NotFound.tsx` | PRESENT | Page 404 |
| `src/pages/Index.tsx` | PRESENT | Redirect ou page index |
| `src/pages/legal/Terms.tsx` | PRESENT | CGU |
| `src/pages/legal/Privacy.tsx` | PRESENT | Politique confidentialité |
| `src/pages/legal/AuthorizedUse.tsx` | PRESENT | Politique d'usage autorisé |
| `src/pages/legal/Disclaimer.tsx` | PRESENT | Disclaimer |
| `src/pages/offres/ImportsHub.tsx` | PRESENT | Page offre Imports Hub |
| `src/pages/offres/DevsecOpsPack.tsx` | PRESENT | Page offre DevSecOps Pack |
| `src/pages/offres/AuditPackCabinets.tsx` | PRESENT | Page offre Audit Pack Cabinets |
| `src/pages/offres/RemediationPatchBridge.tsx` | PRESENT | Page offre Remediation Patch Bridge |
| `src/pages/offres/ContinuousGovernance.tsx` | PRESENT | Page offre Continuous Governance |
| `src/pages/offres/EasmOsintSignals.tsx` | PRESENT | Page offre EASM/OSINT Signals |

**Total pages : 43**

> Note : `src/pages/Remediation.tsx` — ABSENT (les tâches de remédiation passent par `/tasks`)

---

## B. ROUTES

Toutes issues de `src/App.tsx` (vérifié ligne par ligne).

| Path | Composant | Protégé | Rôle requis |
|------|-----------|---------|-------------|
| `/` | Landing | Non | — |
| `/pricing` | Pricing | Non | — |
| `/demo` | Demo | Non | — |
| `/auth` | Auth (ou redirect /dashboard si SOLO_MODE) | Non | — |
| `/scopeguard` | → redirect `/tools` | Non | — |
| `/authorizations` | → redirect `/tools` | Non | — |
| `/authorizations/*` | → redirect `/tools` | Non | — |
| `/offres/imports-hub` | ImportsHub | Non | — |
| `/offres/devsecops-pack` | DevsecOpsPack | Non | — |
| `/offres/audit-pack-cabinets` | AuditPackCabinets | Non | — |
| `/offres/remediation-patch-bridge` | RemediationPatchBridge | Non | — |
| `/offres/continuous-governance` | ContinuousGovernance | Non | — |
| `/offres/easm-osint-signals` | EasmOsintSignals | Non | — |
| `/legal/terms` | Terms | Non | — |
| `/legal/privacy` | Privacy | Non | — |
| `/legal/authorized-use` | AuthorizedUse | Non | — |
| `/legal/disclaimer` | Disclaimer | Non | — |
| `/onboarding` | Onboarding | Oui | — |
| `/settings` | Settings | Oui | admin |
| `/plans` | PlansAddons | Oui | admin |
| `/admin-readiness` | AdminReadiness | Oui | admin |
| `/admin/leads` | AdminLeads | Oui | admin |
| `/settings/revenue` | RevenueSettings | Oui | admin |
| `/dashboard` | Dashboard | Oui | — |
| `/dashboard/technical` | DashboardTechnical | Oui | — |
| `/assets` | Assets | Oui | — |
| `/scans` | Scans | Oui | — |
| `/documents` | Documents | Oui | — |
| `/compliance` | Compliance | Oui | — |
| `/evidence` | Evidence | Oui | — |
| `/tools` | Tools | Oui | — |
| `/tools/:slug` | ToolDetail | Oui | — |
| `/runs` | Runs | Oui | — |
| `/runs/:id` | RunDetail | Oui | — |
| `/reports` | Reports | Oui | — |
| `/report-studio` | ReportStudio | Oui | — |
| `/tasks` | Tasks | Oui | — |
| `/tasks/:id` | TaskDetail | Oui | — |
| `/go-no-go` | GoNoGo | Oui | admin |
| `/proofs` | Proofs | Oui | — |
| `/risks` | Risks | Oui | — |
| `/findings` | Findings | Oui | — |
| `/sources` | Sources | Oui | — |
| `/signals` | Signals | Oui | — |
| `/api-test` | ApiTest | Oui | — |
| `*` | NotFound | Non | — |

**Total routes : 46**

> Note : `/scans` et `/findings` sont dans les routes mais ABSENTS de `AppSidebar.tsx`.

---

## C. SIDEBAR

Source : `src/components/layout/AppSidebar.tsx` (vérifié).

### Section : Tableaux de bord
| Label | Route | Rôle |
|-------|-------|------|
| Vue Direction | /dashboard | — |
| Vue Technique | /dashboard/technical | — |
| Risques | /risks | — |
| Conformité | /compliance | — |

### Section : Opérations (masquée pour auditor)
| Label | Route | Rôle |
|-------|-------|------|
| Actifs | /assets | — |
| Sources | /sources | — |
| Signals | /signals | — |
| Documents | /documents | — |
| Outils | /tools | — |
| Imports | /runs | — |
| Remédiation | /tasks | — |

### Section : Audit
| Label | Route | Rôle |
|-------|-------|------|
| Rapports | /reports | — |
| Report Studio | /report-studio | — |
| Journal de Preuves | /evidence | — |
| Proof Packs | /proofs | — |

### Section : Administration (admin only)
| Label | Route | Rôle |
|-------|-------|------|
| Paramètres | /settings | admin |
| Plans & Add-ons | /plans | admin |
| Revenue Settings | /settings/revenue | admin |
| GO/NO-GO | /go-no-go | admin |
| Leads | /admin/leads | admin |
| Admin Readiness | /admin-readiness | admin |
| Test API | /api-test | admin |

**Total entrées sidebar : 18**

> ABSENT de la sidebar : `/scans`, `/findings` (routes existent, navigation absente)

---

## D. API CLIENT

Source : `src/lib/api-client.ts` (591 lignes — fichier critique).

### Fonctions backend externe (VITE_CORE_API_URL)
| Fonction | Endpoint | Méthode | Dépendance env |
|----------|----------|---------|----------------|
| `createToolRun` | `POST /v1/tool-runs` | fetch | VITE_CORE_API_URL |
| `uploadToolRunArtifact` | `POST /v1/tool-runs/:id/artifact` | fetch multipart | VITE_CORE_API_URL |
| `generateExecutiveReport` | `POST /v1/reports/executive` | fetch | VITE_AI_GATEWAY_URL ou VITE_CORE_API_URL |
| `generateTechnicalReport` | `POST /v1/reports/technical` | fetch | VITE_AI_GATEWAY_URL ou VITE_CORE_API_URL |
| `verifyEvidenceChain` | `POST /v1/evidence/verify-chain` | fetch | VITE_CORE_API_URL |
| `isExternalBackendConfigured` | — | helper | VITE_CORE_API_URL |
| `getHealth` | `GET /health` | fetch | VITE_CORE_API_URL |

### Fonctions platform / Supabase direct
| Fonction | Source | Dépendance env |
|----------|--------|----------------|
| `getPlatformHealth` | Edge Function `platform-health` | VITE_SUPABASE_URL |
| `getSignals` | Table `signals` (Supabase SDK) | — |
| `getRisks` | Table `risk_register` | — |
| `getSources` | Table `data_sources` | — |
| `getSourceSyncRuns` | Table `source_sync_runs` | — |
| `getSourceSignalCount` | Table `signals` (count) | — |
| `ingestSourcePayload` | Edge Function `ingest-source-payload` | VITE_SUPABASE_URL |
| `syncPublicIntelSource` | Edge Function `sync-public-intel-source` | VITE_SUPABASE_URL |
| `syncCustomerAuthorizedSource` | Edge Function `sync-customer-authorized-source` | VITE_SUPABASE_URL |
| `ingestSignals` | Edge Function `ingest-signals` | VITE_SUPABASE_URL |
| `correlateRisks` | Edge Function `correlate-risks` | VITE_SUPABASE_URL |
| `analyzeSignalWithAI` | Edge Function `analyze-signal-with-gemini` | VITE_SUPABASE_URL |
| `generateRemediationPlan` | Edge Function `generate-remediation-plan` | VITE_SUPABASE_URL |
| `getSignalById` | Table `signals` | — |
| `getSignalEntities` | Table `signal_entity_links` | — |
| `getEntityGraphSummary` | Tables `entity_nodes` + `entity_edges` | — |
| `getEntityNodes` | Table `entity_nodes` | — |
| `getRelatedSignals` | Tables `signal_entity_links` + `signals` | — |
| `runEntityCorrelation` | Edge Function `correlate-entities` | VITE_SUPABASE_URL |

---

## E. REVENUE LOGIC

| Fichier / Composant | Statut | Rôle réel | Dépendance |
|--------------------|--------|-----------|------------|
| `src/lib/revenue-links.ts` | PRESENT | Source de vérité env vars commercial. Expose : `getBookingUrl`, `getCheckoutUrl`, `hasBookingUrl`, `hasCheckoutUrl`, `hasAnyCheckout`, `openBookingOrFallback`, `openCheckoutOrFallback` | VITE_BOOKING_URL, VITE_*_CHECKOUT_URL |
| `src/components/landing/HeroSection.tsx` | PRESENT | Importe `openBookingOrFallback` depuis revenue-links. CTA "Demander une démo" → booking ou DemoRequestDialog. CTA "Tester avec un fichier" → `/demo`. | revenue-links |
| `src/components/landing/PricingSection.tsx` | PRESENT | Importe `openBookingOrFallback` et `getCheckoutUrl`. CTA checkout par plan → URL si configurée ou fallback DemoRequestDialog. | revenue-links |
| `src/components/ui/DemoRequestDialog.tsx` | PRESENT | Formulaire lead. Post-submit : si booking URL → bouton "Planifier ma démo" ouvre le booking. Sinon message neutre. Appelle `submit-sales-lead` via fetch direct Supabase. | VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY, getBookingUrl |
| `src/pages/AdminReadiness.tsx` | PRESENT | Checklist réelle. Vérifie : VITE_CORE_API_URL, VITE_BOOKING_URL, checkout URLs (via useCommercialConfig), sales_enabled. Affiche statut réel. | useCommercialConfig, env vars |
| `src/pages/AdminLeads.tsx` | PRESENT | Pipeline CRM complet. `openBooking` utilise `commercialConfig.bookingUrl` — fallback mailto si absent. | useCommercialConfig |

---

## F. SUPABASE TABLES

Source : `src/integrations/supabase/types.ts` + contexte tables fourni.

| Table | Statut | Rôle | RLS |
|-------|--------|------|-----|
| `organizations` | PRESENT | Organisation cliente — pivot central | Oui |
| `profiles` | PRESENT | Profil utilisateur lié à org | Oui (implicite) |
| `user_roles` | PRESENT | Rôles par org (admin/user/auditor) — table séparée | Oui |
| `authorizations` | PRESENT | Autorisations légales de test/audit | Oui |
| `assets` | PRESENT | Inventaire des actifs cyber | Oui |
| `scans` | PRESENT | Historique des scans | Oui |
| `documents` | PRESENT | Documents liés aux autorisations | Oui |
| `evidence_log` | PRESENT | Journal de preuves immuable (hash chain) | Oui — INSERT interdit côté client |
| `evidence_chain_state` | PRESENT | État de la chaîne de preuves par org | Oui |
| `compliance_controls` | PRESENT | Référentiel contrôles RGPD/NIS2 | Oui (lecture seule) |
| `control_mappings` | PRESENT | Mapping contrôles ↔ org | Oui |
| `secrets_vault` | PRESENT | Métadonnées clés (pas les valeurs) | Oui — admin only |
| `tools_catalog` | PRESENT (types) | Catalogue des outils | Oui (implicite) |
| `tool_presets` | PRESENT | Presets par outil | Oui |
| `tool_runs` | PRESENT | Runs d'outils | Oui |
| `reports` | PRESENT | Rapports DG/DSI | Oui |
| `findings` | PRESENT | Findings de sécurité | Oui |
| `finding_control_links` | PRESENT | Liens findings ↔ contrôles | Oui |
| `sales_leads` | PRESENT | Leads commerciaux | Oui (insert public, select admin) |
| `conversion_events` | PRESENT | Tracking CTA | Oui (insert public, select admin) |
| `commercial_config` | PRESENT | URLs booking/checkout par org | Oui — admin only |
| `retention_policies` | PRESENT | Politiques de rétention | Oui — admin only |
| `data_sources` | PRESENT | Sources de données (OSINT, customer) | Oui |
| `source_sync_runs` | PRESENT | Historique synchronisations sources | Oui |
| `signals` | PRESENT | Signaux cyber ingérés | Oui |
| `risk_register` | PRESENT | Registre de risques | Oui |
| `remediation_actions` | PRESENT | Actions de remédiation (liées aux risques) | Oui |
| `remediation_tasks` | PRESENT | Tâches de remédiation (liées aux findings) | Oui |
| `task_comments` | PRESENT | Commentaires sur tâches | Oui |
| `ai_analyses` | PRESENT | Analyses IA (Gemini) — output JSON | Oui |
| `entity_nodes` | PRESENT | Nœuds du graphe d'entités | Oui |
| `entity_edges` | PRESENT | Arêtes du graphe | Oui |
| `signal_entity_links` | PRESENT | Liens signaux ↔ entités | Oui |
| `proof_packs` | PRESENT | Packs de preuves immuables | Oui |

**Total tables : 34**

---

## G. EDGE FUNCTIONS

Source : `supabase/functions/` + `supabase/config.toml`.

| Fonction | Statut | Rôle | verify_jwt | Dépendances env |
|----------|--------|------|------------|-----------------|
| `upload-authorization` | PRESENT | Upload document autorisation | true | SUPABASE_SERVICE_ROLE_KEY |
| `upload-document` | PRESENT | Upload document compliance | true | SUPABASE_SERVICE_ROLE_KEY |
| `create-tool-run` | PRESENT | Création d'un tool run | true | SUPABASE_SERVICE_ROLE_KEY |
| `upload-tool-run-artifact` | PRESENT | Upload artifact + hash | true | SUPABASE_SERVICE_ROLE_KEY |
| `generate-reports` | PRESENT | Génération rapports (pipeline interne) | true | LOVABLE_API_KEY |
| `normalize-tool-run` | PRESENT | Normalisation des runs | true | SUPABASE_SERVICE_ROLE_KEY |
| `log-evidence` | PRESENT | Ajout entrée evidence_log | true | SUPABASE_SERVICE_ROLE_KEY |
| `verify-evidence-chain` | PRESENT | Vérification intégrité chaîne | true | SUPABASE_SERVICE_ROLE_KEY |
| `export-proof-pack` | PRESENT | Export proof pack signé | true | SUPABASE_SERVICE_ROLE_KEY |
| `submit-sales-lead` | PRESENT | Capture lead + dédup + scoring | false | SUPABASE_SERVICE_ROLE_KEY |
| `ingest-signals` | PRESENT | Ingestion signaux (legacy) | false | SUPABASE_SERVICE_ROLE_KEY |
| `correlate-risks` | PRESENT | Corrélation risques via Gemini | false | LOVABLE_API_KEY |
| `analyze-signal-with-gemini` | PRESENT | Analyse signal IA | false | LOVABLE_API_KEY |
| `generate-remediation-plan` | PRESENT | Plan remédiation IA | false | LOVABLE_API_KEY |
| `platform-health` | PRESENT | Santé plateforme | false | SUPABASE_SERVICE_ROLE_KEY |
| `ingest-source-payload` | PRESENT | Ingestion payload source | false | SUPABASE_SERVICE_ROLE_KEY |
| `sync-public-intel-source` | PRESENT | Sync source publique | false | SUPABASE_SERVICE_ROLE_KEY |
| `sync-customer-authorized-source` | PRESENT | Sync source customer | false | SUPABASE_SERVICE_ROLE_KEY |
| `correlate-entities` | PRESENT | Corrélation entités graphe | false | LOVABLE_API_KEY |

**Total Edge Functions : 19**

> Note : `_shared/gemini.ts` est un helper partagé (PRESENT), pas une fonction exposée.

---

## H. ENV VARS

| Variable | Utilisée dans | Impact si absente |
|----------|--------------|-------------------|
| `VITE_SUPABASE_URL` | `src/lib/api-client.ts`, `src/components/ui/DemoRequestDialog.tsx` | CRITIQUE — toute la stack Supabase cassée |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `src/integrations/supabase/client.ts`, `DemoRequestDialog.tsx` | CRITIQUE — authentification cassée |
| `VITE_SUPABASE_PROJECT_ID` | `.env` (référence) | Mineur — non utilisé directement dans le code client |
| `VITE_CORE_API_URL` | `src/lib/api-client.ts` | MAJOR — ReportStudio en lecture seule, ApiTest cassé |
| `VITE_AI_GATEWAY_URL` | `src/lib/api-client.ts` | MAJOR — fallback sur VITE_CORE_API_URL si absent |
| `VITE_BOOKING_URL` | `src/lib/revenue-links.ts`, `src/pages/AdminReadiness.tsx` | MAJOR — CTAs booking tombent sur formulaire |
| `VITE_STARTER_CHECKOUT_URL` | `src/lib/revenue-links.ts` | MAJOR — checkout Starter désactivé |
| `VITE_PRO_CHECKOUT_URL` | `src/lib/revenue-links.ts` | MAJOR — checkout Pro désactivé |
| `VITE_ENTERPRISE_CHECKOUT_URL` | `src/lib/revenue-links.ts` | MAJOR — checkout Enterprise désactivé |

> Variables actuellement configurées dans `.env` : `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_PROJECT_ID`.
> Toutes les variables commerciales et `VITE_CORE_API_URL` sont ABSENTES du `.env` actuel.

---

## SCORES BRUTS

| Bloc | Score /100 | Justification |
|------|-----------|---------------|
| Socle cyber | 82/100 | Tables présentes, RLS actif, edge functions déployées, evidence chain fonctionnelle. -18 : `updated_at` triggers entity_nodes non confirmés, `/scans`+`/findings` sans sidebar |
| Tunnel commercial | 65/100 | revenue-links.ts centralisé, DemoRequestDialog opérationnel, AdminLeads complet. -35 : 0 URL checkout configurée, VITE_BOOKING_URL absente, ReportStudio désactivé sans VITE_CORE_API_URL |
| Reporting DG / DSI | 45/100 | ReportStudio présent et affiche état propre. generate-reports Edge Function présente. -55 : dépend entièrement de VITE_CORE_API_URL (absent), aucun rapport généré possible actuellement |
| Ingestion / Sources | 78/100 | Sources.tsx complet, ingest-source-payload + sync functions présentes, data_sources + source_sync_runs OK. -22 : verify_jwt=false sur toutes les fonctions d'ingestion |
| Graph / Pivots | 70/100 | entity_nodes/edges/signal_entity_links présents, correlate-entities présent, Signals.tsx branché. -30 : uniqueness indexes confirmés en migration mais triggers updated_at entity_nodes non prouvés live |
| Admin / Pilotage | 85/100 | AdminReadiness reflète réalité, AdminLeads CRUD complet, RevenueSettings opérationnel. -15 : sidebar manque /scans et /findings |
| Readiness vente | 55/100 | Formulaire lead opérationnel, pipeline CRM complet. -45 : aucune URL checkout configurée, booking absent, ReportStudio sans backend = impossibilité de démontrer la valeur reporting en live |
