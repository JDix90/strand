import { useAuth } from '../../contexts/AuthContext';
import { useCurriculum } from '../../contexts/CurriculumContext';

/**
 * When a student is in a class-scoped unit route, shows scope context.
 * Reduces confusion between flat `/practice` and `/class/.../unit/.../practice`.
 */
export function CurriculumScopeBar() {
  const { profile } = useAuth();
  const { classId, unitRow, loading } = useCurriculum();

  if (profile?.role !== 'student' || !classId) return null;
  if (loading && !unitRow) {
    return (
      <div className="max-w-2xl mx-auto px-4 pt-2 text-xs text-ink-secondary" role="status">
        Loading unit…
      </div>
    );
  }
  if (!unitRow?.title) return null;

  return (
    <div
      className="max-w-2xl mx-auto px-4 pt-2 text-xs text-ink-secondary border-b border-border/60 pb-2"
      role="navigation"
      aria-label="Curriculum scope"
    >
      <span className="text-ink font-medium">Class workspace</span>
      <span className="mx-1.5 text-ink-secondary">·</span>
      <span>{unitRow.title}</span>
    </div>
  );
}
