import { supabase } from './supabase';

export interface ClassNote {
  id: string;
  class_id: string;
  author_id: string;
  title: string;
  body: string;
  pinned: boolean;
  visible_from: string | null;
  visible_until: string | null;
  /** Optional calendar day anchor (YYYY-MM-DD) for class session context */
  visible_on_date: string | null;
  created_at: string;
  updated_at: string;
}

/** Hide notes outside optional visibility window (client-side; RLS still returns rows). */
export function filterNotesVisibleNow(notes: ClassNote[]): ClassNote[] {
  const now = Date.now();
  return notes.filter(n => {
    if (n.visible_from && new Date(n.visible_from).getTime() > now) return false;
    if (n.visible_until && new Date(n.visible_until).getTime() < now) return false;
    return true;
  });
}

export interface ClassNoteComment {
  id: string;
  note_id: string;
  author_id: string;
  body: string;
  parent_comment_id: string | null;
  created_at: string;
}

export async function fetchNotesForClass(classId: string): Promise<{ notes: ClassNote[]; error: string | null }> {
  const { data, error } = await supabase
    .from('class_notes')
    .select('*')
    .eq('class_id', classId)
    .order('pinned', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) return { notes: [], error: error.message };
  return { notes: (data ?? []) as ClassNote[], error: null };
}

export async function createClassNote(
  classId: string,
  authorId: string,
  title: string,
  body: string,
  opts?: {
    pinned?: boolean;
    visible_from?: string | null;
    visible_until?: string | null;
    visible_on_date?: string | null;
  },
): Promise<{ id: string | null; error: string | null }> {
  const { data, error } = await supabase
    .from('class_notes')
    .insert({
      class_id: classId,
      author_id: authorId,
      title,
      body,
      pinned: opts?.pinned ?? false,
      visible_from: opts?.visible_from ?? null,
      visible_until: opts?.visible_until ?? null,
      visible_on_date: opts?.visible_on_date ?? null,
    })
    .select('id')
    .maybeSingle();
  if (error) return { id: null, error: error.message };
  return { id: data?.id ?? null, error: null };
}

export async function updateClassNote(
  noteId: string,
  patch: Partial<{
    pinned: boolean;
    title: string;
    body: string;
    visible_from: string | null;
    visible_until: string | null;
    visible_on_date: string | null;
  }>,
): Promise<{ error: string | null }> {
  const { error } = await supabase.from('class_notes').update(patch).eq('id', noteId);
  return { error: error?.message ?? null };
}

export async function deleteClassNote(noteId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('class_notes').delete().eq('id', noteId);
  return { error: error?.message ?? null };
}

export async function fetchCommentsForNote(
  noteId: string,
): Promise<{ comments: ClassNoteComment[]; error: string | null }> {
  const { data, error } = await supabase
    .from('class_note_comments')
    .select('*')
    .eq('note_id', noteId)
    .order('created_at', { ascending: true });
  if (error) return { comments: [], error: error.message };
  return { comments: (data ?? []) as ClassNoteComment[], error: null };
}

export async function addComment(noteId: string, authorId: string, body: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('class_note_comments').insert({
    note_id: noteId,
    author_id: authorId,
    body: body.trim().slice(0, 2000),
  });
  return { error: error?.message ?? null };
}

export async function deleteComment(commentId: string): Promise<{ error: string | null }> {
  const { error } = await supabase.from('class_note_comments').delete().eq('id', commentId);
  return { error: error?.message ?? null };
}

export interface ProfilePublic {
  id: string;
  display_name: string;
  avatar_url: string | null;
}

export async function fetchProfilesByIds(ids: string[]): Promise<{ map: Record<string, ProfilePublic>; error: string | null }> {
  if (ids.length === 0) return { map: {}, error: null };
  const uniq = [...new Set(ids)];
  const { data, error } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .in('id', uniq);
  if (error) return { map: {}, error: error.message };
  const map: Record<string, ProfilePublic> = {};
  for (const row of data ?? []) {
    const r = row as ProfilePublic;
    map[r.id] = r;
  }
  return { map, error: null };
}

export async function toggleReaction(
  noteId: string,
  userId: string,
  emoji: string,
): Promise<{ error: string | null }> {
  const { data: existing } = await supabase
    .from('class_note_reactions')
    .select('id')
    .eq('note_id', noteId)
    .eq('user_id', userId)
    .eq('emoji', emoji)
    .maybeSingle();
  if (existing?.id) {
    const { error } = await supabase.from('class_note_reactions').delete().eq('id', existing.id);
    return { error: error?.message ?? null };
  }
  const { error } = await supabase.from('class_note_reactions').insert({
    note_id: noteId,
    user_id: userId,
    emoji,
  });
  return { error: error?.message ?? null };
}

export async function fetchReactionsForNote(
  noteId: string,
): Promise<{ rows: { emoji: string; user_id: string }[]; error: string | null }> {
  const { data, error } = await supabase
    .from('class_note_reactions')
    .select('emoji, user_id')
    .eq('note_id', noteId);
  if (error) return { rows: [], error: error.message };
  return { rows: (data ?? []) as { emoji: string; user_id: string }[], error: null };
}
