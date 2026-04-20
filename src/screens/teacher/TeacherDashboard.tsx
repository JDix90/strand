import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';

interface ClassSummary {
  id: string;
  name: string;
  join_code: string;
  created_at: string;
  studentCount: number;
}

export function TeacherDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();
  const [classes, setClasses] = useState<ClassSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const loadClasses = async () => {
      const isAdmin = profile.role === 'admin';
      let q = supabase.from('classes').select('id, name, join_code, created_at').order('created_at', { ascending: false });
      if (!isAdmin) {
        q = q.eq('teacher_id', profile.id);
      }
      const { data: classRows } = await q;

      if (!classRows) {
        setLoading(false);
        return;
      }

      const classIds = classRows.map(c => c.id);
      const { data: memberships } = await supabase
        .from('class_memberships')
        .select('class_id')
        .in('class_id', classIds.length > 0 ? classIds : ['__none__']);

      const countMap: Record<string, number> = {};
      for (const m of memberships ?? []) {
        countMap[m.class_id] = (countMap[m.class_id] ?? 0) + 1;
      }

      setClasses(classRows.map(c => ({
        ...c,
        studentCount: countMap[c.id] ?? 0,
      })));
      setLoading(false);
    };

    loadClasses();
  }, [profile]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="bg-surface-elevated border-b border-border px-6 py-5">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">
              👨‍🏫 Teacher Dashboard
            </h1>
            <p className="text-ink-secondary text-sm mt-0.5">
              Welcome, {profile?.displayName}
              {profile?.role === 'admin' && (
                <span className="block text-amber-400/90 text-xs mt-1">Admin: viewing all classes</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/teacher/calendar')}
              className="text-ink-secondary hover:text-ink text-sm px-3 py-1.5 rounded-lg hover:bg-surface transition-colors border border-border"
            >
              Calendar
            </button>
            <button
              onClick={() => navigate('/settings')}
              className="text-ink-secondary hover:text-ink p-2 rounded-lg hover:bg-surface transition-colors"
              title="Settings"
            >
              ⚙️
            </button>
            <button
              onClick={handleSignOut}
              className="text-ink-secondary hover:text-ink text-sm px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-8">
        {profile &&
          profile.role === 'teacher' &&
          (!profile.avatarUrl?.trim() || !profile.bio?.trim()) && (
            <div className="rounded-2xl border border-amber-700/60 bg-amber-950/40 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <p className="font-semibold text-amber-100 text-sm">Complete your profile</p>
                <p className="text-amber-200/90 text-xs mt-1">
                  Add a photo and a short bio so students recognize you in class discussion.
                </p>
              </div>
              <button
                type="button"
                onClick={() => navigate('/settings')}
                className="shrink-0 px-4 py-2 rounded-xl bg-brand hover:bg-brand-hover text-ink text-sm font-semibold"
              >
                Open settings
              </button>
            </div>
          )}

        <div className="flex items-center justify-between">
          <h2 className="text-ink-secondary text-sm font-semibold uppercase tracking-wider">
            My Classes
          </h2>
          <button
            onClick={() => navigate('/teacher/classes')}
            className="px-4 py-2 bg-brand hover:bg-brand-hover text-white rounded-xl font-semibold text-sm transition-colors"
          >
            + New Class
          </button>
        </div>

        {loading ? (
          <div className="text-ink-secondary text-center py-12">Loading classes...</div>
        ) : classes.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <div className="text-5xl">📚</div>
            <p className="text-ink-secondary font-semibold">No classes yet</p>
            <p className="text-ink-secondary text-sm">Create your first class and share the join code with students.</p>
            <button
              onClick={() => navigate('/teacher/classes')}
              className="mt-3 px-6 py-2.5 bg-brand hover:bg-brand-hover text-white rounded-xl font-semibold transition-colors"
            >
              Create a Class
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {classes.map(cls => (
              <button
                key={cls.id}
                onClick={() => navigate(`/teacher/class/${cls.id}`)}
                className="bg-surface hover:bg-surface-muted border border-border hover:border-border-strong rounded-2xl p-5 text-left transition-all hover:scale-[1.02] hover:shadow-xl"
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-ink font-bold text-lg">{cls.name}</h3>
                  <span className="bg-brand/15 text-link font-mono text-xs px-2 py-1 rounded-lg">
                    {cls.join_code}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-ink-secondary">
                    {cls.studentCount} {cls.studentCount === 1 ? 'student' : 'students'}
                  </span>
                  <span className="text-ink-secondary">
                    Created {new Date(cls.created_at).toLocaleDateString()}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
