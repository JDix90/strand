import { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGameStore } from '../../store/gameStore';
import { useCurriculum, useEffectiveUnitId } from '../../contexts/CurriculumContext';
import { caseMetadata, caseOrder } from '../../data/caseMetadata';
import { getLemmasByCategory, getForm, getFormsByCategories, CATEGORY_LABELS } from '../../data/allForms';
import { enqueueFromGridResults } from '../../lib/adaptiveEngine';
import type { CaseId, SessionSummary, WordCategory } from '../../types';

type InputMode = 'keyboard' | 'palette';
type CellState = 'empty' | 'filled' | 'correct' | 'wrong';

interface GridCell {
  lemmaId: string;
  caseId: CaseId;
  value: string;
  state: CellState;
  editCount: number;
}

const CYRILLIC_ROWS = [
  ['й', 'ц', 'у', 'к', 'е', 'н', 'г', 'ш', 'щ', 'з', 'х', 'ъ'],
  ['ф', 'ы', 'в', 'а', 'п', 'р', 'о', 'л', 'д', 'ж', 'э'],
  ['я', 'ч', 'с', 'м', 'и', 'т', 'ь', 'б', 'ю', '⌫'],
];

export function GridScreen() {
  const navigate = useNavigate();
  const { adaptiveQueue, setAdaptiveQueue, addSessionSummary, settings } = useGameStore();
  const { topicId } = useCurriculum();
  const unitId = useEffectiveUnitId();

  const allowedCategories = useMemo(() => {
    const a = settings.activeCategories;
    return a.length > 0 ? a : (['pronoun'] as WordCategory[]);
  }, [settings.activeCategories]);

  const [phase, setPhase] = useState<'setup' | 'playing' | 'complete'>('setup');
  const [inputMode, setInputMode] = useState<InputMode>('keyboard');
  const [activeCategory, setActiveCategory] = useState<WordCategory>(() => allowedCategories[0]);
  const [selectedCases, setSelectedCases] = useState<CaseId[]>([...caseOrder]);
  const [selectedLemmaIds, setSelectedLemmaIds] = useState<string[]>(() =>
    getLemmasByCategory(allowedCategories[0]).map(l => l.lemmaId)
  );

  useEffect(() => {
    setActiveCategory(prev =>
      allowedCategories.includes(prev) ? prev : allowedCategories[0]
    );
  }, [allowedCategories]);

  useEffect(() => {
    const lemmas = getLemmasByCategory(activeCategory);
    setSelectedLemmaIds(lemmas.map(l => l.lemmaId));
  }, [activeCategory]);
  const [cells, setCells] = useState<Record<string, GridCell>>({});
  const [selectedCell, setSelectedCell] = useState<string | null>(null);
  const [hintsLeft, setHintsLeft] = useState(3);
  const [isChecked, setIsChecked] = useState(false);
  const [score, setScore] = useState(0);
  const editInputRef = useRef<HTMLInputElement>(null);

  const currentLemmas = getLemmasByCategory(activeCategory);

  const cellKey = (lemmaId: string, caseId: CaseId) => `${lemmaId}:${caseId}`;

  const getCorrectForm = (lemmaId: string, caseId: CaseId): string => {
    const form = getForm(lemmaId, caseId);
    return form?.surfaceForm ?? '';
  };

  const getAccepted = (lemmaId: string, caseId: CaseId): string[] => {
    const form = getForm(lemmaId, caseId);
    return form?.acceptedVariants ?? [form?.surfaceForm ?? ''];
  };

  const handleCategoryChange = (cat: WordCategory) => {
    setActiveCategory(cat);
  };

  const handleStart = () => {
    const initial: Record<string, GridCell> = {};
    for (const lemmaId of selectedLemmaIds) {
      for (const caseId of selectedCases) {
        const key = cellKey(lemmaId, caseId);
        initial[key] = { lemmaId, caseId, value: '', state: 'empty', editCount: 0 };
      }
    }
    setCells(initial);
    setIsChecked(false);
    setScore(0);
    setHintsLeft(3);
    setSelectedCell(null);
    setPhase('playing');
  };

  const handleCellClick = (key: string) => {
    if (isChecked) return;
    setSelectedCell(key);
    if (inputMode === 'keyboard') {
      setTimeout(() => editInputRef.current?.focus(), 50);
    }
  };

  const updateCellValue = (key: string, newValue: string) => {
    setCells(prev => {
      const cell = prev[key];
      if (!cell) return prev;
      return {
        ...prev,
        [key]: {
          ...cell,
          value: newValue,
          state: newValue ? 'filled' : 'empty',
          editCount: cell.editCount + (newValue !== cell.value ? 1 : 0),
        },
      };
    });
  };

  const handleKeyPress = (char: string) => {
    if (!selectedCell) return;
    if (char === '⌫') {
      const cell = cells[selectedCell];
      if (cell) updateCellValue(selectedCell, cell.value.slice(0, -1));
    } else {
      const cell = cells[selectedCell];
      if (cell) updateCellValue(selectedCell, cell.value + char);
    }
  };

  const paletteForms = (() => {
    const forms = getFormsByCategories([activeCategory]);
    const unique = new Set(forms.map(f => f.surfaceForm));
    forms.forEach(f => f.acceptedVariants?.forEach(v => unique.add(v)));
    return Array.from(unique).sort();
  })();

  const handlePaletteSelect = (form: string) => {
    if (!selectedCell) return;
    updateCellValue(selectedCell, form);
    const keys = Object.keys(cells);
    const idx = keys.indexOf(selectedCell);
    const next = keys.slice(idx + 1).find(k => !cells[k].value);
    if (next) setSelectedCell(next);
  };

  const handleHint = () => {
    if (hintsLeft <= 0 || !selectedCell) return;
    const cell = cells[selectedCell];
    if (!cell) return;
    const correct = getCorrectForm(cell.lemmaId, cell.caseId);
    updateCellValue(selectedCell, correct);
    setHintsLeft(h => h - 1);
  };

  const handleCheck = () => {
    const newCells = { ...cells };
    let pts = 0;
    const incorrectKeys: string[] = [];
    const blankKeys: string[] = [];
    const editedKeys: string[] = [];

    for (const [key, cell] of Object.entries(newCells)) {
      const accepted = getAccepted(cell.lemmaId, cell.caseId);
      if (!cell.value) {
        newCells[key] = { ...cell, state: 'wrong' };
        blankKeys.push(`${cell.lemmaId}:${cell.caseId}:${getCorrectForm(cell.lemmaId, cell.caseId)}`);
      } else if (accepted.includes(cell.value)) {
        newCells[key] = { ...cell, state: 'correct' };
        pts += 10;
        if (cell.editCount >= 2) {
          editedKeys.push(`${cell.lemmaId}:${cell.caseId}:${cell.value}`);
        }
      } else {
        newCells[key] = { ...cell, state: 'wrong' };
        incorrectKeys.push(`${cell.lemmaId}:${cell.caseId}:${getCorrectForm(cell.lemmaId, cell.caseId)}`);
      }
    }

    setCells(newCells);
    setScore(pts);
    setIsChecked(true);

    const newQueue = enqueueFromGridResults(adaptiveQueue, incorrectKeys, blankKeys, editedKeys, unitId);
    setAdaptiveQueue(newQueue);

    const total = Object.keys(newCells).length;
    const correct = Object.values(newCells).filter(c => c.state === 'correct').length;
    const summary: SessionSummary = {
      id: Date.now().toString(),
      modeId: 'grid_challenge',
      unitId,
      topicId: topicId ?? undefined,
      score: pts,
      accuracy: total > 0 ? correct / total : 0,
      averageResponseMs: 0,
      totalQuestions: total,
      correctAnswers: correct,
      bestStreak: 0,
      weakForms: incorrectKeys,
      confusionPairsHit: [],
      completedAt: new Date().toISOString(),
      categories: [activeCategory],
    };
    addSessionSummary(summary);
    setPhase('complete');
  };

  const toggleCase = (caseId: CaseId) => {
    setSelectedCases(prev =>
      prev.includes(caseId) ? (prev.length > 1 ? prev.filter(c => c !== caseId) : prev) : [...prev, caseId]
    );
  };

  const toggleLemma = (lemmaId: string) => {
    setSelectedLemmaIds(prev =>
      prev.includes(lemmaId) ? (prev.length > 1 ? prev.filter(l => l !== lemmaId) : prev) : [...prev, lemmaId]
    );
  };

  const lemmaLabels = Object.fromEntries(currentLemmas.map(l => [l.lemmaId, l.lemmaDisplay]));

  if (phase === 'setup') {
    return (
      <div className="min-h-screen bg-page text-ink flex flex-col items-center justify-center px-4 gap-6">
        <div className="text-center space-y-2">
          <div className="text-6xl">🔲</div>
          <h1 className="text-3xl font-bold text-ink">Grid Challenge</h1>
          <p className="text-ink-secondary">Complete the declension grid from memory</p>
        </div>

        <div className="bg-surface rounded-2xl border border-border p-6 w-full max-w-lg space-y-5">
          {/* Category */}
          <div>
            <label className="text-ink-secondary text-sm font-semibold block mb-2">Word Category</label>
            <div className="flex gap-2">
              {allowedCategories.map(cat => {
                const info = CATEGORY_LABELS[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => handleCategoryChange(cat)}
                    className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors ${activeCategory === cat ? 'bg-teal-600 text-ink' : 'bg-surface-muted text-ink-secondary hover:bg-surface-muted'}`}
                  >
                    {info.icon} {info.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input Mode */}
          <div>
            <label className="text-ink-secondary text-sm font-semibold block mb-2">Input Method</label>
            <div className="flex gap-3">
              <button
                onClick={() => setInputMode('keyboard')}
                className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors ${inputMode === 'keyboard' ? 'bg-teal-600 text-ink' : 'bg-surface-muted text-ink-secondary hover:bg-surface-muted'}`}
              >
                ⌨️ Cyrillic Keyboard
              </button>
              <button
                onClick={() => setInputMode('palette')}
                className={`flex-1 py-2 rounded-xl font-semibold text-sm transition-colors ${inputMode === 'palette' ? 'bg-teal-600 text-ink' : 'bg-surface-muted text-ink-secondary hover:bg-surface-muted'}`}
              >
                🎯 Answer Palette
              </button>
            </div>
          </div>

          {/* Cases */}
          <div>
            <label className="text-ink-secondary text-sm font-semibold block mb-2">Cases to Include</label>
            <div className="flex flex-wrap gap-2">
              {caseOrder.map(caseId => {
                const meta = caseMetadata[caseId];
                const active = selectedCases.includes(caseId);
                return (
                  <button
                    key={caseId}
                    onClick={() => toggleCase(caseId)}
                    className="px-3 py-1 rounded-full text-sm font-semibold transition-all"
                    style={{
                      backgroundColor: active ? meta.color + '33' : '#1e293b',
                      color: active ? meta.color : '#64748b',
                      border: `1px solid ${active ? meta.color : '#334155'}`,
                    }}
                  >
                    {meta.icon} {meta.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Words */}
          <div>
            <label className="text-ink-secondary text-sm font-semibold block mb-2">Words to Include</label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
              {currentLemmas.map(lemma => {
                const active = selectedLemmaIds.includes(lemma.lemmaId);
                return (
                  <button
                    key={lemma.lemmaId}
                    onClick={() => toggleLemma(lemma.lemmaId)}
                    className={`px-3 py-1 rounded-full text-sm font-bold transition-all ${active ? 'bg-teal-700 text-ink border border-teal-400' : 'bg-surface-muted text-ink-secondary border border-border-strong'}`}
                  >
                    {lemma.lemmaDisplay}
                  </button>
                );
              })}
            </div>
          </div>

          <button
            onClick={handleStart}
            className="w-full py-3 bg-teal-600 hover:bg-teal-500 text-ink rounded-xl font-bold text-lg transition-colors"
          >
            Start Grid!
          </button>
        </div>
      </div>
    );
  }

  if (phase === 'complete') {
    const total = Object.keys(cells).length;
    const correct = Object.values(cells).filter(c => c.state === 'correct').length;
    return (
      <div className="min-h-screen bg-page flex flex-col items-center justify-center px-4 gap-6">
        <div className="text-center space-y-2">
          <div className="text-6xl">{correct === total ? '🏆' : '📊'}</div>
          <h1 className="text-3xl font-bold text-ink">Grid Complete!</h1>
        </div>
        <div className="bg-surface rounded-2xl border border-border p-8 w-full max-w-sm space-y-4">
          <div className="text-center">
            <p className="text-5xl font-bold text-teal-400">{score}</p>
            <p className="text-ink-secondary text-sm mt-1">Points</p>
          </div>
          <div className="grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-xl font-bold text-green-400">{correct}</p>
              <p className="text-ink-secondary text-xs">Correct</p>
            </div>
            <div>
              <p className="text-xl font-bold text-red-400">{total - correct}</p>
              <p className="text-ink-secondary text-xs">Incorrect</p>
            </div>
          </div>
          {total - correct > 0 && (
            <p className="text-ink-secondary text-sm text-center">Missed forms added to Practice queue!</p>
          )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => navigate('/home')} className="px-6 py-3 bg-surface-muted hover:bg-surface-muted text-ink rounded-xl font-semibold">Home</button>
          <button onClick={() => setPhase('setup')} className="px-6 py-3 bg-teal-600 hover:bg-teal-500 text-ink rounded-xl font-semibold">Try Again</button>
          <button onClick={() => navigate('/practice')} className="px-6 py-3 bg-green-700 hover:bg-green-600 text-white rounded-xl font-semibold">Practice Weak Forms</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page text-ink flex flex-col">
      <div className="bg-surface-elevated border-b border-border px-4 py-3 flex-shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/home')} className="text-ink-secondary hover:text-ink">✕</button>
            <span className="text-ink font-bold">🔲 Grid Challenge</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setInputMode(m => m === 'keyboard' ? 'palette' : 'keyboard')}
              className="px-3 py-1.5 rounded-lg bg-surface-muted hover:bg-surface-muted text-ink-secondary text-sm font-medium transition-colors"
            >
              {inputMode === 'keyboard' ? '⌨️ Keyboard' : '🎯 Palette'}
            </button>
            <button
              onClick={handleHint}
              disabled={hintsLeft <= 0 || !selectedCell}
              className="px-3 py-1.5 rounded-lg bg-yellow-800 hover:bg-yellow-700 disabled:opacity-40 text-yellow-200 text-sm font-medium transition-colors"
            >
              💡 {hintsLeft}
            </button>
            <button
              onClick={handleCheck}
              className="px-4 py-1.5 rounded-lg bg-teal-600 hover:bg-teal-500 text-ink text-sm font-bold transition-colors"
            >
              Check ✓
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        <div className="max-w-5xl mx-auto px-2 py-4">
          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="border-collapse w-full">
              <thead>
                <tr className="bg-surface">
                  <th className="px-3 py-2 text-left text-ink-secondary text-xs w-28">Case</th>
                  {selectedLemmaIds.map(lemmaId => (
                    <th key={lemmaId} className="px-2 py-2 text-center text-ink font-bold text-base w-20">
                      {lemmaLabels[lemmaId] ?? lemmaId}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {selectedCases.map((caseId, rowIdx) => {
                  const meta = caseMetadata[caseId];
                  return (
                    <tr key={caseId} className={rowIdx % 2 === 0 ? 'bg-surface-elevated' : 'bg-page'}>
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm">{meta.icon}</span>
                          <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                        </div>
                      </td>
                      {selectedLemmaIds.map(lemmaId => {
                        const key = cellKey(lemmaId, caseId);
                        const cell = cells[key];
                        const isSelected = selectedCell === key;
                        const correct = getCorrectForm(lemmaId, caseId);

                        const borderColor =
                          cell?.state === 'correct' ? '#22c55e' :
                          cell?.state === 'wrong' ? '#ef4444' :
                          isSelected ? meta.color :
                          '#334155';

                        const bgColor =
                          cell?.state === 'correct' ? '#14532d' :
                          cell?.state === 'wrong' ? '#450a0a' :
                          isSelected ? meta.color + '22' :
                          'transparent';

                        return (
                          <td key={lemmaId} className="px-1 py-1">
                            <div
                              onClick={() => handleCellClick(key)}
                              className="w-full min-h-[40px] rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all duration-150 text-sm font-bold relative"
                              style={{ borderColor, backgroundColor: bgColor }}
                            >
                              {cell?.state === 'wrong' && isChecked ? (
                                <div className="text-center">
                                  <div className="text-red-400 line-through text-xs">{cell.value || '—'}</div>
                                  <div className="text-green-400 text-sm">{correct}</div>
                                </div>
                              ) : (
                                <span style={{ color: cell?.state === 'correct' ? '#86efac' : '#e2e8f0' }}>
                                  {cell?.value || (isSelected ? '|' : '')}
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

          {selectedCell && !isChecked && (
            <div className="mt-4">
              {inputMode === 'keyboard' ? (
                <div className="bg-surface rounded-2xl border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-ink-secondary text-sm">
                      Typing: <span className="text-ink font-bold">{cells[selectedCell]?.value || '—'}</span>
                    </p>
                    <button
                      onClick={() => updateCellValue(selectedCell, '')}
                      className="text-ink-secondary hover:text-red-400 text-xs"
                    >
                      Clear
                    </button>
                  </div>
                  {CYRILLIC_ROWS.map((row, ri) => (
                    <div key={ri} className="flex justify-center gap-1 flex-wrap">
                      {row.map(char => (
                        <button
                          key={char}
                          onClick={() => handleKeyPress(char)}
                          className={`
                            rounded-lg font-bold transition-colors
                            ${char === '⌫'
                              ? 'px-4 py-2 bg-red-900 hover:bg-red-700 text-red-200 text-sm'
                              : 'w-9 h-9 bg-surface-muted hover:bg-slate-500 text-ink text-base'
                            }
                          `}
                        >
                          {char}
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-surface rounded-2xl border border-border p-4">
                  <p className="text-ink-secondary text-sm mb-3">Select answer:</p>
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto">
                    {paletteForms.map(form => {
                      const isCurrentValue = cells[selectedCell]?.value === form;
                      return (
                        <button
                          key={form}
                          onClick={() => handlePaletteSelect(form)}
                          className={`px-3 py-1.5 rounded-lg text-sm font-bold transition-colors ${
                            isCurrentValue
                              ? 'bg-teal-600 text-ink'
                              : 'bg-surface-muted hover:bg-surface-muted text-ink'
                          }`}
                        >
                          {form}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
