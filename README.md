# Languini

**Languini** is a web application for practicing **Russian nominal declension** (cases, pronouns, names, nouns) across multiple game modes, with **adaptive review**, **class-based curriculum**, and **cloud-synced progress** via [Supabase](https://supabase.com).

Students can join classes, follow teacher-paced units, and practice in scoped routes. Teachers manage classes, curriculum visibility, assignments, and analytics. Admins have separate tools for users, classes, and site settings.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Build | Vite 8 |
| State | Zustand 5 |
| Routing | React Router 7 |
| Backend | Supabase (Auth, Postgres, Row Level Security) |
| E2E | Playwright (optional) |

---

## Prerequisites

- **Node.js** 18+
- **npm** 9+
- A **Supabase project** with migrations applied (see [Database setup](#database-setup))

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Environment variables

Copy [`.env.example`](.env.example) to `.env.local` and set:

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_SUPABASE_URL` | Yes | Project URL (e.g. `https://xxxx.supabase.co`) |
| `VITE_SUPABASE_ANON_KEY` | Yes | Anon/public key from Supabase Dashboard → API |
| `VITE_CURRICULUM_V2` | No | If `1` or `true`, students with a class may be redirected from legacy flat routes (`/practice`, etc.) to class-scoped URLs |

Restart `npm run dev` after changing env vars.

### 3. Database setup

Apply SQL migrations in order from [`supabase/migrations/`](supabase/migrations/) to your Supabase project (CLI: `supabase db push`, or run files in the SQL editor). Key migration:

- [`005_curriculum.sql`](supabase/migrations/005_curriculum.sql) — subjects, topics, units, `class_curriculum`, mastery `unit_id` scope, and related RLS.

Earlier migrations define profiles, classes, memberships, assignments, and admin helpers.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with hot reload |
| `npm run build` | Typecheck + production bundle to `dist/` |
| `npm run preview` | Serve production build locally |
| `npm run lint` | ESLint |
| `npm run test:e2e` | Playwright tests (starts dev server unless configured otherwise) |

---

## Student navigation (support)

- Visiting **`/`** while signed out shows the **marketing landing** (sample question + mode previews); **Sign in** / **Create account** go to `/login` and `/signup`. After sign-in, **students with at least one class** land on **`/class/:classId`** (class workspace with sidebar).
- **`/home`** is the **Overview** dashboard: stats, mode grid, and cross-class shortcuts; use the sidebar link “Overview” to open it. The selected class for the sidebar and default scoped routes is stored under `cd_student_sidebar_class` (see [`docs/localStorage-keys.md`](docs/localStorage-keys.md)).

---

## Game modes

| Mode | Description |
|------|-------------|
| Learn Table | Interactive declension table |
| Practice | Adaptive fill-in-the-blank |
| Speed Round | Timed blitz |
| Boss Battle | Team vs boss |
| Memory Match | Card matching |
| Grid Challenge | Full grid completion |

---

## Data and persistence

Progress uses a **hybrid** model:

- **Browser**: `localStorage` for offline-capable cache and migration ([`src/lib/storage.ts`](src/lib/storage.ts)).
- **Cloud**: When signed in, mastery, settings, and session summaries sync to Supabase ([`src/lib/cloudStorage.ts`](src/lib/cloudStorage.ts), [`src/store/gameStore.ts`](src/store/gameStore.ts)).

Settings include a **Clear progress** path in the app.

---

## Project structure (high level)

```
src/
  App.tsx                 # Routes (lazy-loaded screens via lazyScreens.ts)
  components/             # UI, game, student shell, SyncToastHost, curriculum guards
  contexts/               # Auth, curriculum
  layouts/                # Student home / class layouts
  screens/                # Auth, home, modes, teacher, student, admin
  store/                  # Zustand game store
  lib/                    # Adaptive engine, question gen, Supabase helpers, sync toasts
  lazyScreens.ts          # React.lazy route chunks
  data/                   # Russian forms, templates, configs
supabase/migrations/      # SQL schema + RLS
docs/                     # ADRs, curriculum lock policy, localStorage keys
tests/e2e/                # Playwright smoke tests
```

---

## Deployment

1. Run `npm run build` and host the **`dist/`** output on any static host (Netlify, Vercel, S3, etc.).
2. Configure the same **`VITE_*`** env vars in the hosting dashboard.
3. Ensure the Supabase project has migrations applied and Auth redirect URLs include your production origin.

---

## Documentation

- [`Planning.md`](Planning.md) — plain-English app overview for humans and AI (feature planning context)
- [`docs/ADR-001-curriculum-mastery.md`](docs/ADR-001-curriculum-mastery.md) — curriculum URLs and mastery keys
- [`docs/curriculum-lock-policy.md`](docs/curriculum-lock-policy.md) — optional `lock_policy` JSON for teachers
- [`docs/localStorage-keys.md`](docs/localStorage-keys.md) — `cd_*` client keys

---

## License

This project is provided for educational use.
