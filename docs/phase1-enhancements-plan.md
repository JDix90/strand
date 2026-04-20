# Phase 1 — Enhancements: Requirements & Implementation Plans

This document specifies **requirements**, **acceptance criteria**, and **step-by-step implementation plans** for agreed product improvements. It is intentionally **documentation-only**; no code changes are implied until engineering picks up each track.

**Related codebase context**

- Game state: `src/store/gameStore.ts`, `src/lib/storage.ts`, `src/lib/cloudStorage.ts`
- Routing: `src/App.tsx`, `src/components/auth/RootRoute.tsx`, `src/components/curriculum/CurriculumV2FlatRedirect.tsx`, `src/lib/studentNavigation.ts`
- Landing: `src/screens/landing/LandingScreen.tsx` (already includes a lightweight interactive demo)
- Class notes schema: `supabase/migrations/010_class_social.sql` (`pinned`, `visible_from`, `visible_until` already exist)
- Learn / Grid: `src/screens/learn/LearnScreen.tsx`, `src/screens/grid/GridScreen.tsx`

---

## 1) Session goals (“10 min / 20 forms”) and streaks with gentle notifications

### 1.1 Problem statement

Learners lack clear **session intent** (time or volume) and **continuity motivation** (streaks). The app already tracks sessions (`session_summaries`, local history) and mastery; goals and streaks should be **additive**, not a rewrite of mastery logic.

### 1.2 Goals (product)

- Let users set optional **session goals** before or during a practice-capable mode (at minimum: Practice; optionally Speed, Grid, Memory).
- Track **daily streak** (consecutive calendar days with at least one qualifying session) and optionally **weekly consistency**.
- Use **gentle** notifications: non-blocking toasts or inline banners, **no browser push** in phase 1 unless PWA is already in place.

### 1.3 Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| G1 | User can choose goal type: **time** (e.g. 5/10/15 min) and/or **forms answered** (e.g. 10/20/50), or “No goal”. | Must |
| G2 | During session, show **progress toward goal** (elapsed time and/or count of answered items). | Must |
| G3 | On session end or goal reached, show **positive confirmation** (toast or results line). | Must |
| G4 | **Streak**: count days with ≥1 qualifying session; show on Home (or overview) and optionally after session. | Must |
| G5 | Persist streak and last activity date **per user**; sync with cloud when logged in (new table or `user_settings` JSON). | Must |
| G6 | Define **qualifying modes** for streak and goals (document: e.g. practice + speed + grid; exclude learn-only). | Must |
| G7 | **Gentle notifications**: dismissible banner after login if streak at risk (e.g. “Practice today to keep your 5-day streak”) — max once per day. | Should |
| G8 | Empty state for new users: explain goals and streaks in one sentence + link to settings. | Should |

### 1.4 Non-goals (phase 1)

- Push notifications, email digests, leaderboards.
- Penalizing users for missing days beyond streak reset (keep copy positive).

### 1.5 Data model options

**Option A (minimal):** Extend `user_settings` (or JSON column) with:

- `session_goal_preset`: `{ type: 'time' \| 'forms' \| 'none', targetMinutes?: number, targetForms?: number }`
- `streak_current`, `streak_best`, `last_streak_date` (ISO date in user’s timezone or UTC with explicit rule)

**Option B (normalized):** New table `user_streaks` with `user_id`, `current_count`, `best_count`, `last_activity_date`.

**Recommendation:** Option A for speed; migrate to Option B if analytics need history.

### 1.6 Implementation plan (step-by-step)

1. **Product spec lock:** List qualifying modes and exact streak rule (UTC midnight vs local timezone — recommend **local date** via `Intl` or `date-fns-tz` using browser timezone).
2. **Storage:** Add client fields + migration if using Postgres.
3. **Streak engine:** Pure functions in `src/lib/` (e.g. `updateStreakOnSessionComplete(lastDate, today, current)`): unit tests for edge cases (same day two sessions, timezone boundary).
4. **Session instrumentation:** In each qualifying mode’s completion path, increment `forms` count and time; call `recordSessionForStreakAndGoals()` once per session.
5. **UI — goal picker:** Small control on Practice (and siblings) — modal or header chip — store preference in `user_settings` + local merge.
6. **UI — progress:** `GameHeader` or mode-specific bar with progress ring or text.
7. **UI — Home:** Streak badge + optional “goal suggestion” copy.
8. **Gentle notification:** Use existing `SyncToastHost` pattern or a dedicated `StreakBanner` with `localStorage` key `streak_nudge_last_shown_date`.
9. **Cloud sync:** Extend `cloudLoadSettings` / `cloudSaveSettings` and RLS on `user_settings` (already user-scoped).
10. **QA:** Unit tests for streak math; manual matrix for “session at 23:59 local”.

### 1.7 Acceptance criteria

- [ ] Setting a 10-minute goal and exiting early shows partial progress; completing shows success state.
- [ ] Two sessions same calendar day increment streak by at most one day.
- [ ] Missing a calendar day resets current streak to 0; best streak preserved.
- [ ] Logged-in user sees streak restored on new device after sync.

---

## 2) Markdown or rich text for notes; sanitization; pin / schedule notes to dates

### 2.1 Problem statement

`class_notes.body` is plain text; teachers need **formatting**. The schema already has `pinned`, `visible_from`, `visible_until` — **scheduling** is partially supported but may need a **calendar day anchor** for student UX (“note for Tuesday’s class”).

### 2.2 Goals

- Teachers write notes in **Markdown** (phase 1) with **sanitized HTML** rendering for students.
- **Pin** important notes (already in DB).
- **Schedule** notes: show in context of a **date** (class session calendar) and/or within visibility window.

### 2.3 Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| N1 | Teacher editor accepts Markdown; preview before publish. | Must |
| N2 | Student/teacher view renders sanitized HTML only (no `script`, no inline event handlers). | Must |
| N3 | `pinned` notes sort first (already partially in API order). | Must |
| N4 | **Visibility:** `visible_from` / `visible_until` enforced in queries or UI (hide outside window). | Must |
| N5 | Optional **`visible_on_date`** (date, nullable): note appears on student calendar / class feed for that day. | Should |
| N6 | Comments remain plain text or same Markdown policy (decision; simpler to keep plain text). | Should |

### 2.4 Sanitization

- **Library:** DOMPurify (browser) or a server-side sanitization if ever rendering server-side (not applicable for SPA). Prefer **allowlist** tags: `p`, `br`, `strong`, `em`, `ul`, `ol`, `li`, `a` (with `rel`/`target`), `code`, `pre`, `h1–h3`.
- **Dependency:** `dompurify` + `dompurify` types; `marked` or `markdown-it` for parse.

### 2.5 Schema changes (if needed)

If `visible_on_date` is added:

```sql
-- Example; not applied in this doc
alter table public.class_notes add column if not exists visible_on_date date;
```

RLS unchanged; index `(class_id, visible_on_date)` for calendar queries.

### 2.6 Implementation plan

1. **Decide:** Markdown flavor (GFM checkbox optional — omit in v1).
2. **Dependencies:** Add `marked` + `dompurify` (or `isomorphic-dompurify` if SSR later).
3. **Module:** `src/lib/renderMarkdown.ts` — `renderSafeMarkdown(md: string): { html: string }` with tests for XSS payloads (`<script>`, `onerror=`, `javascript:` URLs).
4. **Teacher UI:** `ClassNotesPanel` — textarea + “Preview” tab + character limit; store `body` as Markdown string.
5. **Student/teacher read:** Render via `dangerouslySetInnerHTML` **only** after DOMPurify; never raw.
6. **Visibility:** Filter `fetchNotesForClass` results client-side or extend Supabase query with `or()` for null windows.
7. **Pin:** Toggle in teacher UI; `DELETE` still teacher-only.
8. **Date scheduling:** Migration + `ClassNotesPanel` date picker; `StudentCalendarScreen` shows indicator if note exists for that day (optional integration).
9. **QA:** Security review of sanitizer; Lighthouse no regression.

### 2.7 Acceptance criteria

- [ ] Pasting `<img src=x onerror=alert(1)>` does not execute.
- [ ] Notes outside `visible_from`/`visible_until` do not appear.
- [ ] Pinned notes appear first.

---

## 3) Mobile layout pass (Learn table & Grid) + PWA readiness

### 3.1 Problem statement

Learn table and Grid are **wide, dense tables**; on small viewports they are hard to use without horizontal scroll and touch targets may be too small.

### 3.2 Goals (phase 1)

- **Readable and usable** on 375px-wide viewports without losing pedagogical structure.
- **Document** PWA prerequisites for a later release (no obligation to ship service worker in phase 1).

### 3.3 Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| M1 | Learn table: horizontal scroll container with **sticky first column** (case label) OR **stacked card view** per lemma on narrow screens. | Must |
| M2 | Minimum **44×44px** touch targets for cells and legend (or equivalent padding). | Must |
| M3 | Grid: same pattern — sticky row headers or column headers where feasible. | Must |
| M4 | No horizontal overflow on **page** body (only inside intentional scroll regions). | Must |
| M5 | **PWA doc:** `manifest.json`, icons, theme-color, service worker strategy (offline scope). | Should (doc) |

### 3.4 Implementation plan — mobile

1. **Audit:** Chrome DevTools device mode on Learn + Grid; list breakpoints (e.g. `<640px`).
2. **Learn — breakpoint strategy:**  
   - `<640px`: Card view **or** table with `sticky left` column + smaller typography; test with `useMediaQuery` or CSS container queries.
3. **Legend:** Collapse case pills to horizontal scroll or accordion “Cases”.
4. **Mastery chips:** Ensure touch-friendly (already refactored to symbols).
5. **Grid:** Mirror Learn patterns; ensure keyboard mode still works on desktop.
6. **Visual QA:** Real device pass (iOS Safari).

### 3.5 PWA readiness (documentation-only tasks)

1. Add `vite-plugin-pwa` or manual `manifest.webmanifest` checklist.
2. Define **offline scope:** none for v1; “learn table read-only cache” as future.
3. **Icons:** 192/512 PNGs, maskable.
4. **Service worker:** ship only when stable; document update strategy.

### 3.6 Acceptance criteria

- [ ] Learn + Grid usable on iPhone SE width without broken layout.
- [ ] Lighthouse “Tap targets” warnings reduced or eliminated on those routes.

---

## 4) Demo mode on landing without account

### 4.1 Current state

`LandingScreen` already renders `generateQuestion` + `QuestionCard` + answer flow for guests (`RootRoute` → `LandingScreen` when `!profile`). This is a **partial** demo.

### 4.2 Goals

- Expand **demo depth** without account: multiple question types, mode previews, or short “lesson path” without persisting mastery to cloud.
- Clear **CTA** to sign up; no confusion that progress is saved.

### 4.3 Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| D1 | Demo remains **fully client-side**; no Supabase writes for guests. | Must |
| D2 | If localStorage is used for demo progress, prefix keys `demo_` and never merge into `cd_mastery_records`. | Must |
| D3 | Expandable: **2–3** demo questions or rotating modes (Practice + Speed preview). | Should |
| D4 | Copy: “Progress not saved” / “Create account to save progress.” | Must |
| D5 | Optional: link “Try full Learn table” → read-only screenshot or static HTML (no full auth). | Could |

### 4.4 Implementation plan

1. Inventory current `LandingScreen` demo flow and `DEMO_FORM_KEYS`.
2. Add `demoSession` state: question index, score, optional timer for speed preview.
3. Namespace any persistence with `demo_*` keys only.
4. **Marketing:** Add section comparing guest demo vs account benefits.
5. **Analytics (optional):** `navigator.sendBeacon` or anonymous event — privacy review first.

### 4.5 Acceptance criteria

- [ ] Guest completes demo; no rows in `mastery_records` for anonymous users.
- [ ] Sign-in does not import demo keys into real progress.

---

## 5) Dual navigation: global `/practice` vs class-scoped `/class/...` — UX review and improvement plan

### 5.1 Problem statement

Students may use:

- **Flat routes:** `/practice`, `/learn`, … wrapped in `CurriculumV2FlatRedirect` when `VITE_CURRICULUM_V2` is enabled.
- **Class-scoped:** `/class/:classId/unit/:unitId/practice`, etc.

This creates **two mental models** and developer confusion.

### 5.2 Design principles

1. **One primary path:** For enrolled students, class-scoped URLs should be the **canonical** place for curriculum-bound work.
2. **Predictable redirects:** Redirects should be fast, explainable, and not “flash” wrong content.
3. **Teacher/admin:** Unchanged; problem is student-focused.

### 5.3 Requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| N1 | Document **canonical URL** policy in README or `docs/navigation.md`. | Must |
| N2 | When `VITE_CURRICULUM_V2` is on, students with classes hitting `/practice` land on **class-scoped** URL with **same mode** (preserve behavior). | Must (already) |
| N3 | **Breadcrumb or scope chip** on game screens: “Class: {name} · Unit: {title}” when scoped. | Should |
| N4 | **Sidebar / nav:** If student has class, prefer **Overview** + **class workspace** link; de-emphasize duplicate flat links in copy. | Should |
| N5 | Students **without** class: flat routes remain valid; no redirect. | Must |
| N6 | **Developer:** Single helper `buildModePath({ classId?, unitId?, mode })` used everywhere; grep for raw string paths. | Should |

### 5.4 Implementation plan

1. **Author `docs/navigation.md`:** Decision tree (student with/without class; env flag).
2. **UI — scope chip:** Shared component `CurriculumScopeBar` reading `CurriculumContext` + route params.
3. **HomeScreen:** For students with classes, primary CTAs use `buildClassUnitModePath` instead of `/practice` when unit resolvable.
4. **Settings / help:** Short FAQ entry: “Why did my URL change?”
5. **Redirect component:** Review loading state; consider `flushSync` or skeleton to avoid flash (optional).
6. **Tech debt:** ESLint rule or custom script to forbid new `/practice` string literals in student-only components.

### 5.5 Acceptance criteria

- [ ] With V2 on, student with class never sees `/practice` in address bar after navigation settles (unless product decision).
- [ ] New contributors can read one doc and understand routing.

---

## 6) Accessibility (a11y) and internationalization (i18n)

### 6.1 Accessibility — requirements

| ID | Requirement | Priority |
|----|-------------|----------|
| A1 | All interactive controls **keyboard reachable**; visible focus ring. | Must |
| A2 | Game modes: announce **question changes** to screen readers (`aria-live` region). | Should |
| A3 | `aria-label` on icon-only buttons (Learn legend, close buttons, streak icons). | Must |
| A4 | Color + **non-color** cues for correctness (already partially true). | Must |
| A5 | Respect `prefers-reduced-motion` for animations. | Should |

### 6.2 Internationalization — should every string have a Russian equivalent?

**Recommendation:** **No** — not every string needs Russian in phase 1.

**Rationale**

- **UI chrome** (buttons, settings, errors): typically **one UI language** per user preference (English *or* Russian), not bilingual labels per screen.
- **Teaching content** (prompts, examples, declension forms): **Russian** is the subject; English may appear as gloss — this is **content**, not “translation of UI.”

**Suggested model**

| Layer | Language strategy |
|-------|-------------------|
| **UI strings** | Single locale (`en` or `ru`) from i18n dictionary; user selects in Settings or browser `Accept-Language`. |
| **Educational content** | Already Russian; English gloss from `settings.showEnglishGloss` — keep separate from i18n. |
| **Marketing / landing** | Optional: English default + Russian landing variant later. |

### 6.3 i18n implementation plan (incremental)

1. **Library:** `react-i18next` or `typesafe-i18n` or lightweight `useTranslation` with JSON files `en.json`, `ru.json`.
2. **Scope phase 1:** Extract strings for **Settings**, **Home**, **auth**, **nav** only (~50–100 keys).
3. **Keys:** `settings.clearProgress.title`, not English text as key.
4. **Fallback:** `en` default if `ru` missing.
5. **Do not** duplicate Russian learning content into `ru.json` — only UI chrome.
6. **QA:** Pseudolocale or long-string test for layout breakage.

### 6.4 a11y implementation plan (incremental)

1. **Audit:** axe DevTools on Home, Practice, Learn, Settings.
2. **Fix:** Focus order and labels (batch PR).
3. **Live region:** Practice screen `aria-live="polite"` for feedback.
4. **Document:** `docs/a11y.md` checklist for new features.

### 6.5 Acceptance criteria

- [ ] Keyboard-only user can complete one practice question and navigate home.
- [ ] Switching UI to Russian (when implemented) does not change declension prompts incorrectly.

---

## 7) Other critical improvements recommended for phase 1

These are **high leverage** relative to effort; align with earlier risk review.

### 7.1 Automated tests for core flows

- **Requirement:** Minimum **one** Playwright test with auth (storageState) for: login → practice → session summary.
- **Plan:** Add `tests/e2e/fixtures/auth.setup.ts`, CI secret for test user, document in README.

### 7.2 Error boundaries

- **Requirement:** Route-level or mode-level boundary so one bad render does not blank the app.
- **Plan:** `react-error-boundary` wrapper in `App.tsx` around `Routes` or per lazy screen.

### 7.3 RLS / security checklist per release

- **Requirement:** When adding tables or policies, run checklist: SELECT/INSERT/DELETE for student, teacher, stranger.
- **Plan:** `docs/rls-checklist.md` template; link from PR template.

### 7.4 Sync transparency

- **Requirement:** Subtle “Saved” / “Syncing…” for cloud writes (beyond failure toasts).
- **Plan:** Extend `runCloudWriteWithRetry` callbacks or Zustand `syncStatus` flag.

### 7.5 Bundle / performance budget

- **Requirement:** Track bundle size in CI; lazy-load Markdown when added.
- **Plan:** `vite build --report` or `rollup-plugin-visualizer` optional.

---

## Suggested sequencing (cross-cutting)

| Wave | Items | Rationale |
|------|--------|-----------|
| **Wave A — Safety & clarity** | §7.2 Error boundaries, §7.3 RLS checklist, §5 navigation docs + scope chip | Reduces support burden |
| **Wave B — Mobile** | §3 Learn/Grid | Broad user impact |
| **Wave C — Engagement** | §1 goals + streaks | Depends on settings/sync patterns |
| **Wave D — Class social depth** | §2 Markdown + scheduling | Builds on existing schema |
| **Wave E — Growth** | §4 demo expansion | Marketing funnel |
| **Wave F — i18n/a11y** | §6 | Ongoing; start with a11y audit + i18n scaffolding |

---

## Document control

| Version | Date | Notes |
|---------|------|-------|
| 1.0 | 2026-04-02 | Initial planning doc |
