import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

const cards = [
  {
    path: '/admin/users',
    title: 'Users',
    description: 'Browse accounts, roles, and emails.',
    icon: '👥',
  },
  {
    path: '/admin/classes',
    title: 'Classes',
    description: 'All classes, teachers, and join codes.',
    icon: '📚',
  },
  {
    path: '/admin/site',
    title: 'Site settings',
    description: 'Global options stored in the database.',
    icon: '⚙️',
  },
];

export function AdminDashboard() {
  const navigate = useNavigate();
  const { profile, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="bg-surface-elevated border-b border-border px-6 py-5">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-ink tracking-tight">Admin</h1>
            <p className="text-ink-secondary text-sm mt-0.5">
              Signed in as {profile?.displayName ?? 'Admin'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => navigate('/home')}
              className="text-sm px-3 py-2 rounded-xl bg-surface text-ink hover:bg-surface-muted transition-colors"
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => navigate('/settings')}
              className="text-ink-secondary hover:text-ink p-2 rounded-lg hover:bg-surface transition-colors"
              title="Settings"
            >
              ⚙️
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              className="text-ink-secondary hover:text-ink text-sm px-3 py-1.5 rounded-lg hover:bg-surface transition-colors"
            >
              Sign out
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8 space-y-6">
        <p className="text-ink-secondary text-sm leading-relaxed">
          Use the bar at the top to switch between <strong className="text-ink-secondary">Student</strong> and{' '}
          <strong className="text-ink-secondary">Teacher</strong> app experiences. This page lists site-wide tools.
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          {cards.map(c => (
            <button
              key={c.path}
              type="button"
              onClick={() => navigate(c.path)}
              className="text-left bg-surface hover:bg-surface-muted border border-border hover:border-amber-700/50 rounded-2xl p-5 transition-colors"
            >
              <div className="text-3xl mb-2">{c.icon}</div>
              <h2 className="text-ink font-bold">{c.title}</h2>
              <p className="text-ink-secondary text-sm mt-1">{c.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
