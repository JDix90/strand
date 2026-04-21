import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { MonthGrid } from '../../components/calendar/MonthGrid';
import {
  fetchStudentAbsences,
  fetchStudentCalendarNotes,
  fetchStudentClassesWithSchedules,
  upsertStudentAbsence,
} from '../../lib/calendarApi';
import type { ClassNote } from '../../lib/classSocialApi';
import { generateOccurrences, type ClassCalendarConfig, type Occurrence } from '../../lib/calendar/generateOccurrences';

function mergeOccurrences(configs: ClassCalendarConfig[], rangeStart: Date, rangeEnd: Date): Map<string, Occurrence[]> {
  const map = new Map<string, Occurrence[]>();
  for (const cfg of configs) {
    const occ = generateOccurrences(cfg, rangeStart, rangeEnd);
    for (const o of occ) {
      const list = map.get(o.date) ?? [];
      list.push(o);
      map.set(o.date, list);
    }
  }
  for (const [, list] of map) {
    list.sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  }
  return map;
}

export function StudentCalendarScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const [configs, setConfigs] = useState<ClassCalendarConfig[]>([]);
  const [absenceRows, setAbsenceRows] = useState<{ class_id: string; absent_on: string }[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [calendarNotes, setCalendarNotes] = useState<ClassNote[]>([]);

  const rangeStart = useMemo(() => startOfMonth(anchor), [anchor]);
  const rangeEnd = useMemo(() => endOfMonth(anchor), [anchor]);

  const reload = useCallback(async () => {
    if (!profile?.id) return;
    setLoadError(null);
    const [{ configs: cfgs, error: e1 }, { rows, error: e2 }] = await Promise.all([
      fetchStudentClassesWithSchedules(profile.id),
      fetchStudentAbsences(profile.id),
    ]);
    if (e1) setLoadError(e1);
    else if (e2) setLoadError(e2);
    setConfigs(cfgs);
    setAbsenceRows(rows.map(r => ({ class_id: r.class_id, absent_on: r.absent_on })));
  }, [profile?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  useEffect(() => {
    if (!profile?.id) return;
    let cancelled = false;
    const start = format(rangeStart, 'yyyy-MM-dd');
    const end = format(rangeEnd, 'yyyy-MM-dd');
    void (async () => {
      const { notes, error } = await fetchStudentCalendarNotes(profile.id, start, end);
      if (cancelled) return;
      if (error) setLoadError(prev => prev ?? error);
      setCalendarNotes(notes);
    })();
    return () => {
      cancelled = true;
    };
  }, [profile?.id, rangeStart, rangeEnd]);

  const classNameById = useMemo(() => {
    const m: Record<string, string> = {};
    for (const c of configs) m[c.classId] = c.className;
    return m;
  }, [configs]);

  const notesByDate = useMemo(() => {
    const m = new Map<string, ClassNote[]>();
    for (const n of calendarNotes) {
      const d = n.visible_on_date;
      if (!d) continue;
      const list = m.get(d) ?? [];
      list.push(n);
      m.set(d, list);
    }
    for (const [, list] of m) {
      list.sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));
    }
    return m;
  }, [calendarNotes]);

  const occByDate = useMemo(
    () => mergeOccurrences(configs, rangeStart, rangeEnd),
    [configs, rangeStart, rangeEnd],
  );

  const absenceKey = useCallback(
    (classId: string, iso: string) => absenceRows.some(r => r.class_id === classId && r.absent_on === iso),
    [absenceRows],
  );

  const modalOccurrences = modalDate ? occByDate.get(modalDate) ?? [] : [];
  const modalNotes = modalDate ? notesByDate.get(modalDate) ?? [] : [];

  const agendaDates = useMemo(() => {
    const s = new Set<string>();
    occByDate.forEach((occs, iso) => {
      if (occs.length > 0) s.add(iso);
    });
    notesByDate.forEach((notes, iso) => {
      if (notes.length > 0) s.add(iso);
    });
    return [...s].sort();
  }, [occByDate, notesByDate]);

  const toggleAbsence = async (classId: string, iso: string, currentlyAbsent: boolean) => {
    if (!profile?.id) return;
    setBusy(true);
    const { error } = await upsertStudentAbsence(profile.id, classId, iso, !currentlyAbsent);
    setBusy(false);
    if (error) {
      setLoadError(error);
      return;
    }
    await reload();
  };

  return (
    <div className="min-h-screen bg-page text-ink p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="text-ink-secondary hover:text-ink text-sm block mb-1"
            >
              ← Overview
            </button>
            <h1 className="text-2xl font-bold">Calendar</h1>
            <p className="text-ink-secondary text-sm mt-1">
              Class meetings from your teachers’ schedules, plus any notes your teachers pinned to a day. Mark absences for
              specific dates.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl border border-border bg-surface text-sm"
              onClick={() => setAnchor(a => addMonths(a, -1))}
            >
              ← Prev
            </button>
            <span className="text-sm font-semibold min-w-[10rem] text-center">
              {format(anchor, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              className="px-3 py-1.5 rounded-xl border border-border bg-surface text-sm"
              onClick={() => setAnchor(a => addMonths(a, 1))}
            >
              Next →
            </button>
          </div>
        </div>

        {loadError && (
          <div className="rounded-xl border border-red-800 bg-red-950/50 text-red-200 text-sm px-4 py-3">{loadError}</div>
        )}

        {configs.length === 0 && !loadError ? (
          <p className="text-ink-secondary text-sm">
            Join a class to see meetings here.{' '}
            <Link to="/join-class" className="text-link underline">
              Join with a code
            </Link>
          </p>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6 overflow-x-auto">
            <MonthGrid
              anchor={anchor}
              renderCell={iso => {
                const list = occByDate.get(iso) ?? [];
                const notes = notesByDate.get(iso) ?? [];
                if (list.length === 0 && notes.length === 0) return null;
                type Line = { key: string; node: ReactNode };
                const lines: Line[] = [];
                for (const o of list) {
                  lines.push({
                    key: o.scheduleId + o.startsAt,
                    node: (
                      <div className="truncate text-ink-secondary">
                        <span className="text-ink">{o.className}</span> · {o.startsAt}
                      </div>
                    ),
                  });
                }
                for (const n of notes) {
                  lines.push({
                    key: `note-${n.id}`,
                    node: (
                      <div className="truncate text-teal-300/95">
                        📝 <span className="text-ink">{n.title?.trim() || 'Note'}</span>
                        <span className="text-ink-secondary"> · {classNameById[n.class_id] ?? 'Class'}</span>
                      </div>
                    ),
                  });
                }
                const shown = lines.slice(0, 2);
                const more = lines.length - 2;
                return (
                  <button
                    type="button"
                    className="w-full text-left rounded-lg hover:bg-brand/10 px-0.5 py-0.5 transition-colors"
                    onClick={() => setModalDate(iso)}
                  >
                    {shown.map(l => (
                      <div key={l.key}>{l.node}</div>
                    ))}
                    {more > 0 && <div className="text-ink-secondary">+{more} more</div>}
                  </button>
                );
              }}
            />
          </div>
        )}

        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="text-ink font-semibold text-sm uppercase tracking-wide mb-3">Agenda (this month)</h2>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {agendaDates.map(iso => {
              const occs = occByDate.get(iso) ?? [];
              const nl = notesByDate.get(iso) ?? [];
              const summary: string[] = [];
              if (occs.length > 0) summary.push(occs.map(o => o.className).join(', '));
              if (nl.length > 0) {
                const titles = nl.map(n => n.title?.trim() || 'Note');
                const head = titles.slice(0, 2).join(', ');
                const extra = titles.length > 2 ? ` +${titles.length - 2}` : '';
                summary.push(`${nl.length} teacher note${nl.length === 1 ? '' : 's'}: ${head}${extra}`);
              }
              return (
                <li key={iso} className="flex flex-wrap items-baseline gap-2 text-sm border-b border-border/60 pb-2">
                  <span className="font-mono text-ink-secondary shrink-0">{iso}</span>
                  <span className="text-ink min-w-0">{summary.join(' · ')}</span>
                  <button
                    type="button"
                    className="text-link text-xs underline ml-auto shrink-0"
                    onClick={() => setModalDate(iso)}
                  >
                    {occs.length > 0 ? 'Absences & notes' : 'Notes'}
                  </button>
                </li>
              );
            })}
            {agendaDates.length === 0 && configs.length > 0 && (
              <li className="text-ink-secondary text-sm">
                No meetings or dated notes in this month (check term dates, schedule, or teacher notes).
              </li>
            )}
          </ul>
        </div>
      </div>

      {modalDate && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-4"
          role="dialog"
          aria-modal
          aria-labelledby="cal-modal-title"
        >
          <div className="bg-surface border border-border rounded-2xl max-w-lg w-full p-5 shadow-xl max-h-[90vh] overflow-y-auto">
            <h2 id="cal-modal-title" className="text-lg font-bold text-ink">
              {modalDate}
            </h2>
            {modalOccurrences.length > 0 ? (
              <p className="text-ink-secondary text-sm mt-1">Mark or clear absence for each class that meets this day.</p>
            ) : modalNotes.length > 0 ? (
              <p className="text-ink-secondary text-sm mt-1">No class meetings—teacher notes for this day are below.</p>
            ) : (
              <p className="text-ink-secondary text-sm mt-1">Nothing scheduled for this day.</p>
            )}
            <ul className="mt-4 space-y-3">
              {modalOccurrences.map(o => {
                const absent = absenceKey(o.classId, modalDate);
                return (
                  <li
                    key={o.classId + o.scheduleId}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 rounded-xl border border-border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium text-ink">{o.className}</p>
                      <p className="text-xs text-ink-secondary">
                        {o.startsAt} – {o.endsAt} ({o.timezone})
                        {o.level ? ` · ${o.level}` : ''}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void toggleAbsence(o.classId, modalDate, absent)}
                      className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-semibold ${
                        absent ? 'bg-red-900/40 text-red-200' : 'bg-brand/20 text-ink'
                      }`}
                    >
                      {absent ? 'Clear absence' : 'Mark absent'}
                    </button>
                  </li>
                );
              })}
            </ul>
            {modalNotes.length > 0 && (
              <div className="mt-5 border-t border-border pt-4">
                <h3 className="text-sm font-semibold text-ink mb-2">Teacher notes (this day)</h3>
                <ul className="space-y-3">
                  {modalNotes.map(n => (
                    <li key={n.id} className="rounded-xl border border-border bg-page px-3 py-2">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-medium text-ink">{n.title?.trim() || 'Note'}</span>
                        {n.pinned && (
                          <span className="text-[10px] uppercase tracking-wide text-amber-200/90">Pinned</span>
                        )}
                      </div>
                      <p className="text-xs text-ink-secondary mt-0.5">{classNameById[n.class_id] ?? 'Class'}</p>
                      <Link
                        to={`/class/${n.class_id}`}
                        className="text-link text-sm font-semibold mt-2 inline-block hover:underline"
                      >
                        Open class home for full notes →
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                className="px-4 py-2 rounded-xl bg-surface-muted text-ink text-sm font-semibold"
                onClick={() => setModalDate(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
