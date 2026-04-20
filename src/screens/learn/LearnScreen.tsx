import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { caseMetadata, caseOrder } from '../../data/caseMetadata';
import { useGameStore } from '../../store/gameStore';
import { useCurriculum, useEffectiveUnitId } from '../../contexts/CurriculumContext';
import { VOCABULARY_TAXONOMY } from '../../data/vocabulary/taxonomy';
import { isVocabularyModule } from '../../lib/contentModules';
import { masteryStorageKey } from '../../lib/masteryKeys';
import { getMasteryTableIndicator, MASTERY_LEGEND_ROWS } from '../../lib/masteryIndicators';
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
  const { contentModule, classId, unitId: ctxUnitId, unitRow } = useCurriculum();
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

  const masteryIndicatorForCell = (lemmaId: string, caseId: CaseId) => {
    const m = getMastery(lemmaId, caseId);
    if (!m) return null;
    return getMasteryTableIndicator(m.status);
  };

  if (isVocabularyModule(contentModule)) {
    const back = classId && ctxUnitId ? `/class/${classId}/unit/${ctxUnitId}` : '/home';
    return (
      <div className="min-h-screen bg-page text-ink px-6 py-10 max-w-xl mx-auto">
        <button type="button" onClick={() => navigate(back)} className="text-ink-secondary hover:text-ink text-sm mb-6">
          ← Back to unit
        </button>
        <h1 className="text-2xl font-bold text-ink mb-2">{unitRow?.title ?? 'Vocabulary'}</h1>
        <p className="text-ink-secondary mb-6">
          Declension “learn table” does not apply here. Open <strong>Practice</strong> for Russian–English multiple
          choice. Your class lists each subtopic as its own unit in the sidebar (food, travel, verbs, and more).
        </p>
        <div className="rounded-xl border border-border bg-surface p-4 mb-8 max-h-72 overflow-y-auto">
          <p className="text-xs font-semibold text-ink-secondary uppercase tracking-wide mb-3">Curriculum overview</p>
          <ul className="space-y-3 text-sm">
            {VOCABULARY_TAXONOMY.map(cat => (
              <li key={cat.id}>
                <span className="font-semibold text-ink">{cat.label}</span>
                <ul className="mt-1 ml-3 list-disc text-ink-secondary">
                  {cat.subcategories.map(s => (
                    <li key={s.vocabularySetId}>{s.label}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
        <button
          type="button"
          onClick={() => navigate(`${back}/practice`)}
          className="w-full px-4 py-3 rounded-xl bg-brand hover:opacity-90 text-white font-semibold"
        >
          Start vocabulary practice
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
                className={`px-4 py-2 min-h-[44px] rounded-xl font-semibold text-sm transition-all ${
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
                className="flex items-center gap-2 px-3 py-2 min-h-[44px] rounded-full text-sm font-semibold transition-all"
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

        {/* Table — horizontal scroll on narrow viewports; first column stays visible */}
        <div className="overflow-x-auto rounded-2xl border border-border -mx-4 px-4 sm:mx-0 sm:px-0">
          <table className="w-full border-collapse min-w-[640px]">
            <thead>
              <tr className="bg-surface">
                <th className="sticky left-0 z-20 px-4 py-3 text-left text-ink-secondary font-semibold text-sm w-32 bg-surface border-r border-border shadow-[2px_0_8px_-4px_rgba(0,0,0,0.2)]">
                  Case
                </th>
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
                    style={{
                      borderLeftWidth: 4,
                      borderLeftStyle: 'solid',
                      borderLeftColor: meta.color,
                      backgroundImage: `linear-gradient(90deg, ${meta.color}08 0%, transparent 48%)`,
                    }}
                  >
                    <td
                      className={`sticky left-0 z-10 px-4 py-3 cursor-pointer border-r border-border/80 shadow-[2px_0_8px_-4px_rgba(0,0,0,0.15)] ${
                        rowIdx % 2 === 0 ? 'bg-surface-elevated' : 'bg-page'
                      }`}
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
                      const masteryInd = masteryIndicatorForCell(lemma.lemmaId, caseId);

                      return (
                        <td
                          key={lemma.lemmaId}
                          className="px-3 py-3 text-center cursor-pointer transition-all duration-150"
                          style={{
                            backgroundColor: isSelected
                              ? meta.color + '33'
                              : highlighted
                              ? meta.color + '14'
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
                            {masteryInd && (
                              <span
                                className="absolute -top-1 -right-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-md bg-page/95 px-0.5 text-[11px] leading-none text-ink-secondary shadow-sm ring-1 ring-border"
                                title={`Mastery: ${masteryInd.label}`}
                                aria-label={`Mastery: ${masteryInd.label}`}
                              >
                                {masteryInd.symbol}
                              </span>
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
              const ind = getMasteryTableIndicator(m.status);
              return (
                <div className="space-y-2 text-sm">
                  {ind && (
                    <p className="text-ink-secondary flex flex-wrap items-center gap-2">
                      <span>Practice progress:</span>
                      <span className="inline-flex items-center gap-1.5 rounded-lg bg-page px-2 py-0.5 font-medium text-ink ring-1 ring-border">
                        <span className="tabular-nums" aria-hidden>
                          {ind.symbol}
                        </span>
                        {ind.label}
                      </span>
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-4">
                    <span className="text-ink-secondary">
                      Score: <span className="text-ink font-bold">{m.masteryScore}</span>
                    </span>
                    <span className="text-ink-secondary">
                      Accuracy:{' '}
                      <span className="text-ink font-bold">
                        {m.attempts > 0 ? Math.round((m.correct / m.attempts) * 100) : 0}%
                      </span>
                    </span>
                    <span className="text-ink-secondary">
                      Attempts: <span className="text-ink font-bold">{m.attempts}</span>
                    </span>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Mastery legend: symbols only — avoids clashing with case row colors */}
        <div className="rounded-xl border border-border bg-surface/80 px-4 py-3">
          <p className="text-ink-secondary text-xs font-semibold uppercase tracking-wide mb-1">Practice progress</p>
          <p className="text-ink-secondary/90 text-[11px] leading-snug mb-2">
            Shapes below are your practice level for each cell. They are not the same as the grammatical-case colors on each row.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-ink-secondary">
            {MASTERY_LEGEND_ROWS.map(row => (
              <span key={row.status} className="inline-flex items-center gap-1.5">
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded bg-page font-semibold text-ink-secondary ring-1 ring-border tabular-nums">
                  {row.symbol}
                </span>
                <span>{row.label}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
