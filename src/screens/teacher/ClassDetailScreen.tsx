import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { ClassCurriculumSection } from './ClassCurriculumSection';
import { TeacherCurriculumChecklist } from './TeacherCurriculumChecklist';
import { ClassScheduleEditor } from '../../components/teacher/ClassScheduleEditor';
import { ClassNotesPanel } from '../../components/class/ClassNotesPanel';

interface ClassInfo {
  id: string;
  name: string;
  join_code: string;
  teacher_id: string;
}

interface StudentRow {
  id: string;
  display_name: string;
  joined_at: string;
  totalAttempts: number;
  accuracy: number;
  sessionsCount: number;
}

interface AssignmentRow {
  id: string;
  title: string;
  due_date: string | null;
  created_at: string;
  completions: number;
}

export function ClassDetailScreen() {
  const { classId } = useParams<{ classId: string }>();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [classInfo, setClassInfo] = useState<ClassInfo | null>(null);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [assignments, setAssignments] = useState<AssignmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!classId) return;

    const load = async () => {
      const { data: cls } = await supabase
        .from('classes')
        .select('id, name, join_code, teacher_id')
        .eq('id', classId)
        .single();

      if (!cls) { setLoading(false); return; }
      setClassInfo(cls);

      const { data: memberships } = await supabase
        .from('class_memberships')
        .select('student_id, joined_at')
        .eq('class_id', classId);

      const studentIds = (memberships ?? []).map(m => m.student_id);

      if (studentIds.length > 0) {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, display_name')
          .in('id', studentIds);

        const { data: mastery } = await supabase
          .from('mastery_records')
          .select('user_id, attempts, correct')
          .in('user_id', studentIds);

        const { data: sessions } = await supabase
          .from('session_summaries')
          .select('user_id')
          .in('user_id', studentIds);

        const profileMap = Object.fromEntries((profiles ?? []).map(p => [p.id, p]));
        const masteryByUser: Record<string, { attempts: number; correct: number }> = {};
        for (const m of mastery ?? []) {
          const agg = masteryByUser[m.user_id] ?? { attempts: 0, correct: 0 };
          agg.attempts += m.attempts;
          agg.correct += m.correct;
          masteryByUser[m.user_id] = agg;
        }
        const sessionCountByUser: Record<string, number> = {};
        for (const s of sessions ?? []) {
          sessionCountByUser[s.user_id] = (sessionCountByUser[s.user_id] ?? 0) + 1;
        }

        const joinedMap = Object.fromEntries((memberships ?? []).map(m => [m.student_id, m.joined_at]));

        setStudents(studentIds.map(sid => {
          const prof = profileMap[sid];
          const agg = masteryByUser[sid];
          return {
            id: sid,
            display_name: prof?.display_name ?? 'Unknown',
            joined_at: joinedMap[sid],
            totalAttempts: agg?.attempts ?? 0,
            accuracy: agg && agg.attempts > 0 ? agg.correct / agg.attempts : 0,
            sessionsCount: sessionCountByUser[sid] ?? 0,
          };
        }));
      }

      const { data: assigns } = await supabase
        .from('assignments')
        .select('id, title, due_date, created_at')
        .eq('class_id', classId)
        .order('created_at', { ascending: false });

      if (assigns && assigns.length > 0) {
        const assignIds = assigns.map(a => a.id);
        const { data: completions } = await supabase
          .from('assignment_completions')
          .select('assignment_id')
          .in('assignment_id', assignIds);

        const completeMap: Record<string, number> = {};
        for (const c of completions ?? []) {
          completeMap[c.assignment_id] = (completeMap[c.assignment_id] ?? 0) + 1;
        }

        setAssignments(assigns.map(a => ({
          ...a,
          completions: completeMap[a.id] ?? 0,
        })));
      }

      setLoading(false);
    };

    load();
  }, [classId]);

  const copyCode = () => {
    if (classInfo) {
      navigator.clipboard.writeText(classInfo.join_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-ink-secondary text-lg">Loading class...</div>
      </div>
    );
  }

  if (!classInfo) {
    return (
      <div className="min-h-screen bg-page flex items-center justify-center">
        <div className="text-ink-secondary text-lg">Class not found.</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="bg-surface-elevated border-b border-border px-6 py-5">
        <div className="max-w-4xl mx-auto">
          <button onClick={() => navigate('/teacher')} className="text-ink-secondary hover:text-ink text-sm mb-2 block">
            ← Dashboard
          </button>
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-ink">{classInfo.name}</h1>
            <button
              onClick={copyCode}
              className="bg-brand/15 hover:bg-blue-900 text-link font-mono text-sm px-4 py-2 rounded-xl transition-colors flex items-center gap-2"
            >
              <span>{classInfo.join_code}</span>
              <span className="text-blue-500 text-xs">{copied ? '✓ Copied' : 'Copy'}</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {/* Quick Actions */}
        <TeacherCurriculumChecklist classId={classId!} />

        <div className="flex flex-wrap gap-3 items-center">
          <button
            onClick={() => navigate(`/teacher/assign/${classId}`)}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            + New Assignment
          </button>
          <button
            onClick={() => navigate(`/teacher/analytics/${classId}`)}
            className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Class Analytics
          </button>
          <button
            type="button"
            onClick={() => navigate('/teacher/calendar')}
            className="px-4 py-2 bg-surface hover:bg-surface-muted border border-border-strong text-ink rounded-xl text-sm"
          >
            Class calendar
          </button>
          <button
            type="button"
            onClick={() => {
              const url = `${window.location.origin}/class/${classId}`;
              void navigator.clipboard.writeText(url);
            }}
            className="px-4 py-2 bg-surface hover:bg-surface-muted border border-border-strong text-ink rounded-xl text-sm"
          >
            Copy student class link
          </button>
        </div>

        {classId && <ClassScheduleEditor classId={classId} />}

        {profile && classId && (
          <ClassNotesPanel
            classId={classId}
            viewerId={profile.id}
            canManageClass={
              profile.role === 'admin' ||
              (profile.role === 'teacher' && classInfo.teacher_id === profile.id)
            }
          />
        )}

        <div id="class-curriculum">
          <ClassCurriculumSection classId={classId!} />
        </div>

        {/* Student Roster */}
        <div>
          <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">
            Students ({students.length})
          </h2>
          {students.length === 0 ? (
            <div className="bg-surface border border-border rounded-2xl p-8 text-center">
              <p className="text-ink-secondary">No students have joined yet.</p>
              <p className="text-ink-secondary text-sm mt-1">Share the join code: <span className="font-mono text-link">{classInfo.join_code}</span></p>
            </div>
          ) : (
            <div className="bg-surface border border-border rounded-2xl overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border text-ink-secondary text-xs uppercase">
                    <th className="px-5 py-3 text-left">Name</th>
                    <th className="px-5 py-3 text-right">Attempts</th>
                    <th className="px-5 py-3 text-right">Accuracy</th>
                    <th className="px-5 py-3 text-right">Sessions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map(s => (
                    <tr
                      key={s.id}
                      onClick={() => navigate(`/teacher/student/${s.id}?classId=${classId}`)}
                      className="border-b border-border/50 hover:bg-surface-muted/80 cursor-pointer transition-colors"
                    >
                      <td className="px-5 py-3 text-ink font-medium">{s.display_name}</td>
                      <td className="px-5 py-3 text-right text-ink-secondary">{s.totalAttempts}</td>
                      <td className="px-5 py-3 text-right text-ink-secondary">
                        {s.totalAttempts > 0 ? `${Math.round(s.accuracy * 100)}%` : '—'}
                      </td>
                      <td className="px-5 py-3 text-right text-ink-secondary">{s.sessionsCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Assignments */}
        <div>
          <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider mb-4">
            Assignments ({assignments.length})
          </h2>
          {assignments.length === 0 ? (
            <p className="text-ink-secondary text-sm">No assignments created yet.</p>
          ) : (
            <div className="space-y-2">
              {assignments.map(a => (
                <div
                  key={a.id}
                  className="flex items-center justify-between bg-surface border border-border rounded-xl px-5 py-3"
                >
                  <div>
                    <p className="text-ink font-medium">{a.title}</p>
                    <p className="text-ink-secondary text-xs mt-0.5">
                      {a.due_date ? `Due ${new Date(a.due_date).toLocaleDateString()}` : 'No due date'}
                    </p>
                  </div>
                  <span className="text-ink-secondary text-sm">
                    {a.completions}/{students.length} completed
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
