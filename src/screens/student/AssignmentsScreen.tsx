import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import {
  assignmentModeToModeId,
  buildClassUnitModePath,
  modeIdToRouteSegment,
  resolveDefaultUnitId,
} from '../../lib/studentNavigation';
import { useGameStore } from '../../store/gameStore';

interface AssignmentDisplay {
  id: string;
  title: string;
  description: string | null;
  mode_id: string;
  min_questions: number;
  min_accuracy: number;
  due_date: string | null;
  class_id: string;
  unit_id: string | null;
  class_name: string;
  completed: boolean;
  completed_at: string | null;
}

export function AssignmentsScreen() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const masteryRecords = useGameStore(s => s.masteryRecords);
  const [assignments, setAssignments] = useState<AssignmentDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const load = async () => {
      const { data: memberships } = await supabase
        .from('class_memberships')
        .select('class_id')
        .eq('student_id', profile.id);

      const classIds = (memberships ?? []).map(m => m.class_id);
      if (classIds.length === 0) { setLoading(false); return; }

      const { data: assigns } = await supabase
        .from('assignments')
        .select(
          'id, title, description, mode_id, min_questions, min_accuracy, due_date, class_id, unit_id, created_at'
        )
        .in('class_id', classIds)
        .order('created_at', { ascending: false });

      if (!assigns || assigns.length === 0) { setLoading(false); return; }

      const { data: classes } = await supabase
        .from('classes')
        .select('id, name')
        .in('id', classIds);
      const classMap = Object.fromEntries((classes ?? []).map(c => [c.id, c.name]));

      const assignIds = assigns.map(a => a.id);
      const { data: completions } = await supabase
        .from('assignment_completions')
        .select('assignment_id, completed_at')
        .eq('student_id', profile.id)
        .in('assignment_id', assignIds);
      const completionMap = Object.fromEntries((completions ?? []).map(c => [c.assignment_id, c.completed_at]));

      setAssignments(assigns.map(a => ({
        id: a.id,
        title: a.title,
        description: a.description,
        mode_id: a.mode_id,
        min_questions: a.min_questions,
        min_accuracy: a.min_accuracy,
        due_date: a.due_date,
        class_id: a.class_id,
        unit_id: a.unit_id ?? null,
        class_name: classMap[a.class_id] ?? '',
        completed: !!completionMap[a.id],
        completed_at: completionMap[a.id] ?? null,
      })));
      setLoading(false);
    };

    load();
  }, [profile]);

  const pending = assignments.filter(a => !a.completed);
  const completed = assignments.filter(a => a.completed);

  const modeLabel = (modeId: string) => {
    const labels: Record<string, string> = {
      learn_table: 'Learn',
      practice: 'Practice',
      speed_round: 'Speed Round',
      boss_battle: 'Boss Battle',
      memory_match: 'Memory',
      grid_challenge: 'Grid',
    };
    return labels[modeId] ?? modeId;
  };

  const startAssignment = useCallback(
    async (a: AssignmentDisplay) => {
      const modeId = assignmentModeToModeId(a.mode_id);
      if (a.unit_id) {
        navigate(buildClassUnitModePath(a.class_id, a.unit_id, modeId));
        return;
      }
      const uid = await resolveDefaultUnitId(a.class_id, masteryRecords);
      if (uid) {
        navigate(buildClassUnitModePath(a.class_id, uid, modeId));
      } else {
        const seg = modeIdToRouteSegment(modeId);
        navigate(`/${seg}`);
      }
    },
    [navigate, masteryRecords]
  );

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="bg-surface-elevated border-b border-border px-6 py-5">
        <div className="max-w-3xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/home')} className="text-ink-secondary hover:text-ink">
            ← Overview
          </button>
          <h1 className="text-xl font-bold text-ink">Assignments</h1>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">
        {loading ? (
          <div className="text-ink-secondary text-center py-12">Loading assignments...</div>
        ) : assignments.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-5xl">📝</div>
            <p className="text-ink-secondary font-semibold">No assignments yet</p>
            <p className="text-ink-secondary text-sm">When your teacher creates assignments, they'll appear here.</p>
          </div>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <div>
                <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">
                  To Do ({pending.length})
                </h2>
                <div className="space-y-3">
                  {pending.map(a => {
                    const overdue = a.due_date && new Date(a.due_date) < new Date();
                    return (
                      <div
                        key={a.id}
                        className={`bg-surface border rounded-2xl p-5 ${overdue ? 'border-red-700' : 'border-border'}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h3 className="text-ink font-bold">{a.title}</h3>
                            <p className="text-ink-secondary text-xs">{a.class_name}</p>
                          </div>
                          {a.due_date && (
                            <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                              overdue ? 'bg-red-950 text-red-300' : 'bg-amber-950 text-amber-300'
                            }`}>
                              {overdue ? 'Overdue' : `Due ${new Date(a.due_date).toLocaleDateString()}`}
                            </span>
                          )}
                        </div>
                        {a.description && <p className="text-ink-secondary text-sm mb-3">{a.description}</p>}
                        <div className="flex items-center justify-between">
                          <div className="text-ink-secondary text-xs space-x-3">
                            <span>{modeLabel(a.mode_id)}</span>
                            <span>Min {a.min_questions}q</span>
                            <span>Min {Math.round(a.min_accuracy * 100)}% acc</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => void startAssignment(a)}
                            className="px-4 py-1.5 bg-brand hover:bg-brand-hover text-white rounded-xl font-semibold text-sm transition-colors"
                          >
                            Start
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Completed */}
            {completed.length > 0 && (
              <div>
                <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">
                  Completed ({completed.length})
                </h2>
                <div className="space-y-2">
                  {completed.map(a => (
                    <div
                      key={a.id}
                      className="flex items-center justify-between bg-surface border border-border rounded-xl px-5 py-3 opacity-70"
                    >
                      <div>
                        <p className="text-ink text-sm font-medium">{a.title}</p>
                        <p className="text-ink-secondary text-xs">{a.class_name}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-green-400 text-xs font-semibold">✓ Done</span>
                        {a.completed_at && (
                          <p className="text-ink-secondary text-xs">{new Date(a.completed_at).toLocaleDateString()}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
