# Languini — planning context for the codebase

This document describes **what Languini is**, **who uses it**, and **which features and constraints already exist**. It is meant to be shared with an AI (or a human) when planning new work so proposals align with the real architecture instead of inventing parallel systems.

---

## What Languini is

**Languini** is a **web application** for practicing **Russian nominal declension**—correct forms of pronouns, names, and nouns across the six grammatical cases. Students work through **several game modes** (study table, adaptive practice, timed drills, boss battle, memory, grid). The app tracks **per-form mastery**, runs an **adaptive review queue**, and can **sync progress to the cloud** when the user signs in.

The product also supports **classes**: teachers create classes with join codes, assign **curriculum units** and **assignments**, and view **analytics**. **Admins** have separate tools for users, classes, and site-wide settings.

---

## Technology (high level)

| Area | Choice |
|------|--------|
| UI | React 19, TypeScript, Tailwind CSS v4 |
| Build | Vite |
| Client state | Zustand (`src/store/gameStore.ts`) |
| Routing | React Router 7 (`src/App.tsx`) |
| Backend | **Supabase** — Auth, Postgres, Row Level Security |
| E2E | Playwright (`tests/e2e/`) |

There is **no custom Node server** in this repo; the app is a static SPA that talks to Supabase. **Environment variables** (see `.env.example`) include `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and optionally `VITE_CURRICULUM_V2` (see [Routing](#routing-flat-vs-class-scoped)).

---

## Users and roles

- **`student`** — Practices, joins classes, follows class curriculum, completes assignments. Sign-up allows student or teacher only; **admin is not a public sign-up role**.
- **`teacher`** — Creates/manages classes, configures per-class curriculum, creates assignments, views per-class analytics and student detail.
- **`admin`** — Full admin screens (`/admin/...`). Admins also get an **effective role** toggle (`student` vs `teacher`) stored in `localStorage` (`cd_admin_effective_role`) so they can browse the app as either experience; the top **AdminRoleBar** reflects this.

Authentication state lives in **`AuthContext`** (`src/contexts/AuthContext.tsx`): session, profile from `profiles` (role, display name, email), and helpers for sign-up, sign-in, sign-out, profile updates.

---

## Domain: Russian declension content

- **Cases**: nominative, genitive, dative, accusative, instrumental, prepositional.
- **Word categories**: `pronoun`, `name`, `noun`.
- Declension data is largely **static TypeScript/data** under `src/data/` (e.g. `allForms.ts`, `pronounForms.ts`, `nounForms.ts`, `nameForms.ts`, `caseMetadata.ts`, `confusionPairs.ts`).
- **Questions** are built from templates (`questionTemplates.ts`), sentence frames (`sentenceFrames.ts`), and a **question generator** (`src/lib/questionGenerator.ts`) that picks forms, builds distractors (same lemma/other case, confusion pairs, etc.), and respects mode and difficulty.

Mastery is tracked **per linguistic form** using a stable **`formKey`** (lemma + case identity in practice). In the database, progress is scoped by **`unit_id`** and **`form_key`** (see [Progress and sync](#progress-and-sync)).

---

## Curriculum model (database + app behavior)

The app generalizes beyond “one flat Russian course” using a hierarchy (see `docs/ADR-001-curriculum-mastery.md`):

- **Subject** → **Topic** → **Unit** (units are the smallest assignable curriculum entity).
- Each **unit** has:
  - `content_module` — string id for which “kind” of content this is (see [Content modules](#content-modules-beyond-russian-declension)).
  - `content_config` — JSON (e.g. which cases and word categories apply for Russian declension).

**Per class**, teachers attach units via **`class_curriculum`** with ordering, visibility, optional **`unlock_at`** (time lock), and optional **`lock_policy`** JSON for **prerequisite units** (average mastery threshold on other units before this one unlocks). Client-side evaluation lives in `src/lib/lockPolicy.ts` together with `describeRowLock` in `src/lib/studentNavigation.ts`.

A **default seeded unit** id exists for legacy/backfill: `DEFAULT_RUSSIAN_UNIT_ID` in `src/lib/curriculumConstants.ts` (must match migrations). Older progress without a unit concept maps here.

**`CurriculumContext`** (`src/contexts/CurriculumContext.tsx`) holds the active **`classId`**, **`unitId`**, loaded **`unitRow`**, and **derived filters** (`effectiveCategories`, `filterCaseIds`) from the unit’s config when the module is Russian declension; otherwise it falls back to user settings. Game screens and engines use this context so the same mode code can run **globally** or **scoped to a unit**.

---

## Content modules (beyond Russian declension)

The codebase is structured for **pluggable modules**:

- **`russian_declension`** — Full feature set: all modes, rich forms data, adaptive mastery as described above.
- **`vocabulary_stub`** — Proof-of-concept module with **limited modes** (`practice` and `learn_table` only per `modesForContentModule` in `src/lib/contentModules.ts`). Used to show how non-declension units could behave.

When planning features, check **`content_module`** and **`modesForContentModule`** before assuming every mode exists for every unit.

---

## Game modes (what exists today)

| Mode id | User-facing name | Role in the app |
|--------|-------------------|-----------------|
| `learn_table` | Learn Table | Interactive declension table / study UI |
| `practice` | Practice | Core **adaptive** fill-in-the-blank; uses mastery + adaptive queue |
| `speed_round` | Speed Round | Timed blitz (e.g. 60s, penalties for wrong answers — see `gameConfigs.ts`) |
| `boss_battle` | Boss Battle | Boss HP, team damage/heals/shields — logic in `src/lib/bossEngine.ts` |
| `memory_match` | Memory Match | Card matching |
| `grid_challenge` | Grid Challenge | Full or partial grid completion (`GridChallengeConfig` in types) |

**Boss** and **grid** have dedicated configs in `src/data/gameConfigs.ts`. **Practice** leans on `adaptiveEngine.ts` for mastery updates, queueing weak forms, confusion tracking, etc.

**Results**: `ResultsScreen` exists at both flat `/results` and under class unit routes; session summaries feed stats and history.

---

## Routing: flat vs class-scoped

**Flat routes** (always present): `/home`, `/settings`, `/learn`, `/practice`, `/speed`, `/boss`, `/memory`, `/grid`, `/results`, `/intro/...`, `/join-class`, `/assignments`.

**Class workspace** for students: `/class/:classId` with nested **`/class/:classId/unit/:unitId/<mode>`** where `<mode>` is `learn`, `practice`, `speed`, `boss`, `memory`, `grid`, or `results`. The unit segment sets curriculum scope via **`SyncCurriculumFromRoute`** updating **`CurriculumContext`**.

**Entry behavior**:

- `/` uses **`RootRoute`**: unauthenticated → public **landing** (`LandingScreen`); teacher → `/teacher`; admin → `/admin`; students → **`StudentEntryRoute`** which sends users with at least one class membership to **`/class/:classId`** (preferring `cd_student_sidebar_class` when valid), else **`/home`**.

**Optional strict curriculum routing**: If `VITE_CURRICULUM_V2` is `1` or `true`, **`CurriculumV2FlatRedirect`** wraps flat mode routes and **redirects students** who have a class + resolvable default unit to the corresponding **`/class/.../unit/.../...`** URL. If the flag is off, flat routes remain usable for everyone without that redirect.

Helpers for building paths and resolving default units: `src/lib/studentNavigation.ts` (also documents `cd_*` keys; see `docs/localStorage-keys.md`).

---

## Progress and sync

**Hybrid model**:

1. **`localStorage`** — Primary client cache: mastery records, adaptive queue, settings, session history list — via `src/lib/storage.ts`. Keys are namespaced; some curriculum keys are documented under `docs/localStorage-keys.md`.
2. **Supabase** — When logged in, `gameStore` loads/saves:
   - **`mastery_records`** — Composite identity `(user_id, unit_id, form_key)`; sync helpers in `src/lib/cloudStorage.ts`.
   - **`user_settings`** — Mirrors app settings (audio, difficulty, helper words, gloss, active categories).
   - **`session_summaries`** — Recent session stats for history.

On first login, **local data can migrate** to the cloud (`migrateLocalToCloud`). Mastery keys in the client combine **`unitId`** and **`formKey`** (`src/lib/masteryKeys.ts`).

**Sync UX**: `SyncToastHost` + `syncNotifications` / `runCloudWriteWithRetry` surface retrying writes for offline/flaky network.

**Settings** (`/settings`): includes profile updates, learning preferences, and a **clear local progress** path as implemented in the app.

---

## Teacher-facing features

- **Dashboard** (`/teacher`) — Lists classes (teachers see own classes; admins may see all — check `TeacherDashboard` implementation).
- **Class list** (`/teacher/classes`) and **class detail** (`/teacher/class/:classId`) — Students, curriculum checklist, assignments list, links to analytics and creating assignments.
- **Curriculum** — Teachers configure which catalog **units** appear, order, visibility, unlock times, and lock policies (`TeacherCurriculumChecklist`, `ClassCurriculumSection`, `curriculumApi.ts`).
- **Assignments** — Create form at `/teacher/assign/:classId`: title, description, **mode**, case/category filters, min questions/accuracy, due date, optional **`unit_id`** linking to curriculum. Stored in **`assignments`**.
- **Analytics** (`/teacher/analytics/:classId`) — Class-level analytics.
- **Student detail** (`/teacher/student/:studentId`) — Per-student teacher view.

---

## Student-facing features (beyond practice)

- **Join class** (`/join-class`) — Enroll via join code into `class_memberships`.
- **Assignments** (`/assignments`) — List of assignments across classes; completion tracking as implemented in `AssignmentsScreen` and sidebar.
- **Student class home** — `StudentClassLayout` + sidebar (`StudentCurriculumSidebar`) for unit navigation, due assignments, and links to **Overview** (`/home`).
- **Getting started / intro** — Optional content: alphabet, phrases, interactive quizzes/match/typing (`/intro`, `/intro/alphabet`, `/intro/phrases`, `/intro/play`). This is **separate** from the core declension game data but uses shared UI patterns.

---

## Admin-facing features

- **`/admin`** — Dashboard cards to Users, Classes, Site settings.
- **Users** (`/admin/users`), **Classes** (`/admin/classes`), **Site settings** (`/admin/site`) — Operational tooling backed by Supabase tables and RLS (see migrations in `supabase/migrations/`).

---

## Important files and folders (for implementers)

| Location | Purpose |
|----------|---------|
| `src/App.tsx` | Route table and guards |
| `src/contexts/AuthContext.tsx` | Auth + profile |
| `src/contexts/CurriculumContext.tsx` | Active class/unit and filters |
| `src/store/gameStore.ts` | Mastery, settings, sessions, init + cloud merge |
| `src/lib/adaptiveEngine.ts` | Mastery updates, adaptive queue, stale review |
| `src/lib/curriculumApi.ts` | Units, class curriculum fetch/update |
| `src/lib/cloudStorage.ts` | Supabase persistence for progress |
| `src/data/` | Russian forms, templates, game constants |
| `supabase/migrations/` | Schema, RLS, seeds |
| `docs/` | ADRs, lock policy, localStorage keys, session notes |

---

## Testing and quality

- **ESLint** — `npm run lint`
- **Playwright** — `npm run test:e2e` (e.g. `tests/e2e/curriculum.spec.ts` for curriculum flows)

---

## Constraints to remember when planning features

1. **Progress is keyed by `unit_id` + `form_key`** for Russian declension; changing key schemes requires migration and backfill strategy.
2. **Not every unit supports every mode** — check `contentModules.ts`.
3. **Teachers vs students vs admins** — Route guards use `RequireAuth` + `requiredRole`; admins impersonate student/teacher via **effective role**, not separate accounts.
4. **Flat routes vs class routes** — Feature work should clarify whether it applies to global practice, class-scoped practice, or both; respect `VITE_CURRICULUM_V2` when changing navigation.
5. **RLS and migrations** — Any new table or policy belongs in Supabase migrations; the client assumes RLS allows what the UI attempts.

---

## Related documentation in the repo

- `README.md` — Setup, scripts, deployment
- `docs/ADR-001-curriculum-mastery.md` — Curriculum URLs, assignments, mastery keys
- `docs/curriculum-lock-policy.md` — Teacher `lock_policy` JSON
- `docs/localStorage-keys.md` — `cd_*` client keys

Use those for **deep detail**; use **this file** for a single **planning-oriented overview** of behavior and boundaries.
