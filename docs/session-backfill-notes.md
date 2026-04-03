# Session summaries: optional `unit_id` backfill

Older `session_summaries` rows may have `unit_id` null (pre–curriculum v2). New sessions from game modes should populate `unit_id` via [`cloudAppendSessionSummary`](../src/lib/cloudStorage.ts) when the active unit is known from [`CurriculumContext`](../src/contexts/CurriculumContext.tsx).

**Optional SQL (run only after validating on a backup):** attach rows to the seeded Russian core unit so teacher analytics by unit are less sparse.

```sql
-- Default Russian “core” unit from migration 005
UPDATE public.session_summaries
SET unit_id = '11111111-1111-1111-1111-111111111103'
WHERE unit_id IS NULL
  AND mode_id IS NOT NULL;
```

Adjust the UUID if your seed differs. Consider scoping by `completed_at` or user cohorts before running in production.
