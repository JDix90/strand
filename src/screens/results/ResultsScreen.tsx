import { useLocation, useNavigate } from 'react-router-dom';
import type { SessionSummary } from '../../types';

interface ResultsLocationState {
  summary?: SessionSummary;
  fromLesson?: 'case-practice' | 'vocabulary';
}

const modeLabels: Record<string, { icon: string; label: string }> = {
  practice: { icon: '🎯', label: 'Practice Session' },
};

const gradeFromAccuracy = (acc: number): { grade: string; color: string; message: string } => {
  if (acc >= 0.95) return { grade: 'S', color: '#a855f7', message: 'Outstanding!' };
  if (acc >= 0.85) return { grade: 'A', color: '#22c55e', message: 'Excellent work!' };
  if (acc >= 0.70) return { grade: 'B', color: '#3b82f6', message: 'Good job!' };
  if (acc >= 0.55) return { grade: 'C', color: '#f59e0b', message: 'Keep practicing!' };
  return { grade: 'D', color: '#ef4444', message: 'Review the table and try again.' };
};

export function ResultsScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const state = location.state as ResultsLocationState | undefined;
  const summary = state?.summary;
  const fromLesson = state?.fromLesson ?? 'case-practice';

  if (!summary) {
    return (
      <div className="min-h-screen bg-page text-ink flex flex-col items-center justify-center px-6 text-center gap-4">
        <h1 className="text-2xl font-bold">No recent results</h1>
        <p className="text-ink-secondary max-w-sm">
          Complete a practice session to see a detailed results summary here.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="px-5 py-2.5 rounded-xl bg-mustard hover:bg-mustard-hover text-ink font-bold"
        >
          Home
        </button>
      </div>
    );
  }

  const mode = modeLabels[summary.modeId] ?? { icon: '🎮', label: summary.modeId };
  const { grade, color, message } = gradeFromAccuracy(summary.accuracy);
  const accuracy = Math.round(summary.accuracy * 100);
  const avgSec = summary.averageResponseMs > 0
    ? (summary.averageResponseMs / 1000).toFixed(1)
    : '—';

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col items-center justify-center px-4 py-6 gap-5 sm:py-8 sm:gap-6">
      <div className="text-center space-y-2">
        <div className="text-4xl sm:text-5xl">{mode.icon}</div>
        <h1 className="text-2xl font-bold text-ink">{mode.label} Complete</h1>
        <div
          className="inline-flex items-center justify-center w-18 h-18 sm:w-20 sm:h-20 rounded-full text-3xl sm:text-4xl font-black border-4 mx-auto"
          style={{ borderColor: color, color, backgroundColor: color + '22' }}
        >
          {grade}
        </div>
        <p className="text-ink-secondary text-lg">{message}</p>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-4 sm:p-6 w-full max-w-sm space-y-4">
        <div className="text-center">
          <p className="text-4xl font-bold" style={{ color }}>{summary.score.toLocaleString()}</p>
          <p className="text-ink-secondary text-sm">Final score</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-surface-elevated rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-ink">{accuracy}%</p>
            <p className="text-ink-secondary text-xs">Accuracy</p>
          </div>
          <div className="bg-surface-elevated rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-ink">{summary.correctAnswers}/{summary.totalQuestions}</p>
            <p className="text-ink-secondary text-xs">Correct</p>
          </div>
          <div className="bg-surface-elevated rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-coral">{summary.bestStreak}</p>
            <p className="text-ink-secondary text-xs">Best streak</p>
          </div>
          <div className="bg-surface-elevated rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-link">{avgSec}s</p>
            <p className="text-ink-secondary text-xs">Avg response</p>
          </div>
        </div>

        {summary.weakForms && summary.weakForms.length > 0 && (
          <div className="bg-red-50 rounded-xl p-3 border border-red-200">
            <p className="text-red-800 text-sm font-semibold mb-1">Forms to review:</p>
            <div className="flex flex-wrap gap-1">
              {summary.weakForms.slice(0, 6).map(f => {
                const parts = f.split(':');
                return (
                  <span key={f} className="text-red-900 text-xs bg-red-100 px-2 py-0.5 rounded">
                    {parts[2] ?? f}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        <button
          onClick={() => navigate(fromLesson === 'vocabulary' ? '/vocabulary' : '/case-practice')}
          className="w-full min-h-11 py-3 bg-surface-muted hover:bg-surface-muted text-ink rounded-xl font-semibold transition-colors"
        >
          Back to {fromLesson === 'vocabulary' ? 'Vocabulary' : 'Case Practice'}
        </button>
        <button
          onClick={() => navigate('/')}
          className="w-full min-h-11 py-3 bg-mustard hover:bg-mustard-hover text-ink rounded-xl font-bold transition-colors shadow-sm"
        >
          Home
        </button>
      </div>
    </div>
  );
}
