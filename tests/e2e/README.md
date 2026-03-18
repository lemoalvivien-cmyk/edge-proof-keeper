# SECURIT-E — E2E Tests README

## What is tested

These E2E tests verify:
1. **Public routes** — pages accessible without auth load correctly
2. **Auth protection** — protected pages redirect unauthenticated users
3. **Forbidden claims** — marketing pages don't contain prohibited language
4. **Error handling** — 404 and error states are handled gracefully

## What requires a live test account (NON PROUVABLE automatiquement)

The following flows require a real test account and cannot be automated without credentials:

- `signup → login → dashboard` (requires valid email + password)
- `user sans accès → paywall` (requires logged-in user without subscription)
- `access code redemption` (requires valid code + auth)
- `admin access-codes management` (requires admin role)
- `export proof pack` (requires admin + subscription)
- `Stripe checkout` (requires Stripe test mode account)

## Running E2E tests

```bash
# Install browsers (one time)
npx playwright install chromium

# Run against preview
PLAYWRIGHT_BASE_URL=https://id-preview--535f1714-f91a-45af-915d-b9aa9bc9cf0a.lovable.app npx playwright test

# Run against local dev
PLAYWRIGHT_BASE_URL=http://localhost:5173 npx playwright test
```

## Status

| Test | Status | Notes |
|------|--------|-------|
| Landing loads | ✅ Automated | |
| /pricing loads | ✅ Automated | |
| /faq loads | ✅ Automated | |
| /status loads | ✅ Automated | |
| /auth loads | ✅ Automated | |
| /activate loads | ✅ Automated | |
| Protected redirect | ✅ Automated | |
| 404 handling | ✅ Automated | |
| Full auth flow | 🔒 Manual | Requires test account |
| Paywall logic | 🔒 Manual | Requires subscription state |
| Access code flow | 🔒 Manual | Requires valid code |
| Admin flows | 🔒 Manual | Requires admin role |
| Stripe checkout | 🔒 NON PROUVABLE | Requires Stripe test mode |
