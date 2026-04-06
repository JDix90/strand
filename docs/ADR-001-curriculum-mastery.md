# ADR-001: Curriculum hierarchy, URLs, assignments, and mastery keys

## Status

Accepted — implementation aligns with this document.

## Context

The app was built around Russian nominal declension (cases, pronouns/names/nouns). We are generalizing to subjects → topics → units with per-class teacher control while preserving existing user progress.

## Decisions

### Hierarchy (MVP)

- **Subject**: Top-level subject line (e.g. Russian language).
- **Topic**: Thematic grouping (e.g. Nominal declension).
- **Unit**: Smallest curriculum entity tied to a **content module** + **JSON config** (cases, categories, etc.). Chapters deferred.

### URL scheme

- Class-scoped navigation: `/class/:classId/unit/:unitId/<mode>` where `<mode>` is `practice`, `learn`, `speed`, `boss`, `memory`, `grid`, `results`.
- Legacy routes (`/practice`, `/home`, …) remain; when no unit is active, behavior uses **global user settings** (backward compatible).

### Assignments

- Extend `assignments` with nullable `unit_id` FK to `units`. Existing rows remain valid (`unit_id` null = legacy case-only assignment).

### Mastery keys

- **Composite uniqueness**: `(user_id, unit_id, form_key)` on `mastery_records`.
- `form_key` remains the Russian lemma:case string for the `russian_declension` module.
- **Legacy rows** backfilled to a seeded **default unit** so all prior progress maps to one curriculum unit before teachers split visibility.

### Content modules (hybrid)

- **DB**: `units.content_module` (text) + `units.content_config` (jsonb).
- **Code**: Registry maps `content_module` → resolver for allowed modes, categories, cases, and question generation hooks. First module: `russian_declension`. Second: `vocabulary_stub` (proof only).

## Consequences

- Migrations must run before client deploy; mastery backfill is idempotent.
- Teachers see curriculum UI per class; students need `classId` in route for sidebar context (or we store last class in localStorage).
