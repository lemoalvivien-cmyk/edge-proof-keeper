# SPRINT0_VERIFICATION.md

## Sprint 0 — Blocages Absolus : Statut d'exécution

| # | Action | Statut | Détails |
|---|--------|--------|---------|
| **1** | **PAYWALL SERVER-SIDE** | | |
| 1.1 | Edge Function `check-entitlement` créée | ✅ FAIT | `supabase/functions/check-entitlement/index.ts` — verify_jwt=false, getClaims via `getUser()`, appel Stripe, retourne `{ entitled, plan, trial_active, trial_end }` |
| 1.2 | `check-entitlement` déployée | ✅ FAIT | Déployée via `supabase--deploy_edge_functions` |
| 1.3 | Hook `useEntitlement` | ✅ FAIT | `src/hooks/useEntitlement.ts` — appel serveur au mount |
| 1.4 | Composant `PaywallGate` | ✅ FAIT | `src/components/auth/PaywallGate.tsx` — wrapping de toutes les pages protégées |
| 1.5 | `UpgradeWall` plein écran | ✅ FAIT | `src/components/ui/UpgradeWall.tsx` — mur complet avec CTA Stripe Starter + Pro |
| 1.6 | PaywallGate sur toutes les routes protégées | ✅ FAIT | `/dashboard`, `/findings`, `/risks`, `/remediation`, `/reports`, `/evidence`, `/tools`, `/runs`, `/scans`, `/assets`, `/compliance`, `/documents`, `/signals`, `/sources`, `/report-studio`, `/proofs`, `/platform-health` |
| 1.7 | RLS `subscription_active` sur tables sensibles | ✅ FAIT | Migration appliquée : `findings`, `risk_register`, `remediation_actions`, `tool_runs`, `evidence_log`, `assets`, `reports`, `signals` — via `has_active_subscription()` SECURITY DEFINER |
| **2** | **WEBHOOK STRIPE** | | |
| 2.1 | Edge Function `stripe-webhook` créée | ✅ FAIT | `supabase/functions/stripe-webhook/index.ts` — vérification signature via `STRIPE_WEBHOOK_SECRET` |
| 2.2 | `stripe-webhook` déployée | ✅ FAIT | Déployée via `supabase--deploy_edge_functions` |
| 2.3 | Event `checkout.session.completed` | ✅ FAIT | Met à jour `subscription_status = 'active'/'trialing'` + `subscription_plan` + `subscription_end` |
| 2.4 | Event `customer.subscription.updated` | ✅ FAIT | Sync status, plan, subscription_end |
| 2.5 | Event `customer.subscription.deleted` | ✅ FAIT | Met `subscription_status = 'expired'` |
| 2.6 | Event `invoice.payment_failed` | ✅ FAIT | Met `subscription_status = 'payment_failed'` |
| 2.7 | Colonnes `subscription_status`, `subscription_plan`, `subscription_end`, `stripe_customer_id` dans `profiles` | ✅ FAIT | Migration appliquée |
| 2.8 | Secret `STRIPE_WEBHOOK_SECRET` configuré | ✅ FAIT | Ajouté via `secrets--add_secret` |
| **3** | **delete_user_account RPC** | | |
| 3.1 | Fonction SQL `delete_user_account()` créée | ✅ FAIT | Supprime `user_roles` + `profiles` du user courant — SECURITY DEFINER, GRANT à `authenticated` |
| 3.2 | `Settings.tsx` fonctionnel bout en bout | ✅ FAIT | Appel RPC → signOut → redirect `/` avec messages d'erreur RGPD |
| **4** | **CORS RESTREINT EN PRODUCTION** | | |
| 4.1 | Fichier `_shared/cors.ts` créé | ✅ FAIT | `supabase/functions/_shared/cors.ts` — allowlist `securit-e.com`, `www.securit-e.com`, preview Lovable |
| 4.2 | `check-entitlement` utilise CORS restreint | ✅ FAIT | Via `buildCorsHeaders(req)` |
| 4.3 | `stripe-webhook` — pas de CORS navigateur | ✅ FAIT | Webhook Stripe → server, pas de header CORS nécessaire |
| 4.4 | `check-subscription` CORS restreint | ✅ FAIT | Migré vers `_shared/cors.ts` |
| 4.5 | `create-checkout` CORS restreint | ✅ FAIT | Migré vers `_shared/cors.ts` |
| 4.6 | `get-public-config` et `get-demo-fixture` gardent `'*'` | ⚠️ EN ATTENTE | À migrer dans un second sprint (endpoints publics, impact limité) |

---

## Actions manuelles requises

| Action | Responsable |
|--------|-------------|
| Configurer le webhook Stripe dans le dashboard Stripe avec l'URL : `https://ypjcpehbehcfjlhkrltd.supabase.co/functions/v1/stripe-webhook` et les events : `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed` | Équipe |
| Activer "Leaked Password Protection" dans Auth → Password settings | Admin |

---

## Score global Sprint 0

**4/4 actions majeures complétées** ✅
