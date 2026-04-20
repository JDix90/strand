import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  addComment,
  createClassNote,
  deleteClassNote,
  deleteComment,
  fetchCommentsForNote,
  fetchNotesForClass,
  fetchProfilesByIds,
  fetchReactionsForNote,
  filterNotesVisibleNow,
  toggleReaction,
  updateClassNote,
  type ClassNote,
  type ClassNoteComment,
} from '../../lib/classSocialApi';
import { renderSafeMarkdown } from '../../lib/renderMarkdown';
import { Avatar } from '../ui/Avatar';

const QUICK_EMOJIS = ['👍', '🎉', '❤️'];

function fromDatetimeLocalValue(s: string): string | null {
  const t = s.trim();
  if (!t) return null;
  const ms = new Date(t).getTime();
  if (Number.isNaN(ms)) return null;
  return new Date(ms).toISOString();
}

function scheduleHint(note: ClassNote): string | null {
  const parts: string[] = [];
  if (note.visible_on_date) parts.push(`Class day ${note.visible_on_date}`);
  if (note.visible_from) {
    const start = new Date(note.visible_from).getTime();
    if (!Number.isNaN(start) && start > Date.now()) {
      parts.push(`Goes live ${new Date(note.visible_from).toLocaleString()}`);
    }
  }
  if (note.visible_until) {
    parts.push(`Until ${new Date(note.visible_until).toLocaleString()}`);
  }
  return parts.length ? parts.join(' · ') : null;
}

interface Props {
  classId: string;
  viewerId: string;
  /** Teacher (or admin) of this class can post and moderate. */
  canManageClass: boolean;
}

export function ClassNotesPanel({ classId, viewerId, canManageClass }: Props) {
  const [notes, setNotes] = useState<ClassNote[]>([]);
  const [commentsByNote, setCommentsByNote] = useState<Record<string, ClassNoteComment[]>>({});
  const [reactionsByNote, setReactionsByNote] = useState<Record<string, { emoji: string; user_id: string }[]>>({});
  const [profiles, setProfiles] = useState<Record<string, { id: string; display_name: string; avatar_url: string | null }>>(
    {},
  );
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [composeTab, setComposeTab] = useState<'write' | 'preview'>('write');
  const [newPinned, setNewPinned] = useState(false);
  const [newVisibleFrom, setNewVisibleFrom] = useState('');
  const [newVisibleUntil, setNewVisibleUntil] = useState('');
  const [newVisibleOnDate, setNewVisibleOnDate] = useState('');
  const [commentDraft, setCommentDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const visibleNotes = useMemo(() => {
    if (canManageClass) return notes;
    return filterNotesVisibleNow(notes);
  }, [notes, canManageClass]);

  const loadNotes = useCallback(async () => {
    setError(null);
    const { notes: n, error: e } = await fetchNotesForClass(classId);
    if (e) {
      setError(e);
      setNotes([]);
      setLoading(false);
      return;
    }
    setNotes(n);
    setLoading(false);
  }, [classId]);

  useEffect(() => {
    void loadNotes();
  }, [loadNotes]);

  async function loadThread(noteId: string) {
    const [{ comments }, { rows: reactRows }] = await Promise.all([
      fetchCommentsForNote(noteId),
      fetchReactionsForNote(noteId),
    ]);
    setCommentsByNote(prev => ({ ...prev, [noteId]: comments }));
    setReactionsByNote(prev => ({ ...prev, [noteId]: reactRows }));
    const ids = new Set<string>();
    comments.forEach(c => ids.add(c.author_id));
    reactRows.forEach(r => ids.add(r.user_id));
    const { map } = await fetchProfilesByIds([...ids]);
    setProfiles(prev => ({ ...prev, ...map }));
  }

  useEffect(() => {
    if (notes.length === 0) return;
    const authorIds = notes.map(n => n.author_id);
    void (async () => {
      const { map } = await fetchProfilesByIds(authorIds);
      setProfiles(prev => ({ ...prev, ...map }));
    })();
  }, [notes]);

  const toggleExpand = async (noteId: string) => {
    const next = !expanded[noteId];
    setExpanded(prev => ({ ...prev, [noteId]: next }));
    if (next) await loadThread(noteId);
  };

  const postNote = async () => {
    const title = newTitle.trim();
    const body = newBody.trim();
    if (!title && !body) return;
    setError(null);
    const { id, error: e } = await createClassNote(classId, viewerId, title || 'Note', body, {
      pinned: newPinned,
      visible_from: fromDatetimeLocalValue(newVisibleFrom),
      visible_until: fromDatetimeLocalValue(newVisibleUntil),
      visible_on_date: newVisibleOnDate.trim() || null,
    });
    if (e) {
      setError(e);
      return;
    }
    setNewTitle('');
    setNewBody('');
    setComposeTab('write');
    setNewPinned(false);
    setNewVisibleFrom('');
    setNewVisibleUntil('');
    setNewVisibleOnDate('');
    await loadNotes();
    if (id) {
      setExpanded(prev => ({ ...prev, [id]: true }));
      await loadThread(id);
    }
  };

  const removeNote = async (noteId: string) => {
    if (!window.confirm('Delete this note and its comments?')) return;
    const { error: e } = await deleteClassNote(noteId);
    if (e) {
      setError(e);
      return;
    }
    await loadNotes();
  };

  const togglePin = async (note: ClassNote) => {
    const { error: e } = await updateClassNote(note.id, { pinned: !note.pinned });
    if (e) {
      setError(e);
      return;
    }
    await loadNotes();
  };

  const postComment = async (noteId: string) => {
    const text = (commentDraft[noteId] ?? '').trim();
    if (!text) return;
    const { error: e } = await addComment(noteId, viewerId, text);
    if (e) {
      setError(e);
      return;
    }
    setCommentDraft(prev => ({ ...prev, [noteId]: '' }));
    const { comments } = await fetchCommentsForNote(noteId);
    setCommentsByNote(prev => ({ ...prev, [noteId]: comments }));
    const ids = comments.map(c => c.author_id);
    const { map } = await fetchProfilesByIds(ids);
    setProfiles(prev => ({ ...prev, ...map }));
  };

  const removeComment = async (noteId: string, commentId: string) => {
    const { error: e } = await deleteComment(commentId);
    if (e) {
      setError(e);
      return;
    }
    const { comments } = await fetchCommentsForNote(noteId);
    setCommentsByNote(prev => ({ ...prev, [noteId]: comments }));
  };

  const onReact = async (noteId: string, emoji: string) => {
    const { error: e } = await toggleReaction(noteId, viewerId, emoji);
    if (e) {
      setError(e);
      return;
    }
    const { rows } = await fetchReactionsForNote(noteId);
    setReactionsByNote(prev => ({ ...prev, [noteId]: rows }));
    const ids = rows.map(r => r.user_id);
    const { map } = await fetchProfilesByIds(ids);
    setProfiles(prev => ({ ...prev, ...map }));
  };

  const reactionSummary = useMemo(() => {
    const fn = (noteId: string) => {
      const rows = reactionsByNote[noteId] ?? [];
      const counts: Record<string, number> = {};
      for (const r of rows) {
        counts[r.emoji] = (counts[r.emoji] ?? 0) + 1;
      }
      return counts;
    };
    return fn;
  }, [reactionsByNote]);

  return (
    <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
      <div>
        <h2 className="text-ink font-bold text-lg">Notes & discussion</h2>
        <p className="text-ink-secondary text-sm mt-1">Class announcements and comments from your group.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-red-800 bg-red-950/50 text-red-200 text-sm px-4 py-3">{error}</div>
      )}

      {canManageClass && (
        <div className="rounded-xl border border-border bg-page p-4 space-y-3">
          <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide">New note</p>
          <input
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            placeholder="Title"
            className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-ink text-sm"
          />
          <div className="flex gap-2 border-b border-border pb-2">
            <button
              type="button"
              onClick={() => setComposeTab('write')}
              className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                composeTab === 'write' ? 'bg-brand/20 text-ink' : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Write
            </button>
            <button
              type="button"
              onClick={() => setComposeTab('preview')}
              className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                composeTab === 'preview' ? 'bg-brand/20 text-ink' : 'text-ink-secondary hover:text-ink'
              }`}
            >
              Preview
            </button>
          </div>
          {composeTab === 'write' ? (
            <textarea
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              placeholder="Markdown supported: **bold**, lists, [links](https://…)"
              rows={5}
              className="w-full px-3 py-2 rounded-xl bg-surface border border-border text-ink text-sm resize-y min-h-24 font-mono"
            />
          ) : (
            <div
              className="min-h-24 rounded-xl border border-border bg-surface px-3 py-2 text-sm text-ink [&_a]:text-link [&_pre]:bg-page [&_code]:text-xs [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 space-y-2"
              dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(newBody) }}
            />
          )}
          <label className="flex items-center gap-2 cursor-pointer text-sm text-ink-secondary">
            <input
              type="checkbox"
              checked={newPinned}
              onChange={e => setNewPinned(e.target.checked)}
              className="accent-blue-500 w-4 h-4"
            />
            Pin to top
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="text-ink-secondary font-medium block mb-1">Visible from (optional)</label>
              <input
                type="datetime-local"
                value={newVisibleFrom}
                onChange={e => setNewVisibleFrom(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg bg-surface border border-border text-ink"
              />
            </div>
            <div>
              <label className="text-ink-secondary font-medium block mb-1">Visible until (optional)</label>
              <input
                type="datetime-local"
                value={newVisibleUntil}
                onChange={e => setNewVisibleUntil(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg bg-surface border border-border text-ink"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="text-ink-secondary font-medium block mb-1">Class session date (optional)</label>
              <input
                type="date"
                value={newVisibleOnDate}
                onChange={e => setNewVisibleOnDate(e.target.value)}
                className="w-full max-w-xs px-2 py-1.5 rounded-lg bg-surface border border-border text-ink"
              />
              <p className="text-ink-secondary/80 mt-1">Tie this note to a day on the class calendar.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => void postNote()}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-ink rounded-xl text-sm font-semibold"
          >
            Publish note
          </button>
        </div>
      )}

      {loading ? (
        <p className="text-ink-secondary text-sm">Loading notes…</p>
      ) : visibleNotes.length === 0 ? (
        <p className="text-ink-secondary text-sm">No notes yet.{canManageClass ? ' Add one above.' : ''}</p>
      ) : (
        <ul className="space-y-4">
          {visibleNotes.map(note => {
            const open = !!expanded[note.id];
            const comments = commentsByNote[note.id] ?? [];
            const counts = reactionSummary(note.id);
            const author = profiles[note.author_id];
            const sched = scheduleHint(note);
            return (
              <li key={note.id} className="rounded-xl border border-border bg-page p-4 space-y-3">
                <div className="flex gap-3">
                  <Avatar src={author?.avatar_url} name={author?.display_name ?? '?'} size="md" />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-ink">{note.title || 'Note'}</p>
                          {note.pinned && (
                            <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded bg-amber-900/40 text-amber-100 border border-amber-700/50">
                              Pinned
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-ink-secondary">
                          {author?.display_name ?? 'Teacher'} · {new Date(note.created_at).toLocaleString()}
                        </p>
                        {sched && <p className="text-[11px] text-ink-secondary mt-1">{sched}</p>}
                      </div>
                      {canManageClass && (
                        <div className="flex flex-wrap gap-2 justify-end">
                          <button
                            type="button"
                            className="text-xs text-ink-secondary hover:text-ink border border-border rounded-lg px-2 py-0.5"
                            onClick={() => void togglePin(note)}
                          >
                            {note.pinned ? 'Unpin' : 'Pin'}
                          </button>
                          <button
                            type="button"
                            className="text-xs text-red-400 hover:underline"
                            onClick={() => void removeNote(note.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                    <div
                      className="mt-2 text-sm text-ink [&_a]:text-link [&_pre]:bg-surface [&_code]:text-xs [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 space-y-2"
                      dangerouslySetInnerHTML={{ __html: renderSafeMarkdown(note.body) }}
                    />
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      {QUICK_EMOJIS.map(em => (
                        <button
                          key={em}
                          type="button"
                          className="text-lg leading-none px-1.5 py-0.5 rounded-lg hover:bg-surface border border-transparent hover:border-border min-h-[44px] min-w-[44px] flex items-center justify-center"
                          title={em}
                          onClick={() => void onReact(note.id, em)}
                        >
                          {em}
                          {counts[em] ? <span className="text-xs text-ink-secondary ml-0.5">{counts[em]}</span> : null}
                        </button>
                      ))}
                      <button
                        type="button"
                        className="text-sm text-link ml-auto min-h-[44px] px-1"
                        onClick={() => void toggleExpand(note.id)}
                      >
                        {open ? 'Hide comments' : `Comments (${comments.length})`}
                      </button>
                    </div>
                  </div>
                </div>

                {open && (
                  <div className="border-t border-border pt-3 space-y-3 pl-2 sm:pl-14">
                    {comments.length === 0 ? (
                      <p className="text-ink-secondary text-sm">No comments yet.</p>
                    ) : (
                      <ul className="space-y-3">
                        {comments.map(c => {
                          const p = profiles[c.author_id];
                          const own = c.author_id === viewerId;
                          return (
                            <li key={c.id} className="flex gap-2">
                              <Avatar src={p?.avatar_url} name={p?.display_name ?? '?'} size="sm" />
                              <div className="flex-1 min-w-0">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                  <span className="text-sm font-medium text-ink">{p?.display_name ?? 'Member'}</span>
                                  <span className="text-[10px] text-ink-secondary">
                                    {new Date(c.created_at).toLocaleString()}
                                  </span>
                                </div>
                                <p className="text-sm text-ink whitespace-pre-wrap mt-0.5">{c.body}</p>
                                {(own || canManageClass) && (
                                  <button
                                    type="button"
                                    className="text-xs text-red-400 mt-1 hover:underline"
                                    onClick={() => void removeComment(note.id, c.id)}
                                  >
                                    Delete
                                  </button>
                                )}
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <textarea
                        value={commentDraft[note.id] ?? ''}
                        onChange={e =>
                          setCommentDraft(prev => ({
                            ...prev,
                            [note.id]: e.target.value,
                          }))
                        }
                        placeholder="Write a comment…"
                        rows={2}
                        className="flex-1 px-3 py-2 rounded-xl bg-surface border border-border text-ink text-sm resize-y min-h-[44px]"
                      />
                      <button
                        type="button"
                        onClick={() => void postComment(note.id)}
                        className="self-end sm:self-stretch px-4 py-2 bg-surface-muted rounded-xl text-sm font-semibold text-ink min-h-[44px]"
                      >
                        Post
                      </button>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
