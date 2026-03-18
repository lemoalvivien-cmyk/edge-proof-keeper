# Configuration Email — SECURIT-E

## État actuel

Les emails d'authentification Supabase (confirmation, reset password) sont envoyés depuis le domaine par défaut `@supabase.co`.  
Les adresses référencées dans l'application sont :
- `contact@securit-e.com` — contact général / support
- `dpo@securit-e.com` — DPO / RGPD
- `support@securit-e.com` — support technique

## Configuration d'un domaine custom pour les emails Auth

### 1. Domaine email Lovable Cloud
1. Aller dans **Lovable Cloud → Emails → Domains**
2. Cliquer **Add Domain** et entrer `securit-e.com`
3. Ajouter les enregistrements DNS fournis (SPF, DKIM, DMARC) chez votre registrar
4. Attendre la vérification (jusqu'à 72h)

### 2. Templates d'emails Auth personnalisés
Une fois le domaine vérifié :
- Les emails de confirmation, reset password, magic link sont envoyés depuis `noreply@securit-e.com`
- Personnaliser les templates dans **Cloud → Emails → Templates**

### 3. Emails transactionnels (contact, support)
Pour envoyer des emails depuis l'application (formulaires de contact, alertes) :
- Utiliser **Resend** (https://resend.com) avec le domaine `securit-e.com`
- Ajouter `RESEND_API_KEY` dans les secrets Lovable Cloud
- Implémenter une edge function `send-contact-email`

### 4. Configuration SMTP Supabase Auth (alternative)
Dans **Supabase Auth → Settings → SMTP** :
```
Host: smtp.resend.com
Port: 465
User: resend
Password: <RESEND_API_KEY>
Sender: noreply@securit-e.com
```

## Adresses email unifiées sur securit-e.com

| Usage | Adresse |
|-------|---------|
| Contact général | contact@securit-e.com |
| DPO / RGPD | dpo@securit-e.com |
| Support technique | support@securit-e.com |
| Auth (noreply) | noreply@securit-e.com |

> **Note :** L'ancienne adresse `dpo@securit-e.fr` a été unifiée sur `dpo@securit-e.com` 
> pour cohérence avec le domaine principal.
