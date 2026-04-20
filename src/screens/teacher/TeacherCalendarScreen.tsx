import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { addMonths, format, startOfMonth, endOfMonth } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { MonthGrid } from '../../components/calendar/MonthGrid';
import {
  fetchTeacherAbsencesForClasses,
  fetchTeacherClassesWithSchedules,
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

export function TeacherCalendarScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [anchor, setAnchor] = useState(() => startOfMonth(new Date()));
  const [allConfigs, setAllConfigs] = useState<ClassCalendarConfig[]>([]);
  const [filterClassId, setFilterClassId] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState('');
  const [absenceRows, setAbsenceRows] = useState<
    { id: string; student_id: string; class_id: string; absent_on: string; note: string | null }[]
  >([]);
  const [namesByStudent, setNamesByStudent] = useState<Record<string, string>>({});
  const [loadError, setLoadError] = useState<string | null>(null);

  const rangeStart = useMemo(() => startOfMonth(anchor), [anchor]);
  const rangeEnd = useMemo(() => endOfMonth(anchor), [anchor]);

  const filteredConfigs = useMemo(() => {
    let list = allConfigs;
    if (filterClassId) {
      list = list.filter(c => c.classId === filterClassId);
    }
    const lvl = filterLevel.trim().toLowerCase();
    if (lvl) {
      list = list.filter(c => (c.level ?? '').toLowerCase().includes(lvl));
    }
    return list;
  }, [allConfigs, filterClassId, filterLevel]);

  const reload = useCallback(async () => {
    if (!profile?.id) return;
    setLoadError(null);
    const { configs, error } = await fetchTeacherClassesWithSchedules(profile.id);
    if (error) {
      setLoadError(error);
      setAllConfigs([]);
      return;
    }
    setAllConfigs(configs);
    const ids = configs.map(c => c.classId);
    const absRes = await fetchTeacherAbsencesForClasses(ids);
    if (absRes.error) setLoadError(absRes.error);
    setAbsenceRows(absRes.rows);
    setNamesByStudent(absRes.namesByStudent);
  }, [profile?.id]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const occByDate = useMemo(
    () => mergeOccurrences(filteredConfigs, rangeStart, rangeEnd),
    [filteredConfigs, rangeStart, rangeEnd],
  );

  const absencesInMonth = useMemo(() => {
    const y = format(anchor, 'yyyy-MM');
    return absenceRows.filter(
      r => r.absent_on.startsWith(y) && (!filterClassId || r.class_id === filterClassId),
    );
  }, [absenceRows, anchor, filterClassId]);

  return (
    <div className="min-h-screen bg-page text-ink p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <button
              type="button"
              onClick={() => navigate('/teacher')}
              className="text-ink-secondary hover:text-ink text-sm block mb-1"
            >
              ← Dashboard
            </button>
            <h1 className="text-2xl font-bold">Class calendar</h1>
            <p className="text-ink-secondary text-sm mt-1">
              All your classes’ meeting times. Filter by class or level; student absences appear below.
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

        <div className="flex flex-wrap gap-3 items-end">
          <label className="block">
            <span className="text-xs text-ink-secondary font-medium">Class</span>
            <select
              value={filterClassId}
              onChange={e => setFilterClassId(e.target.value)}
              className="mt-1 block px-3 py-2 rounded-xl bg-surface border border-border text-ink text-sm min-w-[12rem]"
            >
              <option value="">All classes</option>
              {allConfigs.map(c => (
                <option key={c.classId} value={c.classId}>
                  {c.className}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-xs text-ink-secondary font-medium">Level contains</span>
            <input
              value={filterLevel}
              onChange={e => setFilterLevel(e.target.value)}
              placeholder="e.g. beginner"
              className="mt-1 block px-3 py-2 rounded-xl bg-surface border border-border text-ink text-sm"
            />
          </label>
        </div>

        {loadError && (
          <div className="rounded-xl border border-red-800 bg-red-950/50 text-red-200 text-sm px-4 py-3">{loadError}</div>
        )}

        {allConfigs.length === 0 && !loadError ? (
          <p className="text-ink-secondary text-sm">Create a class first, then add a weekly schedule on the class page.</p>
        ) : (
          <div className="bg-surface border border-border rounded-2xl p-4 sm:p-6 overflow-x-auto">
            <MonthGrid
              anchor={anchor}
              renderCell={iso => {
                const list = occByDate.get(iso) ?? [];
                if (list.length === 0) return null;
                return (
                  <div className="space-y-0.5">
                    {list.slice(0, 2).map(o => (
                      <div key={o.scheduleId + o.startsAt} className="truncate text-ink-secondary">
                        <span className="text-ink">{o.className}</span> · {o.startsAt}
                      </div>
                    ))}
                    {list.length > 2 && (
                      <div className="text-ink-secondary">+{list.length - 2}</div>
                    )}
                  </div>
                );
              }}
            />
          </div>
        )}

        <div className="bg-surface border border-border rounded-2xl p-5">
          <h2 className="text-ink font-semibold text-sm uppercase tracking-wide mb-3">
            Student absences ({format(anchor, 'MMMM yyyy')})
          </h2>
          {absencesInMonth.length === 0 ? (
            <p className="text-ink-secondary text-sm">No absences recorded this month.</p>
          ) : (
            <ul className="space-y-2 max-h-56 overflow-y-auto text-sm">
              {absencesInMonth.map(a => (
                <li key={a.id} className="flex flex-wrap gap-2 border-b border-border/50 pb-2">
                  <span className="font-mono text-ink-secondary">{a.absent_on}</span>
                  <span className="text-ink font-medium">{namesByStudent[a.student_id] ?? '?'} </span>
                  <span className="text-ink-secondary">
                    {allConfigs.find(c => c.classId === a.class_id)?.className ?? 'Class'}
                  </span>
                  {a.note && <span className="text-ink-secondary italic">— {a.note}</span>}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
