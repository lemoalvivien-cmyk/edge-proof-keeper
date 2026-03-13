# WORKSPACE TO GITHUB SYNC — Securit-E

**Source de vérité : workspace Lovable**
**Date de génération : 2026-03-12T12:00:00Z**
**Objectif : liste précise et exploitable pour synchronisation vers GitHub**

---

## A. FILES TO SYNC

Fichiers frontend critiques créés ou modifiés dans le workspace et devant impérativement être dans le repo GitHub.

| Chemin | Pourquoi critique | Impact si non synchronisé |
|--------|-------------------|--------------------------|
| `src/lib/engine-normalizers.ts` | Créé dans cette session — source de vérité normalisation signaux/entités | `src/pages/Signals.tsx` et `src/lib/api-client.ts` importent ce fichier — build cassé si absent |
| `src/lib/api-client.ts` | Modifié — imports engine-normalizers, fonctions graphe ajoutées, wrappers nettoyés | Toute la couche API du frontend dépend de ce fichier |
| `src/lib/revenue-links.ts` | Modifié — ajout `hasBookingUrl`, `hasCheckoutUrl`, `openCheckoutOrFallback` | PricingSection, HeroSection, DemoRequestDialog, AdminLeads tous dépendants |
| `src/pages/Signals.tsx` | Modifié — pivot entities branché, `getRelatedSignals` câblé | Page Signals cassée si version ancienne dans GitHub |
| `src/pages/Sources.tsx` | Créé ou modifié — CRUD complet sources de données (~660 lignes) | Page Sources inaccessible ou incomplète |
| `src/pages/AdminReadiness.tsx` | Modifié — section Revenue Operating Readiness, vérification réelle env vars | Checklist commerciale fausse si version ancienne |
| `src/components/landing/HeroSection.tsx` | Modifié — CTA "Tester" → `/demo`, `openBookingOrFallback` importé | CTAs Hero pointent vers mauvaise route si ancienne version |
| `src/components/landing/PricingSection.tsx` | Modifié — `openCheckoutOrFallback` branché, suppression redirection `/auth` morte | CTAs pricing tombent dans impasse si ancienne version |
| `src/components/ui/DemoRequestDialog.tsx` | Vérifié OK — next step booking logique correcte | Pas de régression détectée, synchroniser pour cohérence |
| `src/types/engine.ts` | Types moteur — Signal, EntityNode, EntityEdge, SignalEntityLink, CorrelateEntitiesResult | Imports TypeScript cassés si absent |
| `src/types/reports.ts` | Types rapports — Report, ExecutiveReport, TechnicalReport | Utilisé par ReportStudio |
| `src/hooks/useCommercialConfig.ts` | Hook DB override commercial_config | AdminReadiness, AdminLeads, PricingSection dépendants |
| `docs/SOURCE_OF_TRUTH.md` | Ce fichier de vérité — référence pour l'équipe | Perte de traçabilité |
| `docs/WORKSPACE_STATE_REPORT.md` | Inventaire complet du workspace | Perte de visibilité architecturale |
| `docs/WORKSPACE_GAPS.md` | Liste des gaps et blockers critiques | Perte de la roadmap de stabilisation |
| `docs/WORKSPACE_TO_GITHUB_SYNC.md` | Ce fichier — liste de synchro | Impossibilité de reproduire la procédure |

---

## B. MIGRATIONS TO SYNC

Migrations Supabase présentes dans le workspace et devant être dans `supabase/migrations/` du repo.

| Migration (nom approximatif) | Contenu critique | Impact si non synchronisée |
|-----------------------------|-----------------|---------------------------|
| Migration tables core (organizations, profiles, user_roles, authorizations, assets...) | Toutes les tables fondamentales du schéma | Base de données non reproductible |
| Migration tables moteur (data_sources, source_sync_runs, signals, risk_register, remediation_actions, ai_analyses) | Moteur ingestion + risques | Fonctionnalités moteur impossibles à déployer |
| Migration graphe `20260312082245` (entity_nodes, entity_edges, signal_entity_links) | Graphe d'entités — tables + index + RLS | Page Signals et correlate-entities cassés |
| Migration indexes `20260312090000` (uniqueness indexes entity_nodes, entity_edges, signal_entity_links) | Indexes d'unicité pour upserts idempotents dans correlate-entities | Doublons en base, erreurs upsert |
| Migration tables commerciales (sales_leads, conversion_events, commercial_config) | Pipeline CRM et tracking | AdminLeads et DemoRequestDialog cassés |
| Migration compliance (compliance_controls, control_mappings, finding_control_links) | Référentiel conformité | Page Compliance cassée |
| Migration audit (evidence_log, evidence_chain_state, proof_packs, retention_policies) | Evidence chain immuable | Journal de preuves non fonctionnel |
| Migration tool stack (tools_catalog, tool_presets, tool_runs, reports, findings, scans, documents, secrets_vault) | Stack outils complète | Outils, Runs, Reports, Findings cassés |
| Migration fonctions DB (normalize_severity, has_role, has_org_access, compute_evidence_hash_chain, etc.) | Fonctions Postgres critiques pour RLS et triggers | Toutes les RLS policies cassées |

> **Note** : les noms exacts des fichiers migration sont dans `supabase/migrations/` du workspace.
> Synchroniser le dossier entier tel quel.

---

## C. EDGE FUNCTIONS TO SYNC

Toutes les Edge Functions doivent être synchronisées. Voici les plus critiques.

| Fonction | Chemin | Pourquoi critique |
|----------|--------|------------------|
| `correlate-entities` | `supabase/functions/correlate-entities/index.ts` | Modifiée dans session précédente (refactoring interne). Version workspace ≠ version GitHub probable. |
| `submit-sales-lead` | `supabase/functions/submit-sales-lead/index.ts` | Capture leads avec dédup 24h et scoring — pipeline commercial critique |
| `generate-reports` | `supabase/functions/generate-reports/index.ts` | Pipeline rapport interne Gemini — présent mais non utilisé par ReportStudio actuellement |
| `analyze-signal-with-gemini` | `supabase/functions/analyze-signal-with-gemini/index.ts` | Analyse IA signal — utilisée depuis api-client |
| `correlate-risks` | `supabase/functions/correlate-risks/index.ts` | Corrélation risques IA |
| `generate-remediation-plan` | `supabase/functions/generate-remediation-plan/index.ts` | Plan remédiation IA |
| `ingest-source-payload` | `supabase/functions/ingest-source-payload/index.ts` | Point d'entrée ingestion hub |
| `sync-public-intel-source` | `supabase/functions/sync-public-intel-source/index.ts` | Sync sources publiques |
| `sync-customer-authorized-source` | `supabase/functions/sync-customer-authorized-source/index.ts` | Sync sources customer |
| `platform-health` | `supabase/functions/platform-health/index.ts` | Dashboard + AdminReadiness dépendants |
| `_shared/gemini.ts` | `supabase/functions/_shared/gemini.ts` | Helper partagé — toutes les EF IA dépendantes |
| `log-evidence` | `supabase/functions/log-evidence/index.ts` | Evidence log immutable |
| `verify-evidence-chain` | `supabase/functions/verify-evidence-chain/index.ts` | Vérification intégrité preuves |

---

## D. CONFIG TO SYNC

| Fichier | Contenu | Impact si non synchronisé |
|---------|---------|--------------------------|
| `supabase/config.toml` | Configuration JWT par fonction (verify_jwt true/false) | Fonctions mal sécurisées ou rejetant des requêtes légitimes |
| `package.json` | Dépendances npm (framer-motion, @tanstack/react-query, etc.) | Build impossible |
| `tailwind.config.ts` | Design tokens, couleurs sémantiques | Build CSS cassé |
| `src/index.css` | Variables CSS (--primary, --background, etc.) | Design system cassé |
| `tsconfig.app.json` | Configuration TypeScript | Erreurs de compilation |
| `vite.config.ts` | Configuration Vite | Build impossible |

---

## RÉSUMÉ EXÉCUTIF SYNCHRO

```
FICHIERS FRONTEND CRITIQUES : 16
MIGRATIONS : 9 (synchroniser le dossier entier)
EDGE FUNCTIONS : 13 (synchroniser le dossier entier)
FICHIERS CONFIG : 6
```

**Recommandation** : synchroniser le workspace Lovable → GitHub par export complet,
puis vérifier que les 4 migrations graphe (`20260312082245` et `20260312090000`)
et `correlate-entities` modifiée sont bien présentes côté GitHub.
