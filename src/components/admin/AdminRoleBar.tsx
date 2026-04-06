import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

/**
 * Fixed bar for admins: switch student/teacher app experience and open the admin console.
 */
export function AdminRoleBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { profile, effectiveRole, setEffectiveRole } = useAuth();

  if (profile?.role !== 'admin') return null;

  const path = location.pathname;
  if (path === '/login' || path === '/signup') return null;

  const goStudent = () => {
    setEffectiveRole('student');
    navigate('/home');
  };

  const goTeacher = () => {
    setEffectiveRole('teacher');
    navigate('/teacher');
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 border-b border-amber-200 bg-amber-50/95 backdrop-blur-sm px-3 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
      <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-amber-900 text-xs font-semibold uppercase tracking-wide">
          <span>Admin</span>
          <span className="text-amber-700/90 font-normal normal-case">View as</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={goStudent}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              effectiveRole === 'student' && (path === '/home' || path.startsWith('/join') || path.startsWith('/assignments'))
                ? 'bg-brand text-white'
                : 'bg-surface text-ink-secondary hover:bg-surface-muted'
            }`}
          >
            Student
          </button>
          <button
            type="button"
            onClick={goTeacher}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              effectiveRole === 'teacher' && path.startsWith('/teacher')
                ? 'bg-brand text-white'
                : 'bg-surface text-ink-secondary hover:bg-surface-muted'
            }`}
          >
            Teacher
          </button>
          <button
            type="button"
            onClick={() => navigate('/admin')}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              path.startsWith('/admin')
                ? 'bg-amber-600 text-white'
                : 'bg-surface text-amber-900 hover:bg-amber-100'
            }`}
          >
            Admin tools
          </button>
        </div>
      </div>
    </div>
  );
}
