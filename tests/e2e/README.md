# End-to-end tests (Playwright)

## Running locally

```bash
npx playwright install chromium   # once
export E2E_EMAIL='student@example.com'
export E2E_PASSWORD='your-password'
npm run test:e2e
```

The dev server starts automatically (see `playwright.config.ts`). `VITE_E2E=true` is set for the dev server so **Practice** sessions are capped at **one question**, making the authenticated flow fast.

### Supabase env and port 5173

`playwright.config.ts` **reads `.env.local`** and passes `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` (and the rest) into the **spawned** `npm run dev` process. That way the Playwright server always matches your app config.

By default **`reuseExistingServer` is off** so Playwright does not attach to an old `npm run dev` you started earlier without those variables. To reuse a running server on purpose: `PW_REUSE_SERVER=1 npm run test:e2e` (only if that server already has valid Supabase env).

## Authenticated flow (`auth-practice.spec.ts`)

Requires:

1. **Supabase env** so the Vite dev server can talk to Auth (same values as local dev):
   - `VITE_SUPABASE_URL` — Project URL from Supabase **Settings → API**
   - `VITE_SUPABASE_ANON_KEY` — anon **public** key (long JWT)

   Locally: put them in **`.env.local`** and restart `npm run dev` / Playwright.

2. **Student test user** credentials:

| Variable | Description |
|----------|-------------|
| `E2E_EMAIL` | Student account email |
| `E2E_PASSWORD` | Password |

If `E2E_EMAIL` / `E2E_PASSWORD` are unset, the authenticated suite is **skipped** and other E2E tests still pass.

If the user is **teacher** or **admin**, the test skips (those roles redirect away from student practice).

## CI (GitHub Actions)

In **Settings → Secrets and variables → Actions**, add:

| Secret | Purpose |
|--------|---------|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon key |
| `E2E_EMAIL` | Student test user |
| `E2E_PASSWORD` | Password |

The workflow `.github/workflows/ci.yml` passes these into the Playwright step so the dev server is configured the same way as your machine.

Without Supabase secrets, login stays on `/login` and the authenticated test fails.
