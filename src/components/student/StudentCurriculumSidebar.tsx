import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  fetchClassCurriculum,
  type ClassCurriculumRow,
} from '../../lib/curriculumApi';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { useGameStore } from '../../store/gameStore';
import {
  buildClassUnitModePath,
  assignmentModeToModeId,
  describeRowLock,
} from '../../lib/studentNavigation';

interface AssignmentDue {
  id: string;
  title: string;
  due_date: string | null;
  unit_id: string | null;
  mode_id: string | null;
}

interface CompletedAssignment {
  assignment_id: string;
  title: string;
  completed_at: string;
}

export interface StudentCurriculumSidebarProps {
  classId: string;
  classLabel?: string;
  classOptions?: { id: string; name: string }[];
  onClassChange?: (classId: string) => void;
  homeTo?: string;
}

export function StudentCurriculumSidebar({
  classId,
  classLabel,
  classOptions,
  onClassChange,
  homeTo = '/home',
}: StudentCurriculumSidebarProps) {
  const location = useLocation();
  const { profile } = useAuth();
  const masteryRecords = useGameStore(s => s.masteryRecords);
  const [curriculum, setCurriculum] = useState<ClassCurriculumRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentDue[]>([]);
  const [completedRows, setCompletedRows] = useState<CompletedAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);

      const ccRes = await fetchClassCurriculum(classId);
      const asgRes = await supabase
        .from('assignments')
        .select('id, title, due_date, unit_id, mode_id')
        .eq('class_id', classId)
        .order('due_date', { ascending: true });

      if (cancelled) return;

      if (asgRes.error) {
        setError(asgRes.error.message);
        setCurriculum([]);
        setAssignments([]);
        setCompletedRows([]);
        setLoading(false);
        return;
      }

      if (ccRes.error) {
        setError(ccRes.error);
        setCurriculum([]);
      } else {
        setCurriculum(ccRes.rows.filter(c => c.is_visible));
      }

      const asgList = (asgRes.data ?? []) as AssignmentDue[];
      setAssignments(asgList);

      if (profile?.id && asgList.length > 0) {
        const ids = asgList.map(a => a.id);
        const { data: comps, error: cErr } = await supabase
          .from('assignment_completions')
          .select('assignment_id, completed_at')
          .eq('student_id', profile.id)
          .in('assignment_id', ids);
        if (!cancelled && !cErr && comps?.length) {
          const titleById = Object.fromEntries(asgList.map(a => [a.id, a.title]));
          setCompletedRows(
            comps.map(c => ({
              assignment_id: c.assignment_id,
              title: titleById[c.assignment_id] ?? 'Assignment',
              completed_at: c.completed_at,
            }))
          );
        } else if (!cancelled) {
          setCompletedRows([]);
        }
      } else if (!cancelled) {
        setCompletedRows([]);
      }

      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [classId, profile?.id, retryKey]);

  const suggested = useMemo(() => {
    const byAssign = new Set(
      assignments.filter(a => a.unit_id).map(a => a.unit_id as string)
    );
    const rows = [...curriculum].sort((a, b) => a.sort_order - b.sort_order);
    const dueIds = assignments.map(a => a.unit_id).filter(Boolean) as string[];
    return rows.sort((a, b) => {
      const aDue = dueIds.includes(a.unit_id) ? 0 : 1;
      const bDue = dueIds.includes(b.unit_id) ? 0 : 1;
      if (aDue !== bDue) return aDue - bDue;
      const aOpen = byAssign.has(a.unit_id) ? 0 : 1;
      const bOpen = byAssign.has(b.unit_id) ? 0 : 1;
      if (aOpen !== bOpen) return aOpen - bOpen;
      return a.sort_order - b.sort_order;
    });
  }, [curriculum, assignments]);

  const completedIds = useMemo(
    () => new Set(completedRows.map(c => c.assignment_id)),
    [completedRows]
  );

  const pendingAssignments = useMemo(
    () => assignments.filter(a => !completedIds.has(a.id)),
    [assignments, completedIds]
  );

  const headerTitle = classLabel?.trim() || `Class ${classId.slice(0, 8)}…`;

  return (
    <aside className="w-64 shrink-0 border-r border-slate-800 bg-slate-900/80 flex flex-col min-h-screen">
      <div className="p-4 border-b border-slate-800">
        <Link to={homeTo} className="text-slate-400 hover:text-white text-sm">
          ← Overview
        </Link>
        {classOptions && classOptions.length > 1 && onClassChange ? (
          <label className="block mt-3">
            <span className="text-xs text-slate-500 uppercase tracking-wide">Class</span>
            <select
              value={classId}
              onChange={e => onClassChange(e.target.value)}
              className="mt-1 w-full bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-2 py-1.5"
            >
              {classOptions.map(c => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <p className="text-white font-semibold mt-2">Class</p>
            <p className="text-xs text-slate-500 truncate" title={classId}>
              {headerTitle}
            </p>
          </>
        )}
      </div>
      {error && (
        <div className="px-3 py-2 text-xs text-red-300 bg-red-950/50 border-b border-red-900 flex items-center justify-between gap-2">
          <span className="break-words">{error}</span>
          <button
            type="button"
            onClick={() => {
              setError(null);
              setRetryKey(k => k + 1);
            }}
            className="shrink-0 text-red-200 underline"
          >
            Retry
          </button>
        </div>
      )}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1" aria-label="Class curriculum">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 mb-2">
          Units & tasks
        </p>
        {loading && <p className="text-slate-500 text-sm px-2">Loading…</p>}
        {!loading && !error && suggested.length === 0 && (
          <p className="text-slate-500 text-sm px-2">
            No units yet. Your teacher will add curriculum here.
          </p>
        )}
        {!loading &&
          suggested.map(row => {
            const u = Array.isArray(row.units) ? row.units[0] : row.units;
            if (!u) return null;
            const { locked, reason } = describeRowLock(row, masteryRecords);
            const active = location.pathname.includes(`/unit/${row.unit_id}`);
            if (locked) {
              return (
                <div
                  key={row.unit_id}
                  title={reason}
                  className="rounded-lg px-3 py-2 text-sm text-slate-500 cursor-not-allowed border border-slate-800/80"
                >
                  <span className="block font-medium truncate">{u.title}</span>
                  <span className="text-[10px] text-slate-600">{reason ?? 'Locked'}</span>
                </div>
              );
            }
            return (
              <Link
                key={row.unit_id}
                to={`/class/${classId}/unit/${row.unit_id}/practice`}
                aria-current={active ? 'page' : undefined}
                className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                  active ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800/80'
                }`}
              >
                <span className="block font-medium truncate">{u.title}</span>
                {(() => {
                  const sub =
                    u.topics?.title?.trim() ||
                    (u.description?.trim()
                      ? u.description.length > 48
                        ? `${u.description.slice(0, 48)}…`
                        : u.description
                      : '');
                  return sub ? (
                    <span className="text-[10px] text-slate-500 block truncate" title={sub}>
                      {sub}
                    </span>
                  ) : null;
                })()}
              </Link>
            );
          })}
        {pendingAssignments.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 mt-4 mb-2">
              Assignments
            </p>
            {pendingAssignments.map(a => {
              const modeId = assignmentModeToModeId(a.mode_id);
              const href =
                a.unit_id != null ? buildClassUnitModePath(classId, a.unit_id, modeId) : null;
              return (
                <div key={a.id} className="px-3 py-2 text-xs border border-slate-800 rounded-lg">
                  {href ? (
                    <Link to={href} className="text-slate-200 font-medium hover:text-white block">
                      {a.title}
                    </Link>
                  ) : (
                    <span className="text-slate-200">{a.title}</span>
                  )}
                  {a.due_date && (
                    <span className="block text-slate-500">Due {new Date(a.due_date).toLocaleDateString()}</span>
                  )}
                </div>
              );
            })}
          </>
        )}
        {completedRows.length > 0 && (
          <>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide px-2 mt-4 mb-2">
              Completed
            </p>
            {completedRows.map(c => (
              <div
                key={c.assignment_id}
                className="px-3 py-1.5 text-xs text-slate-500 border border-slate-800/80 rounded-lg"
              >
                <span className="text-slate-400 line-through">{c.title}</span>
                <span className="block text-slate-600">
                  {new Date(c.completed_at).toLocaleDateString()}
                </span>
              </div>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}
