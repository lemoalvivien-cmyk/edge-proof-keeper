# WORKSPACE GAPS — Cyber Serenity / Sentinel Edge

**Source de vérité : workspace Lovable**
**Date de génération : 2026-03-12T12:00:00Z**

---

## A. CLAIMED BUT NOT FOUND

Éléments annoncés dans des sessions précédentes mais non prouvés dans le workspace actuel.

| Élément | Statut réel | Preuve |
|---------|-------------|--------|
| Page `/remediation` dédiée | ABSENT | Aucun fichier `src/pages/Remediation.tsx` présent. Les tâches passent par `/tasks`. |
| `VITE_BOOKING_URL` configurée | ABSENT | `.env` ne contient pas cette variable. AdminReadiness l'affiche comme `warn`. |
| `VITE_STARTER_CHECKOUT_URL` configurée | ABSENT | Absente du `.env` actuel. |
| `VITE_PRO_CHECKOUT_URL` configurée | ABSENT | Absente du `.env` actuel. |
| `VITE_ENTERPRISE_CHECKOUT_URL` configurée | ABSENT | Absente du `.env` actuel. |
| `VITE_CORE_API_URL` configurée | ABSENT | Absente du `.env`. ReportStudio + ApiTest sans backend externe. |
| Triggers `updated_at` sur `entity_nodes` | NON PROUVÉ | Migration `20260312082245` annoncée mais non visible dans le workspace. Les triggers sont absents selon le contexte DB fourni. |
| Rapports IA générés et stockés | ABSENT | Aucun rapport réel en base — pipeline `generate-reports` présent mais non utilisé sans VITE_CORE_API_URL. |
| `/scans` accessible depuis la sidebar | ABSENT | Route présente dans App.tsx mais absente de AppSidebar.tsx. |
| `/findings` accessible depuis la sidebar | ABSENT | Route présente dans App.tsx mais absente de AppSidebar.tsx. |

---

## B. PRESENT BUT PARTIAL

Éléments existants mais non complètement branchés ou non totalement exploitables.

| Élément | Statut | Détail | Preuve |
|---------|--------|--------|--------|
| `ReportStudio` | PARTIAL | Présent, UI propre, logique correcte. Mais entièrement bloqué sans `VITE_CORE_API_URL`. Génère un `warn` visible, jamais un écran mort silencieux. | `src/pages/ReportStudio.tsx` l.258 |
| `ApiTest` | PARTIAL | Présent (~55 lignes). Teste uniquement `VITE_CORE_API_URL/health`. Sans la variable, erreur affichée proprement. Pas de test Supabase direct. | `src/pages/ApiTest.tsx` |
| `correlate-entities` | PARTIAL | Edge Function présente. Graphe de données opérationnel. Mais `verify_jwt=false` — pas d'authentification serveur. Uniqueness indexes annoncés mais triggers non prouvés live. | `supabase/config.toml` l.57 |
| Revenue tunnel | PARTIAL | `revenue-links.ts` centralisé et correct. Mais aucune URL commerciale configurée. Tous les CTAs tombent sur le formulaire. | `.env` + `src/lib/revenue-links.ts` |
| `generate-reports` Edge Function | PARTIAL | Présente et déployée. Mais le pipeline est distinct de `VITE_CORE_API_URL` — non branché depuis ReportStudio (qui appelle le backend externe, pas cette EF). | `src/lib/api-client.ts` + `supabase/functions/generate-reports/` |
| Navigation `/scans` et `/findings` | PARTIAL | Routes présentes dans App.tsx, pages présentes, mais aucune entrée sidebar. Accessible uniquement par URL directe. | `src/components/layout/AppSidebar.tsx` |
| `useCommercialConfig` | PARTIAL | Hook présent, lit `commercial_config` en DB. Mais la table est vide (aucun row créé tant que l'admin n'a pas configuré). Fallback sur env vars fonctionnel. | `src/hooks/useCommercialConfig.ts` |
| Demo fictive `/demo` | PARTIAL | Page présente avec données ACME Corp. Mais ne démontre pas les vraies capacités de génération de rapports IA (pas de pipeline réel). Vaut uniquement pour la présentation prospect. | `src/pages/Demo.tsx` |

---

## C. REAL BLOCKERS

Ce qui bloque réellement la vente, la démo, le reporting ou la cohérence data.

### CRITICAL

| # | Titre | Gravité | Preuve | Impact concret |
|---|-------|---------|--------|----------------|
| 1 | **VITE_CORE_API_URL absente** | CRITICAL | `.env` — variable manquante | ReportStudio désactivé. ApiTest cassé. Impossible de démontrer la génération de rapport DG/DSI en live. Bloque la promesse produit principale. |
| 2 | **Aucune URL checkout configurée** | CRITICAL | `.env` — VITE_STARTER/PRO/ENTERPRISE_CHECKOUT_URL absentes | Zéro conversion directe possible. Tous les CTAs pricing tombent sur formulaire. Revenue nul. |
| 3 | **VITE_BOOKING_URL absente** | CRITICAL | `.env` — variable manquante | Aucun booking direct. Les leads doivent être recontactés manuellement. Friction maximale post-formulaire. |

### MAJOR

| # | Titre | Gravité | Preuve | Impact concret |
|---|-------|---------|--------|----------------|
| 4 | **`/scans` et `/findings` hors sidebar** | MAJOR | `src/components/layout/AppSidebar.tsx` | Pages inaccessibles depuis la navigation. Utilisateur ne peut pas accéder aux scans ni aux findings sans URL directe. |
| 5 | **`generate-reports` EF non utilisée par ReportStudio** | MAJOR | `src/lib/api-client.ts` — ReportStudio appelle `VITE_CORE_API_URL/v1/reports/*`, pas `generate-reports` | Deux pipelines de rapports coexistent. L'EF interne Gemini existe mais n'est pas exposée dans l'UI. |
| 6 | **verify_jwt=false sur fonctions sensibles** | MAJOR | `supabase/config.toml` — correlate-risks, analyze-signal, generate-remediation, correlate-entities | Fonctions appelables sans authentification. Risque d'abus / surcoût IA en production. |
| 7 | **Triggers `updated_at` entity_nodes non confirmés live** | MAJOR | Contexte DB fourni : "no triggers in the database" | entity_nodes.updated_at potentiellement non mis à jour automatiquement. Cohérence graphe compromise. |

### MINOR

| # | Titre | Gravité | Preuve | Impact concret |
|---|-------|---------|--------|----------------|
| 8 | **`src/lib/api-client.ts` trop large** | MINOR | Fichier 591 lignes — commentaire système indique "should be considered for refactoring" | Maintenabilité dégradée. Pas un blocker fonctionnel immédiat. |
| 9 | **`VITE_AI_GATEWAY_URL` jamais définie** | MINOR | `.env` — absente, fallback sur VITE_CORE_API_URL | Pas de séparation AI gateway / core API. Fonctionnel avec VITE_CORE_API_URL seule mais architecture incomplète. |
| 10 | **`src/pages/Index.tsx` rôle ambigu** | MINOR | Fichier présent mais non routé explicitement (route `/` pointe sur `Landing`) | Potentiel code mort ou confusion future. |
