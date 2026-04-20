-- Class schedule, term bounds, level filter, student absences.

alter table public.classes
  add column if not exists level text,
  add column if not exists timezone text not null default 'UTC',
  add column if not exists term_starts_on date,
  add column if not exists term_ends_on date;

comment on column public.classes.level is 'Filter label e.g. beginner / intermediate / advanced.';
comment on column public.classes.timezone is 'IANA timezone for interpreting weekly schedule wall times.';

create table if not exists public.class_schedules (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  weekday smallint not null check (weekday >= 0 and weekday <= 6),
  starts_at time not null,
  ends_at time not null,
  created_at timestamptz not null default now(),
  unique (class_id, weekday, starts_at, ends_at)
);

comment on table public.class_schedules is 'weekday: 0=Sunday … 6=Saturday (JavaScript getDay).';

create index if not exists idx_class_schedules_class on public.class_schedules(class_id);

alter table public.class_schedules enable row level security;

create policy "Teachers manage schedules for own classes"
  on public.class_schedules for all
  using (public.teacher_owns_class(auth.uid(), class_id))
  with check (public.teacher_owns_class(auth.uid(), class_id));

create policy "Students read schedules for enrolled classes"
  on public.class_schedules for select
  using (public.student_is_in_class(auth.uid(), class_id));

create policy "Admins read all class schedules"
  on public.class_schedules for select
  using (public.is_admin());

create policy "Admins manage all class schedules"
  on public.class_schedules for all
  using (public.is_admin())
  with check (public.is_admin());

-- Absences
create table if not exists public.student_absences (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles(id) on delete cascade,
  class_id uuid not null references public.classes(id) on delete cascade,
  absent_on date not null,
  status text not null default 'absent' check (status in ('absent', 'cancelled')),
  note text,
  created_at timestamptz not null default now(),
  unique (student_id, class_id, absent_on)
);

create index if not exists idx_student_absences_class on public.student_absences(class_id);
create index if not exists idx_student_absences_student on public.student_absences(student_id);

alter table public.student_absences enable row level security;

create policy "Students manage own absences in enrolled classes"
  on public.student_absences for all
  using (
    student_id = auth.uid()
    and public.student_is_in_class(auth.uid(), class_id)
  )
  with check (
    student_id = auth.uid()
    and public.student_is_in_class(auth.uid(), class_id)
  );

create policy "Teachers read absences in own classes"
  on public.student_absences for select
  using (public.teacher_owns_class(auth.uid(), class_id));

create policy "Teachers delete absences in own classes"
  on public.student_absences for delete
  using (public.teacher_owns_class(auth.uid(), class_id));

create policy "Admins read all absences"
  on public.student_absences for select
  using (public.is_admin());

create policy "Admins manage all absences"
  on public.student_absences for all
  using (public.is_admin())
  with check (public.is_admin());
