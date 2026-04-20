-- Track last time an authenticated client reported activity (login / session restore / token refresh).

alter table public.profiles
  add column if not exists last_active_at timestamptz;

comment on column public.profiles.last_active_at is
  'Set by the app when the user has an active session (throttled).';
