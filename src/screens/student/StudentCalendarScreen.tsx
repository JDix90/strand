import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { MonthGrid } from '../../components/calendar/MonthGrid';
import {
  fetchStudentAbsences,
  fetchStudentClassesWithSchedules,
  upsertStudentAbsence,
} from '../../lib/calendarApi';
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

  const occByDate = useMemo(
    () => mergeOccurrences(configs, rangeStart, rangeEnd),
    [configs, rangeStart, rangeEnd],
  );

  const absenceKey = useCallback(
    (classId: string, iso: string) => absenceRows.some(r => r.class_id === classId && r.absent_on === iso),
    [absenceRows],
  );

  const modalOccurrences = modalDate ? occByDate.get(modalDate) ?? [] : [];

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
              Class meetings from your teachers’ schedules. Mark absences for specific dates.
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
                if (list.length === 0) return null;
                return (
                  <button
                    type="button"
                    className="w-full text-left rounded-lg hover:bg-brand/10 px-0.5 py-0.5 transition-colors"
                    onClick={() => setModalDate(iso)}
                  >
                    {list.slice(0, 2).map(o => (
                      <div key={o.scheduleId + o.startsAt} className="truncate text-ink-secondary">
                        <span className="text-ink">{o.className}</span> · {o.startsAt}
                      </div>
                    ))}
                    {list.length > 2 && (
                      <div className="text-ink-secondary">+{list.length - 2} more</div>
                    )}
                  </button>
                );
              }}
            />
          </div>
        )}

        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="text-ink font-semibold text-sm uppercase tracking-wide mb-3">Agenda (this month)</h2>
          <ul className="space-y-2 max-h-64 overflow-y-auto">
            {[...occByDate.entries()]
              .filter(([, occs]) => occs.length > 0)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([iso, occs]) => (
                <li key={iso} className="flex flex-wrap items-baseline gap-2 text-sm border-b border-border/60 pb-2">
                  <span className="font-mono text-ink-secondary shrink-0">{iso}</span>
                  <span className="text-ink">
                    {occs.map(o => o.className).join(', ')}
                  </span>
                  <button
                    type="button"
                    className="text-link text-xs underline ml-auto"
                    onClick={() => setModalDate(iso)}
                  >
                    Absences
                  </button>
                </li>
              ))}
            {occByDate.size === 0 && configs.length > 0 && (
              <li className="text-ink-secondary text-sm">No meetings in this month (check term dates or schedule).</li>
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
            <p className="text-ink-secondary text-sm mt-1">Mark or clear absence for each class that meets this day.</p>
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
            {modalOccurrences.length === 0 && (
              <p className="text-ink-secondary text-sm mt-3">No classes meet on this day.</p>
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
