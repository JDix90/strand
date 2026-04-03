# Future: server-driven “next unit” RPC

Today, default unit resolution for CTAs and the student sidebar uses client logic in [`resolveDefaultUnitId`](../src/lib/studentNavigation.ts) plus `class_curriculum` ordering and lock helpers.

When rules grow (locks, mastery, assignments), consider a **Postgres RPC** that returns the next navigable `unit_id` for `(student_id, class_id)` so CTAs, sidebar, and analytics share one definition and cannot drift.

This is not required for current scale; document here to avoid duplicate complex branching in the client.
