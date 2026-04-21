# End-to-end tests (Playwright)

## Running locally

```bash
npx playwright install chromium   # once
npm run test:e2e
```

**Authenticated login → practice → results** is **off by default**. When you have a student test user and want to run it:

```bash
export E2E_RUN_AUTH=1
export E2E_EMAIL='student@example.com'
export E2E_PASSWORD='your-password'
npm run test:e2e
```

In CI, set `E2E_RUN_AUTH` in the workflow env (or Variables) when secrets are ready.

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
| `E2E_RUN_AUTH` | Set to `1` in the workflow **when** you want the authenticated Playwright test to run (optional; omitted = skipped) |

The workflow `.github/workflows/ci.yml` passes these into the Playwright step so the dev server is configured the same way as your machine.

Without Supabase secrets, login stays on `/login` and the authenticated test fails.

## Troubleshooting

### `Login failed: Invalid login credentials`

Supabase rejected the email/password. The user must exist in **the same project** as `VITE_SUPABASE_URL` in `.env.local` (not a different Supabase project). Confirm by signing in at `/login` in the browser with the same values.

- **Local runs** use `E2E_EMAIL` / `E2E_PASSWORD` from your shell — GitHub secrets are not applied automatically.
- Reset the password in **Supabase → Authentication → Users** if needed; avoid stray spaces when copying secrets.
