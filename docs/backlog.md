# Backlog — follow-ups from phase 1 & E2E

Short list of **deferred** or **recommended** work. Not committed timelines.

## Deferred

- **Authenticated Playwright (`auth-practice.spec.ts`)** — Requires `E2E_RUN_AUTH=1` plus valid `E2E_EMAIL` / `E2E_PASSWORD` for a **student** user in the same Supabase project as `VITE_SUPABASE_URL`. Enable in CI when secrets and a stable test user are confirmed (`tests/e2e/README.md`).

## Product / UX (from phase 1 plan)

- ~~**Student calendar + `visible_on_date`**~~ — Done: `fetchStudentCalendarNotes` + `StudentCalendarScreen` grid, agenda, and day modal.
- **Landing / demo** — Optional “Try Learn table” static preview; more demo depth if marketing needs it.
- **i18n** — Extend `en` / `ru` beyond Home / Settings / nav as you add screens.
- **a11y** — `prefers-reduced-motion` pass; axe/Lighthouse on key routes periodically.

## Engineering

- **Apply migration `011`** on production Supabase if not already (`user_settings` streak/goals, `class_notes.visible_on_date`).
- **CI: `E2E_RUN_AUTH`** — Add `E2E_RUN_AUTH: '1'` to the Playwright job only when you want the auth test in GitHub Actions.
- **Bundle budget** — Optional: fail CI if `dist` JS exceeds a threshold (today we only upload `stats.html` from `build:analyze`).
- **Fork PRs** — Secrets are unavailable to workflows from forks; expect auth E2E to stay skipped there unless you use a different strategy.

## Docs

- Keep **`docs/navigation.md`**, **`docs/a11y.md`**, **`docs/rls-checklist.md`**, **`docs/pwa-readiness.md`** updated when behavior changes.
