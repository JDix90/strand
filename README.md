# Languini

Russian practice app with:

- Home, Case Practice (Focused Drill + round runner), Vocabulary
- **PostgreSQL + Better Auth**: register with **email** or **phone** (E.164), password, then **stubbed OTP** (dev console + `/dev/otp` log table)

## Tech

- Next.js 15 (App Router)
- React 19, TypeScript
- Tailwind CSS v4
- Zustand (lesson progress in `localStorage`)
- Better Auth (email/password, email OTP, phone OTP) + Drizzle ORM + `pg`

## Run locally

1. **Database** (Docker):

   ```bash
   docker compose up -d
   ```

2. **Env**: copy [.env.example](.env.example) → `.env.local` and adjust secrets.

3. **Migrations**:

   ```bash
   npm run db:migrate
   ```

4. **App**:

   ```bash
   npm install
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000). Auth routes: `/register`, `/login`, `/verify`. In development, OTPs appear in the server terminal and on `/dev/otp`.

### Registration returns 500 / “Could not create account”

If the dev server logs show **`password authentication failed for user "postgres"`** (`28P01`), **`DATABASE_URL` in `.env.local` does not match your Postgres credentials** (this is the database user password, not your Languini account password).

- **Docker Compose** publishes Postgres on host port **15432** by default (avoids common conflicts with **5432** / **5433**). Use `postgresql://postgres:postgres@127.0.0.1:15432/languini`. To use another host port, set `POSTGRES_HOST_PORT` in a root `.env` next to `docker-compose.yml` and the same port in `DATABASE_URL` in `.env.local` (see [.env.example](.env.example)).

**If `docker compose up` says the port is already in use**, see what is listening (examples on macOS):

```bash
lsof -nP -iTCP:15432 -sTCP:LISTEN
docker ps --format 'table {{.Names}}\t{{.Ports}}'
```
- If you use another local Postgres, set `DATABASE_URL` to that server’s real user/password and ensure the `languini` database exists, then run `npm run db:migrate` again.

## Scripts

- `npm run dev` — Next.js dev server
- `npm run build` / `npm start` — production build & start
- `npm run lint` — ESLint
- `npm run test:unit` — Vitest
- `npm run test:e2e` — Playwright (lesson flow; middleware auth skipped via `E2E_SKIP_AUTH=1`)
- `E2E_WITH_DB=1 npm run test:e2e` — includes registration + OTP tests (requires Postgres + migrations)
- `npm run db:generate` / `npm run db:migrate` — Drizzle migrations

## Notes

- Phone sign-up uses a deterministic internal email (`pn…@internal.languini.dev`) so the account still has a credential password; the real number is attached after SMS OTP verification.
- Production: replace stubbed OTP senders in [`src/lib/auth.ts`](src/lib/auth.ts) with real email/SMS providers; disable or protect `/dev/otp`.
