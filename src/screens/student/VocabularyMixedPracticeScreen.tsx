import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { fetchClassCurriculum, type ClassCurriculumRow } from '../../lib/curriculumApi';
import { describeRowLock } from '../../lib/studentNavigation';
import { getSubcategoryMeta } from '../../data/vocabulary/taxonomy';
import { VocabularyPractice } from '../../components/game/VocabularyPractice';
import { useGameStore } from '../../store/gameStore';
import { getUnitFromRow, isVocabularyCurriculumRow } from '../../lib/studentCurriculumDisplay';
import { parseVocabularyUnitConfig } from '../../lib/vocabulary/parseVocabularyUnitConfig';

export function VocabularyMixedPracticeScreen() {
  const { classId } = useParams<{ classId: string }>();
  const masteryRecords = useGameStore(s => s.masteryRecords);
  const addSessionSummary = useGameStore(s => s.addSessionSummary);
  const [params] = useSearchParams();
  const [rows, setRows] = useState<ClassCurriculumRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!classId) return;
    let cancelled = false;
    void (async () => {
      setLoading(true);
      const res = await fetchClassCurriculum(classId);
      if (cancelled) return;
      if (res.error) {
        setError(res.error);
        setRows([]);
      } else {
        const vocabRows = res.rows
          .filter(r => r.is_visible)
          .filter(isVocabularyCurriculumRow)
          .sort((a, b) => a.sort_order - b.sort_order);
        setRows(vocabRows);
        setError(null);
      }
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [classId]);

  const unlocked = useMemo(() => {
    return rows.filter(r => !describeRowLock(r, masteryRecords).locked);
  }, [rows, masteryRecords]);

  const available = useMemo(() => {
    return unlocked
      .map(row => {
        const unit = getUnitFromRow(row);
        if (!unit) return null;
        const cfg = parseVocabularyUnitConfig(unit.content_config);
        return {
          row,
          unit,
          setId: cfg.vocabularySetId,
          label: getSubcategoryMeta(cfg.vocabularySetId)?.label ?? unit.title,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v != null);
  }, [unlocked]);

  const requested = useMemo(
    () => params.get('sets')?.split(',').map(s => s.trim()).filter(Boolean) ?? [],
    [params],
  );

  const selected = useMemo(() => {
    if (requested.length === 0) return available;
    const allow = new Set(requested);
    return available.filter(v => allow.has(v.setId));
  }, [available, requested]);

  const selectedSetIds = selected.map(s => s.setId);
  const unitIdByDeck = Object.fromEntries(selected.map(s => [s.setId, s.row.unit_id]));
  const seedUnitId = selected[0]?.row.unit_id ?? unlocked[0]?.unit_id ?? null;

  if (!classId) return null;

  if (loading) {
    return (
      <div className="min-h-screen bg-page text-ink flex items-center justify-center">
        <p className="text-ink-secondary">Loading vocabulary set…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-page text-ink p-6">
        <div className="max-w-xl mx-auto rounded-xl border border-red-800 bg-red-950/50 text-red-200 text-sm px-4 py-3">
          Could not load vocabulary: {error}
        </div>
      </div>
    );
  }

  if (selectedSetIds.length === 0 || !seedUnitId) {
    return (
      <div className="min-h-screen bg-page text-ink p-6">
        <div className="max-w-xl mx-auto space-y-4">
          <p className="text-ink-secondary text-sm">
            No vocabulary subcategories are available for this mixed practice session.
          </p>
          <Link to={`/class/${classId}/vocabulary`} className="text-link underline text-sm">
            Back to vocabulary topics
          </Link>
        </div>
      </div>
    );
  }

  return (
    <VocabularyPractice
      unitRow={getUnitFromRow(selected[0].row)}
      unitId={seedUnitId}
      topicId={null}
      addSessionSummary={addSessionSummary}
      backPath={`/class/${classId}/vocabulary`}
      resultsPath={`/class/${classId}/unit/${seedUnitId}/results`}
      customDeckIds={selectedSetIds}
      unitIdByDeck={unitIdByDeck}
      customTitle={`Vocabulary — Practice mix (${selectedSetIds.length})`}
      customSessionLength={20}
      customDirection="ru-en"
    />
  );
}
