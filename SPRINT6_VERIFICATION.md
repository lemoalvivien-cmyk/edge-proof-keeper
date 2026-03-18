# SPRINT 6 — VERIFICATION: Système de codes d'accès premium

## Résumé de l'implémentation

Système complet de codes d'accès premium à usage contrôlé, coexistant avec Stripe.

---

## Fichiers créés / modifiés

### Nouveaux fichiers
| Fichier | Rôle |
|---|---|
| `supabase/functions/redeem-access-code/index.ts` | Edge function principale de validation des codes |
| `src/components/auth/AccessCodeActivation.tsx` | Composant UI de saisie et activation |
| `src/pages/Activate.tsx` | Page dédiée `/activate` (post-auth) |
| `src/pages/AdminAccessCodes.tsx` | Interface admin de gestion des codes |

### Fichiers modifiés
| Fichier | Modification |
|---|---|
| `supabase/functions/check-entitlement/index.ts` | Priorité au statut 'granted' avant vérification Stripe |
| `supabase/functions/stripe-webhook/index.ts` | Protège les accès 'granted' contre les événements destructifs Stripe |
| `supabase/config.toml` | Enregistrement de `redeem-access-code` |
| `src/components/ui/UpgradeWall.tsx` | CTA "J'ai un code d'accès" avec panneau repliable |
| `src/pages/Auth.tsx` | Lien discret "J'ai un code d'accès premium" |
| `src/App.tsx` | Routes `/activate` + `/admin/access-codes` |
| `src/components/layout/AppSidebar.tsx` | Item "Codes d'accès" dans le menu admin |

### Base de données (migration)
- Table `public.access_codes` — stockage hash-only, RLS admin-only
- Table `public.access_code_events` — audit trail immuable
- Colonnes ajoutées à `public.profiles` : `access_grant_source`, `access_code_id`, `access_grant_end`
- Fonction `public.has_active_subscription()` mise à jour — reconnaît `'granted'`
- Policy `"Users can update safe profile fields"` — remplace les policies permissives existantes

---

## Architecture de sécurité

```
Code secret (clair) → JAMAIS stocké
       ↓
Normalize (trim + uppercase)
       ↓
SHA-256 hash (WebCrypto)
       ↓
code_hash stocké en DB

Vérification:
  1. JWT valide
  2. Rate limit (5 req/min)
  3. Normalisation + hash côté serveur
  4. Lookup par code_hash uniquement
  5. Contrôles: is_active, valid_from, valid_until, redemptions_count
  6. Update atomique avec vérification de concurrence (optimistic lock)
  7. Mise à jour profil via service_role uniquement
  8. Audit event écrit en DB
```

---

## Scénarios de validation

| # | Scénario | Comportement attendu | ✅ |
|---|---|---|---|
| 1 | User non connecté tente redeem | 401 Unauthorized | ✅ |
| 2 | User connecté + code invalide (hash inconnu) | 404 "Code invalide ou expiré" | ✅ |
| 3 | User connecté + code désactivé (is_active=false) | 400 "Code invalide ou expiré" | ✅ |
| 4 | User connecté + code expiré (valid_until passé) | 400 "Code invalide ou expiré" | ✅ |
| 5 | User connecté + code déjà utilisé (max_redemptions atteint) | 400 "Code invalide ou expiré" | ✅ |
| 6 | User connecté + code valide → accès granted 365j | 200 + profile.subscription_status='granted' | ✅ |
| 7 | check-entitlement reconnaît 'granted' sans Stripe | entitled:true, skip Stripe | ✅ |
| 8 | RLS has_active_subscription inclut 'granted' | Tables premium lisibles | ✅ |
| 9 | Accès granted expiré → subscription_status='expired' | entitled:false | ✅ |
| 10 | Stripe actif → accès Stripe prioritaire | entitled:true, source:stripe | ✅ |
| 11 | UpgradeWall → checkout Stripe toujours disponible | Boutons Starter/Pro fonctionnels | ✅ |
| 12 | Flow UX login/signup inchangé | Pas de régression | ✅ |

---

## Instructions de déploiement

### 1. Migration DB (automatique via migration tool)
```
✅ Exécutée — tables créées, colonnes ajoutées, has_active_subscription() mise à jour
```

### 2. Edge Functions (automatique via deploy)
```
✅ redeem-access-code — déployée
✅ check-entitlement — mise à jour déployée
✅ stripe-webhook — mise à jour déployée
```

### 3. Créer un premier code (admin UI)
1. Connectez-vous en tant qu'admin
2. Accédez à /admin/access-codes
3. Cliquez "Nouveau code"
4. Renseignez un libellé (ex: "Beta tester Q1 2026")
5. Le code généré s'affiche UNE SEULE FOIS — le copier immédiatement
6. Partagez ce code au bénéficiaire

### 4. Vérification post-déploiement
```bash
# Tester la validation d'un code invalide (attendu: 401 sans token, 404 avec token)
curl -X POST https://ypjcpehbehcfjlhkrltd.supabase.co/functions/v1/redeem-access-code \
  -H "Content-Type: application/json" \
  -d '{"code": "INVALID-CODE"}'
# → 401 (pas de token)

# Tester avec token utilisateur valide
curl -X POST https://ypjcpehbehcfjlhkrltd.supabase.co/functions/v1/redeem-access-code \
  -H "Authorization: Bearer <USER_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"code": "INVALID-CODE"}'
# → {"error": "Code invalide ou expiré."}
```

---

## Points de vigilance production

- Les codes sont stockés **uniquement en hash SHA-256** — impossible de retrouver le code original
- Le générateur admin produit des codes format `XXXX-XXXX-XXXX-XXXX` (32 caractères, sans I/O/0/1)
- L'accès 'granted' **ne peut pas être écrasé** par un webhook Stripe suppression/payment_failed
- Un abonnement Stripe actif (`active`/`trialing`) **prend toujours la priorité** sur un accès granted expiré
- Les colonnes sensibles de `profiles` (subscription_status, etc.) ne sont modifiables que via `service_role`

---

## Status : ✅ SPRINT 6 COMPLET
