-- Streaks, session goals, UI locale; optional calendar anchor for class notes.

alter table public.user_settings
  add column if not exists streak_current integer not null default 0,
  add column if not exists streak_best integer not null default 0,
  add column if not exists last_streak_activity_date date,
  add column if not exists session_goal_type text not null default 'none'
    check (session_goal_type in ('none', 'time', 'forms')),
  add column if not exists session_goal_minutes smallint,
  add column if not exists session_goal_forms smallint,
  add column if not exists ui_locale text not null default 'en'
    check (char_length(ui_locale) <= 10);

comment on column public.user_settings.streak_current is 'Consecutive local-calendar days with at least one qualifying session.';
comment on column public.user_settings.last_streak_activity_date is 'Last date (user-local) that counted toward streak.';
comment on column public.user_settings.session_goal_type is 'none | time (minutes) | forms (count) for practice-style sessions.';

alter table public.class_notes
  add column if not exists visible_on_date date;

create index if not exists idx_class_notes_visible_on_date on public.class_notes (class_id, visible_on_date);
