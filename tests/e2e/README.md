# End-to-end tests (Playwright)

## Running locally

```bash
npx playwright install chromium   # once
npm run test:e2e
```

The dev server starts automatically (see `playwright.config.ts`). `VITE_E2E=true` is set for the dev server so **Practice** sessions are capped at **one question**, making the authenticated flow fast.

## Authenticated flow (`auth-practice.spec.ts`)

Requires a **real Supabase-backed** app (`.env` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`) and a **student** test user:

| Variable | Description |
|----------|-------------|
| `E2E_EMAIL` | Student account email |
| `E2E_PASSWORD` | Password |

If either is unset, the suite is **skipped** and other E2E tests still pass.

If the user is **teacher** or **admin**, the test skips (those roles redirect away from student practice).

## CI

GitHub Actions: `.github/workflows/ci.yml` runs unit tests, `build:analyze` (bundle visualization), uploads `dist/stats.html` as an artifact, then runs Playwright. Add repository secrets `E2E_EMAIL` and `E2E_PASSWORD` to execute the authenticated test in CI.
