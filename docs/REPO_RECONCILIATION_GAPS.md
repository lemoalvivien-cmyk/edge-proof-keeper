# REPO RECONCILIATION GAPS — Cyber Serenity / Sentinel Edge

**Généré le : 2026-03-12**
**Source : audit workspace Lovable — vérification fichier par fichier**

---

## A. CLAIMED BUT NOT FOUND

Éléments annoncés dans les comptes-rendus précédents mais INTROUVABLES dans le workspace :

| Élément | Gravité | Preuve d'absence | Impact |
|---|---|---|---|
| Normalizers dupliqués dans `src/types/engine.ts` vs `src/lib/engine-normalizers.ts` | MINOR | Les deux fichiers existent et contiennent des fonctions similaires (`normalizeSeverity`, `normalizeSignalStatus`, `sanitizeSignalText`, `detectEntityType`, etc.) — duplication réelle, non résolue | Risque de divergence silencieuse entre les deux implémentations |
| `sync-customer-authorized-source` absent de `supabase/config.toml` | MINOR | Dossier présent, fonction déployable, mais absente des sections `[functions.*]` du config.toml | La fonction n'a pas de configuration JWT explicite — comportement par défaut incertain |
| Triggers updated_at en DB (`<db-triggers>` = none) | MAJOR | La DB info indique "no triggers" mais la migration `20260312082245` contient `CREATE TRIGGER trg_entity_nodes_updated_at` | Indique que soit les triggers ne sont pas reportés dans le système d'info, soit la migration n'a pas été exécutée côté DB live |
| Page `/scans` dans la sidebar | MINOR | La route `/scans` existe dans App.tsx mais aucune entrée dans AppSidebar.tsx | Accessible par URL directe mais invisible dans la navigation |
| Page `/findings` dans la sidebar | MINOR | La route `/findings` existe dans App.tsx mais aucune entrée dans AppSidebar.tsx | Idem |

---

## B. PRESENT BUT PARTIAL

Éléments présents dans le code mais pas totalement exploitables :

| Élément | Gravité | Preuve | Impact concret |
|---|---|---|---|
| **Duplication normalizers** : `src/types/engine.ts` contient `normalizeSeverity`, `normalizeSignalStatus`, `sanitizeSignalText`, `detectEntityType`, `buildEntityKey`, `normalizeEntityValue` — idem dans `src/lib/engine-normalizers.ts` | MAJOR | Visible dans les deux fichiers côte à côte | Risque de divergence. La page Signals importe depuis `engine-normalizers`, l'api-client depuis `engine-normalizers`, mais les types partagent aussi leur propre copie — toute modification dans un fichier peut ne pas se propager |
| **`ApiTest.tsx`** appelle `getHealth()` qui requiert `VITE_CORE_API_URL` | MAJOR | `src/pages/ApiTest.tsx` ligne 2 : `import { getHealth } from "@/lib/api-client"` ; `api-client.ts` ligne 190-198 : throw si `VITE_CORE_API_URL` absent | La page s'affiche mais l'action principale échoue systématiquement sans le backend externe |
| **`ReportStudio.tsx`** : génération de rapport via `generateExecutiveReport` / `generateTechnicalReport` | MAJOR | Ces fonctions dans `api-client.ts` appellent `requireAiGateway()` → nécessite `VITE_AI_GATEWAY_URL` ou `VITE_CORE_API_URL` | Le studio s'affiche mais la génération IA échoue sans backend externe configuré |
| **`sync-customer-authorized-source`** absent de `config.toml` | MINOR | Dossier présent dans `supabase/functions/`, absent de `supabase/config.toml` | Fonction déployable manuellement mais sans configuration `verify_jwt` explicite |
| **`correlate-entities`** : extraction d'entités uniquement heuristique | MINOR | Code de la fonction : regex-based, pas de résolution DNS, pas d'enrichissement externe | Entités extraites seulement si présentes explicitement dans les champs texte des signaux |
| **Données démo** : `src/lib/demo-data.ts` existe mais son usage dans les pages n'est pas audité | MINOR | Fichier présent, contenu non inspecté | Si utilisé dans Demo.tsx, risque de données hardcodées non représentatives |

---

## C. REAL BLOCKERS

Ce qui bloque réellement la scalabilité, la démo, la vente, le moteur data, le moteur reporting :

### 1. VITE_CORE_API_URL non configurée
- **Gravité : CRITICAL**
- **Preuve :** `src/lib/api-client.ts` lignes 81-86 : `function requireCoreApi()` throw si absent ; `.env` : variable absente
- **Impact :** ApiTest inutilisable, génération rapports externes impossible, ReportStudio partiellement bloqué

### 2. VITE_AI_GATEWAY_URL non configurée
- **Gravité : CRITICAL**
- **Preuve :** `src/lib/api-client.ts` lignes 88-94 : `function requireAiGateway()` ; `.env` : variable absente
- **Impact :** `generateExecutiveReport` et `generateTechnicalReport` échouent silencieusement en production

### 3. Duplication des normalizers entre `engine.ts` et `engine-normalizers.ts`
- **Gravité : MAJOR**
- **Preuve :** Les deux fichiers contiennent des implémentations identiques de `normalizeSeverity`, `normalizeSignalStatus`, `sanitizeSignalText`, `detectEntityType`, `buildEntityKey`, `normalizeEntityValue`
- **Impact :** Dette technique certaine. Toute correction dans un fichier doit être dupliquée dans l'autre manuellement. Risque de divergence silencieuse.

### 4. Triggers DB non confirmés dans l'environnement live
- **Gravité : MAJOR**
- **Preuve :** `<db-triggers>` retourne "no triggers" alors que la migration `20260312082245` déclare `CREATE TRIGGER trg_entity_nodes_updated_at`
- **Impact :** Le champ `updated_at` sur `entity_nodes` peut ne pas se mettre à jour automatiquement en production

### 5. Checkout URLs non configurées (commercial_config)
- **Gravité : MAJOR** (pour la vente)
- **Preuve :** `commercial_config` table présente, `VITE_BOOKING_URL`, `VITE_STARTER_CHECKOUT_URL` absentes du `.env`
- **Impact :** Les CTAs de la landing et pricing ne redirigent vers aucun checkout réel

### 6. Scans et Findings absents de la sidebar
- **Gravité : MINOR**
- **Preuve :** Routes `/scans` et `/findings` dans App.tsx, absent de `operationsItems` dans AppSidebar.tsx
- **Impact :** Pages accessibles seulement par URL directe — UX dégradée

---

## D. TO_SYNC_TO_GITHUB

Fichiers critiques présents dans le workspace Lovable qui doivent être synchronisés vers GitHub pour garantir la cohérence :

| Élément | Type | Criticité | Pourquoi |
|---|---|---|---|
| `supabase/migrations/20260312082245_9b5220bd-8e87-4fd8-be1d-5887a07e9678.sql` | Migration | CRITIQUE | Crée les tables `entity_nodes`, `entity_edges`, `signal_entity_links` avec RLS, indexes, FK, trigger |
| `supabase/migrations/20260312090000_51606502-d84c-4123-a3b4-5a8ebaae9fa3.sql` | Migration | CRITIQUE | Ajoute les indexes d'unicité nécessaires aux upserts de `correlate-entities` |
| `supabase/functions/correlate-entities/index.ts` | Edge Function | CRITIQUE | Moteur d'extraction d'entités et de construction du graphe |
| `src/pages/Signals.tsx` | Page React | CRITIQUE | Page principale de visualisation des signaux avec pivot entités |
| `src/pages/Sources.tsx` | Page React | CRITIQUE | Hub d'ingestion des sources de données |
| `src/lib/engine-normalizers.ts` | Lib | MAJEUR | Source de vérité pour normalisation signal/entité côté frontend |
| `src/types/engine.ts` | Types TS | MAJEUR | Contrat de données complet, 508 lignes, inclut types graphe |
| `src/lib/api-client.ts` | Lib | MAJEUR | Fonctions graphe : `getSignalEntities`, `getRelatedSignals`, `runEntityCorrelation`, etc. |
| `supabase/config.toml` | Config | MAJEUR | Inclut `[functions.correlate-entities]` et `[functions.sync-customer-authorized-source]` à ajouter |
| `docs/SOURCE_OF_TRUTH.md` | Doc | NORMAL | Référence de réconciliation |
| `docs/REPO_RECONCILIATION_REPORT.md` | Doc | NORMAL | Inventaire vérifiable |
| `docs/REPO_RECONCILIATION_GAPS.md` | Doc | NORMAL | Gaps et blockers documentés |
