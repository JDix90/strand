import { useEffect, useState } from 'react';
import {
  fetchAllCatalogUnits,
  fetchClassCurriculum,
  upsertClassCurriculumRow,
  type ClassCurriculumRow,
  type UnitRow,
} from '../../lib/curriculumApi';

function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(local: string): string | null {
  if (!local.trim()) return null;
  const t = new Date(local).getTime();
  if (Number.isNaN(t)) return null;
  return new Date(local).toISOString();
}

interface Props {
  classId: string;
}

export function ClassCurriculumSection({ classId }: Props) {
  const [catalog, setCatalog] = useState<UnitRow[]>([]);
  const [linked, setLinked] = useState<ClassCurriculumRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [curriculumError, setCurriculumError] = useState<string | null>(null);

  const reload = async () => {
    const [cat, ccRes] = await Promise.all([fetchAllCatalogUnits(), fetchClassCurriculum(classId)]);
    setCatalog(cat);
    setCurriculumError(ccRes.error);
    setLinked(ccRes.rows.sort((a, b) => a.sort_order - b.sort_order));
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      await reload();
      if (!cancelled) setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const linkedByUnit = new Map(linked.map(r => [r.unit_id, r]));

  const move = async (unitId: string, dir: -1 | 1) => {
    const visibleLinked = linked.filter(l => l.is_visible).sort((a, b) => a.sort_order - b.sort_order);
    const idx = visibleLinked.findIndex(l => l.unit_id === unitId);
    if (idx < 0) return;
    const j = idx + dir;
    if (j < 0 || j >= visibleLinked.length) return;
    const a = visibleLinked[idx];
    const b = visibleLinked[j];
    setBusy(unitId);
    await upsertClassCurriculumRow({
      class_id: classId,
      unit_id: a.unit_id,
      sort_order: b.sort_order,
      is_visible: a.is_visible,
      unlock_at: a.unlock_at,
      lock_policy: a.lock_policy,
    });
    await upsertClassCurriculumRow({
      class_id: classId,
      unit_id: b.unit_id,
      sort_order: a.sort_order,
      is_visible: b.is_visible,
      unlock_at: b.unlock_at,
      lock_policy: b.lock_policy,
    });
    await reload();
    setBusy(null);
  };

  const addUnit = async (unit: UnitRow) => {
    setBusy(unit.id);
    const maxOrder = linked.reduce((m, l) => Math.max(m, l.sort_order), -1);
    await upsertClassCurriculumRow({
      class_id: classId,
      unit_id: unit.id,
      sort_order: maxOrder + 1,
      is_visible: true,
      unlock_at: null,
      lock_policy: null,
    });
    await reload();
    setBusy(null);
  };

  const setVisibility = async (row: ClassCurriculumRow, is_visible: boolean) => {
    setBusy(row.unit_id);
    await upsertClassCurriculumRow({
      class_id: classId,
      unit_id: row.unit_id,
      sort_order: row.sort_order,
      is_visible,
      unlock_at: row.unlock_at,
      lock_policy: row.lock_policy,
    });
    await reload();
    setBusy(null);
  };

  const saveUnlockAt = async (row: ClassCurriculumRow, localValue: string) => {
    const iso = fromDatetimeLocalValue(localValue);
    setBusy(row.unit_id);
    await upsertClassCurriculumRow({
      class_id: classId,
      unit_id: row.unit_id,
      sort_order: row.sort_order,
      is_visible: row.is_visible,
      unlock_at: iso,
      lock_policy: row.lock_policy,
    });
    await reload();
    setBusy(null);
  };

  if (loading) {
    return <div className="text-slate-500 text-sm py-4">Loading curriculum…</div>;
  }

  return (
    <div>
      {curriculumError && (
        <div className="mb-4 rounded-xl border border-red-800 bg-red-950/40 text-red-200 text-sm px-4 py-3">
          Could not load class curriculum: {curriculumError}
        </div>
      )}
      <h2 className="text-slate-300 text-sm font-semibold uppercase tracking-wider mb-4">
        Curriculum units
      </h2>
      <p className="text-slate-500 text-sm mb-4">
        Add units from the catalog, set visibility and optional unlock time. Order matches the student sidebar
        (visible units only). Hiding a unit keeps its settings; students no longer see it.
      </p>
      <div className="space-y-2">
        {catalog.map(u => {
          const row = linkedByUnit.get(u.id);
          if (!row) {
            return (
              <div
                key={u.id}
                className="flex items-center justify-between gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3"
              >
                <div className="min-w-0">
                  <p className="text-white font-medium truncate">{u.title}</p>
                  <p className="text-slate-500 text-xs truncate">{u.slug} · {u.content_module}</p>
                </div>
                <button
                  type="button"
                  disabled={!!busy}
                  onClick={() => addUnit(u)}
                  className="px-3 py-1.5 rounded-lg bg-green-800 text-green-100 text-xs font-semibold hover:bg-green-700 disabled:opacity-40"
                >
                  Add to class
                </button>
              </div>
            );
          }

          return (
            <div
              key={u.id}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium truncate">{u.title}</p>
                <p className="text-slate-500 text-xs truncate">{u.slug} · {u.content_module}</p>
                {!row.is_visible && (
                  <span className="inline-block mt-1 text-xs text-amber-400">Hidden from students</span>
                )}
                <label className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                  <span className="w-24 shrink-0">Unlock at</span>
                  <input
                    key={`${row.unit_id}-${row.unlock_at ?? 'none'}`}
                    type="datetime-local"
                    defaultValue={toDatetimeLocalValue(row.unlock_at)}
                    disabled={!!busy}
                    onBlur={e => {
                      const v = e.target.value;
                      const cur = toDatetimeLocalValue(row.unlock_at);
                      if (v === cur) return;
                      void saveUnlockAt(row, v);
                    }}
                    className="flex-1 min-w-0 bg-slate-900 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs"
                  />
                </label>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <label className="flex items-center gap-2 text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={row.is_visible}
                    disabled={!!busy}
                    onChange={() => setVisibility(row, !row.is_visible)}
                  />
                  Visible
                </label>
                <button
                  type="button"
                  disabled={!!busy || !row.is_visible}
                  onClick={() => move(u.id, -1)}
                  className="px-2 py-1 rounded-lg bg-slate-700 text-slate-200 text-xs disabled:opacity-40"
                >
                  Up
                </button>
                <button
                  type="button"
                  disabled={!!busy || !row.is_visible}
                  onClick={() => move(u.id, 1)}
                  className="px-2 py-1 rounded-lg bg-slate-700 text-slate-200 text-xs disabled:opacity-40"
                >
                  Down
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <p className="text-slate-600 text-xs mt-4">
        Advanced prerequisite rules use <code className="text-slate-500">lock_policy</code> JSON — see{' '}
        <span className="text-slate-500">docs/curriculum-lock-policy.md</span>.
      </p>
    </div>
  );
}
