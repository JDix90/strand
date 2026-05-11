# Playwright E2E

Config: [`playwright.config.cjs`](../../playwright.config.cjs) (CommonJS so Playwright can load it reliably.)

## Default (`npm run test:e2e`)

- Starts Next on **port 3000** with **`E2E_SKIP_AUTH=1`** so lesson flows run without signing in.
- Covers the phase-1 happy path (`phase1-happy-path.spec.ts`).

## Full auth + DB (`E2E_WITH_DB=1`)

1. `docker compose up -d`
2. `npm run db:migrate`
3. `E2E_WITH_DB=1 npm run test:e2e`

This runs `auth-registration.spec.ts` (email + phone register → read OTP from `/dev/otp` → verify).

## Reuse a running dev server

```bash
PW_REUSE_SERVER=1 npm run test:e2e
```
