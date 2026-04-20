# Navigation and URL policy

This document explains how **flat** routes (`/practice`, `/learn`, …) relate to **class-scoped** routes (`/class/:classId/unit/:unitId/...`) for students.

## Canonical URLs

- **Students with at least one class enrollment:** Curriculum-bound work should use **class-scoped** URLs when a unit is known. The app resolves a default unit from class context and builds paths with `buildClassUnitModePath` (see `src/lib/studentNavigation.ts`).
- **Students without a class:** Flat routes remain **valid and primary** (`/practice`, `/learn`, `/home`, …).
- **Teachers and admins:** Teacher dashboards and class management use `/teacher/...` and `/admin/...` as today.

## Curriculum v2 redirect

When `VITE_CURRICULUM_V2` is enabled, `CurriculumV2FlatRedirect` wraps flat game routes. For enrolled students, navigation typically lands on the **class + unit** path for the same mode so the address bar matches the mental model “I am practicing this unit in this class.”

## Scope UI

Game screens that run inside a class unit show **`CurriculumScopeBar`** (class name · unit title) when `CurriculumContext` supplies `classId` and unit metadata.

## FAQ (user-facing)

See Settings → “Why did my URL change?” — short explanation is also in `src/locales/en.json` / `ru.json` under `settings.faqUrlBody`.

## Contributors

- Prefer **`buildClassUnitModePath`** / **`buildStudentModePath`** over hard-coding `/class/...` strings when the caller has `classId`, `unitId`, and `ModeId`.
- Avoid new student-facing literals like `navigate('/practice')` when the user is in a class unit context; use the helpers above.
