-- Rich profile fields + avatars bucket + policies for classmates / class teachers to read profiles (social).

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists bio text,
  add column if not exists headline text;

comment on column public.profiles.avatar_url is 'Public URL in storage bucket avatars/{user_id}/...';
comment on column public.profiles.bio is 'Short about text visible to classmates and teachers.';
comment on column public.profiles.headline is 'Optional tagline (e.g. for teachers).';

-- Students can read other students in the same class (for social / avatars).
create policy "Students read classmates profiles"
  on public.profiles for select
  to authenticated
  using (
    public.profiles.role = 'student'
    and auth.uid() <> public.profiles.id
    and exists (
      select 1
      from public.class_memberships cm_self
      join public.class_memberships cm_peer on cm_self.class_id = cm_peer.class_id
      where cm_self.student_id = auth.uid()
        and cm_peer.student_id = public.profiles.id
    )
  );

-- Students can read teachers of classes they belong to.
create policy "Students read their class teachers profiles"
  on public.profiles for select
  to authenticated
  using (
    public.profiles.role in ('teacher', 'admin')
    and exists (
      select 1
      from public.class_memberships cm
      join public.classes c on c.id = cm.class_id
      where cm.student_id = auth.uid()
        and c.teacher_id = public.profiles.id
    )
  );

-- Storage: public avatars bucket
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'avatars',
  'avatars',
  true,
  2097152,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Path convention: {user_id}/{filename}
create policy "Avatar objects are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload avatars in own folder"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Users can update own avatars"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );

create policy "Users can delete own avatars"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and split_part(name, '/', 1) = auth.uid()::text
  );
