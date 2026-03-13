# SOURCE OF TRUTH — Securit-E

**Source de vérité actuelle : workspace Lovable**
**Date de génération : 2026-03-12T12:00:00Z**
**Objectif : réconciliation technique avant synchro GitHub**

---

## Règle fondamentale

Le workspace Lovable est la référence absolue pour toute décision technique à partir de cette date.

**Aucun développement futur ne doit s'appuyer sur un état non prouvé dans ces fichiers.**

Tout ce qui n'est pas visible dans le code du workspace est considéré comme ABSENT,
même si annoncé dans un compte-rendu précédent.

---

## Fichiers de vérité produits dans cette session

| Fichier | Contenu |
|---------|---------|
| `docs/SOURCE_OF_TRUTH.md` | Ce fichier — règles de réconciliation |
| `docs/WORKSPACE_STATE_REPORT.md` | Inventaire brut pages / routes / sidebar / API / tables / edge functions |
| `docs/WORKSPACE_GAPS.md` | Écarts, partiels, blockers critiques |
| `docs/WORKSPACE_TO_GITHUB_SYNC.md` | Liste précise des fichiers à synchroniser vers GitHub |

---

## Périmètre audité

- Routes et pages (`src/App.tsx`, `src/pages/`)
- Navigation (`src/components/layout/AppSidebar.tsx`)
- API client (`src/lib/api-client.ts`)
- Revenue logic (`src/lib/revenue-links.ts`, composants landing)
- Normalizers (`src/lib/engine-normalizers.ts`)
- Types moteur (`src/types/engine.ts`)
- Edge Functions (`supabase/functions/`)
- Schema DB (`src/integrations/supabase/types.ts` + contexte tables fourni)
- Variables d'environnement (`.env` + usage dans le code)
