import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseMetadata, caseOrder } from '../data/caseMetadata';
import { FOCUSED_ROUND_QUESTIONS } from '../data/gameConfigs';
import type { CaseId, PracticeFocus, WordCategory } from '../types';
import { useGameStore } from '../store/gameStore';
import { accuracyByCase } from '../lib/sessionStats';

const CATEGORIES: { value: WordCategory; label: string; icon: string }[] = [
  { value: 'pronoun', label: 'Pronouns', icon: '👤' },
  { value: 'name', label: 'Names', icon: '🏷️' },
  { value: 'noun', label: 'Nouns', icon: '📦' },
];

const CASE_SHORT: Record<CaseId, string> = {
  nominative: 'Nom',
  genitive: 'Gen',
  dative: 'Dat',
  accusative: 'Acc',
  instrumental: 'Ins',
  prepositional: 'Prep',
};

function focusKey(f: PracticeFocus): string {
  return `${f.category}:${f.caseId}`;
}

function buildDefaultOrder(): PracticeFocus[] {
  const plan: PracticeFocus[] = [];
  for (const caseId of caseOrder) {
    for (const { value: category } of CATEGORIES) {
      plan.push({ category, caseId });
    }
  }
  return plan;
}

export function CasePracticeScreen() {
  const navigate = useNavigate();
  const sessionEvents = useGameStore(s => s.currentSessionEvents);
  const [selectedFocuses, setSelectedFocuses] = useState<PracticeFocus[]>([]);
  const selectedKeys = useMemo(() => new Set(selectedFocuses.map(focusKey)), [selectedFocuses]);
  const statsByCase = useMemo(() => accuracyByCase(sessionEvents), [sessionEvents]);

  const toggleFocus = (focus: PracticeFocus) => {
    const key = focusKey(focus);
    if (selectedKeys.has(key)) {
      setSelectedFocuses(prev => prev.filter(f => focusKey(f) !== key));
      return;
    }
    setSelectedFocuses(prev => [...prev, focus]);
  };

  return (
    <div className="max-w-4xl px-4 py-6 space-y-6 sm:px-6 sm:py-8">
      <div>
        <h1 className="text-2xl font-bold text-ink">Case Practice</h1>
        <p className="text-sm text-ink-secondary">
          Pick category and case combinations to build your Focused Drill round plan.
        </p>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-3 overflow-x-auto sm:p-4">
        <table className="w-full border-separate border-spacing-1.5">
          <thead>
            <tr>
              <th className="w-24" />
              {caseOrder.map(caseId => {
                const meta = caseMetadata[caseId];
                return (
                  <th key={caseId} className="text-center text-xs font-semibold pb-1 text-ink">
                    <div className="flex flex-col items-center gap-0.5">
                      <span>{meta.icon}</span>
                      <span>{CASE_SHORT[caseId]}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map(cat => (
              <tr key={cat.value}>
                <td className="pr-2">
                  <div className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className="text-base font-semibold">{cat.icon}</span>
                    <span className="text-xs font-semibold text-ink">{cat.label}</span>
                  </div>
                </td>
                {caseOrder.map(caseId => {
                  const focus: PracticeFocus = { category: cat.value, caseId };
                  const selected = selectedKeys.has(focusKey(focus));
                  const meta = caseMetadata[caseId];
                  return (
                    <td key={caseId} className="text-center">
                      <button
                        type="button"
                        onClick={() => toggleFocus(focus)}
                        data-testid={`focus-cell-${cat.value}-${caseId}`}
                        aria-pressed={selected}
                        className={[
                          'w-11 h-11 rounded-lg text-xs font-bold transition-all sm:w-10 sm:h-10',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-brand',
                          selected
                            ? 'text-white shadow-sm scale-105'
                            : 'bg-surface-muted text-ink-secondary hover:bg-surface hover:text-ink border border-transparent hover:border-border-strong',
                        ].join(' ')}
                        style={selected ? { backgroundColor: meta.color } : undefined}
                      >
                        {selected ? '✓' : ''}
                      </button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-surface rounded-2xl border border-border p-3">
        <p className="text-xs font-semibold text-ink-secondary mb-2">Session accuracy by case</p>
        <div className="flex flex-wrap gap-2">
          {caseOrder.map(caseId => {
            const stat = statsByCase[caseId];
            const pct = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
            return (
              <span
                key={caseId}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border border-border bg-surface-elevated text-ink"
              >
                {CASE_SHORT[caseId]} {stat.total === 0 ? '-' : `${pct}%`}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setSelectedFocuses(buildDefaultOrder())}
          data-testid="select-all-focus"
          className="px-4 py-2.5 min-h-11 rounded-xl bg-surface border border-border text-sm font-semibold text-ink hover:bg-surface-muted transition-colors"
        >
          Select all
        </button>
        <button
          type="button"
          onClick={() => setSelectedFocuses([])}
          data-testid="clear-focus"
          disabled={selectedFocuses.length === 0}
          className="px-4 py-2.5 min-h-11 rounded-xl bg-surface border border-border text-sm font-semibold text-ink hover:bg-surface-muted transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Clear
        </button>
      </div>

      <button
        type="button"
        data-testid="start-focused-practice"
        disabled={selectedFocuses.length === 0}
        onClick={() => navigate('/case-practice/run', { state: { roundPlan: selectedFocuses } })}
        className={[
          'w-full max-w-xl min-h-12 py-3.5 rounded-2xl text-base font-bold transition-all',
          selectedFocuses.length > 0
            ? 'bg-brand hover:bg-brand-hover text-white shadow-sm'
            : 'bg-surface-muted text-ink-secondary cursor-not-allowed',
        ].join(' ')}
      >
        {selectedFocuses.length === 0
          ? 'Select at least one combination'
          : `Start Focused Practice (${selectedFocuses.length} rounds, ${FOCUSED_ROUND_QUESTIONS} questions each)`}
      </button>
    </div>
  );
}
