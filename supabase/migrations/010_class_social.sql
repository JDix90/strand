-- Class notes, comments, optional emoji reactions.

create table if not exists public.class_notes (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  title text not null default '',
  body text not null default '',
  pinned boolean not null default false,
  visible_from timestamptz,
  visible_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_class_notes_class on public.class_notes(class_id);

alter table public.class_notes enable row level security;

create policy "Members read notes for class"
  on public.class_notes for select
  using (
    public.is_admin()
    or public.teacher_owns_class(auth.uid(), class_id)
    or public.student_is_in_class(auth.uid(), class_id)
  );

create policy "Teachers insert notes for own classes"
  on public.class_notes for insert
  with check (
    public.is_admin()
    or (
      author_id = auth.uid()
      and public.teacher_owns_class(auth.uid(), class_id)
    )
  );

create policy "Teachers update own notes in own classes"
  on public.class_notes for update
  using (
    public.is_admin()
    or (
      author_id = auth.uid()
      and public.teacher_owns_class(auth.uid(), class_id)
    )
  );

create policy "Teachers delete notes in own classes"
  on public.class_notes for delete
  using (public.is_admin() or public.teacher_owns_class(auth.uid(), class_id));

create table if not exists public.class_note_comments (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.class_notes(id) on delete cascade,
  author_id uuid not null references public.profiles(id) on delete cascade,
  body text not null,
  parent_comment_id uuid references public.class_note_comments(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index if not exists idx_class_note_comments_note on public.class_note_comments(note_id);

alter table public.class_note_comments enable row level security;

create policy "Members read comments for notes in their class"
  on public.class_note_comments for select
  using (
    exists (
      select 1
      from public.class_notes n
      where n.id = note_id
        and (
          public.is_admin()
          or public.teacher_owns_class(auth.uid(), n.class_id)
          or public.student_is_in_class(auth.uid(), n.class_id)
        )
    )
  );

create policy "Members insert comments on class notes"
  on public.class_note_comments for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1
      from public.class_notes n
      where n.id = note_id
        and (
          public.is_admin()
          or public.teacher_owns_class(auth.uid(), n.class_id)
          or public.student_is_in_class(auth.uid(), n.class_id)
        )
    )
  );

create policy "Authors delete own comments"
  on public.class_note_comments for delete
  using (author_id = auth.uid() or public.is_admin());

create policy "Teachers delete comments in own class"
  on public.class_note_comments for delete
  using (
    exists (
      select 1 from public.class_notes n
      where n.id = note_id and public.teacher_owns_class(auth.uid(), n.class_id)
    )
  );

-- Two DELETE policies are OR'd — either author or teacher.

create table if not exists public.class_note_reactions (
  id uuid primary key default gen_random_uuid(),
  note_id uuid not null references public.class_notes(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  emoji text not null check (char_length(emoji) between 1 and 16),
  created_at timestamptz not null default now(),
  unique (note_id, user_id, emoji)
);

create index if not exists idx_class_note_reactions_note on public.class_note_reactions(note_id);

alter table public.class_note_reactions enable row level security;

create policy "Members read reactions"
  on public.class_note_reactions for select
  using (
    exists (
      select 1 from public.class_notes n
      where n.id = note_id
        and (
          public.is_admin()
          or public.teacher_owns_class(auth.uid(), n.class_id)
          or public.student_is_in_class(auth.uid(), n.class_id)
        )
    )
  );

create policy "Members insert own reactions"
  on public.class_note_reactions for insert
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.class_notes n
      where n.id = note_id
        and (
          public.is_admin()
          or public.teacher_owns_class(auth.uid(), n.class_id)
          or public.student_is_in_class(auth.uid(), n.class_id)
        )
    )
  );

create policy "Users delete own reactions"
  on public.class_note_reactions for delete
  using (user_id = auth.uid() or public.is_admin());
