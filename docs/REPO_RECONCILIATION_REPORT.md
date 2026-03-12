# REPO RECONCILIATION REPORT — Cyber Serenity / Sentinel Edge

**Généré le : 2026-03-12**
**Source : workspace Lovable (inspecté fichier par fichier)**

---

## A. PAGES RÉELLEMENT PRÉSENTES

| Fichier | Statut | Notes |
|---|---|---|
| `src/pages/Landing.tsx` | PRESENT | Page publique principale |
| `src/pages/Pricing.tsx` | PRESENT | Page publique |
| `src/pages/Demo.tsx` | PRESENT | Page publique, 515 lignes, interactive (framer-motion) |
| `src/pages/Auth.tsx` | PRESENT | Redirigé vers /dashboard en SOLO_MODE |
| `src/pages/Onboarding.tsx` | PRESENT | Protected |
| `src/pages/Dashboard.tsx` | PRESENT | Vue Direction, protected |
| `src/pages/DashboardTechnical.tsx` | PRESENT | Vue Technique, protected |
| `src/pages/Assets.tsx` | PRESENT | Protected |
| `src/pages/Scans.tsx` | PRESENT | Protected |
| `src/pages/Documents.tsx` | PRESENT | Protected |
| `src/pages/Compliance.tsx` | PRESENT | Protected |
| `src/pages/Evidence.tsx` | PRESENT | Protected |
| `src/pages/Settings.tsx` | PRESENT | Admin only |
| `src/pages/Tools.tsx` | PRESENT | Protected |
| `src/pages/ToolDetail.tsx` | PRESENT | Protected |
| `src/pages/Runs.tsx` | PRESENT | Protected |
| `src/pages/RunDetail.tsx` | PRESENT | Protected |
| `src/pages/Reports.tsx` | PRESENT | Protected |
| `src/pages/ReportStudio.tsx` | PRESENT | Protected, 379 lignes |
| `src/pages/Tasks.tsx` | PRESENT | Protected |
| `src/pages/TaskDetail.tsx` | PRESENT | Protected |
| `src/pages/GoNoGo.tsx` | PRESENT | Admin only |
| `src/pages/Proofs.tsx` | PRESENT | Protected |
| `src/pages/Risks.tsx` | PRESENT | Protected |
| `src/pages/Findings.tsx` | PRESENT | Protected |
| `src/pages/Sources.tsx` | PRESENT | Protected, 660 lignes |
| `src/pages/Signals.tsx` | PRESENT | Protected, 749 lignes, pivot branché |
| `src/pages/ApiTest.tsx` | PRESENT | Protected, 55 lignes, appelle VITE_CORE_API_URL |
| `src/pages/AdminReadiness.tsx` | PRESENT | Admin only, 653 lignes |
| `src/pages/AdminLeads.tsx` | PRESENT | Admin only, 704 lignes |
| `src/pages/PlansAddons.tsx` | PRESENT | Admin only |
| `src/pages/RevenueSettings.tsx` | PRESENT | Admin only |
| `src/pages/NotFound.tsx` | PRESENT | |
| `src/pages/Index.tsx` | PRESENT | (non routé directement) |
| `src/pages/legal/Terms.tsx` | PRESENT | Public |
| `src/pages/legal/Privacy.tsx` | PRESENT | Public |
| `src/pages/legal/AuthorizedUse.tsx` | PRESENT | Public |
| `src/pages/legal/Disclaimer.tsx` | PRESENT | Public |
| `src/pages/offres/ImportsHub.tsx` | PRESENT | Public |
| `src/pages/offres/DevsecOpsPack.tsx` | PRESENT | Public |
| `src/pages/offres/AuditPackCabinets.tsx` | PRESENT | Public |
| `src/pages/offres/RemediationPatchBridge.tsx` | PRESENT | Public |
| `src/pages/offres/ContinuousGovernance.tsx` | PRESENT | Public |
| `src/pages/offres/EasmOsintSignals.tsx` | PRESENT | Public |

**Total pages : 44**

---

## B. ROUTES RÉELLEMENT PRÉSENTES (src/App.tsx)

| Path | Composant | Protected | Rôle requis |
|---|---|---|---|
| `/` | Landing | Non | — |
| `/pricing` | Pricing | Non | — |
| `/demo` | Demo | Non | — |
| `/auth` | → redirect /dashboard (SOLO_MODE) | Non | — |
| `/scopeguard` | → redirect /tools | Non | — |
| `/authorizations` | → redirect /tools | Non | — |
| `/authorizations/*` | → redirect /tools | Non | — |
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
| `/onboarding` | Onboarding | Oui | authenticated |
| `/settings` | Settings | Oui | admin |
| `/plans` | PlansAddons | Oui | admin |
| `/admin-readiness` | AdminReadiness | Oui | admin |
| `/admin/leads` | AdminLeads | Oui | admin |
| `/settings/revenue` | RevenueSettings | Oui | admin |
| `/dashboard` | Dashboard | Oui | authenticated |
| `/dashboard/technical` | DashboardTechnical | Oui | authenticated |
| `/assets` | Assets | Oui | authenticated |
| `/scans` | Scans | Oui | authenticated |
| `/documents` | Documents | Oui | authenticated |
| `/compliance` | Compliance | Oui | authenticated |
| `/evidence` | Evidence | Oui | authenticated |
| `/tools` | Tools | Oui | authenticated |
| `/tools/:slug` | ToolDetail | Oui | authenticated |
| `/runs` | Runs | Oui | authenticated |
| `/runs/:id` | RunDetail | Oui | authenticated |
| `/reports` | Reports | Oui | authenticated |
| `/report-studio` | ReportStudio | Oui | authenticated |
| `/tasks` | Tasks | Oui | authenticated |
| `/tasks/:id` | TaskDetail | Oui | authenticated |
| `/go-no-go` | GoNoGo | Oui | admin |
| `/proofs` | Proofs | Oui | authenticated |
| `/risks` | Risks | Oui | authenticated |
| `/findings` | Findings | Oui | authenticated |
| `/sources` | Sources | Oui | authenticated |
| `/signals` | Signals | Oui | authenticated |
| `/api-test` | ApiTest | Oui | authenticated |
| `*` | NotFound | Non | — |

**Total routes : 46**

---

## C. SIDEBAR RÉELLE (src/components/layout/AppSidebar.tsx)

### Section : Tableaux de bord (toujours visible)
| Label | Route | Rôle |
|---|---|---|
| Vue Direction | /dashboard | all |
| Vue Technique | /dashboard/technical | all |
| Risques | /risks | all |
| Conformité | /compliance | all |

### Section : Opérations (masquée si isAuditor)
| Label | Route | Rôle |
|---|---|---|
| Actifs | /assets | non-auditor |
| Sources | /sources | non-auditor |
| Signals | /signals | non-auditor |
| Documents | /documents | non-auditor |
| Outils | /tools | non-auditor |
| Imports | /runs | non-auditor |
| Remédiation | /tasks | non-auditor |

### Section : Audit (toujours visible)
| Label | Route | Rôle |
|---|---|---|
| Rapports | /reports | all |
| Report Studio | /report-studio | all |
| Journal de Preuves | /evidence | all |
| Proof Packs | /proofs | all |

### Section : Administration (visible si isAdmin)
| Label | Route | Rôle |
|---|---|---|
| Paramètres | /settings | admin |
| Plans & Add-ons | /plans | admin |
| Revenue Settings | /settings/revenue | admin |
| GO/NO-GO | /go-no-go | admin |
| Leads | /admin/leads | admin |
| Admin Readiness | /admin-readiness | admin |
| Test API | /api-test | admin |

**Pages avec route mais SANS entrée sidebar :** Scans (`/scans`), Findings (`/findings`)

---

## D. FICHIERS CRITIQUES RÉELLEMENT PRÉSENTS

| Fichier | Statut | Lignes | Notes |
|---|---|---|---|
| `src/lib/api-client.ts` | PRESENT | 591 | Contient fonctions graphe, clients Supabase et edge functions |
| `src/types/engine.ts` | PRESENT | 508 | Types complets : Signal, EntityNode, EntityEdge, SignalEntityLink, normalisateurs |
| `src/lib/engine-normalizers.ts` | PRESENT | 152 | Centralisé, propre, sans dépendances externes |
| `src/pages/ApiTest.tsx` | PRESENT | 55 | Appelle `getHealth()` → nécessite VITE_CORE_API_URL |
| `src/pages/ReportStudio.tsx` | PRESENT | 379 | Fonctionnel |
| `src/pages/Demo.tsx` | PRESENT | 515 | Interactive, framer-motion |
| `src/pages/AdminReadiness.tsx` | PRESENT | 653 | Fonctionnel |
| `src/pages/AdminLeads.tsx` | PRESENT | 704 | Fonctionnel |
| `src/pages/Sources.tsx` | PRESENT | 660 | Fonctionnel |
| `src/pages/Signals.tsx` | PRESENT | 749 | Fonctionnel avec pivots |

---

## E. TABLES MOTEUR DANS LES MIGRATIONS

| Table | Présente dans migration | Migration |
|---|---|---|
| `data_sources` | OUI | migrations antérieures au 20260311 |
| `source_sync_runs` | OUI | migrations antérieures au 20260311 |
| `signals` | OUI | migrations antérieures au 20260311 |
| `risk_register` | OUI | migrations antérieures au 20260311 |
| `remediation_actions` | OUI | migrations antérieures au 20260311 |
| `ai_analyses` | OUI | migrations antérieures au 20260311 |
| `entity_nodes` | OUI | `20260312082245_9b5220bd` |
| `entity_edges` | OUI | `20260312082245_9b5220bd` |
| `signal_entity_links` | OUI | `20260312082245_9b5220bd` |
| `sales_leads` | OUI | migrations antérieures |
| `conversion_events` | OUI | migrations antérieures |
| `commercial_config` | OUI | migrations antérieures |

**RLS activé sur toutes les tables graphe : OUI**
**Indexes d'unicité pour upsert : OUI** (`20260312090000_51606502`)
**Triggers updated_at sur entity_nodes : OUI** (dans `20260312082245`)

**Total tables confirmées : 12/12**

---

## F. EDGE FUNCTIONS RÉELLEMENT PRÉSENTES

| Fonction | Présente (dossier) | Config JWT | Notes |
|---|---|---|---|
| `ingest-source-payload` | OUI | verify_jwt: false | |
| `sync-public-intel-source` | OUI | verify_jwt: false | |
| `sync-customer-authorized-source` | OUI | non listé config.toml | PARTIAL |
| `correlate-entities` | OUI | verify_jwt: false | 469 lignes, opérationnel |
| `correlate-risks` | OUI | verify_jwt: false | |
| `analyze-signal-with-gemini` | OUI | verify_jwt: false | |
| `generate-remediation-plan` | OUI | verify_jwt: false | |
| `platform-health` | OUI | verify_jwt: false | |
| `submit-sales-lead` | OUI | verify_jwt: false | |
| `ingest-signals` | OUI | verify_jwt: false | Legacy, gardé pour compatibilité |
| `create-tool-run` | OUI | verify_jwt: true | |
| `upload-tool-run-artifact` | OUI | verify_jwt: true | |
| `generate-reports` | OUI | verify_jwt: true | |
| `normalize-tool-run` | OUI | verify_jwt: true | |
| `log-evidence` | OUI | verify_jwt: true | |
| `verify-evidence-chain` | OUI | verify_jwt: true | |
| `export-proof-pack` | OUI | verify_jwt: true | |
| `upload-authorization` | OUI | verify_jwt: true | |
| `upload-document` | OUI | verify_jwt: true | |
| `_shared/gemini.ts` | OUI | n/a | Module partagé |

**Total edge functions : 19 dossiers (dont 1 _shared)**

---

## G. VARIABLES D'ENVIRONNEMENT RÉELLEMENT UTILISÉES

| Variable | Fichier(s) | Statut |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env`, `src/lib/api-client.ts` | Configurée |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | `.env`, `src/lib/api-client.ts` | Configurée |
| `VITE_SUPABASE_PROJECT_ID` | `.env` | Configurée |
| `VITE_CORE_API_URL` | `src/lib/api-client.ts` | NON configurée → bloque ApiTest et génération rapports externes |
| `VITE_AI_GATEWAY_URL` | `src/lib/api-client.ts` | NON configurée → fallback sur VITE_CORE_API_URL |

---

## SCORE DE VÉRITÉ

| Dimension | Score | Justification |
|---|---|---|
| Cohérence workspace ↔ repo perçu | **9/10** | Tout ce qui a été annoncé existe réellement. 1 point de moins pour `sync-customer-authorized-source` absent de config.toml |
| Maturité produit | **7/10** | UI fonctionnelle, flux complets, mais pas de données réelles en démo sans VITE_CORE_API_URL |
| Maturité data | **8/10** | Schema complet, RLS strict, migrations propres, 12 tables confirmées |
| Maturité revenue | **5/10** | Commercial config présent, landing/pricing OK, mais checkout URLs non configurées |
| Readiness technique | **7/10** | Architecture solide, edge functions déployées, bloqué sur variables d'env externes |
