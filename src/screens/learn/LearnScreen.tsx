import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseMetadata, caseOrder } from '../../data/caseMetadata';
import { useGameStore } from '../../store/gameStore';
import { useCurriculum, useEffectiveUnitId } from '../../contexts/CurriculumContext';
import { VOCABULARY_STUB_MODULE } from '../../lib/curriculumConstants';
import { masteryStorageKey } from '../../lib/masteryKeys';
import { getLemmasByCategory, getForm, CATEGORY_LABELS } from '../../data/allForms';
import type { CaseId, WordCategory } from '../../types';

const GENDER_LABELS: Record<string, string> = {
  masculine: 'м',
  feminine: 'ж',
  neuter: 'с',
};

export function LearnScreen() {
  const navigate = useNavigate();
  const { masteryRecords, settings } = useGameStore();
  const { contentModule, classId, unitId: ctxUnitId } = useCurriculum();
  const unitId = useEffectiveUnitId();
  const [hoveredCase, setHoveredCase] = useState<CaseId | null>(null);
  const [hoveredLemma, setHoveredLemma] = useState<string | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ caseId: CaseId; lemmaId: string } | null>(null);

  const allowedCategories = useMemo(() => {
    const a = settings.activeCategories;
    return a.length > 0 ? a : (['pronoun'] as WordCategory[]);
  }, [settings.activeCategories]);

  const [activeCategory, setActiveCategory] = useState<WordCategory>(() => allowedCategories[0]);

  useEffect(() => {
    setActiveCategory(prev =>
      allowedCategories.includes(prev) ? prev : allowedCategories[0]
    );
  }, [allowedCategories]);

  const lemmas = getLemmasByCategory(activeCategory);

  const getFormForCell = (lemmaId: string, caseId: CaseId) =>
    getForm(lemmaId, caseId);

  const getMastery = (lemmaId: string, caseId: CaseId) => {
    const form = getFormForCell(lemmaId, caseId);
    if (!form) return null;
    const key = `${lemmaId}:${caseId}:${form.surfaceForm}`;
    const sk = masteryStorageKey(unitId, key);
    return masteryRecords[sk] ?? masteryRecords[key] ?? null;
  };

  const isCellHighlighted = (lemmaId: string, caseId: CaseId) => {
    if (selectedCell) return selectedCell.lemmaId === lemmaId && selectedCell.caseId === caseId;
    return hoveredCase === caseId || hoveredLemma === lemmaId;
  };

  const selectedForm = selectedCell
    ? getFormForCell(selectedCell.lemmaId, selectedCell.caseId)
    : null;

  const statusDot = (lemmaId: string, caseId: CaseId) => {
    const m = getMastery(lemmaId, caseId);
    if (!m || m.status === 'unseen') return null;
    const colors: Record<string, string> = {
      introduced: '#f59e0b',
      shaky: '#ef4444',
      improving: '#3b82f6',
      strong: '#22c55e',
      mastered: '#a855f7',
    };
    return colors[m.status] ?? null;
  };

  if (contentModule === VOCABULARY_STUB_MODULE) {
    const back = classId && ctxUnitId ? `/class/${classId}/unit/${ctxUnitId}` : '/home';
    return (
      <div className="min-h-screen bg-page text-ink flex flex-col items-center justify-center px-6">
        <p className="text-lg font-semibold mb-2">Vocabulary module</p>
        <p className="text-ink-secondary text-center max-w-md mb-6">
          The learn table is for declension units. This preview unit uses short vocabulary drills in Practice.
        </p>
        <button
          type="button"
          onClick={() => navigate(`${back}/practice`)}
          className="px-4 py-2 rounded-lg bg-blue-700 hover:bg-brand text-white font-medium"
        >
          Open vocabulary practice
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-ink">
      <div className="bg-surface-elevated border-b border-border px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/home')} className="text-ink-secondary hover:text-ink">&larr; Home</button>
            <div>
              <h1 className="text-xl font-bold text-ink">📋 Learn Table</h1>
              <p className="text-ink-secondary text-xs">Russian Case Declensions</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/practice')}
            className="px-4 py-2 bg-green-700 hover:bg-green-600 text-white rounded-xl font-semibold text-sm transition-colors"
          >
            Practice &rarr;
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Category Tabs */}
        <div className="flex gap-2">
          {allowedCategories.map(cat => {
            const info = CATEGORY_LABELS[cat];
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => { setActiveCategory(cat); setSelectedCell(null); }}
                className={`px-4 py-2 rounded-xl font-semibold text-sm transition-all ${
                  isActive
                    ? 'bg-brand text-white'
                    : 'bg-surface text-ink-secondary hover:bg-surface-muted hover:text-ink'
                }`}
              >
                {info.icon} {info.label}
              </button>
            );
          })}
        </div>

        {/* Case Legend */}
        <div className="flex flex-wrap gap-3">
          {caseOrder.map(caseId => {
            const meta = caseMetadata[caseId];
            return (
              <button
                key={caseId}
                onMouseEnter={() => setHoveredCase(caseId)}
                onMouseLeave={() => setHoveredCase(null)}
                onClick={() => setSelectedCell(null)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-semibold transition-all"
                style={{
                  backgroundColor: hoveredCase === caseId ? meta.color + '33' : meta.color + '11',
                  color: meta.color,
                  border: `1px solid ${meta.color}44`,
                }}
              >
                <span>{meta.icon}</span>
                <span>{meta.label}</span>
                <span className="opacity-60 text-xs">({meta.helperWord})</span>
              </button>
            );
          })}
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-2xl border border-border">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-surface">
                <th className="px-4 py-3 text-left text-ink-secondary font-semibold text-sm w-32">Case</th>
                {lemmas.map(lemma => (
                  <th
                    key={lemma.lemmaId}
                    className="px-3 py-3 text-center cursor-pointer transition-colors"
                    style={{
                      backgroundColor: hoveredLemma === lemma.lemmaId ? '#334155' : undefined,
                    }}
                    onMouseEnter={() => setHoveredLemma(lemma.lemmaId)}
                    onMouseLeave={() => setHoveredLemma(null)}
                  >
                    <div className="text-ink font-bold text-lg">{lemma.lemmaDisplay}</div>
                    <div className="flex items-center justify-center gap-1">
                      {settings.showEnglishGloss && (
                        <span className="text-ink-secondary text-xs">{lemma.englishGloss}</span>
                      )}
                      {lemma.gender && (
                        <span className="text-ink-secondary text-xs">({GENDER_LABELS[lemma.gender] ?? ''})</span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {caseOrder.map((caseId, rowIdx) => {
                const meta = caseMetadata[caseId];
                return (
                  <tr
                    key={caseId}
                    className={rowIdx % 2 === 0 ? 'bg-surface-elevated' : 'bg-page'}
                  >
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onMouseEnter={() => setHoveredCase(caseId)}
                      onMouseLeave={() => setHoveredCase(null)}
                    >
                      <div className="flex items-center gap-2">
                        <span>{meta.icon}</span>
                        <div>
                          <div className="font-semibold text-sm" style={{ color: meta.color }}>
                            {meta.label}
                          </div>
                          {settings.showHelperWords && (
                            <div className="text-ink-secondary text-xs">{meta.helperWord}</div>
                          )}
                        </div>
                      </div>
                    </td>

                    {lemmas.map(lemma => {
                      const form = getFormForCell(lemma.lemmaId, caseId);
                      const highlighted = isCellHighlighted(lemma.lemmaId, caseId);
                      const isSelected = selectedCell?.lemmaId === lemma.lemmaId && selectedCell?.caseId === caseId;
                      const dot = statusDot(lemma.lemmaId, caseId);

                      return (
                        <td
                          key={lemma.lemmaId}
                          className="px-3 py-3 text-center cursor-pointer transition-all duration-150"
                          style={{
                            backgroundColor: isSelected
                              ? meta.color + '33'
                              : highlighted
                              ? meta.color + '18'
                              : undefined,
                          }}
                          onClick={() =>
                            setSelectedCell(
                              isSelected ? null : { caseId, lemmaId: lemma.lemmaId }
                            )
                          }
                          onMouseEnter={() => {
                            setHoveredCase(caseId);
                            setHoveredLemma(lemma.lemmaId);
                          }}
                          onMouseLeave={() => {
                            setHoveredCase(null);
                            setHoveredLemma(null);
                          }}
                        >
                          <div className="relative inline-block">
                            <span
                              className="text-xl font-bold"
                              style={{ color: highlighted || isSelected ? meta.color : '#e2e8f0' }}
                            >
                              {form?.surfaceForm ?? '—'}
                            </span>
                            {dot && (
                              <span
                                className="absolute -top-1 -right-2 w-2 h-2 rounded-full"
                                style={{ backgroundColor: dot }}
                              />
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail Panel */}
        {selectedForm && selectedCell && (
          <div
            className="rounded-2xl border-2 p-6 space-y-4"
            style={{
              borderColor: caseMetadata[selectedCell.caseId].color + '66',
              backgroundColor: caseMetadata[selectedCell.caseId].color + '0d',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-4xl font-bold" style={{ color: caseMetadata[selectedCell.caseId].color }}>
                  {selectedForm.surfaceForm}
                </span>
                <div>
                  <p className="text-ink-secondary text-sm">
                    {selectedForm.lemmaDisplay} ({selectedForm.englishGloss}) — {caseMetadata[selectedCell.caseId].label}
                  </p>
                  <p className="text-ink-secondary text-xs">{selectedForm.questionPrompt}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCell(null)}
                className="text-ink-secondary hover:text-ink text-xl"
              >
                ✕
              </button>
            </div>

            <div className="bg-surface rounded-xl p-4 space-y-2">
              <p className="text-ink-secondary">
                <span className="text-ink-secondary text-xs uppercase tracking-wide block mb-1">Example</span>
                <span className="text-lg italic">{selectedForm.exampleSentence}</span>
              </p>
              {settings.showHelperWords && (
                <p className="text-ink-secondary text-sm">
                  Helper word: <span className="text-ink font-semibold">{selectedForm.helperWord}</span>
                </p>
              )}
              {selectedForm.notes && (
                <p className="text-ink-secondary text-sm">
                  Note: {selectedForm.notes}
                </p>
              )}
              {selectedForm.postPrepositionForm && selectedForm.postPrepositionForm !== selectedForm.surfaceForm && (
                <p className="text-ink-secondary text-sm">
                  After prepositions: <span className="text-yellow-300 font-semibold">{selectedForm.postPrepositionForm}</span>
                  {selectedForm.postPrepositionVariants && selectedForm.postPrepositionVariants.length > 0 && (
                    <span className="text-ink-secondary"> ({selectedForm.postPrepositionVariants.join(', ')})</span>
                  )}
                </p>
              )}
              {selectedForm.acceptedVariants && selectedForm.acceptedVariants.length > 1 && (
                <p className="text-ink-secondary text-sm">
                  Also accepted: {selectedForm.acceptedVariants.filter(v => v !== selectedForm.surfaceForm).join(', ')}
                </p>
              )}
            </div>

            {(() => {
              const m = getMastery(selectedCell.lemmaId, selectedCell.caseId);
              if (!m || m.status === 'unseen') return (
                <p className="text-ink-secondary text-sm">Not yet practiced. Try Practice mode!</p>
              );
              return (
                <div className="flex items-center gap-4 text-sm">
                  <span className="text-ink-secondary">Mastery: <span className="text-ink font-bold">{m.masteryScore}</span></span>
                  <span className="text-ink-secondary">Accuracy: <span className="text-ink font-bold">{m.attempts > 0 ? Math.round((m.correct / m.attempts) * 100) : 0}%</span></span>
                  <span className="text-ink-secondary">Attempts: <span className="text-ink font-bold">{m.attempts}</span></span>
                </div>
              );
            })()}
          </div>
        )}

        {/* Mastery Legend */}
        <div className="flex flex-wrap gap-3 text-xs">
          {[
            { status: 'unseen', color: '#64748b', label: 'Unseen' },
            { status: 'introduced', color: '#f59e0b', label: 'Introduced' },
            { status: 'shaky', color: '#ef4444', label: 'Shaky' },
            { status: 'improving', color: '#3b82f6', label: 'Improving' },
            { status: 'strong', color: '#22c55e', label: 'Strong' },
            { status: 'mastered', color: '#a855f7', label: 'Mastered' },
          ].map(s => (
            <span key={s.status} className="flex items-center gap-1.5 text-ink-secondary">
              <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
