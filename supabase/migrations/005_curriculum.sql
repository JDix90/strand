-- Curriculum catalog + class_curriculum; mastery scoped by unit; assignments optional unit; sessions optional unit/topic.

-- Fixed seed UUIDs (referenced by app DEFAULT_UNIT_ID)
-- Subject: Russian language
-- Topic: Nominal declension
-- Units: core (legacy backfill) + pronouns + names + nouns + vocabulary stub

create table if not exists public.subjects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  slug text not null,
  title text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(subject_id, slug)
);

create table if not exists public.units (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.topics(id) on delete cascade,
  slug text not null,
  title text not null,
  description text,
  content_module text not null,
  content_config jsonb not null default '{}',
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  unique(topic_id, slug)
);

create index if not exists idx_units_topic on public.units(topic_id);

create table if not exists public.class_curriculum (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  unlock_at timestamptz,
  lock_policy jsonb,
  created_at timestamptz not null default now(),
  unique(class_id, unit_id)
);

create index if not exists idx_class_curriculum_class on public.class_curriculum(class_id);
create index if not exists idx_class_curriculum_unit on public.class_curriculum(unit_id);

alter table public.subjects enable row level security;
alter table public.topics enable row level security;
alter table public.units enable row level security;
alter table public.class_curriculum enable row level security;

-- Catalog: all authenticated users may read (students + teachers pick units)
create policy "Authenticated read subjects"
  on public.subjects for select using (auth.role() = 'authenticated');

create policy "Authenticated read topics"
  on public.topics for select using (auth.role() = 'authenticated');

create policy "Authenticated read units"
  on public.units for select using (auth.role() = 'authenticated');

create policy "Admins manage subjects"
  on public.subjects for all using (public.is_admin());

create policy "Admins manage topics"
  on public.topics for all using (public.is_admin());

create policy "Admins manage units"
  on public.units for all using (public.is_admin());

-- class_curriculum: teachers CRUD own classes; students read enrolled classes
create policy "Teachers manage class curriculum for own classes"
  on public.class_curriculum for all using (
    public.teacher_owns_class(auth.uid(), class_id)
  );

create policy "Students read curriculum for enrolled classes"
  on public.class_curriculum for select using (
    public.student_is_in_class(auth.uid(), class_id)
  );

-- Seed Russian curriculum + stub second module (fixed IDs)
insert into public.subjects (id, slug, title, sort_order)
values (
  '11111111-1111-1111-1111-111111111101',
  'russian',
  'Russian language',
  0
)
on conflict (slug) do nothing;

insert into public.topics (id, subject_id, slug, title, sort_order)
values (
  '11111111-1111-1111-1111-111111111102',
  '11111111-1111-1111-1111-111111111101',
  'nominal-declension',
  'Nominal declension',
  0
)
on conflict (subject_id, slug) do nothing;

insert into public.units (id, topic_id, slug, title, description, content_module, content_config, sort_order)
values
  (
    '11111111-1111-1111-1111-111111111103',
    '11111111-1111-1111-1111-111111111102',
    'russian-declension-core',
    'Declension — full practice',
    'All cases and word categories (matches legacy global practice).',
    'russian_declension',
    '{"caseIds":["nominative","genitive","dative","accusative","instrumental","prepositional"],"categories":["pronoun","name","noun"]}'::jsonb,
    0
  ),
  (
    '11111111-1111-1111-1111-111111111104',
    '11111111-1111-1111-1111-111111111102',
    'russian-pronouns',
    'Pronouns in cases',
    'Pronoun forms only.',
    'russian_declension',
    '{"caseIds":["nominative","genitive","dative","accusative","instrumental","prepositional"],"categories":["pronoun"]}'::jsonb,
    1
  ),
  (
    '11111111-1111-1111-1111-111111111105',
    '11111111-1111-1111-1111-111111111102',
    'russian-names',
    'Names in cases',
    'Name forms only.',
    'russian_declension',
    '{"caseIds":["nominative","genitive","dative","accusative","instrumental","prepositional"],"categories":["name"]}'::jsonb,
    2
  ),
  (
    '11111111-1111-1111-1111-111111111106',
    '11111111-1111-1111-1111-111111111102',
    'russian-nouns',
    'Nouns in cases',
    'Noun forms only.',
    'russian_declension',
    '{"caseIds":["nominative","genitive","dative","accusative","instrumental","prepositional"],"categories":["noun"]}'::jsonb,
    3
  ),
  (
    '11111111-1111-1111-1111-111111111107',
    '11111111-1111-1111-1111-111111111102',
    'vocabulary-food-stub',
    'Vocabulary — food (preview)',
    'Non-declension preview module.',
    'vocabulary_stub',
    '{"deckId":"food_basic"}'::jsonb,
    4
  )
on conflict (topic_id, slug) do nothing;

-- Mastery: add unit scope
alter table public.mastery_records
  add column if not exists unit_id uuid references public.units(id) on delete cascade;

alter table public.mastery_records
  add column if not exists content_module text not null default 'russian_declension';

update public.mastery_records
set unit_id = '11111111-1111-1111-1111-111111111103',
    content_module = 'russian_declension'
where unit_id is null;

alter table public.mastery_records
  alter column unit_id set not null;

alter table public.mastery_records drop constraint if exists mastery_records_user_id_form_key_key;

alter table public.mastery_records
  add constraint mastery_records_user_unit_form_unique unique (user_id, unit_id, form_key);

create index if not exists idx_mastery_user_unit on public.mastery_records(user_id, unit_id);

-- Assignments: optional unit
alter table public.assignments
  add column if not exists unit_id uuid references public.units(id) on delete set null;

create index if not exists idx_assignments_unit on public.assignments(unit_id);

-- Session summaries: optional curriculum scope
alter table public.session_summaries
  add column if not exists unit_id uuid references public.units(id) on delete set null;

alter table public.session_summaries
  add column if not exists topic_id uuid references public.topics(id) on delete set null;

create index if not exists idx_sessions_unit on public.session_summaries(unit_id);
