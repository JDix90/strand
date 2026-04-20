# RLS and security checklist

Run when adding or changing **Supabase tables**, **policies**, or **client APIs** that touch user data.

## Roles

Test mental model: **student**, **teacher** (owns a class), **admin**, **anonymous** (not logged in).

## Per operation

For each of **SELECT**, **INSERT**, **UPDATE**, **DELETE** that the app uses:

1. **Student** in the relevant class: allowed only as intended (e.g. read notes, write own profile fields).
2. **Student** not in the class: must **not** read or mutate other classes’ rows.
3. **Teacher** for their class: can manage class-owned resources (notes, assignments) per product rules.
4. **Stranger** / unauthenticated: no access to PII or class data except explicitly public endpoints.

## Storage and settings

- **`user_settings`**: row is **scoped to `auth.uid()`**; users must not read/write other users’ settings.

## New policies

- Prefer **`auth.uid()`** and existing helpers (`student_is_in_class`, `teacher_owns_class`, `is_admin()`) over ad-hoc conditions.
- Document any **SECURITY DEFINER** functions and why they are safe.

## Release

- After migration: smoke-test login + one read path + one write path per changed table in staging.
