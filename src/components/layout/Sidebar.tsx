import { NavLink, useLocation, useNavigate } from 'react-router-dom';

const linkBase =
  'block rounded-xl px-3 py-2 text-sm font-semibold transition-colors';

const linkState = ({ isActive }: { isActive: boolean }) =>
  isActive
    ? `${linkBase} bg-brand text-white`
    : `${linkBase} text-ink-secondary hover:text-ink hover:bg-surface`;

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();

  const goHome = () => {
    onNavigate?.();
    if (location.pathname === '/') {
      navigate(0);
      return;
    }
    navigate('/');
  };

  return (
    <aside className="h-full bg-surface border-r border-border p-4">
      <button
        type="button"
        onClick={goHome}
        className="w-full text-left rounded-xl px-3 py-3 bg-surface-elevated border border-border hover:border-border-strong"
      >
        <p className="text-lg font-bold text-ink">Languini</p>
        <p className="text-xs text-ink-secondary">Phase 1</p>
      </button>

      <div className="mt-6 space-y-2">
        <button
          type="button"
          onClick={goHome}
          className={`${linkBase} w-full text-left text-ink-secondary hover:text-ink hover:bg-surface-muted`}
        >
          Home
        </button>
        <p className="px-3 pt-2 text-xs font-bold uppercase tracking-wide text-ink-secondary">
          Lessons
        </p>
        <NavLink to="/case-practice" className={linkState} onClick={onNavigate}>
          Case Practice
        </NavLink>
        <NavLink to="/vocabulary" className={linkState} onClick={onNavigate}>
          Vocabulary
        </NavLink>
      </div>
    </aside>
  );
}
