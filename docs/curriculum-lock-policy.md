# Curriculum lock policy (v1)

Stored in `class_curriculum.lock_policy` as JSON.

## Schema

```json
{
  "requires_unit_ids": ["uuid-of-prerequisite-unit", "..."],
  "min_mastery_pct": 50
}
```

- `requires_unit_ids` (optional): Prerequisite units. The student must have **average mastery score** across all mastery records scoped to each prerequisite unit at or above `min_mastery_pct` before this unit is unlocked by policy (in addition to time-based `unlock_at` and visibility).
- `min_mastery_pct` (optional, default `50`): Threshold 0–100.

If `requires_unit_ids` is empty or omitted, policy does not block access.

Invalid JSON or unknown fields: clients treat the row as **unlocked by policy** (fail open) and may log a console warning in development.

Teachers can set this field via SQL or a future admin UI; the v1 teacher screen focuses on **visibility** and **`unlock_at`**.
