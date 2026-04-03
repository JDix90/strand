import { useEffect } from 'react';
import { useLocation, useNavigate, useMatch } from 'react-router-dom';
import type { SessionSummary } from '../../types';

interface ResultsLocationState {
  summary?: SessionSummary;
  fromIntro?: boolean;
}

const modeLabels: Record<string, { icon: string; label: string }> = {
  practice: { icon: '🎯', label: 'Practice' },
  speed_round: { icon: '⚡', label: 'Speed Round' },
  boss_battle: { icon: '⚔️', label: 'Boss Battle' },
  memory_match: { icon: '🃏', label: 'Memory Match' },
  grid_challenge: { icon: '🔲', label: 'Grid Challenge' },
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
  const classUnit = useMatch('/class/:classId/unit/:unitId/results');
  const state = location.state as ResultsLocationState | undefined;
  const summary = state?.summary;
  const fromIntro = state?.fromIntro === true;

  useEffect(() => {
    if (!summary) navigate('/home');
  }, [summary, navigate]);

  if (!summary) return null;

  const mode = modeLabels[summary.modeId] ?? { icon: '🎮', label: summary.modeId };
  const { grade, color, message } = gradeFromAccuracy(summary.accuracy);
  const accuracy = Math.round(summary.accuracy * 100);
  const avgSec = summary.averageResponseMs > 0
    ? (summary.averageResponseMs / 1000).toFixed(1)
    : '—';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center px-4 py-8 gap-6">
      <div className="text-center space-y-2">
        <div className="text-5xl">{mode.icon}</div>
        <h1 className="text-2xl font-bold text-white">{mode.label} Complete!</h1>
        <div
          className="inline-flex items-center justify-center w-20 h-20 rounded-full text-4xl font-black border-4 mx-auto"
          style={{ borderColor: color, color, backgroundColor: color + '22' }}
        >
          {grade}
        </div>
        <p className="text-slate-300 text-lg">{message}</p>
      </div>

      <div className="bg-slate-800 rounded-2xl border border-slate-700 p-6 w-full max-w-sm space-y-4">
        <div className="text-center">
          <p className="text-4xl font-bold" style={{ color }}>{summary.score.toLocaleString()}</p>
          <p className="text-slate-400 text-sm">Final Score</p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-white">{accuracy}%</p>
            <p className="text-slate-500 text-xs">Accuracy</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-white">{summary.correctAnswers}/{summary.totalQuestions}</p>
            <p className="text-slate-500 text-xs">Correct</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-orange-400">{summary.bestStreak}</p>
            <p className="text-slate-500 text-xs">Best Streak</p>
          </div>
          <div className="bg-slate-900 rounded-xl p-3 text-center">
            <p className="text-xl font-bold text-blue-400">{avgSec}s</p>
            <p className="text-slate-500 text-xs">Avg Response</p>
          </div>
        </div>

        {summary.weakForms && summary.weakForms.length > 0 && (
          <div className="bg-red-950 rounded-xl p-3 border border-red-800">
            <p className="text-red-300 text-sm font-semibold mb-1">Forms to review:</p>
            <div className="flex flex-wrap gap-1">
              {summary.weakForms.slice(0, 6).map(f => {
                const parts = f.split(':');
                return (
                  <span key={f} className="text-red-200 text-xs bg-red-900 px-2 py-0.5 rounded">
                    {parts[2] ?? f}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm">
        {!fromIntro && (
          <button
            onClick={() =>
              navigate(
                classUnit
                  ? `/class/${classUnit.params.classId}/unit/${classUnit.params.unitId}/practice`
                  : '/practice'
              )
            }
            className="w-full py-3 bg-green-700 hover:bg-green-600 text-white rounded-xl font-bold transition-colors"
          >
            🎯 Practice Weak Forms
          </button>
        )}
        <button
          onClick={() =>
            fromIntro ? navigate('/intro/play') : navigate(-1)
          }
          className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
        >
          Play Again
        </button>
        <button
          onClick={() =>
            navigate(fromIntro ? '/intro' : classUnit ? `/class/${classUnit.params.classId}` : '/home')
          }
          className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition-colors"
        >
          {fromIntro ? 'Intro hub' : 'Home'}
        </button>
      </div>
    </div>
  );
}
