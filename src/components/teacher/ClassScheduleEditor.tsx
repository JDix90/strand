import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  deleteClassScheduleRow,
  updateClassMeta,
  upsertClassScheduleRow,
} from '../../lib/calendarApi';

const WEEKDAYS = [
  { v: 0, l: 'Sunday' },
  { v: 1, l: 'Monday' },
  { v: 2, l: 'Tuesday' },
  { v: 3, l: 'Wednesday' },
  { v: 4, l: 'Thursday' },
  { v: 5, l: 'Friday' },
  { v: 6, l: 'Saturday' },
];

interface Row {
  id: string;
  weekday: number;
  starts_at: string;
  ends_at: string;
}

export function ClassScheduleEditor({ classId }: { classId: string }) {
  const [timezone, setTimezone] = useState('UTC');
  const [level, setLevel] = useState('');
  const [termStart, setTermStart] = useState('');
  const [termEnd, setTermEnd] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: cls } = await supabase
        .from('classes')
        .select('timezone, level, term_starts_on, term_ends_on')
        .eq('id', classId)
        .single();
      const { data: sched } = await supabase
        .from('class_schedules')
        .select('id, weekday, starts_at, ends_at')
        .eq('class_id', classId);
      if (cancelled) return;
      if (cls) {
        setTimezone(cls.timezone ?? 'UTC');
        setLevel(cls.level ?? '');
        setTermStart(cls.term_starts_on ?? '');
        setTermEnd(cls.term_ends_on ?? '');
      }
      setRows((sched ?? []) as Row[]);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const saveMeta = async () => {
    setMsg(null);
    const { error } = await updateClassMeta(classId, {
      timezone,
      level: level.trim() || null,
      term_starts_on: termStart || null,
      term_ends_on: termEnd || null,
    });
    setMsg(error ? error : 'Schedule settings saved.');
  };

  const addRow = async () => {
    setMsg(null);
    const { error } = await upsertClassScheduleRow(classId, {
      weekday: 1,
      starts_at: '09:00:00',
      ends_at: '10:00:00',
    });
    if (error) {
      setMsg(error);
      return;
    }
    const { data } = await supabase
      .from('class_schedules')
      .select('id, weekday, starts_at, ends_at')
      .eq('class_id', classId);
    setRows((data ?? []) as Row[]);
  };

  const updateRowLocal = (id: string, patch: Partial<Row>) => {
    setRows(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  };

  const saveRow = async (r: Row) => {
    setMsg(null);
    const { error } = await supabase
      .from('class_schedules')
      .update({
        weekday: r.weekday,
        starts_at: r.starts_at.length === 5 ? `${r.starts_at}:00` : r.starts_at,
        ends_at: r.ends_at.length === 5 ? `${r.ends_at}:00` : r.ends_at,
      })
      .eq('id', r.id);
    setMsg(error ? error.message : 'Meeting time updated.');
  };

  const removeRow = async (id: string) => {
    setMsg(null);
    const { error } = await deleteClassScheduleRow(id);
    if (error) setMsg(error);
    else setRows(prev => prev.filter(r => r.id !== id));
  };

  if (loading) return <p className="text-ink-secondary text-sm">Loading schedule…</p>;

  return (
    <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
      <h2 className="text-ink font-bold">Class calendar & schedule</h2>
      <p className="text-ink-secondary text-sm">
        Set term dates and weekly meeting times. Students see these on their calendar.
      </p>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="block">
          <span className="text-ink-secondary text-xs font-medium">Timezone (IANA)</span>
          <input
            value={timezone}
            onChange={e => setTimezone(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl bg-page border border-border-strong text-ink text-sm"
            placeholder="America/New_York"
          />
        </label>
        <label className="block">
          <span className="text-ink-secondary text-xs font-medium">Level (filter)</span>
          <input
            value={level}
            onChange={e => setLevel(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl bg-page border border-border-strong text-ink text-sm"
            placeholder="beginner, intermediate…"
          />
        </label>
        <label className="block">
          <span className="text-ink-secondary text-xs font-medium">Term starts</span>
          <input
            type="date"
            value={termStart}
            onChange={e => setTermStart(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl bg-page border border-border-strong text-ink text-sm"
          />
        </label>
        <label className="block">
          <span className="text-ink-secondary text-xs font-medium">Term ends</span>
          <input
            type="date"
            value={termEnd}
            onChange={e => setTermEnd(e.target.value)}
            className="mt-1 w-full px-3 py-2 rounded-xl bg-page border border-border-strong text-ink text-sm"
          />
        </label>
      </div>
      <button
        type="button"
        onClick={() => void saveMeta()}
        className="px-4 py-2 bg-brand hover:bg-brand-hover text-ink rounded-xl text-sm font-semibold"
      >
        Save term & timezone
      </button>

      <div className="border-t border-border pt-4 space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-ink font-semibold text-sm">Weekly meetings</h3>
          <button
            type="button"
            onClick={() => void addRow()}
            className="text-sm text-link hover:underline"
          >
            + Add time slot
          </button>
        </div>
        {rows.length === 0 ? (
          <p className="text-ink-secondary text-sm">No recurring times yet.</p>
        ) : (
          <ul className="space-y-2">
            {rows.map(r => (
              <li
                key={r.id}
                className="flex flex-wrap items-end gap-2 p-3 rounded-xl bg-page border border-border"
              >
                <label className="text-xs text-ink-secondary">
                  Day
                  <select
                    value={r.weekday}
                    onChange={e => updateRowLocal(r.id, { weekday: Number(e.target.value) })}
                    className="block mt-0.5 px-2 py-1 rounded-lg border border-border bg-surface text-ink text-sm"
                  >
                    {WEEKDAYS.map(w => (
                      <option key={w.v} value={w.v}>
                        {w.l}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-ink-secondary">
                  Start
                  <input
                    type="time"
                    value={r.starts_at.slice(0, 5)}
                    onChange={e => updateRowLocal(r.id, { starts_at: `${e.target.value}:00` })}
                    className="block mt-0.5 px-2 py-1 rounded-lg border border-border bg-surface text-ink text-sm"
                  />
                </label>
                <label className="text-xs text-ink-secondary">
                  End
                  <input
                    type="time"
                    value={r.ends_at.slice(0, 5)}
                    onChange={e => updateRowLocal(r.id, { ends_at: `${e.target.value}:00` })}
                    className="block mt-0.5 px-2 py-1 rounded-lg border border-border bg-surface text-ink text-sm"
                  />
                </label>
                <button
                  type="button"
                  onClick={() => void saveRow(r)}
                  className="px-3 py-1.5 bg-surface-muted rounded-lg text-sm text-ink"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => void removeRow(r.id)}
                  className="px-3 py-1.5 text-red-400 text-sm"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {msg && <p className="text-sm text-ink-secondary">{msg}</p>}
    </div>
  );
}
